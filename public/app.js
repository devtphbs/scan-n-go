// Main App.js - Scanner and Cart Functionality

// Global variables
let html5QrcodeScanner = null;
let cart = [];
let realtimeSubscription = null;
let currentUser = null;
// Stripe configuration
const STRIPE_PUBLIC_KEY = 'pk_live_51StQf0HnianphuhfTCqWxAKfom0nAcsgq5av4C3mBRmGYHfK5OKT9TBe1vweCSzzuaWElJKKrwafEjpKfTq2dLW900xAlEaH8y'; // Replace with your Stripe public key
let stripe = null;

// Initialize Stripe if key is provided
if (STRIPE_PUBLIC_KEY && !STRIPE_PUBLIC_KEY.includes('your_stripe')) {
    stripe = Stripe(STRIPE_PUBLIC_KEY);
}

// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const adminBtn = document.getElementById('adminBtn');
const userEmail = document.getElementById('userEmail');
const scanResult = document.getElementById('scan-result');
const cartItems = document.getElementById('cart-items');
const totalPrice = document.getElementById('total-price');
const clearCartBtn = document.getElementById('clear-cart');
const checkoutBtn = document.getElementById('checkout');
const displayCurrencySelect = document.getElementById('display-currency');

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    console.log('App initializing...');
    console.log('Supabase client:', window.supabaseClient);
    
    await initializeAuth();
    initializeScanner();
    loadCart();
    setupEventListeners();
    setupRealtimeSubscription();
});

// Authentication
async function initializeAuth() {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    
    if (session) {
        currentUser = session.user;
        updateAuthUI(true);
    } else {
        updateAuthUI(false);
    }

    // Listen for auth changes
    window.supabaseClient.auth.onAuthStateChange((event, session) => {
        currentUser = session?.user || null;
        updateAuthUI(!!session);
    });
}

function updateAuthUI(isLoggedIn) {
    if (isLoggedIn && currentUser) {
        userEmail.textContent = currentUser.email;
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
        
        // Show admin button only for admin email
        if (currentUser.email === 'hildingws2013@gmail.com') {
            adminBtn.style.display = 'inline-block';
        } else {
            adminBtn.style.display = 'none';
        }
    } else {
        userEmail.textContent = 'Not logged in';
        loginBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
        adminBtn.style.display = 'none';
    }
}

// Scanner initialization
function initializeScanner() {
    html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-reader",
        { 
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
        }
    );

    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
}

function onScanSuccess(decodedText, decodedResult) {
    console.log(`Scan result: ${decodedText}`, decodedResult);
    handleBarcodeScan(decodedText);
}

function onScanFailure(error) {
    // Scan failure is normal when no barcode is visible - silently ignore
}

// Handle barcode scan
async function handleBarcodeScan(barcode) {
    try {
        showScanResult('Scanning...', 'info');
        
        // Validate barcode format
        if (!validateEAN13Barcode(barcode)) {
            showScanResult('Invalid barcode format', 'error');
            return;
        }

        // Query product from database
        const { data: product, error } = await window.supabaseClient
            .from('products')
            .select('*')
            .eq('barcode', barcode)
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (!product) {
            showScanResult('Product not found', 'error');
            return;
        }

        // Check stock
        if (product.stock <= 0) {
            showScanResult('Product out of stock', 'error');
            return;
        }

        // Add to cart
        await addToCart(product);
        
        // Update stock in database
        await updateProductStock(product.id, product.stock - 1);
        
        // Play success beep
        playBeep();
        
        showScanResult(`Added: ${product.name}`, 'success');
        
        // Clear result after 3 seconds
        setTimeout(() => {
            scanResult.textContent = '';
            scanResult.className = 'scan-result';
        }, 3000);

    } catch (error) {
        console.error('Error handling scan:', error);
        showScanResult('Error processing scan', 'error');
    }
}

function showScanResult(message, type) {
    scanResult.textContent = message;
    scanResult.className = `scan-result ${type}`;
}

// Currency conversion rates (approximate - in production, use an API)
const CURRENCY_RATES = {
    'USD': 1,
    'EUR': 0.92,
    'GBP': 0.79,
    'CHF': 0.88,
    'SEK': 10.35,
    'NOK': 10.52,
    'DKK': 6.91,
    'PLN': 3.97,
    'CZK': 22.80,
    'HUF': 346.50,
    'RON': 4.60,
    'BGN': 1.80,
    'HRK': 7.00,
    'ISK': 138.50
};

