// البيانات والمتغيرات العامة
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let categoriesData = {};
let allProducts = [];
let filteredProducts = [];
let currentView = 'grid-2';
let showingFavorites = false;
let showingFeatured = false;
let currentSort = 'default';
let priceFilter = { min: 0, max: Infinity };
let activeCategory = 'all';
let featuredProducts = [1, 3, 5, 7, 9, 11]; // IDs للمنتجات المميزة

// تهيئة الموقع عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    registerServiceWorker();
});

// تسجيل Service Worker للـ PWA
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('Service Worker registered successfully:', registration);
            })
            .catch((error) => {
                console.log('Service Worker registration failed:', error);
            });
    }
}

// دالة التهيئة الرئيسية
function initializeApp() {
    setCurrentYear();
    loadProducts();
    setupEventListeners();
    updateCartUI();
    setupMobileMenu();
    setupBackToTop();
    setupViewOptions();
    setupSortAndFilter();
    setupModal();
    setupNotifications();
    setupLazyLoading();
}

// تعيين السنة الحالية في الفوتر
function setCurrentYear() {
    document.getElementById('currentYear').textContent = new Date().getFullYear();
}

// إعداد Lazy Loading للصور
function setupLazyLoading() {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.addEventListener('load', () => {
                    img.classList.add('loaded');
                });
                img.classList.remove('lazy-img');
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '50px 0px',
        threshold: 0.01
    });

    // مراقبة جميع الصور ذات التحميل الكسول
    document.querySelectorAll('.lazy-img').forEach(img => {
        imageObserver.observe(img);
    });
}

