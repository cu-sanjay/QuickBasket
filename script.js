// Cart and Wishlist functionality
let cart = [];
let wishlist = []; // Initializing the wishlist array
let productsData = null;

// Load products from JSON
async function loadProducts() {
    try {
        const response = await fetch('../products.json');
        productsData = await response.json();
        // Combine all products for easy lookup by ID
        productsData.allProducts = [...productsData.popularProducts, ...productsData.deals];
        renderProducts();
        updateWishlistDisplay(); // Call to initialize the count
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Render products dynamically
function renderProducts() {
    if (!productsData) return;
    
    renderProductSection('popularProducts', productsData.popularProducts);
    renderProductSection('dealsProducts', productsData.deals);
}

// Render a specific product section
function renderProductSection(containerId, products) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    products.forEach(product => {
        const productCard = createProductCard(product);
        container.appendChild(productCard);
    });
}

// Create product card element
function createProductCard(product) {
    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    
    // Check if the product is in the wishlist to set the correct icon
    const isInWishlist = wishlist.some(item => item.id === product.id);
    const heartIconClass = isInWishlist ? 'fas fa-heart active' : 'far fa-heart';
    
    productCard.innerHTML = `
        <img src="${product.image}" alt="${product.name}" class="product-image">
        <div class="product-info">
            <h3 class="product-title">${product.name}</h3>
            <div class="product-price">₹${product.price} <span>(₹${product.discount} off)</span></div>
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

// Initialize products when page loads
document.addEventListener('DOMContentLoaded', loadProducts);

// --- Cart Functions ---

function openCart() {
    document.getElementById('cartModal').style.display = 'flex';
    document.getElementById('paymentSection').style.display = 'none';
    document.getElementById('orderSuccess').style.display = 'none';
    updateCartDisplay();
}

function closeCart() {
    document.getElementById('cartModal').style.display = 'none';
}

function addToCart(name, price, image, id = null) {
    // Check if product already in cart
    const existingProduct = cart.find(item => item.name === name);
    
    if (existingProduct) {
        existingProduct.quantity += 1;
    } else {
        cart.push({
            id: id,
            name: name,
            price: price,
            image: image,
            quantity: 1
        });
    }
    
    // Update cart count
    const newCartCount = cart.reduce((total, item) => total + item.quantity, 0);
    document.querySelector('.cart-item-count').textContent = newCartCount;
    
    // Show toast notification
    showToast(`${name} added to cart!`);
}

function updateCartDisplay() {
    const cartItems = document.querySelector('.cart-items');
    const cartTotal = document.getElementById('cartTotal');
    const qrAmount = document.getElementById('qrAmount');
    
    cartItems.innerHTML = '';
    let total = 0;
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p style="text-align: center; padding: 20px;">Your cart is empty</p>';
    } else {
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
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
    
    cartTotal.textContent = `₹${total}`;
    qrAmount.textContent = `₹${total}`;
    document.querySelector('.qr-code img').src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=QuickBasket-Payment-Total-₹${total}`;
    
    // Update cart count on header
    const newCartCount = cart.reduce((total, item) => total + item.quantity, 0);
    document.querySelector('.cart-item-count').textContent = newCartCount;
}

function changeQuantity(name, change) {
    const product = cart.find(item => item.name === name);
    
    if (product) {
        product.quantity += change;
        
        if (product.quantity <= 0) {
            cart = cart.filter(item => item.name !== name);
        }
        
        updateCartDisplay();
    }
}

function showPaymentSection() {
    if (cart.length === 0) {
        showToast('Your cart is empty!');
        return;
    }
    
    document.getElementById('paymentSection').style.display = 'block';
}

function selectPayment(element) {
    document.querySelectorAll('.payment-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    element.classList.add('selected');
}

function placeOrder() {
    const selectedPayment = document.querySelector('.payment-option.selected');
    if (!selectedPayment) {
        showToast('Please select a payment method');
        return;
    }
    
    document.getElementById('paymentSection').style.display = 'none';
    document.getElementById('orderSuccess').style.display = 'block';
    
    setTimeout(() => {
        cart = [];
        document.querySelector('.cart-item-count').textContent = 0;
    }, 5000);
}


// --- Wishlist Functions (New) ---

function openWishlist() {
    document.getElementById('wishlistModal').style.display = 'flex';
    updateWishlistDisplay();
}

function closeWishlist() {
    document.getElementById('wishlistModal').style.display = 'none';
}

function toggleWishlist(productId, event) {
    // Prevent default if it's a click on the product card
    if (event) event.stopPropagation();
    
    const productIndex = wishlist.findIndex(item => item.id === productId);
    const button = event.currentTarget;
    const heartIcon = button.querySelector('i');
    
    if (productIndex > -1) {
        // Product is in wishlist, remove it
        wishlist.splice(productIndex, 1);
        heartIcon.classList.remove('fas');
        heartIcon.classList.add('far');
        button.classList.remove('active');
        showToast('Removed from wishlist');
    } else {
        // Product is not in wishlist, add it
        const productToAdd = productsData.allProducts.find(p => p.id === productId);
        if (productToAdd) {
            wishlist.push(productToAdd);
            heartIcon.classList.remove('far');
            heartIcon.classList.add('fas');
            button.classList.add('active');
            showToast('Added to wishlist');
        }
    }
    
    updateWishlistDisplay();
}

function removeWishlistItem(productId) {
    wishlist = wishlist.filter(item => item.id !== productId);
    showToast('Item removed from wishlist');
    updateWishlistDisplay();
}

function moveAllToCart() {
    if (wishlist.length === 0) {
        showToast('Wishlist is empty!');
        return;
    }
    
    wishlist.forEach(item => {
        // Move item to cart, set quantity to 1
        addToCart(item.name, item.price, item.image, item.id);
    });
    
    wishlist = []; // Clear wishlist after moving
    
    showToast('All items moved to cart!');
    updateWishlistDisplay();
    closeWishlist();
    openCart(); // Optional: Open cart after moving items
}


function updateWishlistDisplay() {
    const wishlistCountElement = document.querySelector('.wishlist-count');
    const wishlistItemsContainer = document.querySelector('.wishlist-items');

    // 1. Update count in header
    if (wishlistCountElement) {
        wishlistCountElement.textContent = wishlist.length;
    }

    // 2. Update modal content
    if (!wishlistItemsContainer) return;

    wishlistItemsContainer.innerHTML = '';
    
    if (wishlist.length === 0) {
        wishlistItemsContainer.innerHTML = '<p style="text-align: center; padding: 20px;">Your wishlist is empty</p>';
    } else {
        wishlist.forEach(item => {
            const wishlistItem = document.createElement('div');
            wishlistItem.className = 'wishlist-item';
            
            // Look up description from original product data for modal display
            const productDetail = productsData.allProducts.find(p => p.id === item.id);
            const description = productDetail ? productDetail.description : 'Product details unavailable.';

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

    // 3. Re-render the main product cards to update the heart icons
    renderProducts();
}


// --- Utility Functions ---

function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function openUserModal() {
    document.getElementById('userModal').style.display = 'flex';
}

function switchTab(tabName) {
    document.querySelectorAll('.user-form').forEach(form => {
        form.classList.remove('active');
    });
    
    document.querySelectorAll('.user-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    if (tabName === 'login') {
        document.getElementById('loginForm').classList.add('active');
        document.querySelectorAll('.user-tab')[0].classList.add('active');
    } else {
        document.getElementById('signupForm').classList.add('active');
        document.querySelectorAll('.user-tab')[1].classList.add('active');
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const cartModal = document.getElementById('cartModal');
    const userModal = document.getElementById('userModal');
    const wishlistModal = document.getElementById('wishlistModal');
    
    if (event.target === cartModal) {
        closeCart();
    }
    
    if (event.target === userModal) {
        userModal.style.display = 'none';
    }

    if (event.target === wishlistModal) {
        closeWishlist();
    }
};

// Form submission handlers
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        showToast('Login successful!');
        document.getElementById('userModal').style.display = 'none';
    });
    
    document.getElementById('signupForm').addEventListener('submit', function(e) {
        e.preventDefault();
        showToast('Account created successfully!');
        document.getElementById('userModal').style.display = 'none';
    });
});