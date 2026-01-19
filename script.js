// ============================================
// الحل النهائي لكل المشاكل
// ============================================

// متغيرات محسنة
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
let featuredProducts = [1, 3, 5, 7, 9, 11];
let productsPerLoad = 10;
let displayedProductsCount = 0;
let currentProducts = [];
let currentProductInModal = null;
let categoriesHierarchy = {};
let currentMainCategory = null;
let currentSubcategory = null;
let expandedCategories = new Set();
let searchCache = {};
let searchDebounceTimer = null;
let isLoading = false;

// ============================================
// تهيئة الموقع
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    setCurrentYear();
    setupNotifications();
    setupEventListeners();
    setupMobileMenu();
    setupBackToTop();
    setupViewOptions();
    setupSortAndFilter();
    setupModal();
    setupDrawer();
    setupBottomNavigation();
    setupDefaultView();
    setupShareButton();
    
    // تحميل البيانات
    await loadProducts();
    
    updateCartUI();
    updateFavoritesUI();
    updateBottomNavCounters();
}

// ============================================
// إصلاح البحث على الجوال - بدون تجميد
// ============================================

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const sidebarSearchInput = document.getElementById('sidebarSearchInput');
    const sidebarSearchBtn = document.getElementById('sidebarSearchBtn');
    const mobileSearchInput = document.getElementById('mobileSearchInput');
    const mobileSearchBtn = document.getElementById('mobileSearchBtn');
    
    // البحث الرئيسي
    if (searchInput) {
        searchInput.addEventListener('input', handleSearchInput);
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (searchInput.value.trim()) {
                    executeSearch(searchInput.value);
                }
            }
        });
        
        searchInput.addEventListener('focus', () => {
            // على الجوال، إظهار النتائج السابقة
            if (window.innerWidth <= 768 && searchInput.value.trim()) {
                executeSearch(searchInput.value);
            }
        });
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            if (searchInput && searchInput.value.trim()) {
                executeSearch(searchInput.value);
            }
        });
    }
    
    // البحث في الشريط الجانبي
    if (sidebarSearchInput) {
        sidebarSearchInput.addEventListener('input', handleSearchInput);
        
        sidebarSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (sidebarSearchInput.value.trim()) {
                    executeSearch(sidebarSearchInput.value);
                }
            }
        });
    }
    
    if (sidebarSearchBtn) {
        sidebarSearchBtn.addEventListener('click', () => {
            if (sidebarSearchInput && sidebarSearchInput.value.trim()) {
                executeSearch(sidebarSearchInput.value);
            }
        });
    }
    
    // البحث على الجوال
    if (mobileSearchInput) {
        mobileSearchInput.addEventListener('input', handleSearchInput);
        
        mobileSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (mobileSearchInput.value.trim()) {
                    executeSearch(mobileSearchInput.value);
                    document.getElementById('mobileMenu').classList.remove('active');
                }
            }
        });
    }
    
    if (mobileSearchBtn) {
        mobileSearchBtn.addEventListener('click', () => {
            if (mobileSearchInput && mobileSearchInput.value.trim()) {
                executeSearch(mobileSearchInput.value);
                document.getElementById('mobileMenu').classList.remove('active');
            }
        });
    }
    
    // إغلاق نتائج البحث عند النقر خارجها
    document.addEventListener('click', (e) => {
        const searchContainer = document.querySelector('.search-container');
        const searchResults = document.getElementById('searchResults');
        
        if (searchResults && searchResults.style.display === 'block' &&
            searchContainer && !searchContainer.contains(e.target) && 
            !searchResults.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });
}

// معالج البحث مع Debounce
function handleSearchInput(e) {
    const query = e.target.value.trim();
    
    // إلغاء البحث السابق
    if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
    }
    
    // إذا كان البحث فارغاً
    if (!query) {
        const searchResults = document.getElementById('searchResults');
        if (searchResults) {
            searchResults.style.display = 'none';
        }
        showAllProducts();
        return;
    }
    
    // استخدام Debounce لمنع البحث المتكرر
    searchDebounceTimer = setTimeout(() => {
        performSearch(query);
    }, 300);
}

// دالة البحث المحسنة
function performSearch(query) {
    if (isLoading) return;
    
    isLoading = true;
    
    try {
        const normalizedQuery = normalizeSearchQuery(query);
        
        // البحث الفوري في الذاكرة
        const results = searchProducts(normalizedQuery);
        
        // عرض النتائج
        displaySearchResults(results, query);
        
        // فتح صفحة النتائج إذا كان البحث من زر Enter
        if (query.length > 1) {
            openSearchPage(results, query);
        }
    } catch (error) {
        console.error('Search error:', error);
    } finally {
        isLoading = false;
    }
}