// إظهار إشعار
function showNotification(message, type = 'success') {
    const notificationContainer = document.getElementById('notificationContainer');
    if (!notificationContainer) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${getNotificationIcon(type)}"></i>
        <span>${message}</span>
    `;
    
    notificationContainer.appendChild(notification);
    
    // إزالة الإشعار بعد 3 ثواني
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// الحصول على أيقونة الإشعار المناسبة
function getNotificationIcon(type) {
    switch(type) {
        case 'error': return 'exclamation-circle';
        case 'warning': return 'exclamation-triangle';
        case 'info': return 'info-circle';
        default: return 'check-circle';
    }
}

// إعداد النافذة المنبثقة للمنتج
function setupModal() {
    const modal = document.getElementById('productModal');
    const closeModal = document.getElementById('closeModal');
    
    if (!modal || !closeModal) return;
    
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
    
    // عناصر التحكم في الكمية
    const plusBtn = document.querySelector('.qty-btn.plus');
    const minusBtn = document.querySelector('.qty-btn.minus');
    const qtyInput = document.getElementById('productQty');
    
    if (plusBtn && minusBtn && qtyInput) {
        plusBtn.addEventListener('click', () => {
            qtyInput.value = parseInt(qtyInput.value) + 1;
        });
        
        minusBtn.addEventListener('click', () => {
            if (parseInt(qtyInput.value) > 1) {
                qtyInput.value = parseInt(qtyInput.value) - 1;
            }
        });
        
        qtyInput.addEventListener('change', (e) => {
            if (parseInt(e.target.value) < 1) {
                e.target.value = 1;
            }
        });
    }
}

// إعداد خيارات العرض
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

    const showFeaturedBtn = document.getElementById('showFeatured');
    if (showFeaturedBtn) {
        showFeaturedBtn.addEventListener('click', () => {
            showingFeatured = !showingFeatured;
            activeCategory = 'all';
            document.querySelectorAll('.sidebar-cat-item').forEach(el => el.classList.remove('active'));
            document.querySelector('.sidebar-cat-item').classList.add('active');
            renderMainContent();
        });
    }
}

// تطبيق نمط العرض على الشبكات
function applyViewToGrids() {
    const grids = document.querySelectorAll('.products-grid');
    grids.forEach(grid => {
        grid.classList.remove('grid-2', 'grid-3', 'list');
        grid.classList.add(currentView);
    });
}

// إعداد الترتيب والتصفية
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
    
    // السماح بمفتاح Enter في حقول السعر
    const priceInputs = document.querySelectorAll('#minPrice, #maxPrice');
    priceInputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('applyPriceFilter').click();
            }
        });
    });
}

// تبديل المنتجات المفضلة
function toggleFavorite(id, event) {
    if (event) event.stopPropagation();
    const index = favorites.indexOf(id);
    if (index === -1) {
        favorites.push(id);
        showNotification('تمت الإضافة إلى المفضلة ❤️', 'success');
    } else {
        favorites.splice(index, 1);
        showNotification('تمت الإزالة من المفضلة 💔', 'info');
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    
    const favBtns = document.querySelectorAll(`.fav-btn[data-id="${id}"]`);
    favBtns.forEach(btn => btn.classList.toggle('active'));
    
    if (showingFavorites) renderMainContent();
}

// تحميل المنتجات
async function loadProducts() {
    try {
        showLoading();
        const response = await fetch('products_by_category.json');
        if (!response.ok) throw new Error('فشل في تحميل البيانات');
        const data = await response.json();
        categoriesData = data.categories;
        flattenProducts();
        renderNavigation();
        renderSidebarCategories();
        renderMainContent();
        hideLoading();
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('dynamic-sections').innerHTML = `
            <div class="error-msg">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>حدث خطأ في تحميل البيانات</h3>
                <p>الرجاء التحقق من اتصال الإنترنت والمحاولة مرة أخرى.</p>
                <button onclick="loadProducts()" class="primary-btn">
                    <i class="fas fa-redo"></i> إعادة المحاولة
                </button>
            </div>
        `;
        hideLoading();
    }
}

// إظهار مؤشر التحميل
function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.add('active');
}

// إخفاء مؤشر التحميل
function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.remove('active');
}

// تحويل المنتجات إلى مصفوفة مسطحة
function flattenProducts() {
    allProducts = [];
    let idCounter = 1;
    for (const categoryName in categoriesData) {
        for (const subcategoryName in categoriesData[categoryName]) {
            categoriesData[categoryName][subcategoryName].forEach(product => {
                const isFeatured = featuredProducts.includes(idCounter);
                allProducts.push({
                    ...product,
                    id: idCounter++,
                    category: categoryName,
                    subcategory: subcategoryName,
                    priceNum: parseFloat(product.price) || 0,
                    description: product.description || 'لا يوجد وصف متاح للمنتج',
                    featured: isFeatured
                });
            });
        }
    }
}

// عرض قائمة التنقل
function renderNavigation() {
    const mainNav = document.getElementById('mainNavLinks');
    const mobileNav = document.getElementById('mobileNavLinks');
    if (!mainNav || !mobileNav) return;
    
    let navHtml = '<li><a href="#home" class="nav-link active">الرئيسية</a></li>';
    let mobileHtml = '<li><a href="#home" class="mobile-nav-link active">الرئيسية</a></li>';
    
    Object.keys(categoriesData).forEach((cat, index) => {
        const catId = `cat-${index}`;
        navHtml += `<li><a href="#${catId}" class="nav-link">${cat}</a></li>`;
        mobileHtml += `<li><a href="#${catId}" class="mobile-nav-link">${cat}</a></li>`;
    });
    
    mainNav.innerHTML = navHtml;
    mobileNav.innerHTML = mobileHtml;
    
    // إضافة معالج النقر لروابط التنقل
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.getAttribute('href') === '#home') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                updateActiveNavLink('home');
                return;
            }
            
            updateActiveNavLink(link.getAttribute('href'));
            
            // إغلاق قائمة الجوال إذا كانت مفتوحة
            document.getElementById('mobileMenu').classList.remove('active');
        });
    });
}

// تحديث رابط التنقل النشط
function updateActiveNavLink(href) {
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === href) {
            link.classList.add('active');
        }
    });
}

// عرض الأقسام في الشريط الجانبي
function renderSidebarCategories() {
    const sidebarCats = document.getElementById('sidebarCategories');
    if (!sidebarCats) return;
    
    let html = '<li class="sidebar-cat-item active" onclick="filterByCategory(\'all\', this)">الكل</li>';
    Object.keys(categoriesData).forEach(cat => {
        html += `<li class="sidebar-cat-item" onclick="filterByCategory('${cat}', this)">${cat}</li>`;
    });
    sidebarCats.innerHTML = html;
}

// تصفية حسب القسم
function filterByCategory(cat, element) {
    activeCategory = cat;
    document.querySelectorAll('.sidebar-cat-item').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
    renderMainContent();
}

// عرض المحتوى الرئيسي
function renderMainContent() {
    let products = allProducts;
    
    // تصفية حسب المفضلة
    if (showingFavorites) {
        products = products.filter(p => favorites.includes(p.id));
    }
    
    // تصفية حسب المنتجات المميزة
    if (showingFeatured) {
        products = products.filter(p => p.featured);
    }
    
    // تصفية حسب القسم
    if (activeCategory !== 'all') {
        products = products.filter(p => p.category === activeCategory);
    }
    
    // تصفية حسب السعر
    products = products.filter(p => p.priceNum >= priceFilter.min && p.priceNum <= priceFilter.max);
    
    // الترتيب
    products = sortProducts(products);
    
    const container = document.getElementById('dynamic-sections');
    if (!container) return;
    
    if (products.length === 0) {
        container.innerHTML = `
            <div class="no-products">
                <i class="fas fa-${showingFavorites ? 'heart' : showingFeatured ? 'crown' : 'search'}"></i>
                <h3>لا توجد منتجات</h3>
                <p>${getNoProductsMessage()}</p>
                ${showingFavorites || showingFeatured ? '' : '<button onclick="resetFilters()" class="primary-btn">إعادة تعيين الفلاتر</button>'}
            </div>
        `;
        return;
    }

    if (showingFavorites || showingFeatured || activeCategory !== 'all' || currentSort !== 'default' || priceFilter.min > 0 || priceFilter.max < Infinity) {
        // عرض نتائج البحث/التصفية في شبكة واحدة
        container.innerHTML = `
            <section class="products-section">
                <div class="section-header">
                    <h2 class="section-title">
                        ${getSectionTitle()}
                        <span class="results-count">(${products.length} منتج)</span>
                    </h2>
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
    
    applyViewToGrids();
    initLazyLoading();
}

