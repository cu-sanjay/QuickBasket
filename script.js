import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js';

const firebaseConfig = {
  apiKey: "AIzaSyDY3U9hO51ZY6f2RLcdQoxPuJTjQn1lZB8",
  authDomain: "quickbasket-dev.firebaseapp.com",
  projectId: "quickbasket-dev",
  storageBucket: "quickbasket-dev.firebasestorage.app",
  messagingSenderId: "529752486191",
  appId: "1:529752486191:web:c1b1a04990f159edfff1da",
  measurementId: "G-B1HHD54R2D"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const analytics = getAnalytics(app);

window.firebaseAuth = auth;
window.googleProvider = provider;
window.signInWithPopup = signInWithPopup;
window.signOut = signOut;
window.onAuthStateChanged = onAuthStateChanged;
window.createUserWithEmailAndPassword = createUserWithEmailAndPassword;
window.signInWithEmailAndPassword = signInWithEmailAndPassword;
window.updateProfile = updateProfile;

onAuthStateChanged(auth, (user) => {
  if (user) {
    updateUIForSignedInUser(user);
  } else {
    updateUIForSignedOutUser();
  }
});

function updateUIForSignedInUser(user) {
  const loginView = document.getElementById('loginView');
  const profileView = document.getElementById('userProfileView');
  const accountText = document.getElementById('accountText');
  const userAvatar = document.getElementById('userAvatar');
  
  if (loginView) loginView.style.display = 'none';
  if (profileView) profileView.style.display = 'block';
  
  if (userAvatar) {
    if (user.photoURL) {
      userAvatar.src = user.photoURL;
      userAvatar.onerror = function() {
        this.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.displayName || 'User') + '&background=0D8ABC&color=fff&size=100';
      };
    } else {
      userAvatar.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.displayName || user.email) + '&background=0D8ABC&color=fff&size=100';
    }
  }
  
  document.getElementById('userName').textContent = user.displayName || 'User';
  document.getElementById('userEmail').textContent = user.email;
  
  if (accountText) {
    accountText.textContent = user.displayName?.split(' ')[0] || 'Account';
  }
}

function updateUIForSignedOutUser() {
  const loginView = document.getElementById('loginView');
  const profileView = document.getElementById('userProfileView');
  const accountText = document.getElementById('accountText');
  
  if (loginView) loginView.style.display = 'block';
  if (profileView) profileView.style.display = 'none';
  
  if (accountText) {
    accountText.textContent = 'Account';
  }
}

// Google Sign-In button click handler
document.getElementById('googleSignInBtn').addEventListener('click', async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    if (window.showSuccessToast) {
      window.showSuccessToast(`Welcome, ${user.displayName}!`);
    }
    
    setTimeout(() => {
      document.getElementById('userModal').style.display = 'none';
    }, 1000);
  } catch (error) {
    console.error('Error signing in with Google:', error);
    if (window.showErrorToast) {
      window.showErrorToast('Failed to sign in. Please try again.');
    }
  }
});

// Sign out button
document.getElementById('signOutBtn').addEventListener('click', async () => {
  try {
    await signOut(auth);
    showSuccessToast('Signed out successfully');
    document.getElementById('userModal').style.display = 'none';
  } catch (error) {
    console.error('Error signing out:', error);
    showErrorToast('Failed to sign out. Please try again.');
  }
});