const CURRENCY_SYMBOLS = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'CHF': 'CHF',
    'SEK': 'kr',
    'NOK': 'kr',
    'DKK': 'kr',
    'PLN': 'zł',
    'CZK': 'Kč',
    'HUF': 'Ft',
    'RON': 'lei',
    'BGN': 'лв',
    'HRK': 'kn',
    'ISK': 'kr'
};

// Display currency (can be changed by user preference)
let displayCurrency = localStorage.getItem('scanngo_display_currency') || 'USD';

// Convert price to display currency
function convertPrice(price, fromCurrency, toCurrency = displayCurrency) {
    if (fromCurrency === toCurrency) return price;
    const rateFrom = CURRENCY_RATES[fromCurrency] || 1;
    const rateTo = CURRENCY_RATES[toCurrency] || 1;
    return (price / rateFrom) * rateTo;
}

// Format price with currency symbol
function formatPrice(price, currency = displayCurrency) {
    const symbol = CURRENCY_SYMBOLS[currency] || '$';
    if (['SEK', 'NOK', 'DKK', 'ISK'].includes(currency)) {
        return `${price.toFixed(2)} ${symbol}`;
    } else if (['PLN', 'CZK', 'HUF', 'RON', 'BGN', 'HRK'].includes(currency)) {
        return `${price.toFixed(2)} ${symbol}`;
    }
    return `${symbol}${price.toFixed(2)}`;
}

// Cart functionality
function loadCart() {
    const savedCart = localStorage.getItem('scanngo-cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartUI();
    }
}

function saveCart() {
    localStorage.setItem('scanngo-cart', JSON.stringify(cart));
}

async function addToCart(product) {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }
    
    saveCart();
    updateCartUI();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartUI();
}

function updateQuantity(productId, newQuantity) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        if (newQuantity <= 0) {
            removeFromCart(productId);
        } else {
            item.quantity = newQuantity;
            saveCart();
            updateCartUI();
        }
    }
}

function clearCart() {
    cart = [];
    saveCart();
    updateCartUI();
}

function calculateTotal() {
    return cart.reduce((total, item) => {
        const price = calculateDiscountedPrice(item);
        const convertedPrice = convertPrice(price, item.currency || 'USD', displayCurrency);
        return total + (convertedPrice * item.quantity);
    }, 0);
}

function calculateDiscountedPrice(product) {
    let price = product.price;
    
    if (product.discount_type === 'percent' && product.discount_value > 0) {
        price = price * (1 - product.discount_value);
    }
    
    return price;
}

function updateCartUI() {
    cartItems.innerHTML = '';
    
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🛒</div>
                <div class="empty-state-text">Your cart is empty</div>
                <div class="empty-state-subtext">Scan products to add them to your cart</div>
            </div>
        `;
        totalPrice.textContent = formatPrice(0);
        return;
    }

    cart.forEach(item => {
        const finalPrice = calculateDiscountedPrice(item);
        const convertedPrice = convertPrice(finalPrice, item.currency || 'USD', displayCurrency);
        const originalPrice = convertPrice(item.price, item.currency || 'USD', displayCurrency);
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <img src="${item.image || 'https://picsum.photos/seed/' + item.id + '/60/60.jpg'}" alt="${item.name}">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">${formatPrice(convertedPrice)} ${item.currency && item.currency !== displayCurrency ? `<small>(${item.currency})</small>` : ''}</div>
                <div class="cart-item-stock">Stock: ${item.stock}</div>
                ${item.discount_type !== 'none' ? `<div class="discount">${item.discount_type === 'percent' ? (item.discount_value * 100).toFixed(0) + '% off' : ''}</div>` : ''}
            </div>
            <div class="cart-item-controls">
                <div class="quantity-control">
                    <button class="quantity-btn" onclick="updateQuantity('${item.id}', ${item.quantity - 1})">-</button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
                </div>
                <button class="btn btn-danger" onclick="removeFromCart('${item.id}')">Remove</button>
            </div>
        `;
        cartItems.appendChild(cartItem);
    });

    totalPrice.textContent = formatPrice(calculateTotal());
}

