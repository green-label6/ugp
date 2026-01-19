// ============================================
// سكريبت صفحة تفاصيل المنتج
// ============================================

// تعريف المتغيرات العامة
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let categoriesData = {};
let allProducts = [];
let currentProduct = null;
let currentView = 'grid-2';

// ============================================
// تهيئة الصفحة عند تحميلها
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeProductPage();
});

async function initializeProductPage() {
    // إظهار مؤشر التحميل
    showLoadingIndicator();
    
    setCurrentYear();
    setupEventListeners();
    setupNotifications();
    updateCartUI();
    updateFavoritesUI();
    setupMobileMenu();
    setupBackToTop();
    setupCart();
    setupCheckout();
    setupProductModal();
    
    try {
        // تحميل البيانات بشكل متتابع
        await loadProductsData();
        
        // بعد تحميل البيانات، إعداد الكاروسيل
        setupCarousel();
        
        // استخراج معلومات المنتج من الرابط وعرضها
        await loadProductFromUrl();
        
    } catch (error) {
        console.error('خطأ في تحميل البيانات:', error);
        showProductError('حدث خطأ أثناء تحميل البيانات، يرجى تحديث الصفحة');
    } finally {
        // إخفاء مؤشر التحميل
        hideLoadingIndicator();
    }
}

// ============================================
// دالة إظهار مؤشر التحميل
// ============================================

function showLoadingIndicator() {
    const section = document.getElementById('productMainSection');
    if (section) {
        section.innerHTML = `
            <div class="loading-indicator">
                <i class="fas fa-spinner fa-spin"></i>
                <p>جاري تحميل البيانات...</p>
            </div>
        `;
    }
    
    const relatedSection = document.getElementById('relatedProductsSection');
    if (relatedSection) {
        relatedSection.innerHTML = `
            <div class="loading-indicator">
                <i class="fas fa-spinner fa-spin"></i>
                <p>جاري تحميل المنتجات ذات الصلة...</p>
            </div>
        `;
    }
}

// ============================================
// دالة إخفاء مؤشر التحميل
// ============================================

function hideLoadingIndicator() {
    // يتم إزالة مؤشرات التحميل عند عرض المحتوى الفعلي
}

// ============================================
// دالة استخراج معرف المنتج من الرابط
// ============================================

async function loadProductFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));
    
    if (!productId || isNaN(productId)) {
        showProductError('لم يتم تحديد منتج في الرابط');
        return;
    }
    
    // البحث عن المنتج في البيانات المحملة
    currentProduct = allProducts.find(p => p.id === productId);
    
    if (!currentProduct) {
        showProductError('المنتج غير موجود في قاعدة البيانات');
        return;
    }
    
    // عرض تفاصيل المنتج والمنتجات ذات الصلة
    displayProductDetails(currentProduct);
    displayRelatedProducts(currentProduct);
    updatePageTitle(currentProduct);
    updateBreadcrumbs(currentProduct);
}

// ============================================
// دالة عرض تفاصيل المنتج
// ============================================

