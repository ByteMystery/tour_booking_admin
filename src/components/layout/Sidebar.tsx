"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  CalendarCheck,
  Users,
  Building2,
  Plane,
  Car,
  Package,
  Star,
  Image,
  Newspaper,
  Tag,
  MapPin,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  Compass,
  LogOut,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/shared/Logo";
import { useState } from "react";

const navItems = [
  {
    group: "Tổng quan",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    group: "Quản lý dịch vụ",
    items: [
      { href: "/dashboard/tours", label: "Tours", icon: Map },
      { href: "/dashboard/last-minute-tours", label: "Tour giờ chót", icon: Sparkles },
      { href: "/dashboard/hotels", label: "Khách sạn", icon: Building2 },
      { href: "/dashboard/flights", label: "Vé máy bay", icon: Plane },
      { href: "/dashboard/transfers", label: "Xe đưa đón", icon: Car },
      { href: "/dashboard/combos", label: "Combo", icon: Package },
    ],
  },
  {
    group: "Giao dịch",
    items: [
      { href: "/dashboard/bookings", label: "Đơn đặt chỗ", icon: CalendarCheck },
      { href: "/dashboard/reviews", label: "Đánh giá", icon: Star },
    ],
  },
  {
    group: "Đối tác & Người dùng",
    items: [
      { href: "/dashboard/partners", label: "Đối tác", icon: Compass },
      { href: "/dashboard/users", label: "Khách hàng", icon: Users },
    ],
  },
  {
    group: "Nội dung",
    items: [
      { href: "/dashboard/banners", label: "Banners", icon: Image },
      { href: "/dashboard/destinations", label: "Điểm đến", icon: MapPin },
      { href: "/dashboard/articles", label: "Bài viết", icon: Newspaper },
      { href: "/dashboard/promos", label: "Khuyến mãi", icon: Tag },
    ],
  },
  {
    group: "Hệ thống",
    items: [
      { href: "/dashboard/admins", label: "Quản trị viên", icon: Shield },
      { href: "/dashboard/settings", label: "Cài đặt", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { admin, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative flex flex-col bg-slate-900 text-white transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-slate-700 px-4">
        <Logo collapsed={collapsed} />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin">
        {navItems.map((group) => (
          <div key={group.group} className="mb-1">
            {!collapsed && (
              <p className="mb-1 px-4 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                {group.group}
              </p>
            )}
            {group.items.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "mx-2 mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
            {!collapsed && <div className="mx-4 my-2 border-t border-slate-800" />}
          </div>
        ))}
      </nav>

      {/* User / Logout */}
      <div className="border-t border-slate-700 p-3">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold">
              {admin?.displayName?.charAt(0) ?? "A"}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-xs font-medium">{admin?.displayName}</p>
              <p className="truncate text-[10px] text-slate-400">{admin?.role}</p>
            </div>
            <button
              onClick={logout}
              className="rounded p-1 text-slate-400 hover:text-red-400 transition-colors"
              title="Đăng xuất"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            className="mx-auto flex items-center justify-center rounded p-1 text-slate-400 hover:text-red-400"
            title="Đăng xuất"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-400 hover:text-white transition-colors z-10"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>
    </aside>
  );
}
