/* ==========================================
   QuickBasket – Main Client Script
   ========================================== */

// --- State ---
let cart = [];
let wishlist = [];
let cartCount = 0;
let appliedCoupon = null;

const coupons = {
  NEW50: { code: "NEW50", description: "Flat ₹50 off on all orders", type: "flat", value: 50, minOrder: 0 },
  SALE25: { code: "SALE25", description: "25% off on your order", type: "percentage", value: 25, minOrder: 0 },
  FESTIVEDAY: { code: "FESTIVEDAY", description: "₹100 off on orders above ₹299", type: "flat", value: 100, minOrder: 299 },
  MEGA40: { code: "MEGA40", description: "40% off on orders above ₹500", type: "percentage", value: 40, minOrder: 500 },
};

let productsData = null;
let currentCategory = "all";

/* ==========================================
   Cart Storage (via src/utils/cartStorage.js)
   ========================================== */

function initializeCart() {
  const savedCart = window.cartStorage ? window.cartStorage.loadCart() : null;
  if (savedCart && Array.isArray(savedCart) && savedCart.length > 0) {
    cart = savedCart;
    cartCount = cart.reduce((t, i) => t + i.quantity, 0);
    const badge = document.querySelector(".cart-item-count");
    if (badge) badge.textContent = cartCount;
  } else {
    cart = []; cartCount = 0;
  }
}

/* ==========================================
   Wishlist persistence (localStorage)
   ========================================== */
function initializeWishlist() {
  try {
    const saved = localStorage.getItem("quickbasket_wishlist");
    wishlist = saved ? JSON.parse(saved) : [];
    const el = document.querySelector(".wishlist-count");
    if (el) el.textContent = wishlist.length;
  } catch (err) {
    console.error("Wishlist load failed:", err);
    wishlist = [];
  }
}
function saveWishlist() {
  try { localStorage.setItem("quickbasket_wishlist", JSON.stringify(wishlist)); }
  catch (err) { console.error("Wishlist save failed:", err); }
}

/* ==========================================
   Products
   ========================================== */
async function loadProducts() {
  try {
    const response = await fetch("./products.json");
    productsData = await response.json();

    // Build lookup of all products by ID for wishlist/cart use
    productsData.allProducts = [
      ...(productsData.popularProducts || []),
      ...(productsData.deals || []),
    ];

    renderProducts();
    renderRecentlyViewed();
    updateWishlistDisplay();
  } catch (err) {
    console.error("Error loading products:", err);
    showErrorToast("Failed to load products. Please refresh the page.");
  }
}

function renderProducts() {
  if (!productsData) return;

  const category = (currentCategory || "all").toLowerCase();
  const byCategory = (p) =>
    category === "all" || (p.category || "").toLowerCase() === category;

  const popular = (productsData.popularProducts || []).filter(byCategory);
  const deals = (productsData.deals || []).filter(byCategory);

  renderProductSection("popularProducts", popular);
  renderProductSection("dealsProducts", deals);

  // Update headings to reflect active category
  try {
    const popularTitle = document.querySelector("h2.section-title#products");
    const dealsTitle = Array.from(document.querySelectorAll("h2.section-title"))
      .find((h) => h.textContent.trim().startsWith("Today's Best Deals"));

    const prettyCat =
      category === "all"
        ? ""
        : ` – ${category.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}`;
    if (popularTitle) popularTitle.textContent = `Popular Products${prettyCat}`;
    if (dealsTitle) dealsTitle.textContent = `Today's Best Deals${prettyCat}`;
  } catch (_) {}
}

function renderProductSection(containerId, products) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";
  products.forEach((p) => container.appendChild(createProductCard(p)));
}

