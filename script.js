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
let featuredProducts = [1, 3, 5, 7, 9, 11]; // IDs للمنتجات المميزة

// متغيرات جديدة للتحميل التدريجي
let productsPerLoad = 10; // عدد المنتجات في كل تحميل
let displayedProductsCount = 0; // عدد المنتجات المعروضة حاليًا
let currentProducts = []; // المنتجات الحالية للعرض

// متغير لحفظ المنتج الحالي في النافذة المنبثقة
let currentProductInModal = null;

// متغير لتتبع الأقسام المفتوحة في الـ drawer
let expandedCategories = new Set();

// ============================================
// تهيئة الموقع عند تحميل الصفحة
// ============================================

document.addEventListener('DOMContentLoaded', () => {
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
    addHighlightStyles(); // إضافة أنماط التمييل للبحث
    addDrawerStyles(); // إضافة أنماط الـ drawer
}

// ============================================
// إضافة أنماط CSS للتمييل في البحث
// ============================================

function addHighlightStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .highlight-match {
            background-color: #ffeb3b;
            color: #000;
            font-weight: 800;
            padding: 0 2px;
            border-radius: 3px;
        }
        
        .drawer-categories {
            max-height: 70vh;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
        }
        
        .drawer-subcategories {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease;
            background: #f9f9f9;
            border-radius: 8px;
            margin-top: 8px;
        }
        
        .drawer-subcategories.expanded {
            max-height: 300px;
            overflow-y: auto;
        }
        
        .drawer-subcategory-item {
            padding: 10px 15px;
            padding-right: 30px;
            border-radius: 8px;
            font-size: 0.85rem;
            color: #666;
            cursor: pointer;
            transition: all 0.2s ease;
            margin-bottom: 4px;
            display: block;
            text-decoration: none;
        }
        
        .drawer-subcategory-item:hover {
            background: rgba(156, 39, 176, 0.1);
            color: #9c27b0;
            transform: translateX(-5px);
        }
        
        .drawer-category-item.has-children {
            display: flex;
            align-items: center;
            justify-content: space-between;
            cursor: pointer;
        }
        
        .collapse-icon {
            font-size: 0.8rem;
            transition: transform 0.3s ease;
            color: #9c27b0;
            font-weight: bold;
        }
        
        .drawer-category-item.expanded .collapse-icon {
            transform: rotate(90deg);
        }

        /* تحسينات للجوال */
        @media (max-width: 768px) {
            .drawer-categories {
                max-height: 60vh;
            }
            
            .drawer-subcategories.expanded {
                max-height: 200px;
            }
            
            .highlight-match {
                font-size: inherit;
            }
        }

        @media (max-width: 576px) {
            .drawer-categories {
                max-height: 50vh;
            }
            
            .drawer-subcategories.expanded {
                max-height: 150px;
            }
        }
    `;
    document.head.appendChild(style);
}

// ============================================
// إضافة أنماط CSS إضافية للـ drawer
// ============================================

function addDrawerStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .drawer-category-wrapper {
            margin-bottom: 10px;
        }
        
        .drawer-category-wrapper:last-child {
            margin-bottom: 0;
        }
        
        .drawer-category-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 15px;
            border-radius: 12px;
            margin-bottom: 6px;
            color: #212121;
            text-decoration: none;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid #e0e0e0;
            background: #f5f5f5;
            font-size: 0.9rem;
            font-weight: 600;
            min-height: 44px;
        }
        
        .drawer-category-item:hover,
        .drawer-category-item.active {
            background: #9c27b0;
            color: white;
            border-color: #9c27b0;
            transform: translateX(-5px);
        }
        
        .drawer-category-item.has-children {
            cursor: pointer;
        }
        
        .collapse-icon {
            font-size: 0.8rem;
            transition: transform 0.3s ease;
            color: #9c27b0;
            font-weight: bold;
            margin-right: 8px;
        }
        
        .drawer-category-item.expanded .collapse-icon {
            transform: rotate(90deg);
            color: white;
        }
        
        .drawer-subcategories {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease;
            background: #f9f9f9;
            border-radius: 8px;
            margin-top: 8px;
        }
        
        .drawer-subcategories.expanded {
            max-height: 300px;
            overflow-y: auto;
        }
        
        .drawer-subcategory-item {
            padding: 10px 15px;
            padding-right: 30px;
            border-radius: 8px;
            font-size: 0.85rem;
            color: #666;
            cursor: pointer;
            transition: all 0.2s ease;
            margin-bottom: 4px;
            display: block;
            text-decoration: none;
        }
        
        .drawer-subcategory-item:hover {
            background: rgba(156, 39, 176, 0.1);
            color: #9c27b0;
            transform: translateX(-5px);
        }
        
        .drawer-subcategory-item:last-child {
            margin-bottom: 0;
        }
    `;
    document.head.appendChild(style);
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

function getNotificationIcon(type) {
    switch(type) {
        case 'error': return 'exclamation-circle';
        case 'warning': return 'exclamation-triangle';
        case 'info': return 'info-circle';
        default: return 'check-circle';
    }
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
    
    // نص المشاركة بالعربية والإنجليزية
    const shareTextAr = `
🎀 منتج من كوزمتك بين يديك 🎀

✨ ${product.name}
📝 ${product.description.substring(0, 150)}...
💰 السعر: ${priceText}
🏷️ الفئة: ${product.category} - ${product.subcategory}

🔗 قم بزيارة موقعنا لاكتشاف المزيد من المنتجات المميزة!
    `;
    
    const shareTextEn = `
🎀 Product from Cosmetic Between Your Hands 🎀

✨ ${product.name}
📝 ${product.description.substring(0, 150)}...
💰 Price: ${priceText}
🏷️ Category: ${product.category} - ${product.subcategory}

🔗 Visit our website to discover more amazing products!
    `;
    
    // استخدام Web Share API إذا كان متاحاً
    if (navigator.share) {
        const shareData = {
            title: `كوزمتك بين يديك - ${product.name}`,
            text: shareTextAr,
            url: window.location.href,
        };
        
        navigator.share(shareData)
            .then(() => {
                showNotification('تمت المشاركة بنجاح! 📤', 'success');
            })
            .catch((error) => {
                console.log('خطأ في المشاركة:', error);
                fallbackShare(shareTextAr);
            });
    } else {
        // استخدام الطريقة البديلة
        fallbackShare(shareTextAr);
    }
}

function fallbackShare(shareText) {
    // محاولة نسخ النص إلى الحافظة
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareText)
            .then(() => {
                showNotification('تم نسخ تفاصيل المنتج إلى الحافظة 📋', 'success');
                // عرض رسالة إضافية
                setTimeout(() => {
                    showNotification('يمكنك الآن لصق النص في أي تطبيق للمشاركة', 'info');
                }, 1500);
            })
            .catch((err) => {
                console.error('خطأ في النسخ:', err);
                manualShare(shareText);
            });
    } else {
        manualShare(shareText);
    }
}

