// متغيرات الأسعار
const PRICES = {
    A4: 100,
    A5: 50,
    LAMINATION: 3000
};

// عناصر DOM
const form = document.getElementById('printingForm');
let fileInput = document.getElementById('file');
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

// الحل الجذري لرفع الملفات
function initFileUploadSystem() {
    console.log('🔧 بدء تهيئة نظام رفع الملفات...');
    
    // 1. إنشاء input file جديد ديناميكياً
    const newFileInput = document.createElement('input');
    newFileInput.type = 'file';
    newFileInput.id = 'file';
    newFileInput.name = 'file';
    newFileInput.accept = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png';
    newFileInput.style.cssText = `
        position: fixed;
        top: -1000px;
        left: -1000px;
        opacity: 0;
        pointer-events: none;
    `;
    
    // استبدال الـ input القديم
    if (fileInput && fileInput.parentNode) {
        fileInput.parentNode.replaceChild(newFileInput, fileInput);
    }
    fileInput = newFileInput;
    document.body.appendChild(fileInput);
    
    // 2. إضافة multiple event listeners لمنطقة الرفع
    const fileUploadArea = document.getElementById('fileUploadArea');
    
    // إزالة جميع الـ event listeners السابقة
    const newFileUploadArea = fileUploadArea.cloneNode(true);
    fileUploadArea.parentNode.replaceChild(newFileUploadArea, fileUploadArea);
    
    // 3. إضافة جميع أنواع الأحداث الممكنة
    const events = ['click', 'touchend', 'mousedown', 'pointerdown'];
    
    events.forEach(eventType => {
        newFileUploadArea.addEventListener(eventType, function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log(`🎯 ${eventType}: تم النقر على منطقة الرفع`);
            
            // محاولة فتح ملف بعد فترة بسيطة
            setTimeout(() => {
                fileInput.click();
            }, 100);
        }, { passive: false });
    });
    
    // 4. معالجة اختيار الملف
    fileInput.addEventListener('change', function(e) {
        console.log('📁 حدث change triggered');
        
        if (this.files && this.files[0]) {
            const file = this.files[0];
            console.log('✅ تم اختيار ملف:', file.name, 'الحجم:', file.size);
            handleFileSelection(file);
        } else {
            console.log('❌ لم يتم اختيار ملف');
        }
    });
    
    // 5. إضافة زر طوارئ
    createEmergencyUploadButton();
    
    console.log('✅ تم تهيئة نظام رفع الملفات');
}

