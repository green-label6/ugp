// إضافة المتغيرات الجديدة
let advancedSearch = {
    priceMin: 0,
    priceMax: Infinity,
    categories: [],
    featured: false,
    inStock: true,
    discount: false,
    sortBy: 'relevance',
    limit: 12
};

// تحديث دالة initializeApp
function initializeApp() {
    setCurrentYear();
    loadProducts();
    setupEventListeners();
    updateCartUI();
    updateFavoritesUI();
    setupMobileMenu();
    setupBackToTop();
    setupViewOptions();
    setupSortAndFilter();
    setupModal();
    setupNotifications();
    setupMobileQuickButtons();
    setupAdvancedSearch();
    checkMobileDevice();
}

// إعداد البحث المتقدم
function setupAdvancedSearch() {
    // فتح البحث المتقدم للكمبيوتر
    const advancedSearchBtn = document.getElementById('advancedSearchBtn');
    const closeAdvancedSearch = document.getElementById('closeAdvancedSearch');
    const advancedSearchModal = document.getElementById('advancedSearchModal');
    
    if (advancedSearchBtn) {
        advancedSearchBtn.addEventListener('click', () => {
            advancedSearchModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            initializeAdvancedSearch();
        });
    }
    
    if (closeAdvancedSearch) {
        closeAdvancedSearch.addEventListener('click', () => {
            advancedSearchModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    }
    
    // إغلاق عند النقر خارج النافذة
    advancedSearchModal.addEventListener('click', (e) => {
        if (e.target === advancedSearchModal) {
            advancedSearchModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
    
    // فتح البحث المتقدم للجوال
    const mobileAdvancedSearchBtn = document.getElementById('mobileAdvancedSearchBtn');
    const closeMobileSearch = document.getElementById('closeMobileSearch');
    const mobileAdvancedSearch = document.getElementById('mobileAdvancedSearch');
    
    if (mobileAdvancedSearchBtn) {
        mobileAdvancedSearchBtn.addEventListener('click', () => {
            mobileAdvancedSearch.classList.add('active');
            document.body.style.overflow = 'hidden';
            initializeMobileSearch();
        });
    }
    
    if (closeMobileSearch) {
        closeMobileSearch.addEventListener('click', () => {
            mobileAdvancedSearch.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }
    
    // تهيئة منزلقات السعر
    setupPriceSliders();
    
    // إعداد الأقسام للفلاتر
    setupCategoryFilters();
    
    // تطبيق البحث المتقدم
    const applyAdvancedSearch = document.getElementById('applyAdvancedSearch');
    if (applyAdvancedSearch) {
        applyAdvancedSearch.addEventListener('click', performAdvancedSearch);
    }
    
    // إعادة تعيين البحث المتقدم
    const resetAdvancedSearch = document.getElementById('resetAdvancedSearch');
    if (resetAdvancedSearch) {
        resetAdvancedSearch.addEventListener('click', resetAdvancedSearchFilters);
    }
    
    // تطبيق البحث للجوال
    const applyMobileSearch = document.getElementById('applyMobileSearch');
    if (applyMobileSearch) {
        applyMobileSearch.addEventListener('click', performMobileSearch);
    }
    
    // إعادة تعيين البحث للجوال
    const resetMobileSearch = document.getElementById('resetMobileSearch');
    if (resetMobileSearch) {
        resetMobileSearch.addEventListener('click', resetMobileSearchFilters);
    }
    
    // البحث السريع بالعلامات
    setupQuickSearchTags();
}

// تهيئة البحث المتقدم
function initializeAdvancedSearch() {
    const priceRangeMin = document.getElementById('priceRangeMin');
    const priceRangeMax = document.getElementById('priceRangeMax');
    const searchMinPrice = document.getElementById('searchMinPrice');
    const searchMaxPrice = document.getElementById('searchMaxPrice');
    
    if (priceRangeMin && priceRangeMax) {
        priceRangeMin.value = advancedSearch.priceMin;
        priceRangeMax.value = advancedSearch.priceMax;
        
        // تحديث التسميات
        document.getElementById('minPriceLabel').textContent = formatPrice(advancedSearch.priceMin);
        document.getElementById('maxPriceLabel').textContent = formatPrice(advancedSearch.priceMax);
        
        if (searchMinPrice) searchMinPrice.value = advancedSearch.priceMin || '';
        if (searchMaxPrice) searchMaxPrice.value = advancedSearch.priceMax === Infinity ? '' : advancedSearch.priceMax;
    }
    
    // تحديث خيارات الفرز
    const searchSortBy = document.getElementById('searchSortBy');
    const searchLimit = document.getElementById('searchLimit');
    
    if (searchSortBy) searchSortBy.value = advancedSearch.sortBy;
    if (searchLimit) searchLimit.value = advancedSearch.limit;
    
    // تحديث الخيارات الخاصة
    const featuredOnly = document.getElementById('featuredOnly');
    const inStockOnly = document.getElementById('inStockOnly');
    const discountOnly = document.getElementById('discountOnly');
    
    if (featuredOnly) featuredOnly.checked = advancedSearch.featured;
    if (inStockOnly) inStockOnly.checked = advancedSearch.inStock;
    if (discountOnly) discountOnly.checked = advancedSearch.discount;
}

// تهيئة البحث للجوال
function initializeMobileSearch() {
    const mobileMinPrice = document.getElementById('mobileMinPrice');
    const mobileMaxPrice = document.getElementById('mobileMaxPrice');
    
    if (mobileMinPrice && mobileMaxPrice) {
        mobileMinPrice.value = advancedSearch.priceMin || '';
        mobileMaxPrice.value = advancedSearch.priceMax === Infinity ? '' : advancedSearch.priceMax;
        
        updateMobilePriceRange();
    }
    
    // تحديث الخيارات الخاصة
    const mobileFeaturedOnly = document.getElementById('mobileFeaturedOnly');
    const mobileInStockOnly = document.getElementById('mobileInStockOnly');
    
    if (mobileFeaturedOnly) mobileFeaturedOnly.checked = advancedSearch.featured;
    if (mobileInStockOnly) mobileInStockOnly.checked = advancedSearch.inStock;
}

// إعداد منزلقات السعر
function setupPriceSliders() {
    const priceRangeMin = document.getElementById('priceRangeMin');
    const priceRangeMax = document.getElementById('priceRangeMax');
    const searchMinPrice = document.getElementById('searchMinPrice');
    const searchMaxPrice = document.getElementById('searchMaxPrice');
    
    if (priceRangeMin && priceRangeMax && searchMinPrice && searchMaxPrice) {
        const updatePriceLabels = () => {
            const minValue = parseInt(priceRangeMin.value);
            const maxValue = parseInt(priceRangeMax.value);
            
            document.getElementById('minPriceLabel').textContent = formatPrice(minValue);
            document.getElementById('maxPriceLabel').textContent = formatPrice(maxValue);
            
            searchMinPrice.value = minValue;
            searchMaxPrice.value = maxValue;
        };
        
        priceRangeMin.addEventListener('input', updatePriceLabels);
        priceRangeMax.addEventListener('input', updatePriceLabels);
        
        searchMinPrice.addEventListener('input', (e) => {
            const value = Math.min(parseInt(e.target.value) || 0, priceRangeMax.value);
            priceRangeMin.value = value;
            updatePriceLabels();
        });
        
        searchMaxPrice.addEventListener('input', (e) => {
            const value = Math.max(parseInt(e.target.value) || 1000000, priceRangeMin.value);
            priceRangeMax.value = value;
            updatePriceLabels();
        });
    }
}

// إعداد فلاتر الأقسام
function setupCategoryFilters() {
    // للكمبيوتر
    const categoryFilters = document.getElementById('categoryFilters');
    if (categoryFilters) {
        let html = '';
        Object.keys(categoriesData).forEach((category, index) => {
            const isActive = advancedSearch.categories.includes(category);
            html += `
                <div class="category-filter-item ${isActive ? 'active' : ''}" 
                     onclick="toggleCategoryFilter('${category}', this)">
                    <input type="checkbox" ${isActive ? 'checked' : ''}>
                    <i class="fas fa-folder"></i>
                    <span>${category}</span>
                </div>
            `;
        });
        categoryFilters.innerHTML = html;
    }
    
    // للجوال
    const mobileCategoryFilters = document.getElementById('mobileCategoryFilters');
    if (mobileCategoryFilters) {
        let html = '';
        Object.keys(categoriesData).forEach((category, index) => {
            const isActive = advancedSearch.categories.includes(category);
            html += `
                <label class="filter-checkbox" onclick="toggleMobileCategoryFilter('${category}', this)">
                    <input type="checkbox" ${isActive ? 'checked' : ''}>
                    <span class="checkbox-label">
                        <i class="fas fa-folder"></i>
                        ${category}
                    </span>
                </label>
            `;
        });
        mobileCategoryFilters.innerHTML = html;
    }
}

// تبديل فلتر القسم للكمبيوتر
function toggleCategoryFilter(category, element) {
    const index = advancedSearch.categories.indexOf(category);
    
    if (index === -1) {
        advancedSearch.categories.push(category);
        element.classList.add('active');
        element.querySelector('input').checked = true;
    } else {
        advancedSearch.categories.splice(index, 1);
        element.classList.remove('active');
        element.querySelector('input').checked = false;
    }
}

// تبديل فلتر القسم للجوال
function toggleMobileCategoryFilter(category, element) {
    const index = advancedSearch.categories.indexOf(category);
    
    if (index === -1) {
        advancedSearch.categories.push(category);
    } else {
        advancedSearch.categories.splice(index, 1);
    }
    
    // تحديث حالة العنصر
    const checkbox = element.querySelector('input');
    checkbox.checked = !checkbox.checked;
}

// إعداد البحث السريع بالعلامات
function setupQuickSearchTags() {
    const quickSearchTags = document.getElementById('quickSearchTags');
    if (quickSearchTags) {
        quickSearchTags.querySelectorAll('.search-tag').forEach(tag => {
            tag.addEventListener('click', () => {
                const searchText = tag.getAttribute('data-search');
                performSearch(searchText);
            });
        });
    }
}

// البحث المتقدم
function performAdvancedSearch() {
    // جمع البيانات من النموذج
    const searchMinPrice = document.getElementById('searchMinPrice');
    const searchMaxPrice = document.getElementById('searchMaxPrice');
    const searchSortBy = document.getElementById('searchSortBy');
    const searchLimit = document.getElementById('searchLimit');
    const featuredOnly = document.getElementById('featuredOnly');
    const inStockOnly = document.getElementById('inStockOnly');
    const discountOnly = document.getElementById('discountOnly');
    
    if (searchMinPrice) advancedSearch.priceMin = parseInt(searchMinPrice.value) || 0;
    if (searchMaxPrice) advancedSearch.priceMax = parseInt(searchMaxPrice.value) || Infinity;
    if (searchSortBy) advancedSearch.sortBy = searchSortBy.value;
    if (searchLimit) advancedSearch.limit = parseInt(searchLimit.value) || 12;
    if (featuredOnly) advancedSearch.featured = featuredOnly.checked;
    if (inStockOnly) advancedSearch.inStock = inStockOnly.checked;
    if (discountOnly) advancedSearch.discount = discountOnly.checked;
    
    // تطبيق البحث
    applyAdvancedSearchFilters();
    
    // إغلاق النافذة
    document.getElementById('advancedSearchModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// البحث المتقدم للجوال
function performMobileSearch() {
    const mobileMinPrice = document.getElementById('mobileMinPrice');
    const mobileMaxPrice = document.getElementById('mobileMaxPrice');
    const mobileFeaturedOnly = document.getElementById('mobileFeaturedOnly');
    const mobileInStockOnly = document.getElementById('mobileInStockOnly');
    
    if (mobileMinPrice) advancedSearch.priceMin = parseInt(mobileMinPrice.value) || 0;
    if (mobileMaxPrice) advancedSearch.priceMax = parseInt(mobileMaxPrice.value) || Infinity;
    if (mobileFeaturedOnly) advancedSearch.featured = mobileFeaturedOnly.checked;
    if (mobileInStockOnly) advancedSearch.inStock = mobileInStockOnly.checked;
    
    // تطبيق البحث
    applyAdvancedSearchFilters();
    
    // إغلاق النافذة
    document.getElementById('mobileAdvancedSearch').classList.remove('active');
    document.body.style.overflow = 'auto';
}

// تطبيق فلاتر البحث المتقدم
function applyAdvancedSearchFilters() {
    let results = allProducts;
    
    // تصفية حسب السعر
    results = results.filter(p => 
        p.priceNum >= advancedSearch.priceMin && 
        p.priceNum <= advancedSearch.priceMax
    );
    
    // تصفية حسب الأقسام
    if (advancedSearch.categories.length > 0) {
        results = results.filter(p => advancedSearch.categories.includes(p.category));
    }
    
    // تصفية حسب المنتجات المميزة
    if (advancedSearch.featured) {
        results = results.filter(p => p.featured);
    }
    
    // تصفية حسب الخصم (إذا أضفنا خاصية الخصم لاحقاً)
    if (advancedSearch.discount) {
        results = results.filter(p => p.discount); // يمكن إضافة خاصية discount للمنتجات
    }
    
    // ترتيب النتائج
    results = sortSearchResults(results, advancedSearch.sortBy);
    
    // تحديد عدد النتائج
    if (advancedSearch.limit !== 'all') {
        results = results.slice(0, advancedSearch.limit);
    }
    
    // عرض النتائج
    displayAdvancedSearchResults(results);
}

// ترتيب نتائج البحث
function sortSearchResults(results, sortBy) {
    switch(sortBy) {
        case 'price_low':
            return results.sort((a, b) => a.priceNum - b.priceNum);
        case 'price_high':
            return results.sort((a, b) => b.priceNum - a.priceNum);
        case 'newest':
            return results.sort((a, b) => b.id - a.id); // افتراضاً أن ID الأعلى هو الأحدث
        case 'popular':
            // يمكن إضافة خاصية الشعبية للمنتجات لاحقاً
            return results.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        default: // relevance
            return results;
    }
}

// عرض نتائج البحث المتقدم
function displayAdvancedSearchResults(results) {
    const container = document.getElementById('dynamic-sections');
    if (!container) return;
    
    if (results.length === 0) {
        container.innerHTML = `
            <div class="no-products">
                <i class="fas fa-search"></i>
                <h3>لا توجد نتائج</h3>
                <p>لم نتمكن من العثور على منتجات تطابق معايير البحث.</p>
                <button onclick="resetAdvancedSearchFilters()" class="primary-btn">
                    <i class="fas fa-redo"></i> إعادة تعيين البحث
                </button>
            </div>
        `;
        return;
    }
    
    const searchSummary = getAdvancedSearchSummary();
    
    container.innerHTML = `
        <section class="products-section">
            <div class="section-header">
                <h2 class="section-title">
                    نتائج البحث المتقدم
                    <span class="results-count">(${results.length} منتج)</span>
                </h2>
                <div class="search-summary">
                    <p>${searchSummary}</p>
                    <button onclick="resetAdvancedSearchFilters()" class="secondary-btn">
                        <i class="fas fa-times"></i> إزالة الفلاتر
                    </button>
                </div>
            </div>
            <div class="products-grid ${currentView}">
                ${results.map(p => createProductCardHtml(p)).join('')}
            </div>
        </section>
    `;
    
    applyViewToGrids();
    initLazyLoading();
    
    // التمرير إلى القسم
    container.scrollIntoView({ behavior: 'smooth' });
}

// الحصول على ملخص البحث
function getAdvancedSearchSummary() {
    const parts = [];
    
    if (advancedSearch.priceMin > 0 || advancedSearch.priceMax < Infinity) {
        const min = advancedSearch.priceMin > 0 ? formatPrice(advancedSearch.priceMin) : 'أي سعر';
        const max = advancedSearch.priceMax < Infinity ? formatPrice(advancedSearch.priceMax) : 'أي سعر';
        parts.push(`السعر: ${min} - ${max}`);
    }
    
    if (advancedSearch.categories.length > 0) {
        if (advancedSearch.categories.length === 1) {
            parts.push(`القسم: ${advancedSearch.categories[0]}`);
        } else {
            parts.push(`الأقسام: ${advancedSearch.categories.length}`);
        }
    }
    
    if (advancedSearch.featured) {
        parts.push('منتجات مميزة');
    }
    
    if (advancedSearch.discount) {
        parts.push('منتجات مخفضة');
    }
    
    return parts.length > 0 ? `تم البحث عن: ${parts.join('، ')}` : 'عرض جميع المنتجات';
}

// إعادة تعيين فلاتر البحث المتقدم
function resetAdvancedSearchFilters() {
    advancedSearch = {
        priceMin: 0,
        priceMax: Infinity,
        categories: [],
        featured: false,
        inStock: true,
        discount: false,
        sortBy: 'relevance',
        limit: 12
    };
    
    // إعادة تعيين الواجهة
    initializeAdvancedSearch();
    initializeMobileSearch();
    
    // العودة للعرض العادي
    renderMainContent();
}

// إعادة تعيين فلاتر البحث للجوال
function resetMobileSearchFilters() {
    resetAdvancedSearchFilters();
    updateMobilePriceRange();
}

// تحديث عرض نطاق السعر للجوال
function updateMobilePriceRange() {
    const mobileMinPrice = document.getElementById('mobileMinPrice');
    const mobileMaxPrice = document.getElementById('mobileMaxPrice');
    const mobilePriceRangeText = document.getElementById('mobilePriceRangeText');
    
    if (mobileMinPrice && mobileMaxPrice && mobilePriceRangeText) {
        const min = mobileMinPrice.value ? formatPrice(parseInt(mobileMinPrice.value)) : 'أي سعر';
        const max = mobileMaxPrice.value ? formatPrice(parseInt(mobileMaxPrice.value)) : 'أي سعر';
        
        mobilePriceRangeText.textContent = `${min} - ${max}`;
    }
}

// تحديث دالة البحث الأساسية لدعم البحث بالسعر
function performSearch(query) {
    const results = document.getElementById('searchResults');
    const searchInput = document.getElementById('searchInput');
    
    if (!query || !query.trim()) {
        if (results) results.style.display = 'none';
        return;
    }
    
    // البحث العادي بالاسم والوصف
    const textResults = allProducts.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.description.toLowerCase().includes(query.toLowerCase()) ||
        p.category.toLowerCase().includes(query.toLowerCase()) ||
        p.subcategory.toLowerCase().includes(query.toLowerCase())
    );
    
    // البحث بالسعر إذا كان النص يحتوي على أرقام
    const priceMatch = query.match(/(\d+([.,]\d+)?)/g);
    let priceResults = [];
    
    if (priceMatch) {
        const priceValue = parseFloat(priceMatch[0].replace(',', ''));
        if (!isNaN(priceValue)) {
            priceResults = allProducts.filter(p => {
                const productPrice = p.priceNum;
                const tolerance = productPrice * 0.1; // هامش 10%
                return Math.abs(productPrice - priceValue) <= tolerance;
            });
        }
    }
    
    // البحث بالكلمات المفتاحية الخاصة
    let keywordResults = [];
    const keywords = {
        'مميز': p => p.featured,
        'جديد': p => p.id > allProducts.length - 10, // آخر 10 منتجات
        'رخيص': p => p.priceNum < 50000,
        'غالي': p => p.priceNum > 100000,
        'أقل من': p => {
            const match = query.match(/أقل من (\d+)/);
            if (match) {
                const maxPrice = parseFloat(match[1]);
                return p.priceNum < maxPrice;
            }
            return false;
        },
        'أكثر من': p => {
            const match = query.match(/أكثر من (\d+)/);
            if (match) {
                const minPrice = parseFloat(match[1]);
                return p.priceNum > minPrice;
            }
            return false;
        }
    };
    
    for (const [keyword, filterFunc] of Object.entries(keywords)) {
        if (query.toLowerCase().includes(keyword.toLowerCase())) {
            keywordResults = allProducts.filter(filterFunc);
            break;
        }
    }
    
    // دمج النتائج مع إزالة التكرارات
    const allResults = [...textResults, ...priceResults, ...keywordResults];
    const uniqueResults = Array.from(new Set(allResults.map(p => p.id)))
        .map(id => allResults.find(p => p.id === id))
        .slice(0, 8);
    
    if (results) {
        if (uniqueResults.length === 0) {
            results.innerHTML = '<div class="no-results">لا توجد نتائج مطابقة</div>';
        } else {
            results.innerHTML = uniqueResults.map(p => `
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
    
    // إذا كان البحث من الهاتف وبه نتائج، عرضها كاملة
    if (window.innerWidth <= 768 && uniqueResults.length > 0) {
        displayAdvancedSearchResults(uniqueResults);
        if (results) results.style.display = 'none';
        if (searchInput) searchInput.value = '';
    }
}

// تحديث دالة تحميل المنتجات لإضافة بيانات إضافية
function flattenProducts() {
    allProducts = [];
    let idCounter = 1;
    for (const categoryName in categoriesData) {
        for (const subcategoryName in categoriesData[categoryName]) {
            categoriesData[categoryName][subcategoryName].forEach(product => {
                const isFeatured = featuredProducts.includes(idCounter);
                // إضافة خصائص إضافية للمنتجات
                const hasDiscount = Math.random() > 0.7; // 30% من المنتجات لديها خصم
                const discountPercentage = hasDiscount ? Math.floor(Math.random() * 30) + 10 : 0; // خصم 10-40%
                const originalPrice = parseFloat(product.price) || 0;
                const discountedPrice = hasDiscount ? originalPrice * (1 - discountPercentage / 100) : originalPrice;
                
                allProducts.push({
                    ...product,
                    id: idCounter++,
                    category: categoryName,
                    subcategory: subcategoryName,
                    priceNum: parseFloat(product.price) || 0,
                    originalPrice: originalPrice,
                    discountedPrice: discountedPrice,
                    discountPercentage: discountPercentage,
                    hasDiscount: hasDiscount,
                    description: product.description || 'لا يوجد وصف متاح للمنتج',
                    featured: isFeatured,
                    popularity: Math.floor(Math.random() * 100), // شعبية عشوائية للعرض
                    inStock: Math.random() > 0.1, // 90% من المنتجات متوفرة
                    dateAdded: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // تاريخ إضافة عشوائي
                });
            });
        }
    }
}

// تحديث دالة إنشاء بطاقة المنتج لإظهار الخصم
function createProductCardHtml(product) {
    const formattedPrice = formatPrice(product.price);
    const originalPrice = product.hasDiscount ? formatPrice(product.originalPrice) : '';
    const cdnUrl = getCDNUrl(product.image);
    const isFav = favorites.includes(product.id);
    const isFeatured = product.featured;
    
    return `
        <div class="product-card" onclick="showProductDetails(${product.id})">
            ${isFeatured ? `<div class="featured-badge"><i class="fas fa-crown"></i> مميز</div>` : ''}
            ${product.hasDiscount ? `<div class="discount-badge">-${product.discountPercentage}%</div>` : ''}
            ${!product.inStock ? `<div class="out-of-stock-badge">غير متوفر</div>` : ''}
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
                    <div class="price-container">
                        ${product.hasDiscount ? `
                            <div class="original-price">${originalPrice}</div>
                            <div class="product-price discount">${formatPrice(product.discountedPrice)}</div>
                        ` : `
                            <div class="product-price">${formattedPrice}</div>
                        `}
                    </div>
                    ${product.inStock ? `
                        <button class="add-to-cart" onclick="addToCart(${product.id}, 1); event.stopPropagation();">
                            <i class="fas fa-cart-plus"></i>
                        </button>
                    ` : `
                        <button class="add-to-cart disabled" disabled>
                            <i class="fas fa-ban"></i>
                        </button>
                    `}
                </div>
            </div>
        </div>
    `;
}

// إضافة أنماط CSS للخصم
const discountStyles = document.createElement('style');
discountStyles.textContent = `
    .discount-badge {
        position: absolute;
        top: 15px;
        right: 15px;
        background: linear-gradient(135deg, #ff5722 0%, #ff9800 100%);
        color: white;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 700;
        z-index: 9;
        box-shadow: 0 4px 8px rgba(255, 87, 34, 0.3);
    }
    
    .out-of-stock-badge {
        position: absolute;
        top: 15px;
        right: 15px;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 700;
        z-index: 9;
    }
    
    .price-container {
        display: flex;
        flex-direction: column;
        gap: 5px;
    }
    
    .original-price {
        font-size: 0.9rem;
        color: var(--gray-color);
        text-decoration: line-through;
    }
    
    .product-price.discount {
        color: var(--danger-color);
        font-weight: 800;
    }
    
    .add-to-cart.disabled {
        background: var(--gray-color);
        cursor: not-allowed;
    }
    
    .search-summary {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 10px;
        padding: 15px;
        background: var(--gray-lighter);
        border-radius: var(--border-radius);
        border: 1px solid var(--gray-light);
    }
    
    .search-summary p {
        margin: 0;
        color: var(--gray-color);
        font-size: 0.95rem;
    }
    
    .search-summary .secondary-btn {
        padding: 8px 15px;
        font-size: 0.9rem;
    }
`;
document.head.appendChild(discountStyles);