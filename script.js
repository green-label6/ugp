// ============================================
// البيانات والمتغيرات العامة
// ============================================

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
let activeSubcategory = 'all';
let featuredProducts = [1, 3, 5, 7, 9, 11];

// متغيرات التحميل التدريجي
let productsPerLoad = 10;
let displayedProductsCount = 0;
let currentProducts = [];

// متغير حفظ المنتج الحالي في النافذة المنبثقة
let currentProductInModal = null;

// ============================================
// تهيئة الموقع عند تحميل الصفحة
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// ============================================
// دالة التهيئة الرئيسية
// ============================================

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
    setupDrawer();
    setupBottomNavigation();
    setupDefaultView();
    setupShareButton();
}

// ============================================
// وظائف مساعدة عامة
// ============================================

function setCurrentYear() {
    document.getElementById('currentYear').textContent = new Date().getFullYear();
}

function setupNotifications() {
    const notificationContainer = document.getElementById('notificationContainer');
    if (!notificationContainer) {
        const container = document.createElement('div');
        container.id = 'notificationContainer';
        container.className = 'notification-container';
        document.body.appendChild(container);
    }
}

function showNotification(message, type) {
    const notificationContainer = document.getElementById('notificationContainer');
    if (!notificationContainer) return;
    
    const notification = document.createElement('div');
    notification.className = 'notification ' + type;
    
    let iconClass = 'check-circle';
    if (type === 'error') iconClass = 'exclamation-circle';
    else if (type === 'warning') iconClass = 'exclamation-triangle';
    else if (type === 'info') iconClass = 'info-circle';
    
    notification.innerHTML = '<i class="fas fa-' + iconClass + '"></i><span>' + message + '</span>';
    
    notificationContainer.appendChild(notification);
    
    setTimeout(function() {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(function() { notification.remove(); }, 300);
    }, 3000);
}

// ============================================
// إعداد زر المشاركة
// ============================================

function setupShareButton() {
    const shareBtn = document.getElementById('modalShare');
    if (shareBtn) {
        shareBtn.addEventListener('click', shareProduct);
    }
}

function shareProduct() {
    if (!currentProductInModal) return;
    
    const product = currentProductInModal;
    const productUrl = getCDNUrl(product.image);
    const priceText = formatPrice(product.price);
    
    const shareTextAr = `
🎀 منتج من كوزمتك بين يديك 🎀

✨ ${product.name}
📝 ${product.description.substring(0, 150)}...
💰 السعر: ${priceText}
🏷️ الفئة: ${product.category} - ${product.subcategory}

🔗 قم بزيارة موقعنا لاكتشاف المزيد من المنتجات المميزة!
    `;
    
    function fallbackShare() {
        const shareModal = document.createElement('div');
        shareModal.className = 'modal';
        shareModal.style.display = 'block';
        shareModal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <button class="close-modal" onclick="this.parentElement.parentElement.remove(); document.body.style.overflow='auto'">&times;</button>
                <div class="share-modal">
                    <h3><i class="fas fa-share-alt"></i> مشاركة المنتج</h3>
                    <p>انسخ النص التالي وشاركه على وسائل التواصل الاجتماعي:</p>
                    <div class="share-text-container">
                        <textarea id="shareTextArea" readonly rows="8">${shareTextAr}</textarea>
                        <button onclick="copyShareText()" class="primary-btn">
                            <i class="fas fa-copy"></i> نسخ النص
                        </button>
                    </div>
                    <div class="share-social-icons">
                        <button onclick="shareToWhatsApp()" class="whatsapp-btn">
                            <i class="fab fa-whatsapp"></i> واتساب
                        </button>
                        <button onclick="shareToFacebook()" class="facebook-btn">
                            <i class="fab fa-facebook"></i> فيسبوك
                        </button>
                        <button onclick="shareToTwitter()" class="twitter-btn">
                            <i class="fab fa-twitter"></i> تويتر
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(shareModal);
        document.body.style.overflow = 'hidden';
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(shareTextAr).then(function() {
                showNotification('تم نسخ تفاصيل المنتج إلى الحافظة 📋', 'success');
            }).catch(function() {
                manualShare(shareTextAr);
            });
        } else {
            manualShare(shareTextAr);
        }
    }
    
    if (navigator.share) {
        navigator.share({
            title: 'كوزمتك بين يديك - ' + product.name,
            text: shareTextAr,
            url: window.location.href
        }).then(function() {
            showNotification('تمت المشاركة بنجاح! 📤', 'success');
        }).catch(function() {
            fallbackShare();
        });
    } else {
        fallbackShare();
    }
}

function manualShare(text) {
    showNotification('تم نسخ النص إلى الحافظة 📋', 'success');
}

window.copyShareText = function() {
    const textarea = document.getElementById('shareTextArea');
    if (textarea) {
        textarea.select();
        document.execCommand('copy');
        showNotification('تم نسخ النص إلى الحافظة 📋', 'success');
    }
};

window.shareToWhatsApp = function() {
    const textarea = document.getElementById('shareTextArea');
    if (textarea) {
        window.open('https://wa.me/?text=' + encodeURIComponent(textarea.value), '_blank');
    }
};

window.shareToFacebook = function() {
    const textarea = document.getElementById('shareTextArea');
    if (textarea && currentProductInModal) {
        window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(window.location.href) + '&quote=' + encodeURIComponent(textarea.value), '_blank');
    }
};

window.shareToTwitter = function() {
    const textarea = document.getElementById('shareTextArea');
    if (textarea) {
        window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(textarea.value.substring(0, 280)), '_blank');
    }
};

// ============================================
// إعداد الـ Drawer (القائمة الجانبية)
// ============================================