function manualShare(shareText) {
    // إنشاء نافذة منبثقة للمشاركة اليدوية
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
                    <textarea id="shareTextArea" readonly rows="8">${shareText}</textarea>
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
    
    // إضافة CSS للشكل
    const style = document.createElement('style');
    style.textContent = `
        .share-modal {
            padding: 20px;
        }
        
        .share-modal h3 {
            color: var(--primary-color);
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .share-text-container {
            margin: 15px 0;
        }
        
        #shareTextArea {
            width: 100%;
            padding: 12px;
            border: 2px solid var(--gray-light);
            border-radius: var(--border-radius);
            font-family: 'Cairo', sans-serif;
            font-size: 0.9rem;
            resize: vertical;
            background: var(--gray-lighter);
            margin-bottom: 10px;
        }
        
        .share-social-icons {
            display: flex;
            gap: 10px;
            margin-top: 15px;
            flex-wrap: wrap;
        }
        
        .share-social-icons button {
            flex: 1;
            padding: 10px;
            border-radius: var(--border-radius);
            border: none;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            cursor: pointer;
            transition: var(--transition);
            min-width: 100px;
        }
        
        .whatsapp-btn {
            background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
            color: white;
        }
        
        .facebook-btn {
            background: linear-gradient(135deg, #1877F2 0%, #3B5998 100%);
            color: white;
        }
        
        .twitter-btn {
            background: linear-gradient(135deg, #1DA1F2 0%, #0D8BD9 100%);
            color: white;
        }
        
        .share-social-icons button:hover {
            transform: translateY(-2px);
            opacity: 0.9;
        }
        
        @media (max-width: 576px) {
            .share-social-icons button {
                min-width: 80px;
                font-size: 0.8rem;
                padding: 8px;
            }
        }
    `;
    document.head.appendChild(style);
}