function createProductCard(product) {
  const card = document.createElement("div");
  card.className = "product-card";

  const isInWishlist = wishlist.some((i) => i.id === product.id);
  const heartIcon = isInWishlist ? "fas fa-heart" : "far fa-heart";
  const btnActive = isInWishlist ? " active" : "";

  card.innerHTML = `
    <img src="${product.image}" alt="${product.name}" class="product-image">
    <div class="product-info">
      <h3 class="product-title">${product.name}</h3>
      <div class="product-price">₹${product.price} <span>(₹${product.discount} off)</span></div>
      <p>${product.description}</p>
      <div class="product-actions">
        <button class="add-to-cart" onclick="addToCart('${product.name}', ${product.price}, '${product.image}', ${product.id})">
          <i class="fas fa-plus"></i> Add to Cart
        </button>
        <button class="wishlist${btnActive}" onclick="toggleWishlist(${product.id}, event)">
          <i class="${heartIcon}"></i>
        </button>
      </div>
    </div>`;
  return card;
}

/* ==========================================
   Search
   ========================================== */
function initializeSearch() {
  const input = document.querySelector(".search-bar input");
  const button = document.querySelector(".search-bar button");
  if (!input) return;

  const perform = () => {
    const term = input.value.toLowerCase().trim();
    if (!productsData) return;
    if (term === "") { renderProducts(); return; }

    const cat = (currentCategory || "all").toLowerCase();
    const inCat = (p) => cat === "all" || (p.category || "").toLowerCase() === cat;
    const matches = (p) =>
      p.name.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term) ||
      (p.category || "").toLowerCase().includes(term);

    const filteredPopular = (productsData.popularProducts || []).filter((p) => inCat(p) && matches(p));
    const filteredDeals   = (productsData.deals || []).filter((p) => inCat(p) && matches(p));

    renderProductSection("popularProducts", filteredPopular);
    renderProductSection("dealsProducts", filteredDeals);

    if (filteredPopular.length + filteredDeals.length === 0) {
      const empty = '<p style="text-align: center; padding: 20px; color: #999;">No products found</p>';
      const pop = document.getElementById("popularProducts");
      const deal = document.getElementById("dealsProducts");
      if (pop) pop.innerHTML = empty;
      if (deal) deal.innerHTML = empty;
    }
  };

  input.addEventListener("input", perform);
  if (button) button.addEventListener("click", perform);
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") { e.preventDefault(); perform(); }
  });
}

/* ==========================================
   Recently viewed
   ========================================== */
function renderRecentlyViewed() {
  const container = document.getElementById("recentlyViewedProducts");
  if (!container) return;
  const recent = JSON.parse(localStorage.getItem("recentlyViewed") || "[]");
  if (recent.length === 0) {
    container.innerHTML = '<p class="no-products">No recently viewed products</p>';
    return;
  }
  container.innerHTML = "";
  recent.slice(0, 4).forEach((p) => container.appendChild(createProductCard(p)));
}

/* ==========================================
   Category filter + URL sync
   ========================================== */