// البحث السريع في المنتجات
function searchProducts(query) {
    // استخدام التخزين المؤقت
    if (searchCache[query]) {
        return searchCache[query];
    }
    
    const results = allProducts.filter(product => {
        // البحث في الاسم
        if (normalizeSearchQuery(product.name).includes(query)) {
            return true;
        }
        
        // البحث في الوصف
        if (normalizeSearchQuery(product.description).includes(query)) {
            return true;
        }
        
        return false;
    }).slice(0, 8);
    
    // تخزين النتائج
    searchCache[query] = results;
    
    return results;
}

// تطبيع نص البحث
function normalizeSearchQuery(text) {
    if (!text) return '';
    
    return text.toLowerCase()
        .replace(/[\u064B-\u065F]/g, '')
        .replace(/[إأآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/\s+/g, ' ')
        .trim();
}

// عرض نتائج البحث
function displaySearchResults(results, query) {
    const searchResults = document.getElementById('searchResults');
    if (!searchResults) return;
    
    if (results.length === 0) {
        searchResults.innerHTML = '<div class="no-results">لا توجد نتائج مطابقة</div>';
        searchResults.style.display = 'block';
        return;
    }
    
    searchResults.innerHTML = results.map(product => `
        <div class="search-result-item" onclick="selectSearchResult(${product.id})">
            <img src="${getCDNUrl(product.image)}" alt="${product.name}" 
                 onerror="this.src='https://via.placeholder.com/50x50?text=No+Image'">
            <div class="search-result-info">
                <h4>${product.name}</h4>
                <p class="result-price">${formatPrice(product.price)}</p>
                <small>${product.category} - ${product.subcategory}</small>
            </div>
        </div>
    `).join('');
    
    searchResults.style.display = 'block';
}

// إغلاق نتائج البحث
function closeSearchResults() {
    const searchResults = document.getElementById('searchResults');
    if (searchResults) {
        searchResults.style.display = 'none';
    }
}

// اختيار نتيجة بحث
function selectSearchResult(productId) {
    closeSearchResults();
    
    // مسح حقول البحث
    const searchInputs = [
        document.getElementById('searchInput'),
        document.getElementById('sidebarSearchInput'),
        document.getElementById('mobileSearchInput')
    ];
    
    searchInputs.forEach(input => {
        if (input) input.value = '';
    });
    
    // عرض المنتج
    setTimeout(() => {
        showProductDetails(productId);
    }, 300);
}

// فتح صفحة نتائج البحث
function openSearchPage(results, query) {
    showingFavorites = false;
    showingFeatured = false;
    activeCategory = 'all';
    currentMainCategory = null;
    currentSubcategory = null;
    
    // إغلاق النتائج المنسدلة
    closeSearchResults();
    
    // تحديث العرض
    resetDisplayedProducts();
    currentProducts = results.slice(0, productsPerLoad);
    displayedProductsCount = currentProducts.length;
    
    const container = document.getElementById('dynamic-sections');
    if (container) {
        container.innerHTML = `
            <section class="search-results-section">
                <div class="section-header">
                    <h2 class="section-title">
                        نتائج البحث: "${query}"
                        <span class="results-count">(${results.length} منتج)</span>
                    </h2>
                </div>
                <div class="products-grid ${currentView}">
                    ${currentProducts.map(p => createProductCardHtml(p)).join('')}
                </div>
                ${results.length > productsPerLoad ? `
                    <div class="load-more-container">
                        <button class="load-more-btn" onclick="loadMoreSearchResults()">
                            <i class="fas fa-arrow-down"></i> عرض المزيد
                        </button>
                    </div>
                ` : ''}
            </section>
        `;
        
        applyViewToGrids();
        initLazyLoading();
    }
    
    // التمرير إلى النتائج
    setTimeout(() => {
        const dynamicSections = document.getElementById('dynamic-sections');
        if (dynamicSections) {
            dynamicSections.scrollIntoView({ behavior: 'smooth' });
        }
    }, 300);
}

// ============================================
// إصلاح bottom navigator
// ============================================

function setupBottomNavigation() {
    // زر الرئيسية
    const homeBtn = document.querySelector('.bottom-nav-item[data-section="home"]');
    if (homeBtn) {
        homeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            resetFilters();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            updateBottomNavActive('home');
        });
    }
    
    // زر الأقسام
    const bottomNavDrawer = document.getElementById('bottomNavDrawer');
    if (bottomNavDrawer) {
        bottomNavDrawer.addEventListener('click', function(e) {
            e.preventDefault();
            openDrawer();
        });
    }
    
    // زر المفضلة
    const bottomNavFavorites = document.getElementById('bottomNavFavorites');
    if (bottomNavFavorites) {
        bottomNavFavorites.addEventListener('click', function(e) {
            e.preventDefault();
            showFavoritesFromBottomNav();
        });
    }
    
    // زر السلة
    const bottomNavCart = document.getElementById('bottomNavCart');
    if (bottomNavCart) {
        bottomNavCart.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('cartSidebar').classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
}