// إنشاء زر طوارئ
function createEmergencyUploadButton() {
    // إزالة الزر القديم إذا موجود
    const oldBtn = document.getElementById('emergencyUploadBtn');
    if (oldBtn) oldBtn.remove();
    
    const emergencyBtn = document.createElement('button');
    emergencyBtn.type = 'button';
    emergencyBtn.id = 'emergencyUploadBtn';
    emergencyBtn.innerHTML = `
       
        اضغط هنا إذا لم يعمل رفع الملف العادي
        <small>سيحاول فتح نافذة اختيار الملفات</small>
    `;
    emergencyBtn.style.cssText = `
        background: green;
        color: white;
        border: none;
        padding: 20px;
        border-radius: 15px;
        font-size: 18px;
        margin: 20px 0;
        cursor: pointer;
        width: 100%;
        font-weight: bold;
        
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        animation: pulse 2s infinite;
    `;
    
    // أحداث متعددة للزر
    emergencyBtn.addEventListener('click', function() {
        console.log('🆘 زر الطوارئ: محاولة فتح الملفات');
        fileInput.click();
    });
    
    emergencyBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        console.log('🆘 زر الطوارئ: لمس');
        fileInput.click();
    });
    
    // إضافة CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.02); }
            100% { transform: scale(1); }
        }
    `;
    document.head.appendChild(style);
    
    // إضافة الزر إلى الصفحة
    const fileSection = document.querySelector('.form-section:nth-child(2)');
    fileSection.appendChild(emergencyBtn);
}

// معالجة اختيار الملف
async function handleFileSelection(file) {
    try {
        console.log('🔄 بدء معالجة الملف...');
        
        // التحقق من حجم الملف
        if (file.size > 60 * 1024 * 1024) {
            alert('❌ حجم الملف كبير جداً! الحد الأقصى 60MB');
            resetFileInfo();
            return;
        }
        
        // عرض اسم الملف
        selectedFileName.textContent = file.name;
        fileNameDisplay.style.display = 'flex';
        
        // إظهار تحميل
        pageInfoElement.innerHTML = '<div style="color: #667eea; text-align: center;">جاري فحص الملف...</div>';
        
        const fileExt = file.name.split('.').pop().toLowerCase();
        console.log('📄 نوع الملف:', fileExt);
        
        if (fileExt === 'pdf') {
            try {
                pageCount = await getPdfPageCount(file);
                isPdfFile = true;
                pageInfoElement.textContent = `عدد الصفحات: ${pageCount}`;
                updatePrice();
                
                const totalPrice = calculateTotalPrice();
                alert(`✅ تم تحميل ملف PDF\n📄 الصفحات: ${pageCount}\n💰 السعر: ${totalPrice.toLocaleString()} ليرة`);
                
            } catch (error) {
                console.error('خطأ في حساب الصفحات:', error);
                // تقدير الصفحات
                pageCount = Math.max(1, Math.floor(file.size / 50000));
                isPdfFile = true;
                pageInfoElement.textContent = `عدد الصفحات (تقديري): ${pageCount}`;
                updatePrice();
                alert(`✅ تم تحميل ملف PDF\n📄 الصفحات (تقديري): ${pageCount}`);
            }
        } else {
            isPdfFile = false;
            pageCount = 0;
            pageInfoElement.textContent = 'نوع الملف: ' + getFileTypeName(fileExt);
            updatePrice();
            alert(`✅ تم تحميل الملف\n📞 سيتم إعلامك بالسعر عبر واتساب`);
        }
        
        console.log('✅ اكتملت معالجة الملف');
        
    } catch (error) {
        console.error('❌ خطأ في معالجة الملف:', error);
        alert('❌ حدث خطأ في معالجة الملف');
    }
}

// دالة حساب السعر
function calculateTotalPrice() {
    if (!isPdfFile) return 0;
    
    const pricePerSide = paperSize === 'A4' ? PRICES.A4 : PRICES.A5;
    const sides = pageCount * 2;
    const printingPrice = sides * pricePerSide;
    const laminationPrice = hasLamination ? PRICES.LAMINATION : 0;
    const pricePerCopy = printingPrice + laminationPrice;
    return pricePerCopy * copies;
}

// تحديث السعر
function updatePrice() {
    if (!isPdfFile) {
        priceInfoElement.style.display = 'none';
        whatsappInfoElement.style.display = 'block';
        return;
    }

    const totalPrice = calculateTotalPrice();
    pageCountElement.textContent = pageCount;
    totalPriceElement.textContent = totalPrice.toLocaleString() + ' ل.س';
    
    if (copies > 1) {
        const copiesInfo = document.getElementById('copiesInfo') || document.createElement('div');
        copiesInfo.id = 'copiesInfo';
        copiesInfo.style.cssText = 'font-size: 0.9em; color: #666; margin-top: 5px;';
        copiesInfo.innerHTML = `(${copies} نسخة)`;
        
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

// تحميل الطلبات تلقائياً
function autoLoadUserOrders() {
    const savedPhone = getPhoneFromStorage();
    if (savedPhone && validatePhone(savedPhone)) {
        document.getElementById('phone').value = savedPhone;
        loadUserOrders();
    }
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
        
        pdfjsLib.getDocument(fileURL).promise
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

function getFileTypeName(ext) {
    const types = {
        'doc': 'Word', 'docx': 'Word', 'xls': 'Excel', 'xlsx': 'Excel',
        'jpg': 'صورة', 'jpeg': 'صورة', 'png': 'صورة'
    };
    return types[ext] || ext.toUpperCase();
}

function resetFileInfo() {
    pageCount = 0;
    isPdfFile = false;
    pageInfoElement.textContent = 'عدد الصفحات: --';
    priceInfoElement.style.display = 'none';
    whatsappInfoElement.style.display = 'none';
    fileNameDisplay.style.display = 'none';
    copies = 1;
    if (copiesInput) copiesInput.value = 1;
}

// دالة جلب الطلبات
async function loadUserOrders() {
    const phone = document.getElementById('phone').value.trim();
    if (!phone || !validatePhone(phone)) return;
    
    try {
        const response = await fetch(`/api/orders/phone/${phone}`);
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                displayUserOrders(result.orders);
            }
        }
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

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
                <p><i class="fas fa-file"></i> <strong>الملف:</strong></p>
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

// إرسال النموذج
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const file = fileInput.files[0];

    if (!name || !phone || !file) {
        alert('❌ يرجى ملء جميع الحقول المطلوبة');
        return;
    }

    if (!validatePhone(phone)) {
        alert('❌ رقم الهاتف غير صحيح!');
        return;
    }

    savePhoneToStorage(phone);

    const submitBtn = form.querySelector('.submit-btn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
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
            alert(`✅ تم إرسال طلبك بنجاح!\n📦 رقم الطلب: ${result.orderId}`);
            document.getElementById('name').value = '';
            resetFileInfo();
            setTimeout(loadUserOrders, 1000);
        } else {
            throw new Error(result.message || 'خطأ في الإرسال');
        }

    } catch (error) {
        alert('❌ حدث خطأ: ' + error.message);
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});

// التهيئة الرئيسية
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 بدء تحميل النظام...');
    updatePrice();
    resetFileInfo();
    autoLoadUserOrders();
    initFileUploadSystem(); // ✅ هذا هو الحل الرئيسي
    console.log('✅ تم تحميل النظام بنجاح');
});

// تحديث تلقائي
setInterval(() => {
    loadUserOrders();
}, 60000);

// إضافة دالة لتحديث الطلبات وتسجيل الخروج (إذا كانت موجودة في واجهتك)
function refreshOrders() {
    loadUserOrders();
}

function logoutUser() {
    if (confirm('هل تريد تسجيل الخروج؟')) {
        clearPhoneFromStorage();
        document.getElementById('phone').value = '';
        document.getElementById('ordersTracker').style.display = 'none';
        resetFileInfo();
        alert('✅ تم تسجيل الخروج');
    }
}