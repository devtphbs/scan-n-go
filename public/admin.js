// Admin Panel - Product Management

// Global variables
let currentUser = null;
let products = [];

// DOM Elements
const userEmail = document.getElementById('userEmail');
const logoutBtn = document.getElementById('logoutBtn');
const productForm = document.getElementById('product-form');
const productsList = document.getElementById('products-list');
const generatedBarcode = document.getElementById('generated-barcode');
const barcodeCanvas = document.getElementById('barcode-canvas');
const barcodeNumber = document.getElementById('barcode-number');
const productImageInput = document.getElementById('productImage');
const imagePreview = document.getElementById('imagePreview');
const productCurrency = document.getElementById('productCurrency');

// Initialize admin panel
document.addEventListener('DOMContentLoaded', async () => {
    await checkAdminAccess();
    setupEventListeners();
    loadProducts();
});

// Check if user has admin access
async function checkAdminAccess() {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    
    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    currentUser = session.user;
    
    // Check if user is admin
    if (currentUser.email !== 'hildingws2013@gmail.com') {
        alert('Access denied. Admin privileges required.');
        window.location.href = 'index.html';
        return;
    }

    userEmail.textContent = currentUser.email;
}

// Setup event listeners
function setupEventListeners() {
    logoutBtn.addEventListener('click', async () => {
        await window.supabaseClient.auth.signOut();
        window.location.href = 'index.html';
    });

    productForm.addEventListener('submit', handleAddProduct);
    
    // Image preview functionality
    productImageInput.addEventListener('change', handleImagePreview);
}

// Handle image preview
function handleImagePreview(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            imagePreview.src = event.target.result;
            imagePreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

// Handle add product form submission
async function handleAddProduct(e) {
    e.preventDefault();
    
    try {
        const formData = new FormData(productForm);
        
        // Generate unique barcode
        let barcode;
        let isUnique = false;
        let attempts = 0;
        
        do {
            barcode = generateEAN13Barcode();
            const { data: existing } = await window.supabaseClient
                .from('products')
                .select('id')
                .eq('barcode', barcode)
                .single();
            
            isUnique = !existing;
            attempts++;
            
            if (attempts > 10) {
                throw new Error('Unable to generate unique barcode');
            }
        } while (!isUnique);

        // Handle image upload
        let imageUrl = null;
        const imageFile = productImageInput.files[0];
        
        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `products/${fileName}`;
            
            // Upload to Supabase Storage
            const { error: uploadError } = await window.supabaseClient
                .storage
                .from('product-images')
                .upload(filePath, imageFile);
            
            if (uploadError) throw uploadError;
            
            // Get public URL
            const { data: urlData } = window.supabaseClient
                .storage
                .from('product-images')
                .getPublicUrl(filePath);
            
            imageUrl = urlData.publicUrl;
        }

        // Prepare product data
        const productData = {
            barcode: barcode,
            name: formData.get('name'),
            price: parseFloat(formData.get('price')),
            currency: formData.get('currency') || 'USD',
            image: imageUrl,
            stock: parseInt(formData.get('stock')),
            discount_type: formData.get('discount_type'),
            discount_value: formData.get('discount_value') ? parseFloat(formData.get('discount_value')) : 0
        };

        // Insert product into database
        const { data, error } = await window.supabaseClient
            .from('products')
            .insert([productData])
            .select()
            .single();

        if (error) throw error;

        // Show generated barcode
        showGeneratedBarcode(barcode);
        
        // Reset form
        productForm.reset();
        imagePreview.style.display = 'none';
        
        // Reload products list
        await loadProducts();
        
        alert('Product added successfully!');

    } catch (error) {
        console.error('Error adding product:', error);
        alert('Error adding product: ' + error.message);
    }
}

// Show generated barcode
function showGeneratedBarcode(barcode) {
    barcodeNumber.textContent = barcode;
    generateBarcodeImage(barcode, 'barcode-canvas');
    generatedBarcode.style.display = 'block';
}

// Load all products
async function loadProducts() {
    try {
        const { data, error } = await window.supabaseClient
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        products = data;
        displayProducts();

    } catch (error) {
        console.error('Error loading products:', error);
        productsList.innerHTML = '<div class="empty-state">Error loading products</div>';
    }
}

