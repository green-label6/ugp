let cart = JSON.parse(localStorage.getItem('cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
let categoriesData = {};
let allProducts = [];
let currentView = 'grid-2';

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    setupEventListeners();
    updateCartUI();
    updateWishlistUI();
    setupMobileMenu();
    setupBackToTop();
    setupViewOptions();
});

async function loadProducts() {
    try {
        const response = await fetch('products_by_category.json');
        const data = await response.json();
        categoriesData = data.categories;
        
        flattenProducts();
        renderNavigation();
        renderSidebar();
        renderDynamicSections();
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('dynamic-sections').innerHTML = `
            <div class="error-msg">
                <i class="fas fa-exclamation-circle"></i>
                <p>عذراً، حدث خطأ أثناء تحميل المنتجات.</p>
            </div>`;
    }
}

function flattenProducts() {
    allProducts = [];
    let idCounter = 1;
    for (const categoryName in categoriesData) {
        for (const subcategoryName in categoriesData[categoryName]) {
            categoriesData[categoryName][subcategoryName].forEach(product => {
                const flatProduct = {
                    ...product,
                    id: idCounter++,
                    category: categoryName,
                    subcategory: subcategoryName,
                    priceNum: parseFloat(product.price) || 0
                };
                allProducts.push(flatProduct);
            });
        }
    }
}

function renderNavigation() {
    const mainNav = document.getElementById('mainNavLinks');
    const mobileNav = document.getElementById('mobileNavLinks');
    
    let navHtml = '<li><a href="#home" class="nav-link active">الرئيسية</a></li>';
    let mobileHtml = '<li><a href="#home" class="mobile-nav-link active">الرئيسية</a></li>';
    
    Object.keys(categoriesData).forEach((cat, index) => {
        const catId = `cat-${index}`;
        navHtml += `<li><a href="#${catId}" class="nav-link">${cat}</a></li>`;
        mobileHtml += `<li><a href="#${catId}" class="mobile-nav-link">${cat}</a></li>`;
    });
    
    if (mainNav) mainNav.innerHTML = navHtml;
    if (mobileNav) mobileNav.innerHTML = mobileHtml;
}

function renderSidebar() {
    const sidebarLinks = document.getElementById('sidebarLinks');
    if (!sidebarLinks) return;
    
    let sidebarHtml = '';
    Object.keys(categoriesData).forEach((categoryName, catIndex) => {
        const catId = `cat-${catIndex}`;
        sidebarHtml += `
            <li class="sidebar-item">
                <a href="#${catId}" class="sidebar-cat-link">${categoryName}</a>
                <div class="sidebar-sub-links">
        `;
        
        for (const subcategoryName in categoriesData[categoryName]) {
            sidebarHtml += `<a href="#${catId}" class="sidebar-sub-link" onclick="filterBySubcategory('${categoryName}', '${subcategoryName}')">${subcategoryName}</a>`;
        }
        
        sidebarHtml += `</div></li>`;
    });
    
    sidebarLinks.innerHTML = sidebarHtml;
}

function renderDynamicSections() {
    const container = document.getElementById('dynamic-sections');
    if (!container) return;
    container.innerHTML = '';
    
    Object.keys(categoriesData).forEach((categoryName, catIndex) => {
        const catId = `cat-${catIndex}`;
        const section = document.createElement('section');
        section.className = 'products-section';
        section.id = catId;
        
        let sectionHtml = `
            <div class="section-header">
                <h2 class="section-title">${categoryName}</h2>
            </div>
        `;
        
        for (const subcategoryName in categoriesData[categoryName]) {
            const products = categoriesData[categoryName][subcategoryName];
            if (products.length === 0) continue;
            
            sectionHtml += `
                <div class="subcategory-group">
                    <h3 class="subcategory-title">${subcategoryName}</h3>
                    <div class="products-grid ${currentView}">
            `;
            
            products.forEach(product => {
                const flatProduct = allProducts.find(p => p.name === product.name && p.image === product.image);
                sectionHtml += createProductCardHtml(flatProduct);
            });
            
            sectionHtml += `</div></div>`;
        }
        
        section.innerHTML = sectionHtml;
        container.appendChild(section);
    });
    
    // تفعيل التحميل الكسول بعد رندر الأقسام
    initLazyLoading();
}

function initLazyLoading() {
    const images = document.querySelectorAll('.lazy-img');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '50px 0px',
        threshold: 0.01
    });

    images.forEach(img => imageObserver.observe(img));
}