// عرض المفضلة من bottom navigator
function showFavoritesFromBottomNav() {
    showingFavorites = true;
    showingFeatured = false;
    activeCategory = 'all';
    currentMainCategory = null;
    currentSubcategory = null;
    
    resetDisplayedProducts();
    renderMainContent();
    updateFavoritesUI();
    updateBottomNavActive('favorites');
    
    // التمرير إلى المنتجات
    setTimeout(() => {
        const dynamicSections = document.getElementById('dynamic-sections');
        if (dynamicSections) {
            dynamicSections.scrollIntoView({ behavior: 'smooth' });
        }
    }, 300);
}

// تحديث العنصر النشط في bottom navigator
function updateBottomNavActive(section) {
    const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
    bottomNavItems.forEach(item => {
        item.classList.remove('active');
    });
    
    if (section === 'home') {
        const homeBtn = document.querySelector('.bottom-nav-item[data-section="home"]');
        if (homeBtn) homeBtn.classList.add('active');
    } else if (section === 'favorites') {
        const favoritesBtn = document.getElementById('bottomNavFavorites');
        if (favoritesBtn) favoritesBtn.classList.add('active');
    }
}

// تحديث العدادات
function updateBottomNavCounters() {
    const bottomFavCount = document.getElementById('bottomFavCount');
    const bottomCartCount = document.getElementById('bottomCartCount');
    
    if (bottomFavCount) {
        bottomFavCount.textContent = favorites.length;
    }
    
    if (bottomCartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        bottomCartCount.textContent = totalItems;
    }
}

// ============================================
// دوال الأقسام والمنتجات
// ============================================

function createCategoriesHierarchy() {
    categoriesHierarchy = {};
    expandedCategories.clear();
    
    for (const categoryName in categoriesData) {
        const subcategories = [];
        let productsCount = 0;
        
        for (const subcategoryName in categoriesData[categoryName]) {
            const subcatProducts = categoriesData[categoryName][subcategoryName];
            subcategories.push({
                name: subcategoryName,
                count: subcatProducts.length
            });
            productsCount += subcatProducts.length;
        }
        
        categoriesHierarchy[categoryName] = {
            subcategories: subcategories,
            productsCount: productsCount
        };
    }
    
    renderMainCategories();
}

function renderMainCategories() {
    const sidebarCats = document.getElementById('sidebarCategories');
    if (!sidebarCats) return;
    
    let html = `
        <li class="sidebar-cat-item active" onclick="showAllCategories()">
            <div class="cat-item-content">
                <div class="cat-info">
                    <span class="cat-name">جميع الأقسام</span>
                </div>
                <span class="cat-count">${allProducts.length}</span>
            </div>
        </li>
    `;
    
    Object.keys(categoriesHierarchy).forEach(cat => {
        const hasSubcategories = categoriesHierarchy[cat].subcategories.length > 0;
        const isExpanded = expandedCategories.has(cat);
        
        html += `
            <li class="sidebar-cat-item ${hasSubcategories ? 'has-children' : ''} ${isExpanded ? 'expanded' : ''}" 
                data-category="${cat}">
                <div class="cat-item-content" onclick="${hasSubcategories ? `toggleCategory('${cat}')` : `selectCategory('${cat}')`}">
                    <div class="cat-info">
                        <span class="cat-name">${cat}</span>
                        ${hasSubcategories ? 
                            `<i class="fas fa-chevron-${isExpanded ? 'up' : 'down'} expand-icon"></i>` : 
                            ''
                        }
                    </div>
                    <span class="cat-count">${categoriesHierarchy[cat].productsCount}</span>
                </div>
                ${hasSubcategories ? `
                    <div class="subcategories-container">
                        <ul class="subcategories-list">
                            ${categoriesHierarchy[cat].subcategories.map(subcat => `
                                <li class="subcategory-item" onclick="selectSubcategory('${cat}', '${subcat.name}', event)">
                                    <span>${subcat.name}</span>
                                    <span class="subcat-count">${subcat.count}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
            </li>
        `;
    });
    
    sidebarCats.innerHTML = html;
}

function toggleCategory(categoryName) {
    if (expandedCategories.has(categoryName)) {
        expandedCategories.delete(categoryName);
    } else {
        expandedCategories.add(categoryName);
    }
    renderMainCategories();
}

function selectCategory(categoryName) {
    currentMainCategory = categoryName;
    currentSubcategory = null;
    activeCategory = categoryName;
    showingFavorites = false;
    showingFeatured = false;
    
    updateActiveCategory(categoryName);
    resetDisplayedProducts();
    renderMainContent();
    
    // التمرير إلى المنتجات
    setTimeout(() => {
        const dynamicSections = document.getElementById('dynamic-sections');
        if (dynamicSections) {
            dynamicSections.scrollIntoView({ behavior: 'smooth' });
        }
    }, 300);
}

function selectSubcategory(categoryName, subcategoryName, event) {
    if (event) event.stopPropagation();
    
    currentMainCategory = categoryName;
    currentSubcategory = subcategoryName;
    activeCategory = categoryName;
    showingFavorites = false;
    showingFeatured = false;
    
    updateActiveSubcategory(categoryName, subcategoryName);
    resetDisplayedProducts();
    renderMainContent();
    
    // إغلاق الـ Drawer على الجوال
    if (window.innerWidth <= 768) {
        closeDrawer();
    }
}

function updateActiveCategory(categoryName) {
    document.querySelectorAll('.sidebar-cat-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.category === categoryName) {
            item.classList.add('active');
        }
    });
}