// وظائف المساعدة للمشاركة على وسائل التواصل الاجتماعي
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
        const text = encodeURIComponent(textarea.value);
        window.open(`https://wa.me/?text=${text}`, '_blank');
    }
};

window.shareToFacebook = function() {
    const textarea = document.getElementById('shareTextArea');
    if (textarea && currentProductInModal) {
        const productUrl = getCDNUrl(currentProductInModal.image);
        const text = encodeURIComponent(textarea.value);
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${text}`, '_blank');
    }
};

window.shareToTwitter = function() {
    const textarea = document.getElementById('shareTextArea');
    if (textarea) {
        const text = encodeURIComponent(textarea.value.substring(0, 280));
        window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
    }
};

// ============================================
// إعداد الـ Drawer (القائمة الجانبية للأقسام)
// ============================================

function setupDrawer() {
    const drawer = document.getElementById('drawer');
    const drawerOverlay = document.getElementById('drawerOverlay');
    const closeDrawerBtn = document.getElementById('closeDrawer');
    
    if (!drawer || !drawerOverlay || !closeDrawerBtn) return;
    
    // زر فتح الـ Drawer في الهيدر
    const drawerBtn = document.createElement('button');
    drawerBtn.className = 'view-btn open-drawer';
    drawerBtn.title = 'جميع الأقسام';
    drawerBtn.innerHTML = '<i class="fas fa-th-list"></i>';
    document.querySelector('.view-options').insertBefore(drawerBtn, document.querySelector('.view-options').firstChild);
    
    // ربط أحداث الفتح
    document.querySelectorAll('.open-drawer').forEach(btn => {
        btn.addEventListener('click', openDrawer);
    });
    
    // زر فتح الـ Drawer في الفوتر
    const openDrawerFooter = document.getElementById('openDrawerFooter');
    if (openDrawerFooter) {
        openDrawerFooter.addEventListener('click', (e) => {
            e.preventDefault();
            openDrawer();
        });
    }
    
    // ربط أحداث الإغلاق
    closeDrawerBtn.addEventListener('click', closeDrawer);
    drawerOverlay.addEventListener('click', closeDrawer);
    
    // إغلاق الـ Drawer بمفتاح ESC
    document.addEventListener('keydown', (e) => {
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

// دالة محدثة لتحميل الأقسام في الـ drawer
function loadDrawerCategories() {
    const drawerCategories = document.getElementById('drawerCategories');
    if (!drawerCategories) return;
    
    let html = '';
    Object.keys(categoriesData).forEach((cat, index) => {
        const catId = `cat-${index}`;
        const subcategories = Object.keys(categoriesData[cat]);
        const hasSubcategories = subcategories.length > 0;
        
        if (hasSubcategories) {
            // إنشاء عنصر القسم الرئيسي مع البيانات الضرورية
            html += `
                <div class="drawer-category-wrapper">
                    <div class="drawer-category-item has-children ${expandedCategories.has(cat) ? 'expanded' : ''}" 
                         data-category="${cat}" 
                         data-index="${index}">
                        <span><i class="fas fa-folder text-warning"></i> ${cat}</span>
                        <i class="fas fa-chevron-left collapse-icon"></i>
                    </div>
                    <div class="drawer-subcategories ${expandedCategories.has(cat) ? 'expanded' : ''}" id="subcat-${index}">
            `;
            
            // إضافة الأقسام الفرعية
            subcategories.forEach((subcat, subIndex) => {
                html += `
                    <a href="#${catId}" class="drawer-subcategory-item" 
                       data-category="${cat}" 
                       data-subcategory="${subcat}">
                        <i class="fas fa-dot-circle text-muted mr-2" style="font-size: 0.6rem;"></i> ${subcat}
                    </a>
                `;
            });
            
            html += `</div></div>`;
        } else {
            // قسم بدون أقسام فرعية
            html += `
                <div class="drawer-category-wrapper">
                    <a href="#${catId}" class="drawer-category-item" 
                       data-category="${cat}">
                        <span><i class="fas fa-folder-open text-primary"></i> ${cat}</span>
                    </a>
                </div>
            `;
        }
    });
    
    drawerCategories.innerHTML = html;
    
    // إضافة event listeners للأقسام الرئيسية
    document.querySelectorAll('.drawer-category-item.has-children').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const category = this.dataset.category;
            const index = parseInt(this.dataset.index);
            toggleCategory(category, index);
        });
    });
    
    // إضافة event listeners للأقسام الفرعية
    document.querySelectorAll('.drawer-subcategory-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const category = this.dataset.category;
            const subcategory = this.dataset.subcategory;
            const catId = this.getAttribute('href').substring(1); // إزالة #
            navigateToSubcategory(category, subcategory, catId);
        });
    });
    
    // ربط روابط الـ Drawer الأخرى
    const drawerFavorites = document.getElementById('drawerFavorites');
    const drawerCart = document.getElementById('drawerCart');
    
    if (drawerFavorites) {
        drawerFavorites.addEventListener('click', (e) => {
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
        drawerCart.addEventListener('click', (e) => {
            e.preventDefault();
            closeDrawer();
            document.getElementById('cartSidebar').classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    // تهيئة الـ scroll للقائمة إذا كانت كبيرة
    const drawerBody = document.querySelector('.drawer-body');
    if (drawerBody) {
        drawerBody.style.maxHeight = 'calc(100vh - 70px)';
        drawerBody.style.overflowY = 'auto';
    }
}

// دالة محدثة لتبديل القسم الرئيسي
function toggleCategory(category, index) {
    const subcatElement = document.getElementById(`subcat-${index}`);
    const categoryElement = document.querySelector(`.drawer-category-item[data-category="${category}"]`);
    
    if (!subcatElement || !categoryElement) {
        console.error('Elements not found:', { subcatElement, categoryElement, category, index });
        return;
    }
    
    const isExpanded = expandedCategories.has(category);
    
    if (isExpanded) {
        expandedCategories.delete(category);
        subcatElement.classList.remove('expanded');
        categoryElement.classList.remove('expanded');
    } else {
        expandedCategories.add(category);
        subcatElement.classList.add('expanded');
        categoryElement.classList.add('expanded');
    }
    
    // تسجيل الحالة في الـ console للتصحيح
    console.log(`Category ${category} expanded:`, !isExpanded);
}

// دالة محدثة للتنقل للقسم الفرعي
function navigateToSubcategory(category, subcategory, catId) {
    closeDrawer();
    filterByCategory(category, null, subcategory); // تعديل filterByCategory لقبول subcategory
    
    // التمرير إلى القسم
    setTimeout(() => {
        const element = document.getElementById(catId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 300);
}

// ============================================
// إعداد شريط التنقل السفلي
// ============================================

function setupBottomNavigation() {
    const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
    
    // زر الأقسام في الشريط السفلي
    const bottomNavDrawer = document.getElementById('bottomNavDrawer');
    if (bottomNavDrawer) {
        bottomNavDrawer.addEventListener('click', (e) => {
            e.preventDefault();
            openDrawer();
        });
    }
    
    // زر المفضلة في الشريط السفلي
    const bottomNavFavorites = document.getElementById('bottomNavFavorites');
    if (bottomNavFavorites) {
        bottomNavFavorites.addEventListener('click', (e) => {
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
    
    // زر السلة في الشريط السفلي
    const bottomNavCart = document.getElementById('bottomNavCart');
    if (bottomNavCart) {
        bottomNavCart.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('cartSidebar').classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
    
    // زر الرئيسية في الشريط السفلي
    const homeBtn = document.querySelector('.bottom-nav-item[data-section="home"]');
    if (homeBtn) {
        homeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            updateBottomNavActive('home');
        });
    }
    
    // تحديث العدادين في الشريط السفلي
    updateBottomNavCounters();
}

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

// ============================================
// إعداد العرض الافتراضي (عمودين)
// ============================================

function setupDefaultView() {
    currentView = 'grid-2';
    
    // تحديث أزرار العرض
    const viewBtns = document.querySelectorAll('.view-btn[data-view]');
    viewBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.view === currentView) {
            btn.classList.add('active');
        }
    });
    
    // تطبيق العرض على الشبكات
    applyViewToGrids();
}

// ============================================
// إعداد النافذة المنبثقة للمنتج
// ============================================

function setupModal() {
    const modal = document.getElementById('productModal');
    const closeModal = document.getElementById('closeModal');
    
    if (!modal || !closeModal) return;
    
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        currentProductInModal = null;
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            currentProductInModal = null;
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
    
    // إعداد زر المفضلة في النافذة المنبثقة
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
    modalAddToFavBtn.innerHTML = isFav ? 
        '<i class="fas fa-heart"></i> في المفضلة' : 
        '<i class="fas fa-heart"></i> المفضلة';
}

// ============================================
// إعداد خيارات العرض
// ============================================

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
        showFeaturedBtn.addEventListener('click', () => {
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
        showFavoritesBtn.addEventListener('click', () => {
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
    grids.forEach(grid => {
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
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            resetDisplayedProducts();
            renderMainContent();
        });
    }

    const applyPriceBtn = document.getElementById('applyPriceFilter');
    if (applyPriceBtn) {
        applyPriceBtn.addEventListener('click', () => {
            const min = parseFloat(document.getElementById('minPrice').value) || 0;
            const max = parseFloat(document.getElementById('maxPrice').value) || Infinity;
            priceFilter = { min, max };
            resetDisplayedProducts();
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
    
    // تحديث جميع أزرار المفضلة لهذا المنتج
    document.querySelectorAll(`.fav-btn[data-id="${id}"]`).forEach(btn => {
        btn.classList.toggle('active', index === -1);
    });
    
    // تحديث واجهة المفضلة
    updateFavoritesUI();
    
    // إذا كنا في عرض المفضلة، قم بتحديث العرض
    if (showingFavorites) {
        resetDisplayedProducts();
        renderMainContent();
    }
}

function updateFavoritesUI() {
    // تحديث زر المفضلة في الهيدر
    const favToggle = document.getElementById('favToggle');
    if (favToggle) {
        favToggle.classList.toggle('active', showingFavorites);
    }
    
    // تحديث العداد في الشريط السفلي
    updateBottomNavCounters();
    
    // تحديث زر المفضلة في نافذة المنتج
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
        const response = await fetch('products_by_category.json');
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
        html += `<li class="sidebar-cat-item" onclick="filterByCategory(\'${cat}\', this)">${cat}</li>`;
    });
    sidebarCats.innerHTML = html;
}

// دالة محدثة لتصفية حسب القسم والقسم الفرعي
function filterByCategory(cat, element, subcat = null) {
    activeCategory = cat;
    activeSubcategory = subcat || 'all';
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
    
    // تصفية حسب القسم
    if (activeCategory !== 'all') {
        products = products.filter(p => p.category === activeCategory);
        
        // تصفية حسب القسم الفرعي إذا تم تحديده
        if (activeSubcategory !== 'all') {
            products = products.filter(p => p.subcategory === activeSubcategory);
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
    if (activeSubcategory !== 'all') return `${activeCategory} - ${activeSubcategory}`;
    if (activeCategory !== 'all') return activeCategory;
    return 'نتائج البحث والتصفية';
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
    activeSubcategory = 'all';
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
    
    resetDisplayedProducts();
    renderMainContent();
}

// ============================================
// عرض الأقسام الافتراضية
// ============================================

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
    
    applyViewToGrids();
    initLazyLoading();
}

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

// ============================================
// إنشاء HTML لبطاقات المنتج
// ============================================

function getCDNUrl(path) {
    if (!path) return 'https://via.placeholder.com/300x300?text=No+Image';
    let cleanPath = path.startsWith('/') ? path.substring(1) : path;
    const encodedPath = cleanPath.split('/').map(part => encodeURIComponent(part)).join('/');
    return `https://cdn.jsdelivr.net/gh/green-label6/ugp@master/${encodedPath}`;
}

function highlightMatchText(text, query) {
    if (!query || !text) return text;
    
    const normalizedText = normalizeArabic(text);
    const normalizedQuery = normalizeArabic(query);
    
    if (normalizedQuery.length === 0) return text;
    
    let highlightedText = text;
    let regex;
    
    try {
        // إنشاء regex للبحث عن النص المطابق مع الحفاظ على التشكيل
        regex = new RegExp(`(${normalizedQuery})`, 'gi');
        
        // إيجاد جميع المطابقات
        const matches = [];
        let match;
        while ((match = regex.exec(normalizedText)) !== null) {
            matches.push({
                start: match.index,
                end: match.index + match[0].length
            });
        }
        
        // إعادة بناء النص مع التمييل
        let result = '';
        let lastIndex = 0;
        
        matches.forEach(match => {
            // إضافة النص قبل المطابقة
            if (match.start > lastIndex) {
                result += text.substring(lastIndex, match.start);
            }
            
            // إضافة النص المطابق مع التمييل
            const matchedText = text.substring(match.start, match.end);
            result += `<span class="highlight-match">${matchedText}</span>`;
            
            lastIndex = match.end;
        });
        
        // إضافة النص المتبقي
        if (lastIndex < text.length) {
            result += text.substring(lastIndex);
        }
        
        highlightedText = result || text;
    } catch (error) {
        console.warn('Error in highlightMatchText:', error);
        highlightedText = text;
    }
    
    return highlightedText;
}

function createProductCardHtml(product) {
    const formattedPrice = formatPrice(product.price);
    const cdnUrl = getCDNUrl(product.image);
    const isFav = favorites.includes(product.id);
    const isFeatured = product.featured;
    const searchInput = document.getElementById('searchInput');
    const query = searchInput ? searchInput.value : '';
    
    // تمييل النص المطابق إذا كان هناك بحث
    const highlightedName = query ? highlightMatchText(product.name, query) : product.name;
    
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
                <h3 class="product-name">${highlightedName}</h3>
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
    
    // تنسيق مع فواصل الآلاف للدينار العراقي
    return p.toLocaleString('ar-IQ', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }) + " د.ع";
}

