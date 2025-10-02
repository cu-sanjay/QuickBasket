// Cart functionality
let cart = [];
let cartCount = 0;
let appliedCoupon = null;

// Predefined coupons
const coupons = {
    'NEW50': {
        code: 'NEW50',
        description: 'Flat ₹50 off on all orders',
        type: 'flat',
        value: 50,
        minOrder: 0
    },
    'SALE25': {
        code: 'SALE25',
        description: '25% off on your order',
        type: 'percentage',
        value: 25,
        minOrder: 0
    },
    'FESTIVEDAY': {
        code: 'FESTIVEDAY',
        description: '₹100 off on orders above ₹299',
        type: 'flat',
        value: 100,
        minOrder: 299
    },
    'MEGA40': {
        code: 'MEGA40',
        description: '40% off on orders above ₹500',
        type: 'percentage',
        value: 40,
        minOrder: 500
    }

    //you can add more coupons here
};
let productsData = null;

// Initialize cart from localStorage on startup
function initializeCart() {
    const savedCart = window.cartStorage ? window.cartStorage.loadCart() : null;

    if (savedCart && Array.isArray(savedCart) && savedCart.length > 0) {
        cart = savedCart;
        cartCount = cart.reduce((total, item) => total + item.quantity, 0);
        document.querySelector('.cart-count').textContent = cartCount;
        console.log(`Loaded ${cart.length} items from localStorage`);
    } else {
        cart = [];
        cartCount = 0;
    }
}

// Load products from JSON
async function loadProducts() {
  try {
    const response = await fetch("./products.json");
    productsData = await response.json();
    renderProducts();
    initializeFilters();
  } catch (error) {
    console.error("Error loading products:", error);
    showErrorToast("Failed to load products. Please refresh the page.");
  }
}

// Render products dynamically
function renderProducts() {
  if (!productsData) return;

  renderProductSection("popularProducts", productsData.popularProducts);
  renderProductSection("dealsProducts", productsData.deals);
}

function initializeFilters() {
  const categoryItems = document.querySelectorAll('.category-item');
  categoryItems.forEach(item => {
    item.addEventListener('click', () => {
      const category = item.dataset.category;
      filterProducts(category);
      categoryItems.forEach(cat => cat.classList.remove('active'));
      item.classList.add('active');
    });
  });
  
  if (categoryItems.length > 0) {
    categoryItems[0].classList.add('active');
  }
}