function displayProductDetails(product) {
    const section = document.getElementById('productMainSection');
    if (!section) {
        console.error('لم يتم العثور على عنصر productMainSection');
        return;
    }
    
    const formattedPrice = formatPrice(product.price);
    const cdnUrl = getCDNUrl(product.image);
    const isFav = favorites.includes(product.id);
    
    // التحقق من وجود الصورة
    const imageUrl = cdnUrl || 'https://via.placeholder.com/400x400?text=No+Image';
    
    // إنشاء HTML لصفحة المنتج
    section.innerHTML = `
        <div class="product-details-grid">
            <div class="product-details-img">
                <img src="${imageUrl}" 
                     alt="${product.name}" 
                     onerror="this.src='https://via.placeholder.com/400x400?text=No+Image'"
                     id="productMainImage">
            </div>
            <div class="product-details-info">
                <span class="product-category">${product.category || 'غير محدد'} - ${product.subcategory || 'غير محدد'}</span>
                <h2 id="productName">${product.name}</h2>
                <div class="product-price-large">${formattedPrice}</div>
                
                <div class="product-description-full">
                    <h4><i class="fas fa-info-circle"></i> الوصف الكامل:</h4>
                    <div class="description-content">${formatDescription(product.description)}</div>
                </div>
                
                <div class="product-details-actions">
                    <div class="quantity-control">
                        <button class="qty-btn minus" onclick="changeQuantity(-1)">-</button>
                        <input type="number" id="productQty" value="1" min="1">
                        <button class="qty-btn plus" onclick="changeQuantity(1)">+</button>
                    </div>
                    
                    <div class="modal-actions-row">
                        <button class="primary-btn" onclick="addCurrentProductToCart()">
                            <i class="fas fa-cart-plus"></i> إضافة للسلة
                        </button>
                        <button class="secondary-btn ${isFav ? 'active' : ''}" onclick="toggleCurrentProductFavorite()">
                            <i class="fas fa-heart"></i> ${isFav ? 'في المفضلة' : 'المفضلة'}
                        </button>
                    </div>
                    
                    <button class="share-btn" onclick="shareCurrentProduct()">
                        <i class="fas fa-share-alt"></i> مشاركة المنتج
                    </button>
                </div>
            </div>
        </div>
        
        <!-- قسم التبويبات -->
        <div class="product-tabs">
            <div class="tabs-header">
                <button class="tab-btn active" onclick="switchTab('description')">الوصف</button>
                <button class="tab-btn" onclick="switchTab('ingredients')">المكونات</button>
                <button class="tab-btn" onclick="switchTab('usage')">طريقة الاستخدام</button>
            </div>
            <div class="tab-content active" id="tab-description">
                <h4><i class="fas fa-align-right"></i> وصف المنتج</h4>
                <p>${formatDescription(product.description)}</p>
            </div>
            <div class="tab-content" id="tab-ingredients">
                <h4><i class="fas fa-flask"></i> مكونات المنتج</h4>
                <p>${getIngredientsText(product)}</p>
            </div>
            <div class="tab-content" id="tab-usage">
                <h4><i class="fas fa-hands"></i> طريقة الاستخدام</h4>
                <p>${getUsageText(product)}</p>
            </div>
        </div>
    `;
    
    // إعادة تعيين عناصر التحكم في الكمية
    reattachQuantityControls();
}

// ============================================
// إعادة ربط عناصر التحكم في الكمية
// ============================================

function reattachQuantityControls() {
    const plusBtn = document.querySelector('.qty-btn.plus');
    const minusBtn = document.querySelector('.qty-btn.minus');
    const qtyInput = document.getElementById('productQty');
    
    if (plusBtn && minusBtn && qtyInput) {
        // إزالة المستمعين السابقين
        const newPlusBtn = plusBtn.cloneNode(true);
        const newMinusBtn = minusBtn.cloneNode(true);
        const newQtyInput = qtyInput.cloneNode(true);
        
        plusBtn.parentNode.replaceChild(newPlusBtn, plusBtn);
        minusBtn.parentNode.replaceChild(newMinusBtn, minusBtn);
        qtyInput.parentNode.replaceChild(newQtyInput, qtyInput);
        
        // إضافة المستمعين الجدد
        newPlusBtn.addEventListener('click', () => {
            const currentVal = parseInt(newQtyInput.value) || 1;
            newQtyInput.value = currentVal + 1;
        });
        
        newMinusBtn.addEventListener('click', () => {
            const currentVal = parseInt(newQtyInput.value) || 1;
            if (currentVal > 1) {
                newQtyInput.value = currentVal - 1;
            }
        });
    }
}

// ============================================
// دالة تنسيق الوصف
// ============================================

function formatDescription(description) {
    if (!description) return 'لا يوجد وصف متاح لهذا المنتج.';
    
    // تحويل السطور الجديدة إلى فقرات
    const paragraphs = description.split('\n\n');
    return paragraphs.map(p => `<p>${p.trim()}</p>`).join('');
}

// ============================================
// دالة الحصول على نص المكونات
// ============================================