// ============================================
// عرض تفاصيل المنتج
// ============================================

function showProductDetails(id) {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;
    
    currentProductInModal = product;
    
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
        currentProductInModal = null;
    };
    
    // تحديث زر المفضلة
    const favBtn = document.getElementById('modalAddToFav');
    const isFav = favorites.includes(product.id);
    favBtn.innerHTML = isFav ? '<i class="fas fa-heart"></i> في المفضلة' : '<i class="fas fa-heart"></i> المفضلة';
    favBtn.classList.toggle('active', isFav);
    favBtn.onclick = () => toggleFavorite(product.id);
    
    // تحديث زر المشاركة
    const shareBtn = document.getElementById('modalShare');
    if (shareBtn) {
        shareBtn.onclick = () => shareProduct(product);
    }
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // التمرير إلى أعلى النافذة
    modal.scrollTop = 0;
}

// ============================================
// سلة المشتريات
// ============================================

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
    
    // تحديث العداد في الشريط السفلي
    updateBottomNavCounters();
    
    // فتح سلة المشتريات الجانبية على الجوال
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
    
    // تحديث العداد في الشريط السفلي
    updateBottomNavCounters();
}

function removeFromCart(id) {
    const item = cart.find(item => item.id === id);
    if (item) {
        cart = cart.filter(item => item.id !== id);
        saveCart();
        updateCartUI();
        showNotification(`تمت إزالة ${item.name} من السلة`, 'info');
    }
}

