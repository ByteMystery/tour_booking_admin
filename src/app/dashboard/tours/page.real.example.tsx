/**
 * HƯỚNG DẪN TÍCH HỢP DATA THẬT — Tours Page
 * ─────────────────────────────────────────────────────────────────
 * File này là ví dụ đầy đủ về cách thay mock-data bằng Firestore.
 * Copy nội dung này vào page.tsx khi đã cấu hình Firebase xong.
 * ─────────────────────────────────────────────────────────────────
 */

"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ✅ THAY ĐỔI: import hook thay vì mock-data
import { useTours, updateDocById, deleteDocById } from "@/hooks/useFirestore";
import { useAuth } from "@/contexts/AuthContext";

import { formatCurrency, formatNumber } from "@/lib/utils";
import type { Tour } from "@/types";
import { Plus, Pencil, Trash2, Star, MapPin, Globe, Home, Loader2 } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";

export default function ToursPageReal() {
  const { admin } = useAuth();

  // ✅ Nếu là partner admin, truyền partnerId để lọc tự động
  const { data: tours, loading, error, refetch } = useTours(
    admin?.role === "editor" ? admin.partnerId : undefined
  );

  const [regionFilter, setRegionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // ✅ Filter ở client (đã fetch về rồi, filter trên array)
  const filtered = tours.filter((t) => {
    if (regionFilter !== "all" && t.region !== regionFilter) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    return true;
  });

  // ✅ Xóa thật trên Firestore
  const handleDelete = async (id: string) => {
    try {
      await deleteDocById("tours", id);
      toast.success("Đã xóa tour");
      refetch();
    } catch {
      toast.error("Xóa thất bại");
    }
  };

  // ✅ Toggle status thật
  const handleToggleStatus = async (tour: Tour) => {
    const newStatus = tour.status === "active" ? "hidden" : "active";
    try {
      await updateDocById("tours", tour.id, { status: newStatus });
      toast.success("Đã cập nhật trạng thái");
      refetch();
    } catch {
      toast.error("Cập nhật thất bại");
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          <strong>Lỗi kết nối Firestore:</strong> {error}
          <br />
          Kiểm tra lại Firebase config trong <code>.env.local</code> và Security Rules.
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Quản lý Tour" subtitle={`${tours.length} tours trong hệ thống`} />
      {/* ... rest của UI giữ nguyên như cũ ... */}
    </div>
  );
}