function getIngredientsText(product) {
    // يمكنك تخصيص هذا حسب البيانات المتاحة
    const defaultText = `
        <p>المكونات الرئيسية للمنتج:</p>
        <ul>
            <li>ماء مقطر</li>
            <li>مواد طبيعية آمنة للبشرة</li>
            <li>فيتامينات ومغذيات خاصة</li>
        </ul>
        <p><small>للحصول على قائمة المكونات الكاملة، يرجى مراجعة العبوة.</small></p>
    `;
    
    return defaultText;
}

// ============================================
// دالة الحصول على نص طريقة الاستخدام
// ============================================

function getUsageText(product) {
    const defaultText = `
        <p><strong>طريقة الاستخدام:</strong></p>
        <ul>
            <li>نظف البشرة جيداً قبل الاستخدام</li>
            <li>ضعي كمية مناسبة على الوجه والرقبة</li>
            <li>دلكي بلطف حتى الامتصاص الكامل</li>
            <li>استخدميه يومياً للحصول على أفضل النتائج</li>
        </ul>
        <p><small>للاستخدام الخارجي فقط. يُحفظ بعيداً عن متناول الأطفال.</small></p>
    `;
    
    return defaultText;
}

// ============================================
// دالة تبديل التبويبات
// ============================================

function switchTab(tabName) {
    // إزالة التفعيل من جميع الأزرار والمحتويات
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // تفعيل التبويب المحدد
    const targetBtn = document.querySelector(`.tab-btn[onclick="switchTab('${tabName}')"]`);
    const targetContent = document.getElementById(`tab-${tabName}`);
    
    if (targetBtn) targetBtn.classList.add('active');
    if (targetContent) targetContent.classList.add('active');
}

// ============================================
// دالة عرض المنتجات ذات الصلة
// ============================================

function displayRelatedProducts(currentProduct) {
    const carousel = document.getElementById('relatedCarousel');
    const relatedSection = document.getElementById('relatedProductsSection');
    
    if (!carousel) {
        console.error('لم يتم العثور على عنصر relatedCarousel');
        // إعادة إنشاء القسم إذا لم يكن موجوداً
        if (relatedSection) {
            relatedSection.innerHTML = `
                <div class="related-products-carousel" id="relatedCarousel">
                    <div class="no-related-products">
                        <i class="fas fa-box-open"></i>
                        <p>لا توجد منتجات ذات صلة حالياً</p>
                    </div>
                </div>
            `;
        }
        return;
    }
    
    // تصفية المنتجات ذات الصلة (نفس القسم الفرعي، مع استبعاد المنتج الحالي)
    const relatedProducts = allProducts.filter(p => 
        p.id !== currentProduct.id && 
        (p.category === currentProduct.category || p.subcategory === currentProduct.subcategory)
    ).slice(0, 10); // عرض 10 منتجات كحد أقصى
    
    if (relatedProducts.length === 0) {
        carousel.innerHTML = `
            <div class="no-related-products">
                <i class="fas fa-box-open"></i>
                <p>لا توجد منتجات ذات صلة حالياً</p>
            </div>
        `;
        return;
    }
    
    // إنشاء HTML للكاروسيل
    carousel.innerHTML = relatedProducts.map(product => createRelatedProductCard(product)).join('');
    
    // تحديث حالة أزرار التنقل
    updateCarouselButtons();
    
    // إضافة معالجات النقر لبطاقات المنتجات
    setupProductCardListeners();
}

// ============================================
// دالة إنشاء بطاقة المنتج في الكاروسيل
// ============================================