// ============================================
// تحسين دالة البحث لدعم العربية والإنجليزية
// ============================================

// دالة لتحسين البحث العربي (إزالة التشكيل والتطبيع)
function normalizeArabic(text) {
    if (!text) return '';
    
    // تحويل إلى حروف صغيرة
    text = text.toLowerCase();
    
    // إزالة التشكيل (الحركات) العربية
    text = text.replace(/[\u064B-\u065F]/g, '');
    
    // تطبيع الأحرف العربية (مثل: إ، أ، آ إلى ا)
    text = text.replace(/[إأآ]/g, 'ا');
    text = text.replace(/ى/g, 'ي');
    text = text.replace(/ة/g, 'ه');
    
    // إزالة المسافات الزائدة
    text = text.replace(/\s+/g, ' ').trim();
    
    return text;
}

// دالة لتحسين البحث الإنجليزي
function normalizeEnglish(text) {
    if (!text) return '';
    
    // تحويل إلى حروف صغيرة
    text = text.toLowerCase();
    
    // إزالة المسافات الزائدة
    text = text.replace(/\s+/g, ' ').trim();
    
    return text;
}

// دالة البحث الرئيسية المحسنة - تبحث فقط في أسماء المنتجات
function performSearch(query) {
    const results = document.getElementById('searchResults');
    const searchInput = document.getElementById('searchInput');
    
    // التعامل مع القيم الفارغة أو المسافات فقط
    if (!query || !query.trim()) {
        if (results) results.style.display = 'none';
        // إظهار جميع المنتجات عند مسح البحث
        showingFavorites = false;
        showingFeatured = false;
        activeCategory = 'all';
        activeSubcategory = 'all';
        resetDisplayedProducts();
        renderMainContent();
        return;
    }
    
    // تطبيع نص البحث
    const normalizedQueryAr = normalizeArabic(query);
    const normalizedQueryEn = normalizeEnglish(query);
    
    // البحث فقط في أسماء المنتجات مع دعم العربية والإنجليزية
    const filtered = allProducts.filter(product => {
        // تطبيع اسم المنتج للبحث
        const normalizedNameAr = normalizeArabic(product.name);
        const normalizedNameEn = normalizeEnglish(product.name);
        
        // البحث بالعربية في الاسم فقط
        const arabicMatch = normalizedNameAr.includes(normalizedQueryAr);
        
        // البحث بالإنجليزية في الاسم فقط
        const englishMatch = normalizedNameEn.includes(normalizedQueryEn);
        
        // البحث المختلط في الاسم فقط
        const mixedMatch = normalizedNameEn.includes(normalizedQueryAr) || normalizedNameAr.includes(normalizedQueryEn);
        
        return arabicMatch || englishMatch || mixedMatch;
    }).slice(0, 8);
    
    // عرض نتائج البحث
    if (results) {
        if (filtered.length === 0) {
            results.innerHTML = '<div class="no-results">لا توجد نتائج مطابقة في أسماء المنتجات</div>';
        } else {
            results.innerHTML = filtered.map(p => `
                <div class="search-result-item" onclick="showProductDetails(${p.id}); document.getElementById('searchResults').style.display='none'; if(searchInput) searchInput.value='${query}';">
                    <img src="${getCDNUrl(p.image)}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/50x50?text=No+Image'">
                    <div class="search-result-info">
                        <h4>${highlightMatchText(p.name, query)}</h4>
                        <p class="result-price">${formatPrice(p.price)}</p>
                        <small>${p.category} - ${p.subcategory}</small>
                    </div>
                </div>
            `).join('');
        }
        results.style.display = 'block';
    }
    
    // إذا كان البحث من شريط البحث الرئيسي، قم بتصفية المنتجات
    if (searchInput && searchInput.value === query) {
        showingFavorites = false;
        showingFeatured = false;
        activeCategory = 'all';
        activeSubcategory = 'all';
        priceFilter = { min: 0, max: Infinity };
        
        // إذا كانت هناك نتائج، قم بعرضها
        if (filtered.length > 0) {
            const container = document.getElementById('dynamic-sections');
            if (container) {
                resetDisplayedProducts();
                currentProducts = filtered.slice(0, productsPerLoad);
                displayedProductsCount = currentProducts.length;
                displayProducts(currentProducts);
                
                // تحديث عنوان القسم
                const sectionTitle = container.querySelector('.section-title');
                if (sectionTitle) {
                    sectionTitle.innerHTML = `نتائج البحث: "${query}" <span class="results-count">(${filtered.length} منتج)</span>`;
                }
            }
        } else {
            // عرض رسالة عدم وجود نتائج
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
            <p>لم يتم العثور على أي منتجات في أسماء المنتجات تطابق "${query}".</p>
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
                    <li>البحث يتم فقط في أسماء المنتجات</li>
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
        
        // معالجة الإدخال مع تأخير لتجنب البحث مع كل حرف
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                performSearch(e.target.value);
            }, 300); // تأخير 300ms لتحسين الأداء
        });
        
        // معالجة الضغط على Enter
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                clearTimeout(searchTimeout);
                performSearch(e.target.value);
            }
        });
        
        // معالجة حدث المسح (clear)
        searchInput.addEventListener('search', (e) => {
            if (e.target.value === '') {
                performSearch('');
            }
        });
        
        // إخفاء النتائج عند فقدان التركيز
        searchInput.addEventListener('blur', (e) => {
            setTimeout(() => {
                const results = document.getElementById('searchResults');
                if (results && !results.contains(document.activeElement)) {
                    results.style.display = 'none';
                }
            }, 200);
        });
    }
    
    // زر البحث
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
                mobileSearchInput.value = '';
            }
        });
    }
    
    if (mobileSearchBtn) {
        mobileSearchBtn.addEventListener('click', () => {
            performSearch(mobileSearchInput.value);
            document.getElementById('mobileMenu').classList.remove('active');
            mobileSearchInput.value = '';
        });
    }
    
    // إغلاق نتائج البحث عند النقر خارجها
    document.addEventListener('click', (e) => {
        const searchContainer = document.querySelector('.search-container');
        const searchResults = document.getElementById('searchResults');
        
        if (searchContainer && searchResults && 
            !searchContainer.contains(e.target) && 
            !searchResults.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });
    
    // البحث في الشريط الجانبي
    const sidebarSearchInput = document.getElementById('sidebarSearchInput');
    const sidebarSearchBtn = document.getElementById('sidebarSearchBtn');
    
    if (sidebarSearchInput) {
        sidebarSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch(e.target.value);
                sidebarSearchInput.value = '';
                
                // إغلاق الشريط الجانبي على الجوال
                if (window.innerWidth <= 992) {
                    const drawer = document.getElementById('drawer');
                    if (drawer && drawer.classList.contains('active')) {
                        closeDrawer();
                    }
                }
            }
        });
    }
    
    if (sidebarSearchBtn) {
        sidebarSearchBtn.addEventListener('click', () => {
            performSearch(sidebarSearchInput.value);
            sidebarSearchInput.value = '';
            
            // إغلاق الشريط الجانبي على الجوال
            if (window.innerWidth <= 992) {
                const drawer = document.getElementById('drawer');
                if (drawer && drawer.classList.contains('active')) {
                    closeDrawer();
                }
            }
        });
    }
}