function updateActiveSubcategory(categoryName, subcategoryName) {
    updateActiveCategory(categoryName);
    
    document.querySelectorAll('.subcategory-item').forEach(item => {
        item.classList.remove('active');
        if (item.querySelector('span:first-child').textContent === subcategoryName) {
            item.classList.add('active');
        }
    });
}

// ============================================
// دوال إضافية
// ============================================

async function loadProducts() {
    try {
        showLoading();
        const response = await fetch('products_by_category.json');
        if (!response.ok) throw new Error('فشل في تحميل البيانات');
        const data = await response.json();
        categoriesData = data.categories;
        flattenProducts();
        createCategoriesHierarchy();
        resetDisplayedProducts();
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

function showAllProducts() {
    currentMainCategory = null;
    currentSubcategory = null;
    activeCategory = 'all';
    showingFavorites = false;
    showingFeatured = false;
    
    const searchInputs = [
        document.getElementById('searchInput'),
        document.getElementById('sidebarSearchInput'),
        document.getElementById('mobileSearchInput')
    ];
    
    searchInputs.forEach(input => {
        if (input) input.value = '';
    });
    
    closeSearchResults();
    resetDisplayedProducts();
    renderMainContent();
}

function resetFilters() {
    activeCategory = 'all';
    currentSort = 'default';
    priceFilter = { min: 0, max: Infinity };
    showingFavorites = false;
    showingFeatured = false;
    currentMainCategory = null;
    currentSubcategory = null;
    
    expandedCategories.clear();
    
    document.getElementById('minPrice').value = '';
    document.getElementById('maxPrice').value = '';
    document.getElementById('sortSelect').value = 'default';
    
    renderMainCategories();
    
    const favToggle = document.getElementById('favToggle');
    if (favToggle) favToggle.classList.remove('active');
    
    resetDisplayedProducts();
    renderMainContent();
}

// ============================================
// إعداد جميع الأحداث
// ============================================

function setupEventListeners() {
    setupSearch();
    setupCart();
    setupCheckout();
    
    // ESC لإغلاق كل شيء
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
            closeSearchResults();
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
            showFavoritesFromBottomNav();
        });
    }
}

// ============================================
// عرض قائمة التنقل
// ============================================

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
    
    // إضافة رابط للـ Drawer
    navHtml += '<li><a href="#" class="nav-link open-drawer">جميع الأقسام</a></li>';
    mobileHtml += '<li><a href="#" class="mobile-nav-link open-drawer">جميع الأقسام</a></li>';
    
    mainNav.innerHTML = navHtml;
    mobileNav.innerHTML = mobileHtml;
    
    setupNavigationLinks();
}

function setupNavigationLinks() {
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            
            if (href === '#home') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                updateActiveNavLink('home');
                updateBottomNavActive('home');
                return;
            }
            
            if (href.startsWith('#cat-')) {
                e.preventDefault();
                const catIndex = href.replace('#cat-', '');
                const categoryName = Object.keys(categoriesData)[catIndex];
                if (categoryName) {
                    filterByCategory(categoryName);
                    updateActiveNavLink(href);
                    
                    // التمرير إلى القسم
                    setTimeout(() => {
                        const element = document.getElementById(`cat-${catIndex}`);
                        if (element) {
                            element.scrollIntoView({ behavior: 'smooth' });
                        }
                    }, 300);
                }
            }
            
            if (href === '#') {
                e.preventDefault();
                openDrawer();
            }
            
            // إغلاق قائمة الجوال إذا كانت مفتوحة
            document.getElementById('mobileMenu').classList.remove('active');
        });
    });
}

