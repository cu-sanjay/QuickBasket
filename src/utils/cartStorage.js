// src/utils/cartStorage.js
(function () {
  "use strict";

  /** Primary key used by the app */
  const KEY_PRIMARY = "quickbasket_cart";
  /** Legacy keys we’ll try to migrate from (older experiments) */
  const LEGACY_KEYS = ["shopping_cart"];

  /** Debounce timer for saves */
  let timer = null;

  /** Schema version for what we store now */
  const VERSION = "2.0";

  /** Check localStorage availability */
  function isAvailable() {
    try {
      if (typeof window === "undefined" || !("localStorage" in window)) return false;
      const t = "__storage_test__";
      localStorage.setItem(t, "1");
      localStorage.removeItem(t);
      return true;
    } catch (_) {
      return false;
    }
  }

  /** Safe JSON parse */
  function tryParse(json) {
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  /** Normalize a single cart item; return null if invalid */
  function normalizeItem(item) {
    if (!item || typeof item !== "object") return null;

    const name = typeof item.name === "string" ? item.name.trim() : null;
    const image = typeof item.image === "string" ? item.image : "";
    const id = item.id ?? null;

    const priceNum = Number(item.price);
    const qtyNum = Number(item.quantity);

    if (!name || !Number.isFinite(priceNum) || !Number.isFinite(qtyNum)) return null;
    if (priceNum <= 0 || qtyNum <= 0) return null;

    return {
      id,
      name,
      image,
      price: Math.round(priceNum * 100) / 100, // 2-decimal safety
      quantity: Math.floor(qtyNum) // integers only
    };
  }

  /** Validate/clean an array of items */
  function sanitizeItems(arr) {
    if (!Array.isArray(arr)) return [];
    const cleaned = arr.map(normalizeItem).filter(Boolean);
    return cleaned;
  }

  /** Build the storage envelope we persist */
  function makeEnvelope(items) {
    return {
      type: "quickbasket-cart",
      version: VERSION,
      updatedAt: Date.now(),
      items
    };
  }

  /** Save cart (immediate) */
  function saveCart(cartItems) {
    if (!isAvailable()) return false;

    const items = sanitizeItems(cartItems);
    try {
      localStorage.setItem(KEY_PRIMARY, JSON.stringify(makeEnvelope(items)));
      return true;
    } catch (err) {
      // Handle quota politely
      if (err && (err.name === "QuotaExceededError" || err.code === 22)) {
        try {
          // last-ditch: clear and retry a minimal save (empty)
          localStorage.removeItem(KEY_PRIMARY);
          localStorage.setItem(KEY_PRIMARY, JSON.stringify(makeEnvelope([])));
        } catch (_) {}
      }
      return false;
    }
  }

  /** Save cart (debounced) */
  function debouncedSave(cartItems, delay = 250) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => saveCart(cartItems), delay);
  }

  /** Load cart and return just the items array */
  function loadCart() {
    if (!isAvailable()) return [];

    // Try primary first
    const raw = localStorage.getItem(KEY_PRIMARY);
    let env = tryParse(raw);

    // If not present or broken, try legacy keys and migrate
    if (!env || !env.items) {
      const migrated = migrateFromLegacy();
      if (migrated) env = tryParse(localStorage.getItem(KEY_PRIMARY));
    }

    if (!env || !Array.isArray(env.items)) return [];
    return sanitizeItems(env.items);
  }

  /** Clear cart storage */
  function clearCart() {
    if (!isAvailable()) return false;
    try {
      localStorage.removeItem(KEY_PRIMARY);
      return true;
    } catch {
      return false;
    }
  }

  /** Migrate from legacy keys if found; returns true if migrated */
  function migrateFromLegacy() {
    if (!isAvailable()) return false;

    for (const key of LEGACY_KEYS) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      const parsed = tryParse(raw);
      let items = [];

      // Legacy may be: { items: [...] } or raw array [...]
      if (Array.isArray(parsed)) {
        items = parsed;
      } else if (parsed && Array.isArray(parsed.items)) {
        items = parsed.items;
      }

      const cleaned = sanitizeItems(items);
      try {
        localStorage.setItem(KEY_PRIMARY, JSON.stringify(makeEnvelope(cleaned)));
        localStorage.removeItem(key);
        return true;
      } catch {
        // If migration write fails, leave legacy as-is
        return false;
      }
    }
    return false;
  }

  /** Info for debugging */
  function getStorageInfo() {
    if (!isAvailable()) return { available: false };
    const raw = localStorage.getItem(KEY_PRIMARY);
    const size = raw ? new Blob([raw]).size : 0;
    const env = tryParse(raw) || {};
    return {
      available: true,
      key: KEY_PRIMARY,
      version: env.version || null,
      items: Array.isArray(env.items) ? env.items.length : 0,
      bytes: size
    };
  }

  // Public API
  window.cartStorage = {
    isAvailable,
    saveCart,
    debouncedSave,
    loadCart,
    clearCart,
    getStorageInfo
  };
})();
