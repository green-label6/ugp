let cart = JSON.parse(localStorage.getItem('cart')) || [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let categoriesData = {};
let allProducts = [];
let filteredProducts = [];
let currentView = 'grid-2';
let showingFavorites = false;
let currentSort = 'default';
let priceFilter = { min: 0, max: Infinity };

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    setupEventListeners();
    updateCartUI();
    setupMobileMenu();
    setupBackToTop();
    initLazyLoading();
    setupViewOptions();
    setupSortAndFilter();
});

function setupViewOptions() {
    const viewBtns = document.querySelectorAll('.view-btn[data-view]');
    viewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            viewBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentView = btn.dataset.view;
            applyViewToGrids();
        });
    });

    const favToggle = document.getElementById('favToggle');
    if (favToggle) {
        favToggle.addEventListener('click', () => {
            showingFavorites = !showingFavorites;
            favToggle.classList.toggle('active');
            renderMainContent();
        });
    }
}

function setupSortAndFilter() {
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            renderMainContent();
        });
    }

    const applyPriceBtn = document.getElementById('applyPriceFilter');
    if (applyPriceBtn) {
        applyPriceBtn.addEventListener('click', () => {
            const min = parseFloat(document.getElementById('minPrice').value) || 0;
            const max = parseFloat(document.getElementById('maxPrice').value) || Infinity;
            priceFilter = { min, max };
            renderMainContent();
        });
    }
}

function applyViewToGrids() {
    const grids = document.querySelectorAll('.products-grid');
    grids.forEach(grid => {
        grid.classList.remove('grid-2', 'grid-3', 'list');
        grid.classList.add(currentView);
    });
}

