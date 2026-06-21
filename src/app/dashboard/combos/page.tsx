"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { Combo } from "@/types";
import { Plus, Pencil, Star, MapPin, Package, Loader2 } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import { useCollection } from "@/hooks/useFirestore";
import { useAuth } from "@/contexts/AuthContext";

export default function CombosPage() {
  const { admin } = useAuth();
  const { data: combos, loading, error } = useCollection<Combo>("combos");

  if (loading) {
    return (
      <div className="page-transition">
        <Header title="Quản lý Combo" subtitle="Gói du lịch trọn gói (Bay + Khách sạn)" />
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-transition">
        <Header title="Quản lý Combo" subtitle="Gói du lịch trọn gói (Bay + Khách sạn)" />
        <div className="p-6">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            <strong>Lỗi tải dữ liệu combo từ Firestore:</strong> {error}
          </div>
        </div>
      </div>
    );
  }

  const filteredCombos = combos.filter((combo) => {
    if (admin?.role === "editor" && admin.partnerId && combo.partnerId !== admin.partnerId) {
      return false;
    }
    return true;
  });

  return (
    <div className="page-transition">
      <Header 
        title="Quản lý Combo" 
        subtitle={`Có ${filteredCombos.length} gói du lịch trọn gói (Bay + Khách sạn)`} 
      />

      <div className="p-6 space-y-5">
        <div className="flex justify-end">
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700" onClick={() => toast("Tính năng sắp ra mắt")}>
            <Plus className="h-4 w-4" />
            Tạo Combo mới
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredCombos.map((combo) => {
            // Fallback default values
            const originalPrice = combo.originalPrice || 0;
            const salePrice = combo.salePrice || 0;
            const discountPercent = combo.discountPercent || (originalPrice > 0 ? Math.round((originalPrice - salePrice) / originalPrice * 100) : 0);

            return (
              <div key={combo.id} className="rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="relative h-48">
                    <Image src={combo.imageUrl || "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400"} alt={combo.name} fill className="object-cover" sizes="600px" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    {discountPercent > 0 && (
                      <div className="absolute top-3 right-3 bg-red-500 rounded-full px-2.5 py-1 text-xs font-bold text-white">
                        -{discountPercent}%
                      </div>
                    )}
                    <div className="absolute bottom-3 left-3">
                      <div className="flex items-center gap-1 text-white/80 text-xs mb-1">
                        <MapPin className="h-3 w-3" />{combo.destination}
                      </div>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <h3 className="font-semibold leading-tight min-h-[40px]">{combo.name}</h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-medium">{combo.rating || 5}</span>
                        <span className="text-muted-foreground">({combo.reviewCount || 0})</span>
                        <span className="text-muted-foreground ml-1">· {combo.duration || 2}N{combo.nights || 1}Đ</span>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-indigo-600">{formatCurrency(salePrice)}</p>
                        {originalPrice > 0 && (
                          <p className="text-xs line-through text-muted-foreground">{formatCurrency(originalPrice)}</p>
                        )}
                      </div>
                    </div>
                    {combo.highlights && combo.highlights.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {combo.highlights.map(h => (
                          <span key={h} className="flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">
                            <Package className="h-2.5 w-2.5" />{h}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-4 pt-0">
                  <div className="flex items-center justify-between border-t pt-3">
                    <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                      Đối tác: {combo.partnerName || "N/A"}
                    </span>
                    <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => toast("Tính năng sắp ra mắt")}>
                      <Pencil className="h-3 w-3" />Chỉnh sửa
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredCombos.length === 0 && (
            <div className="col-span-2 py-10 text-center text-sm text-muted-foreground">
              Không có combo nào được tìm thấy.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

