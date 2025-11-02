const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { storage } = require('../config/cloudinary');
const router = express.Router();

// تخزين مؤقت للطلبات
let orders = [];
let orderIdCounter = 1;

// استخدام التخزين المحلي
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 40 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('نوع الملف غير مدعوم. المسموح: ' + allowedTypes.join(', ')));
    }
  }
});

// مسار رفع الملف واستقبال الطلب
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { name, phone, paperSize, colorType, lamination, pageCount, isPdf } = req.body;
    
    if (!name || !phone || !req.file) {
      return res.status(400).json({
        success: false,
        message: 'جميع الحقول مطلوبة'
      });
    }

    const fileExt = path.extname(req.file.originalname).toLowerCase();
    const isPdfFile = isPdf === 'true';
    const calculatedPageCount = parseInt(pageCount) || 0;

    // حساب السعر فقط لملفات PDF
    let totalPrice = 0;
    if (isPdfFile && calculatedPageCount > 0) {
      const pricePerSide = paperSize === 'A4' ? 100 : 50;
      totalPrice = (calculatedPageCount * 2 * pricePerSide) + (lamination === 'true' ? 3000 : 0);
    }

    const newOrder = {
      id: orderIdCounter++,
      name,
      phone,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      fileType: fileExt,
      paperSize,
      colorType,
      lamination: lamination === 'true',
      pageCount: calculatedPageCount,
      isPdf: isPdfFile,
      totalPrice: totalPrice,
      needsWhatsappPrice: !isPdfFile,
      timestamp: new Date().getTime(),
      status: 'pending'
    };

    orders.push(newOrder);
    
    console.log('✅ تم حفظ الطلب:', {
      id: newOrder.id,
      name: newOrder.name,
      type: newOrder.fileType,
      isPdf: newOrder.isPdf,
      pages: newOrder.pageCount,
      needsWhatsapp: newOrder.needsWhatsappPrice
    });
    
    res.json({ 
      success: true, 
      message: 'تم استلام الطلب بنجاح',
      orderId: newOrder.id
    });
  } catch (error) {
    console.error('❌ Error in upload:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ أثناء معالجة الطلب: ' + error.message 
    });
  }
});

// مسار الحصول على جميع الطلبات
router.get('/', (req, res) => {
  try {
    const sortedOrders = orders.sort((a, b) => b.timestamp - a.timestamp);
    res.json({ 
      success: true, 
      orders: sortedOrders
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في جلب الطلبات' 
    });
  }
});

// مسار حذف طلب
// تحديث دالة حذف الطلب
router.delete('/:id', async (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        const orderIndex = orders.findIndex(order => order.id === orderId);
        
        if (orderIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                message: 'الطلب غير موجود' 
            });
        }

        const deletedOrder = orders.splice(orderIndex, 1)[0];
        
        // حذف الملف محلياً مع معالجة الأخطاء
        if (deletedOrder.filePath && fs.existsSync(deletedOrder.filePath)) {
            try {
                fs.unlinkSync(deletedOrder.filePath);
                console.log(`🗑️ تم حذف الملف: ${deletedOrder.fileName}`);
            } catch (fileError) {
                console.error('❌ خطأ في حذف الملف:', fileError);
                // لا نوقف العملية إذا فشل حذف الملف
            }
        }
        
        res.json({ 
            success: true, 
            message: 'تم حذف الطلب بنجاح' 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'حدث خطأ أثناء حذف الطلب' 
        });
    }
});
// مسار تحميل الملف
router.get('/download/:id', (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const order = orders.find(order => order.id === orderId);
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'الطلب غير موجود' 
      });
    }

    if (!order.filePath || !fs.existsSync(order.filePath)) {
      return res.status(404).json({ 
        success: false, 
        message: 'الملف غير موجود' 
      });
    }

    res.download(order.filePath, order.fileName);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في تحميل الملف' 
    });
  }
});

module.exports = router;