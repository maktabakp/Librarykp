const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router(); // هذا السطر كان ناقص!

// بيانات المستخدمين (في الإصدار النهائي رح نستخدم قاعدة بيانات)
const users = [
    {
        id: 1,
        username: 'admin',
        password: 'admin123', // في الإصدار النهائي رح نستخدم تشفير
        role: 'admin'
    }
];

// مسار تسجيل الدخول للإدارة
router.post('/login', (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'اسم المستخدم وكلمة المرور مطلوبان'
            });
        }

        const user = users.find(u => u.username === username && u.password === password);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'اسم المستخدم أو كلمة المرور غير صحيحة'
            });
        }

        // في الإصدار النهائي رح نستخدم JWT tokens
        res.json({ 
            success: true, 
            message: 'تم الدخول بنجاح',
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'حدث خطأ أثناء تسجيل الدخول' 
        });
    }
});

// مسار التحقق من صحة الجلسة
router.get('/verify', (req, res) => {
    // في الإصدار النهائي رح نتحقق من token
    res.json({ 
        success: true, 
        message: 'الجلسة صالحة' 
    });
});

// مسار تسجيل الخروج
router.post('/logout', (req, res) => {
    res.json({ 
        success: true, 
        message: 'تم تسجيل الخروج بنجاح' 
    });
});

// مسار تنظيف الملفات
router.post('/cleanup', (req, res) => {
    try {
        const uploadsDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadsDir)) {
            return res.json({
                success: true,
                message: 'لا توجد ملفات للتنظيف',
                deletedCount: 0
            });
        }

        const files = fs.readdirSync(uploadsDir);
        const now = Date.now();
        const weekAgo = 7 * 24 * 60 * 60 * 1000;
        let deletedCount = 0;

        files.forEach(file => {
            const filePath = path.join(uploadsDir, file);
            const stats = fs.statSync(filePath);
            
            if (now - stats.mtimeMs > weekAgo) {
                fs.unlinkSync(filePath);
                deletedCount++;
            }
        });

        res.json({
            success: true,
            message: `تم تنظيف الملفات بنجاح`,
            deletedCount: deletedCount
        });
    } catch (error) {
        console.error('❌ خطأ في التنظيف:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء التنظيف: ' + error.message
        });
    }
});

// مسار فحص المساحة
router.get('/storage', (req, res) => {
    try {
        const uploadsDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadsDir)) {
            return res.json({
                success: true,
                usedSpace: '0 MB',
                fileCount: 0
            });
        }

        const files = fs.readdirSync(uploadsDir);
        let totalSize = 0;

        files.forEach(file => {
            const filePath = path.join(uploadsDir, file);
            const stats = fs.statSync(filePath);
            totalSize += stats.size;
        });

        const sizeInMB = totalSize / 1024 / 1024;
        const sizeInGB = totalSize / 1024 / 1024 / 1024;

        res.json({
            success: true,
            usedSpace: sizeInGB >= 1 ? 
                `${sizeInGB.toFixed(2)} GB` : 
                `${sizeInMB.toFixed(2)} MB`,
            fileCount: files.length
        });
    } catch (error) {
        console.error('❌ خطأ في فحص المساحة:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في فحص المساحة'
        });
    }
});

module.exports = router;