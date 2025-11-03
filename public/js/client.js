// متغيرات الأسعار
const PRICES = {
    A4: 100,
    A5: 50,
    LAMINATION: 3000
};

// عناصر DOM
const form = document.getElementById('printingForm');
const fileInput = document.getElementById('file');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const selectedFileName = document.getElementById('selectedFileName');
const pageCountElement = document.getElementById('pageCount');
const pageInfoElement = document.getElementById('pageInfo');
const priceInfoElement = document.getElementById('priceInfo');
const whatsappInfoElement = document.getElementById('whatsappInfo');
const totalPriceElement = document.getElementById('totalPrice');
const copiesInput = document.getElementById('copies');

// متغيرات الحساب
let pageCount = 0;
let paperSize = 'A4';
let colorType = 'ملون';
let hasLamination = false;
let isPdfFile = false;
let copies = 1;

// كشف WebView وتطبيقات الهاتف
function isMobileApp() {
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes('wv') || // Android WebView
           userAgent.includes('webview') || 
           userAgent.includes('mobile') ||
           /android|iphone|ipad|ipod/.test(userAgent);
}

// حل خاص لـ WebView - إنشاء input file ديناميكي
function createWebViewFileInput() {
    // إزالة الـ event listeners القديمة
    const newFileInput = document.createElement('input');
    newFileInput.type = 'file';
    newFileInput.id = 'file';
    newFileInput.name = 'file';
    newFileInput.accept = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png';
    newFileInput.style.display = 'none';
    
    // استبدال الـ input القديم
    const oldFileInput = document.getElementById('file');
    if (oldFileInput) {
        oldFileInput.parentNode.replaceChild(newFileInput, oldFileInput);
    }
    
    return newFileInput;
}

// تهيئة رفع الملفات لـ WebView
function initWebViewFileUpload() {
    const fileUploadArea = document.getElementById('fileUploadArea');
    
    // إعادة إنشاء input file
    const fileInput = createWebViewFileInput();
    
    // إضافة رسالة مساعدة للويب فيو
    if (isMobileApp()) {
        const helpText = document.createElement('div');
        helpText.className = 'webview-help';
        helpText.innerHTML = `
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 10px; margin-top: 10px; text-align: center;">
                <i class="fas fa-info-circle" style="color: #856404;"></i>
                <small style="color: #856404;">
                    في بعض التطبيقات، قد تحتاج إلى اختيار "المستندات" أو "الملفات" بدلاً من الكاميرا
                </small>
            </div>
        `;
        fileUploadArea.parentNode.insertBefore(helpText, fileUploadArea.nextSibling);
    }
    
    // تحسين event listeners للويب فيو
    fileUploadArea.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // محاكاة click على input file
        setTimeout(() => {
            fileInput.click();
        }, 100);
    });
    
    // معالجة اختيار الملف
    fileInput.addEventListener('change', function(e) {
        if (this.files && this.files[0]) {
            handleFileSelection(this.files[0]);
        }
    });
    
    // تحسينات اللمس للهواتف
    fileUploadArea.addEventListener('touchstart', function(e) {
        this.style.background = '#667eea15';
        this.style.borderColor = '#4c63af';
    }, { passive: true });
    
    fileUploadArea.addEventListener('touchend', function(e) {
        this.style.background = '#f8f9ff';
        this.style.borderColor = '#667eea';
    }, { passive: true });
    
    return fileInput;
}

