const app = require('./app');
const fs = require('fs');
const path = require('path');

// إنشاء مجلدات ضرورية
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const PORT = process.env.PORT || 4000;

// استيراد وتفعيل نظام التنظيف إذا كان موجوداً
try {
    const FileCleanup = require('./utils/cleanup');
    const cleanup = new FileCleanup();
    cleanup.startAutoCleanup();
    
    // تنظيف أولي عند التشغيل
    setTimeout(() => {
        cleanup.cleanupOldFiles();
        cleanup.checkTotalSize();
    }, 5000);
    
    console.log('🔄 نظام التنظيف التلقائي مفعل');
} catch (error) {
    console.log('⚠️ نظام التنظيف غير متوفر، الملفات قد تتراكم');
}

const server = app.listen(PORT, () => {
    console.log(`✅ السيرفر شغال على البورت ${PORT}`);
    console.log(`🌐 http://localhost:${PORT}`);
    console.log(`🔐 لوحة التحكم: http://localhost:${PORT}/admin`);
});

module.exports = server;