function createProductCardHtml(product) {
    const formattedPrice = formatPrice(product.price);
    const isWishlisted = wishlist.some(item => item.id === product.id);
    // استخدام data-src للتحميل الكسول المتقدم
    return `
        <div class="product-card">
            <button class="wishlist-btn ${isWishlisted ? 'active' : ''}" onclick="toggleWishlist(${product.id}); event.stopPropagation();" title="أضف للمفضلة">
                <i class="${isWishlisted ? 'fas' : 'far'} fa-heart"></i>
            </button>
            <div class="product-img" onclick="showProductDetails(${product.id})">
                <img data-src="${product.image}" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E" 
                     alt="${product.name}" class="lazy-img"
                     onerror="this.onerror=null; this.src='https://via.placeholder.com/400x400?text=Image+Not+Found';">
            </div>
            <div class="product-info">
                <span class="product-category">${product.subcategory}</span>
                <h3 class="product-name" onclick="showProductDetails(${product.id})">${product.name}</h3>
                <p class="product-description" onclick="showProductDetails(${product.id})">${product.description.substring(0, 60)}...</p>
                <div class="product-footer">
                    <div class="product-price">${formattedPrice}</div>
                    <button class="add-to-cart" onclick="addToCart(${product.id}); event.stopPropagation();" title="إضافة للسلة">
                        <i class="fas fa-cart-plus"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function formatPrice(price) {
    const p = parseFloat(price);
    if (isNaN(p) || p === 0) return "يحدد لاحقاً";
    return p.toLocaleString('ar-IQ') + " د.ع";
}

function showProductDetails(id) {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;
    
    const modal = document.getElementById('productModal');
    const modalImg = document.getElementById('modalImage');
    modalImg.src = product.image;
    modalImg.onerror = function() { this.src = 'https://via.placeholder.com/600x600?text=Image+Not+Found'; };
    
    document.getElementById('modalCategory').textContent = `${product.category} - ${product.subcategory}`;
    document.getElementById('modalName').textContent = product.name;
    document.getElementById('modalPrice').textContent = formatPrice(product.price);
    document.getElementById('modalDescription').textContent = product.description;
    
    const addToCartBtn = document.getElementById('modalAddToCart');
    addToCartBtn.onclick = () => {
        const qty = parseInt(document.getElementById('productQty').value) || 1;
        addToCart(product.id, qty);
        modal.style.display = 'none';
    };
    
    modal.style.display = 'block';
}

function addToCart(id, quantity = 1) {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === id);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.priceNum,
            image: product.image,
            quantity: quantity
        });
    }
    
    saveCart();
    updateCartUI();
    showNotification(`تمت إضافة ${product.name} إلى السلة`);
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartTotalValue = document.getElementById('cartTotalValue');
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCount) cartCount.textContent = totalItems;
    
    if (cartItems) {
        if (cart.length === 0) {
            cartItems.innerHTML = '<div class="empty-cart">السلة فارغة</div>';
        } else {
            cartItems.innerHTML = cart.map(item => `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/100x100?text=No+Img'">
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <p>${formatPrice(item.price)} × ${item.quantity}</p>
                    </div>
                    <button class="remove-item" onclick="removeFromCart(${item.id})">&times;</button>
                </div>
            `).join('');
        }
    }
    
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (cartTotalValue) cartTotalValue.textContent = formatPrice(totalAmount);
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    updateCartUI();
}

function toggleWishlist(id) {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;
    
    const index = wishlist.findIndex(item => item.id === id);
    if (index > -1) {
        wishlist.splice(index, 1);
        showNotification(`تمت إزالة ${product.name} من المفضلة`);
    } else {
        wishlist.push(product);
        showNotification(`تمت إضافة ${product.name} إلى المفضلة`);
    }
    
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    updateWishlistUI();
    renderDynamicSections(); // لتحديث أيقونة القلب في الشبكة
}

function updateWishlistUI() {
    const wishlistCount = document.getElementById('wishlistCount');
    const wishlistItems = document.getElementById('wishlistItems');
    
    if (wishlistCount) wishlistCount.textContent = wishlist.length;
    
    if (wishlistItems) {
        if (wishlist.length === 0) {
            wishlistItems.innerHTML = '<div class="empty-cart">المفضلة فارغة</div>';
        } else {
            wishlistItems.innerHTML = wishlist.map(item => `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/100x100?text=No+Img'">
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <p>${formatPrice(item.price)}</p>
                    </div>
                    <div class="wishlist-item-actions">
                        <button class="add-to-cart-sm" onclick="addToCart(${item.id})" title="إضافة للسلة"><i class="fas fa-cart-plus"></i></button>
                        <button class="remove-item" onclick="toggleWishlist(${item.id})">&times;</button>
                    </div>
                </div>
            `).join('');
        }
    }
}

function setupViewOptions() {
    const viewBtns = document.querySelectorAll('.view-btn');
    viewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            viewBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentView = btn.dataset.view;
            renderDynamicSections();
        });
    });
}

function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => performSearch(e.target.value));
    }
    
    // سلة المشتريات
    const cartIcon = document.getElementById('cartIcon');
    const cartSidebar = document.getElementById('cartSidebar');
    const closeCart = document.getElementById('closeCart');
    const continueShopping = document.getElementById('continueShopping');
    
    if (cartIcon) cartIcon.onclick = (e) => { e.preventDefault(); cartSidebar.classList.add('active'); };
    if (closeCart) closeCart.onclick = () => cartSidebar.classList.remove('active');
    if (continueShopping) continueShopping.onclick = () => cartSidebar.classList.remove('active');
    
    // المفضلة
    const wishlistIcon = document.getElementById('wishlistIcon');
    const wishlistSidebar = document.getElementById('wishlistSidebar');
    const closeWishlist = document.getElementById('closeWishlist');
    const closeWishlistBtn = document.getElementById('closeWishlistBtn');
    
    if (wishlistIcon) wishlistIcon.onclick = (e) => { e.preventDefault(); wishlistSidebar.classList.add('active'); };
    if (closeWishlist) closeWishlist.onclick = () => wishlistSidebar.classList.remove('active');
    if (closeWishlistBtn) closeWishlistBtn.onclick = () => wishlistSidebar.classList.remove('active');
    
    // المودال
    const closeModal = document.getElementById('closeModal');
    if (closeModal) closeModal.onclick = () => document.getElementById('productModal').style.display = 'none';
    
    window.onclick = (event) => {
        if (event.target.classList.contains('modal')) event.target.style.display = 'none';
        if (event.target.classList.contains('cart-sidebar')) event.target.classList.remove('active');
    };
    
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) checkoutBtn.onclick = sendWhatsAppOrder;

    document.querySelector('.qty-btn.plus')?.addEventListener('click', () => {
        const input = document.getElementById('productQty');
        input.value = parseInt(input.value) + 1;
    });
    
    document.querySelector('.qty-btn.minus')?.addEventListener('click', () => {
        const input = document.getElementById('productQty');
        if (parseInt(input.value) > 1) input.value = parseInt(input.value) - 1;
    });
}

function performSearch(query) {
    const resultsContainer = document.getElementById('searchResults');
    if (!query.trim()) {
        resultsContainer.style.display = 'none';
        return;
    }
    
    const filtered = allProducts.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase()) || 
        p.description.toLowerCase().includes(query.toLowerCase()) ||
        p.category.toLowerCase().includes(query.toLowerCase()) ||
        p.subcategory.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 10);
    
    if (filtered.length > 0) {
        resultsContainer.innerHTML = filtered.map(p => `
            <div class="search-result-item" onclick="showProductDetails(${p.id}); document.getElementById('searchResults').style.display='none';">
                <img src="${p.image}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/50x50?text=No+Img'">
                <div class="search-result-info">
                    <h4>${p.name}</h4>
                    <span class="result-category">${p.subcategory}</span>
                    <p class="result-price">${formatPrice(p.price)}</p>
                </div>
            </div>
        `).join('');
        resultsContainer.style.display = 'block';
    } else {
        resultsContainer.innerHTML = '<div class="no-results">لا توجد نتائج</div>';
        resultsContainer.style.display = 'block';
    }
}

function sendWhatsAppOrder() {
    if (cart.length === 0) {
        alert('السلة فارغة!');
        return;
    }
    
    let message = "طلب جديد من الموقع:\n\n";
    cart.forEach(item => {
        message += `- ${item.name} (${item.quantity} قطعة) - ${formatPrice(item.price * item.quantity)}\n`;
    });
    
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    message += `\nالإجمالي: ${formatPrice(totalAmount)}`;
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/9647839277919?text=${encodedMessage}`, '_blank');
}

function setupMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    const closeMenu = document.getElementById('closeMenu');
    
    if (menuToggle) menuToggle.onclick = () => mobileMenu.classList.add('active');
    if (closeMenu) closeMenu.onclick = () => mobileMenu.classList.remove('active');
}

function setupBackToTop() {
    const backToTop = document.getElementById('backToTop');
    if (!backToTop) return;
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTop.classList.add('show');
        } else {
            backToTop.classList.remove('show');
        }
    });
    backToTop.onclick = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
}

function showNotification(text) {
    let notification = document.querySelector('.notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    notification.innerHTML = `<i class="fas fa-check-circle"></i> ${text}`;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}