// الحصول على رسالة عدم وجود منتجات
function getNoProductsMessage() {
    if (showingFavorites) return 'لم تقم بإضافة أي منتجات إلى المفضلة بعد.';
    if (showingFeatured) return 'لا توجد منتجات مميزة حالياً.';
    return 'لا توجد منتجات تطابق معايير البحث والتصفية.';
}

// الحصول على عنوان القسم
function getSectionTitle() {
    if (showingFavorites) return 'منتجاتك المفضلة';
    if (showingFeatured) return 'المنتجات المميزة';
    if (activeCategory !== 'all') return activeCategory;
    return 'نتائج البحث والتصفية';
}

// ترتيب المنتجات
function sortProducts(products) {
    switch(currentSort) {
        case 'price-asc':
            return products.sort((a, b) => a.priceNum - b.priceNum);
        case 'price-desc':
            return products.sort((a, b) => b.priceNum - a.priceNum);
        case 'name-asc':
            return products.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
        case 'name-desc':
            return products.sort((a, b) => b.name.localeCompare(a.name, 'ar'));
        default:
            return products;
    }
}

// إعادة تعيين الفلاتر
function resetFilters() {
    activeCategory = 'all';
    currentSort = 'default';
    priceFilter = { min: 0, max: Infinity };
    showingFavorites = false;
    showingFeatured = false;
    
    document.getElementById('minPrice').value = '';
    document.getElementById('maxPrice').value = '';
    document.getElementById('sortSelect').value = 'default';
    
    document.querySelectorAll('.sidebar-cat-item').forEach(el => el.classList.remove('active'));
    document.querySelector('.sidebar-cat-item').classList.add('active');
    
    const favToggle = document.getElementById('favToggle');
    if (favToggle) favToggle.classList.remove('active');
    
    renderMainContent();
}