function createRelatedProductCard(product) {
    const formattedPrice = formatPrice(product.price);
    const cdnUrl = getCDNUrl(product.image);
    const isFav = favorites.includes(product.id);
    const imageUrl = cdnUrl || 'https://via.placeholder.com/200x200?text=No+Image';
    
    // تقليم الوصف
    let shortDescription = '';
    if (product.description) {
        shortDescription = product.description.length > 60 
            ? product.description.substring(0, 60) + '...' 
            : product.description;
    } else {
        shortDescription = 'لا يوجد وصف متاح';
    }
    
    return `
        <div class="product-card" onclick="navigateToProduct(${product.id})">
            ${isFav ? '<div class="featured-badge"><i class="fas fa-heart"></i></div>' : ''}
            <button class="fav-btn ${isFav ? 'active' : ''}" data-id="${product.id}" onclick="toggleFavorite(${product.id}, event)">
                <i class="fas fa-heart"></i>
            </button>
            <div class="product-img">
                <img src="${imageUrl}" 
                     alt="${product.name}"
                     onerror="this.src='https://via.placeholder.com/200x200?text=No+Image'">
            </div>
            <div class="product-info">
                <span class="product-category">${product.subcategory || 'غير محدد'}</span>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${shortDescription}</p>
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

// ============================================
// دالة الانتقال لمنتج آخر
// ============================================

function navigateToProduct(productId) {
    window.location.href = `product.html?id=${productId}`;
}

// ============================================
// دالة إعداد مستمعي أحداث بطاقات المنتجات
// ============================================

function setupProductCardListeners() {
    // التحقق من وجود عناصر قبل إضافة المستمعين
    const favButtons = document.querySelectorAll('.related-products-carousel .fav-btn');
    
    favButtons.forEach(btn => {
        // إزالة المستمع السابق إذا كان موجوداً
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', (e) => {
            const productId = parseInt(newBtn.dataset.id);
            toggleFavorite(productId, e);
        });
    });
}

// ============================================
// دالة إعداد الكاروسيل
// ============================================

function setupCarousel() {
    const carousel = document.getElementById('relatedCarousel');
    const prevBtn = document.getElementById('relatedPrev');
    const nextBtn = document.getElementById('relatedNext');
    
    if (!carousel || !prevBtn || !nextBtn) {
        console.log('لم يتم العثور على عناصر الكاروسيل، سيتم المحاولة لاحقاً');
        return;
    }
    
    // زر التالي (يمين)
    nextBtn.addEventListener('click', () => {
        scrollCarousel('next');
    });
    
    // زر السابق (يسار)
    prevBtn.addEventListener('click', () => {
        scrollCarousel('prev');
    });
    
    // تحديث حالة الأزرار عند التمرير
    carousel.addEventListener('scroll', updateCarouselButtons);
    
    // دعم السحب باللمس
    setupTouchSwipe(carousel);
    
    // تحديث الأزرار عند تغيير حجم النافذة
    window.addEventListener('resize', updateCarouselButtons);
}

// ============================================
// دالة تمرير الكاروسيل
// ============================================

function scrollCarousel(direction) {
    const carousel = document.getElementById('relatedCarousel');
    if (!carousel) return;
    
    const cardWidth = carousel.querySelector('.product-card')?.offsetWidth || 250;
    const gap = 16;
    const scrollAmount = (cardWidth + gap) * 2; // تمرير بطاقتين في كل مرة
    
    if (direction === 'next') {
        carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    } else {
        carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
}

// ============================================
// دالة تحديث حالة أزرار التنقل
// ============================================

function updateCarouselButtons() {
    const carousel = document.getElementById('relatedCarousel');
    const prevBtn = document.getElementById('relatedPrev');
    const nextBtn = document.getElementById('relatedNext');
    
    if (!carousel || !prevBtn || !nextBtn) return;
    
    // التحقق من وجود محتوى كافٍ للتمرير
    const canScrollPrev = carousel.scrollLeft > 0;
    const canScrollNext = carousel.scrollLeft + carousel.clientWidth < carousel.scrollWidth - 5;
    
    prevBtn.disabled = !canScrollPrev;
    nextBtn.disabled = !canScrollNext;
}

// ============================================
// دالة إعداد السحب باللمس
// ============================================

function setupTouchSwipe(element) {
    if (!element) return;
    
    let touchStartX = 0;
    let touchEndX = 0;
    
    element.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    element.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
    
    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // سحب لليمين - عرض المنتجات التالية
                scrollCarousel('next');
            } else {
                // سحب لليسار - عرض المنتجات السابقة
                scrollCarousel('prev');
            }
        }
    }
}

// ============================================
// دالة تغيير الكمية
// ============================================

function changeQuantity(change) {
    const qtyInput = document.getElementById('productQty');
    if (!qtyInput) return;
    
    let currentQty = parseInt(qtyInput.value) || 1;
    let newQty = currentQty + change;
    
    if (newQty < 1) newQty = 1;
    if (newQty > 99) newQty = 99;
    
    qtyInput.value = newQty;
}

// ============================================
// دالة إضافة المنتج الحالي للسلة
// ============================================

function addCurrentProductToCart() {
    if (!currentProduct) {
        showNotification('يرجى الانتظار حتى يتم تحميل المنتج', 'warning');
        return;
    }
    
    const qtyInput = document.getElementById('productQty');
    const quantity = parseInt(qtyInput?.value) || 1;
    
    addToCart(currentProduct.id, quantity);
}

// ============================================
// دالة تبديل المفضلة للمنتج الحالي
// ============================================

function toggleCurrentProductFavorite() {
    if (!currentProduct) return;
    
    toggleFavorite(currentProduct.id);
    
    // تحديث نص الزر
    const favBtn = document.querySelector('#productMainSection .secondary-btn');
    if (favBtn) {
        const isFav = favorites.includes(currentProduct.id);
        favBtn.classList.toggle('active', isFav);
        favBtn.innerHTML = isFav ? 
            '<i class="fas fa-heart"></i> في المفضلة' : 
            '<i class="fas fa-heart"></i> المفضلة';
    }
}

// ============================================
// دالة مشاركة المنتج الحالي
// ============================================

function shareCurrentProduct() {
    if (!currentProduct) return;
    
    const productUrl = window.location.href;
    const priceText = formatPrice(currentProduct.price);
    
    let descriptionText = '';
    if (currentProduct.description) {
        descriptionText = currentProduct.description.length > 150 
            ? currentProduct.description.substring(0, 150) + '...' 
            : currentProduct.description;
    } else {
        descriptionText = 'لا يوجد وصف متاح';
    }
    
    const shareTextAr = `
🎀 منتج من كوزمتك بين يديك 🎀

✨ ${currentProduct.name}
📝 ${descriptionText}
💰 السعر: ${priceText}
🏷️ الفئة: ${currentProduct.category || 'غير محدد'} - ${currentProduct.subcategory || 'غير محدد'}

🔗 ${productUrl}
    `;
    
    if (navigator.share) {
        navigator.share({
            title: `كوزمتك بين يديك - ${currentProduct.name}`,
            text: shareTextAr,
            url: productUrl,
        }).catch(console.error);
    } else {
        fallbackShare(shareTextAr);
    }
}

// ============================================
// دالة المشاركة البديلة
// ============================================

function fallbackShare(shareText) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareText)
            .then(() => {
                showNotification('تم نسخ تفاصيل المنتج إلى الحافظة 📋', 'success');
            })
            .catch(() => {
                manualShare(shareText);
            });
    } else {
        manualShare(shareText);
    }
}

// ============================================
// دالة المشاركة اليدوية
// ============================================

function manualShare(shareText) {
    const shareModal = document.createElement('div');
    shareModal.className = 'modal';
    shareModal.style.display = 'block';
    shareModal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <button class="close-modal" onclick="this.parentElement.parentElement.remove(); document.body.style.overflow='auto'">&times;</button>
            <div class="share-modal">
                <h3><i class="fas fa-share-alt"></i> مشاركة المنتج</h3>
                <p>انسخ النص التالي وشاركه على وسائل التواصل الاجتماعية:</p>
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
}

// ============================================
// دالة نسخ نص المشاركة
// ============================================

window.copyShareText = function() {
    const textarea = document.getElementById('shareTextArea');
    if (textarea) {
        textarea.select();
        document.execCommand('copy');
        showNotification('تم نسخ النص إلى الحافظة 📋', 'success');
    }
};

// ============================================
// دالة المشاركة عبر واتساب
// ============================================

window.shareToWhatsApp = function() {
    const textarea = document.getElementById('shareTextArea');
    if (textarea) {
        const text = encodeURIComponent(textarea.value);
        window.open(`https://wa.me/?text=${text}`, '_blank');
    }
};

