"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  Sparkles,
  Gift,
  Building2,
  Plane,
  Car,
  Package,
  CalendarCheck,
  Star,
  Compass,
  Users,
  Image as ImageIcon,
  MapPin,
  Newspaper,
  Tag,
  Shield,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navGroups = [
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
      { href: "/dashboard/zero-dong-tours", label: "Tour 0đ", icon: Gift },
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
      { href: "/dashboard/banners", label: "Banners", icon: ImageIcon },
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
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative flex flex-col bg-white border-r border-slate-100 text-slate-700 transition-all duration-300 ease-in-out z-20",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center px-6 gap-3 shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <img
              src="/logo_dark.png"
              alt="Tripzio Logo"
              className="h-7 w-auto object-contain"
            />
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200">
              Admin
            </span>
          </div>
        ) : (
          <div className="mx-auto">
            <img
              src="/logo_dark.png"
              alt="Tripzio Logo"
              className="h-6 w-auto object-contain"
            />
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin space-y-4">
        {navGroups.map((group) => (
          <div key={group.group} className="space-y-1">
            {!collapsed && (
              <p className="mb-1.5 px-6 text-[9px] font-extrabold uppercase tracking-wider text-slate-500">
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
                    "mx-3 flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs transition-all duration-200",
                    active
                      ? "bg-blue-50 text-blue-600 font-bold shadow-sm shadow-blue-500/[0.02]"
                      : "text-slate-700 hover:bg-slate-50/70 hover:text-slate-950 font-medium"
                  )}
                >
                  <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-blue-600" : "text-slate-500")} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
            {!collapsed && <div className="mx-4 my-2 border-t border-slate-100/50" />}
          </div>
        ))}
      </nav>



      {/* Footer copyright */}
      {!collapsed && (
        <div className="px-6 pb-6 pt-2 text-[11px] text-slate-400 font-medium shrink-0">
          <p>© 2024 Tripzio Admin</p>
          <p className="mt-0.5">Phiên bản 1.0.0</p>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 flex h-6 w-6 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-400 hover:text-slate-600 transition-colors z-10 shadow-sm shadow-black/5"
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" />
        )}
      </button>
    </aside>
  );
}