// عرض الأقسام الافتراضية
function renderDefaultSections() {
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
            const subcatProducts = allProducts
                .filter(p => p.category === categoryName && p.subcategory === subcategoryName)
                .slice(0, 8);
            
            if (subcatProducts.length === 0) continue;
            
            sectionHtml += `
                <div class="subcategory-group">
                    <h3 class="subcategory-title">${subcategoryName}</h3>
                    <div class="products-grid ${currentView}">
                        ${subcatProducts.map(p => createProductCardHtml(p)).join('')}
                    </div>
                    ${subcatProducts.length < 4 ? '' : `
                        <div class="show-more-container">
                            <button class="show-more-btn" onclick="showMoreProducts('${categoryName}', '${subcategoryName}')">
                                عرض المزيد <i class="fas fa-arrow-left"></i>
                            </button>
                        </div>
                    `}
                </div>
            `;
        }
        section.innerHTML = sectionHtml;
        container.appendChild(section);
    });
}

// عرض المزيد من المنتجات
function showMoreProducts(category, subcategory) {
    const allSubcatProducts = allProducts.filter(p => p.category === category && p.subcategory === subcategory);
    const modal = document.getElementById('productModal');
    
    // إنشاء نافذة مؤقتة لعرض جميع منتجات هذا القسم الفرعي
    const tempModal = document.createElement('div');
    tempModal.className = 'modal';
    tempModal.style.display = 'block';
    tempModal.innerHTML = `
        <div class="modal-content">
            <button class="close-modal" onclick="this.parentElement.parentElement.remove(); document.body.style.overflow='auto'">&times;</button>
            <div class="modal-header">
                <h2>${subcategory}</h2>
                <p class="modal-subtitle">${category}</p>
            </div>
            <div class="products-grid grid-3">
                ${allSubcatProducts.map(p => createProductCardHtml(p)).join('')}
            </div>
        </div>
    `;
    document.body.appendChild(tempModal);
    document.body.style.overflow = 'hidden';
    
    // إضافة معالج النقر لبطاقات المنتج في النافذة
    tempModal.querySelectorAll('.product-card').forEach((card, index) => {
        card.addEventListener('click', () => {
            showProductDetails(allSubcatProducts[index].id);
            tempModal.remove();
            document.body.style.overflow = 'auto';
        });
    });
    
    // إغلاق النافذة عند النقر خارجها
    tempModal.addEventListener('click', (e) => {
        if (e.target === tempModal) {
            tempModal.remove();
            document.body.style.overflow = 'auto';
        }
    });
}

// الحصول على رابط CDN للصورة
function getCDNUrl(path) {
    if (!path) return 'https://via.placeholder.com/300x300?text=No+Image';
    let cleanPath = path.startsWith('/') ? path.substring(1) : path;
    const encodedPath = cleanPath.split('/').map(part => encodeURIComponent(part)).join('/');
    return `https://cdn.jsdelivr.net/gh/green-label6/ugp@master/${encodedPath}`;
}