function setupDrawer() {
    const drawer = document.getElementById('drawer');
    const drawerOverlay = document.getElementById('drawerOverlay');
    const closeDrawerBtn = document.getElementById('closeDrawer');
    
    if (!drawer || !drawerOverlay || !closeDrawerBtn) return;
    
    const drawerBtn = document.createElement('button');
    drawerBtn.className = 'view-btn open-drawer';
    drawerBtn.title = 'جميع الأقسام';
    drawerBtn.innerHTML = '<i class="fas fa-th-list"></i>';
    
    const viewOptions = document.querySelector('.view-options');
    if (viewOptions) {
        viewOptions.insertBefore(drawerBtn, viewOptions.firstChild);
    }
    
    document.querySelectorAll('.open-drawer').forEach(function(btn) {
        btn.addEventListener('click', openDrawer);
    });
    
    const openDrawerFooter = document.getElementById('openDrawerFooter');
    if (openDrawerFooter) {
        openDrawerFooter.addEventListener('click', function(e) {
            e.preventDefault();
            openDrawer();
        });
    }
    
    closeDrawerBtn.addEventListener('click', closeDrawer);
    drawerOverlay.addEventListener('click', closeDrawer);
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && drawer.classList.contains('active')) {
            closeDrawer();
        }
    });
}

function openDrawer() {
    const drawer = document.getElementById('drawer');
    const drawerOverlay = document.getElementById('drawerOverlay');
    
    if (!drawer || !drawerOverlay) return;
    
    drawer.classList.add('active');
    drawerOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    loadDrawerCategories();
}

function closeDrawer() {
    const drawer = document.getElementById('drawer');
    const drawerOverlay = document.getElementById('drawerOverlay');
    
    if (!drawer || !drawerOverlay) return;
    
    drawer.classList.remove('active');
    drawerOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function loadDrawerCategories() {
    const drawerCategories = document.getElementById('drawerCategories');
    if (!drawerCategories) return;
    
    let html = '';
    
    Object.keys(categoriesData).forEach(function(category) {
        const subcats = getUniqueSubcategories(category);
        
        html += '<li class="category-item">';
        html += '<div class="category-header" onclick="toggleCategory(this)">';
        html += '<span>' + category + '</span><i class="fas fa-chevron-down"></i>';
        html += '</div>';
        html += '<ul class="subcategory-list">';
        html += '<li class="subcategory-item" onclick="filterBySubcategory(\'' + category + '\', \'all\', this); closeDrawer();"><i class="fas fa-list"></i> عرض الكل</li>';
        
        subcats.forEach(function(subcat) {
            html += '<li class="subcategory-item" onclick="filterBySubcategory(\'' + category + '\', \'' + subcat + '\', this); closeDrawer();"><i class="fas fa-tag"></i> ' + subcat + '</li>';
        });
        
        html += '</ul></li>';
    });
    
    drawerCategories.innerHTML = html;
    
    const drawerFavorites = document.getElementById('drawerFavorites');
    const drawerCart = document.getElementById('drawerCart');
    
    if (drawerFavorites) {
        drawerFavorites.addEventListener('click', function(e) {
            e.preventDefault();
            closeDrawer();
            showingFavorites = true;
            showingFeatured = false;
            activeCategory = 'all';
            activeSubcategory = 'all';
            resetDisplayedProducts();
            renderMainContent();
            updateFavoritesUI();
        });
    }
    
    if (drawerCart) {
        drawerCart.addEventListener('click', function(e) {
            e.preventDefault();
            closeDrawer();
            document.getElementById('cartSidebar').classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
}

// ============================================
// إعداد شريط التنقل السفلي
// ============================================

function setupBottomNavigation() {
    const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
    
    const bottomNavDrawer = document.getElementById('bottomNavDrawer');
    if (bottomNavDrawer) {
        bottomNavDrawer.addEventListener('click', function(e) {
            e.preventDefault();
            openDrawer();
        });
    }
    
    const bottomNavFavorites = document.getElementById('bottomNavFavorites');
    if (bottomNavFavorites) {
        bottomNavFavorites.addEventListener('click', function(e) {
            e.preventDefault();
            showingFavorites = true;
            showingFeatured = false;
            activeCategory = 'all';
            activeSubcategory = 'all';
            resetDisplayedProducts();
            renderMainContent();
            updateFavoritesUI();
            updateBottomNavActive('favorites');
        });
    }
    
    const bottomNavCart = document.getElementById('bottomNavCart');
    if (bottomNavCart) {
        bottomNavCart.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('cartSidebar').classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
    
    const homeBtn = document.querySelector('.bottom-nav-item[data-section="home"]');
    if (homeBtn) {
        homeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            updateBottomNavActive('home');
        });
    }
    
    updateBottomNavCounters();
}

function updateBottomNavCounters() {
    const bottomFavCount = document.getElementById('bottomFavCount');
    const bottomCartCount = document.getElementById('bottomCartCount');
    
    if (bottomFavCount) {
        bottomFavCount.textContent = favorites.length;
    }
    
    if (bottomCartCount) {
        const totalItems = cart.reduce(function(sum, item) { return sum + item.quantity; }, 0);
        bottomCartCount.textContent = totalItems;
    }
}

function updateBottomNavActive(section) {
    document.querySelectorAll('.bottom-nav-item').forEach(function(item) {
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

// ============================================
// إعداد العرض الافتراضي
// ============================================

function setupDefaultView() {
    currentView = 'grid-2';
    
    const viewBtns = document.querySelectorAll('.view-btn[data-view]');
    viewBtns.forEach(function(btn) {
        btn.classList.remove('active');
        if (btn.dataset.view === currentView) {
            btn.classList.add('active');
        }
    });
    
    applyViewToGrids();
}

// ============================================
// إعداد النافذة المنبثقة للمنتج
// ============================================

function setupModal() {
    const modal = document.getElementById('productModal');
    const closeModal = document.getElementById('closeModal');
    
    if (!modal || !closeModal) return;
    
    closeModal.addEventListener('click', function() {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        currentProductInModal = null;
    });
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            currentProductInModal = null;
        }
    });
    
    const plusBtn = document.querySelector('.qty-btn.plus');
    const minusBtn = document.querySelector('.qty-btn.minus');
    const qtyInput = document.getElementById('productQty');
    
    if (plusBtn && minusBtn && qtyInput) {
        plusBtn.addEventListener('click', function() {
            qtyInput.value = parseInt(qtyInput.value) + 1;
        });
        
        minusBtn.addEventListener('click', function() {
            if (parseInt(qtyInput.value) > 1) {
                qtyInput.value = parseInt(qtyInput.value) - 1;
            }
        });
        
        qtyInput.addEventListener('change', function(e) {
            if (parseInt(e.target.value) < 1) {
                e.target.value = 1;
            }
        });
    }
    
    const modalAddToFavBtn = document.getElementById('modalAddToFav');
    if (modalAddToFavBtn) {
        modalAddToFavBtn.addEventListener('click', function() {
            const productId = getCurrentModalProductId();
            if (productId) {
                toggleFavorite(productId);
                updateFavoriteButtonState(productId);
            }
        });
    }
}

function getCurrentModalProductId() {
    return currentProductInModal ? currentProductInModal.id : null;
}

function updateFavoriteButtonState(productId) {
    const modalAddToFavBtn = document.getElementById('modalAddToFav');
    if (!modalAddToFavBtn) return;
    
    const isFav = favorites.includes(productId);
    modalAddToFavBtn.classList.toggle('active', isFav);
    modalAddToFavBtn.innerHTML = isFav ? '<i class="fas fa-heart"></i> في المفضلة' : '<i class="fas fa-heart"></i> المفضلة';
}

// ============================================
// إعداد خيارات العرض
// ============================================

function setupViewOptions() {
    const viewBtns = document.querySelectorAll('.view-btn[data-view]');
    viewBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            viewBtns.forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            currentView = btn.dataset.view;
            applyViewToGrids();
        });
    });

    const favToggle = document.getElementById('favToggle');
    if (favToggle) {
        favToggle.addEventListener('click', function() {
            showingFavorites = !showingFavorites;
            favToggle.classList.toggle('active', showingFavorites);
            if (showingFavorites) {
                showingFeatured = false;
                activeCategory = 'all';
                activeSubcategory = 'all';
            }
            resetDisplayedProducts();
            renderMainContent();
            updateFavoritesUI();
        });
    }

    const showFeaturedBtn = document.getElementById('showFeatured');
    if (showFeaturedBtn) {
        showFeaturedBtn.addEventListener('click', function() {
            showingFeatured = !showingFeatured;
            if (showingFeatured) {
                showingFavorites = false;
                activeCategory = 'all';
                activeSubcategory = 'all';
            }
            resetDisplayedProducts();
            renderMainContent();
        });
    }
    
    const showFavoritesBtn = document.getElementById('showFavorites');
    if (showFavoritesBtn) {
        showFavoritesBtn.addEventListener('click', function() {
            showingFavorites = true;
            showingFeatured = false;
            activeCategory = 'all';
            activeSubcategory = 'all';
            resetDisplayedProducts();
            renderMainContent();
            updateFavoritesUI();
        });
    }
}

