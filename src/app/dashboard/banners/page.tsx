"use client";

import { useState, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { PageLoader } from "@/components/shared/PageLoader";
import { FirestoreError } from "@/components/shared/FirestoreError";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBanners, deleteDocById, updateDocById, createDoc } from "@/hooks/useFirestore";
import type { Banner } from "@/types";
import { Plus, Pencil, Trash2, GripVertical, ImageIcon } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";

export default function BannersPage() {
  const { data: banners, loading, error, refetch } = useBanners();
  const [editBanner, setEditBanner] = useState<Banner | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // Form refs
  const titleRef = useRef<HTMLInputElement>(null);
  const subtitleRef = useRef<HTMLInputElement>(null);
  const buttonTextRef = useRef<HTMLInputElement>(null);
  const imageUrlRef = useRef<HTMLInputElement>(null);
  const orderRef = useRef<HTMLInputElement>(null);

  const handleDelete = async (id: string) => {
    try {
      await deleteDocById("banners", id);
      refetch();
      toast.success("Đã xóa banner");
    } catch (e) {
      toast.error("Xóa thất bại: " + (e as Error).message);
    }
  };

  const handleSave = async () => {
    try {
      const payload = {
        title: titleRef.current?.value ?? "",
        subtitle: subtitleRef.current?.value ?? "",
        buttonText: buttonTextRef.current?.value ?? "",
        imageUrl: imageUrlRef.current?.value ?? "",
        order: Number(orderRef.current?.value ?? 0),
      };
      if (editBanner) {
        await updateDocById("banners", editBanner.id, payload);
        toast.success("Đã cập nhật banner");
      } else {
        await createDoc("banners", payload);
        toast.success("Đã thêm banner mới");
      }
      refetch();
      setEditBanner(null);
      setShowCreate(false);
    } catch (e) {
      toast.error("Lưu thất bại: " + (e as Error).message);
    }
  };

  if (loading) return (
    <div className="page-transition">
      <Header title="Quản lý Banner" subtitle="Đang tải..." />
      <PageLoader />
    </div>
  );

  if (error) return (
    <div className="page-transition">
      <Header title="Quản lý Banner" subtitle="" />
      <FirestoreError error={error} />
    </div>
  );

  return (
    <div className="page-transition">
      <Header title="Quản lý Banner" subtitle="Banner khuyến mãi hiển thị trên trang chủ ứng dụng" />

      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Kéo để sắp xếp thứ tự hiển thị. Tối đa 5 banner cùng lúc.
          </p>
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            Thêm Banner
          </Button>
        </div>

        <div className="space-y-3">
          {[...banners]
            .sort((a, b) => a.order - b.order)
            .map((banner) => (
              <div
                key={banner.id}
                className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className="cursor-grab text-muted-foreground hover:text-foreground">
                  <GripVertical className="h-5 w-5" />
                </div>
                <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg">
                  {banner.imageUrl ? (
                    <Image src={banner.imageUrl} alt={banner.title} fill className="object-cover" sizes="128px" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-muted">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{banner.title}</p>
                  <p className="text-sm text-muted-foreground">{banner.subtitle}</p>
                  <span className="inline-block mt-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                    CTA: {banner.buttonText}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center justify-center h-7 w-7 rounded-full bg-muted text-xs font-bold">
                    #{banner.order + 1}
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditBanner(banner)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-500" onClick={() => handleDelete(banner.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
        </div>

        {banners.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mb-3 opacity-30" />
            <p>Chưa có banner nào. Hãy thêm banner đầu tiên!</p>
          </div>
        )}
      </div>

      {/* Edit/Create dialog */}
      <Dialog open={!!editBanner || showCreate} onOpenChange={() => { setEditBanner(null); setShowCreate(false); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editBanner ? "Chỉnh sửa Banner" : "Thêm Banner mới"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Tiêu đề chính</Label>
              <Input ref={titleRef} defaultValue={editBanner?.title} placeholder="Khám phá Việt Nam" />
            </div>
            <div className="space-y-2">
              <Label>Tiêu đề phụ</Label>
              <Input ref={subtitleRef} defaultValue={editBanner?.subtitle} placeholder="Ưu đãi hè lên đến 40%" />
            </div>
            <div className="space-y-2">
              <Label>Nội dung nút CTA</Label>
              <Input ref={buttonTextRef} defaultValue={editBanner?.buttonText} placeholder="Đặt tour ngay" />
            </div>
            <div className="space-y-2">
              <Label>URL hình ảnh</Label>
              <Input ref={imageUrlRef} defaultValue={editBanner?.imageUrl} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Thứ tự hiển thị</Label>
              <Input ref={orderRef} type="number" defaultValue={editBanner?.order ?? banners.length} min={0} />
            </div>
            {editBanner?.imageUrl && (
              <div className="relative h-32 overflow-hidden rounded-xl">
                <Image src={editBanner.imageUrl} alt="Preview" fill className="object-cover" sizes="512px" />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <span className="text-white text-xs">Preview</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditBanner(null); setShowCreate(false); }}>Hủy</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleSave}>
              {editBanner ? "Lưu thay đổi" : "Tạo Banner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