// إنشاء HTML لبطاقة المنتج
function createProductCardHtml(product) {
    const formattedPrice = formatPrice(product.price);
    const cdnUrl = getCDNUrl(product.image);
    const isFav = favorites.includes(product.id);
    const isFeatured = product.featured;
    
    return `
        <div class="product-card" onclick="showProductDetails(${product.id})">
            ${isFeatured ? `<div class="featured-badge"><i class="fas fa-crown"></i> مميز</div>` : ''}
            <button class="fav-btn ${isFav ? 'active' : ''}" data-id="${product.id}" onclick="toggleFavorite(${product.id}, event)">
                <i class="fas fa-heart"></i>
            </button>
            <div class="product-img">
                <img data-src="${cdnUrl}" 
                     src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23f5f5f7'/%3E%3C/svg%3E" 
                     alt="${product.name}" class="lazy-img" 
                     onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'">
            </div>
            <div class="product-info">
                <span class="product-category">${product.subcategory}</span>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description.substring(0, 100)}${product.description.length > 100 ? '...' : ''}</p>
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

// تنسيق السعر
function formatPrice(price) {
    const p = parseFloat(price);
    if (isNaN(p) || p === 0) return "يحدد لاحقاً";
    
    // تنسيق مع فواصل الآلاف للدينار العراقي
    return p.toLocaleString('ar-IQ', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }) + " د.ع";
}

// عرض تفاصيل المنتج (الخاصية الرئيسية المطلوبة)
function showProductDetails(id) {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;
    
    const modal = document.getElementById('productModal');
    const modalImage = document.getElementById('modalImage');
    const cdnUrl = getCDNUrl(product.image);
    
    // تحميل الصورة مسبقاً
    const img = new Image();
    img.src = cdnUrl;
    img.onload = () => {
        modalImage.src = cdnUrl;
    };
    img.onerror = () => {
        modalImage.src = 'https://via.placeholder.com/400x400?text=No+Image';
    };
    
    document.getElementById('modalCategory').textContent = `${product.category} - ${product.subcategory}`;
    document.getElementById('modalName').textContent = product.name;
    document.getElementById('modalPrice').textContent = formatPrice(product.price);
    
    // عرض الوصف الكامل مع الحفاظ على التنسيق
    const description = product.description || 'لا يوجد وصف متاح لهذا المنتج.';
    const formattedDescription = description.replace(/\n/g, '<br>');
    document.getElementById('modalDescription').innerHTML = formattedDescription;
    
    document.getElementById('productQty').value = 1;
    
    // تحديث زر إضافة إلى السلة
    const addToCartBtn = document.getElementById('modalAddToCart');
    addToCartBtn.onclick = () => {
        const qty = parseInt(document.getElementById('productQty').value) || 1;
        addToCart(product.id, qty);
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    };
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // التمرير إلى أعلى النافذة
    modal.scrollTop = 0;
}

// إضافة إلى سلة المشتريات
function addToCart(id, quantity = 1) {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;
    
    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.quantity += quantity;
    } else {
        cart.push({ 
            id: product.id, 
            name: product.name, 
            price: product.priceNum, 
            image: product.image, 
            quantity 
        });
    }
    
    saveCart();
    updateCartUI();
    showNotification(`تمت إضافة ${product.name} إلى السلة 🛒`, 'success');
    
    // فتح سلة المشتريات الجانبية على الجوال
    if (window.innerWidth <= 768) {
        document.getElementById('cartSidebar').classList.add('active');
    }
}

// حفظ سلة المشتريات
function saveCart() { 
    localStorage.setItem('cart', JSON.stringify(cart)); 
}

// تحديث واجهة سلة المشتريات
function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartTotalValue = document.getElementById('cartTotalValue');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    if (cartCount) cartCount.textContent = totalItems;
    
    if (cartItems) {
        if (cart.length === 0) {
            cartItems.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-bag"></i>
                    <p>سلة المشتريات فارغة</p>
                    <small>أضف بعض المنتجات لتظهر هنا</small>
                </div>
            `;
        } else {
            cartItems.innerHTML = cart.map(item => `
                <div class="cart-item">
                    <img src="${getCDNUrl(item.image)}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/100x100?text=No+Image'">
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <p>${formatPrice(item.price)} × ${item.quantity}</p>
                        <p class="item-total">${formatPrice(item.price * item.quantity)}</p>
                    </div>
                    <button class="remove-item" onclick="removeFromCart(${item.id})">&times;</button>
                </div>
            `).join('');
        }
    }
    
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (cartTotalValue) cartTotalValue.textContent = formatPrice(totalAmount);
}

