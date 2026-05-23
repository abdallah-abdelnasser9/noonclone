// Global JavaScript for Noon Clone

// Show toast notification
function showToast(message, type = 'success') {
    const toastEl = document.getElementById('liveToast');
    const toastBody = toastEl.querySelector('.toast-body');
    const toastHeader = toastEl.querySelector('.toast-header');
    
    toastBody.textContent = message;
    
    if (type === 'success') {
        toastHeader.style.backgroundColor = '#28a745';
        toastHeader.style.color = 'white';
    } else if (type === 'error') {
        toastHeader.style.backgroundColor = '#dc3545';
        toastHeader.style.color = 'white';
    } else {
        toastHeader.style.backgroundColor = '#ffc107';
        toastHeader.style.color = '#000';
    }
    
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
}

// Show loading spinner
function showLoading() {
    let spinner = document.querySelector('.spinner-overlay');
    if (!spinner) {
        spinner = document.createElement('div');
        spinner.className = 'spinner-overlay';
        spinner.innerHTML = '<div class="spinner-border text-warning" style="width: 3rem; height: 3rem;" role="status"></div>';
        document.body.appendChild(spinner);
    }
    spinner.classList.add('active');
}

function hideLoading() {
    const spinner = document.querySelector('.spinner-overlay');
    if (spinner) {
        spinner.classList.remove('active');
    }
}

// Add to cart functionality
document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', async function(e) {
        e.preventDefault();
        const productId = this.getAttribute('data-id');
        
        try {
            showLoading();
            const response = await fetch(`/cart/add/${productId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                showToast(data.message, 'success');
                updateCartCount(data.cartCount);
            } else {
                showToast(data.message, 'error');
            }
        } catch (error) {
            showToast('Error adding to cart', 'error');
        } finally {
            hideLoading();
        }
    });
});

// Update cart count in navbar
function updateCartCount(count) {
    const cartBadge = document.querySelector('.navbar .badge');
    if (cartBadge) {
        if (count > 0) {
            cartBadge.textContent = count;
            cartBadge.style.display = 'inline-block';
        } else {
            cartBadge.style.display = 'none';
        }
    }
}

// Update cart quantity
async function updateCartQuantity(productId, quantity) {
    try {
        const response = await fetch('/cart/update', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ productId, quantity })
        });
        
        const data = await response.json();
        
        if (data.success) {
            location.reload();
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        showToast('Error updating cart', 'error');
    }
}

// Remove from cart
async function removeFromCart(productId) {
    if (!confirm('Are you sure you want to remove this item?')) return;
    
    try {
        const response = await fetch(`/cart/remove/${productId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message, 'success');
            location.reload();
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        showToast('Error removing item', 'error');
    }
}

// Add to wishlist
async function addToWishlist(productId) {
    try {
        const response = await fetch(`/user/wishlist/add/${productId}`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message, 'success');
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        showToast('Error adding to wishlist', 'error');
    }
}

