const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();

// middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Routes
const ordersRouter = require('./routes/orders');
const adminRouter = require('./routes/admin');

app.use('/api/orders', ordersRouter);
app.use('/api/admin', adminRouter);

// مسارات الصفحات
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin-login.html'));
});

app.get('/admin/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin-dashboard.html'));
});

// مسار تحميل الملفات
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// معالجة الأخطاء
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            message: 'حجم الملف كبير جداً. الحد الأقصى 40MB'
        });
    }
    
    if (err.message.includes('نوع الملف غير مدعوم')) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    res.status(500).json({
        success: false,
        message: 'حدث خطأ في الخادم'
    });
});

// الصفحة غير موجودة
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'الصفحة غير موجودة'
    });
});

module.exports = app;