// إزالة من سلة المشتريات
function removeFromCart(id) {
    const item = cart.find(item => item.id === id);
    if (item) {
        cart = cart.filter(item => item.id !== id);
        saveCart();
        updateCartUI();
        showNotification(`تمت إزالة ${item.name} من السلة`, 'info');
    }
}

// إعداد معالجي الأحداث
function setupEventListeners() {
    // وظيفة البحث
    setupSearch();
    
    // وظيفة سلة المشتريات
    setupCart();
    
    // وظيفة إتمام الطلب
    setupCheckout();
    
    // معالج مفتاح ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
    
    // الروابط في الفوتر
    const cartLinkFooter = document.getElementById('cartLinkFooter');
    if (cartLinkFooter) {
        cartLinkFooter.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('cartSidebar').classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
    
    const showFavFooter = document.getElementById('showFavFooter');
    if (showFavFooter) {
        showFavFooter.addEventListener('click', (e) => {
            e.preventDefault();
            showingFavorites = true;
            renderMainContent();
            const favToggle = document.getElementById('favToggle');
            if (favToggle) favToggle.classList.add('active');
        });
    }
}

// إعداد البحث
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                performSearch(e.target.value);
            }, 300);
        });
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch(e.target.value);
            }
        });
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            performSearch(searchInput.value);
        });
    }
    
    // البحث على الجوال
    const mobileSearchInput = document.getElementById('mobileSearchInput');
    const mobileSearchBtn = document.getElementById('mobileSearchBtn');
    
    if (mobileSearchInput) {
        mobileSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch(e.target.value);
                document.getElementById('mobileMenu').classList.remove('active');
            }
        });
    }
    
    if (mobileSearchBtn) {
        mobileSearchBtn.addEventListener('click', () => {
            performSearch(mobileSearchInput.value);
            document.getElementById('mobileMenu').classList.remove('active');
        });
    }
    
    // إغلاق نتائج البحث عند النقر خارجها
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container') && !e.target.closest('.search-results')) {
            const results = document.getElementById('searchResults');
            if (results) results.style.display = 'none';
        }
    });
}

