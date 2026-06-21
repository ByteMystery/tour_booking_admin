import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Timestamp } from "firebase/firestore";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

export function formatDate(
  timestamp: Timestamp | string | Date | undefined,
  fmt = "dd/MM/yyyy"
): string {
  if (!timestamp) return "—";
  try {
    const date =
      timestamp instanceof Timestamp
        ? timestamp.toDate()
        : typeof timestamp === "string"
        ? new Date(timestamp)
        : timestamp;
    return format(date, fmt, { locale: vi });
  } catch {
    return "—";
  }
}

export function formatDateTime(
  timestamp: Timestamp | string | Date | undefined
): string {
  return formatDate(timestamp, "dd/MM/yyyy HH:mm");
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    inactive: "bg-gray-100 text-gray-600",
    hidden: "bg-yellow-100 text-yellow-700",
    suspended: "bg-red-100 text-red-700",
    pending: "bg-amber-100 text-amber-700",
    upcoming: "bg-blue-100 text-blue-700",
    completed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700",
    available: "bg-emerald-100 text-emerald-700",
    full: "bg-orange-100 text-orange-700",
    soldout: "bg-red-100 text-red-700",
    super_admin: "bg-purple-100 text-purple-700",
    admin: "bg-blue-100 text-blue-700",
    editor: "bg-cyan-100 text-cyan-700",
    support: "bg-teal-100 text-teal-700",
  };
  return map[status] ?? "bg-gray-100 text-gray-600";
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    active: "Đang hoạt động",
    inactive: "Không hoạt động",
    hidden: "Đã ẩn",
    suspended: "Đã khóa",
    pending: "Chờ thanh toán",
    upcoming: "Sắp khởi hành",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
    available: "Còn chỗ",
    full: "Đầy chỗ",
    soldout: "Hết chỗ",
    super_admin: "Super Admin",
    admin: "Admin",
    editor: "Editor",
    support: "Support",
    domestic: "Trong nước",
    international: "Quốc tế",
    tour: "Tour",
    experience: "Trải nghiệm",
    cuisine: "Ẩm thực",
    shopping: "Mua sắm",
    hotel: "Khách sạn",
    flight: "Máy bay",
    transfer: "Đưa đón",
  };
  return map[status] ?? status;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9).toUpperCase();
}

export function truncate(str: string, length = 50): string {
  if (str.length <= length) return str;
  return str.substring(0, length) + "...";
}