// دالة معالجة اختيار الملف
async function handleFileSelection(file) {
    if (!file) return;
    
    // عرض اسم الملف
    selectedFileName.textContent = file.name;
    fileNameDisplay.style.display = 'flex';
    
    // إظهار تحميل
    pageInfoElement.innerHTML = '<div style="color: #667eea; text-align: center;">جاري فحص الملف...</div>';
    
    if (file.size > 60 * 1024 * 1024) {
        showMobileAlert('❌ حجم الملف كبير جداً! الحد الأقصى 60MB');
        resetFileInfo();
        return;
    }

    const fileExt = file.name.split('.').pop().toLowerCase();
    
    if (fileExt === 'pdf') {
        try {
            pageCount = await getPdfPageCount(file);
            isPdfFile = true;
            
            pageInfoElement.textContent = `عدد الصفحات: ${pageCount}`;
            updatePrice();
            
            const pricePerSide = paperSize === 'A4' ? PRICES.A4 : PRICES.A5;
            const pricePerCopy = (pageCount * 2 * pricePerSide) + (hasLamination ? PRICES.LAMINATION : 0);
            const totalPrice = pricePerCopy * copies;
            
            let priceMessage = `✅ تم تحميل ملف PDF\n📄 الصفحات: ${pageCount}\n💰 السعر: ${totalPrice.toLocaleString()} ليرة`;
            if (copies > 1) {
                priceMessage += `\n📋 (${copies} نسخة)`;
            }
            
            showMobileAlert(priceMessage);
            
        } catch (error) {
            console.error('خطأ في حساب الصفحات:', error);
            pageCount = Math.max(1, Math.floor(file.size / 100000));
            isPdfFile = true;
            pageInfoElement.textContent = `عدد الصفحات (تقديري): ${pageCount}`;
            updatePrice();
            
            showMobileAlert(`⚠️ تم تحميل ملف PDF\n📄 الصفحات (تقديري): ${pageCount}`);
        }
    } else {
        isPdfFile = false;
        pageCount = 0;
        pageInfoElement.textContent = 'نوع الملف: ' + getFileTypeName(fileExt);
        updatePrice();
        showMobileAlert(`✅ تم تحميل الملف\n📞 سيتم إعلامك بالسعر عبر واتساب`);
    }
}

// دالة لعرض التنبيهات
function showMobileAlert(message) {
    alert(message);
}

// دالة التحقق من رقم الهاتف
function validatePhone(phone) {
    const phoneRegex = /^09\d{8}$/;
    return phoneRegex.test(phone);
}

// وظائف localStorage
function savePhoneToStorage(phone) {
    if (phone && validatePhone(phone)) {
        localStorage.setItem('userPhone', phone);
        return true;
    }
    return false;
}

function getPhoneFromStorage() {
    return localStorage.getItem('userPhone') || '';
}

function clearPhoneFromStorage() {
    localStorage.removeItem('userPhone');
}

// تحميل الطلبات تلقائياً عند فتح الصفحة
function autoLoadUserOrders() {
    const savedPhone = getPhoneFromStorage();
    if (savedPhone && validatePhone(savedPhone)) {
        document.getElementById('phone').value = savedPhone;
        loadUserOrders();
    }
}

// تحديث السعر عند تغيير الإعدادات
function updatePrice() {
    if (!isPdfFile) {
        priceInfoElement.style.display = 'none';
        whatsappInfoElement.style.display = 'block';
        return;
    }

    const pricePerSide = paperSize === 'A4' ? PRICES.A4 : PRICES.A5;
    const sides = pageCount * 2;
    const printingPrice = sides * pricePerSide;
    const laminationPrice = hasLamination ? PRICES.LAMINATION : 0;
    const pricePerCopy = printingPrice + laminationPrice;
    const totalPrice = pricePerCopy * copies;

    pageCountElement.textContent = pageCount;
    totalPriceElement.textContent = totalPrice.toLocaleString() + ' ل.س';
    
    if (copies > 1) {
        const copiesInfo = document.getElementById('copiesInfo') || document.createElement('div');
        copiesInfo.id = 'copiesInfo';
        copiesInfo.style.cssText = 'font-size: 0.9em; color: #666; margin-top: 5px;';
        copiesInfo.innerHTML = `(${copies} نسخة × ${pricePerCopy.toLocaleString()} ل.س)`;
        
        if (!totalPriceElement.parentNode.querySelector('#copiesInfo')) {
            totalPriceElement.parentNode.appendChild(copiesInfo);
        }
    } else {
        const copiesInfo = document.getElementById('copiesInfo');
        if (copiesInfo) copiesInfo.remove();
    }
    
    priceInfoElement.style.display = 'flex';
    whatsappInfoElement.style.display = 'none';
}

// استماع لتغيير عدد النسخ
if (copiesInput) {
    copiesInput.addEventListener('change', (e) => {
        copies = parseInt(e.target.value) || 1;
        if (copies < 1) copies = 1;
        if (copies > 100) copies = 100;
        e.target.value = copies;
        updatePrice();
    });
    
    copiesInput.addEventListener('blur', (e) => {
        if (!e.target.value || e.target.value < 1) {
            e.target.value = 1;
            copies = 1;
            updatePrice();
        }
    });
}

