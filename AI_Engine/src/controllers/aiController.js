const { GoogleGenerativeAI } = require("@google/generative-ai");
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs');

// Cấu hình Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Dùng bản 2.5-flash và bật chế độ ép trả về JSON 100%
const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash", 
    generationConfig: { responseMimeType: "application/json" }
});

// ==========================================
// 1. PHÂN TÍCH HỢP ĐỒNG (CONTRACT ANALYSIS)
// ==========================================
exports.analyzeContract = async (req, res) => {
    let filePath = null;

    try {
        // 1. Kiểm tra xem có file gửi lên không
        if (!req.file) {
            return res.status(400).json({ error: "Vui lòng upload file hợp đồng!" });
        }

        filePath = req.file.path;
        const mimeType = req.file.mimetype;
        let contractText = "";

        // 2. Phân loại và Đọc file
        console.log(`🕵️‍♂️ Đang đọc file: ${req.file.originalname} (${mimeType})`);

        if (mimeType === 'application/pdf') {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdf(dataBuffer);
            contractText = data.text;
        } 
        else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') { 
            const result = await mammoth.extractRawText({ path: filePath });
            contractText = result.value;
        } 
        else {
            contractText = fs.readFileSync(filePath, 'utf-8');
        }

        if (!contractText || contractText.trim().length < 10) {
            return res.status(400).json({ error: "Không đọc được nội dung file hoặc file quá ngắn." });
        }

        // 3. Gửi cho Gemini phân tích (GIỮ NGUYÊN PROMPT GỐC CỦA BẠN)
        console.log("🤖 Đang gửi nội dung cho Gemini phân tích...");
        
        const prompt = `
        Bạn là một Luật sư AI chuyên nghiệp (LegAI). Hãy phân tích hợp đồng dưới đây và trả về kết quả dưới dạng JSON (chỉ JSON, không có markdown).
        
        Nội dung hợp đồng:
        """${contractText}"""

        Yêu cầu output JSON format:
        {
            "summary": "Tóm tắt ngắn gọn nội dung hợp đồng (2-3 câu)",
            "risk_score": (Số nguyên từ 0-100, càng cao càng an toàn),
            "risks": [
                {
                    "clause": "Trích dẫn điều khoản gốc gây rủi ro",
                    "issue": "Giải thích tại sao rủi ro theo luật Việt Nam",
                    "severity": "High" | "Medium" | "Low"
                }
            ],
            "recommendation": "Lời khuyên tổng quan của luật sư"
        }
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Parse thẳng vì API đã đảm bảo format JSON
        const analysisResult = JSON.parse(responseText);

        console.log("✅ Phân tích xong!");
        res.json(analysisResult);

    } catch (error) {
        console.error("❌ Lỗi phân tích:", error);
        res.status(500).json({ error: "Lỗi hệ thống khi phân tích hợp đồng. Chi tiết: " + error.message });
    } finally {
        // Luôn dọn rác ổ cứng dù thành công hay thất bại
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log("🧹 Đã dọn dẹp file tạm.");
        }
    }
};

// ==========================================
// 2. TÍNH NĂNG LẬP KẾ HOẠCH (AI PLANNING)
// ==========================================
exports.generatePlanning = async (req, res) => {
    let filePaths = [];

    try {
        const { rawText } = req.body;
        let combinedText = rawText || "";

        // 1. Phân loại và Đọc các file đính kèm (nếu có)
        if (req.files && req.files.length > 0) {
            console.log(`📂 Đang xử lý ${req.files.length} file đính kèm...`);
            
            for (const file of req.files) {
                const filePath = file.path;
                filePaths.push(filePath);
                const mimeType = file.mimetype;
                
                let fileText = "";
                if (mimeType === 'application/pdf') {
                    const dataBuffer = fs.readFileSync(filePath);
                    const data = await pdf(dataBuffer);
                    fileText = data.text;
                } 
                else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') { 
                    const result = await mammoth.extractRawText({ path: filePath });
                    fileText = result.value;
                } 
                else {
                    fileText = fs.readFileSync(filePath, 'utf-8');
                }
                
                combinedText += `\n\n--- NỘI DUNG TỪ FILE [${file.originalname}] ---\n${fileText}`;
            }
        }

        if (!combinedText || combinedText.trim().length < 5) {
            return res.status(400).json({ error: "Vui lòng nhập nội dung hoặc upload file để lập kế hoạch!" });
        }

        // 2. Gửi cho Gemini lập kế hoạch (Prompt chuyên dụng cho Pháp lý)
        console.log("🤖 Đang gửi dữ liệu cho Gemini lập kế hoạch Agentic...");
        
        const prompt = `
        Bạn là một Luật sư AI chuyên nghiệp (LegAI). Hãy phân tích yêu cầu dưới đây và lập một kế hoạch thực thi pháp lý chi tiết (AI Legal Planning).
        
        Nội dung yêu cầu/hồ sơ:
        """${combinedText}"""

        Yêu cầu output JSON format (Danh sách các tasks):
        [
            {
                "id": 1,
                "phase": "Giai đoạn 1",
                "title": "Tên nhiệm vụ cụ thể",
                "assignee": "Người phụ trách (Luật sư A, Trợ lý, hoặc Chờ phân công)",
                "deadline": "Thời gian dự kiến (VD: 3 ngày, 1 tuần)",
                "status": "pending" | "locked"
            }
        ]
        Lưu ý: Chỉ trả về JSON, không kèm giải thích hay markdown.
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Parse JSON
        const planningResult = JSON.parse(responseText);

        console.log(`✅ Lập kế hoạch xong! Đã tạo ${planningResult.length} bước.`);
        res.json(planningResult);

    } catch (error) {
        console.error("❌ Lỗi lập kế hoạch:", error);
        res.status(500).json({ error: "Lỗi hệ thống khi lập kế hoạch AI. Chi tiết: " + error.message });
    } finally {
        // Dọn dẹp tất cả file tạm
        filePaths.forEach(fp => {
            if (fs.existsSync(fp)) {
                fs.unlinkSync(fp);
            }
        });
        if (filePaths.length > 0) console.log("🧹 Đã dọn dẹp các file tạm.");
    }
};

