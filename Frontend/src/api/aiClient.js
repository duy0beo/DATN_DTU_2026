import axios from "axios";

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_AI_API_URL || 'http://localhost:8000/api',
    headers: {
        "Content-Type": "application/json",
    },
});

axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("accessToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

const aiClient = {
  
    ask: async (question) => {
        try {
            const response = await axiosInstance.post('/chat/ask', { question });
            return response.data;
        } catch (error) {
            console.error("Lỗi khi gọi API Chat:", error);
            throw error;
        }
    },

 
    analyzeContract: async (fileObject) => {
        try {
            const formData = new FormData();
            formData.append('file', fileObject);

            const response = await axiosInstance.post('/ai/analyze-contract', formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            return response.data;
        } catch (error) {
            console.error("Lỗi khi gọi API Phân tích:", error);
            throw error;
        }
    },

    generatePlanning: async (formData) => {
        try {
            const response = await axiosInstance.post('/ai/generate-planning', formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            return response.data;
        } catch (error) {
            console.error("Lỗi khi gọi API Planning:", error);
            throw error;
        }
    },

  
    generateForm: async (message) => {
        try {
            const response = await axiosInstance.post('/ai/generate-form', { message });
            return response.data;
        } catch (error) {
            console.error("Lỗi khi gọi API Form:", error);
            throw error;
        }
    },

   
    saveHistory: async (payload) => {
        try {
            const response = await axiosInstance.post('/history/save', payload);
            return response.data;
        } catch (error) {
            console.error("Lỗi khi lưu lịch sử:", error);
            throw error;
        }
    },

    getHistory: async () => {
        try {
            const response = await axiosInstance.get('/history/list');
            return response.data;
        } catch (error) {
            console.error("Lỗi khi lấy lịch sử:", error);
            throw error;
        }
    },

    getHistoryDetail: async (id) => {
        try {
            const response = await axiosInstance.get(`/history/detail/${id}`);
            return response.data;
        } catch (error) {
            console.error("Lỗi khi lấy chi tiết lịch sử:", error);
            throw error;
        }
    },

    deleteHistory: async (id) => {
        try {
            const response = await axiosInstance.delete(`/history/delete/${id}`);
            return response.data;
        } catch (error) {
            console.error("Lỗi khi xóa lịch sử:", error);
            throw error;
        }
    }
};

export default aiClient;