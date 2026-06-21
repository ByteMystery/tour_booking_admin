"use client";

import { useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Header } from "@/components/layout/Header";
import { DataTable } from "@/components/shared/DataTable";
import { PageLoader } from "@/components/shared/PageLoader";
import { FirestoreError } from "@/components/shared/FirestoreError";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDestinations, deleteDocById, updateDocById, createDoc } from "@/hooks/useFirestore";
import type { Destination } from "@/types";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";

export default function DestinationsPage() {
  const { data: destinations, loading, error, refetch } = useDestinations();
  const [editDest, setEditDest] = useState<Destination | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  // Form refs
  const nameRef = useRef<HTMLInputElement>(null);
  const provinceRef = useRef<HTMLInputElement>(null);
  const rankRef = useRef<HTMLInputElement>(null);
  const ratingRef = useRef<HTMLInputElement>(null);

  const handleOpenEdit = (dest: Destination) => {
    setImageUrl(dest.imageUrl || "");
    setEditDest(dest);
  };

  const handleOpenCreate = () => {
    setImageUrl("");
    setShowCreate(true);
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn tệp hình ảnh");
      return;
    }

    setUploading(true);
    const toastId = toast.loading("Đang tải ảnh lên Supabase...");

    try {
      const supabase = createClient();
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `destinations/${fileName}`;

      const { data, error } = await supabase.storage
        .from("Tour")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        if (error.message === "Bucket not found") {
          throw new Error("Không tìm thấy bucket 'Tour' trên Supabase. Vui lòng vào trang quản trị Supabase Storage tạo bucket tên 'Tour' với thuộc tính Public.");
        }
        if (error.message.includes("violates row-level security") || error.message.includes("policy")) {
          throw new Error("Lỗi phân quyền RLS. Vui lòng thêm Policy cho phép 'Insert/Upload' công khai (Public/Anon) trên bucket 'Tour'.");
        }
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("Tour")
        .getPublicUrl(filePath);

      setImageUrl(publicUrl);
      toast.success("Tải ảnh lên thành công!", { id: toastId });
    } catch (err) {
      console.error("Error uploading image:", err);
      toast.error("Tải ảnh lên thất bại: " + (err as Error).message, { id: toastId, duration: 6000 });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDocById("destinations", id);
      refetch();
      toast.success("Đã xóa điểm đến");
    } catch (e) {
      toast.error("Xóa thất bại: " + (e as Error).message);
    }
  };

  const handleSave = async () => {
    try {
      const payload = {
        name: nameRef.current?.value ?? "",
        province: provinceRef.current?.value ?? "",
        imageUrl: imageUrl,
        rank: Number(rankRef.current?.value ?? 1),
        rating: Number(ratingRef.current?.value ?? 4.5),
      };
      if (editDest) {
        await updateDocById("destinations", editDest.id, payload);
        toast.success("Đã cập nhật");
      } else {
        await createDoc("destinations", { ...payload, reviewCount: 0 });
        toast.success("Đã thêm điểm đến");
      }
      refetch();
      setEditDest(null);
      setShowCreate(false);
    } catch (e) {
      toast.error("Lưu thất bại: " + (e as Error).message);
    }
  };

  if (loading) return (
    <div className="page-transition">
      <Header title="Điểm đến gợi ý" subtitle="Đang tải..." />
      <PageLoader />
    </div>
  );

  if (error) return (
    <div className="page-transition">
      <Header title="Điểm đến gợi ý" subtitle="" />
      <FirestoreError error={error} />
    </div>
  );

  return (
    <div className="page-transition">
      <Header title="Điểm đến gợi ý" subtitle="Quản lý các điểm đến hiển thị trên màn hình khám phá" />

      <div className="p-6 space-y-5">
        {/* Card grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...destinations]
            .sort((a, b) => a.rank - b.rank)
            .map((dest) => (
              <div key={dest.id} className="group relative overflow-hidden rounded-xl border shadow-sm hover:shadow-md transition-all">
                <div className="relative h-28">
                  <Image src={dest.imageUrl} alt={dest.name} fill className="object-cover" sizes="200px" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-2 left-2">
                    <p className="text-sm font-semibold text-white">{dest.name}</p>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs text-white/90">{dest.rating}</span>
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-black/40 text-xs font-bold text-white">
                    {dest.rank}
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 bg-black/30 transition-opacity">
                  <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => handleOpenEdit(dest)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="secondary" className="h-8 w-8 hover:bg-red-100 hover:text-red-600" onClick={() => handleDelete(dest.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          <button
            onClick={handleOpenCreate}
            className="flex h-28 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-muted-foreground hover:border-indigo-400 hover:text-indigo-600 transition-colors"
          >
            <Plus className="h-6 w-6" />
            <span className="text-xs">Thêm</span>
          </button>
        </div>

        <DataTable
          data={destinations}
          searchKeys={["name", "province"]}
          searchPlaceholder="Tìm theo tên điểm đến, tỉnh thành..."
          columns={[
            {
              key: "name",
              label: "Điểm đến",
              render: (_, row) => (
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-lg">
                    <Image src={row.imageUrl} alt={row.name} fill className="object-cover" sizes="56px" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{row.name}</p>
                    <p className="text-xs text-muted-foreground">{row.province}</p>
                  </div>
                </div>
              ),
            },
            {
              key: "rank",
              label: "Xếp hạng",
              sortable: true,
              render: (val) => (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                  {val as number}
                </div>
              ),
            },
            {
              key: "rating",
              label: "Điểm đánh giá",
              sortable: true,
              render: (_, row) => (
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-medium">{row.rating}</span>
                  <span className="text-muted-foreground">({row.reviewCount.toLocaleString()})</span>
                </div>
              ),
            },
          ]}
          actions={(row) => (
            <div className="flex justify-end gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(row)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-500" onClick={() => handleDelete(row.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        />
      </div>

      <Dialog open={!!editDest || showCreate} onOpenChange={() => { setEditDest(null); setShowCreate(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editDest ? "Chỉnh sửa Điểm đến" : "Thêm Điểm đến"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Tên điểm đến</Label><Input ref={nameRef} defaultValue={editDest?.name} placeholder="Đà Nẵng" /></div>
            <div className="space-y-2"><Label>Tỉnh/Thành phố</Label><Input ref={provinceRef} defaultValue={editDest?.province} placeholder="Đà Nẵng" /></div>
            <div className="space-y-2">
              <Label>URL hình ảnh</Label>
              <div className="flex gap-2">
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1"
                />
                <div className="relative">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadImage}
                    disabled={uploading}
                    className="hidden"
                    id="dest-image-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploading}
                    onClick={() => document.getElementById("dest-image-upload")?.click()}
                  >
                    {uploading ? "Đang tải..." : "Tải ảnh lên"}
                  </Button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Thứ hạng</Label><Input ref={rankRef} type="number" defaultValue={editDest?.rank} min={1} /></div>
              <div className="space-y-2"><Label>Điểm đánh giá</Label><Input ref={ratingRef} type="number" step="0.1" defaultValue={editDest?.rating} min={0} max={5} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditDest(null); setShowCreate(false); }}>Hủy</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleSave}>
              {editDest ? "Lưu" : "Tạo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
