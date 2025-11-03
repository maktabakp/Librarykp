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
    fileSize: 60 * 1024 * 1024 // 60MB
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
    const { name, phone, paperSize, colorType, lamination, clientPageCount, copies } = req.body;
    
    if (!name || !phone || !req.file) {
      return res.status(400).json({
        success: false,
        message: 'جميع الحقول مطلوبة'
      });
    }

    // التحقق من رقم الهاتف
    const phoneRegex = /^09\d{8}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'رقم الهاتف يجب أن يبدأ بـ 09 ويتكون من 10 أرقام'
      });
    }

    // التحقق من عدد النسخ
    const numCopies = parseInt(copies) || 1;
    if (numCopies < 1 || numCopies > 100) {
      return res.status(400).json({
        success: false,
        message: 'عدد النسخ يجب أن يكون بين 1 و 100'
      });
    }

    // حساب عدد الصفحات والسعر - باستخدام العدد الدقيق من العميل
    let pageCount = 0;
    let totalPrice = 0;
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    const isPdf = fileExt === '.pdf';

    if (isPdf) {
      // استخدام عدد الصفحات الدقيق من العميل
      pageCount = parseInt(clientPageCount) || 1;
      
      const pricePerSide = paperSize === 'A4' ? 100 : 50;
      const pricePerCopy = (pageCount * 2 * pricePerSide) + (lamination === 'true' ? 3000 : 0);
      totalPrice = pricePerCopy * numCopies;
      
      console.log(`💰 حساب السعر: ${pageCount} صفحة × 2 وجه × ${pricePerSide} ليرة`);
      console.log(`   ${lamination === 'true' ? '+ 3000 ليرة للتسليك' : ''}`);
      console.log(`   = ${pricePerCopy.toLocaleString()} ليرة للنسخة × ${numCopies} نسخة`);
      console.log(`   = ${totalPrice.toLocaleString()} ليرة سورية`);
    } else {
      console.log(`📄 نوع الملف: ${fileExt} - يحتاج تحديد سعر يدوي`);
    }

    const newOrder = {
      id: orderIdCounter++,
      name,
      phone,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      paperSize: paperSize || 'A4',
      colorType: colorType || 'ملون',
      lamination: lamination === 'true',
      pageCount: pageCount,
      totalPrice: totalPrice,
      isPdf: isPdf,
      copies: numCopies,
      status: 'printing',
      timestamp: new Date().getTime(),
      clientPageCount: pageCount
    };

    orders.push(newOrder);
    
    // تسجيل تفاصيل الطلب
    console.log(`\n🆕 طلب جديد #${newOrder.id}`);
    console.log(`👤 العميل: ${name} - ${phone}`);
    console.log(`📁 الملف: ${newOrder.fileName} (${(newOrder.fileSize / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`⚙️ المواصفات: ${newOrder.paperSize} - ${newOrder.colorType} ${newOrder.lamination ? '- مع التسليك' : ''}`);
    console.log(`📋 النسخ: ${numCopies} نسخة`);
    
    if (isPdf) {
      console.log(`📊 الصفحات: ${pageCount} صفحة`);
      console.log(`💰 السعر النهائي: ${totalPrice.toLocaleString()} ليرة سورية`);
    } else {
      console.log(`💡 نوع الملف: ${fileExt.toUpperCase()} - سيتم تحديد السعر يدوياً`);
    }
    console.log(`⏰ الوقت: ${new Date().toLocaleString('ar-EG')}`);
    console.log(`────────────────────────────────────────`);
    
    res.json({ 
      success: true, 
      message: 'تم استلام الطلب بنجاح',
      orderId: newOrder.id,
      pageCount: pageCount,
      totalPrice: totalPrice,
      copies: numCopies
    });
  } catch (error) {
    console.error('❌ خطأ في معالجة الطلب:', error);
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
    
    console.log(`📊 جلب ${sortedOrders.length} طلب`);
    
    res.json({ 
      success: true, 
      orders: sortedOrders
    });
  } catch (error) {
    console.error('❌ خطأ في جلب الطلبات:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في جلب الطلبات' 
    });
  }
});

// مسار جلب طلبات رقم هاتف معين
router.get('/phone/:phone', (req, res) => {
    try {
        const phone = req.params.phone;
        const userOrders = orders
            .filter(order => order.phone === phone)
            .sort((a, b) => b.timestamp - a.timestamp);
        
        console.log(`📞 جلب طلبات الرقم: ${phone} (${userOrders.length} طلب)`);
        
        res.json({ 
            success: true, 
            orders: userOrders 
        });
    } catch (error) {
        console.error('❌ خطأ في جلب طلبات الهاتف:', error);
        res.status(500).json({ 
            success: false, 
            message: 'حدث خطأ في جلب الطلبات' 
        });
    }
});

// مسار تحديث حالة الطلب
router.patch('/:id/status', (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const { status } = req.body;
    
    const order = orders.find(order => order.id === orderId);
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'الطلب غير موجود' 
      });
    }

    const oldStatus = order.status;
    order.status = status;
    
    console.log(`🔄 تحديث حالة الطلب #${orderId}`);
    console.log(`   من: ${oldStatus} → إلى: ${status}`);
    console.log(`   العميل: ${order.name} - ${order.phone}`);
    
    res.json({ 
      success: true, 
      message: 'تم تحديث حالة الطلب',
      order: {
        id: order.id,
        status: order.status,
        name: order.name,
        phone: order.phone
      }
    });
  } catch (error) {
    console.error('❌ خطأ في تحديث الحالة:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في تحديث الحالة' 
    });
  }
});

