"use client";

import { useState, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { DataTable } from "@/components/shared/DataTable";
import { PageLoader } from "@/components/shared/PageLoader";
import { FirestoreError } from "@/components/shared/FirestoreError";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useHotels, deleteDocById, updateDocById, createDoc } from "@/hooks/useFirestore";
import { formatCurrency } from "@/lib/utils";
import type { Hotel } from "@/types";
import { Plus, Pencil, Trash2, Star, MapPin } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";

export default function HotelsPage() {
  const { data: hotels, loading, error, refetch } = useHotels();
  const [editHotel, setEditHotel] = useState<Hotel | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // Form refs
  const nameRef = useRef<HTMLInputElement>(null);
  const locationRef = useRef<HTMLInputElement>(null);
  const starsRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const originalPriceRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const imageUrlRef = useRef<HTMLInputElement>(null);

  const handleDelete = async (id: string) => {
    try {
      await deleteDocById("hotels", id);
      refetch();
      toast.success("Đã xóa khách sạn");
    } catch (e) {
      toast.error("Xóa thất bại: " + (e as Error).message);
    }
  };

  const handleSave = async () => {
    try {
      const originalPrice = Number(originalPriceRef.current?.value ?? 0);
      const price = Number(priceRef.current?.value ?? 0);
      const payload = {
        name: nameRef.current?.value ?? "",
        location: locationRef.current?.value ?? "",
        stars: Number(starsRef.current?.value ?? 3),
        address: addressRef.current?.value ?? "",
        originalPricePerNight: originalPrice,
        pricePerNight: price,
        discountPercent: originalPrice > 0 ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0,
        imageUrl: imageUrlRef.current?.value ?? "",
      };
      if (editHotel) {
        await updateDocById("hotels", editHotel.id, payload);
        toast.success("Đã cập nhật");
      } else {
        await createDoc("hotels", {
          ...payload,
          rating: 0,
          reviewCount: 0,
          description: "",
          amenities: [],
        });
        toast.success("Đã thêm khách sạn");
      }
      refetch();
      setEditHotel(null);
      setShowCreate(false);
    } catch (e) {
      toast.error("Lưu thất bại: " + (e as Error).message);
    }
  };

  if (loading) return (
    <div className="page-transition">
      <Header title="Quản lý Khách sạn" subtitle="Đang tải..." />
      <PageLoader />
    </div>
  );

  if (error) return (
    <div className="page-transition">
      <Header title="Quản lý Khách sạn" subtitle="" />
      <FirestoreError error={error} />
    </div>
  );

  return (
    <div className="page-transition">
      <Header title="Quản lý Khách sạn" subtitle={`${hotels.length} khách sạn trong hệ thống`} />

      <div className="p-6 space-y-5">
        <div className="flex justify-end">
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            Thêm khách sạn
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {hotels.map((hotel) => (
            <div key={hotel.id} className="rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <div className="relative h-44">
                <Image src={hotel.imageUrl || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400"} alt={hotel.name} fill className="object-cover" sizes="400px" />
                <div className="absolute top-3 left-3 bg-black/40 rounded-full px-2 py-0.5 text-xs text-white">
                  {"★".repeat(hotel.stars)}
                </div>
                {hotel.discountPercent > 0 && (
                  <div className="absolute top-3 right-3 bg-red-500 rounded-full px-2 py-0.5 text-xs font-bold text-white">
                    -{hotel.discountPercent}%
                  </div>
                )}
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-semibold text-sm leading-tight">{hotel.name}</h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />{hotel.location}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-medium">{hotel.rating}</span>
                    <span className="text-muted-foreground text-xs">({hotel.reviewCount})</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-indigo-600">{formatCurrency(hotel.pricePerNight)}<span className="font-normal text-xs text-muted-foreground">/đêm</span></p>
                    <p className="text-xs line-through text-muted-foreground">{formatCurrency(hotel.originalPricePerNight)}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {(hotel.amenities ?? []).slice(0, 3).map(a => (
                    <span key={a} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{a}</span>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setEditHotel(hotel)}>
                    <Pencil className="h-3 w-3 mr-1" />Sửa
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs hover:text-red-500 hover:border-red-300" onClick={() => handleDelete(hotel.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {hotels.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <p>Chưa có khách sạn nào.</p>
          </div>
        )}
      </div>

      <Dialog open={!!editHotel || showCreate} onOpenChange={() => { setEditHotel(null); setShowCreate(false); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editHotel ? "Chỉnh sửa Khách sạn" : "Thêm Khách sạn"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Tên khách sạn</Label><Input ref={nameRef} defaultValue={editHotel?.name} placeholder="Tên khách sạn..." /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Khu vực</Label><Input ref={locationRef} defaultValue={editHotel?.location} placeholder="Đà Nẵng" /></div>
              <div className="space-y-2"><Label>Số sao</Label><Input ref={starsRef} type="number" defaultValue={editHotel?.stars} min={1} max={5} /></div>
            </div>
            <div className="space-y-2"><Label>Địa chỉ chi tiết</Label><Input ref={addressRef} defaultValue={editHotel?.address} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Giá gốc/đêm</Label><Input ref={originalPriceRef} type="number" defaultValue={editHotel?.originalPricePerNight} /></div>
              <div className="space-y-2"><Label>Giá bán/đêm</Label><Input ref={priceRef} type="number" defaultValue={editHotel?.pricePerNight} /></div>
            </div>
            <div className="space-y-2"><Label>URL hình ảnh</Label><Input ref={imageUrlRef} defaultValue={editHotel?.imageUrl} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditHotel(null); setShowCreate(false); }}>Hủy</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleSave}>
              {editHotel ? "Lưu" : "Tạo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