// إعداد سلة المشتريات
function setupCart() {
    const cartIcon = document.getElementById('cartIcon');
    const cartSidebar = document.getElementById('cartSidebar');
    const closeCart = document.getElementById('closeCart');
    const continueShopping = document.getElementById('continueShopping');
    
    if (cartIcon) cartIcon.addEventListener('click', () => {
        cartSidebar.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
    
    if (closeCart) closeCart.addEventListener('click', () => {
        cartSidebar.classList.remove('active');
        document.body.style.overflow = 'auto';
    });
    
    if (continueShopping) continueShopping.addEventListener('click', () => {
        cartSidebar.classList.remove('active');
        document.body.style.overflow = 'auto';
    });
}

// إعداد إتمام الطلب
function setupCheckout() {
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (!checkoutBtn) return;
    
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            showNotification('السلة فارغة، أضف منتجات أولاً', 'warning');
            return;
        }
        
        let message = "🛒 طلب جديد من موقع كوزمتك بين يديك\n\n";
        message += "المنتجات:\n";
        
        cart.forEach((item, index) => {
            message += `${index + 1}. ${item.name} - ${item.quantity} × ${formatPrice(item.price)}\n`;
        });
        
        const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        message += `\nالإجمالي: ${formatPrice(totalAmount)}\n\n`;
        message += "يرجى التواصل لتأكيد الطلب 🎉";
        
        const whatsappUrl = `https://wa.me/9647839277919?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    });
}

// إغلاق جميع النوافذ المنبثقة
function closeAllModals() {
    document.getElementById('productModal').style.display = 'none';
    document.getElementById('cartSidebar').classList.remove('active');
    document.getElementById('mobileMenu').classList.remove('active');
    document.body.style.overflow = 'auto';
}

// إجراء البحث
function performSearch(query) {
    const results = document.getElementById('searchResults');
    const searchInput = document.getElementById('searchInput');
    
    if (!query || !query.trim()) {
        if (results) results.style.display = 'none';
        return;
    }
    
    const filtered = allProducts.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.description.toLowerCase().includes(query.toLowerCase()) ||
        p.category.toLowerCase().includes(query.toLowerCase()) ||
        p.subcategory.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 8);
    
    if (results) {
        if (filtered.length === 0) {
            results.innerHTML = '<div class="no-results">لا توجد نتائج مطابقة</div>';
        } else {
            results.innerHTML = filtered.map(p => `
                <div class="search-result-item" onclick="showProductDetails(${p.id}); document.getElementById('searchResults').style.display='none'; if(searchInput) searchInput.value='';">
                    <img src="${getCDNUrl(p.image)}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/50x50?text=No+Image'">
                    <div class="search-result-info">
                        <h4>${p.name}</h4>
                        <p class="result-price">${formatPrice(p.price)}</p>
                        <small>${p.category} - ${p.subcategory}</small>
                    </div>
                </div>
            `).join('');
        }
        results.style.display = 'block';
    }
}

// إعداد قائمة الجوال
function setupMobileMenu() {
    const toggle = document.getElementById('menuToggle');
    const menu = document.getElementById('mobileMenu');
    const close = document.getElementById('closeMenu');
    
    if (toggle) toggle.addEventListener('click', () => {
        menu.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
    
    if (close) close.addEventListener('click', () => {
        menu.classList.remove('active');
        document.body.style.overflow = 'auto';
    });
    
    // إغلاق القائمة عند النقر على رابط
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
        link.addEventListener('click', () => {
            menu.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    });
}

// إعداد زر العودة للأعلى
function setupBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            btn.classList.add('show');
        } else {
            btn.classList.remove('show');
        }
    });
    
    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// تهيئة التحميل البطيء للصور
function initLazyLoading() {
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.classList.add('loaded');
                        observer.unobserve(img);
                    }
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.1
        });
        
        document.querySelectorAll('img.lazy-img:not(.loaded)').forEach(img => {
            observer.observe(img);
        });
    } else {
        // بديل للمتصفحات التي لا تدعم IntersectionObserver
        document.querySelectorAll('img.lazy-img').forEach(img => {
            if (img.dataset.src) {
                img.src = img.dataset.src;
                img.classList.add('loaded');
            }
        });
    }
}

// إضافة CSS للعناصر الجديدة
const style = document.createElement('style');
style.textContent = `
    .featured-badge {
        position: absolute;
        top: 15px;
        right: 15px;
        background: linear-gradient(135deg, #ff9800 0%, #ff5722 100%);
        color: white;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 5px;
        z-index: 9;
        box-shadow: 0 4px 8px rgba(255, 152, 0, 0.3);
    }
    
    .secondary-btn {
        background: white;
        color: var(--primary-color);
        padding: 15px 30px;
        border-radius: var(--border-radius-xl);
        font-weight: 700;
        font-size: 1rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        transition: var(--transition);
        text-decoration: none;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        border: 2px solid var(--primary-color);
        cursor: pointer;
    }
    
    .secondary-btn:hover {
        background: var(--primary-color);
        color: white;
        transform: translateY(-2px);
    }
    
    .section-subtitle {
        color: var(--gray-color);
        font-size: 1.1rem;
        margin-bottom: 40px;
    }
`;
document.head.appendChild(style);

// التعامل مع تغيير حجم النافذة
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (window.innerWidth > 992) {
            document.getElementById('mobileMenu').classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }, 250);
});

// إعداد تبديل الوضع المظلم
function setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;
    
    // التحقق من الوضع المحفوظ
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.classList.add('dark');
    }
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        themeToggle.classList.toggle('dark');
        
        showNotification(
            newTheme === 'dark' ? 'تم تفعيل الوضع المظلم' : 'تم تفعيل الوضع الفاتح',
            'info'
        );
    });
}

// التهيئة النهائية
setupThemeToggle();
updateCartUI();