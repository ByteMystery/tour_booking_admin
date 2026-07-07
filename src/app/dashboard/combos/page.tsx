"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { Combo } from "@/types";
import { Plus, Pencil, Trash2, Star, MapPin, Package, Loader2 } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import {
  useCollection,
  usePartners,
  createDoc,
  updateDocById,
  deleteDocById,
} from "@/hooks/useFirestore";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/utils/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export default function CombosPage() {
  const { admin } = useAuth();
  const { data: combos, loading, error, refetch } = useCollection<Combo>("combos");
  const { data: partners } = usePartners();

  // Modal Form States
  const [showForm, setShowForm] = useState(false);
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null);
  const [uploading, setUploading] = useState(false);

  // Separate states for textarea lists (newline separated string inputs)
  const [highlightsInput, setHighlightsInput] = useState("");
  const [roomTypesInput, setRoomTypesInput] = useState("");
  const [policiesInput, setPoliciesInput] = useState("");

  const initialFormState = {
    name: "",
    destination: "",
    imageUrl: "",
    originalPrice: 0,
    salePrice: 0,
    duration: 3,
    nights: 2,
    description: "",
    partnerId: "",
    rating: 5,
    reviewCount: 0,
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleOpenEdit = (combo: Combo) => {
    setEditingCombo(combo);
    setFormData({
      name: combo.name || "",
      destination: combo.destination || "",
      imageUrl: combo.imageUrl || "",
      originalPrice: combo.originalPrice || 0,
      salePrice: combo.salePrice || 0,
      duration: combo.duration || 3,
      nights: combo.nights || 2,
      description: combo.description || "",
      partnerId: combo.partnerId || "",
      rating: combo.rating || 5,
      reviewCount: combo.reviewCount || 0,
    });
    setHighlightsInput((combo.highlights || []).join("\n"));
    setRoomTypesInput((combo.roomTypes || []).join("\n"));
    setPoliciesInput((combo.policies || []).join("\n"));
    setShowForm(true);
  };

  const handleOpenCreate = () => {
    setEditingCombo(null);
    setFormData({
      ...initialFormState,
      partnerId: admin?.role === "editor" && admin.partnerId ? admin.partnerId : "",
    });
    setHighlightsInput("");
    setRoomTypesInput("");
    setPoliciesInput("");
    setShowForm(true);
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
      const filePath = `combos/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from("Tour")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        if (uploadError.message === "Bucket not found") {
          throw new Error("Không tìm thấy bucket 'Tour' trên Supabase. Vui lòng tạo bucket 'Tour' với thuộc tính Public.");
        }
        if (uploadError.message.includes("violates row-level security") || uploadError.message.includes("policy")) {
          throw new Error("Lỗi phân quyền RLS. Vui lòng cho phép public upload lên bucket 'Tour'.");
        }
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("Tour")
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, imageUrl: publicUrl }));
      toast.success("Tải ảnh lên thành công!", { id: toastId });
    } catch (err) {
      console.error("Error uploading image:", err);
      toast.error("Tải ảnh lên thất bại: " + (err as Error).message, { id: toastId, duration: 6000 });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Vui lòng nhập tên combo");
      return;
    }
    if (!formData.destination.trim()) {
      toast.error("Vui lòng nhập điểm đến");
      return;
    }
    if (!formData.imageUrl.trim()) {
      toast.error("Vui lòng tải ảnh lên hoặc điền URL ảnh");
      return;
    }
    if (!formData.salePrice || formData.salePrice <= 0) {
      toast.error("Vui lòng nhập giá bán hợp lệ");
      return;
    }
    if (!formData.partnerId) {
      toast.error("Vui lòng chọn đối tác");
      return;
    }

    const selectedPartner = partners.find(p => p.id === formData.partnerId);
    if (!selectedPartner) {
      toast.error("Không tìm thấy thông tin đối tác");
      return;
    }

    const originalPrice = Number(formData.originalPrice || 0);
    const salePrice = Number(formData.salePrice || 0);
    const discountPercent = originalPrice > 0 && salePrice < originalPrice
      ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
      : 0;

    const highlights = highlightsInput.split("\n").map(s => s.trim()).filter(Boolean);
    const roomTypes = roomTypesInput.split("\n").map(s => s.trim()).filter(Boolean);
    const policies = policiesInput.split("\n").map(s => s.trim()).filter(Boolean);

    const payload = {
      ...formData,
      originalPrice,
      salePrice,
      discountPercent,
      duration: Number(formData.duration || 1),
      nights: Number(formData.nights || 0),
      rating: Number(formData.rating || 5),
      reviewCount: Number(formData.reviewCount || 0),
      highlights,
      roomTypes,
      policies,
      partnerName: selectedPartner.name || "",
      partnerLogoUrl: selectedPartner.logoUrl || "",
      partnerRating: selectedPartner.rating || 5,
    };

    const toastId = toast.loading("Đang lưu combo...");
    try {
      if (editingCombo) {
        await updateDocById("combos", editingCombo.id, payload);
        toast.success("Cập nhật combo thành công!", { id: toastId });
      } else {
        await createDoc("combos", payload);
        toast.success("Thêm combo mới thành công!", { id: toastId });
      }
      refetch();
      setShowForm(false);
    } catch (e) {
      toast.error("Lưu thất bại: " + (e as Error).message, { id: toastId });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa combo này?")) return;
    const toastId = toast.loading("Đang xóa combo...");
    try {
      await deleteDocById("combos", id);
      toast.success("Xóa combo thành công!", { id: toastId });
      refetch();
    } catch (e) {
      toast.error("Xóa thất bại: " + (e as Error).message, { id: toastId });
    }
  };

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
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700" onClick={handleOpenCreate}>
            <Plus className="h-4 w-4" />
            Tạo Combo mới
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredCombos.map((combo) => {
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
                    <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                      Đối tác: {combo.partnerName || "N/A"}
                    </span>
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="outline" className="gap-1 text-xs px-2.5 h-8" onClick={() => handleOpenEdit(combo)}>
                        <Pencil className="h-3 w-3" />Sửa
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300 px-2.5 h-8" onClick={() => handleDelete(combo.id)}>
                        <Trash2 className="h-3 w-3" />Xóa
                      </Button>
                    </div>
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

      {/* Form Modal Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCombo ? "Chỉnh sửa Combo" : "Tạo Combo mới"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tên Combo *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Combo Hà Nội - Phú Quốc 3N2Đ"
                />
              </div>
              <div className="space-y-2">
                <Label>Điểm đến *</Label>
                <Input
                  value={formData.destination}
                  onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
                  placeholder="Phú Quốc"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Hình ảnh Combo *</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.imageUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
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
                    id="combo-image-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploading}
                    onClick={() => document.getElementById("combo-image-upload")?.click()}
                  >
                    {uploading ? "Đang tải..." : "Tải ảnh"}
                  </Button>
                </div>
              </div>
              {formData.imageUrl && (
                <div className="relative h-28 w-44 rounded-lg overflow-hidden border mt-2">
                  <Image src={formData.imageUrl} alt="Preview" fill className="object-cover" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Giá gốc (để gạch đi, ví dụ 5000000)</Label>
                <Input
                  type="number"
                  value={formData.originalPrice || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, originalPrice: Number(e.target.value) }))}
                  placeholder="5000000"
                />
              </div>
              <div className="space-y-2">
                <Label>Giá bán (Giá khuyến mãi thực tế) *</Label>
                <Input
                  type="number"
                  value={formData.salePrice || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, salePrice: Number(e.target.value) }))}
                  placeholder="3990000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Số ngày *</Label>
                <Input
                  type="number"
                  value={formData.duration || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: Number(e.target.value) }))}
                  min={1}
                />
              </div>
              <div className="space-y-2">
                <Label>Số đêm *</Label>
                <Input
                  type="number"
                  value={formData.nights || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, nights: Number(e.target.value) }))}
                  min={0}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Đánh giá (1-5)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min={1}
                  max={5}
                  value={formData.rating || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, rating: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Số lượt đánh giá</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.reviewCount || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, reviewCount: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Đối tác cung cấp *</Label>
              {admin?.role === "editor" && admin.partnerId ? (
                <div className="p-2 border rounded-md bg-muted text-sm font-medium">
                  {partners?.find(p => p.id === admin.partnerId)?.name || "Đang xác định đối tác..."}
                </div>
              ) : (
                <Select
                  value={formData.partnerId}
                  onValueChange={(val) => setFormData(prev => ({ ...prev, partnerId: val }))}
                >
                  <SelectTrigger><SelectValue placeholder="Chọn đối tác" /></SelectTrigger>
                  <SelectContent>
                    {partners?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label>Mô tả chi tiết</Label>
              <textarea
                className="w-full text-sm rounded-md border border-input bg-transparent px-3 py-2 shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Nhập mô tả chi tiết về combo du lịch..."
              />
            </div>

            <div className="space-y-2">
              <Label>Điểm nổi bật (Mỗi dòng một ý)</Label>
              <textarea
                className="w-full text-sm rounded-md border border-input bg-transparent px-3 py-2 shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                rows={3}
                value={highlightsInput}
                onChange={(e) => setHighlightsInput(e.target.value)}
                placeholder="Ví dụ:&#10;Vé máy bay khứ hồi Vietjet&#10;Khách sạn 4 sao sát biển&#10;Buffet sáng mỗi ngày"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Các loại phòng (Mỗi dòng một loại)</Label>
                <textarea
                  className="w-full text-sm rounded-md border border-input bg-transparent px-3 py-2 shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  rows={3}
                  value={roomTypesInput}
                  onChange={(e) => setRoomTypesInput(e.target.value)}
                  placeholder="Ví dụ:&#10;Phòng Deluxe hướng biển&#10;Phòng Suite cao cấp"
                />
              </div>
              <div className="space-y-2">
                <Label>Chính sách Combo (Mỗi dòng một dòng)</Label>
                <textarea
                  className="w-full text-sm rounded-md border border-input bg-transparent px-3 py-2 shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  rows={3}
                  value={policiesInput}
                  onChange={(e) => setPoliciesInput(e.target.value)}
                  placeholder="Ví dụ:&#10;Được hoàn hủy trước 7 ngày&#10;Không áp dụng lễ tết"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Hủy</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleSave} disabled={uploading}>
              {editingCombo ? "Lưu thay đổi" : "Tạo mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