// ============================================
// دالة المشاركة عبر فيسبوك
// ============================================

window.shareToFacebook = function() {
    const textarea = document.getElementById('shareTextArea');
    if (textarea) {
        const text = encodeURIComponent(textarea.value);
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${text}`, '_blank');
    }
};

// ============================================
// دالة المشاركة عبر تويتر
// ============================================

window.shareToTwitter = function() {
    const textarea = document.getElementById('shareTextArea');
    if (textarea) {
        const text = encodeURIComponent(textarea.value.substring(0, 280));
        window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
    }
};

// ============================================
// دالة تحديث عنوان الصفحة
// ============================================

function updatePageTitle(product) {
    document.title = `${product.name} - كوزمتك بين يديك`;
    
    // تحديث meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    let descText = '';
    if (product.description) {
        descText = product.description.length > 150 
            ? product.description.substring(0, 150) + '...' 
            : product.description;
    } else {
        descText = `منتج ${product.name} متاح الآن بأسعار مناسبة`;
    }
    
    if (metaDesc) {
        metaDesc.content = `${product.name} - ${descText} متاح الآن بأسعار مناسبة. تسوقي الآن من كوزمتك بين يديك.`;
    }
}

// ============================================
// دالة تحديث مسار التنقل
// ============================================

function updateBreadcrumbs(product) {
    const categoryBreadcrumb = document.getElementById('breadcrumbCategory');
    const productBreadcrumb = document.getElementById('breadcrumbProduct');
    
    if (categoryBreadcrumb) {
        categoryBreadcrumb.textContent = product.category || 'غير محدد';
        categoryBreadcrumb.onclick = () => {
            window.location.href = 'index.html';
        };
        categoryBreadcrumb.style.cursor = 'pointer';
        categoryBreadcrumb.style.color = 'var(--primary-color)';
    }
    
    if (productBreadcrumb) {
        productBreadcrumb.textContent = product.name;
    }
}

// ============================================
// دالة عرض خطأ المنتج
// ============================================

function showProductError(message = 'حدث خطأ') {
    const section = document.getElementById('productMainSection');
    if (!section) return;
    
    section.innerHTML = `
        <div class="product-error">
            <i class="fas fa-exclamation-triangle"></i>
            <h2>عذراً، حدث خطأ</h2>
            <p>${message}</p>
            <a href="index.html" class="primary-btn">
                <i class="fas fa-home"></i> العودة للرئيسية
            </a>
        </div>
    `;
    
    // إخفاء قسم المنتجات ذات الصلة
    const relatedSection = document.getElementById('relatedProductsSection');
    if (relatedSection) {
        relatedSection.style.display = 'none';
    }
}

// ============================================
// دالة تحميل بيانات المنتجات
// ============================================

async function loadProductsData() {
    try {
        const response = await fetch('products_by_category.json');
        if (!response.ok) {
            throw new Error(`فشل في تحميل البيانات: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data || !data.categories) {
            throw new Error('تنسيق البيانات غير صحيح');
        }
        
        categoriesData = data.categories;
        
        // تحويل البيانات إلى مصفوفة مسطحة
        let idCounter = 1;
        allProducts = [];
        
        for (const categoryName in categoriesData) {
            const category = categoriesData[categoryName];
            for (const subcategoryName in category) {
                const products = category[subcategoryName];
                if (Array.isArray(products)) {
                    products.forEach(product => {
                        allProducts.push({
                            ...product,
                            id: idCounter++,
                            category: categoryName,
                            subcategory: subcategoryName,
                            priceNum: parseFloat(product.price) || 0,
                            description: product.description || 'لا يوجد وصف متاح للمنتج'
                        });
                    });
                }
            }
        }
        
        console.log(`تم تحميل ${allProducts.length} منتج بنجاح`);
        
    } catch (error) {
        console.error('خطأ في تحميل المنتجات:', error);
        throw error;
    }
}