function updateActiveNavLink(href) {
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === href) {
            link.classList.add('active');
        }
    });
}

// ============================================
// عرض الأقسام في الشريط الجانبي
// ============================================

function renderSidebarCategories() {
    const sidebarCats = document.getElementById('sidebarCategories');
    if (!sidebarCats) return;
    
    let html = '<li class="sidebar-cat-item active" onclick="filterByCategory(\'all\', this)">الكل</li>';
    Object.keys(categoriesData).forEach(cat => {
        html += `<li class="sidebar-cat-item" onclick="filterByCategory('${cat}', this)">${cat}</li>`;
    });
    sidebarCats.innerHTML = html;
}

function filterByCategory(cat, element) {
    activeCategory = cat;
    showingFavorites = false;
    showingFeatured = false;
    
    document.querySelectorAll('.sidebar-cat-item').forEach(el => el.classList.remove('active'));
    if (element) element.classList.add('active');
    
    resetDisplayedProducts();
    renderMainContent();
}

// ============================================
// الحصول على المنتجات المصفاة
// ============================================

function getFilteredProducts() {
    let products = allProducts;
    // تصفية حسب المفضلة
    if (showingFavorites) {
        products = products.filter(p => favorites.includes(p.id));
    }
    // تصفية حسب المنتجات المميزة
    if (showingFeatured) {
        products = products.filter(p => p.featured);
    }
    // تصفية حسب القسم الرئيسي
    if (activeCategory !== 'all') {
        products = products.filter(p => p.category === activeCategory);
        // إذا كان هناك تصنيف فرعي محدد
        if (currentSubcategory) {
            products = products.filter(p => p.subcategory === currentSubcategory);
        }
    }
    // تصفية حسب السعر
    products = products.filter(p => p.priceNum >= priceFilter.min && p.priceNum <= priceFilter.max);
    // الترتيب
    products = sortProducts(products);
    return products;
}

// ============================================
// تحميل المزيد من المنتجات
// ============================================

function loadMoreProducts() {
    const products = getFilteredProducts();
    const remainingProducts = products.length - displayedProductsCount;
    
    if (remainingProducts <= 0) {
        // إخفاء زر "عرض المزيد" إذا لم يكن هناك المزيد
        const loadMoreBtn = document.querySelector('.load-more-btn');
        if (loadMoreBtn) {
            loadMoreBtn.style.display = 'none';
        }
        return;
    }
    
    // حساب عدد المنتجات الجديدة للتحميل
    const productsToLoad = Math.min(productsPerLoad, remainingProducts);
    
    // إضافة المنتجات الجديدة إلى المنتجات الحالية
    const newProducts = products.slice(displayedProductsCount, displayedProductsCount + productsToLoad);
    currentProducts = [...currentProducts, ...newProducts];
    displayedProductsCount += productsToLoad;
    
    // عرض المنتجات الجديدة
    displayProducts(currentProducts);
    
    // تحديث زر "عرض المزيد"
    updateLoadMoreButton(products.length);
}

function updateLoadMoreButton(totalProducts) {
    const loadMoreBtn = document.querySelector('.load-more-btn');
    if (!loadMoreBtn) return;
    
    const remainingProducts = totalProducts - displayedProductsCount;
    
    if (remainingProducts <= 0) {
        loadMoreBtn.style.display = 'none';
        loadMoreBtn.innerHTML = '<i class="fas fa-check"></i> تم عرض جميع المنتجات';
    } else {
        loadMoreBtn.style.display = 'block';
        loadMoreBtn.innerHTML = `
            <i class="fas fa-arrow-down"></i> عرض المزيد (${remainingProducts} منتج متبقي)
        `;
    }
}

// ============================================
// عرض المنتجات في الشبكة
// ============================================

function displayProducts(products) {
    const container = document.getElementById('dynamic-sections');
    if (!container) return;
    
    // إنشاء HTML للمنتجات
    const productsHtml = products.map(p => createProductCardHtml(p)).join('');
    
    // تحديث أو إنشاء قسم المنتجات
    let productsGrid = container.querySelector('.products-grid');
    if (!productsGrid) {
        container.innerHTML = `
            <section class="products-section">
                <div class="section-header">
                    <h2 class="section-title">
                        ${getSectionTitle()}
                        <span class="results-count">(${products.length} منتج)</span>
                    </h2>
                </div>
                <div class="products-grid ${currentView}">
                    ${productsHtml}
                </div>
                <div class="load-more-container" id="loadMoreContainer">
                    <button class="load-more-btn" onclick="loadMoreProducts()">
                        <i class="fas fa-arrow-down"></i> عرض المزيد
                    </button>
                </div>
            </section>
        `;
    } else {
        productsGrid.innerHTML = productsHtml;
        const loadMoreContainer = container.querySelector('#loadMoreContainer');
        if (loadMoreContainer) {
            loadMoreContainer.style.display = 'block';
        }
    }
    
    applyViewToGrids();
    initLazyLoading();
    
    // تحديث زر "عرض المزيد"
    const totalProducts = getFilteredProducts().length;
    updateLoadMoreButton(totalProducts);
}