function toggleFavorite(id, event) {
    if (event) event.stopPropagation();
    const index = favorites.indexOf(id);
    if (index === -1) {
        favorites.push(id);
    } else {
        favorites.splice(index, 1);
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    
    const favBtns = document.querySelectorAll(`.fav-btn[data-id="${id}"]`);
    favBtns.forEach(btn => btn.classList.toggle('active'));
    
    if (showingFavorites) renderMainContent();
}

async function loadProducts() {
    try {
        const response = await fetch('products_by_category.json');
        const data = await response.json();
        categoriesData = data.categories;
        flattenProducts();
        renderNavigation();
        renderSidebarCategories();
        renderMainContent();
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('dynamic-sections').innerHTML = `<div class="error-msg"><p>حدث خطأ في تحميل البيانات.</p></div>`;
    }
}

function flattenProducts() {
    allProducts = [];
    let idCounter = 1;
    for (const categoryName in categoriesData) {
        for (const subcategoryName in categoriesData[categoryName]) {
            categoriesData[categoryName][subcategoryName].forEach(product => {
                allProducts.push({
                    ...product,
                    id: idCounter++,
                    category: categoryName,
                    subcategory: subcategoryName,
                    priceNum: parseFloat(product.price) || 0
                });
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
    
    mainNav.innerHTML = navHtml;
    mobileNav.innerHTML = mobileHtml;
}

function renderSidebarCategories() {
    const sidebarCats = document.getElementById('sidebarCategories');
    if (!sidebarCats) return;
    
    let html = '<li class="sidebar-cat-item active" onclick="filterByCategory(\'all\', this)">الكل</li>';
    Object.keys(categoriesData).forEach(cat => {
        html += `<li class="sidebar-cat-item" onclick="filterByCategory('${cat}', this)">${cat}</li>`;
    });
    sidebarCats.innerHTML = html;
}

let activeCategory = 'all';
function filterByCategory(cat, element) {
    activeCategory = cat;
    document.querySelectorAll('.sidebar-cat-item').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
    renderMainContent();
}

function renderMainContent() {
    let products = showingFavorites ? allProducts.filter(p => favorites.includes(p.id)) : allProducts;
    
    // تصفية حسب القسم
    if (activeCategory !== 'all') {
        products = products.filter(p => p.category === activeCategory);
    }
    
    // تصفية حسب السعر
    products = products.filter(p => p.priceNum >= priceFilter.min && p.priceNum <= priceFilter.max);
    
    // الترتيب
    if (currentSort === 'price-asc') {
        products.sort((a, b) => a.priceNum - b.priceNum);
    } else if (currentSort === 'price-desc') {
        products.sort((a, b) => b.priceNum - a.priceNum);
    }
    
    const container = document.getElementById('dynamic-sections');
    if (products.length === 0) {
        container.innerHTML = '<p class="no-results">لا توجد منتجات تطابق بحثك.</p>';
        return;
    }

    if (showingFavorites || activeCategory !== 'all' || currentSort !== 'default' || priceFilter.min > 0 || priceFilter.max < Infinity) {
        // عرض نتائج البحث/التصفية في شبكة واحدة
        container.innerHTML = `
            <section class="products-section">
                <div class="section-header">
                    <h2 class="section-title">${showingFavorites ? 'المفضلة' : 'نتائج التصفية'}</h2>
                </div>
                <div class="products-grid ${currentView}">
                    ${products.map(p => createProductCardHtml(p)).join('')}
                </div>
            </section>
        `;
    } else {
        // العرض الافتراضي المقسم حسب الأقسام
        renderDefaultSections();
    }
}

function renderDefaultSections() {
    const container = document.getElementById('dynamic-sections');
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
            const subcatProducts = allProducts.filter(p => p.category === categoryName && p.subcategory === subcategoryName).slice(0, 8);
            if (subcatProducts.length === 0) continue;
            
            sectionHtml += `
                <div class="subcategory-group">
                    <h3 class="subcategory-title">${subcategoryName}</h3>
                    <div class="products-grid ${currentView}">
                        ${subcatProducts.map(p => createProductCardHtml(p)).join('')}
                    </div>
                </div>
            `;
        }
        section.innerHTML = sectionHtml;
        container.appendChild(section);
    });
}

function getCDNUrl(path) {
    if (!path) return '';
    let cleanPath = path.startsWith('/') ? path.substring(1) : path;
    const encodedPath = cleanPath.split('/').map(part => encodeURIComponent(part)).join('/');
    return `https://cdn.jsdelivr.net/gh/green-label6/ugp@master/${encodedPath}`;
}

function createProductCardHtml(product) {
    const formattedPrice = formatPrice(product.price);
    const cdnUrl = getCDNUrl(product.image);
    const isFav = favorites.includes(product.id);
    
    return `
        <div class="product-card" onclick="showProductDetails(${product.id})">
            <button class="fav-btn ${isFav ? 'active' : ''}" data-id="${product.id}" onclick="toggleFavorite(${product.id}, event)">
                <i class="fas fa-heart"></i>
            </button>
            <div class="product-img">
                <img data-src="${cdnUrl}" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E" 
                     alt="${product.name}" class="lazy-img" onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'">
            </div>
            <div class="product-info">
                <span class="product-category">${product.subcategory}</span>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description.substring(0, 60)}...</p>
                <div class="product-footer">
                    <div class="product-price">${formattedPrice}</div>
                    <button class="add-to-cart" onclick="addToCart(${product.id}, 1); event.stopPropagation();">
                        <i class="fas fa-cart-plus"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function formatPrice(price) {
    const p = parseFloat(price);
    return isNaN(p) || p === 0 ? "يحدد لاحقاً" : p.toLocaleString('ar-IQ') + " د.ع";
}

function showProductDetails(id) {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;
    
    const modal = document.getElementById('productModal');
    document.getElementById('modalImage').src = getCDNUrl(product.image);
    document.getElementById('modalCategory').textContent = `${product.category} - ${product.subcategory}`;
    document.getElementById('modalName').textContent = product.name;
    document.getElementById('modalPrice').textContent = formatPrice(product.price);
    document.getElementById('modalDescription').textContent = product.description;
    
    document.getElementById('modalAddToCart').onclick = () => {
        const qty = parseInt(document.getElementById('productQty').value) || 1;
        addToCart(product.id, qty);
        modal.style.display = 'none';
    };
    
    modal.style.display = 'block';
}

function addToCart(id, quantity = 1) {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;
    const existing = cart.find(item => item.id === id);
    if (existing) existing.quantity += quantity;
    else cart.push({ id: product.id, name: product.name, price: product.priceNum, image: product.image, quantity });
    saveCart();
    updateCartUI();
    showNotification(`تمت إضافة ${product.name}`);
}

function saveCart() { localStorage.setItem('cart', JSON.stringify(cart)); }

function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartTotalValue = document.getElementById('cartTotalValue');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCount) cartCount.textContent = totalItems;
    if (cartItems) {
        cartItems.innerHTML = cart.length === 0 ? '<div class="empty-cart">السلة فارغة</div>' : 
            cart.map(item => `
                <div class="cart-item">
                    <img src="${getCDNUrl(item.image)}" alt="${item.name}">
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <p>${formatPrice(item.price)} × ${item.quantity}</p>
                    </div>
                    <button class="remove-item" onclick="removeFromCart(${item.id})">&times;</button>
                </div>
            `).join('');
    }
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (cartTotalValue) cartTotalValue.textContent = formatPrice(totalAmount);
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    updateCartUI();
}

function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.addEventListener('input', (e) => performSearch(e.target.value));
    
    const cartIcon = document.getElementById('cartIcon');
    const cartSidebar = document.getElementById('cartSidebar');
    const closeCart = document.getElementById('closeCart');
    if (cartIcon) cartIcon.onclick = () => cartSidebar.classList.add('active');
    if (closeCart) closeCart.onclick = () => cartSidebar.classList.remove('active');
    
    const closeModal = document.getElementById('closeModal');
    if (closeModal) closeModal.onclick = () => document.getElementById('productModal').style.display = 'none';
    
    window.onclick = (e) => { if (e.target == document.getElementById('productModal')) document.getElementById('productModal').style.display = 'none'; };
    
    document.getElementById('checkoutBtn').onclick = () => {
        if (cart.length === 0) return alert('السلة فارغة');
        let msg = "طلب جديد:\n" + cart.map(i => `- ${i.name} (${i.quantity})`).join('\n');
        window.open(`https://wa.me/9647839277919?text=${encodeURIComponent(msg)}`, '_blank');
    };

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
    const results = document.getElementById('searchResults');
    if (!query.trim()) return results.style.display = 'none';
    const filtered = allProducts.filter(p => p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 10);
    results.innerHTML = filtered.length ? filtered.map(p => `
        <div class="search-result-item" onclick="showProductDetails(${p.id}); document.getElementById('searchResults').style.display='none';">
            <img src="${getCDNUrl(p.image)}" alt="${p.name}">
            <div class="search-result-info"><h4>${p.name}</h4><p>${formatPrice(p.price)}</p></div>
        </div>
    `).join('') : '<div class="no-results">لا توجد نتائج</div>';
    results.style.display = 'block';
}

function setupMobileMenu() {
    const toggle = document.getElementById('menuToggle');
    const menu = document.getElementById('mobileMenu');
    const close = document.getElementById('closeMenu');
    if (toggle) toggle.onclick = () => menu.classList.add('active');
    if (close) close.onclick = () => menu.classList.remove('active');
}

function setupBackToTop() {
    const btn = document.getElementById('backToTop');
    window.addEventListener('scroll', () => { if (window.pageYOffset > 300) btn.classList.add('show'); else btn.classList.remove('show'); });
    btn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initLazyLoading() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    });
    const observe = () => document.querySelectorAll('img.lazy-img:not(.observed)').forEach(img => { img.classList.add('observed'); observer.observe(img); });
    observe();
    new MutationObserver(observe).observe(document.getElementById('dynamic-sections'), { childList: true, subtree: true });
}

function showNotification(text) {
    const n = document.createElement('div');
    n.className = 'notification';
    n.innerHTML = text;
    document.body.appendChild(n);
    setTimeout(() => n.classList.add('show'), 100);
    setTimeout(() => { n.classList.remove('show'); setTimeout(() => n.remove(), 300); }, 3000);
}
