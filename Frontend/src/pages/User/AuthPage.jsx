import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import axios from "axios";

export default function AuthPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const [mode, setMode] = useState("LOGIN"); // LOGIN | REGISTER | FORGOT | RESET
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        password: "",
        pin: "",         // Trường mới: Mã PIN từ email
        newPassword: "",  // Trường mới: Mật khẩu mới
    });

    // If some pages navigate with state.mode
    React.useEffect(() => {
        if (location.state?.mode === "register") setMode("REGISTER");
        if (location.state?.mode === "forgot") setMode("FORGOT");
    }, [location]);

    const onChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const backendBase = "http://localhost:8000/api";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (mode === "LOGIN") {
                const { email, password } = form;
                if (!email || !password) return alert("Vui lòng nhập email và mật khẩu");
                const res = await axios.post(`${backendBase}/auth/login`, { email, password });
                if (res.data?.user) {
                    const token = res.data.token || res.data.accessToken || (res.data.data && res.data.data.token);
                    if (token) localStorage.setItem("accessToken", token);
                    else localStorage.setItem("accessToken", "true");

                    localStorage.setItem("user", JSON.stringify(res.data.user));
                    localStorage.setItem("isLoggedIn", "true");
                    if (res.data.user.role) localStorage.setItem("userRole", res.data.user.role);
                    alert("Đăng nhập thành công");
                    window.location.href = "/";
                } else {
                    alert(res.data?.message || "Đăng nhập thất bại");
                }
            } else if (mode === "REGISTER") {
                const { fullName, email, password } = form;
                if (!fullName || !email || !password) return alert("Vui lòng điền đầy đủ thông tin");
                const res = await axios.post(`${backendBase}/auth/register`, { fullName, email, password });
                if (res.data?.user) {
                    alert("Đăng ký thành công. Vui lòng đăng nhập");
                    setMode("LOGIN");
                    setForm({ ...form, fullName: "", email: "", password: "" });
                } else {
                    alert(res.data?.message || "Đăng ký thất bại");
                }
            } else if (mode === "FORGOT") {
                const { email } = form;
                if (!email) return alert("Vui lòng nhập email");
                const res = await axios.post(`${backendBase}/auth/forgot-password`, { email });
                
                if (res.data.success) {
                    alert(res.data.message);
                    setMode("RESET"); // Chuyển sang bước nhập mã PIN & mật khẩu mới
                } else {
                    alert(res.data.message || "Không thể thực hiện yêu cầu.");
                }
            } else if (mode === "RESET") {
                const { email, pin, newPassword } = form;
                if (!pin || !newPassword) return alert("Vui lòng nhập mã PIN và mật khẩu mới");
                const res = await axios.post(`${backendBase}/auth/reset-password`, { email, pin, newPassword });
                
                if (res.data.success) {
                    alert("Đổi mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.");
                    setMode("LOGIN");
                    setForm({ ...form, password: "", pin: "", newPassword: "" });
                } else {
                    alert(res.data.message || "Mã PIN không chính xác hoặc đã hết hạn.");
                }
            }
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || err.message || "Lỗi server");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-extrabold text-white uppercase">
                        {mode === "LOGIN" && "Đăng nhập"}
                        {mode === "REGISTER" && "Đăng ký"}
                        {mode === "FORGOT" && "Quên mật khẩu"}
                        {mode === "RESET" && "Đặt lại mật khẩu"}
                    </h1>
                    <p className="text-xs text-gray-300 mt-2">
                        {mode === "LOGIN" && "Đăng nhập để sử dụng dịch vụ LegalAI"}
                        {mode === "REGISTER" && "Tạo tài khoản mới"}
                        {mode === "FORGOT" && "Nhập email để nhận mã PIN khôi phục"}
                        {mode === "RESET" && "Nhập mã PIN từ email và mật khẩu mới"}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === "REGISTER" && (
                        <div>
                            <label className="block text-xs text-gray-300 mb-2 font-bold uppercase tracking-widest">Họ và tên</label>
                            <input
                                name="fullName"
                                value={form.fullName}
                                onChange={onChange}
                                className="w-full px-4 py-3 bg-[#080808] text-white rounded-xl border border-white/10 focus:border-cyan-500/50 outline-none transition-all"
                                placeholder="Nguyễn Văn A"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs text-gray-300 mb-2 font-bold uppercase tracking-widest">Email</label>
                        <input
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={onChange}
                            readOnly={mode === "RESET"}
                            className={`w-full px-4 py-3 bg-[#080808] text-white rounded-xl border border-white/10 outline-none focus:border-cyan-500/50 transition-all ${mode === "RESET" ? "opacity-50 cursor-not-allowed" : ""}`}
                            placeholder="email@domain.com"
                        />
                    </div>

                    {mode === "RESET" && (
                        <>
                            <div>
                                <label className="block text-xs text-cyan-400 mb-2 font-bold uppercase tracking-widest">Mã PIN (6 chữ số)</label>
                                <input
                                    name="pin"
                                    type="text"
                                    maxLength={6}
                                    value={form.pin}
                                    onChange={onChange}
                                    className="w-full px-4 py-3 bg-[#080808] text-white rounded-xl border border-cyan-500/30 outline-none focus:border-cyan-500 transition-all text-center text-2xl font-black tracking-[10px]"
                                    placeholder="000000"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-300 mb-2 font-bold uppercase tracking-widest">Mật khẩu mới</label>
                                <input
                                    name="newPassword"
                                    type="password"
                                    value={form.newPassword}
                                    onChange={onChange}
                                    className="w-full px-4 py-3 bg-[#080808] text-white rounded-xl border border-white/10 outline-none focus:border-cyan-500/50 transition-all"
                                    placeholder="Tối thiểu 6 ký tự"
                                />
                            </div>
                        </>
                    )}

                    {(mode === "LOGIN" || mode === "REGISTER") && (
                        <div>
                            <label className="block text-xs text-gray-300 mb-2 font-bold uppercase tracking-widest">Mật khẩu</label>
                            <input
                                name="password"
                                type="password"
                                value={form.password}
                                onChange={onChange}
                                className="w-full px-4 py-3 bg-[#080808] text-white rounded-xl border border-white/10 outline-none focus:border-cyan-500/50 transition-all"
                                placeholder="Mật khẩu"
                            />
                        </div>
                    )}

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm shadow-lg transition-all active:scale-95 ${loading ? "bg-gray-600 text-white cursor-not-allowed" : "bg-gradient-to-r from-blue-700 to-cyan-500 hover:from-blue-600 hover:to-cyan-400 text-white"
                                }`}
                        >
                            {loading ? "Đang xử lý..." : mode === "LOGIN" ? "Đăng nhập ngay" : mode === "REGISTER" ? "Hoàn tất đăng ký" : mode === "FORGOT" ? "Gửi mã PIN" : "Xác nhận đổi mật khẩu"}
                        </button>
                    </div>
                </form>

                <div className="mt-8 text-center text-sm">
                    {mode === "LOGIN" && (
                        <>
                            <p className="text-gray-400">
                                Chưa có tài khoản?{" "}
                                <button className="text-cyan-400 font-bold hover:underline" onClick={() => setMode("REGISTER")}>Đăng ký ngay</button>
                            </p>
                            <p className="mt-3">
                                <button className="text-gray-500 hover:text-white transition-colors" onClick={() => setMode("FORGOT")}>Bạn quên mật khẩu?</button>
                            </p>
                        </>
                    )}

                    {mode === "REGISTER" && (
                        <p className="text-gray-400">
                            Đã là thành viên?{" "}
                            <button className="text-cyan-400 font-bold hover:underline" onClick={() => setMode("LOGIN")}>Đăng nhập</button>
                        </p>
                    )}

                    {(mode === "FORGOT" || mode === "RESET") && (
                        <p className="text-gray-400">
                            <button className="text-gray-200 font-bold hover:text-cyan-400 transition-colors" onClick={() => setMode("LOGIN")}>← Quay lại đăng nhập</button>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}