function validatePassword(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const errors = [];
  
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  if (!hasUpperCase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!hasLowerCase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!hasNumber) {
    errors.push('Password must contain at least one number');
  }
  if (!hasSpecialChar) {
    errors.push('Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)');
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

function displayPasswordStrength(password) {
  const validation = validatePassword(password);
  const passwordInput = document.getElementById('signupPassword');
  
  let existingHint = document.querySelector('.password-strength-hint');
  if (!existingHint) {
    existingHint = document.createElement('div');
    existingHint.className = 'password-strength-hint';
    passwordInput.parentNode.appendChild(existingHint);
  }

  if (!password) {
    existingHint.innerHTML = '';
    existingHint.style.display = 'none';
    return;
  }

  existingHint.style.display = 'block';
  
  if (validation.isValid) {
    existingHint.innerHTML = '<span style="color: var(--success);"><i class="fas fa-check-circle"></i> Strong password!</span>';
  } else {
    existingHint.innerHTML = '<ul style="margin: 5px 0; padding-left: 20px; font-size: 0.85rem; color: var(--danger);">' + 
      validation.errors.map(err => `<li>${err}</li>`).join('') + 
      '</ul>';
  }
}

// Cart and Wishlist functionality
let cart = [];
let wishlist = []; // Initializing the wishlist array
let cartCount = 0;
let wishlistCount = 0;
let appliedCoupon = null;

// Predefined coupons
const coupons = {
  NEW50: {
    code: "NEW50",
    description: "Flat ₹50 off on all orders",
    type: "flat",
    value: 50,
    minOrder: 0,
  },
  SALE25: {
    code: "SALE25",
    description: "25% off on your order",
    type: "percentage",
    value: 25,
    minOrder: 0,
  },
  FESTIVEDAY: {
    code: "FESTIVEDAY",
    description: "₹100 off on orders above ₹299",
    type: "flat",
    value: 100,
    minOrder: 299,
  },
  MEGA40: {
    code: "MEGA40",
    description: "40% off on orders above ₹500",
    type: "percentage",
    value: 40,
    minOrder: 500,
  },
};

let productsData = null;
let currentCategory = "all"; // active category filter from URL or clicks

// Initialize cart from localStorage on startup
function initializeCart() {
  const savedCart = window.cartStorage ? window.cartStorage.loadCart() : null;

  if (savedCart && Array.isArray(savedCart) && savedCart.length > 0) {
    cart = savedCart;
    cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    const cartCountElement = document.querySelector(".cart-item-count");
    if (cartCountElement) {
      cartCountElement.textContent = cartCount;
    }
    console.log(`Loaded ${cart.length} items from localStorage`);
  } else {
    cart = [];
    cartCount = 0;
  }
}

// Initialize wishlist from localStorage on startup
function initializeWishlist() {
  try {
    const savedWishlist = localStorage.getItem("quickbasket_wishlist");
    if (savedWishlist) {
      wishlist = JSON.parse(savedWishlist);
      wishlistCount = wishlist.length;
      const wishlistCountElement = document.querySelector(".wishlist-count");
      if (wishlistCountElement) {
        wishlistCountElement.textContent = wishlistCount;
      }
      console.log(`Loaded ${wishlist.length} items from wishlist`);
    }
  } catch (error) {
    console.error("Error loading wishlist from localStorage:", error);
    wishlist = [];
    wishlistCount = 0;
  }
}

// Save wishlist to localStorage
function saveWishlist() {
  try {
    localStorage.setItem("quickbasket_wishlist", JSON.stringify(wishlist));
  } catch (error) {
    console.error("Error saving wishlist to localStorage:", error);
  }
}

// Load products from JSON
async function loadProducts() {
  try {
    const response = await fetch("./products.json");
    productsData = await response.json();
    // Combine all products for easy lookup by ID
    productsData.allProducts = [
      ...(productsData.popularProducts || []),
      ...(productsData.deals || []),
    ];
    renderProducts();
    renderRecentlyViewed(); // Initialize recently viewed section
    updateWishlistDisplay(); // Call to initialize the count
  } catch (error) {
    console.error("Error loading products:", error);
    showErrorToast("Failed to load products. Please refresh the page.");
  }
}

// Sort products based on selected criteria
function sortProducts(products, sortType) {
  if (!products || !Array.isArray(products)) return products;
  
  const sortedProducts = [...products]; // Create a copy to avoid mutating original
  
  switch (sortType) {
    case 'rating-high':
      return sortedProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    case 'rating-low':
      return sortedProducts.sort((a, b) => (a.rating || 0) - (b.rating || 0));
    case 'price-high':
      return sortedProducts.sort((a, b) => (b.price || 0) - (a.price || 0));
    case 'price-low':
      return sortedProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
    case 'name-asc':
      return sortedProducts.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    case 'name-desc':
      return sortedProducts.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    default:
      return sortedProducts;
  }
}

// Render products dynamically
function renderProducts() {
  if (!productsData) return;

  const category = (currentCategory || "all").toLowerCase();
  const sortType = document.getElementById('sortOption')?.value || 'default';

  // Filter helpers
  const byCategory = (p) =>
    category === "all" || (p.category || "").toLowerCase() === category;

  let popular = (productsData.popularProducts || []).filter(byCategory);
  let deals = (productsData.deals || []).filter(byCategory);

  // Apply sorting
  popular = sortProducts(popular, sortType);
  deals = sortProducts(deals, sortType);

  renderProductSection("popularProducts", popular);
  renderProductSection("dealsProducts", deals);

  // Update headings to reflect active category
  try {
    const popularTitle = document.querySelector("h2.section-title#products");
    const dealsTitle = Array.from(
      document.querySelectorAll("h2.section-title")
    ).find((h) => h.textContent.trim().startsWith("Today's Best Deals"));

    const prettyCat =
      category === "all"
        ? ""
        : ` – ${category
            .replace("-", " ")
            .replace(/\b\w/g, (c) => c.toUpperCase())}`;
    if (popularTitle) popularTitle.textContent = `Popular Products${prettyCat}`;
    if (dealsTitle) dealsTitle.textContent = `Today's Best Deals${prettyCat}`;
  } catch (_) {
    // non-fatal UI update
  }
}

// Render a specific product section
function renderProductSection(containerId, products) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  products.forEach((product) => {
    const productCard = createProductCard(product);
    container.appendChild(productCard);
  });
}

// Category filter initialization and URL helpers
function getCategoryFromURL() {
  try {
    const params = new URLSearchParams(window.location.search);
    const cat = (params.get("category") || "all").toLowerCase();
    return cat;
  } catch (_) {
    return "all";
  }
}

function setCategoryInURL(cat) {
  const params = new URLSearchParams(window.location.search);
  if (!cat || cat === "all") {
    params.delete("category");
  } else {
    params.set("category", cat);
  }
  const newUrl = `${window.location.pathname}?${params.toString()}`.replace(
    /\?$/,
    ""
  );
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
    if ((cat === "all" && c === "all") || c === cat) {
      el.classList.add("active");
    } else {
      el.classList.remove("active");
    }
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
      // Optional: clear search when category changes
      const searchInput = document.querySelector(".search-bar input");
      if (searchInput) searchInput.value = "";
      renderProducts();
      scrollToProducts();
    });
  });

  // Apply initial category from URL
  applyCategoryFromURL();

  // Handle back/forward navigation
  window.addEventListener("popstate", () => {
    applyCategoryFromURL();
  });
}

function highlightActiveNav(cat) {
  document.querySelectorAll(".nav-links a[data-category]").forEach((a) => {
    const c = (a.getAttribute("data-category") || "").toLowerCase();
    if ((cat === "all" && c === "all") || c === cat) {
      a.classList.add("active");
    } else {
      a.classList.remove("active");
    }
  });
}