function filterProducts(category) {
  if (category === 'all') {
    renderProductSection('popularProducts', productsData.popularProducts);
    renderProductSection('dealsProducts', productsData.deals);
  } else {
    const filteredPopular = productsData.popularProducts.filter(product => product.category === category);
    const filteredDeals = productsData.deals.filter(product => product.category === category);
    
    renderProductSection('popularProducts', filteredPopular);
    renderProductSection('dealsProducts', filteredDeals);
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

// Create product card element
function createProductCard(product) {
  const productCard = document.createElement("div");
  productCard.className = "product-card";

  productCard.innerHTML = `
        <img src="${product.image}" alt="${product.name}" class="product-image">
        <div class="product-info">
            <h3 class="product-title">${product.name}</h3>
            <div class="product-price">₹${product.price} <span>(₹${product.discount} off)</span></div>
            <p>${product.description}</p>
            <div class="product-actions">
                <button class="add-to-cart" onclick="addToCart('${product.name}', ${product.price}, '${product.image}')">
                    <i class="fas fa-plus"></i> Add to Cart
                </button>
                <button class="wishlist">
                    <i class="far fa-heart"></i>
                </button>
            </div>
        </div>
    `;

  return productCard;
}
// Initialize products and cart when page loads
document.addEventListener("DOMContentLoaded", function () {
  loadProducts();
  initializeCart();
});

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

function addToCart(name, price, image) {
  // Check if product already in cart
  const existingProduct = cart.find((item) => item.name === name);

  if (existingProduct) {
    existingProduct.quantity += 1;
  } else {
    cart.push({
      name: name,
      price: price,
      image: image,
      quantity: 1,
    });
  }

  cartCount += 1;
  document.querySelector(".cart-count").textContent = cartCount;

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

  // Clear current display
  cartItems.innerHTML = "";

  // Add items to display
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

  // Update QR code with new total - demo only
  document.querySelector(
    ".qr-code img"
  ).src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=QuickBasket-Payment-Total-₹${finalTotal}`;
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
    document.querySelector(".cart-count").textContent = cartCount;

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
        showToast('Your cart is empty!');
        return;
    }
    
    document.getElementById('paymentSection').style.display = 'block';
    displayAvailableCoupons();
}

function displayAvailableCoupons() {
    const couponsList = document.getElementById('availableCoupons');
    couponsList.innerHTML = '';
    
    Object.values(coupons).forEach(coupon => {
        const couponItem = document.createElement('div');
        couponItem.className = 'coupon-item';
        couponItem.innerHTML = `
            <div class="coupon-info">
                <div class="coupon-code">${coupon.code}</div>
                <div class="coupon-desc">${coupon.description}</div>
                ${coupon.minOrder > 0 ? `<div class="coupon-min">Min order: ₹${coupon.minOrder}</div>` : ''}
            </div>
            <button class="coupon-apply-btn" onclick="applyCouponFromList('${coupon.code}')">Apply</button>
        `;
        couponsList.appendChild(couponItem);
    });
}

function applyCoupon() {
    const couponInput = document.querySelector('.coupon-input input');
    const couponCode = couponInput.value.trim().toUpperCase();
    
    if (!couponCode) {
        showCouponMessage('Please enter a coupon code', 'error');
        return;
    }
    
    if (!coupons[couponCode]) {
        showCouponMessage('Invalid coupon code', 'error');
        return;
    }
    
    const coupon = coupons[couponCode];
    const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    if (cartTotal < coupon.minOrder) {
        showCouponMessage(`Coupon not eligible for current cart value. Minimum order: ₹${coupon.minOrder}`, 'error');
        return;
    }
    
    appliedCoupon = coupon;
    couponInput.value = '';
    updateCartDisplay();
    updateCouponUI();
    showCouponMessage(`Coupon ${couponCode} applied successfully!`, 'success');
}

function applyCouponFromList(couponCode) {
    const coupon = coupons[couponCode];
    const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    if (cartTotal < coupon.minOrder) {
        showCouponMessage(`Coupon not eligible for current cart value. Minimum order: ₹${coupon.minOrder}`, 'error');
        return;
    }
    
    appliedCoupon = coupon;
    updateCartDisplay();
    updateCouponUI();
    showCouponMessage(`Coupon ${couponCode} applied successfully!`, 'success');
}

function removeCoupon() {
    appliedCoupon = null;
    updateCartDisplay();
    updateCouponUI();
    showCouponMessage('Coupon removed', 'success');
}

function updateCouponUI() {
    const appliedCouponDiv = document.getElementById('appliedCoupon');
    
    if (appliedCoupon) {
        appliedCouponDiv.style.display = 'block';
        appliedCouponDiv.innerHTML = `
            <div class="applied-coupon-info">
                <span class="applied-coupon-code">${appliedCoupon.code}</span>
                <span class="applied-coupon-desc">${appliedCoupon.description}</span>
            </div>
            <button class="remove-coupon-btn" onclick="removeCoupon()">Remove</button>
        `;
    } else {
        appliedCouponDiv.style.display = 'none';
    }
}

function showCouponMessage(message, type) {
    const messageDiv = document.getElementById('couponMessage');
    if (!messageDiv) return; // Prevent errors if element doesn't exist
    messageDiv.textContent = message;
    messageDiv.className = `coupon-message ${type}`;
    messageDiv.style.display = 'block';
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
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
    document.querySelectorAll('.payment-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    
    // Add selected class to clicked option
    element.classList.add('selected');
}

function placeOrder() {
    // Check if payment method is selected
    const selectedPayment = document.querySelector('.payment-option.selected');
    if (!selectedPayment) {
        showToast('Please select a payment method');
        return;
    }
    
    // Show processing animation
    document.getElementById('paymentSection').style.display = 'none';
    document.getElementById('orderSuccess').style.display = 'block';
    
    // Simulate order processing
    setTimeout(() => {
        // Reset cart and coupon after successful order
        cart = [];
        cartCount = 0;
        appliedCoupon = null;
        document.querySelector('.cart-count').textContent = cartCount;

        // Clear cart from localStorage
        if (window.cartStorage && window.cartStorage.clearCart) {
            window.cartStorage.clearCart();
        }
    }, 5000);
}

// Close modal when clicking outside
window.onclick = function (event) {
  const cartModal = document.getElementById("cartModal");
  const userModal = document.getElementById("userModal");

  if (event.target === cartModal) {
    closeCart();
  }

  if (event.target === userModal) {
    userModal.style.display = "none";
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
});