// استماع لتغيير حجم الورق ونوع الطباعة
document.querySelectorAll('.option-btn[data-value]').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const parent = e.target.closest('.option-buttons');
        parent.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));
        
        e.target.classList.add('active');
        
        if (e.target.closest('.spec-content').querySelector('h4').textContent === 'حجم الورق') {
            paperSize = e.target.getAttribute('data-value');
            document.getElementById('paperSize').value = paperSize;
        } else {
            colorType = e.target.getAttribute('data-value');
            document.getElementById('colorType').value = colorType;
        }
        
        updatePrice();
    });
});

// استماع للتسليك
document.getElementById('lamination').addEventListener('change', (e) => {
    hasLamination = e.target.checked;
    updatePrice();
});

// دالة حساب صفحات PDF
async function getPdfPageCount(file) {
    return new Promise((resolve, reject) => {
        const fileURL = URL.createObjectURL(file);
        
        pdfjsLib.getDocument({
            url: fileURL,
            disableFontFace: true,
            disableStream: true,
            disableAutoFetch: true
        }).promise
            .then(pdf => {
                const numPages = pdf.numPages;
                URL.revokeObjectURL(fileURL);
                resolve(numPages);
            })
            .catch(error => {
                URL.revokeObjectURL(fileURL);
                reject(error);
            });
    });
}

// دالة مساعدة للحصول على اسم نوع الملف
function getFileTypeName(ext) {
    const types = {
        'doc': 'Word',
        'docx': 'Word',
        'xls': 'Excel', 
        'xlsx': 'Excel',
        'jpg': 'صورة',
        'jpeg': 'صورة',
        'png': 'صورة'
    };
    return types[ext] || ext.toUpperCase();
}

// إعادة تعيين معلومات الملف
function resetFileInfo() {
    pageCount = 0;
    isPdfFile = false;
    pageInfoElement.textContent = 'عدد الصفحات: --';
    priceInfoElement.style.display = 'none';
    whatsappInfoElement.style.display = 'none';
    fileNameDisplay.style.display = 'none';
    copies = 1;
    if (copiesInput) copiesInput.value = 1;
    const copiesInfo = document.getElementById('copiesInfo');
    if (copiesInfo) copiesInfo.remove();
}

