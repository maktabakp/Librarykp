const fs = require('fs');
const path = require('path');

class FileCleanup {
    constructor() {
        this.uploadsDir = path.join(__dirname, '../uploads');
        this.maxFileAge = 7 * 24 * 60 * 60 * 1000; // أسبوع واحد
        this.maxTotalSize = 2 * 1024 * 1024 * 1024; // 2GB كحد أقصى
    }

    // تنظيف الملفات القديمة
    async cleanupOldFiles() {
        try {
            if (!fs.existsSync(this.uploadsDir)) {
                console.log('📁 مجلد uploads غير موجود');
                return { deletedCount: 0, freedSpace: 0 };
            }

            const files = fs.readdirSync(this.uploadsDir);
            const now = Date.now();
            let deletedCount = 0;
            let freedSpace = 0;

            for (const file of files) {
                const filePath = path.join(this.uploadsDir, file);
                try {
                    const stats = fs.statSync(filePath);
                    
                    // حذف الملفات الأقدم من أسبوع
                    if (now - stats.mtimeMs > this.maxFileAge) {
                        const fileSize = stats.size;
                        fs.unlinkSync(filePath);
                        deletedCount++;
                        freedSpace += fileSize;
                        console.log(`🗑️ تم حذف الملف القديم: ${file}`);
                    }
                } catch (error) {
                    console.error(`❌ خطأ في معالجة الملف ${file}:`, error.message);
                }
            }

            if (deletedCount > 0) {
                console.log(`✅ تم حذف ${deletedCount} ملف وتحرير ${(freedSpace / 1024 / 1024).toFixed(2)} MB`);
            }

            return { deletedCount, freedSpace };
        } catch (error) {
            console.error('❌ خطأ في تنظيف الملفات:', error);
            return { deletedCount: 0, freedSpace: 0 };
        }
    }

    // التحقق من المساحة الإجمالية
    async checkTotalSize() {
        try {
            if (!fs.existsSync(this.uploadsDir)) {
                return 0;
            }

            const files = fs.readdirSync(this.uploadsDir);
            let totalSize = 0;

            for (const file of files) {
                const filePath = path.join(this.uploadsDir, file);
                try {
                    const stats = fs.statSync(filePath);
                    totalSize += stats.size;
                } catch (error) {
                    console.error(`❌ خطأ في فحص الملف ${file}:`, error.message);
                }
            }

            const sizeInGB = totalSize / 1024 / 1024 / 1024;
            console.log(`💾 المساحة المستخدمة: ${sizeInGB.toFixed(2)} GB`);

            // إذا تجاوزت 2GB، احذف الملفات الأقدم
            if (totalSize > this.maxTotalSize) {
                console.log('⚠️ تجاوز الحد المسموح، جاري التنظيف...');
                await this.cleanupOldFiles();
            }

            return totalSize;
        } catch (error) {
            console.error('❌ خطأ في فحص المساحة:', error);
            return 0;
        }
    }

    // بدء التنظيف التلقائي
    startAutoCleanup() {
        // تنظيف كل 6 ساعات
        setInterval(() => {
            this.cleanupOldFiles();
            this.checkTotalSize();
        }, 6 * 60 * 60 * 1000);

        // فحص المساحة كل ساعة
        setInterval(() => {
            this.checkTotalSize();
        }, 60 * 60 * 1000);

        console.log('🔄 نظام التنظيف التلقائي مفعل');
    }
}

module.exports = FileCleanup;