function initializeNavFiltering() {
  document.querySelectorAll(".nav-links a[data-category]").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const cat = (a.getAttribute("data-category") || "all").toLowerCase();
      currentCategory = cat;
      setCategoryInURL(cat);
      highlightActiveCategory(cat);
      highlightActiveNav(cat);
      const searchInput = document.querySelector(".search-bar input");
      if (searchInput) searchInput.value = "";
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

// Render recently viewed products
function renderRecentlyViewed() {
  const container = document.getElementById("recentlyViewedProducts");
  if (!container) return;

  const recentlyViewed = JSON.parse(
    localStorage.getItem("recentlyViewed") || "[]"
  );

  if (recentlyViewed.length === 0) {
    container.innerHTML =
      '<p style="text-align: center; padding: 20px; color: #999;">No recently viewed products</p>';
    return;
  }

  container.innerHTML = "";
  recentlyViewed.slice(0, 4).forEach((product) => {
    const productCard = createProductCard(product);
    container.appendChild(productCard);
  });
}

// Generate star rating display
function generateStars(rating) {
  if (!rating || rating < 1 || rating > 5) return '';
  
  let stars = '';
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  for (let i = 1; i <= 5; i++) {
    if (i <= fullStars) {
      stars += '<i class="fas fa-star"></i>';
    } else if (i === fullStars + 1 && hasHalfStar) {
      stars += '<i class="fas fa-star-half-alt"></i>';
    } else {
      stars += '<i class="far fa-star"></i>';
    }
  }
  
  return stars;
}

// Create product card element
function createProductCard(product) {
  const productCard = document.createElement("div");
  productCard.className = "product-card";

  // Check if the product is in the wishlist to set the correct icon
  const isInWishlist = wishlist.some((item) => item.id === product.id);
  const heartIconClass = isInWishlist ? "fas fa-heart active" : "far fa-heart";

  productCard.innerHTML = `
        <img src="${product.image}" alt="${product.name}" class="product-image skeleton" onload="this.classList.remove('skeleton')" onerror="this.classList.remove('skeleton')">
        <div class="product-info">
            <h3 class="product-title">${product.name}</h3>
            <div class="product-price">₹${product.price} <span>(₹${product.discount} off)</span></div>
            <div class="product-rating">
                <div class="stars">${generateStars(product.rating)}</div>
                <span class="rating-value">${product.rating || 'N/A'}</span>
            </div>
            <p>${product.description}</p>
            <div class="product-actions">
                <button class="add-to-cart" onclick="addToCart('${product.name}', ${product.price}, '${product.image}', ${product.id})">
                    <i class="fas fa-plus"></i> Add to Cart
                </button>
                <button class="wishlist" onclick="toggleWishlist(${product.id}, event)">
                    <i class="${heartIconClass}"></i>
                </button>
            </div>
        </div>
    `;

  return productCard;
}

// Search functionality
function initializeSearch() {
  const searchInput = document.querySelector(".search-bar input");
  const searchButton = document.querySelector(".search-bar button");

  if (!searchInput) return;

  function performSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();

    if (!productsData) return;

    // When search term is empty, render by current category
    if (searchTerm === "") {
      renderProducts();
      return;
    }

    const category = (currentCategory || "all").toLowerCase();
    const inCategory = (p) =>
      category === "all" || (p.category || "").toLowerCase() === category;

    const matches = (p) =>
      p.name.toLowerCase().includes(searchTerm) ||
      p.description.toLowerCase().includes(searchTerm) ||
      (p.category || "").toLowerCase().includes(searchTerm);

    const filteredPopular = (productsData.popularProducts || []).filter(
      (p) => inCategory(p) && matches(p)
    );
    const filteredDeals = (productsData.deals || []).filter(
      (p) => inCategory(p) && matches(p)
    );

    renderProductSection("popularProducts", filteredPopular);
    renderProductSection("dealsProducts", filteredDeals);

    const totalResults = filteredPopular.length + filteredDeals.length;
    if (totalResults === 0) {
      const popularContainer = document.getElementById("popularProducts");
      const dealsContainer = document.getElementById("dealsProducts");
      if (popularContainer) {
        popularContainer.innerHTML =
          '<p style="text-align: center; padding: 20px; color: #999;">No products found</p>';
      }
      if (dealsContainer) {
        dealsContainer.innerHTML =
          '<p style="text-align: center; padding: 20px; color: #999;">No products found</p>';
      }
    }
  }

  searchInput.addEventListener("input", performSearch);
  searchButton.addEventListener("click", performSearch);
  searchInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      performSearch();
    }
  });
}

// Initialize sorting functionality
function initializeSorting() {
  const sortDropdown = document.getElementById('sortOption');
  if (sortDropdown) {
    sortDropdown.addEventListener('change', function() {
      renderProducts();
    });
  }
}

// Initialize products and cart when page loads
document.addEventListener("DOMContentLoaded", function () {
  loadProducts();
  initializeCart();
  initializeWishlist();
  initializeSearch();
  initializePincodeChecker();
  loadSavedPincode();
  initializeCategoryFiltering();
  initializeNavFiltering();
  initializeSorting();
});

// --- Pincode Delivery Functions ---

/**
 * Initialize pincode checker functionality
 */
function initializePincodeChecker() {
  const banner = document.getElementById("pincodeBanner");
  const changePincodeBtn = document.getElementById("changePincodeBtn");
  const pincodeInput = document.getElementById("pincodeInput");
  const checkBtn = document.getElementById("checkDeliveryBtn");

  // Banner click to open modal
  if (banner) {
    banner.addEventListener("click", openPincodeModal);
  }

  // Change pincode button
  if (changePincodeBtn) {
    changePincodeBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      openPincodeModal();
    });
  }

  if (!pincodeInput || !checkBtn) return;

  // Add click event listener to check button
  checkBtn.addEventListener("click", checkDelivery);

  // Add input validation and formatting
  pincodeInput.addEventListener("input", function (e) {
    // Allow only numbers
    let value = e.target.value.replace(/\D/g, "");

    // Limit to 6 digits
    if (value.length > 6) {
      value = value.substring(0, 6);
    }

    e.target.value = value;

    // Enable/disable check button
    checkBtn.disabled = value.length !== 6;

    // Clear previous status when input changes
    if (value.length < 6) {
      hideDeliveryStatus();
    }
  });

  // Add enter key support
  pincodeInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter" && pincodeInput.value.length === 6) {
      checkDelivery();
    }
  });

  // Add paste event handling
  pincodeInput.addEventListener("paste", function (e) {
    e.preventDefault();
    const paste = (e.clipboardData || window.clipboardData).getData("text");
    const numbers = paste.replace(/\D/g, "").substring(0, 6);
    pincodeInput.value = numbers;
    checkBtn.disabled = numbers.length !== 6;

    // Trigger input event to update button state
    const inputEvent = new Event("input", { bubbles: true });
    pincodeInput.dispatchEvent(inputEvent);
  });
}