// Remove from wishlist
async function removeFromWishlist(productId) {
    try {
        const response = await fetch(`/user/wishlist/remove/${productId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message, 'success');
            location.reload();
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        showToast('Error removing from wishlist', 'error');
    }
}

// Submit review
async function submitReview(productId, rating, comment) {
    try {
        const response = await fetch(`/products/${productId}/review`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ rating, comment })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message, 'success');
            setTimeout(() => location.reload(), 1500);
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        showToast('Error submitting review', 'error');
    }
}

// Dark mode toggle
function initDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        // Check for saved dark mode preference
        if (localStorage.getItem('darkMode') === 'enabled') {
            document.body.classList.add('dark-mode');
            darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
        
        darkModeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            
            if (document.body.classList.contains('dark-mode')) {
                localStorage.setItem('darkMode', 'enabled');
                darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            } else {
                localStorage.setItem('darkMode', 'disabled');
                darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            }
        });
    }
}

// Payment method selection
function initPaymentMethods() {
    const paymentMethods = document.querySelectorAll('.payment-method-card');
    if (paymentMethods) {
        paymentMethods.forEach(method => {
            method.addEventListener('click', function() {
                paymentMethods.forEach(m => m.classList.remove('selected'));
                this.classList.add('selected');
                document.getElementById('paymentMethod').value = this.dataset.method;
                
                // Show/hide credit card form
                const creditCardForm = document.getElementById('creditCardForm');
                if (creditCardForm) {
                    if (this.dataset.method === 'Fake Credit Card') {
                        creditCardForm.style.display = 'block';
                    } else {
                        creditCardForm.style.display = 'none';
                    }
                }
            });
        });
    }
}

// Filter products
function applyFilters() {
    const category = document.getElementById('categoryFilter')?.value || '';
    const sort = document.getElementById('sortFilter')?.value || '';
    const minPrice = document.getElementById('minPrice')?.value || '';
    const maxPrice = document.getElementById('maxPrice')?.value || '';
    
    let url = '/products/shop?';
    if (category && category !== 'All') url += `category=${category}&`;
    if (sort) url += `sort=${sort}&`;
    if (minPrice) url += `minPrice=${minPrice}&`;
    if (maxPrice) url += `maxPrice=${maxPrice}&`;
    
    window.location.href = url;
}

// Product image gallery
function initProductGallery() {
    const mainImage = document.getElementById('mainProductImage');
    const thumbnails = document.querySelectorAll('.product-thumbnail');
    
    if (mainImage && thumbnails) {
        thumbnails.forEach(thumb => {
            thumb.addEventListener('click', function() {
                mainImage.src = this.src;
                thumbnails.forEach(t => t.classList.remove('border-warning'));
                this.classList.add('border-warning');
            });
        });
    }
}

// Quantity input handlers
function initQuantityHandlers() {
    document.querySelectorAll('.quantity-input').forEach(input => {
        const decreaseBtn = input.parentElement.querySelector('.decrease-quantity');
        const increaseBtn = input.parentElement.querySelector('.increase-quantity');
        const productId = input.dataset.productId;
        
        if (decreaseBtn) {
            decreaseBtn.addEventListener('click', () => {
                let value = parseInt(input.value);
                if (value > 1) {
                    input.value = value - 1;
                    updateCartQuantity(productId, input.value);
                }
            });
        }
        
        if (increaseBtn) {
            increaseBtn.addEventListener('click', () => {
                let value = parseInt(input.value);
                input.value = value + 1;
                updateCartQuantity(productId, input.value);
            });
        }
        
        input.addEventListener('change', () => {
            let value = parseInt(input.value);
            if (value < 1) value = 1;
            input.value = value;
            updateCartQuantity(productId, value);
        });
    });
}

// Initialize all functionality when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    initPaymentMethods();
    initProductGallery();
    initQuantityHandlers();
    
    // Add event listeners for filters
    const filterButton = document.getElementById('applyFilters');
    if (filterButton) {
        filterButton.addEventListener('click', applyFilters);
    }
    
    // Star rating input
    const stars = document.querySelectorAll('.rating-input i');
    if (stars.length) {
        stars.forEach(star => {
            star.addEventListener('mouseover', function() {
                const value = this.dataset.value;
                stars.forEach((s, index) => {
                    if (index < value) {
                        s.classList.remove('far');
                        s.classList.add('fas');
                    } else {
                        s.classList.remove('fas');
                        s.classList.add('far');
                    }
                });
            });
            
            star.addEventListener('click', function() {
                const rating = this.dataset.value;
                document.getElementById('ratingValue').value = rating;
                
                stars.forEach((s, index) => {
                    if (index < rating) {
                        s.classList.remove('far');
                        s.classList.add('fas');
                    } else {
                        s.classList.remove('fas');
                        s.classList.add('far');
                    }
                });
            });
        });
    }
});

// Smooth scroll to top
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Add scroll to top button
window.addEventListener('scroll', () => {
    const scrollBtn = document.getElementById('scrollToTop');
    if (scrollBtn) {
        if (window.pageYOffset > 300) {
            scrollBtn.style.display = 'block';
        } else {
            scrollBtn.style.display = 'none';
        }
    }
});