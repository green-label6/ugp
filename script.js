// ============================================
// متغيرات جديدة للعناصر الجديدة
// ============================================

let drawer = null;
let drawerOverlay = null;
let closeDrawerBtn = null;
let drawerCategories = null;
let bottomNavItems = null;
let modalAddToFavBtn = null;
let showFavoritesBtn = null;

// ============================================
// تحسين دالة التهيئة الرئيسية
// ============================================

function initializeApp() {
    setCurrentYear();
    loadProducts();
    setupEventListeners();
    updateCartUI();
    updateFavoritesUI(); // تحديث واجهة المفضلة
    setupMobileMenu();
    setupBackToTop();
    setupViewOptions();
    setupSortAndFilter();
    setupModal();
    setupNotifications();
    setupDrawer(); // إعداد الـ Drawer
    setupBottomNavigation(); // إعداد شريط التنقل السفلي
}

// ============================================
// إعداد الـ Drawer (القائمة الجانبية)
// ============================================

function setupDrawer() {
    drawer = document.getElementById('drawer');
    drawerOverlay = document.getElementById('drawerOverlay');
    closeDrawerBtn = document.getElementById('closeDrawer');
    drawerCategories = document.getElementById('drawerCategories');
    
    if (!drawer || !drawerOverlay || !closeDrawerBtn) return;
    
    // فتح الـ Drawer
    document.querySelectorAll('.open-drawer').forEach(btn => {
        btn.addEventListener('click', openDrawer);
    });
    
    // زر فتح الـ Drawer في الهيدر (سنضيفه لاحقاً)
    const drawerBtn = document.createElement('button');
    drawerBtn.className = 'view-btn open-drawer';
    drawerBtn.title = 'جميع الأقسام';
    drawerBtn.innerHTML = '<i class="fas fa-th-list"></i>';
    document.querySelector('.view-options').insertBefore(drawerBtn, document.querySelector('.view-options').firstChild);
    
    // زر فتح الـ Drawer في الفوتر
    const openDrawerFooter = document.getElementById('openDrawerFooter');
    if (openDrawerFooter) {
        openDrawerFooter.addEventListener('click', (e) => {
            e.preventDefault();
            openDrawer();
        });
    }
    
    // إغلاق الـ Drawer
    closeDrawerBtn.addEventListener('click', closeDrawer);
    drawerOverlay.addEventListener('click', closeDrawer);
    
    // إغلاق الـ Drawer بمفتاح ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && drawer.classList.contains('active')) {
            closeDrawer();
        }
    });
}

// فتح الـ Drawer
function openDrawer() {
    if (!drawer) return;
    drawer.classList.add('active');
    drawerOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // تحميل الأقسام في الـ Drawer
    loadDrawerCategories();
}

// إغلاق الـ Drawer
function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove('active');
    drawerOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// تحميل الأقسام في الـ Drawer
function loadDrawerCategories() {
    if (!drawerCategories) return;
    
    let html = '';
    Object.keys(categoriesData).forEach((cat, index) => {
        const catId = `cat-${index}`;
        html += `
            <a href="#${catId}" class="drawer-category-item" onclick="navigateToCategory('${catId}', '${cat}')">
                <span>${cat}</span>
                <i class="fas fa-arrow-left"></i>
            </a>
        `;
    });
    
    drawerCategories.innerHTML = html;
    
    // ربط روابط الـ Drawer
    const drawerFavorites = document.getElementById('drawerFavorites');
    const drawerCart = document.getElementById('drawerCart');
    
    if (drawerFavorites) {
        drawerFavorites.addEventListener('click', (e) => {
            e.preventDefault();
            closeDrawer();
            showingFavorites = true;
            showingFeatured = false;
            activeCategory = 'all';
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
}

// التنقل إلى قسم معين
function navigateToCategory(catId, catName) {
    closeDrawer();
    filterByCategory(catName);
    
    // التمرير إلى القسم
    setTimeout(() => {
        const element = document.getElementById(catId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    }, 300);
}

// ============================================
// إعداد شريط التنقل السفلي
// ============================================

function setupBottomNavigation() {
    bottomNavItems = document.querySelectorAll('.bottom-nav-item');
    
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
            renderMainContent();
            updateFavoritesUI();
            
            // إضافة كلاس active
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
    document.querySelector('.bottom-nav-item[data-section="home"]').addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        updateBottomNavActive('home');
    });
    
    // تحديث العدادين في الشريط السفلي
    updateBottomNavCounters();
}

// تحديث العدادات في الشريط السفلي
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

// تحديث العنصر النشط في الشريط السفلي
function updateBottomNavActive(section) {
    bottomNavItems.forEach(item => {
        item.classList.remove('active');
    });
    
    if (section === 'home') {
        document.querySelector('.bottom-nav-item[data-section="home"]').classList.add('active');
    } else if (section === 'favorites') {
        document.getElementById('bottomNavFavorites').classList.add('active');
    }
}

// ============================================
// تحسين ميزة المفضلة
// ============================================

function setupFavoriteButtons() {
    // زر المفضلة في نافذة المنتج
    modalAddToFavBtn = document.getElementById('modalAddToFav');
    if (modalAddToFavBtn) {
        modalAddToFavBtn.addEventListener('click', function() {
            const productId = getCurrentModalProductId();
            if (productId) {
                toggleFavorite(productId);
                updateFavoriteButtonState(productId);
            }
        });
    }
    
    // زر عرض المنتجات المفضلة في الشريط الجانبي
    showFavoritesBtn = document.getElementById('showFavorites');
    if (showFavoritesBtn) {
        showFavoritesBtn.addEventListener('click', () => {
            showingFavorites = true;
            showingFeatured = false;
            activeCategory = 'all';
            renderMainContent();
            updateFavoritesUI();
            
            // تحديث الشريط السفلي
            updateBottomNavActive('favorites');
        });
    }
}

// الحصول على معرف المنتج الحالي في النافذة المنبثقة
function getCurrentModalProductId() {
    const modalName = document.getElementById('modalName').textContent;
    if (!modalName) return null;
    
    const product = allProducts.find(p => p.name === modalName);
    return product ? product.id : null;
}

// تحديث حالة زر المفضلة
function updateFavoriteButtonState(productId) {
    if (!modalAddToFavBtn) return;
    
    const isFav = favorites.includes(productId);
    modalAddToFavBtn.classList.toggle('active', isFav);
    modalAddToFavBtn.innerHTML = isFav ? 
        '<i class="fas fa-heart"></i> في المفضلة' : 
        '<i class="fas fa-heart"></i> المفضلة';
}

// تحديث واجهة المفضلة
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

// تحسين دالة toggleFavorite
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
        renderMainContent();
    }
}