/**
 * Open pincode modal
 */
function openPincodeModal() {
  const modal = document.getElementById("pincodeModal");
  const pincodeInput = document.getElementById("pincodeInput");

  if (modal) {
    modal.classList.add("show");
    document.body.style.overflow = "hidden";

    // Focus on input after animation
    setTimeout(() => {
      if (pincodeInput) {
        pincodeInput.focus();
      }
    }, 100);
  }
}

/**
 * Close pincode modal
 */
function closePincodeModal() {
  const modal = document.getElementById("pincodeModal");
  const pincodeInput = document.getElementById("pincodeInput");

  if (modal) {
    modal.classList.remove("show");
    document.body.style.overflow = "";

    // Clear input and status
    if (pincodeInput) {
      pincodeInput.value = "";
    }
    hideDeliveryStatus();
  }
}

/**
 * Validate Indian pincode format
 * @param {string} pincode - 6 digit pincode
 * @returns {boolean} - true if valid format
 */
function validatePincode(pincode) {
  if (!pincode || typeof pincode !== "string") {
    return false;
  }

  // Remove any spaces or special characters
  const cleanPincode = pincode.replace(/\D/g, "");

  // Check if it's exactly 6 digits
  if (cleanPincode.length !== 6) {
    return false;
  }

  // Indian pincodes start from 1 and go up to 8 (first digit)
  const firstDigit = parseInt(cleanPincode.charAt(0));
  if (firstDigit < 1 || firstDigit > 8) {
    return false;
  }

  return true;
}

/**
 * Check delivery availability for given pincode
 */
async function checkDelivery() {
  const pincodeInput = document.getElementById("pincodeInput");
  const checkBtn = document.getElementById("checkDeliveryBtn");

  if (!pincodeInput) {
    console.error("Pincode input element not found");
    return;
  }

  const pincode = pincodeInput.value.trim();

  if (!validatePincode(pincode)) {
    showDeliveryStatus("error", "Please enter a valid 6-digit Indian pincode");
    return;
  }

  if (checkBtn) {
    checkBtn.disabled = true;
    checkBtn.innerHTML = '<span class="delivery-spinner"></span>Checking...';
  }
  showDeliveryStatus("checking", "Checking delivery availability...");

  try {
    const deliveryInfo = await checkPincodeDelivery(pincode);

    if (deliveryInfo.available) {
      showDeliveryStatus(
        "available",
        `🎉 Great! We deliver to ${deliveryInfo.city}, ${deliveryInfo.state}.\nExpected delivery: ${deliveryInfo.deliveryTime}`
      );
      setTimeout(() => {
        savePincode(pincode, deliveryInfo);
        closePincodeModal();
      }, 2000);
    } else {
      showDeliveryStatus(
        "not-available",
        `😔 Sorry, we don't deliver to this location.\n${
          deliveryInfo.reason || ""
        }`
      );
    }
  } catch (error) {
    console.error("Error checking delivery:", error);
    showDeliveryStatus("error", "Something went wrong. Please try again.");
  } finally {
    if (checkBtn) {
      checkBtn.disabled = false;
      checkBtn.innerHTML = '<i class="fas fa-search"></i>Check';
    }
  }
}

/**
 * Check if delivery is available for a specific pincode using Postal Pincode API
 * @param {string} pincode - 6 digit pincode
 * @returns {Promise<object>} - delivery information
 */
async function checkPincodeDelivery(pincode) {
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    const data = await res.json();

    if (!data || data[0].Status !== "Success" || !data[0].PostOffice) {
      return {
        city: null,
        state: null,
        available: false,
        reason: "Invalid or unsupported pincode",
      };
    }

    // Take the top result (first PostOffice)
    const office = data[0].PostOffice[0];

    return {
      city: office.District || office.Name,
      state: office.State,
      available: true, // all pincodes are serviceable
      deliveryTime: "45-60 minutes",
    };
  } catch (err) {
    console.error("Error fetching pincode:", err);
    return {
      city: null,
      state: null,
      available: false,
      reason: "Service temporarily unavailable",
    };
  }
}

/**
 * Show delivery status message
 * @param {string} type - Status type (available, not-available, checking, error)
 * @param {string} message - Status message
 */
function showDeliveryStatus(type, message) {
  const statusDiv = document.getElementById("deliveryStatus");
  if (!statusDiv) return;

  statusDiv.className = `delivery-status ${type}`;

  if (type === "checking") {
    statusDiv.innerHTML = `<span class="delivery-spinner"></span>${message}`;
  } else {
    statusDiv.textContent = message;
  }

  statusDiv.style.display = "block";
}

/**
 * Hide delivery status
 */
function hideDeliveryStatus() {
  const statusDiv = document.getElementById("deliveryStatus");
  if (statusDiv) {
    statusDiv.style.display = "none";
  }
}

/**
 * Save selected pincode to sessionStorage
 * @param {string} pincode - Selected pincode
 * @param {object} deliveryInfo - Delivery information
 */
function savePincode(pincode, deliveryInfo) {
  try {
    const pincodeData = {
      pincode: pincode,
      city: deliveryInfo.city,
      state: deliveryInfo.state,
      available: deliveryInfo.available,
      deliveryTime: deliveryInfo.deliveryTime,
      savedAt: Date.now(),
    };

    sessionStorage.setItem("quickbasket_pincode", JSON.stringify(pincodeData));
    updateDeliveryBanner(pincodeData);

    // Show success toast
    showSuccessToast(
      `Delivery location set to ${deliveryInfo.city}, ${deliveryInfo.state}`
    );
  } catch (error) {
    console.error("Error saving pincode:", error);
  }
}