// Realtime subscription
function setupRealtimeSubscription() {
    realtimeSubscription = window.supabaseClient
        .channel('products-changes')
        .on('postgres_changes', 
            { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'products' 
            }, 
            (payload) => {
                handleRealtimeUpdate(payload);
            }
        )
        .subscribe();
}

function handleRealtimeUpdate(payload) {
    const updatedProduct = payload.new;
    
    // Update cart item if it exists
    const cartItem = cart.find(item => item.id === updatedProduct.id);
    if (cartItem) {
        cartItem.stock = updatedProduct.stock;
        cartItem.price = updatedProduct.price;
        cartItem.discount_type = updatedProduct.discount_type;
        cartItem.discount_value = updatedProduct.discount_value;
        
        saveCart();
        updateCartUI();
        
        // Show notification if stock is low
        if (updatedProduct.stock <= 0) {
            showScanResult(`${updatedProduct.name} is now out of stock`, 'error');
        }
    }
}

// Update product stock in database
async function updateProductStock(productId, newStock) {
    try {
        const { error } = await window.supabaseClient
            .from('products')
            .update({ stock: newStock })
            .eq('id', productId);

        if (error) throw error;
    } catch (error) {
        console.error('Error updating stock:', error);
    }
}

// Event listeners
function setupEventListeners() {
    loginBtn.addEventListener('click', () => {
        window.location.href = 'login.html';
    });

    logoutBtn.addEventListener('click', async () => {
        await window.supabaseClient.auth.signOut();
        window.location.href = 'index.html';
    });

    adminBtn.addEventListener('click', () => {
        window.location.href = 'admin.html';
    });

    clearCartBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear your cart?')) {
            clearCart();
        }
    });

    // Currency selector
    if (displayCurrencySelect) {
        // Set initial value
        displayCurrencySelect.value = displayCurrency;
        
        displayCurrencySelect.addEventListener('change', (e) => {
            displayCurrency = e.target.value;
            localStorage.setItem('scanngo_display_currency', displayCurrency);
            updateCartUI();
        });
    }

    checkoutBtn.addEventListener('click', async () => {
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        const total = calculateTotal();
        
        if (!stripe) {
            // Demo mode - no Stripe key configured
            const message = `Checkout Total: ${formatPrice(total)}\n\nStripe not configured. This is demo mode.`;
            if (confirm(message)) {
                alert('Thank you for your purchase! (Demo mode)');
                clearCart();
            }
            return;
        }

        // Real Stripe checkout - create session directly
        try {
            checkoutBtn.disabled = true;
            checkoutBtn.textContent = 'Processing...';

            // Convert all cart items to USD for Stripe
            const lineItems = cart.map(item => {
                const usdPrice = convertPrice(item.price, item.currency || 'USD', 'USD');
                return {
                    price_data: {
                        currency: 'usd',
                        product_data: { name: item.name },
                        unit_amount: Math.round(usdPrice * 100), // Convert to cents
                    },
                    quantity: item.quantity
                };
            });

            // Check if Edge Function exists, if not use fallback
            let session;
            try {
                const { data, error } = await window.supabaseClient.functions.invoke('create-checkout', {
                    body: {
                        items: lineItems,
                        success_url: window.location.origin + '/success.html',
                        cancel_url: window.location.origin
                    }
                });
                if (error) throw error;
                session = data;
            } catch (funcError) {
                // Edge Function not available - use demo mode for now
                console.warn('Edge Function not available, using demo mode');
                const totalUSD = convertPrice(total, displayCurrency, 'USD');
                const message = `Checkout Total: ${formatPrice(total)} (${formatPrice(totalUSD, 'USD')})\n\nPayment processing not yet configured. This is demo mode.`;
                if (confirm(message)) {
                    alert('Thank you for your purchase! (Demo mode)');
                    clearCart();
                }
                checkoutBtn.disabled = false;
                checkoutBtn.textContent = 'Checkout';
                return;
            }

            // Redirect to Stripe Checkout
            const result = await stripe.redirectToCheckout({
                sessionId: session.id
            });

            if (result.error) {
                throw result.error;
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert('Error during checkout: ' + error.message);
            checkoutBtn.disabled = false;
            checkoutBtn.textContent = 'Checkout';
        }
    });
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (realtimeSubscription) {
        window.supabaseClient.removeChannel(realtimeSubscription);
    }
    if (html5QrcodeScanner) {
        html5QrcodeScanner.clear();
    }
});
