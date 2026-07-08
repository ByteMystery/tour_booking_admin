"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Eye,
  EyeOff,
  Loader2,
  User,
  Lock,
  ShieldCheck,
  LogIn,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Vui lòng nhập tên đăng nhập.");
      return;
    }
    if (!password) {
      setError("Vui lòng nhập mật khẩu.");
      return;
    }

    setLoading(true);
    try {
      await login(username.trim(), password);
      toast.success("Đăng nhập thành công!");
      router.replace("/dashboard");
    } catch {
      setError("Tên đăng nhập hoặc mật khẩu không đúng.");
    } finally {
      setLoading(false);
    }
  };

  // Không còn demo mode — đăng nhập thật qua Firebase Auth

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* ── Left panel (Scenic Phu Quoc Image) ────────────────── */}
      <div
        className="relative hidden lg:flex lg:w-1/2 flex-col justify-between p-16 bg-cover bg-center overflow-hidden"
        style={{
          backgroundImage: "url('/banner_login.png')",
        }}
      >
        {/* Subtle white-to-transparent overlay to ensure text readability */}
        <div className="absolute inset-0 bg-white/5 pointer-events-none" />

        {/* Logo and Brand */}
        <div className="relative z-10 flex items-center gap-3">
          <img
            src="/logo_dark.png"
            alt="Tripzio Logo"
            className="h-8 w-auto object-contain"
          />
          <span className="rounded bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-600">
            Admin
          </span>
        </div>

        {/* Headline */}
        <div className="relative z-10 my-auto max-w-md space-y-4">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Chào mừng trở lại!
          </h1>
          <p className="text-base text-slate-700 leading-relaxed font-semibold">
            Đăng nhập để truy cập hệ thống quản trị và quản lý mọi hoạt động của
            Tripzio.
          </p>
        </div>

        {/* Footer & Security Badge */}
        <div className="relative z-10 space-y-6">
          <div className="w-fit max-w-sm rounded-2xl border border-white/40 bg-white/30 p-5 backdrop-blur-md shadow-lg shadow-black/5">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 border border-blue-200/35">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Bảo mật & An toàn</h3>
                <p className="mt-1 text-xs font-medium text-slate-700 leading-normal">
                  Hệ thống được bảo vệ bằng các tiêu chuẩn bảo mật hàng đầu.
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs font-semibold text-slate-700">
            © 2024 Tripzio. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── Right panel (Login Form Card) ─────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-[460px] rounded-3xl bg-white p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100">
          {/* Circular Lock Badge */}
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50/80 border border-blue-100 text-blue-600 mb-4 shadow-sm">
              <Lock className="h-6 w-6" />
            </div>
            <h2 className="text-[22px] font-bold text-slate-800">
              Đăng nhập quản trị
            </h2>
            <p className="mt-1.5 text-sm text-slate-400 font-medium">
              Nhập thông tin tài khoản của bạn để tiếp tục
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Username/Email */}
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="text-sm font-semibold text-slate-700 block"
              >
                Email hoặc tên đăng nhập
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError("");
                  }}
                  placeholder="Nhập email hoặc tên đăng nhập"
                  className={cn(
                    "w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400/80 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm",
                    error &&
                      "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                  )}
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-semibold text-slate-700 block"
              >
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Nhập mật khẩu"
                  className={cn(
                    "w-full h-12 pl-12 pr-12 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400/80 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm",
                    error &&
                      "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPw ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember & Forgot Row */}
            <div className="flex items-center justify-between mt-5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 focus:ring-opacity-50 cursor-pointer accent-blue-600"
                />
                <span className="text-sm font-medium text-slate-500 hover:text-slate-600 transition-colors">
                  Ghi nhớ đăng nhập
                </span>
              </label>
              <button
                type="button"
                onClick={() =>
                  toast.success(
                    "Vui lòng liên hệ quản trị viên hệ thống để khôi phục mật khẩu."
                  )
                }
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                tabIndex={-1}
              >
                Quên mật khẩu?
              </button>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">
                  !
                </span>
                <span className="font-semibold">{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#0060d0] hover:bg-[#0052b4] active:bg-[#00469b] text-white font-semibold rounded-xl shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Đang đăng nhập...</span>
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  <span>Đăng nhập</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Support Link */}
        <div className="mt-8 text-center text-sm font-medium text-slate-550">
          Cần hỗ trợ?{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              toast.success("Vui lòng liên hệ bộ phận kỹ thuật hệ thống.");
            }}
            className="text-blue-600 hover:text-blue-700 hover:underline font-semibold"
          >
            Liên hệ bộ phận kỹ thuật
          </a>
        </div>
      </div>
    </div>
  );
}