function getCategoryFromURL() {
  try {
    const params = new URLSearchParams(window.location.search);
    return (params.get("category") || "all").toLowerCase();
  } catch { return "all"; }
}
function setCategoryInURL(cat) {
  const params = new URLSearchParams(window.location.search);
  if (!cat || cat === "all") params.delete("category"); else params.set("category", cat);
  const newUrl = `${window.location.pathname}?${params.toString()}`.replace(/\?$/, "");
  window.history.pushState({ category: cat || "all" }, "", newUrl);
}
function applyCategoryFromURL() {
  currentCategory = getCategoryFromURL();
  highlightActiveCategory(currentCategory);
  highlightActiveNav(currentCategory);
  renderProducts();
}
function highlightActiveCategory(cat) {
  document.querySelectorAll(".category-item").forEach((el) => {
    const c = (el.getAttribute("data-category") || "").toLowerCase();
    if ((cat === "all" && c === "all") || c === cat) el.classList.add("active"); else el.classList.remove("active");
  });
}
function highlightActiveNav(cat) {
  document.querySelectorAll('.nav-links a[data-category]').forEach((a) => {
    const c = (a.getAttribute("data-category") || "").toLowerCase();
    if ((cat === "all" && c === "all") || c === cat) a.classList.add("active"); else a.classList.remove("active");
  });
}
function initializeCategoryFiltering() {
  document.querySelectorAll(".category-item").forEach((el) => {
    el.addEventListener("click", () => {
      const cat = (el.getAttribute("data-category") || "all").toLowerCase();
      currentCategory = cat;
      setCategoryInURL(cat);
      highlightActiveCategory(cat);
      highlightActiveNav(cat);
      const sip = document.querySelector(".search-bar input");
      if (sip) sip.value = "";
      renderProducts();
      scrollToProducts();
    });
  });

  applyCategoryFromURL();
  window.addEventListener("popstate", applyCategoryFromURL);
}
function initializeNavFiltering() {
  document.querySelectorAll('.nav-links a[data-category]').forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const cat = (a.getAttribute("data-category") || "all").toLowerCase();
      currentCategory = cat;
      setCategoryInURL(cat);
      highlightActiveCategory(cat);
      highlightActiveNav(cat);
      const sip = document.querySelector(".search-bar input");
      if (sip) sip.value = "";
      renderProducts();
      scrollToProducts();
    });
  });
}

