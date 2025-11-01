const app = require('./app');
const fs = require('fs');
const path = require('path');

// إنشاء مجلد uploads إذا لم يكن موجوداً
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`✅ السيرفر شغال على البورت ${PORT}`);
    console.log(`🌐 http://localhost:${PORT}`);
    console.log(`🔐 لوحة التحكم: http://localhost:${PORT}/admin`);
});