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
let currentCategory = 'all'; // active category filter from URL or clicks

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
    const savedWishlist = localStorage.getItem('quickbasket_wishlist');
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
    console.error('Error loading wishlist from localStorage:', error);
    wishlist = [];
    wishlistCount = 0;
  }
}

// --- Ratings & Reviews Storage ---
function loadReviews() {
  const saved = localStorage.getItem("productReviews");
  return saved ? JSON.parse(saved) : {};
}

function saveReviews(reviews) {
  localStorage.setItem("productReviews", JSON.stringify(reviews));
}

function displayReviews(productId) {
  const reviews = loadReviews();
  const container = document.getElementById("reviewsContainer");
  if (!container) return;

  container.innerHTML = "";

  if (reviews[productId] && reviews[productId].length > 0) {
    reviews[productId].forEach(r => {
      const div = document.createElement("div");
      div.className = "review-item";
      div.innerHTML = `<p class="review-rating">Rating: ${r.rating}/5</p><p>${r.text}</p>`;
      container.appendChild(div);
    });
  } else {
    container.innerHTML = "<p>No reviews yet.</p>";
  }
}

let currentProduct = null; // holds product for modal
function openProductDetail(product) {
  document.getElementById("detailName").innerText = product.name;
  document.getElementById("detailImage").src = product.image;
  document.getElementById("detailDescription").innerText = product.description;
  document.getElementById("detailPrice").innerText = product.price;
  document.getElementById("detailRating").innerText = product.rating || "N/A";

  document.getElementById("productDetailModal").style.display = "flex";
  currentProduct = product;

  // Clear review input
  document.getElementById("userReview").value = "";

// Initialize star rating
const stars = document.querySelectorAll('#productDetailModal .star');
stars.forEach(star => {
  star.addEventListener('click', function () {
    const rating = parseInt(this.getAttribute('data-value'));
    stars.forEach((s, index) => {
      if (index < rating) {
        s.classList.add('active');
        s.textContent = '★';
      } else {
        s.classList.remove('active');
        s.textContent = '☆';
      }
    });
  });

  star.addEventListener('mouseenter', function () {
    const rating = parseInt(this.getAttribute('data-value'));
    stars.forEach((s, index) => {
      s.textContent = index < rating ? '★' : '☆';
    });
  });
});

  setTimeout(() => {
    initStarRating(product.id);
  }, 50);

  // Handle review submission
  document.getElementById("submitReviewBtn").onclick = () => {
    const reviewText = document.getElementById("userReview").value.trim();
    if (selectedRating === 0 || reviewText === "") {
      alert("Please select a star rating and write a review!");
      return;
    }

    const reviews = loadReviews();
    if (!reviews[product.id]) reviews[product.id] = [];
    reviews[product.id].push({ rating: selectedRating, text: reviewText });
    saveReviews(reviews);

    displayReviews(product.id); // Refresh reviews in modal
    document.getElementById("userReview").value = "";

    selectedRating = 0;
    initStarRating(product.id); // Reset stars

    showSuccessToast("Your review has been submitted!");
  };

  // Show existing reviews
  displayReviews(product.id);
}

function closeProductDetail() {
  document.getElementById("productDetailModal").style.display = "none";
}

function addToCartFromDetail() {
  if (currentProduct) {
    addToCart(currentProduct.name, currentProduct.price, currentProduct.image, currentProduct.id);
    showSuccessToast(`${currentProduct.name} added to cart!`);
  }
  closeProductDetail();
}

function addToWishlistFromDetail() {
  if (currentProduct) {
    const productToAdd = productsData.allProducts.find(p => p.id === currentProduct.id);

    // Check if already in wishlist
    const exists = wishlist.some(item => item.id === currentProduct.id);
    if (!exists && productToAdd) {
      wishlist.push(productToAdd);
      showSuccessToast(`${currentProduct.name} added to wishlist!`);
    } else {
      showWarningToast(`${currentProduct.name} is already in wishlist!`);
    }

    saveWishlist();
    updateWishlistDisplay();
  }
  closeProductDetail();
}

function createProductCard(product) {
  const productCard = document.createElement("div");
  productCard.className = "product-card";

  // Open detail modal when card is clicked
  productCard.addEventListener("click", () => {
    openProductDetail(product);
  });

  // Check if the product is in the wishlist
  const isInWishlist = wishlist.some((item) => item.id === product.id);
  const heartIconClass = isInWishlist ? "fas fa-heart active" : "far fa-heart";

  productCard.innerHTML = `
    <img src="${product.image}" alt="${product.name}" class="product-image">
    <div class="product-info">
      <h3 class="product-title">${product.name}</h3>
      <div class="product-price">₹${product.price} <span>(₹${product.discount} off)</span></div>
      <p>${product.description}</p>
      <div class="product-actions">
        <button class="add-to-cart" onclick="event.stopPropagation(); addToCart('${product.name}', ${product.price}, '${product.image}', ${product.id})">
          <i class="fas fa-plus"></i> Add to Cart
        </button>
        <button class="wishlist" onclick="event.stopPropagation(); toggleWishlist(${product.id}, event)">
          <i class="${heartIconClass}"></i>
        </button>
      </div>
    </div>
  `;

  return productCard;
}