// ============================================
// عرض المحتوى الرئيسي
// ============================================

function renderMainContent() {
    const products = getFilteredProducts();
    
    if (products.length === 0) {
        showNoProductsMessage();
        return;
    }
    
    // إعادة تعيين العدادات
    resetDisplayedProducts();
    
    // تحميل الدفعة الأولى من المنتجات
    const initialProducts = products.slice(0, productsPerLoad);
    currentProducts = initialProducts;
    displayedProductsCount = initialProducts.length;
    
    // عرض المنتجات
    displayProducts(currentProducts);
}

function showNoProductsMessage() {
    const container = document.getElementById('dynamic-sections');
    if (!container) return;
    
    container.innerHTML = `
        <div class="no-products">
            <i class="fas fa-${showingFavorites ? 'heart' : showingFeatured ? 'crown' : 'search'}"></i>
            <h3>لا توجد منتجات</h3>
            <p>${getNoProductsMessage()}</p>
            ${showingFavorites || showingFeatured ? '' : '<button onclick="resetFilters()" class="primary-btn">إعادة تعيين الفلاتر</button>'}
        </div>
    `;
}

function getNoProductsMessage() {
    if (showingFavorites) return 'لم تقم بإضافة أي منتجات إلى المفضلة بعد.';
    if (showingFeatured) return 'لا توجد منتجات مميزة حالياً.';
    return 'لا توجد منتجات تطابق معايير البحث والتصفية.';
}

function getSectionTitle() {
    if (showingFavorites) return 'منتجاتك المفضلة';
    if (showingFeatured) return 'المنتجات المميزة';
    if (currentSubcategory) return `${currentMainCategory} - ${currentSubcategory}`;
    if (activeCategory !== 'all') return activeCategory;
    return 'جميع المنتجات';
}

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

function resetFilters() {
    activeCategory = 'all';
    currentSort = 'default';
    priceFilter = { min: 0, max: Infinity };
    showingFavorites = false;
    showingFeatured = false;
    currentMainCategory = null;
    currentSubcategory = null;
    
    expandedCategories.clear();
    
    document.getElementById('minPrice').value = '';
    document.getElementById('maxPrice').value = '';
    document.getElementById('sortSelect').value = 'default';
    
    renderMainCategories();
    
    const favToggle = document.getElementById('favToggle');
    if (favToggle) favToggle.classList.remove('active');
    
    resetDisplayedProducts();
    renderMainContent();
}

// ============================================
// إعداد جميع الأحداث
// ============================================

function setupEventListeners() {
    setupSearch();
    setupCart();
    setupCheckout();
    
    // ESC لإغلاق كل شيء
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
            closeSearchResults();
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
            showFavoritesFromBottomNav();
        });
    }
}

// ============================================
// عرض قائمة التنقل
// ============================================

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
    
    // إضافة رابط للـ Drawer
    navHtml += '<li><a href="#" class="nav-link open-drawer">جميع الأقسام</a></li>';
    mobileHtml += '<li><a href="#" class="mobile-nav-link open-drawer">جميع الأقسام</a></li>';
    
    mainNav.innerHTML = navHtml;
    mobileNav.innerHTML = mobileHtml;
    
    setupNavigationLinks();
}

function setupNavigationLinks() {
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            
            if (href === '#home') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                updateActiveNavLink('home');
                updateBottomNavActive('home');
                return;
            }
            
            if (href.startsWith('#cat-')) {
                e.preventDefault();
                const catIndex = href.replace('#cat-', '');
                const categoryName = Object.keys(categoriesData)[catIndex];
                if (categoryName) {
                    filterByCategory(categoryName);
                    updateActiveNavLink(href);
                    
                    // التمرير إلى القسم
                    setTimeout(() => {
                        const element = document.getElementById(`cat-${catIndex}`);
                        if (element) {
                            element.scrollIntoView({ behavior: 'smooth' });
                        }
                    }, 300);
                }
            }
            
            if (href === '#') {
                e.preventDefault();
                openDrawer();
            }
            
            // إغلاق قائمة الجوال إذا كانت مفتوحة
            document.getElementById('mobileMenu').classList.remove('active');
        });
    });
}