// ============================================
// دوال السلة (مستعارة من script.js)
// ============================================

function addToCart(id, quantity = 1) {
    const product = allProducts.find(p => p.id === id);
    if (!product) {
        showNotification('المنتج غير موجود', 'error');
        return;
    }
    
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
    
    // فتح سلة المشتريات على الجوال
    if (window.innerWidth <= 768) {
        const cartSidebar = document.getElementById('cartSidebar');
        if (cartSidebar) {
            cartSidebar.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
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
// دالة تبديل المفضلة
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
    
    // تحديث جميع أزرار المفضلة
    document.querySelectorAll(`.fav-btn[data-id="${id}"]`).forEach(btn => {
        btn.classList.toggle('active', index === -1);
    });
    
    updateFavoritesUI();
}

// ============================================
// دالة تحديث واجهة المفضلة
// ============================================

function updateFavoritesUI() {
    // يمكن إضافة تحديث للعدادات هنا
}

// ============================================
// دالة الحصول على رابط CDN
// ============================================

function getCDNUrl(path) {
    if (!path) return 'https://via.placeholder.com/300x300?text=No+Image';
    let cleanPath = path.startsWith('/') ? path.substring(1) : path;
    const encodedPath = cleanPath.split('/').map(part => encodeURIComponent(part)).join('/');
    return `https://cdn.jsdelivr.net/gh/green-label6/ugp@master/${encodedPath}`;
}

// ============================================
// دالة تنسيق السعر
// ============================================

function formatPrice(price) {
    const p = parseFloat(price);
    if (isNaN(p) || p === 0) return "يحدد لاحقاً";
    
    return p.toLocaleString('ar-IQ', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }) + " د.ع";
}

// ============================================
// دالة إعداد مستمعي الأحداث
// ============================================

function setupEventListeners() {
    // معالج مفتاح ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

// ============================================
// دالة إعداد الإشعارات
// ============================================

function setupNotifications() {
    const notificationContainer = document.getElementById('notificationContainer');
    if (!notificationContainer) {
        const container = document.createElement('div');
        container.id = 'notificationContainer';
        container.className = 'notification-container';
        document.body.appendChild(container);
    }
}

// ============================================
// دالة عرض الإشعار
// ============================================

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
// دالة إعداد قائمة الجوال
// ============================================

function setupMobileMenu() {
    const toggle = document.getElementById('menuToggle');
    const menu = document.getElementById('mobileMenu');
    const close = document.getElementById('closeMenu');
    
    if (toggle && menu) {
        toggle.addEventListener('click', () => {
            menu.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
    
    if (close && menu) {
        close.addEventListener('click', () => {
            menu.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }
}

// ============================================
// دالة إعداد زر العودة للأعلى
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
// دالة إعداد السلة
// ============================================

function setupCart() {
    const cartIcon = document.getElementById('cartIcon');
    const cartSidebar = document.getElementById('cartSidebar');
    const closeCart = document.getElementById('closeCart');
    const continueShopping = document.getElementById('continueShopping');
    
    if (cartIcon && cartSidebar) {
        cartIcon.addEventListener('click', (e) => {
            e.preventDefault();
            cartSidebar.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
    
    if (closeCart && cartSidebar) {
        closeCart.addEventListener('click', () => {
            cartSidebar.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }
    
    if (continueShopping && cartSidebar) {
        continueShopping.addEventListener('click', () => {
            cartSidebar.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }
}

// ============================================
// دالة إعداد الدفع
// ============================================

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

// ============================================
// دالة إعداد نافذة المنتج
// ============================================

function setupProductModal() {
    const closeModal = document.getElementById('closeModal');
    const modal = document.getElementById('productModal');
    
    if (closeModal && modal) {
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
    }
}

// ============================================
// دالة إغلاق جميع النوافذ
// ============================================

function closeAllModals() {
    const productModal = document.getElementById('productModal');
    const cartSidebar = document.getElementById('cartSidebar');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (productModal) productModal.style.display = 'none';
    if (cartSidebar) cartSidebar.classList.remove('active');
    if (mobileMenu) mobileMenu.classList.remove('active');
    
    document.body.style.overflow = 'auto';
}

// ============================================
// دالة تعيين السنة الحالية
// ============================================

function setCurrentYear() {
    const yearElement = document.getElementById('currentYear');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}

// ============================================
// التعامل مع تغيير حجم النافذة
// ============================================

let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        updateCarouselButtons();
    }, 250);
});
