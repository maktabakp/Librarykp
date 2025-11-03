// بيانات الطلبات
let orders = [];

// عناصر DOM
const ordersContainer = document.getElementById('ordersContainer');
const totalOrdersElement = document.getElementById('totalOrders');
const todayOrdersElement = document.getElementById('todayOrders');
const totalRevenueElement = document.getElementById('totalRevenue');
const pendingOrdersElement = document.getElementById('pendingOrders');
const logoutBtn = document.getElementById('logoutBtn');

// تحميل الطلبات من السيرفر
async function loadOrders() {
    try {
        showLoading();
        
        const response = await fetch('/api/orders');
        const result = await response.json();
        
        if (response.ok) {
            orders = result.orders || [];
            displayOrders();
            updateStats();
        } else {
            throw new Error(result.message || 'فشل في تحميل الطلبات');
        }
    } catch (error) {
        showError('فشل في تحميل الطلبات: ' + error.message);
    }
}

// عرض الطلبات في لوحة التحكم
function displayOrders() {
    if (!orders || orders.length === 0) {
        ordersContainer.innerHTML = `
            <div class="no-orders">
                <i class="fas fa-inbox"></i>
                <h3>لا توجد طلبات حالياً</h3>
                <p>سيتم عرض الطلبات هنا عندما يقوم العملاء بتقديم طلبات جديدة</p>
            </div>
        `;
        return;
    }

    const ordersHTML = `
        <div class="orders-list">
            ${orders.map(order => `
                <div class="order-item">
                    <div class="order-header">
                        <div class="order-id">#${order.id}</div>
                        <div class="order-date">${formatDate(new Date(order.timestamp))}</div>
                    </div>
                    
                    <div class="customer-info">
                        <div class="customer-name">
                            <i class="fas fa-user"></i>
                            ${order.name}
                        </div>
                        <div class="customer-phone">
                            <i class="fas fa-phone"></i>
                            ${order.phone}
                        </div>
                    </div>
                    
                    <div class="file-info">
                        <a href="/api/orders/download/${order.id}" class="file-link" target="_blank">
                            <i class="fas fa-file-download"></i>
                            تنزيل الملف 
                        </a>
                        <div class="file-size" style="font-size: 0.8em; color: #666; margin-top: 5px;">
                            <i class="fas fa-hdd"></i>
                            الحجم: ${(order.fileSize / 1024 / 1024).toFixed(2)} MB
                        </div>
                    </div>
                    
                    <div class="specs-info">
                        <div class="specs-grid">
                            <div class="spec-item">
                                <i class="fas fa-expand-alt"></i>
                                <span>${order.paperSize}</span>
                            </div>
                            <div class="spec-item">
                                <i class="fas fa-palette"></i>
                                <span>${order.colorType}</span>
                            </div>
                            <div class="spec-item">
                                <i class="fas fa-copy"></i>
                                <span>${order.copies || 1} نسخة</span>
                            </div>
                            ${order.lamination ? `
                                <div class="spec-item">
                                    <i class="fas fa-shield-alt"></i>
                                    <span>مع التسليك</span>
                                </div>
                            ` : ''}
                            <div class="spec-item">
                                <i class="fas fa-file"></i>
                                <span>${order.pageCount || 0} صفحة</span>
                            </div>
                            <div class="spec-item">
                                <i class="fas fa-file-alt"></i>
                                <span>${order.isPdf ? 'PDF' : getFileType(order.fileName)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="order-footer">
                        <div class="price-info">
                            ${order.isPdf ? 
                                `${order.totalPrice ? order.totalPrice.toLocaleString() : '0'} ل.س` : 
                                `<div class="whatsapp-notice">
                                    <i class="fab fa-whatsapp"></i>
                                    يحتاج تحديد سعر
                                </div>`
                            }
                            ${order.copies > 1 ? `
                                <div style="font-size: 0.8em; color: #666; margin-top: 5px;">
                                    (${order.copies} نسخة × ${order.totalPrice / order.copies} ل.س للنسخة)
                                </div>
                            ` : ''}
                        </div>
                        
                        <div class="status-actions">
                            <span class="status-badge ${order.status === 'ready' ? 'status-ready' : 'status-printing'}">
                                <i class="fas ${order.status === 'ready' ? 'fa-check' : 'fa-spinner'}"></i>
                                ${order.status === 'ready' ? 'جاهز' : 'قيد الطباعة'}
                            </span>
                            <button class="status-btn" onclick="updateOrderStatus(${order.id}, '${order.status === 'ready' ? 'printing' : 'ready'}')">
                                <i class="fas ${order.status === 'ready' ? 'fa-undo' : 'fa-check'}"></i>
                                ${order.status === 'ready' ? 'إعادة للطباعة' : 'تم التجهيز'}
                            </button>
                            <button class="delete-btn" onclick="deleteOrder(${order.id})">
                                <i class="fas fa-trash"></i>
                                حذف
                            </button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    ordersContainer.innerHTML = ordersHTML;
}

// دالة مساعدة للحصول على نوع الملف
function getFileType(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
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

// دالة تحديث حالة الطلب
async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await fetch(`/api/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
            showMessage('تم تحديث حالة الطلب بنجاح');
            loadOrders();
        } else {
            throw new Error('فشل في تحديث الحالة');
        }
    } catch (error) {
        showError('فشل في تحديث الحالة: ' + error.message);
    }
}

// تحديث الإحصائيات
function updateStats() {
    const totalOrders = orders.length;
    const today = new Date().toDateString();
    const todayOrders = orders.filter(order => 
        new Date(order.timestamp).toDateString() === today
    ).length;
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    const pendingOrders = orders.filter(order => order.status === 'printing').length;

    totalOrdersElement.textContent = totalOrders;
    todayOrdersElement.textContent = todayOrders;
    totalRevenueElement.textContent = totalRevenue.toLocaleString() + ' ل.س';
    pendingOrdersElement.textContent = pendingOrders;
}

// حذف طلب
async function deleteOrder(orderId) {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
        return;
    }

    try {
        const response = await fetch(`/api/orders/${orderId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            orders = orders.filter(order => order.id !== orderId);
            displayOrders();
            updateStats();
            showMessage('تم حذف الطلب بنجاح');
        } else {
            throw new Error('فشل في حذف الطلب');
        }
    } catch (error) {
        showError('فشل في حذف الطلب: ' + error.message);
    }
}

// تسجيل الخروج
logoutBtn.addEventListener('click', () => {
    if (confirm('هل تريد تسجيل الخروج؟')) {
        window.location.href = '/admin';
    }
});

// وظائف المساعدة
function showLoading() {
    ordersContainer.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
            <div>جاري تحميل الطلبات...</div>
        </div>
    `;
}

function showError(message) {
    ordersContainer.innerHTML = `
        <div class="no-orders" style="color: #e74c3c;">
            <h3>❌ ${message}</h3>
            <button onclick="loadOrders()" style="
                background: #667eea;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                margin-top: 10px;
            ">إعادة المحاولة</button>
        </div>
    `;
}

function showMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #27ae60;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 1000;
        box-shadow: 0 3px 10px rgba(0,0,0,0.2);
    `;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);

    setTimeout(() => {
        document.body.removeChild(messageDiv);
    }, 3000);
}

function formatDate(date) {
    return new Intl.DateTimeFormat('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

// تحميل البيانات عند فتح الصفحة
document.addEventListener('DOMContentLoaded', () => {
    loadOrders();
    
    // تحديث تلقائي كل 30 ثانية
    setInterval(() => {
        loadOrders();
    }, 30000);
});