// Display products in grid
function displayProducts() {
    if (products.length === 0) {
        productsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📦</div>
                <div class="empty-state-text">No products found</div>
                <div class="empty-state-subtext">Add your first product using the form above</div>
            </div>
        `;
        return;
    }

    productsList.innerHTML = products.map(product => `
        <div class="product-card" data-product-id="${product.id}">
            <img src="${product.image || 'https://picsum.photos/seed/' + product.id + '/300/150.jpg'}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p><strong>Price:</strong> $${product.price.toFixed(2)}</p>
            <p><strong>Stock:</strong> ${product.stock}</p>
            <p><strong>Barcode:</strong> <span class="barcode">${product.barcode}</span></p>
            ${product.discount_type !== 'none' ? 
                `<p class="discount">Discount: ${product.discount_type === 'percent' ? (product.discount_value * 100).toFixed(0) + '%' : ''}</p>` : 
                ''
            }
            <div class="product-actions">
                <button class="btn btn-warning" onclick="editProduct('${product.id}')">Edit</button>
                <button class="btn btn-danger" onclick="deleteProduct('${product.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

// Edit product
async function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Fill form with product data
    document.getElementById('productName').value = product.name;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productCurrency').value = product.currency || 'USD';
    // Don't set file input value - instead show image preview if exists
    if (product.image) {
        imagePreview.src = product.image;
        imagePreview.style.display = 'block';
    } else {
        imagePreview.style.display = 'none';
    }
    document.getElementById('productStock').value = product.stock;
    document.getElementById('discountType').value = product.discount_type;
    document.getElementById('discountValue').value = product.discount_value || '';

    // Change form to edit mode
    productForm.onsubmit = (e) => handleUpdateProduct(e, productId);
    
    // Change submit button text
    const submitBtn = productForm.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Update Product';
    
    // Scroll to form
    productForm.scrollIntoView({ behavior: 'smooth' });
}

// Handle update product
async function handleUpdateProduct(e, productId) {
    e.preventDefault();
    
    try {
        const formData = new FormData(productForm);
        
        // Handle image upload if new file selected
        let imageUrl = null;
        const imageFile = productImageInput.files[0];
        
        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `products/${fileName}`;
            
            // Upload to Supabase Storage
            const { error: uploadError } = await window.supabaseClient
                .storage
                .from('product-images')
                .upload(filePath, imageFile);
            
            if (uploadError) throw uploadError;
            
            // Get public URL
            const { data: urlData } = window.supabaseClient
                .storage
                .from('product-images')
                .getPublicUrl(filePath);
            
            imageUrl = urlData.publicUrl;
        }
        
        const updateData = {
            name: formData.get('name'),
            price: parseFloat(formData.get('price')),
            currency: formData.get('currency') || 'USD',
            stock: parseInt(formData.get('stock')),
            discount_type: formData.get('discount_type'),
            discount_value: formData.get('discount_value') ? parseFloat(formData.get('discount_value')) : 0
        };
        
        // Only update image if new one uploaded
        if (imageUrl) {
            updateData.image = imageUrl;
        }

        const { error } = await window.supabaseClient
            .from('products')
            .update(updateData)
            .eq('id', productId);

        if (error) throw error;

        // Reset form to add mode
        resetFormToAddMode();
        
        // Reload products
        await loadProducts();
        
        alert('Product updated successfully!');

    } catch (error) {
        console.error('Error updating product:', error);
        alert('Error updating product: ' + error.message);
    }
}

// Delete product
async function deleteProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) {
        return;
    }

    try {
        const { error } = await window.supabaseClient
            .from('products')
            .delete()
            .eq('id', productId);

        if (error) throw error;

        // Reload products
        await loadProducts();
        
        alert('Product deleted successfully!');

    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product: ' + error.message);
    }
}

// Reset form to add mode
function resetFormToAddMode() {
    productForm.reset();
    productForm.onsubmit = handleAddProduct;
    
    // Change submit button text
    const submitBtn = productForm.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Add Product';
    
    // Hide barcode display and image preview
    generatedBarcode.style.display = 'none';
    imagePreview.style.display = 'none';
    imagePreview.src = '';
    
    // Reset currency to USD
    if (productCurrency) {
        productCurrency.value = 'USD';
    }
}

// Global functions for onclick handlers
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
