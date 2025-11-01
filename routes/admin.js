const express = require('express');
const router = express.Router();

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

module.exports = router;