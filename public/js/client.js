// تهيئة الأزرار التفاعلية
function initOptionButtons() {
    // أزرار حجم الورق
    document.querySelectorAll('.option-btn[data-value]').forEach(btn => {
        btn.addEventListener('click', function() {
            const value = this.getAttribute('data-value');
            const isPaperSize = this.closest('.spec-card').querySelector('h4').textContent.includes('حجم');
            
            // إزالة النشاط من جميع الأزرار في المجموعة
            this.parentElement.querySelectorAll('.option-btn').forEach(b => {
                b.classList.remove('active');
            });
            
            // إضافة النشاط للزر المحدد
            this.classList.add('active');
            
            // تحديث القيمة المخفية
            if (isPaperSize) {
                document.getElementById('paperSize').value = value;
                paperSize = value;
            } else {
                document.getElementById('colorType').value = value;
                colorType = value;
            }
            
            updatePrice();
        });
    });
}

// تحسين رفع الملف
function initFileUpload() {
    const fileUploadArea = document.getElementById('fileUploadArea');
    const fileInput = document.querySelector('.file-input');
    
    fileUploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadArea.classList.add('dragover');
    });
    
    fileUploadArea.addEventListener('dragleave', () => {
        fileUploadArea.classList.remove('dragover');
    });
    
    fileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadArea.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            const event = new Event('change', { bubbles: true });
            fileInput.dispatchEvent(event);
        }
    });
}

// في نهاية DOMContentLoaded، أضف:
document.addEventListener('DOMContentLoaded', () => {
    updatePrice();
    initOptionButtons();
    initFileUpload();
});







// متغيرات الأسعار
const PRICES = {
    A4: 100,
    A5: 50,
    LAMINATION: 3000
};

// عناصر DOM
const form = document.getElementById('printingForm');
const fileInput = document.getElementById('file');
const pageCountElement = document.getElementById('pageCount');
const pageInfoElement = document.getElementById('pageInfo');
const priceInfoElement = document.getElementById('priceInfo');
const whatsappInfoElement = document.getElementById('whatsappInfo');
const totalPriceElement = document.getElementById('totalPrice');

// متغيرات الحساب
let pageCount = 0;
let paperSize = 'A4';
let colorType = 'ملون';
let hasLamination = false;
let isPdfFile = false;

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
    const totalPrice = printingPrice + laminationPrice;
    // تحديث الواجهة
    pageCountElement.textContent = pageCount;
    totalPriceElement.textContent = totalPrice.toLocaleString();
    
    priceInfoElement.style.display = 'block';
    whatsappInfoElement.style.display = 'none';
}

// استماع لتغيير حجم الورق
document.querySelectorAll('input[name="paperSize"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        paperSize = e.target.value;
        updatePrice();
    });
});

// استماع لتغيير نوع الطباعة
document.querySelectorAll('input[name="colorType"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        colorType = e.target.value;
        updatePrice();
    });
});

// استماع للتسليك
document.getElementById('lamination').addEventListener('change', (e) => {
    hasLamination = e.target.checked;
    updatePrice();
});

// دالة لحساب صفحات PDF
async function calculatePdfPages(file) {
    try {
        const fileURL = URL.createObjectURL(file);
        const pdf = await pdfjsLib.getDocument(fileURL).promise;
        const numPages = pdf.numPages;
        URL.revokeObjectURL(fileURL);
        return numPages;
    } catch (error) {
        console.error('Error calculating PDF pages:', error);
        throw new Error('لا يمكن قراءة ملف PDF');
    }
}