function applyViewToGrids() {
    const grids = document.querySelectorAll('.products-grid');
    grids.forEach(function(grid) {
        grid.classList.remove('grid-2', 'grid-3', 'list');
        grid.classList.add(currentView);
    });
}

// ============================================
// إعداد الترتيب والتصفية
// ============================================

function setupSortAndFilter() {
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', function(e) {
            currentSort = e.target.value;
            resetDisplayedProducts();
            renderMainContent();
        });
    }

    const applyPriceBtn = document.getElementById('applyPriceFilter');
    if (applyPriceBtn) {
        applyPriceBtn.addEventListener('click', function() {
            const min = parseFloat(document.getElementById('minPrice').value) || 0;
            const max = parseFloat(document.getElementById('maxPrice').value) || Infinity;
            priceFilter = { min: min, max: max };
            resetDisplayedProducts();
            renderMainContent();
        });
    }
    
    const priceInputs = document.querySelectorAll('#minPrice, #maxPrice');
    priceInputs.forEach(function(input) {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                document.getElementById('applyPriceFilter').click();
            }
        });
    });
}

// ============================================
// ميزة المفضلة
// ============================================

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
    
    document.querySelectorAll('.fav-btn[data-id="' + id + '"]').forEach(function(btn) {
        btn.classList.toggle('active', index === -1);
    });
    
    updateFavoritesUI();
    
    if (showingFavorites) {
        resetDisplayedProducts();
        renderMainContent();
    }
}

function updateFavoritesUI() {
    const favToggle = document.getElementById('favToggle');
    if (favToggle) {
        favToggle.classList.toggle('active', showingFavorites);
    }
    
    updateBottomNavCounters();
    
    const currentProductId = getCurrentModalProductId();
    if (currentProductId) {
        updateFavoriteButtonState(currentProductId);
    }
}

// ============================================
// تحميل المنتجات
// ============================================