/**
 * Load saved pincode from sessionStorage
 */
function loadSavedPincode() {
  try {
    const savedData = sessionStorage.getItem("quickbasket_pincode");
    if (savedData) {
      const pincodeData = JSON.parse(savedData);

      // Check if data is not too old (24 hours)
      const isRecent = Date.now() - pincodeData.savedAt < 24 * 60 * 60 * 1000;

      if (isRecent && pincodeData.available) {
        updateDeliveryBanner(pincodeData);
      } else {
        // Clear old data
        sessionStorage.removeItem("quickbasket_pincode");
      }
    }
  } catch (error) {
    console.error("Error loading saved pincode:", error);
  }
}

/**
 * Update delivery banner with saved location
 * @param {object} pincodeData - Saved pincode data
 */
function updateDeliveryBanner(pincodeData) {
  const deliveryText = document.getElementById("deliveryLocationText");
  const deliveryInfo = document.querySelector(".delivery-info");
  const changePincodeBtn = document.getElementById("changePincodeBtn");

  if (!deliveryText || !pincodeData.available) return;

  deliveryText.textContent = `Delivering to ${pincodeData.city}, ${pincodeData.state} (${pincodeData.pincode})`;

  if (deliveryInfo) {
    deliveryInfo.classList.add("has-location");
  }

  // Update button to show clear option on right-click or long press
  if (changePincodeBtn) {
    changePincodeBtn.addEventListener("contextmenu", function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (confirm("Clear delivery location?")) {
        clearSavedPincode();
      }
    });
  }
}

/**
 * Clear saved pincode and reset banner
 */
function clearSavedPincode() {
  try {
    sessionStorage.removeItem("quickbasket_pincode");

    // Reset banner text
    const deliveryText = document.getElementById("deliveryLocationText");
    const deliveryInfo = document.querySelector(".delivery-info");

    if (deliveryText) {
      deliveryText.textContent = "Click to set delivery location";
    }

    if (deliveryInfo) {
      deliveryInfo.classList.remove("has-location");
    }

    showSuccessToast("Delivery location cleared");
  } catch (error) {
    console.error("Error clearing pincode:", error);
  }
}

// --- Cart Functions ---

function openCart() {
  document.getElementById("cartModal").style.display = "flex";
  document.getElementById("paymentSection").style.display = "none";
  document.getElementById("orderSuccess").style.display = "none";
  updateCartDisplay();
}

function closeCart() {
  document.getElementById("cartModal").style.display = "none";
  document.getElementById("userModal").style.display = "none";
}

function addToCart(name, price, image, id = null) {
  // Check if product already in cart
  const existingProduct = cart.find((item) => item.name === name);

  if (existingProduct) {
    existingProduct.quantity += 1;
  } else {
    cart.push({
      id: id,
      name: name,
      price: price,
      image: image,
      quantity: 1,
    });
  }

  // Update cart count
  const newCartCount = cart.reduce((total, item) => total + item.quantity, 0);
  cartCount = newCartCount;
  const cartCountElement = document.querySelector(".cart-item-count");
  if (cartCountElement) {
    cartCountElement.textContent = cartCount;
  }

  // Save to localStorage with debouncing
  if (window.cartStorage && window.cartStorage.debouncedSave) {
    window.cartStorage.debouncedSave(cart);
  }

  // Show toast notification
  showSuccessToast(`${name} added to cart!`);
}

