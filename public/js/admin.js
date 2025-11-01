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

// عرض الطلبات في الجدول
function displayOrders() {
    if (orders.length === 0) {
        ordersContainer.innerHTML = `
            <div class="no-orders">
                <h3>لا توجد طلبات حالياً</h3>
                <p>سيتم عرض الطلبات هنا عندما يقوم العملاء بتقديم طلبات جديدة</p>
            </div>
        `;
        return;
    }

    const ordersHTML = `
        <table>
            <thead>
                <tr>
                    <th>رقم الطلب</th>
                    <th>الاسم</th>
                    <th>رقم الهاتف</th>
                    <th>الملف</th>
                    <th>المواصفات</th>
                    <th>السعر</th>
                    <th>وقت الطلب</th>
                    <th>الإجراءات</th>
                </tr>
            </thead>
            <tbody>
                ${orders.map(order => `
                    <tr>
                        <td>#${order.id}</td>
                        <td>${order.name}</td>
                        <td>${order.phone}</td>
                        <td>
                            <a href="/api/orders/download/${order.id}" class="file-link" target="_blank" download="${order.fileName}">
                                📄 ${order.fileName}
                            </a>
                        </td>                        <td>
                            ${order.paperSize} - ${order.colorType}
                            ${order.lamination ? ' - مع تسليك' : ''}
                            <br>
                            <small>${order.pageCount} صفحة</small>
                        </td>
                        <td>${order.totalPrice.toLocaleString()} ل.س</td>
                        <td>${formatDate(new Date(order.timestamp))}</td>
                        <td>
                            <button class="delete-btn" onclick="deleteOrder(${order.id})">
                                حذف
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    ordersContainer.innerHTML = ordersHTML;
}

// تحديث الإحصائيات
function updateStats() {
    const totalOrders = orders.length;
    const today = new Date().toDateString();
    const todayOrders = orders.filter(order => 
        new Date(order.timestamp).toDateString() === today
    ).length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    const pendingOrders = orders.length;

    totalOrdersElement.textContent = totalOrders;
    todayOrdersElement.textContent = todayOrders;
    totalRevenueElement.textContent = totalRevenue.toLocaleString();
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
    ordersContainer.innerHTML = '<div class="loading">جاري تحميل الطلبات...</div>';
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
});