function scrollToProducts() {
  const anchor = document.getElementById("products");
  if (anchor && typeof anchor.scrollIntoView === "function") {
    anchor.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

/* ==========================================
   Pincode checker
   ========================================== */
function initializePincodeChecker() {
  const banner = document.getElementById("pincodeBanner");
  const changeBtn = document.getElementById("changePincodeBtn");
  const input = document.getElementById("pincodeInput");
  const checkBtn = document.getElementById("checkDeliveryBtn");

  if (banner) banner.addEventListener("click", openPincodeModal);
  if (changeBtn) changeBtn.addEventListener("click", (e) => { e.stopPropagation(); openPincodeModal(); });
  if (!input || !checkBtn) return;

  checkBtn.addEventListener("click", checkDelivery);

  input.addEventListener("input", (e) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 6) v = v.slice(0, 6);
    e.target.value = v;
    checkBtn.disabled = v.length !== 6;
    if (v.length < 6) hideDeliveryStatus();
  });
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && input.value.length === 6) checkDelivery();
  });
  input.addEventListener("paste", (e) => {
    e.preventDefault();
    const paste = (e.clipboardData || window.clipboardData).getData("text");
    const numbers = paste.replace(/\D/g, "").slice(0, 6);
    input.value = numbers;
    checkBtn.disabled = numbers.length !== 6;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function openPincodeModal() {
  const modal = document.getElementById("pincodeModal");
  const input = document.getElementById("pincodeInput");
  if (modal) {
    modal.classList.add("show");
    document.body.style.overflow = "hidden";
    setTimeout(() => input && input.focus(), 120);
  }
}
function closePincodeModal() {
  const modal = document.getElementById("pincodeModal");
  const input = document.getElementById("pincodeInput");
  if (modal) {
    modal.classList.remove("show");
    document.body.style.overflow = "";
    if (input) input.value = "";
    hideDeliveryStatus();
  }
}
function validatePincode(pin) {
  if (!pin || typeof pin !== "string") return false;
  const clean = pin.replace(/\D/g, "");
  if (clean.length !== 6) return false;
  const first = parseInt(clean.charAt(0), 10);
  return first >= 1 && first <= 8;
}
async function checkDelivery() {
  const input = document.getElementById("pincodeInput");
  const btn = document.getElementById("checkDeliveryBtn");
  if (!input) return;
  const pin = input.value.trim();

  if (!validatePincode(pin)) {
    showDeliveryStatus("error", "Please enter a valid 6-digit Indian pincode");
    return;
  }

  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="delivery-spinner"></span>Checking...'; }
  showDeliveryStatus("checking", "Checking delivery availability...");

  try {
    const info = await checkPincodeDelivery(pin);
    if (info.available) {
      showDeliveryStatus("available", `🎉 Great! We deliver to ${info.city}, ${info.state}.\nExpected delivery: ${info.deliveryTime}`);
      setTimeout(() => { savePincode(pin, info); closePincodeModal(); }, 1800);
    } else {
      showDeliveryStatus("not-available", `😔 Sorry, we don't deliver to this location.\n${info.reason || ""}`);
    }
  } catch (err) {
    console.error("Pincode check error:", err);
    showDeliveryStatus("error", "Something went wrong. Please try again.");
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-search"></i>Check'; }
  }
}
async function checkPincodeDelivery(pincode) {
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    const data = await res.json();
    if (!data || data[0].Status !== "Success" || !data[0].PostOffice) {
      return { city: null, state: null, available: false, reason: "Invalid or unsupported pincode" };
    }
    const office = data[0].PostOffice[0];
    return { city: office.District || office.Name, state: office.State, available: true, deliveryTime: "45-60 minutes" };
  } catch {
    return { city: null, state: null, available: false, reason: "Service temporarily unavailable" };
  }
}
function showDeliveryStatus(type, message) {
  const box = document.getElementById("deliveryStatus");
  if (!box) return;
  box.className = `delivery-status ${type}`;
  box.innerHTML = type === "checking" ? `<span class="delivery-spinner"></span>${message}` : message;
  box.style.display = "block";
}
function hideDeliveryStatus() {
  const box = document.getElementById("deliveryStatus");
  if (box) box.style.display = "none";
}
function savePincode(pincode, info) {
  try {
    const payload = { pincode, city: info.city, state: info.state, available: info.available, deliveryTime: info.deliveryTime, savedAt: Date.now() };
    sessionStorage.setItem("quickbasket_pincode", JSON.stringify(payload));
    updateDeliveryBanner(payload);
    showSuccessToast(`Delivery location set to ${info.city}, ${info.state}`);
  } catch (err) { console.error("Save pincode error:", err); }
}
function loadSavedPincode() {
  try {
    const raw = sessionStorage.getItem("quickbasket_pincode");
    if (!raw) return;
    const data = JSON.parse(raw);
    const fresh = Date.now() - data.savedAt < 24 * 60 * 60 * 1000;
    if (fresh && data.available) updateDeliveryBanner(data);
    else sessionStorage.removeItem("quickbasket_pincode");
  } catch (err) { console.error("Load pincode error:", err); }
}
function updateDeliveryBanner(data) {
  const text = document.getElementById("deliveryLocationText");
  const info = document.querySelector(".delivery-info");
  const change = document.getElementById("changePincodeBtn");
  if (!text || !data.available) return;

  text.textContent = `Delivering to ${data.city}, ${data.state} (${data.pincode})`;
  if (info) info.classList.add("has-location");

  if (change) {
    change.addEventListener("contextmenu", (e) => {
      e.preventDefault(); e.stopPropagation();
      if (confirm("Clear delivery location?")) clearSavedPincode();
    });
  }
}
function clearSavedPincode() {
  sessionStorage.removeItem("quickbasket_pincode");
  const text = document.getElementById("deliveryLocationText");
  const info = document.querySelector(".delivery-info");
  if (text) text.textContent = "Click to set delivery location";
  if (info) info.classList.remove("has-location");
  showSuccessToast("Delivery location cleared");
}

/* ==========================================
   Cart
   ========================================== */
function openCart() {
  document.getElementById("cartModal").style.display = "flex";
  document.getElementById("paymentSection").style.display = "none";
  document.getElementById("orderSuccess").style.display = "none";
  updateCartDisplay();
}
function closeCart() { document.getElementById("cartModal").style.display = "none"; }
function addToCart(name, price, image, id = null) {
  const found = cart.find((i) => i.name === name);
  if (found) found.quantity += 1; else cart.push({ id, name, price, image, quantity: 1 });

  cartCount = cart.reduce((t, i) => t + i.quantity, 0);
  const badge = document.querySelector(".cart-item-count"); if (badge) badge.textContent = cartCount;

  if (window.cartStorage?.debouncedSave) window.cartStorage.debouncedSave(cart);
  showSuccessToast(`${name} added to cart!`);
}
function updateCartDisplay() {
  const list = document.querySelector(".cart-items");
  const cartTotalEl = document.getElementById("cartTotal");
  const qrAmount = document.getElementById("qrAmount");

  list.innerHTML = "";
  let total = 0;

  if (cart.length === 0) {
    list.innerHTML = '<p style="text-align: center; padding: 20px;">Your cart is empty</p>';
  } else {
    cart.forEach((item) => {
      const itemTotal = item.price * item.quantity; total += itemTotal;
      const el = document.createElement("div");
      el.className = "cart-item";
      el.innerHTML = `
        <div class="cart-item-info">
          <img src="${item.image}" alt="${item.name}" class="cart-item-image">
          <div class="cart-item-details">
            <h4>${item.name}</h4>
            <div class="cart-item-price">₹${item.price} x ${item.quantity}</div>
          </div>
        </div>
        <div class="cart-item-actions">
          <button class="quantity-btn" onclick="changeQuantity('${item.name}', -1)">-</button>
          <span>${item.quantity}</span>
          <button class="quantity-btn" onclick="changeQuantity('${item.name}', 1)">+</button>
        </div>`;
      list.appendChild(el);
    });
  }

  // coupon
  let discount = 0;
  let finalTotal = total;
  if (appliedCoupon) {
    discount = appliedCoupon.type === "flat"
      ? appliedCoupon.value
      : Math.round((total * appliedCoupon.value) / 100);
    finalTotal = Math.max(0, total - discount);
  }

  if (appliedCoupon && discount > 0) {
    cartTotalEl.innerHTML = `
      <div>
        <div style="text-decoration: line-through; color: #999; font-size: 0.9rem;">₹${total}</div>
        <div style="color: var(--success);">₹${finalTotal} <span style="font-size: 0.8rem;">(₹${discount} off)</span></div>
      </div>`;
  } else {
    cartTotalEl.textContent = `₹${finalTotal}`;
  }

  if (qrAmount) qrAmount.textContent = `₹${finalTotal}`;
  const qrImg = document.querySelector(".qr-code img");
  if (qrImg) qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=QuickBasket-Payment-Total-₹${finalTotal}`;

  // header badge
  cartCount = cart.reduce((t, i) => t + i.quantity, 0);
  const badge = document.querySelector(".cart-item-count"); if (badge) badge.textContent = cartCount;
}
function changeQuantity(name, delta) {
  const item = cart.find((i) => i.name === name);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) cart = cart.filter((i) => i.name !== name);

  cartCount = cart.reduce((t, i) => t + i.quantity, 0);
  const badge = document.querySelector(".cart-item-count"); if (badge) badge.textContent = cartCount;

  if (window.cartStorage?.debouncedSave) window.cartStorage.debouncedSave(cart);
  updateCartDisplay();
}
function showPaymentSection() {
  if (cart.length === 0) { showToast("Your cart is empty!"); return; }
  document.getElementById("paymentSection").style.display = "block";
  displayAvailableCoupons();
}
function displayAvailableCoupons() {
  const list = document.getElementById("availableCoupons");
  if (!list) return;
  list.innerHTML = "";
  Object.values(coupons).forEach((c) => {
    const el = document.createElement("div");
    el.className = "coupon-item";
    el.innerHTML = `
      <div class="coupon-info">
        <div class="coupon-code">${c.code}</div>
        <div class="coupon-desc">${c.description}</div>
        ${c.minOrder > 0 ? `<div class="coupon-min">Min order: ₹${c.minOrder}</div>` : ""}
      </div>
      <button class="coupon-apply-btn" onclick="applyCouponFromList('${c.code}')">Apply</button>`;
    list.appendChild(el);
  });
}
function applyCoupon() {
  const input = document.querySelector(".coupon-input input");
  const code = (input.value || "").trim().toUpperCase();
  if (!code) { showCouponMessage("Please enter a coupon code", "error"); return; }
  if (!coupons[code]) { showCouponMessage("Invalid coupon code", "error"); return; }

  const c = coupons[code];
  const total = cart.reduce((t, i) => t + i.price * i.quantity, 0);
  if (total < c.minOrder) {
    showCouponMessage(`Coupon not eligible for current cart value. Minimum order: ₹${c.minOrder}`, "error");
    return;
  }
  appliedCoupon = c;
  input.value = "";
  updateCartDisplay();
  updateCouponUI();
  showCouponMessage(`Coupon ${code} applied successfully!`, "success");
}
function applyCouponFromList(code) {
  const c = coupons[code];
  const total = cart.reduce((t, i) => t + i.price * i.quantity, 0);
  if (total < c.minOrder) {
    showCouponMessage(`Coupon not eligible for current cart value. Minimum order: ₹${c.minOrder}`, "error");
    return;
  }
  appliedCoupon = c;
  updateCartDisplay();
  updateCouponUI();
  showCouponMessage(`Coupon ${code} applied successfully!`, "success");
}
function removeCoupon() {
  appliedCoupon = null;
  updateCartDisplay();
  updateCouponUI();
  showCouponMessage("Coupon removed", "success");
}
function updateCouponUI() {
  const box = document.getElementById("appliedCoupon");
  if (!box) return;
  if (appliedCoupon) {
    box.style.display = "block";
    box.innerHTML = `
      <div class="applied-coupon-info">
        <span class="applied-coupon-code">${appliedCoupon.code}</span>
        <span class="applied-coupon-desc">${appliedCoupon.description}</span>
      </div>
      <button class="remove-coupon-btn" onclick="removeCoupon()">Remove</button>`;
  } else {
    box.style.display = "none";
  }
}
function showCouponMessage(msg, type) {
  const el = document.getElementById("couponMessage");
  if (!el) return;
  el.textContent = msg;
  el.className = `coupon-message ${type}`;
  el.style.display = "block";
  setTimeout(() => { el.style.display = "none"; }, 3000);
}

function selectPayment(el) {
  document.querySelectorAll(".payment-option").forEach((o) => o.classList.remove("selected"));
  el.classList.add("selected");
}
function placeOrder() {
  const selected = document.querySelector(".payment-option.selected");
  if (!selected) { showToast("Please select a payment method"); return; }

  document.getElementById("paymentSection").style.display = "none";
  document.getElementById("orderSuccess").style.display = "block";

  setTimeout(() => {
    cart = []; cartCount = 0; appliedCoupon = null;
    const badge = document.querySelector(".cart-item-count"); if (badge) badge.textContent = cartCount;
    if (window.cartStorage?.clearCart) window.cartStorage.clearCart();
  }, 5000);
}

/* ==========================================
   Wishlist
   ========================================== */
function openWishlist() {
  document.getElementById("wishlistModal").style.display = "flex";
  updateWishlistDisplay();
}
function closeWishlist() { document.getElementById("wishlistModal").style.display = "none"; }
function toggleWishlist(productId, event) {
  if (event) event.stopPropagation();
  const idx = wishlist.findIndex((i) => i.id === productId);
  const btn = event?.currentTarget;
  const icon = btn?.querySelector("i");

  if (idx > -1) {
    wishlist.splice(idx, 1);
    if (icon) { icon.classList.remove("fas"); icon.classList.add("far"); }
    if (btn) btn.classList.remove("active");
    showToast("Removed from wishlist");
  } else {
    const product = productsData.allProducts.find((p) => p.id === productId);
    if (product) {
      wishlist.push(product);
      if (icon) { icon.classList.remove("far"); icon.classList.add("fas"); }
      if (btn) btn.classList.add("active");
      showToast("Added to wishlist");
    }
  }
  saveWishlist();
  updateWishlistDisplay();
}
function removeWishlistItem(id) {
  wishlist = wishlist.filter((i) => i.id !== id);
  saveWishlist();
  updateWishlistDisplay();
  showToast("Item removed from wishlist");
}
function moveAllToCart() {
  if (wishlist.length === 0) { showToast("Wishlist is empty!"); return; }
  wishlist.forEach((i) => addToCart(i.name, i.price, i.image, i.id));
  wishlist = [];
  saveWishlist();
  updateWishlistDisplay();
  closeWishlist();
  openCart();
  showToast("All items moved to cart!");
}
function updateWishlistDisplay() {
  const count = document.querySelector(".wishlist-count");
  const list = document.querySelector(".wishlist-items");
  if (count) count.textContent = wishlist.length;
  if (!list) return;

  list.innerHTML = "";
  if (wishlist.length === 0) {
    list.innerHTML = '<p style="text-align: center; padding: 20px;">Your wishlist is empty</p>';
  } else {
    wishlist.forEach((item) => {
      const detail = productsData?.allProducts.find((p) => p.id === item.id);
      const desc = detail ? detail.description : "Product details unavailable.";
      const el = document.createElement("div");
      el.className = "wishlist-item";
      el.innerHTML = `
        <div class="wishlist-item-info">
          <img src="${item.image}" alt="${item.name}" class="wishlist-item-image">
          <div class="wishlist-item-details">
            <h4>${item.name}</h4>
            <p class="wishlist-item-desc">${desc}</p>
            <div class="wishlist-item-price">₹${item.price}</div>
          </div>
        </div>
        <div class="wishlist-item-actions">
          <button class="btn-small" onclick="addToCart('${item.name}', ${item.price}, '${item.image}', ${item.id}); removeWishlistItem(${item.id})">
            <i class="fas fa-shopping-cart"></i> Move to Cart
          </button>
          <button class="btn-remove" onclick="removeWishlistItem(${item.id})"><i class="fas fa-times"></i></button>
        </div>`;
      list.appendChild(el);
    });
  }

  // re-render to reflect heart states
  renderProducts();
}

/* ==========================================
   Toasts
   ========================================== */
let toastTimeout;
function showToast(message, type = "success", duration = 4000) {
  const toast = document.getElementById("toast");
  const msg = document.getElementById("toastMessage");
  const icon = toast.querySelector("i");
  const bar = document.getElementById("toastProgressBar");

  clearTimeout(toastTimeout);
  toast.classList.remove("show", "hide", "success", "error", "warning", "info");
  bar.style.transform = "scaleX(1)";
  bar.style.transition = "none";

  msg.textContent = message;
  toast.classList.add(type);
  icon.className =
    type === "error" ? "fas fa-exclamation-circle" :
    type === "warning" ? "fas fa-exclamation-triangle" :
    type === "info" ? "fas fa-info-circle" : "fas fa-check-circle";

  setTimeout(() => {
    toast.classList.add("show");
    setTimeout(() => {
      bar.style.transition = `transform ${duration}ms linear`;
      bar.style.transform = "scaleX(0)";
    }, 80);
  }, 10);

  toastTimeout = setTimeout(hideToast, duration);
}
function hideToast() {
  const toast = document.getElementById("toast");
  const bar = document.getElementById("toastProgressBar");
  clearTimeout(toastTimeout);
  bar.style.transition = "none"; bar.style.transform = "scaleX(0)";
  toast.classList.add("hide"); toast.classList.remove("show");
  setTimeout(() => { toast.classList.remove("hide"); bar.style.transform = "scaleX(1)"; }, 400);
}
const showSuccessToast = (m, d=4000)=>showToast(m,"success",d);
const showErrorToast   = (m, d=5000)=>showToast(m,"error",d);
const showWarningToast = (m, d=4500)=>showToast(m,"warning",d);
const showInfoToast    = (m, d=4000)=>showToast(m,"info",d);

/* ==========================================
   User modal & theme
   ========================================== */
function openUserModal() { document.getElementById("userModal").style.display = "flex"; }
function switchTab(tabName) {
  document.querySelectorAll(".user-form").forEach((f) => f.classList.remove("active"));
  document.querySelectorAll(".user-tab").forEach((t) => t.classList.remove("active"));
  if (tabName === "login") {
    document.getElementById("loginForm").classList.add("active");
    document.querySelectorAll(".user-tab")[0].classList.add("active");
  } else {
    document.getElementById("signupForm").classList.add("active");
    document.querySelectorAll(".user-tab")[1].classList.add("active");
  }
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute("data-theme");
  setTheme(cur === "dark" ? "light" : "dark");
}
function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  const btn = document.querySelector(".theme-toggle-nav");
  if (btn) { btn.style.transform = "scale(0.9)"; setTimeout(() => (btn.style.transform = "scale(1)"), 150); }
}
function initializeTheme() {
  const saved = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  setTheme(saved || (prefersDark ? "dark" : "light"));
}
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
  if (!localStorage.getItem("theme")) setTheme(e.matches ? "dark" : "light");
});

/* ==========================================
   Mobile nav (hamburger for #siteNav)
   ========================================== */
(function initHamburger(){
  const btn = document.querySelector(".nav-toggle") || document.querySelector(".menu-toggle");
  const nav = document.getElementById("siteNav");
  if (!btn || !nav) return;

  let backdrop = null;
  const setOpen = (state) => {
    document.body.classList.toggle("menu-open", state);
    btn.setAttribute("aria-expanded", String(state));
    if (state && !backdrop) {
      backdrop = document.createElement("div");
      backdrop.className = "nav-backdrop";
      backdrop.addEventListener("click", () => setOpen(false));
      document.body.appendChild(backdrop);
    }
    if (!state && backdrop) { backdrop.remove(); backdrop = null; }
  };

  btn.addEventListener("click", () => setOpen(!document.body.classList.contains("menu-open")));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && document.body.classList.contains("menu-open")) setOpen(false); });
  window.addEventListener("resize", () => { if (innerWidth > 768 && document.body.classList.contains("menu-open")) setOpen(false); });

  nav.querySelectorAll('a[data-category]').forEach((a)=>{
    a.addEventListener('click', (e)=>{
      e.preventDefault();
      const cat = (a.getAttribute('data-category') || 'all').toLowerCase();
      currentCategory = cat;
      setCategoryInURL(cat);
      highlightActiveCategory(cat);
      highlightActiveNav(cat);
      const sip = document.querySelector('.search-bar input');
      if (sip) sip.value = '';
      renderProducts();
      setOpen(false);
      scrollToProducts();
    });
  });
})();

/* ==========================================
   Global listeners & init
   ========================================== */
window.onclick = function (event) {
  const cartModal = document.getElementById("cartModal");
  const userModal = document.getElementById("userModal");
  const wishlistModal = document.getElementById("wishlistModal");
  if (event.target === cartModal) closeCart();
  if (event.target === userModal) userModal.style.display = "none";
  if (event.target === wishlistModal) closeWishlist();
};

document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  initializeCart();
  initializeWishlist();
  initializeSearch();
  initializePincodeChecker();
  loadSavedPincode();
  initializeCategoryFiltering();
  initializeNavFiltering();

  // forms
  const login = document.getElementById("loginForm");
  login?.addEventListener("submit", (e) => {
    e.preventDefault(); showSuccessToast("Login successful!"); document.getElementById("userModal").style.display = "none";
  });
  const signup = document.getElementById("signupForm");
  signup?.addEventListener("submit", (e) => {
    e.preventDefault(); showSuccessToast("Account created successfully!"); document.getElementById("userModal").style.display = "none";
  });

  initializeTheme();
});
