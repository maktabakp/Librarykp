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
const sideCountElement = document.getElementById('sideCount');
const printingPriceElement = document.getElementById('printingPrice');
const laminationPriceElement = document.getElementById('laminationPrice');
const totalPriceElement = document.getElementById('totalPrice');

// متغيرات الحساب
let pageCount = 0;
let paperSize = 'A4';
let colorType = 'ملون';
let hasLamination = false;

// تحديث السعر عند تغيير الإعدادات
function updatePrice() {
    const pricePerSide = paperSize === 'A4' ? PRICES.A4 : PRICES.A5;
    const sides = pageCount * 2;
    const printingPrice = sides * pricePerSide;
    const laminationPrice = hasLamination ? PRICES.LAMINATION : 0;
    const totalPrice = printingPrice + laminationPrice;

    // تحديث الواجهة
    pageCountElement.textContent = pageCount;
    sideCountElement.textContent = sides;
    printingPriceElement.textContent = printingPrice.toLocaleString();
    laminationPriceElement.textContent = laminationPrice.toLocaleString();
    totalPriceElement.textContent = totalPrice.toLocaleString();
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

// معالجة رفع الملف
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        // التحقق من حجم الملف (40MB كحد أقصى)
        if (file.size > 40 * 1024 * 1024) {
            alert('❌ حجم الملف كبير جداً! الحد الأقصى 40MB');
            fileInput.value = '';
            pageCount = 0;
            updatePrice();
            return;
        }

        // محاكاة حساب عدد الصفحات (في الواقع، هذا يحتاج لمعالجة في السيرفر)
        // حالياً بنفترض عدد صفحات عشوائي بين 1-50 للمثال
        pageCount = Math.max(1, Math.min(50, Math.floor(file.size / 50000)));
        
        // في التطبيق الحقيقي، رح نرسل الملف للسيرفر لحساب الصفحات الفعلي
        updatePrice();
        
        // عرض اسم الملف
        alert(`✅ تم اختيار الملف: ${file.name}\nعدد الصفحات المقدر: ${pageCount}`);
    }
});

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

    if (pageCount === 0) {
        alert('❌ يرجى رفع ملف صالح');
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
        
        // حساب السعر النهائي
        const pricePerSide = paperSize === 'A4' ? PRICES.A4 : PRICES.A5;
        const totalPrice = (pageCount * 2 * pricePerSide) + (hasLamination ? PRICES.LAMINATION : 0);
        formData.append('totalPrice', totalPrice);

        // إرسال البيانات للسيرفر - التصحيح هنا
        const response = await fetch('/api/orders/upload', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            alert('✅ تم إرسال طلبك بنجاح! رقم طلبك: ' + (result.orderId || '#')); 
            form.reset();
            pageCount = 0;
            updatePrice();
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
    updatePrice();
});

// وظيفة مساعدة لعرض التواريخ بالعربية
function formatDate(date) {
    return new Intl.DateTimeFormat('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}