// مسار حذف طلب
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
      console.log(`🗑️ تم حذف ملف الطلب #${orderId}: ${deletedOrder.fileName}`);
    }
    
    console.log(`🗑️ تم حذف الطلب #${orderId}`);
    console.log(`   العميل: ${deletedOrder.name} - ${deletedOrder.phone}`);
    console.log(`   الملف: ${deletedOrder.fileName}`);
    
    res.json({ 
      success: true, 
      message: 'تم حذف الطلب بنجاح',
      deletedOrder: {
        id: deletedOrder.id,
        name: deletedOrder.name,
        fileName: deletedOrder.fileName
      }
    });
  } catch (error) {
    console.error('❌ خطأ في حذف الطلب:', error);
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

    console.log(`📥 تحميل ملف الطلب #${orderId}`);
    console.log(`   الملف: ${order.fileName}`);
    console.log(`   العميل: ${order.name} - ${order.phone}`);
    console.log(`   الوقت: ${new Date().toLocaleString('ar-EG')}`);
    
    res.download(order.filePath, order.fileName);
  } catch (error) {
    console.error('❌ خطأ في تحميل الملف:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في تحميل الملف' 
    });
  }
});

// مسار الحصول على إحصائيات الطلبات
router.get('/stats', (req, res) => {
  try {
    const totalOrders = orders.length;
    const today = new Date().toDateString();
    const todayOrders = orders.filter(order => 
        new Date(order.timestamp).toDateString() === today
    ).length;
    
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    const pendingOrders = orders.filter(order => order.status === 'printing').length;
    const readyOrders = orders.filter(order => order.status === 'ready').length;

    const stats = {
      totalOrders,
      todayOrders,
      totalRevenue,
      pendingOrders,
      readyOrders,
      averageOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0
    };

    console.log(`📈 إحصائيات النظام:`);
    console.log(`   إجمالي الطلبات: ${totalOrders}`);
    console.log(`   طلبات اليوم: ${todayOrders}`);
    console.log(`   إجمالي الإيرادات: ${totalRevenue.toLocaleString()} ليرة`);
    console.log(`   الطلبات قيد التنفيذ: ${pendingOrders}`);
    console.log(`   الطلبات الجاهزة: ${readyOrders}`);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('❌ خطأ في جلب الإحصائيات:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب الإحصائيات'
    });
  }
});

// مسار البحث في الطلبات
router.get('/search/:query', (req, res) => {
  try {
    const query = req.params.query.toLowerCase();
    const searchResults = orders.filter(order => 
      order.name.toLowerCase().includes(query) ||
      order.phone.includes(query) ||
      order.fileName.toLowerCase().includes(query) ||
      order.id.toString().includes(query)
    );

    console.log(`🔍 بحث: "${query}" - ${searchResults.length} نتيجة`);

    res.json({
      success: true,
      results: searchResults,
      count: searchResults.length
    });
  } catch (error) {
    console.error('❌ خطأ في البحث:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في البحث'
    });
  }
});

module.exports = router;