// ============================================
// تحسينات للعرض الافتراضي (عمودين)
// ============================================

function setupDefaultView() {
    // تعيين العرض الافتراضي إلى grid-2
    currentView = 'grid-2';
    
    // تحديث أزرار العرض
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.view === currentView) {
            btn.classList.add('active');
        }
    });
    
    // تطبيق العرض على الشبكات
    applyViewToGrids();
}

// ============================================
// تحسينات تحميل المنتجات
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
        loadDrawerCategories(); // تحميل الأقسام في الـ Drawer
        setupDefaultView(); // تعيين العرض الافتراضي
        renderMainContent();
        setupFavoriteButtons(); // إعداد أزرار المفضلة
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

// ============================================
// تحسينات لشريط التنقل
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
    
    // إضافة معالج النقر لروابط التنقل
    setupNavigationLinks();
    
    // إضافة معالج النقر لروابط الـ Drawer
    document.querySelectorAll('.open-drawer').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            openDrawer();
        });
    });
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
            
            // إغلاق قائمة الجوال إذا كانت مفتوحة
            document.getElementById('mobileMenu').classList.remove('active');
        });
    });
}

// ============================================
// تحسينات لإضافة المنتج للسلة
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

// تحسين تحديث واجهة سلة المشتريات
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

// ============================================
// تحسينات لعرض تفاصيل المنتج
// ============================================

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
    
    // تحديث زر المفضلة
    const favBtn = document.getElementById('modalAddToFav');
    const isFav = favorites.includes(product.id);
    favBtn.innerHTML = isFav ? '<i class="fas fa-heart"></i> في المفضلة' : '<i class="fas fa-heart"></i> المفضلة';
    favBtn.classList.toggle('active', isFav);
    favBtn.onclick = () => toggleFavorite(product.id);
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // التمرير إلى أعلى النافذة
    modal.scrollTop = 0;
}

// ============================================
// تحسينات للاستجابة على جميع الأجهزة
// ============================================

// التعامل مع تغيير حجم النافذة
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // إغلاق الـ Drawer عند التوسيع
        if (window.innerWidth > 992 && drawer && drawer.classList.contains('active')) {
            closeDrawer();
        }
        
        // إغلاق القائمة الجوالية عند التوسيع
        if (window.innerWidth > 768) {
            document.getElementById('mobileMenu').classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }, 250);
});

// ============================================
// تحسينات للتوافق مع المتصفحات
// ============================================

// دعم للمتصفحات القديمة
if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function(callback) {
        return setTimeout(callback, 1000 / 60);
    };
}

// دعم لـ forEach على NodeList للمتصفحات القديمة
if (window.NodeList && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = Array.prototype.forEach;
}

// ============================================
// تحسينات إضافية
// ============================================

// إضافة CSS إضافية للعناصر الجديدة
const additionalStyle = document.createElement('style');
additionalStyle.textContent = `
    .view-btn.open-drawer {
        display: flex;
    }
    
    @media (max-width: 768px) {
        .view-btn.open-drawer {
            display: none;
        }
    }
    
    .nav-link.open-drawer {
        color: var(--primary-color);
        font-weight: 700;
    }
    
    .nav-link.open-drawer:hover {
        background: rgba(156, 39, 176, 0.1);
    }
`;
document.head.appendChild(additionalStyle);

// ============================================
// تهيئة التطبيق عند تحميل الصفحة
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

// التهيئة النهائية
updateCartUI();
updateFavoritesUI();