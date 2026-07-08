"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Header } from "@/components/layout/Header";
import { DataTable } from "@/components/shared/DataTable";
import { PageLoader } from "@/components/shared/PageLoader";
import { FirestoreError } from "@/components/shared/FirestoreError";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useArticles, deleteDocById, createDoc, updateDocById } from "@/hooks/useFirestore";
import { Plus, Pencil, Trash2, Clock, Upload, Loader2, Image as ImageIcon } from "lucide-react";
import type { Article } from "@/types";
import Image from "next/image";
import toast from "react-hot-toast";

const tagColors: Record<string, string> = {
  "Cẩm nang": "bg-indigo-100 text-indigo-700",
  "Ẩm thực": "bg-orange-100 text-orange-700",
  "Mẹo du lịch": "bg-emerald-100 text-emerald-700",
  "Điểm đến": "bg-blue-100 text-blue-700",
};

export default function ArticlesPage() {
  const { data: articles, loading, error, refetch } = useArticles();
  const [editArticle, setEditArticle] = useState<Article | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [uploading, setUploading] = useState(false);

  const initialFormState: Partial<Article> = {
    title: "",
    tag: "Cẩm nang",
    readTime: "5 phút đọc",
    imageUrl: "",
    order: 0,
  };

  const [formData, setFormData] = useState<Partial<Article>>(initialFormState);

  const openCreate = () => {
    setFormData(initialFormState);
    setShowCreate(true);
  };

  const openEdit = (article: Article) => {
    setFormData({ ...article });
    setEditArticle(article);
  };

  const closeForm = () => {
    setEditArticle(null);
    setShowCreate(false);
    setFormData(initialFormState);
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn tệp hình ảnh");
      return;
    }

    setUploading(true);
    const toastId = toast.loading("Đang tải ảnh bài viết lên Supabase...");

    try {
      const supabase = createClient();
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `articles/${fileName}`;

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

      setFormData((prev) => ({
        ...prev,
        imageUrl: publicUrl,
      }));
      toast.success("Tải ảnh lên thành công!", { id: toastId });
    } catch (err) {
      console.error("Error uploading image:", err);
      toast.error("Tải ảnh lên thất bại: " + (err as Error).message, { id: toastId, duration: 6000 });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.title?.trim()) {
        toast.error("Vui lòng nhập tiêu đề bài viết");
        return;
      }
      if (!formData.tag?.trim()) {
        toast.error("Vui lòng chọn hoặc nhập tag phân loại");
        return;
      }
      if (!formData.readTime?.trim()) {
        toast.error("Vui lòng nhập thời gian đọc");
        return;
      }
      if (!formData.imageUrl?.trim()) {
        toast.error("Vui lòng tải lên ảnh đại diện bài viết");
        return;
      }

      const payload = {
        title: formData.title.trim(),
        tag: formData.tag.trim(),
        readTime: formData.readTime.trim(),
        imageUrl: formData.imageUrl.trim(),
        order: Number(formData.order ?? 0),
      };

      if (editArticle) {
        await updateDocById("articles", editArticle.id, payload);
        toast.success("Đã cập nhật bài viết thành công");
      } else {
        await createDoc("articles", payload);
        toast.success("Đã thêm bài viết mới thành công");
      }
      refetch();
      closeForm();
    } catch (e) {
      toast.error("Lưu thất bại: " + (e as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDocById("articles", id);
      refetch();
      toast.success("Đã xóa bài viết");
    } catch (e) {
      toast.error("Xóa thất bại: " + (e as Error).message);
    }
  };

  if (loading) return (
    <div className="page-transition">
      <Header title="Bài viết & Cẩm nang" subtitle="Đang tải..." />
      <PageLoader />
    </div>
  );

  if (error) return (
    <div className="page-transition">
      <Header title="Bài viết & Cẩm nang" subtitle="" />
      <FirestoreError error={error} />
    </div>
  );

  return (
    <div className="page-transition">
      <Header title="Bài viết & Cẩm nang" subtitle="Quản lý nội dung bài viết trên ứng dụng" />

      <div className="p-6 space-y-5">
        <div className="flex justify-end">
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Viết bài mới
          </Button>
        </div>

        <DataTable
          data={articles}
          searchKeys={["title", "tag"]}
          searchPlaceholder="Tìm theo tiêu đề, tag..."
          columns={[
            {
              key: "title",
              label: "Bài viết",
              render: (_, row) => (
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg">
                    {row.imageUrl ? (
                      <Image src={row.imageUrl} alt={row.title} fill className="object-cover" sizes="64px" />
                    ) : (
                      <div className="h-full w-full bg-slate-100 flex items-center justify-center">
                        <ImageIcon className="h-4 w-4 text-slate-400" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate max-w-xs">{row.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${tagColors[row.tag] ?? "bg-gray-100 text-gray-600"}`}>
                        {row.tag}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />{row.readTime}
                      </div>
                    </div>
                  </div>
                </div>
              ),
            },
            {
              key: "order",
              label: "Thứ tự",
              sortable: true,
              render: (val) => (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-sm font-bold">
                  {(val as number) + 1}
                </div>
              ),
            },
          ]}
          actions={(row) => (
            <div className="flex justify-end gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(row)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-500" onClick={() => handleDelete(row.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        />
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={!!editArticle || showCreate} onOpenChange={(open) => { if (!open) closeForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editArticle ? "Chỉnh sửa bài viết" : "Viết bài mới"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="title">Tiêu đề bài viết</Label>
              <Input
                id="title"
                placeholder="Nhập tiêu đề bài viết..."
                value={formData.title || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="tag">Tag phân loại</Label>
                <Select
                  value={formData.tag || ""}
                  onValueChange={(val) => setFormData(prev => ({ ...prev, tag: val }))}
                >
                  <SelectTrigger id="tag">
                    <SelectValue placeholder="Chọn tag..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(tagColors).map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="readTime">Thời gian đọc</Label>
                <Input
                  id="readTime"
                  placeholder="Ví dụ: 5 phút đọc"
                  value={formData.readTime || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, readTime: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="order">Thứ tự hiển thị (từ 0)</Label>
                <Input
                  id="order"
                  type="number"
                  placeholder="0"
                  value={formData.order === undefined ? "" : formData.order}
                  onChange={(e) => setFormData(prev => ({ ...prev, order: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Ảnh đại diện bài viết</Label>
              <div className="flex gap-4 items-start">
                <div className="relative h-28 w-40 overflow-hidden rounded-xl border bg-muted flex items-center justify-center shrink-0">
                  {formData.imageUrl ? (
                    <Image src={formData.imageUrl} alt="Ảnh xem trước" fill className="object-cover" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      id="imageUrl"
                      placeholder="Đường dẫn ảnh hoặc tải ảnh bên dưới..."
                      value={formData.imageUrl || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                      className="text-xs"
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadImage}
                      className="hidden"
                      id="article-image-upload"
                      disabled={uploading}
                    />
                    <Label
                      htmlFor="article-image-upload"
                      className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Đang tải lên...
                        </>
                      ) : (
                        <>
                          <Upload className="h-3.5 w-3.5" />
                          Tải ảnh từ máy tính
                        </>
                      )}
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeForm}>Hủy</Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">Lưu lại</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