async function loadProducts() {
    try {
        showLoading();
        const response = await fetch('https://raw.githubusercontent.com/cosmetics-beatuy/ugp/master/products_by_category.json');
        if (!response.ok) throw new Error('فشل في تحميل البيانات');
        const data = await response.json();
        categoriesData = data.categories;
        flattenProducts();
        renderNavigation();
        renderSidebarCategories();
        loadDrawerCategories();
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

function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.add('active');
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.remove('active');
}

function flattenProducts() {
    allProducts = [];
    let idCounter = 1;
    for (const categoryName in categoriesData) {
        for (const subcategoryName in categoriesData[categoryName]) {
            categoriesData[categoryName][subcategoryName].forEach(function(product) {
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

// ============================================
// إعادة تعيين المنتجات المعروضة
// ============================================

function resetDisplayedProducts() {
    displayedProductsCount = 0;
    currentProducts = [];
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
    
    Object.keys(categoriesData).forEach(function(category, index) {
        const catId = 'cat-' + index;
        navHtml += '<li><a href="#' + catId + '" class="nav-link">' + category + '</a></li>';
        mobileHtml += '<li><a href="#' + catId + '" class="mobile-nav-link">' + category + '</a></li>';
    });
    
    navHtml += '<li><a href="#" class="nav-link open-drawer">جميع الأقسام</a></li>';
    mobileHtml += '<li><a href="#" class="mobile-nav-link open-drawer">جميع الأقسام</a></li>';
    
    mainNav.innerHTML = navHtml;
    mobileNav.innerHTML = mobileHtml;
    
    setupNavigationLinks();
}

function setupNavigationLinks() {
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(function(link) {
        link.addEventListener('click', function(e) {
            const href = link.getAttribute('href');
            
            if (href === '#home') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                updateActiveNavLink('home');
                updateBottomNavActive('home');
                return;
            }
            
            if (href && href.startsWith('#cat-')) {
                e.preventDefault();
                const catIndex = href.replace('#cat-', '');
                const categoryName = Object.keys(categoriesData)[catIndex];
                if (categoryName) {
                    filterByCategory(categoryName);
                    updateActiveNavLink(href);
                    
                    setTimeout(function() {
                        const element = document.getElementById('cat-' + catIndex);
                        if (element) element.scrollIntoView({ behavior: 'smooth' });
                    }, 300);
                }
            }
            
            if (href === '#') {
                e.preventDefault();
                openDrawer();
            }
            
            document.getElementById('mobileMenu').classList.remove('active');
        });
    });
}

function updateActiveNavLink(href) {
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(function(link) {
        link.classList.remove('active');
        if (link.getAttribute('href') === href) {
            link.classList.add('active');
        }
    });
}

// ============================================
// عرض الأقسام في الشريط الجانبي (قابلة للطي)
// ============================================

function renderSidebarCategories() {
    const sidebarCats = document.getElementById('sidebarCategories');
    if (!sidebarCats) return;
    
    let html = '';
    
    html += '<li class="sidebar-cat-item ' + (activeCategory === 'all' && activeSubcategory === 'all' ? 'active' : '') + '" onclick="resetFilters()"><i class="fas fa-th"></i> الكل</li>';
    
    Object.keys(categoriesData).forEach(function(category) {
        const isExpanded = activeCategory === category;
        const subcats = getUniqueSubcategories(category);
        
        html += '<li class="category-item">';
        html += '<div class="category-header ' + (isExpanded ? 'expanded' : '') + '" onclick="toggleCategory(this)" data-category="' + category + '">';
        html += '<span>' + category + '</span><i class="fas fa-chevron-down" style="transition: transform 0.3s;"></i>';
        html += '</div>';
        html += '<ul class="subcategory-list ' + (isExpanded ? 'show' : '') + '">';
        html += '<li class="subcategory-item ' + (activeCategory === category && activeSubcategory === 'all' ? 'active' : '') + '" onclick="filterBySubcategory(\'' + category + '\', \'all\', this)"><i class="fas fa-list"></i> عرض الكل</li>';
        
        subcats.forEach(function(subcat) {
            const isActive = activeCategory === category && activeSubcategory === subcat;
            html += '<li class="subcategory-item ' + (isActive ? 'active' : '') + '" onclick="filterBySubcategory(\'' + category + '\', \'' + subcat + '\', this)"><i class="fas fa-tag"></i> ' + subcat + '</li>';
        });
        
        html += '</ul></li>';
    });
    
    sidebarCats.innerHTML = html;
}

// ============================================
// إضافة دالة مساعدة للحصول على الأقسام الفرعية الفريدة
// ============================================
function getUniqueSubcategories(category) {
    'use strict';
    const subcats = new Set();
    const categoryData = categoriesData[category];
    if (categoryData) {
        Object.keys(categoryData).forEach(function(subcat) {
            subcats.add(subcat);
        });
    }
    return Array.from(subcats);
}

// ============================================
// دالة تبديل القسم (قابلة للطي)
// ============================================
function toggleCategory(element) {
    'use strict';
    const subcategoryList = element.nextElementSibling;
    const icon = element.querySelector('i');
    
    if (!subcategoryList || !icon) return;
    
    element.classList.toggle('expanded');
    subcategoryList.classList.toggle('show');
    
    icon.style.transform = subcategoryList.classList.contains('show') ? 'rotate(180deg)' : 'rotate(0deg)';
}

// ============================================
// دالة تصفية المنتجات حسب القسم الفرعي
// ============================================
function filterBySubcategory(category, subcategory, element) {
    'use strict';
    activeCategory = category;
    activeSubcategory = subcategory;
    showingFavorites = false;
    showingFeatured = false;
    
    document.querySelectorAll('.sidebar-cat-item, .subcategory-item').forEach(function(el) {
        el.classList.remove('active');
    });
    
    if (element) {
        element.classList.add('active');
        const parentCategory = document.querySelector('[data-category="' + category + '"]');
        if (parentCategory) {
            parentCategory.classList.add('active');
        }
    }
    
    if (window.innerWidth <= 992) {
        const drawer = document.getElementById('drawer');
        if (drawer && drawer.classList.contains('active')) {
            closeDrawer();
        }
    }
    
    resetDisplayedProducts();
    renderMainContent();
    
    setTimeout(function() {
        const dynamicSections = document.getElementById('dynamic-sections');
        if (dynamicSections) {
            dynamicSections.scrollIntoView({ behavior: 'smooth' });
        }
    }, 300);
}

// ============================================
// تصفية حسب القسم الرئيسي فقط (متاحة للتوافق)
// ============================================
function filterByCategory(cat, element) {
    activeCategory = cat;
    activeSubcategory = 'all';
    showingFavorites = false;
    showingFeatured = false;
    
    if (element) {
        document.querySelectorAll('.sidebar-cat-item').forEach(function(el) { el.classList.remove('active'); });
        element.classList.add('active');
    }
    
    resetDisplayedProducts();
    renderMainContent();
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
    
    resetDisplayedProducts();
    
    const initialProducts = products.slice(0, productsPerLoad);
    currentProducts = initialProducts;
    displayedProductsCount = initialProducts.length;
    
    displayProducts(currentProducts);
}

function showNoProductsMessage() {
    const container = document.getElementById('dynamic-sections');
    if (!container) return;
    
    let icon = 'search';
    let title = 'لا توجد منتجات';
    let message = 'لا توجد منتجات تطابق معايير البحث والتصفية.';
    
    if (showingFavorites) {
        icon = 'heart';
        title = 'لا توجد منتجات مفضلة';
        message = 'لم تقم بإضافة أي منتجات إلى المفضلة بعد.';
    } else if (showingFeatured) {
        icon = 'crown';
        title = 'لا توجد منتجات مميزة';
        message = 'لا توجد منتجات مميزة حالياً.';
    } else if (activeSubcategory !== 'all') {
        title = 'لا توجد منتجات في هذا القسم';
        message = 'جرب اختيار قسم فرعي آخر أو تصفية أقل شدة.';
    }
    
    container.innerHTML = `
        <div class="no-products">
            <i class="fas fa-${icon}"></i>
            <h3>${title}</h3>
            <p>${message}</p>
            <button onclick="resetFilters()" class="primary-btn">إعادة تعيين الفلاتر</button>
        </div>
    `;
}

function sortProducts(products) {
    switch(currentSort) {
        case 'price-asc':
            return products.sort(function(a, b) { return a.priceNum - b.priceNum; });
        case 'price-desc':
            return products.sort(function(a, b) { return b.priceNum - a.priceNum; });
        case 'name-asc':
            return products.sort(function(a, b) { return a.name.localeCompare(b.name, 'ar'); });
        case 'name-desc':
            return products.sort(function(a, b) { return b.name.localeCompare(a.name, 'ar'); });
        default:
            return products;
    }
}

function resetFilters() {
    activeCategory = 'all';
    activeSubcategory = 'all';
    currentSort = 'default';
    priceFilter = { min: 0, max: Infinity };
    showingFavorites = false;
    showingFeatured = false;
    
    const minPriceInput = document.getElementById('minPrice');
    const maxPriceInput = document.getElementById('maxPrice');
    const sortSelect = document.getElementById('sortSelect');
    
    if (minPriceInput) minPriceInput.value = '';
    if (maxPriceInput) maxPriceInput.value = '';
    if (sortSelect) sortSelect.value = 'default';
    
    document.querySelectorAll('.sidebar-cat-item, .subcategory-item').forEach(function(el) {
        el.classList.remove('active');
    });
    
    const firstItem = document.querySelector('.sidebar-cat-item');
    if (firstItem) firstItem.classList.add('active');
    
    document.querySelectorAll('.category-header').forEach(function(header) {
        header.classList.remove('expanded');
    });
    
    document.querySelectorAll('.subcategory-list').forEach(function(list) {
        list.classList.remove('show');
    });
    
    const favToggle = document.getElementById('favToggle');
    if (favToggle) favToggle.classList.remove('active');
    
    resetDisplayedProducts();
    renderMainContent();
}

// ============================================
// تحميل المزيد من المنتجات
// ============================================

function loadMoreProducts() {
    const products = getFilteredProducts();
    const remainingProducts = products.length - displayedProductsCount;
    
    if (remainingProducts <= 0) {
        const loadMoreBtn = document.querySelector('.load-more-btn');
        if (loadMoreBtn) {
            loadMoreBtn.style.display = 'none';
        }
        return;
    }
    
    const productsToLoad = Math.min(productsPerLoad, remainingProducts);
    const newProducts = products.slice(displayedProductsCount, displayedProductsCount + productsToLoad);
    currentProducts = currentProducts.concat(newProducts);
    displayedProductsCount += productsToLoad;
    
    displayProducts(currentProducts);
    
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
        loadMoreBtn.innerHTML = '<i class="fas fa-arrow-down"></i> عرض المزيد (' + remainingProducts + ' منتج متبقي)';
    }
}

// ============================================
// عرض المنتجات في الشبكة
// ============================================

function displayProducts(products) {
    const container = document.getElementById('dynamic-sections');
    if (!container) return;
    
    const productsHtml = products.map(createProductCardHtml).join('');
    
    let productsGrid = container.querySelector('.products-grid');
    if (!productsGrid) {
        container.innerHTML = `
            <section class="products-section">
                <div class="section-header">
                    <h2 class="section-title">
                        ${getSectionTitle()}
                        <span class="results-count">(${getFilteredProducts().length} منتج)</span>
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
    
    const totalProducts = getFilteredProducts().length;
    updateLoadMoreButton(totalProducts);
}

function getSectionTitle() {
    if (showingFavorites) return 'منتجاتك المفضلة';
    if (showingFeatured) return 'المنتجات المميزة';
    if (activeSubcategory !== 'all') return activeSubcategory;
    if (activeCategory !== 'all') return activeCategory;
    return 'نتائج البحث والتصفية';
}

// ============================================
// إنشاء HTML لبطاقات المنتج
// ============================================

// تم تعديل دالة getCDNUrl لتستخدم المستودع الجديد
function getCDNUrl(path) {
    if (!path) return 'https://via.placeholder.com/300x300?text=No+Image';
    let cleanPath = path.startsWith('/') ? path.substring(1) : path;
    const encodedPath = cleanPath.split('/').map(part => encodeURIComponent(part)).join('/');
    // تغيير المستودع من green-label6/ugp إلى cosmetics-beatuy/ugp
    return `https://cdn.jsdelivr.net/gh/cosmetics-beatuy/ugp@master/${encodedPath}`;
}

function createProductCardHtml(product) {
    const formattedPrice = formatPrice(product.price);
    const cdnUrl = getCDNUrl(product.image);
    const isFav = favorites.includes(product.id);
    const isFeatured = product.featured;
    
    return `
        <div class="product-card" onclick="showProductDetails(${product.id})">
            ${isFeatured ? '<div class="featured-badge"><i class="fas fa-crown"></i> مميز</div>' : ''}
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

function formatPrice(price) {
    const p = parseFloat(price);
    if (isNaN(p) || p === 0) return "يحدد لاحقاً";
    
    return p.toLocaleString('ar-IQ', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }) + " د.ع";
}

// ============================================
// عرض تفاصيل المنتج
// ============================================

function showProductDetails(id) {
    const product = allProducts.find(function(p) { return p.id === id; });
    if (!product) return;
    
    currentProductInModal = product;
    
    const modal = document.getElementById('productModal');
    const modalImage = document.getElementById('modalImage');
    const cdnUrl = getCDNUrl(product.image);
    
    const img = new Image();
    img.src = cdnUrl;
    img.onload = function() {
        modalImage.src = cdnUrl;
    };
    img.onerror = function() {
        modalImage.src = 'https://via.placeholder.com/400x400?text=No+Image';
    };
    
    document.getElementById('modalCategory').textContent = product.category + ' - ' + product.subcategory;
    document.getElementById('modalName').textContent = product.name;
    document.getElementById('modalPrice').textContent = formatPrice(product.price);
    
    const description = product.description || 'لا يوجد وصف متاح لهذا المنتج.';
    const formattedDescription = description.replace(/\n/g, '<br>');
    document.getElementById('modalDescription').innerHTML = formattedDescription;
    
    document.getElementById('productQty').value = 1;
    
    const addToCartBtn = document.getElementById('modalAddToCart');
    addToCartBtn.onclick = function() {
        const qty = parseInt(document.getElementById('productQty').value) || 1;
        addToCart(product.id, qty);
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        currentProductInModal = null;
    };
    
    const favBtn = document.getElementById('modalAddToFav');
    const isFav = favorites.includes(product.id);
    favBtn.innerHTML = isFav ? '<i class="fas fa-heart"></i> في المفضلة' : '<i class="fas fa-heart"></i> المفضلة';
    favBtn.classList.toggle('active', isFav);
    favBtn.onclick = function() { toggleFavorite(product.id); };
    
    const shareBtn = document.getElementById('modalShare');
    if (shareBtn) {
        shareBtn.onclick = function() { shareProduct(); };
    }
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    modal.scrollTop = 0;
}

// ============================================
// سلة المشتريات
// ============================================

function addToCart(id, quantity) {
    const product = allProducts.find(function(p) { return p.id === id; });
    if (!product) return;
    
    const existing = cart.find(function(item) { return item.id === id; });
    if (existing) {
        existing.quantity += quantity;
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
    showNotification('تمت إضافة ' + product.name + ' إلى السلة 🛒', 'success');
    
    updateBottomNavCounters();
    
    if (window.innerWidth <= 768) {
        document.getElementById('cartSidebar').classList.add('active');
    }
}

function saveCart() { 
    localStorage.setItem('cart', JSON.stringify(cart)); 
}

function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartTotalValue = document.getElementById('cartTotalValue');
    const totalItems = cart.reduce(function(sum, item) { return sum + item.quantity; }, 0);
    
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
            cartItems.innerHTML = cart.map(function(item) {
                return `
                    <div class="cart-item">
                        <img src="${getCDNUrl(item.image)}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/100x100?text=No+Image'">
                        <div class="cart-item-info">
                            <h4>${item.name}</h4>
                            <p>${formatPrice(item.price)} × ${item.quantity}</p>
                            <p class="item-total">${formatPrice(item.price * item.quantity)}</p>
                        </div>
                        <button class="remove-item" onclick="removeFromCart(${item.id})">&times;</button>
                    </div>
                `;
            }).join('');
        }
    }
    
    const totalAmount = cart.reduce(function(sum, item) { return sum + (item.price * item.quantity); }, 0);
    if (cartTotalValue) cartTotalValue.textContent = formatPrice(totalAmount);
    
    updateBottomNavCounters();
}

function removeFromCart(id) {
    const item = cart.find(function(item) { return item.id === id; });
    if (item) {
        cart = cart.filter(function(item) { return item.id !== id; });
        saveCart();
        updateCartUI();
        showNotification('تمت إزالة ' + item.name + ' من السلة', 'info');
    }
}

// ============================================
// تحسين دالة البحث لدعم العربية والإنجليزية
// ============================================

function normalizeArabic(text) {
    if (!text) return '';
    
    text = text.toLowerCase();
    text = text.replace(/[\u064B-\u065F]/g, '');
    text = text.replace(/[إأآ]/g, 'ا');
    text = text.replace(/ى/g, 'ي');
    text = text.replace(/ة/g, 'ه');
    text = text.replace(/\s+/g, ' ').trim();
    
    return text;
}

function normalizeEnglish(text) {
    if (!text) return '';
    
    text = text.toLowerCase();
    text = text.replace(/\s+/g, ' ').trim();
    
    return text;
}

// ============================================
// دالة البحث الرئيسية المحسنة - تبحث فقط في الأسماء
// ============================================
function performSearch(query) {
    'use strict';
    const results = document.getElementById('searchResults');
    const searchInput = document.getElementById('searchInput');
    
    if (!query || !query.trim()) {
        if (results) results.style.display = 'none';
        activeCategory = 'all';
        activeSubcategory = 'all';
        showingFavorites = false;
        showingFeatured = false;
        resetDisplayedProducts();
        renderMainContent();
        return;
    }
    
    const normalizedQuery = normalizeArabic(query);
    const normalizedQueryEn = normalizeEnglish(query);
    
    const filtered = allProducts.filter(function(product) {
        const normalizedNameAr = normalizeArabic(product.name);
        const normalizedNameEn = normalizeEnglish(product.name);
        
        return normalizedNameAr.indexOf(normalizedQuery) !== -1 || 
               normalizedNameEn.indexOf(normalizedQueryEn) !== -1;
    }).slice(0, 8);
    
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    function highlightMatch(text, query) {
        if (!query || !text) return text;
        const safeQuery = escapeRegExp(query);
        const regex = new RegExp('(' + safeQuery + ')', 'gi');
        return text.replace(regex, '<mark class="search-highlight">$1</mark>');
    }
    
    if (results) {
        if (filtered.length === 0) {
            results.innerHTML = '<div class="no-results">لا توجد نتائج مطابقة</div>';
        } else {
            results.innerHTML = filtered.map(function(p) {
                const highlightedName = highlightMatch(p.name, query);
                return `
                    <div class="search-result-item" onclick="showProductDetails(${p.id}); document.getElementById('searchResults').style.display='none'; if(searchInput) searchInput.value='';">
                        <img src="${getCDNUrl(p.image)}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/50x50?text=No+Image'">
                        <div class="search-result-info">
                            <h4>${highlightedName}</h4>
                            <p class="result-price">${formatPrice(p.price)}</p>
                            <small>${p.category} - ${p.subcategory}</small>
                        </div>
                    </div>
                `;
            }).join('');
        }
        results.style.display = 'block';
    }
    
    if (searchInput && searchInput.value === query) {
        activeCategory = 'all';
        activeSubcategory = 'all';
        showingFavorites = false;
        showingFeatured = false;
        priceFilter = { min: 0, max: Infinity };
        
        if (filtered.length > 0) {
            const container = document.getElementById('dynamic-sections');
            if (container) {
                resetDisplayedProducts();
                currentProducts = filtered.slice(0, productsPerLoad);
                displayedProductsCount = currentProducts.length;
                displayProducts(currentProducts);
                
                const sectionTitle = container.querySelector('.section-title');
                if (sectionTitle) {
                    sectionTitle.innerHTML = 'نتائج البحث: "' + query + '" <span class="results-count">(' + filtered.length + ' منتج)</span>';
                }
            }
        } else {
            showNoSearchResults(query);
        }
    }
}

function showNoSearchResults(query) {
    const container = document.getElementById('dynamic-sections');
    if (!container) return;
    
    container.innerHTML = `
        <div class="no-products">
            <i class="fas fa-search"></i>
            <h3>لا توجد نتائج للبحث</h3>
            <p>لم يتم العثور على أي منتجات تطابق "${query}".</p>
            <div style="margin-top: 20px;">
                <button onclick="resetFilters()" class="primary-btn">عرض جميع المنتجات</button>
                <button onclick="document.getElementById('searchInput').value=''; document.getElementById('searchInput').focus();" class="secondary-btn" style="margin-right: 10px;">بحث جديد</button>
            </div>
            <div style="margin-top: 15px; font-size: 0.9rem; color: #666;">
                <p><strong>نصائح للبحث:</strong></p>
                <ul style="text-align: right; padding-right: 20px;">
                    <li>تأكد من صحة كتابة الكلمات</li>
                    <li>جرب كلمات بحث أقصر أو أكثر عمومية</li>
                    <li>يمكنك البحث باللغة العربية أو الإنجليزية</li>
                    <li>استخدم الفلاتر على اليسار للبحث الدقيق</li>
                </ul>
            </div>
        </div>
    `;
}

// ============================================
// إعداد معالجي الأحداث
// ============================================

function setupEventListeners() {
    setupSearch();
    setupCart();
    setupCheckout();
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
    
    const cartLinkFooter = document.getElementById('cartLinkFooter');
    if (cartLinkFooter) {
        cartLinkFooter.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('cartSidebar').classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
    
    const showFavFooter = document.getElementById('showFavFooter');
    if (showFavFooter) {
        showFavFooter.addEventListener('click', function(e) {
            e.preventDefault();
            showingFavorites = true;
            showingFeatured = false;
            activeCategory = 'all';
            activeSubcategory = 'all';
            resetDisplayedProducts();
            renderMainContent();
            const favToggle = document.getElementById('favToggle');
            if (favToggle) favToggle.classList.add('active');
            updateFavoritesUI();
        });
    }
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    
    if (searchInput) {
        let searchTimeout;
        
        searchInput.addEventListener('input', function(e) {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(function() {
                performSearch(e.target.value);
            }, 300);
        });
        
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                clearTimeout(searchTimeout);
                performSearch(e.target.value);
                searchInput.blur();
            }
        });
        
        searchInput.addEventListener('search', function(e) {
            if (e.target.value === '') {
                performSearch('');
            }
        });
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            if (searchInput) {
                performSearch(searchInput.value);
                searchInput.blur();
            }
        });
    }
    
    const mobileSearchInput = document.getElementById('mobileSearchInput');
    const mobileSearchBtn = document.getElementById('mobileSearchBtn');
    
    if (mobileSearchInput) {
        mobileSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch(e.target.value);
                document.getElementById('mobileMenu').classList.remove('active');
                mobileSearchInput.value = '';
                mobileSearchInput.blur();
            }
        });
    }
    
    if (mobileSearchBtn) {
        mobileSearchBtn.addEventListener('click', function() {
            performSearch(mobileSearchInput.value);
            document.getElementById('mobileMenu').classList.remove('active');
            mobileSearchInput.value = '';
            mobileSearchInput.blur();
        });
    }
    
    const sidebarSearchInput = document.getElementById('sidebarSearchInput');
    const sidebarSearchBtn = document.getElementById('sidebarSearchBtn');
    
    if (sidebarSearchInput) {
        sidebarSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch(e.target.value);
                sidebarSearchInput.value = '';
                sidebarSearchInput.blur();
                
                if (window.innerWidth <= 992) {
                    closeDrawer();
                }
            }
        });
    }
    
    if (sidebarSearchBtn) {
        sidebarSearchBtn.addEventListener('click', function() {
            performSearch(sidebarSearchInput.value);
            sidebarSearchInput.value = '';
            sidebarSearchInput.blur();
            
            if (window.innerWidth <= 992) {
                closeDrawer();
            }
        });
    }
    
    document.addEventListener('click', function(e) {
        const searchContainer = document.querySelector('.search-container');
        const searchResults = document.getElementById('searchResults');
        
        if (searchContainer && searchResults && 
            !searchContainer.contains(e.target) && 
            !searchResults.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });
}

function setupCart() {
    const cartIcon = document.getElementById('cartIcon');
    const cartSidebar = document.getElementById('cartSidebar');
    const closeCart = document.getElementById('closeCart');
    const continueShopping = document.getElementById('continueShopping');
    
    if (cartIcon) cartIcon.addEventListener('click', function() {
        cartSidebar.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
    
    if (closeCart) closeCart.addEventListener('click', function() {
        cartSidebar.classList.remove('active');
        document.body.style.overflow = 'auto';
    });
    
    if (continueShopping) continueShopping.addEventListener('click', function() {
        cartSidebar.classList.remove('active');
        document.body.style.overflow = 'auto';
    });
}

function setupCheckout() {
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (!checkoutBtn) return;
    
    checkoutBtn.addEventListener('click', function() {
        if (cart.length === 0) {
            showNotification('السلة فارغة، أضف منتجات أولاً', 'warning');
            return;
        }
        
        let message = "🛒 طلب جديد من موقع كوزمتك بين يديك\n\nالمنتجات:\n";
        
        cart.forEach(function(item, index) {
            message += (index + 1) + '. ' + item.name + ' - ' + item.quantity + ' × ' + formatPrice(item.price) + '\n';
        });
        
        const totalAmount = cart.reduce(function(sum, item) { return sum + (item.price * item.quantity); }, 0);
        message += '\nالإجمالي: ' + formatPrice(totalAmount) + '\n\nيرجى التواصل لتأكيد الطلب 🎉';
        
        window.open('https://wa.me/9647839277919?text=' + encodeURIComponent(message), '_blank');
    });
}

function closeAllModals() {
    document.getElementById('productModal').style.display = 'none';
    document.getElementById('cartSidebar').classList.remove('active');
    document.getElementById('mobileMenu').classList.remove('active');
    document.getElementById('drawer').classList.remove('active');
    document.getElementById('drawerOverlay').classList.remove('active');
    
    const shareModal = document.querySelector('.modal .share-modal');
    if (shareModal) {
        shareModal.closest('.modal').remove();
    }
    
    document.body.style.overflow = 'auto';
    currentProductInModal = null;
}

// ============================================
// إعداد قائمة الجوال
// ============================================

function setupMobileMenu() {
    const toggle = document.getElementById('menuToggle');
    const menu = document.getElementById('mobileMenu');
    const close = document.getElementById('closeMenu');
    
    if (toggle) toggle.addEventListener('click', function() {
        menu.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
    
    if (close) close.addEventListener('click', function() {
        menu.classList.remove('active');
        document.body.style.overflow = 'auto';
    });
    
    document.querySelectorAll('.mobile-nav-link').forEach(function(link) {
        link.addEventListener('click', function() {
            menu.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    });
}

// ============================================
// إعداد زر العودة للأعلى
// ============================================

function setupBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            btn.classList.add('show');
        } else {
            btn.classList.remove('show');
        }
    });
    
    btn.addEventListener('click', function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ============================================
// تهيئة التحميل البطيء للصور
// ============================================

function initLazyLoading() {
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
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
        
        document.querySelectorAll('img.lazy-img:not(.loaded)').forEach(function(img) {
            observer.observe(img);
        });
    } else {
        document.querySelectorAll('img.lazy-img').forEach(function(img) {
            if (img.dataset.src) {
                img.src = img.dataset.src;
                img.classList.add('loaded');
            }
        });
    }
}

// ============================================
// التعامل مع تغيير حجم النافذة
// ============================================

let resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
        if (window.innerWidth > 992) {
            const drawer = document.getElementById('drawer');
            if (drawer && drawer.classList.contains('active')) {
                closeDrawer();
            }
        }
        
        if (window.innerWidth > 768) {
            document.getElementById('mobileMenu').classList.remove('active');
            document.body.style.overflow = 'auto';
        }
        
        const searchResults = document.getElementById('searchResults');
        if (searchResults) {
            searchResults.style.display = 'none';
        }
    }, 250);
});

// ============================================
// التهيئة النهائية
// ============================================

updateCartUI();
updateFavoritesUI();