// معالجة رفع الملف
// معالجة رفع الملف - النسخة المحسنة
fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        // التحقق من حجم الملف (40MB كحد أقصى)
        if (file.size > 40 * 1024 * 1024) {
            alert('❌ حجم الملف كبير جداً! الحد الأقصى 40MB');
            fileInput.value = '';
            resetFileInfo();
            hideFileName();
            return;
        }

        // عرض اسم الملف المختار
        showFileName(file.name);
        
        const fileExt = file.name.split('.').pop().toLowerCase();
        
        try {
            if (fileExt === 'pdf') {
                // حساب صفحات PDF بدقة
                const fileURL = URL.createObjectURL(file);
                const pdf = await pdfjsLib.getDocument(fileURL).promise;
                pageCount = pdf.numPages;
                URL.revokeObjectURL(fileURL);
                isPdfFile = true;
                pageInfoElement.textContent = `عدد الصفحات: ${pageCount}`;
                updatePrice();
                
                alert(`✅ تم تحميل ملف PDF\nعدد الصفحات: ${pageCount}`);
            } else {
                // ملفات غير PDF
                isPdfFile = false;
                pageCount = 0;
                pageInfoElement.textContent = 'نوع الملف: ' + getFileTypeName(fileExt);
                updatePrice();
                
                alert(`✅ تم تحميل الملف\nسيتم إرسال السعر عبر واتساب بعد مراجعة الملف`);
            }
        } catch (error) {
            console.error('Error processing file:', error);
            alert('❌ حدث خطأ في معالجة الملف: ' + error.message);
            resetFileInfo();
            hideFileName();
        }
    }
});

// دالات مساعدة جديدة
function showFileName(fileName) {
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const selectedFileName = document.getElementById('selectedFileName');
    
    selectedFileName.textContent = fileName;
    fileNameDisplay.style.display = 'flex';
}

function hideFileName() {
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    fileNameDisplay.style.display = 'none';
}

// في دالة resetFileInfo، أضف:
function resetFileInfo() {
    pageCount = 0;
    isPdfFile = false;
    pageInfoElement.textContent = 'عدد الصفحات: --';
    priceInfoElement.style.display = 'none';
    whatsappInfoElement.style.display = 'none';
    hideFileName(); // إخفاء عرض اسم الملف
}
// تحسين تجربة السحب والإفلات
function initFileUpload() {
    const fileUploadArea = document.getElementById('fileUploadArea');
    const fileInput = document.querySelector('.file-input');
    
    // إزالة النقر المزدوج - لم نعد نحتاجه
    // لأن الـ label الآن يغطي الـ input مباشرة
    
    // أحداث السحب والإفلات تبقى كما هي
    fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadArea.classList.add('dragover');
    });
    
    fileUploadArea.addEventListener('dragleave', () => {
        fileUploadArea.classList.remove('dragover');
    });
    
    fileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadArea.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            const event = new Event('change', { bubbles: true });
            fileInput.dispatchEvent(event);
        }
    });
}

// في نهاية DOMContentLoaded، تأكد من استدعاء initFileUpload
document.addEventListener('DOMContentLoaded', () => {
    updatePrice();
    initOptionButtons();
    initFileUpload();
    hideFileName(); // إخفاء عرض اسم الملف في البداية
});
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
}

// معالجة إرسال النموذج
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // التحقق من الحقول المطلوبة
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const file = fileInput.files[0];

    if (!name || !phone || !file) {
        alert('❌ يرجى ملء جميع الحقول المطلوبة');
        return;
    }

    // إظهار تحميل
    const submitBtn = form.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'جاري إرسال الطلب...';
    submitBtn.disabled = true;

    try {
        // إنشاء FormData لإرسال البيانات
        const formData = new FormData();
        formData.append('name', name);
        formData.append('phone', phone);
        formData.append('file', file);
        formData.append('paperSize', paperSize);
        formData.append('colorType', colorType);
        formData.append('lamination', hasLamination);
        formData.append('pageCount', pageCount);
        formData.append('isPdf', isPdfFile);
        
        // إرسال البيانات للسيرفر
        const response = await fetch('/api/orders/upload', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            if (isPdfFile) {
                alert(`✅ تم إرسال طلبك بنجاح!\nرقم طلبك: ${result.orderId}\nعدد الصفحات: ${pageCount}\nالسعر النهائي: ${totalPriceElement.textContent} ليرة سورية`);
            } else {
                alert(`✅ تم إرسال طلبك بنجاح!\nرقم طلبك: ${result.orderId}\nسيتم الاتصال بك على واتساب خلال دقائق لتأكيد السعر`);
            }
            
            form.reset();
            resetFileInfo();
        } else {
            throw new Error(result.message || 'حدث خطأ أثناء الإرسال');
        }

    } catch (error) {
        console.error('Error:', error);
        alert('❌ حدث خطأ أثناء إرسال الطلب: ' + error.message);
    } finally {
        // إعادة زر الإرسال لحالته الطبيعية
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// تحميل أولي
document.addEventListener('DOMContentLoaded', () => {
    resetFileInfo();
});