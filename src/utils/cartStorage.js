/**
 * Cart Storage Utility Module
 * Handles localStorage operations for shopping cart persistence
 */

// Storage configuration
const STORAGE_KEY = 'shopping_cart';
const SAVE_DEBOUNCE_DELAY = 300; // 300ms debounce delay

// Debounce timer reference
let saveTimer = null;

/**
 * Check if localStorage is available and accessible
 * @returns {boolean} True if localStorage is available, false otherwise
 */
function isAvailable() {
    try {
        if (typeof Storage === 'undefined' || !window.localStorage) {
            console.warn('localStorage is not supported in this browser');
            return false;
        }

        // Test localStorage availability
        const testKey = '__storage_test__';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);

        return true;
    } catch (error) {
        console.warn('localStorage is not available:', error.message);
        return false;
    }
}

/**
 * Save cart data to localStorage with timestamp
 * @param {Array} cartData - Array of cart items
 * @returns {boolean} Success status
 */
function saveCart(cartData) {
    // Validate input
    if (!Array.isArray(cartData)) {
        console.error('Invalid cart data: expected array, got', typeof cartData);
        return false;
    }

    // Check if localStorage is available
    if (!isAvailable()) {
        console.warn('Cannot save cart: localStorage not available');
        return false;
    }

    try {
        const dataToStore = {
            items: cartData,
            timestamp: Date.now(),
            version: '1.0'
        };

        const serializedData = JSON.stringify(dataToStore);
        localStorage.setItem(STORAGE_KEY, serializedData);

        return true;
    } catch (error) {
        if (error.name === 'QuotaExceededError') {
            console.error('Cannot save cart: localStorage quota exceeded');
            // Optionally clear old data or show user notification
            handleStorageQuotaExceeded();
        } else {
            console.error('Error saving cart to localStorage:', error);
        }
        return false;
    }
}

/**
 * Load cart data from localStorage
 * @returns {Array|null} Cart items array or null if no data/invalid data
 */
function loadCart() {
    // Check if localStorage is available
    if (!isAvailable()) {
        console.warn('Cannot load cart: localStorage not available');
        return null;
    }

    try {
        const storedData = localStorage.getItem(STORAGE_KEY);

        if (!storedData) {
            // No stored data found
            return null;
        }

        const parsedData = JSON.parse(storedData);

        // Validate data structure
        if (!parsedData || typeof parsedData !== 'object') {
            console.warn('Invalid cart data structure in localStorage');
            clearCart(); // Clear corrupted data
            return null;
        }

        // Check if data has required fields
        if (!Array.isArray(parsedData.items)) {
            console.warn('Cart data missing items array');
            clearCart(); // Clear corrupted data
            return null;
        }

        // Validate each item in the cart
        const validItems = parsedData.items.filter(item => {
            return item &&
                   typeof item === 'object' &&
                   typeof item.name === 'string' &&
                   typeof item.price === 'number' &&
                   item.price > 0 &&
                   typeof item.quantity === 'number' &&
                   item.quantity > 0 &&
                   typeof item.image === 'string';
        });

        if (validItems.length !== parsedData.items.length) {
            console.warn('Some cart items were invalid and filtered out');
        }

        return validItems;

    } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        // Clear corrupted data
        clearCart();
        return null;
    }
}

/**
 * Clear cart data from localStorage
 * @returns {boolean} Success status
 */
function clearCart() {
    // Check if localStorage is available
    if (!isAvailable()) {
        console.warn('Cannot clear cart: localStorage not available');
        return false;
    }

    try {
        localStorage.removeItem(STORAGE_KEY);
        return true;
    } catch (error) {
        console.error('Error clearing cart from localStorage:', error);
        return false;
    }
}

/**
 * Handle storage quota exceeded error
 * Attempts to clear old data or reduce cart size
 */
function handleStorageQuotaExceeded() {
    try {
        // Try to clear the cart data first
        clearCart();

        // If we still can't save, the storage might be full with other data
        // In a real application, you might want to show a user notification here
        console.warn('Storage quota exceeded. Cart data cleared to free up space.');

        // Optional: Show user notification
        if (typeof showToast === 'function') {
            showToast('Storage full. Cart data cleared to free up space.');
        }
    } catch (error) {
        console.error('Failed to handle storage quota exceeded:', error);
    }
}

/**
 * Debounced save function to prevent excessive localStorage writes
 * @param {Array} cartData - Cart data to save
 */
function debouncedSave(cartData) {
    if (saveTimer) {
        clearTimeout(saveTimer);
    }

    saveTimer = setTimeout(() => {
        saveCart(cartData);
    }, SAVE_DEBOUNCE_DELAY);
}

/**
 * Get storage info for debugging
 * @returns {Object} Storage information
 */
function getStorageInfo() {
    if (!isAvailable()) {
        return { available: false };
    }

    try {
        const storedData = localStorage.getItem(STORAGE_KEY);
        const dataSize = storedData ? new Blob([storedData]).size : 0;

        return {
            available: true,
            hasData: !!storedData,
            dataSize: `${dataSize} bytes`,
            key: STORAGE_KEY
        };
    } catch (error) {
        return {
            available: false,
            error: error.message
        };
    }
}

// Export functions for use in other modules
window.cartStorage = {
    saveCart,
    loadCart,
    clearCart,
    isAvailable,
    debouncedSave,
    getStorageInfo
};