function updateCartDisplay() {
  const cartItems = document.querySelector(".cart-items");
  const cartTotal = document.getElementById("cartTotal");
  const qrAmount = document.getElementById("qrAmount");

  cartItems.innerHTML = "";
  let total = 0;

  if (cart.length === 0) {
    cartItems.innerHTML =
      '<p style="text-align: center; padding: 20px;">Your cart is empty</p>';
  } else {
    cart.forEach((item) => {
      const itemTotal = item.price * item.quantity;
      total += itemTotal;

      const cartItem = document.createElement("div");
      cartItem.className = "cart-item";
      cartItem.innerHTML = `
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
                </div>
            `;

      cartItems.appendChild(cartItem);
    });
  }

  // Calculate discount and final total
  let discount = 0;
  let finalTotal = total;

  if (appliedCoupon) {
    if (appliedCoupon.type === "flat") {
      discount = appliedCoupon.value;
    } else if (appliedCoupon.type === "percentage") {
      discount = Math.round((total * appliedCoupon.value) / 100);
    }
    finalTotal = Math.max(0, total - discount);
  }

  // Update total display
  if (appliedCoupon && discount > 0) {
    cartTotal.innerHTML = `
            <div>
                <div style="text-decoration: line-through; color: #999; font-size: 0.9rem;">₹${total}</div>
                <div style="color: var(--success);">₹${finalTotal} <span style="font-size: 0.8rem;">(₹${discount} off)</span></div>
            </div>
        `;
  } else {
    cartTotal.textContent = `₹${finalTotal}`;
  }

  qrAmount.textContent = `₹${finalTotal}`;

  document.querySelector(
    ".qr-code img"
  ).src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=QuickBasket-Payment-Total-₹${finalTotal}`;

  // Update cart count on header
  const newCartCount = cart.reduce((total, item) => total + item.quantity, 0);
  cartCount = newCartCount;
  const cartCountElement = document.querySelector(".cart-item-count");
  if (cartCountElement) {
    cartCountElement.textContent = cartCount;
  }
}

function changeQuantity(name, change) {
  const product = cart.find((item) => item.name === name);

  if (product) {
    product.quantity += change;

    if (product.quantity <= 0) {
      // Remove product from cart
      cart = cart.filter((item) => item.name !== name);
    }

    // Update cart count
    cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    const cartCountElement = document.querySelector(".cart-item-count");
    if (cartCountElement) {
      cartCountElement.textContent = cartCount;
    }

    // Save to localStorage with debouncing
    if (window.cartStorage && window.cartStorage.debouncedSave) {
      window.cartStorage.debouncedSave(cart);
    }

    // Update display
    updateCartDisplay();
  }
}

function showPaymentSection() {
  if (cart.length === 0) {
    showToast("Your cart is empty!");
    return;
  }

  document.getElementById("paymentSection").style.display = "block";
  displayAvailableCoupons();
}

function displayAvailableCoupons() {
  const couponsList = document.getElementById("availableCoupons");
  couponsList.innerHTML = "";

  Object.values(coupons).forEach((coupon) => {
    const couponItem = document.createElement("div");
    couponItem.className = "coupon-item";
    couponItem.innerHTML = `
            <div class="coupon-info">
                <div class="coupon-code">${coupon.code}</div>
                <div class="coupon-desc">${coupon.description}</div>
                ${
                  coupon.minOrder > 0
                    ? `<div class="coupon-min">Min order: ₹${coupon.minOrder}</div>`
                    : ""
                }
            </div>
            <button class="coupon-apply-btn" onclick="applyCouponFromList('${
              coupon.code
            }')">Apply</button>
        `;
    couponsList.appendChild(couponItem);
  });
}

function applyCoupon() {
  const couponInput = document.querySelector(".coupon-input input");
  const couponCode = couponInput.value.trim().toUpperCase();

  if (!couponCode) {
    showCouponMessage("Please enter a coupon code", "error");
    return;
  }

  if (!coupons[couponCode]) {
    showCouponMessage("Invalid coupon code", "error");
    return;
  }

  const coupon = coupons[couponCode];
  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  if (cartTotal < coupon.minOrder) {
    showCouponMessage(
      `Coupon not eligible for current cart value. Minimum order: ₹${coupon.minOrder}`,
      "error"
    );
    return;
  }

  appliedCoupon = coupon;
  couponInput.value = "";
  updateCartDisplay();
  updateCouponUI();
  showCouponMessage(`Coupon ${couponCode} applied successfully!`, "success");
}

function applyCouponFromList(couponCode) {
  const coupon = coupons[couponCode];
  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  if (cartTotal < coupon.minOrder) {
    showCouponMessage(
      `Coupon not eligible for current cart value. Minimum order: ₹${coupon.minOrder}`,
      "error"
    );
    return;
  }

  appliedCoupon = coupon;
  updateCartDisplay();
  updateCouponUI();
  showCouponMessage(`Coupon ${couponCode} applied successfully!`, "success");
}

function removeCoupon() {
  appliedCoupon = null;
  updateCartDisplay();
  updateCouponUI();
  showCouponMessage("Coupon removed", "success");
}

function updateCouponUI() {
  const appliedCouponDiv = document.getElementById("appliedCoupon");

  if (appliedCoupon) {
    appliedCouponDiv.style.display = "block";
    appliedCouponDiv.innerHTML = `
            <div class="applied-coupon-info">
                <span class="applied-coupon-code">${appliedCoupon.code}</span>
                <span class="applied-coupon-desc">${appliedCoupon.description}</span>
            </div>
            <button class="remove-coupon-btn" onclick="removeCoupon()">Remove</button>
        `;
  } else {
    appliedCouponDiv.style.display = "none";
  }
}

function showCouponMessage(message, type) {
  const messageDiv = document.getElementById("couponMessage");
  if (!messageDiv) return; // Prevent errors if element doesn't exist
  messageDiv.textContent = message;
  messageDiv.className = `coupon-message ${type}`;
  messageDiv.style.display = "block";

  setTimeout(() => {
    messageDiv.style.display = "none";
  }, 3000);
}

let toastTimeout;
let toastProgressInterval;

function showToast(message, type = "success", duration = 4000) {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toastMessage");
  const toastIcon = toast.querySelector("i");
  const progressBar = document.getElementById("toastProgressBar");

  // Clear any existing timeout and progress interval
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }
  if (toastProgressInterval) {
    clearInterval(toastProgressInterval);
  }

  // Remove existing classes and hide states
  toast.classList.remove("show", "hide", "success", "error", "warning", "info");

  // Reset progress bar
  progressBar.style.transform = "scaleX(1)";
  progressBar.style.transition = "none";

  // Set message content
  toastMessage.textContent = message;

  // Set toast type and icon
  toast.classList.add(type);

  // Update icon based on type
  switch (type) {
    case "success":
      toastIcon.className = "fas fa-check-circle";
      break;
    case "error":
      toastIcon.className = "fas fa-exclamation-circle";
      break;
    case "warning":
      toastIcon.className = "fas fa-exclamation-triangle";
      break;
    case "info":
      toastIcon.className = "fas fa-info-circle";
      break;
    default:
      toastIcon.className = "fas fa-check-circle";
  }

  // Show toast with animation
  setTimeout(() => {
    toast.classList.add("show");

    // Start progress bar animation
    setTimeout(() => {
      progressBar.style.transition = `transform ${duration}ms linear`;
      progressBar.style.transform = "scaleX(0)";
    }, 100);
  }, 10);

  // Auto-hide toast after specified duration
  toastTimeout = setTimeout(() => {
    hideToast();
  }, duration);
}

function hideToast() {
  const toast = document.getElementById("toast");
  const progressBar = document.getElementById("toastProgressBar");

  // Clear timeout and progress interval if manually closing
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }
  if (toastProgressInterval) {
    clearInterval(toastProgressInterval);
  }

  // Stop progress bar animation
  progressBar.style.transition = "none";
  progressBar.style.transform = "scaleX(0)";

  // Add hide animation
  toast.classList.add("hide");
  toast.classList.remove("show");

  // Remove hide class after animation completes
  setTimeout(() => {
    toast.classList.remove("hide");
    // Reset progress bar for next toast
    progressBar.style.transform = "scaleX(1)";
  }, 400);
}

// Enhanced toast notifications for different scenarios
function showSuccessToast(message, duration = 4000) {
  showToast(message, "success", duration);
}

function showErrorToast(message, duration = 5000) {
  showToast(message, "error", duration);
}

function showWarningToast(message, duration = 4500) {
  showToast(message, "warning", duration);
}

function showInfoToast(message, duration = 4000) {
  showToast(message, "info", duration);
}

function openUserModal() {
  document.getElementById("userModal").style.display = "flex";
}

function switchTab(tabName) {
  // Hide all forms
  document.querySelectorAll(".user-form").forEach((form) => {
    form.classList.remove("active");
  });

  // Remove active class from all tabs
  document.querySelectorAll(".user-tab").forEach((tab) => {
    tab.classList.remove("active");
  });

  // Show selected form and activate tab
  if (tabName === "login") {
    document.getElementById("loginForm").classList.add("active");
    document.querySelectorAll(".user-tab")[0].classList.add("active");
  } else {
    document.getElementById("signupForm").classList.add("active");
    document.querySelectorAll(".user-tab")[1].classList.add("active");
  }
}

function selectPayment(element) {
  // Remove selected class from all options
  document.querySelectorAll(".payment-option").forEach((opt) => {
    opt.classList.remove("selected");
  });

  // Add selected class to clicked option
  element.classList.add("selected");
}

function placeOrder() {
  const selectedPayment = document.querySelector(".payment-option.selected");
  if (!selectedPayment) {
    showToast("Please select a payment method");
    return;
  }

  document.getElementById("paymentSection").style.display = "none";
  document.getElementById("orderSuccess").style.display = "block";

  setTimeout(() => {
    // Reset cart and coupon after successful order
    cart = [];
    cartCount = 0;
    appliedCoupon = null;
    const cartCountElement = document.querySelector(".cart-item-count");
    if (cartCountElement) {
      cartCountElement.textContent = cartCount;
    }

    // Clear cart from localStorage
    if (window.cartStorage && window.cartStorage.clearCart) {
      window.cartStorage.clearCart();
    }
  }, 5000);
}

// --- Wishlist Functions (New) ---

function openWishlist() {
  document.getElementById("wishlistModal").style.display = "flex";
  updateWishlistDisplay();
}

function closeWishlist() {
  document.getElementById("wishlistModal").style.display = "none";
}

function toggleWishlist(productId, event) {
  if (event) event.stopPropagation();

  const productIndex = wishlist.findIndex((item) => item.id === productId);
  const button = event.currentTarget;
  const heartIcon = button.querySelector("i");

  if (productIndex > -1) {
    wishlist.splice(productIndex, 1);
    heartIcon.classList.remove("fas");
    heartIcon.classList.add("far");
    button.classList.remove("active");
    showToast("Removed from wishlist");
  } else {
    const productToAdd = productsData.allProducts.find(
      (p) => p.id === productId
    );
    if (productToAdd) {
      wishlist.push(productToAdd);
      heartIcon.classList.remove("far");
      heartIcon.classList.add("fas");
      button.classList.add("active");
      showToast("Added to wishlist");
    }
  }

  saveWishlist();
  updateWishlistDisplay();
}

function removeWishlistItem(productId) {
  wishlist = wishlist.filter((item) => item.id !== productId);
  showToast("Item removed from wishlist");
  saveWishlist();
  updateWishlistDisplay();
}

function moveAllToCart() {
  if (wishlist.length === 0) {
    showToast("Wishlist is empty!");
    return;
  }

  wishlist.forEach((item) => {
    addToCart(item.name, item.price, item.image, item.id);
  });

  wishlist = [];
  showToast("All items moved to cart!");
  saveWishlist();
  updateWishlistDisplay();
  closeWishlist();
  openCart();
}

function updateWishlistDisplay() {
  const wishlistCountElement = document.querySelector(".wishlist-count");
  const wishlistItemsContainer = document.querySelector(".wishlist-items");

  if (wishlistCountElement) {
    wishlistCountElement.textContent = wishlist.length;
  }

  if (!wishlistItemsContainer) return;

  wishlistItemsContainer.innerHTML = "";

  if (wishlist.length === 0) {
    wishlistItemsContainer.innerHTML =
      '<p style="text-align: center; padding: 20px;">Your wishlist is empty</p>';
  } else {
    wishlist.forEach((item) => {
      const wishlistItem = document.createElement("div");
      wishlistItem.className = "wishlist-item";

      const productDetail = productsData.allProducts.find(
        (p) => p.id === item.id
      );
      const description = productDetail
        ? productDetail.description
        : "Product details unavailable.";

      wishlistItem.innerHTML = `
                <div class="wishlist-item-info">
                    <img src="${item.image}" alt="${item.name}" class="wishlist-item-image">
                    <div class="wishlist-item-details">
                        <h4>${item.name}</h4>
                        <p class="wishlist-item-desc">${description}</p>
                        <div class="wishlist-item-price">₹${item.price}</div>
                    </div>
                </div>
                <div class="wishlist-item-actions">
                    <button class="btn-small" onclick="addToCart('${item.name}', ${item.price}, '${item.image}', ${item.id}); removeWishlistItem(${item.id})">
                        <i class="fas fa-shopping-cart"></i> Move to Cart
                    </button>
                    <button class="btn-remove" onclick="removeWishlistItem(${item.id})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;

      wishlistItemsContainer.appendChild(wishlistItem);
    });
  }

  renderProducts();
}