let selectedRating = 0; // global for modal

function initStarRating(productId) {
  const stars = document.querySelectorAll(".modal-rating-stars .star");
  if (!stars || stars.length === 0) return;

  // Reset stars
  stars.forEach(s => s.classList.remove("filled"));

  const reviews = loadReviews();

  // Load last saved rating (if exists)
  if (reviews[productId] && reviews[productId].length > 0) {
    const latest = reviews[productId][reviews[productId].length - 1];
    selectedRating = latest.rating;
    stars.forEach(s => {
      if (parseInt(s.dataset.value) <= selectedRating) s.classList.add("filled");
    });
  } else {
    selectedRating = 0;
  }

  // Add fresh click events
  stars.forEach(star => {
    star.onclick = () => {
      selectedRating = parseInt(star.dataset.value);

      stars.forEach(s => {
        if (parseInt(s.dataset.value) <= selectedRating) {
          s.classList.add("filled");
        } else {
          s.classList.remove("filled");
        }
      });
    };
  });
}

// Save wishlist to localStorage
function saveWishlist() {
  try {
    localStorage.setItem('quickbasket_wishlist', JSON.stringify(wishlist));
  } catch (error) {
    console.error('Error saving wishlist to localStorage:', error);
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

// Render products dynamically
function renderProducts() {
  if (!productsData) return;

  const category = (currentCategory || 'all').toLowerCase();

  // Filter helpers
  const byCategory = (p) => category === 'all' || (p.category || '').toLowerCase() === category;

  const popular = (productsData.popularProducts || []).filter(byCategory);
  const deals = (productsData.deals || []).filter(byCategory);

  renderProductSection("popularProducts", popular);
  renderProductSection("dealsProducts", deals);

  // Update headings to reflect active category
  try {
    const popularTitle = document.querySelector('h2.section-title#products');
    const dealsTitle = Array.from(document.querySelectorAll('h2.section-title'))
      .find(h => h.textContent.trim().startsWith("Today's Best Deals"));

    const prettyCat = category === 'all' ? '' : ` – ${category.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}`;
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
    const cat = (params.get('category') || 'all').toLowerCase();
    return cat;
  } catch (_) {
    return 'all';
  }
}

function setCategoryInURL(cat) {
  const params = new URLSearchParams(window.location.search);
  if (!cat || cat === 'all') {
    params.delete('category');
  } else {
    params.set('category', cat);
  }
  const newUrl = `${window.location.pathname}?${params.toString()}`.replace(/\?$/, '');
  window.history.pushState({ category: cat || 'all' }, '', newUrl);
}

function applyCategoryFromURL() {
  currentCategory = getCategoryFromURL();
  highlightActiveCategory(currentCategory);
  highlightActiveNav(currentCategory);
  renderProducts();
}

function highlightActiveCategory(cat) {
  document.querySelectorAll('.category-item').forEach(el => {
    const c = (el.getAttribute('data-category') || '').toLowerCase();
    if ((cat === 'all' && c === 'all') || c === cat) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });
}

function initializeCategoryFiltering() {
  document.querySelectorAll('.category-item').forEach(el => {
    el.addEventListener('click', () => {
      const cat = (el.getAttribute('data-category') || 'all').toLowerCase();
      currentCategory = cat;
      setCategoryInURL(cat);
      highlightActiveCategory(cat);
      highlightActiveNav(cat);
      // Optional: clear search when category changes
      const searchInput = document.querySelector('.search-bar input');
      if (searchInput) searchInput.value = '';
      renderProducts();
      scrollToProducts();
    });
  });

  // Apply initial category from URL
  applyCategoryFromURL();

  // Handle back/forward navigation
  window.addEventListener('popstate', () => {
    applyCategoryFromURL();
  });
}

function highlightActiveNav(cat) {
  document.querySelectorAll('.nav-links a[data-category]').forEach(a => {
    const c = (a.getAttribute('data-category') || '').toLowerCase();
    if ((cat === 'all' && c === 'all') || c === cat) {
      a.classList.add('active');
    } else {
      a.classList.remove('active');
    }
  });
}

function initializeNavFiltering() {
  document.querySelectorAll('.nav-links a[data-category]').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const cat = (a.getAttribute('data-category') || 'all').toLowerCase();
      currentCategory = cat;
      setCategoryInURL(cat);
      highlightActiveCategory(cat);
      highlightActiveNav(cat);
      const searchInput = document.querySelector('.search-bar input');
      if (searchInput) searchInput.value = '';
      renderProducts();
      scrollToProducts();
    });
  });
}

