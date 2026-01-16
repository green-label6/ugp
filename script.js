let cart = JSON.parse(localStorage.getItem('cart')) || [];
let categoriesData = {};
let allProducts = [];

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    setupEventListeners();
    updateCartUI();
    setupMobileMenu();
    setupBackToTop();
    initLazyLoading();
});

function initLazyLoading() {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const picture = img.closest('picture');
                
                // تحميل srcset للمصادر داخل picture إذا وجدت
                if (picture) {
                    const sources = picture.querySelectorAll('source');
                    sources.forEach(source => {
                        if (source.dataset.srcset) {
                            source.srcset = source.dataset.srcset;
                        }
                    });
                }

                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.classList.add('loaded');
                    observer.unobserve(img);
                }
            }
        });
    }, {
        rootMargin: '200px 0px', // تحميل الصور قبل ظهورها بـ 200 بكسل
        threshold: 0.01
    });

    // مراقبة الصور الحالية والمستقبلية
    const observeImages = () => {
        const images = document.querySelectorAll('img.lazy-img:not(.observed)');
        images.forEach(img => {
            img.classList.add('observed');
            imageObserver.observe(img);
        });
    };

    // تشغيل المراقبة بشكل دوري للتعامل مع المنتجات المضافة ديناميكياً
    observeImages();
    const mutationObserver = new MutationObserver(observeImages);
    mutationObserver.observe(document.getElementById('dynamic-sections'), { childList: true, subtree: true });
}

