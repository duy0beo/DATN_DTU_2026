const express = require('express');
const router = express.Router();

// Import middleware
const authMiddleware = require('../middleware/authMiddleware');

// Import các controller
const authController = require('../controllers/authController');
const historyController = require('../controllers/historyController');
const documentController = require('../controllers/documentController');

// --- AUTH ROUTES (Công khai) ---
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/reset-password', authController.resetPassword);

/**
 * --- TẤT CẢ CÁC ROUTE BÊN DƯỚI ĐỀU ĐƯỢC BẢO VỆ BỞI JWT ---
 */
router.use(authMiddleware);

// --- HISTORY ROUTES (Lịch sử phân tích) ---
router.post('/history/save', historyController.saveAnalysis);
router.get('/history/:userId', historyController.getHistory);
router.get('/history/detail/:id', historyController.getDetail);
router.delete('/history/delete/:id', historyController.deleteHistory);

// --- DOCUMENT ROUTES (Văn bản pháp luật) ---
router.get('/documents', documentController.getAllDocuments);
router.get('/documents/:id', documentController.getDocumentDetail);

module.exports = router;