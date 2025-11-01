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
    const { name, phone, paperSize, colorType, lamination, pageCount, totalPrice } = req.body;
    
    if (!name || !phone || !req.file) {
      return res.status(400).json({
        success: false,
        message: 'جميع الحقول مطلوبة'
      });
    }

    const newOrder = {
      id: orderIdCounter++,
      name,
      phone,
      fileName: req.file.originalname,
      filePath: req.file.path, // المسار المحلي
      fileSize: req.file.size,
      paperSize,
      colorType,
      lamination: lamination === 'true',
      pageCount: parseInt(pageCount),
      totalPrice: parseInt(totalPrice),
      timestamp: new Date().getTime(),
      status: 'pending'
    };

    orders.push(newOrder);
    
    res.json({ 
      success: true, 
      message: 'تم استلام الطلب بنجاح',
      orderId: newOrder.id
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ أثناء معالجة الطلب: ' + error.message 
    });
  }
});

// مسار تحميل الملف - التخزين المحلي
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

    // تحميل الملف مباشرة من المسار المحلي
    res.download(order.filePath, order.fileName);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في تحميل الملف' 
    });
  }
});

// باقي الكود يبقى كما هو...
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
    
    // حذف الملف محلياً
    if (deletedOrder.filePath && fs.existsSync(deletedOrder.filePath)) {
      fs.unlinkSync(deletedOrder.filePath);
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

module.exports = router;