// Close modal when clicking outside
window.onclick = function (event) {
  const cartModal = document.getElementById("cartModal");
  const userModal = document.getElementById("userModal");
  const wishlistModal = document.getElementById("wishlistModal");

  if (event.target === cartModal) {
    closeCart();
  }

  if (event.target === userModal) {
    userModal.style.display = "none";
  }

  if (event.target === wishlistModal) {
    closeWishlist();
  }
};

// Form submission handlers
document.addEventListener("DOMContentLoaded", function () {
  const signupPasswordInput = document.getElementById('signupPassword');
  if (signupPasswordInput) {
    signupPasswordInput.addEventListener('input', function() {
      displayPasswordStrength(this.value);
    });
  }

  document.getElementById("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
      showErrorToast('Please fill in all fields');
      return;
    }
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      showSuccessToast(`Welcome back, ${user.displayName || user.email}!`);
      setTimeout(() => {
        document.getElementById('userModal').style.display = 'none';
      }, 1000);
    } catch (error) {
      console.error('Error logging in:', error);
      let errorMessage = 'Failed to log in. ';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage += 'No account found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage += 'Incorrect password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage += 'Invalid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage += 'Too many failed attempts. Please try again later.';
      } else {
        errorMessage += 'Please try again.';
      }
      
      showErrorToast(errorMessage);
    }
  });

  document.getElementById("signupForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const phone = document.getElementById('signupPhone').value;
    
    if (!name || !email || !password || !phone) {
      showErrorToast('Please fill in all fields');
      return;
    }
    
    const validation = validatePassword(password);
    if (!validation.isValid) {
      showErrorToast('Password does not meet requirements');
      return;
    }
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await updateProfile(user, {
        displayName: name,
        photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff&size=100`
      });
      
      localStorage.setItem('userPhone', phone);
      
      showSuccessToast(`Account created successfully! Welcome, ${name}!`);
      setTimeout(() => {
        document.getElementById('userModal').style.display = 'none';
      }, 1000);
    } catch (error) {
      console.error('Error creating account:', error);
      let errorMessage = 'Failed to create account. ';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage += 'This email is already registered.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage += 'Invalid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage += 'Password is too weak.';
      } else {
        errorMessage += 'Please try again.';
      }
      
      showErrorToast(errorMessage);
    }
  });

  // Profile editing functionality
  let selectedThemeColor = '0D8ABC';
  
  const editProfileBtn = document.getElementById('editProfileBtn');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  const profileEditSection = document.getElementById('profileEditSection');
  const editProfileForm = document.getElementById('editProfileForm');
  
  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', () => {
      profileEditSection.style.display = 'block';
      const currentUser = auth.currentUser;
      if (currentUser) {
        document.getElementById('editDisplayName').value = currentUser.displayName || '';
        const savedColor = localStorage.getItem('profileThemeColor') || '0D8ABC';
        selectedThemeColor = savedColor;
        updateColorSelection(savedColor);
      }
    });
  }
  
  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', () => {
      profileEditSection.style.display = 'none';
    });
  }
  
  document.querySelectorAll('.color-option').forEach(btn => {
    btn.addEventListener('click', function() {
      selectedThemeColor = this.dataset.color;
      updateColorSelection(selectedThemeColor);
    });
  });
  
  if (editProfileForm) {
    editProfileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const newDisplayName = document.getElementById('editDisplayName').value;
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        showErrorToast('No user logged in');
        return;
      }
      
      try {
        await updateProfile(currentUser, {
          displayName: newDisplayName,
          photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(newDisplayName)}&background=${selectedThemeColor}&color=fff&size=100`
        });
        
        localStorage.setItem('profileThemeColor', selectedThemeColor);
        
        updateUIForSignedInUser(currentUser);
        
        showSuccessToast('Profile updated successfully!');
        profileEditSection.style.display = 'none';
      } catch (error) {
        console.error('Error updating profile:', error);
        showErrorToast('Failed to update profile. Please try again.');
      }
    });
  }

  // Initialize theme on page load
  initializeTheme();
  
  // Expose functions to window object for HTML onclick handlers
  window.openCart = openCart;
  window.closeCart = closeCart;
  window.openWishlist = openWishlist;
  window.closeWishlist = closeWishlist;
  window.openUserModal = openUserModal;
  window.switchTab = switchTab;
  window.toggleTheme = toggleTheme;
  window.addToCart = addToCart;
  window.changeQuantity = changeQuantity;
  window.showPaymentSection = showPaymentSection;
  window.selectPayment = selectPayment;
  window.placeOrder = placeOrder;
  window.applyCoupon = applyCoupon;
  window.applyCouponFromList = applyCouponFromList;
  window.removeCoupon = removeCoupon;
  window.toggleWishlist = toggleWishlist;
  window.removeWishlistItem = removeWishlistItem;
  window.moveAllToCart = moveAllToCart;
  window.openPincodeModal = openPincodeModal;
  window.closePincodeModal = closePincodeModal;
  window.showSuccessToast = showSuccessToast;
  window.showErrorToast = showErrorToast;
  window.showWarningToast = showWarningToast;
  window.showInfoToast = showInfoToast;
  window.hideToast = hideToast;
});

function updateColorSelection(color) {
  document.querySelectorAll('.color-option').forEach(btn => {
    if (btn.dataset.color === color) {
      btn.classList.add('selected');
    } else {
      btn.classList.remove('selected');
    }
  });
}

// Dark Mode Toggle Functionality
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";

  setTheme(newTheme);
}

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);

  // Add a subtle feedback animation to the navbar toggle
  const toggleButton = document.querySelector(".theme-toggle-nav");
  if (toggleButton) {
    toggleButton.style.transform = "scale(0.9)";
    setTimeout(() => {
      toggleButton.style.transform = "scale(1)";
    }, 150);
  }
}

function initializeTheme() {
  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  const theme = savedTheme || (prefersDark ? "dark" : "light");
  setTheme(theme);
}

// Listen for system theme changes
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", (e) => {
    if (!localStorage.getItem("theme")) {
      setTheme(e.matches ? "dark" : "light");
    }
  });