async function loadProducts() {
    try {
        // الاعتماد الكلي على ملف JSON الجديد
        const response = await fetch('products_by_category.json');
        const data = await response.json();
        categoriesData = data.categories;
        
        // تحويل البيانات إلى قائمة مسطحة للبحث والعمليات الأخرى
        flattenProducts();
        
        renderNavigation();
        renderDynamicSections();
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('dynamic-sections').innerHTML = `
            <div class="error-msg">
                <i class="fas fa-exclamation-circle"></i>
                <p>عذراً، حدث خطأ أثناء تحميل المنتجات. تأكد من وجود ملف products_by_category.json في مجلد المشروع.</p>
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
    
    const homeLink = '<li><a href="#home" class="nav-link active">الرئيسية</a></li>';
    const mobileHomeLink = '<li><a href="#home" class="mobile-nav-link active">الرئيسية</a></li>';
    
    let navHtml = homeLink;
    let mobileHtml = mobileHomeLink;
    
    Object.keys(categoriesData).forEach((cat, index) => {
        const catId = `cat-${index}`;
        navHtml += `<li><a href="#${catId}" class="nav-link">${cat}</a></li>`;
        mobileHtml += `<li><a href="#${catId}" class="mobile-nav-link">${cat}</a></li>`;
    });
    
    mainNav.innerHTML = navHtml;
    mobileNav.innerHTML = mobileHtml;
}

const PRODUCTS_PER_PAGE = 20;
let loadedProductsCount = {}; // تتبع عدد المنتجات المحملة لكل فئة فرعية

function renderDynamicSections() {
    const container = document.getElementById('dynamic-sections');
    container.innerHTML = '';
    loadedProductsCount = {};
    
    Object.keys(categoriesData).forEach((categoryName, catIndex) => {
        const catId = `cat-${catIndex}`;
        const section = document.createElement('section');
        section.className = 'products-section';
        section.id = catId;
        
        let sectionHtml = `
            <div class="container">
                <div class="section-header">
                    <h2 class="section-title">${categoryName}</h2>
                </div>
        `;
        
        for (const subcategoryName in categoriesData[categoryName]) {
            const products = categoriesData[categoryName][subcategoryName];
            if (products.length === 0) continue;
            
            const subcatKey = `${categoryName}-${subcategoryName}`;
            loadedProductsCount[subcatKey] = PRODUCTS_PER_PAGE;
            
            sectionHtml += `
                <div class="subcategory-group" data-category="${categoryName}" data-subcategory="${subcategoryName}">
                    <h3 class="subcategory-title">${subcategoryName}</h3>
                    <div class="products-grid" id="grid-${catIndex}-${subcategoryName.replace(/\s+/g, '-')}">
            `;
            
            // تحميل أول مجموعة فقط من المنتجات
            const initialProducts = products.slice(0, PRODUCTS_PER_PAGE);
            initialProducts.forEach(product => {
                const flatProduct = allProducts.find(p => p.name === product.name && p.image === product.image);
                sectionHtml += createProductCardHtml(flatProduct);
            });
            
            sectionHtml += `
                    </div>
                    ${products.length > PRODUCTS_PER_PAGE ? `
                        <div class="load-more-container">
                            <button class="load-more-btn" onclick="loadMoreProducts('${categoryName}', '${subcategoryName}', 'grid-${catIndex}-${subcategoryName.replace(/\s+/g, '-')}')">
                                عرض المزيد من ${subcategoryName}
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        }
        
        sectionHtml += `</div>`;
        section.innerHTML = sectionHtml;
        container.appendChild(section);
    });
}

function loadMoreProducts(categoryName, subcategoryName, gridId) {
    const subcatKey = `${categoryName}-${subcategoryName}`;
    const products = categoriesData[categoryName][subcategoryName];
    const grid = document.getElementById(gridId);
    const currentCount = loadedProductsCount[subcatKey];
    
    const nextProducts = products.slice(currentCount, currentCount + PRODUCTS_PER_PAGE);
    let newHtml = '';
    
    nextProducts.forEach(product => {
        const flatProduct = allProducts.find(p => p.name === product.name && p.image === product.image);
        newHtml += createProductCardHtml(flatProduct);
    });
    
    grid.insertAdjacentHTML('beforeend', newHtml);
    loadedProductsCount[subcatKey] += nextProducts.length;
    
    // إخفاء زر "عرض المزيد" إذا تم تحميل جميع المنتجات
    if (loadedProductsCount[subcatKey] >= products.length) {
        const btnContainer = grid.parentElement.querySelector('.load-more-container');
        if (btnContainer) btnContainer.style.display = 'none';
    }
}

function getCDNUrl(path) {
    if (!path) return 'https://via.placeholder.com/400x400?text=No+Image';
    // تحويل المسار المحلي إلى رابط CDN عبر jsDelivr
    // المستودع: green-label6/ugp
    // ملاحظة: تم تغيير الفرع إلى master ليتوافق مع مستودعك
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `https://cdn.jsdelivr.net/gh/green-label6/ugp@master/${cleanPath}`;
}

function createProductCardHtml(product) {
    const formattedPrice = formatPrice(product.price);
    const cdnUrl = getCDNUrl(product.image);
    
    // استخدام Intersection Observer لـ Lazy Loading المتقدم
    // واستخدام CDN لتحسين سرعة التحميل
    return `
        <div class="product-card">
            <div class="product-img" onclick="showProductDetails(${product.id})">
                <picture>
                    <source data-srcset="${cdnUrl}" type="image/webp">
                    <img data-src="${cdnUrl}" 
                         src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E"
                         alt="${product.name}" 
                         class="lazy-img"
                         width="300" height="300"
                         onerror="this.onerror=null; this.src='https://via.placeholder.com/400x400?text=Image+Not+Found';">
                </picture>
            </div>
            <div class="product-info">
                <span class="product-category">${product.subcategory}</span>
                <h3 class="product-name" onclick="showProductDetails(${product.id})">${product.name}</h3>
                <p class="product-description">${product.description.substring(0, 60)}...</p>
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
    modalImg.src = getCDNUrl(product.image);
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
                    <img src="${getCDNUrl(item.image)}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/100x100?text=No+Img'">
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
                <img src="${getCDNUrl(p.image)}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/50x50?text=No+Img'">
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

function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => performSearch(e.target.value));
    }
    
    const closeCart = document.getElementById('closeCart');
    const cartSidebar = document.getElementById('cartSidebar');
    const cartIcon = document.getElementById('cartIcon');
    
    if (cartIcon) cartIcon.onclick = () => cartSidebar.classList.add('active');
    if (closeCart) closeCart.onclick = () => cartSidebar.classList.remove('active');
    
    const closeModal = document.getElementById('closeModal');
    if (closeModal) closeModal.onclick = () => document.getElementById('productModal').style.display = 'none';
    
    window.onclick = (event) => {
        const modal = document.getElementById('productModal');
        if (event.target == modal) modal.style.display = 'none';
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

function setupMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    const closeMenu = document.getElementById('closeMenu');
    
    if (menuToggle) menuToggle.onclick = () => mobileMenu.classList.add('active');
    if (closeMenu) closeMenu.onclick = () => mobileMenu.classList.remove('active');
    
    document.addEventListener('click', (e) => {
        if (mobileMenu.classList.contains('active') && !mobileMenu.contains(e.target) && !menuToggle.contains(e.target)) {
            mobileMenu.classList.remove('active');
        }
    });
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
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `<i class="fas fa-check-circle"></i> ${text}`;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