function updateActiveNavLink(href) {
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === href) {
            link.classList.add('active');
        }
    });
}

// ============================================
// عرض الأقسام في الشريط الجانبي
// ============================================

function renderSidebarCategories() {
    const sidebarCats = document.getElementById('sidebarCategories');
    if (!sidebarCats) return;
    
    let html = '<li class="sidebar-cat-item active" onclick="filterByCategory(\'all\', this)">الكل</li>';
    Object.keys(categoriesData).forEach(cat => {
        html += `<li class="sidebar-cat-item" onclick="filterByCategory('${cat}', this)">${cat}</li>`;
    });
    sidebarCats.innerHTML = html;
}

function filterByCategory(cat, element) {
    activeCategory = cat;
    showingFavorites = false;
    showingFeatured = false;
    
    document.querySelectorAll('.sidebar-cat-item').forEach(el => el.classList.remove('active'));
    if (element) element.classList.add('active');
    
    resetDisplayedProducts();
    renderMainContent();
}

// ============================================
// الحصول على المنتجات المصفاة
// ============================================

function getFilteredProducts() {
    let products = allProducts;
    // تصفية حسب المفضلة
    if (showingFavorites) {
        products = products.filter(p => favorites.includes(p.id));
    }
    // تصفية حسب المنتجات المميزة
    if (showingFeatured) {
        products = products.filter(p => p.featured);
    }
    // تصفية حسب القسم الرئيسي
    if (activeCategory !== 'all') {
        products = products.filter(p => p.category === activeCategory);
        // إذا كان هناك تصنيف فرعي محدد
        if (currentSubcategory) {
            products = products.filter(p => p.subcategory === currentSubcategory);
        }
    }
    // تصفية حسب السعر
    products = products.filter(p => p.priceNum >= priceFilter.min && p.priceNum <= priceFilter.max);
    // الترتيب
    products = sortProducts(products);
    return products;
}

// ============================================
// تحميل المزيد من المنتجات
// ============================================

function loadMoreProducts() {
    const products = getFilteredProducts();
    const remainingProducts = products.length - displayedProductsCount;
    
    if (remainingProducts <= 0) {
        // إخفاء زر "عرض المزيد" إذا لم يكن هناك المزيد
        const loadMoreBtn = document.querySelector('.load-more-btn');
        if (loadMoreBtn) {
            loadMoreBtn.style.display = 'none';
        }
        return;
    }
    
    // حساب عدد المنتجات الجديدة للتحميل
    const productsToLoad = Math.min(productsPerLoad, remainingProducts);
    
    // إضافة المنتجات الجديدة إلى المنتجات الحالية
    const newProducts = products.slice(displayedProductsCount, displayedProductsCount + productsToLoad);
    currentProducts = [...currentProducts, ...newProducts];
    displayedProductsCount += productsToLoad;
    
    // عرض المنتجات الجديدة
    displayProducts(currentProducts);
    
    // تحديث زر "عرض المزيد"
    updateLoadMoreButton(products.length);
}

function updateLoadMoreButton(totalProducts) {
    const loadMoreBtn = document.querySelector('.load-more-btn');
    if (!loadMoreBtn) return;
    
    const remainingProducts = totalProducts - displayedProductsCount;
    
    if (remainingProducts <= 0) {
        loadMoreBtn.style.display = 'none';
        loadMoreBtn.innerHTML = '<i class="fas fa-check"></i> تم عرض جميع المنتجات';
    } else {
        loadMoreBtn.style.display = 'block';
        loadMoreBtn.innerHTML = `
            <i class="fas fa-arrow-down"></i> عرض المزيد (${remainingProducts} منتج متبقي)
        `;
    }
}

// ============================================
// عرض المنتجات في الشبكة
// ============================================

function displayProducts(products) {
    const container = document.getElementById('dynamic-sections');
    if (!container) return;
    
    // إنشاء HTML للمنتجات
    const productsHtml = products.map(p => createProductCardHtml(p)).join('');
    
    // تحديث أو إنشاء قسم المنتجات
    let productsGrid = container.querySelector('.products-grid');
    if (!productsGrid) {
        container.innerHTML = `
            <section class="products-section">
                <div class="section-header">
                    <h2 class="section-title">
                        ${getSectionTitle()}
                        <span class="results-count">(${products.length} منتج)</span>
                    </h2>
                </div>
                <div class="products-grid ${currentView}">
                    ${productsHtml}
                </div>
                <div class="load-more-container" id="loadMoreContainer">
                    <button class="load-more-btn" onclick="loadMoreProducts()">
                        <i class="fas fa-arrow-down"></i> عرض المزيد
                    </button>
                </div>
            </section>
        `;
    } else {
        productsGrid.innerHTML = productsHtml;
        const loadMoreContainer = container.querySelector('#loadMoreContainer');
        if (loadMoreContainer) {
            loadMoreContainer.style.display = 'block';
        }
    }
    
    applyViewToGrids();
    initLazyLoading();
    
    // تحديث زر "عرض المزيد"
    const totalProducts = getFilteredProducts().length;
    updateLoadMoreButton(totalProducts);
}

