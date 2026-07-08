"use client";

import { Bell, Search, Menu, ChevronDown, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { admin, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-100 bg-white/80 px-6 backdrop-blur-md">
      {/* Title & Hamburger */}
      <div className="flex items-center gap-3">
        <button className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors lg:hidden">
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-lg font-extrabold text-slate-800 tracking-tight">{title || "Trang chủ"}</h1>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:flex items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm kiếm tour, đơn hàng, khách hàng..."
            className="h-10 rounded-full border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-80 transition-all text-slate-700 placeholder-slate-400"
          />
        </div>

        {/* Notifications */}
        <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors">
          <Bell className="h-5 w-5 text-slate-400" />
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white">
            12
          </span>
        </button>

        {/* Vertical divider */}
        <div className="h-6 w-[1px] bg-slate-200/80 hidden md:block" />

        {/* User profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 hover:bg-slate-50 p-1.5 rounded-xl transition-colors cursor-pointer"
          >
            <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-blue-500/10 transition-all hover:ring-blue-500/30">
              <AvatarImage src={`https://i.pravatar.cc/100?u=${admin?.email}`} />
              <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-semibold">
                {admin?.displayName?.charAt(0) ?? "A"}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-sm font-extrabold text-slate-800 leading-tight">
                {admin?.displayName || "Nguyễn Minh"}
              </span>
              <span className="text-[10px] text-slate-400 font-bold tracking-wide capitalize mt-0.5">
                {admin?.role === "super_admin" ? "Super Admin" : (admin?.role || "Quản trị viên")}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400 hidden md:block" />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-100 bg-white p-1 shadow-lg z-40 transition-all duration-200">
                <div className="px-3 py-2 text-xs font-semibold text-slate-400 border-b border-slate-50 mb-1">
                  Tài khoản
                </div>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                >
                  <LogOut className="h-4 w-4" />
                  Đăng xuất
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