// ==========================================
// 3. TÍNH NĂNG TRỢ LÝ BIỂU MẪU (FORM GENERATION)
// ==========================================
exports.generateForm = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || message.trim().length < 2) {
            return res.status(400).json({ error: "Vui lòng nhập nội dung yêu cầu soạn thảo!" });
        }

        console.log("🤖 Đang gửi yêu cầu chat cho Gemini bóc tách biểu mẫu...");
        
        const prompt = `
        Bạn là một Trợ lý Luật sư AI (LegAI). Hãy phân tích tin nhắn của người dùng và bóc tách các thông tin pháp lý để điền vào biểu mẫu hợp đồng.
        
        Tin nhắn của người dùng:
        "${message}"

        Yêu cầu output JSON format (Luôn trả về ĐỦ các trường bên dưới, nếu không có thông tin thì để chuỗi rỗng):
        {
            "chat_reply": "Lời phản hồi lịch sự của AI cho người dùng (Tiếng Việt)",
            "template_type": "hop_dong_tieu_chuan",
            "extracted_data": {
                "benA_name": "",
                "benA_id": "",
                "benA_address": "",
                "benA_phone": "",
                "benA_rep": "",
                "benB_name": "",
                "benB_id": "",
                "benB_address": "",
                "benB_phone": "",
                "benB_rep": "",
                "noi_dung_chinh": "",
                "gia_tri_hop_dong": "",
                "thoi_han": "",
                "can_cu_luat": []
            }
        }
        Lưu ý: Chỉ trả về JSON, không kèm giải thích hay markdown.
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Parse JSON
        const formResult = JSON.parse(responseText);

        console.log("✅ Bóc tách biểu mẫu xong!");
        res.json(formResult);

    } catch (error) {
        console.error("❌ Lỗi bóc tách biểu mẫu:", error);
        res.status(500).json({ error: "Lỗi hệ thống khi bóc tách biểu mẫu AI. Chi tiết: " + error.message });
    }
};