// ============================================
// عرض المحتوى الرئيسي
// ============================================

function renderMainContent() {
    const products = getFilteredProducts();
    
    if (products.length === 0) {
        showNoProductsMessage();
        return;
    }
    
    // إعادة تعيين العدادات
    resetDisplayedProducts();
    
    // تحميل الدفعة الأولى من المنتجات
    const initialProducts = products.slice(0, productsPerLoad);
    currentProducts = initialProducts;
    displayedProductsCount = initialProducts.length;
    
    // عرض المنتجات
    displayProducts(currentProducts);
}

function showNoProductsMessage() {
    const container = document.getElementById('dynamic-sections');
    if (!container) return;
    
    container.innerHTML = `
        <div class="no-products">
            <i class="fas fa-${showingFavorites ? 'heart' : showingFeatured ? 'crown' : 'search'}"></i>
            <h3>لا توجد منتجات</h3>
            <p>${getNoProductsMessage()}</p>
            ${showingFavorites || showingFeatured ? '' : '<button onclick="resetFilters()" class="primary-btn">إعادة تعيين الفلاتر</button>'}
        </div>
    `;
}

function getNoProductsMessage() {
    if (showingFavorites) return 'لم تقم بإضافة أي منتجات إلى المفضلة بعد.';
    if (showingFeatured) return 'لا توجد منتجات مميزة حالياً.';
    return 'لا توجد منتجات تطابق معايير البحث والتصفية.';
}

function getSectionTitle() {
    if (showingFavorites) return 'منتجاتك المفضلة';
    if (showingFeatured) return 'المنتجات المميزة';
    if (currentSubcategory) return `${currentMainCategory} - ${currentSubcategory}`;
    if (activeCategory !== 'all') return activeCategory;
    return 'جميع المنتجات';
}

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

function resetFilters() {
    activeCategory = 'all';
    currentSort = 'default';
    priceFilter = { min: 0, max: Infinity };
    showingFavorites = false;
    showingFeatured = false;
    currentMainCategory = null;
    currentSubcategory = null;
    
    expandedCategories.clear();
    
    document.getElementById('minPrice').value = '';
    document.getElementById('maxPrice').value = '';
    document.getElementById('sortSelect').value = 'default';
    
    renderMainCategories();
    
    const favToggle = document.getElementById('favToggle');
    if (favToggle) favToggle.classList.remove('active');
    
    resetDisplayedProducts();
    renderMainContent();
}

// ============================================
// إعداد جميع الأحداث
// ============================================

function setupEventListeners() {
    setupSearch();
    setupCart();
    setupCheckout();
    
    // ESC لإغلاق كل شيء
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
            closeSearchResults();
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
            showFavoritesFromBottomNav();
        });
    }
}

// ============================================
// عرض قائمة التنقل
// ============================================

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
    
    // إضافة رابط للـ Drawer
    navHtml += '<li><a href="#" class="nav-link open-drawer">جميع الأقسام</a></li>';
    mobileHtml += '<li><a href="#" class="mobile-nav-link open-drawer">جميع الأقسام</a></li>';
    
    mainNav.innerHTML = navHtml;
    mobileNav.innerHTML = mobileHtml;
    
    setupNavigationLinks();
}

function setupNavigationLinks() {
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            
            if (href === '#home') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                updateActiveNavLink('home');
                updateBottomNavActive('home');
                return;
            }
            
                        if (href.startsWith('#cat-')) {
                            e.preventDefault();
                            const catIndex = href.replace('#cat-', '');
                            const categoryName = Object.keys(categoriesData)[catIndex];
                            if (categoryName) {
                                filterByCategory(categoryName);
                                updateActiveNavLink(href);
                                
                                // التمرير إلى القسم
                                setTimeout(() => {
                                    const element = document.getElementById(`cat-${catIndex}`);
                                    if (element) {
                                        element.scrollIntoView({ behavior: 'smooth' });
                                    }
                                }, 300);
                            }
                        }
                        
                        if (href === '#') {
                            e.preventDefault();
                            openDrawer();
                        }
                        
                        // إغلاق قائمة الجوال إذا كانت مفتوحة
                        document.getElementById('mobileMenu').classList.remove('active');
                    });
                });
            }