// دالة جلب الطلبات من السيرفر
async function loadUserOrders() {
    const phone = document.getElementById('phone').value.trim();
    
    if (!phone || !validatePhone(phone)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/orders/phone/${phone}`);
        
        if (!response.ok) {
            throw new Error(`خطأ في السيرفر: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            displayUserOrders(result.orders);
        } else {
            console.error('Error from server:', result.message);
        }
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

// دالة عرض طلبات المستخدم
function displayUserOrders(orders) {
    const ordersList = document.getElementById('userOrdersList');
    const tracker = document.getElementById('ordersTracker');
    
    if (!orders || orders.length === 0) {
        ordersList.innerHTML = `
            <div class="no-orders-track">
                <i class="fas fa-inbox"></i>
                <h4>لا توجد طلبات حالياً</h4>
                <p>سيتم عرض طلباتك هنا بعد إرسالها</p>
            </div>
        `;
        if (tracker) tracker.style.display = 'block';
        return;
    }
    
    const ordersHTML = orders.map(order => `
        <div class="order-track-item ${order.status === 'ready' ? 'ready' : ''}">
            <div class="order-header">
                <div class="order-id">طلب #${order.id}</div>
                <div class="order-status ${order.status === 'ready' ? 'status-ready' : 'status-printing'}">
                    <i class="fas ${order.status === 'ready' ? 'fa-check-circle' : 'fa-spinner'}"></i>
                    ${order.status === 'ready' ? 'الملف جاهز' : 'قيد الطباعة'}
                </div>
            </div>
            <div class="order-details">
                <p><i class="fas fa-file"></i> <strong>ملفك:</strong></p>
                <p><i class="fas fa-cog"></i> <strong>المواصفات:</strong> ${order.paperSize} - ${order.colorType} ${order.lamination ? '- مع التسليك' : ''}</p>
                <p><i class="fas fa-file-alt"></i> <strong>الصفحات:</strong> ${order.pageCount} صفحة</p>
                <p><i class="fas fa-copy"></i> <strong>النسخ:</strong> ${order.copies || 1} نسخة</p>
                <p><i class="fas fa-money-bill"></i> <strong>السعر:</strong> ${order.totalPrice ? order.totalPrice.toLocaleString() + ' ل.س' : 'يحدد لاحقاً'}</p>
            </div>
        </div>
    `).join('');
    
    ordersList.innerHTML = ordersHTML;
    if (tracker) tracker.style.display = 'block';
}

// دالة تحديث الطلبات
function refreshOrders() {
    const refreshBtn = document.querySelector('.refresh-btn');
    if (refreshBtn) {
        refreshBtn.style.transform = 'rotate(180deg)';
        setTimeout(() => {
            refreshBtn.style.transform = 'rotate(0)';
        }, 500);
    }
    loadUserOrders();
}

// دالة تسجيل خروج المستخدم
function logoutUser() {
    if (confirm('هل تريد تسجيل الخروج؟ سيتم حذف رقم هاتفك من هذا الجهاز.')) {
        clearPhoneFromStorage();
        document.getElementById('phone').value = '';
        document.getElementById('ordersTracker').style.display = 'none';
        resetFileInfo();
        alert('✅ تم تسجيل الخروج بنجاح');
    }
}

// معالجة إرسال النموذج
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const fileInput = document.getElementById('file');
    const file = fileInput.files[0];

    if (!name || !phone || !file) {
        showMobileAlert('❌ يرجى ملء جميع الحقول المطلوبة');
        return;
    }

    if (!validatePhone(phone)) {
        showMobileAlert('❌ رقم الهاتف غير صحيح! يجب أن يبدأ بـ 09 ويتكون من 10 أرقام');
        return;
    }

    savePhoneToStorage(phone);

    const submitBtn = form.querySelector('.submit-btn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري إرسال الطلب...';
    submitBtn.disabled = true;

    try {
        const formData = new FormData();
        formData.append('name', name);
        formData.append('phone', phone);
        formData.append('file', file);
        formData.append('paperSize', paperSize);
        formData.append('colorType', colorType);
        formData.append('lamination', hasLamination);
        formData.append('clientPageCount', pageCount);
        formData.append('copies', copies);
        
        const response = await fetch('/api/orders/upload', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok && result.success) {
            let message = `✅ تم إرسال طلبك بنجاح!\n📦 رقم طلبك: ${result.orderId}`;
            
            if (isPdfFile) {
                const pricePerSide = paperSize === 'A4' ? PRICES.A4 : PRICES.A5;
                const pricePerCopy = (pageCount * 2 * pricePerSide) + (hasLamination ? PRICES.LAMINATION : 0);
                const totalPrice = pricePerCopy * copies;
                
                message += `\n💰 السعر النهائي: ${totalPrice.toLocaleString()} ليرة`;
                if (copies > 1) {
                    message += `\n📋 (${copies} نسخة)`;
                }
            } else {
                message += `\n📞 سيتم اعلامك بالسعر عبر واتساب`;
            }

            showMobileAlert(message);
            
            document.getElementById('name').value = '';
            fileInput.value = '';
            resetFileInfo();
            
            setTimeout(loadUserOrders, 1000);
        } else {
            throw new Error(result.message || 'حدث خطأ أثناء الإرسال');
        }

    } catch (error) {
        showMobileAlert('❌ حدث خطأ أثناء إرسال الطلب: ' + error.message);
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});

// عند تغيير رقم الهاتف
document.getElementById('phone').addEventListener('blur', function() {
    const phone = this.value.trim();
    if (validatePhone(phone)) {
        savePhoneToStorage(phone);
        loadUserOrders();
    }
});

// عند التركيز على حقل الهاتف
document.getElementById('phone').addEventListener('focus', function() {
    const savedPhone = getPhoneFromStorage();
    if (savedPhone && !this.value) {
        this.value = savedPhone;
    }
});

// التهيئة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    updatePrice();
    resetFileInfo();
    autoLoadUserOrders();
    initWebViewFileUpload(); // ✨ التهيئة الجديدة للويب فيو
});

// تحديث تلقائي للطلبات كل دقيقة
setInterval(() => {
    loadUserOrders();
}, 60000);