"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/shared/Logo";
import {
  Sparkles,
  Eye,
  EyeOff,
  Loader2,
  User,
  Lock,
  TrendingUp,
  CalendarCheck,
  Users,
  Map,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const STATS = [
  { label: "Tours đang bán", value: "247+", icon: Map },
  { label: "Đơn trong tháng", value: "1.2K", icon: CalendarCheck },
  { label: "Khách hàng", value: "8.4K", icon: Users },
  { label: "Tăng trưởng", value: "+18%", icon: TrendingUp },
];

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("123456");
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
    <div className="flex min-h-screen bg-background">
      {/* ── Left panel ─────────────────────────────────────────── */}
      <div className="relative hidden lg:flex lg:w-[52%] flex-col overflow-hidden bg-slate-900">
        {/* Decorative gradient orbs */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative flex flex-1 flex-col justify-between p-12 text-white">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Logo theme="dark" />
            <span className="ml-2 rounded-full bg-indigo-500/30 px-2.5 py-0.5 text-xs font-medium text-indigo-300">
              Admin
            </span>
          </div>

          {/* Headline */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-[2.75rem] font-extrabold leading-[1.15] tracking-tight">
                Quản lý nền tảng
                <br />
                <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                  đặt tour du lịch
                </span>
              </h1>
              <p className="max-w-sm text-base text-slate-400 leading-relaxed">
                Dashboard toàn diện cho Admin, Đối tác lữ hành và Nhân viên
                vận hành hệ thống.
              </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              {STATS.map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="group flex items-center gap-3 rounded-2xl border border-slate-700/60 bg-slate-800/60 p-4 backdrop-blur-sm transition-colors hover:border-indigo-500/40 hover:bg-slate-800"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 group-hover:bg-indigo-600/30 transition-colors">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xl font-bold leading-none text-white">
                      {value}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-600">
            © 2026 Tripzio. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── Right panel ────────────────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-[400px] space-y-8">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 lg:hidden bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 w-fit">
            <Logo theme="dark" />
            <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs font-medium text-indigo-300">
              Admin
            </span>
          </div>

          {/* Heading */}
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold tracking-tight">
              Chào mừng trở lại 👋
            </h2>
            <p className="text-sm text-muted-foreground">
              Đăng nhập để tiếp tục quản lý hệ thống
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Username */}
            <div className="space-y-1.5">
              <Label htmlFor="username">Tên đăng nhập</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError("");
                  }}
                  placeholder="admin"
                  autoComplete="username"
                  autoFocus
                  className={cn(
                    "h-11 pl-10",
                    error && "border-red-400 focus-visible:ring-red-400"
                  )}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mật khẩu</Label>
                <button
                  type="button"
                  className="text-xs text-indigo-600 hover:underline"
                  tabIndex={-1}
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="••••••"
                  autoComplete="current-password"
                  className={cn(
                    "h-11 pl-10 pr-11",
                    error && "border-red-400 focus-visible:ring-red-400"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPw ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <p className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                <span className="font-semibold">!</span> {error}
              </p>
            )}

            {/* Submit */}
            <Button
              type="submit"
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-base font-semibold shadow-md shadow-indigo-200 transition-all hover:shadow-indigo-300"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                "Đăng nhập"
              )}
            </Button>
          </form>

          {/* Credentials hint */}
          <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/60 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-indigo-700">
              Tài khoản quản trị
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg bg-white/80 px-3 py-2 shadow-sm">
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  Tên đăng nhập
                </p>
                <p className="font-mono font-bold text-slate-700">admin</p>
              </div>
              <div className="rounded-lg bg-white/80 px-3 py-2 shadow-sm">
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  Mật khẩu
                </p>
                <p className="font-mono font-bold text-slate-700">123456</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
