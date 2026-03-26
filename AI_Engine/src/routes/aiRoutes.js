const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/authMiddleware');
const aiController = require('../controllers/aiController');

const router = express.Router();

// Áp dụng Auth Middleware cho tất cả các tính năng AI bên dưới
router.use(authMiddleware);

// Cấu hình upload file tạm
const uploadDir = path.join(__dirname, '../../uploads/');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
    dest: uploadDir
});

// Route: Phân tích hợp đồng (Single file)
router.post('/analyze-contract', upload.single('file'), aiController.analyzeContract);

// Route: Lập kế hoạch AI (Multiple files)
router.post('/generate-planning', upload.array('files', 10), aiController.generatePlanning);

// Route: Trợ lý Biểu mẫu (Chat-based)
router.post('/generate-form', aiController.generateForm);

module.exports = router;