function scrollToProducts() {
  const anchor = document.getElementById('products');
  if (anchor && typeof anchor.scrollIntoView === 'function') {
    anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// Render recently viewed products
function renderRecentlyViewed() {
  const container = document.getElementById("recentlyViewedProducts");
  if (!container) return;

  const recentlyViewed = JSON.parse(
    localStorage.getItem("recentlyViewed") || "[]",
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

// // Create product card element
// function createProductCard(product) {
//   const productCard = document.createElement("div");
//   productCard.className = "product-card";

//   // Check if the product is in the wishlist to set the correct icon
//   const isInWishlist = wishlist.some((item) => item.id === product.id);
//   const heartIconClass = isInWishlist ? "fas fa-heart active" : "far fa-heart";

//   productCard.innerHTML = `
//         <img src="${product.image}" alt="${product.name}" class="product-image">
//         <div class="product-info">
//             <h3 class="product-title">${product.name}</h3>
//             <div class="product-price">₹${product.price} <span>(₹${product.discount} off)</span></div>
//             <p>${product.description}</p>
//             <div class="product-actions">
//                 <button class="add-to-cart" onclick="addToCart('${product.name}', ${product.price}, '${product.image}', ${product.id})">
//                     <i class="fas fa-plus"></i> Add to Cart
//                 </button>
//                 <button class="wishlist" onclick="toggleWishlist(${product.id}, event)">
//                     <i class="${heartIconClass}"></i>
//                 </button>
//             </div>
//         </div>
//     `;

//   return productCard;
// }

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

    const category = (currentCategory || 'all').toLowerCase();
    const inCategory = (p) => category === 'all' || (p.category || '').toLowerCase() === category;

    const matches = (p) =>
      p.name.toLowerCase().includes(searchTerm) ||
      p.description.toLowerCase().includes(searchTerm) ||
      (p.category || '').toLowerCase().includes(searchTerm);

    const filteredPopular = (productsData.popularProducts || []).filter(p => inCategory(p) && matches(p));
    const filteredDeals = (productsData.deals || []).filter(p => inCategory(p) && matches(p));

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

// Initialize products and cart when page loads
document.addEventListener("DOMContentLoaded", function () {
  loadProducts();
  initializeCart();
  initializeWishlist();
  initializeSearch();
  initializeCategoryFiltering();
  initializeNavFiltering();
});

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

  document.querySelector(".qr-code img").src =
    `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=QuickBasket-Payment-Total-₹${finalTotal}`;

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
                ${coupon.minOrder > 0 ? `<div class="coupon-min">Min order: ₹${coupon.minOrder}</div>` : ""}
            </div>
            <button class="coupon-apply-btn" onclick="applyCouponFromList('${coupon.code}')">Apply</button>
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
    0,
  );

  if (cartTotal < coupon.minOrder) {
    showCouponMessage(
      `Coupon not eligible for current cart value. Minimum order: ₹${coupon.minOrder}`,
      "error",
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
    0,
  );

  if (cartTotal < coupon.minOrder) {
    showCouponMessage(
      `Coupon not eligible for current cart value. Minimum order: ₹${coupon.minOrder}`,
      "error",
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
      (p) => p.id === productId,
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
        (p) => p.id === item.id,
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

// --- Utility Functions ---

function showToast(message) {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toastMessage");

  toastMessage.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

function openUserModal() {
  document.getElementById("userModal").style.display = "flex";
}

function switchTab(tabName) {
  document.querySelectorAll(".user-form").forEach((form) => {
    form.classList.remove("active");
  });

  document.querySelectorAll(".user-tab").forEach((tab) => {
    tab.classList.remove("active");
  });

  if (tabName === "login") {
    document.getElementById("loginForm").classList.add("active");
    document.querySelectorAll(".user-tab")[0].classList.add("active");
  } else {
    document.getElementById("signupForm").classList.add("active");
    document.querySelectorAll(".user-tab")[1].classList.add("active");
  }
}

// Close modal when clicking outside
window.onclick = function (event) {
  const productDetailModal = document.getElementById("productDetailModal");
  if (event.target === productDetailModal) {
    closeProductDetail();
  }
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
  document.getElementById("loginForm").addEventListener("submit", function (e) {
    e.preventDefault();
    showSuccessToast("Login successful!");
    document.getElementById("userModal").style.display = "none";
  });

  document
    .getElementById("signupForm")
    .addEventListener("submit", function (e) {
      e.preventDefault();
      showSuccessToast("Account created successfully!");
      document.getElementById("userModal").style.display = "none";
    });

  // Initialize theme on page load
  initializeTheme();
});

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
