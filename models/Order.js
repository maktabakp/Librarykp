// نموذج بيانات الطلب (للتوسع المستقبلي)

class Order {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.phone = data.phone;
        this.fileName = data.fileName;
        this.filePath = data.filePath;
        this.fileSize = data.fileSize;
        this.paperSize = data.paperSize;
        this.colorType = data.colorType;
        this.lamination = data.lamination;
        this.pageCount = data.pageCount;
        this.totalPrice = data.totalPrice;
        this.timestamp = data.timestamp;
        this.status = data.status || 'pending';
    }

    // التحقق من صحة البيانات
    validate() {
        const errors = [];

        if (!this.name || this.name.trim().length < 2) {
            errors.push('الاسم يجب أن يكون至少 2 أحرف');
        }

        if (!this.phone || this.phone.trim().length < 7) {
            errors.push('رقم الهاتف غير صالح');
        }

        if (!this.fileName) {
            errors.push('الملف مطلوب');
        }

        if (!this.paperSize || !['A4', 'A5'].includes(this.paperSize)) {
            errors.push('حجم الورق غير صالح');
        }

        if (this.pageCount < 1 || this.pageCount > 1000) {
            errors.push('عدد الصفحات غير صالح');
        }

        if (this.totalPrice < 0) {
            errors.push('السعر غير صالح');
        }

        return errors;
    }

    // إرجاع البيانات بشكل منظم
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            phone: this.phone,
            fileName: this.fileName,
            fileSize: this.fileSize,
            paperSize: this.paperSize,
            colorType: this.colorType,
            lamination: this.lamination,
            pageCount: this.pageCount,
            totalPrice: this.totalPrice,
            timestamp: this.timestamp,
            status: this.status,
            formattedTime: this.getFormattedTime()
        };
    }

    // تنسيق الوقت
    getFormattedTime() {
        return new Date(this.timestamp).toLocaleString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // تحديث حالة الطلب
    updateStatus(newStatus) {
        const allowedStatuses = ['pending', 'processing', 'completed', 'cancelled'];
        if (allowedStatuses.includes(newStatus)) {
            this.status = newStatus;
            return true;
        }
        return false;
    }
}

module.exports = Order;