// دالة لتسهيل البحث على الجوال - إضافة زر بحث ظاهر
function addMobileSearchButton() {
    // إضافة زر بحث في قائمة الجوال إذا لم يكن موجوداً
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu && !document.getElementById('mobileSearchBtn')) {
        const searchContainer = document.createElement('div');
        searchContainer.className = 'mobile-search';
        searchContainer.innerHTML = `
            <input type="text" id="mobileSearchInput" placeholder="ابحث عن منتج...">
            <button id="mobileSearchBtn"><i class="fas fa-search"></i></button>
        `;
        mobileMenu.appendChild(searchContainer);
    }
}

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

function closeAllModals() {
    document.getElementById('productModal').style.display = 'none';
    document.getElementById('cartSidebar').classList.remove('active');
    document.getElementById('mobileMenu').classList.remove('active');
    document.getElementById('drawer').classList.remove('active');
    document.getElementById('drawerOverlay').classList.remove('active');
    
    // إغلاق أي نافذة مشاركة مفتوحة
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

    // إضافة زر بحث في قائمة الجوال
    addMobileSearchButton();
}

// ============================================
// إعداد زر العودة للأعلى
// ============================================

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

// ============================================
// تهيئة التحميل البطيء للصور
// ============================================

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

// ============================================
// إضافة CSS للعناصر الجديدة
// ============================================

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
    
    .view-btn.open-drawer {
        display: flex;
    }
    
    @media (max-width: 768px) {
        .view-btn.open-drawer {
            display: none;
        }
    }
    
    .nav-link.open-drawer {
        color: #9c27b0;
        font-weight: 700;
    }
    
    .nav-link.open-drawer:hover {
        background: rgba(156, 39, 176, 0.1);
    }
    
    /* أنماط زر عرض المزيد */
    .load-more-container {
        text-align: center;
        margin-top: 30px;
        margin-bottom: 50px;
        padding: 20px 0;
        border-top: 1px solid var(--gray-light);
    }
    
    .load-more-btn {
        background: var(--gradient);
        color: white;
        padding: 15px 30px;
        border-radius: var(--border-radius-xl);
        font-weight: 700;
        font-size: 1rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        transition: var(--transition);
        border: none;
        cursor: pointer;
        box-shadow: 0 6px 15px rgba(156, 39, 176, 0.2);
        min-width: 200px;
    }
    
    .load-more-btn:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 25px rgba(156, 39, 176, 0.3);
    }
    
    .load-more-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
    }
    
    @media (max-width: 768px) {
        .load-more-btn {
            padding: 12px 25px;
            font-size: 0.9rem;
            min-width: 180px;
        }
    }
    
    @media (max-width: 576px) {
        .load-more-btn {
            padding: 10px 20px;
            font-size: 0.85rem;
            min-width: 160px;
        }
    }
`;
document.head.appendChild(style);

// ============================================
// التعامل مع تغيير حجم النافذة
// ============================================

let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
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
        
        // إخفاء نتائج البحث عند تغيير حجم الشاشة
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