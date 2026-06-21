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
import { Switch } from "@/components/ui/switch";
import { usePartners, updateDocById, createDoc } from "@/hooks/useFirestore";
import type { Partner } from "@/types";
import { Plus, Pencil, Star, CheckCircle2, XCircle, MapPin, Phone, Globe, Eye } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";

export default function PartnersPage() {
  const { data: partners, loading, error, refetch } = usePartners();
  const [viewPartner, setViewPartner] = useState<Partner | null>(null);
  const [editPartner, setEditPartner] = useState<Partner | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  // Form refs
  const nameRef = useRef<HTMLInputElement>(null);
  const locationRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const foundedYearRef = useRef<HTMLInputElement>(null);
  const websiteRef = useRef<HTMLInputElement>(null);
  const [formVerified, setFormVerified] = useState(false);

  const handleOpenEdit = (partner: Partner) => {
    setLogoUrl(partner.logoUrl || "");
    setFormVerified(partner.verified);
    setEditPartner(partner);
  };

  const handleOpenCreate = () => {
    setLogoUrl("");
    setFormVerified(false);
    setShowCreate(true);
  };

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn tệp hình ảnh");
      return;
    }

    setUploading(true);
    const toastId = toast.loading("Đang tải ảnh logo lên Supabase...");

    try {
      const supabase = createClient();
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `partners/logos/${fileName}`;

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

      setLogoUrl(publicUrl);
      toast.success("Tải logo thành công!", { id: toastId });
    } catch (err) {
      console.error("Error uploading logo:", err);
      toast.error("Tải logo thất bại: " + (err as Error).message, { id: toastId, duration: 6000 });
    } finally {
      setUploading(false);
    }
  };

  const handleVerifiedToggle = async (row: Partner) => {
    try {
      await updateDocById("partners", row.id, { verified: !row.verified });
      refetch();
      toast.success("Đã cập nhật trạng thái xác minh");
    } catch (e) {
      toast.error("Cập nhật thất bại: " + (e as Error).message);
    }
  };

  const handleSave = async () => {
    try {
      const payload = {
        name: nameRef.current?.value ?? "",
        location: locationRef.current?.value ?? "",
        phone: phoneRef.current?.value ?? "",
        foundedYear: Number(foundedYearRef.current?.value ?? 2020),
        website: websiteRef.current?.value ?? "",
        verified: formVerified,
        logoUrl: logoUrl,
      };
      if (editPartner) {
        await updateDocById("partners", editPartner.id, payload);
        toast.success("Đã cập nhật đối tác");
      } else {
        await createDoc("partners", {
          ...payload,
          bannerUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
          description: "",
          rating: 0,
          reviewCount: 0,
          totalTours: 0,
          followerCount: 0,
          specialties: [],
          brandColor: 0,
          responseRate: "100%",
        });
        toast.success("Đã thêm đối tác mới");
      }
      refetch();
      setEditPartner(null);
      setShowCreate(false);
    } catch (e) {
      toast.error("Lưu thất bại: " + (e as Error).message);
    }
  };

  if (loading) return (
    <div className="page-transition">
      <Header title="Quản lý Đối tác" subtitle="Đang tải..." />
      <PageLoader />
    </div>
  );

  if (error) return (
    <div className="page-transition">
      <Header title="Quản lý Đối tác" subtitle="" />
      <FirestoreError error={error} />
    </div>
  );

  return (
    <div className="page-transition">
      <Header title="Quản lý Đối tác" subtitle={`${partners.length} đối tác liên kết`} />

      <div className="p-6 space-y-5">
        {/* Partner cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {partners.map((p) => (
            <div key={p.id} className="rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <div className="relative h-32">
                <Image src={p.bannerUrl || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400"} alt={p.name} fill className="object-cover" sizes="400px" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-white">
                    <Image src={p.logoUrl || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=40"} alt={p.name} fill className="object-contain p-1" sizes="40px" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{p.name}</p>
                    <div className="flex items-center gap-1">
                      {p.verified ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-400" />
                      )}
                      <span className="text-[10px] text-white/80">
                        {p.verified ? "Đã xác minh" : "Chưa xác minh"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-semibold">{p.rating}</span>
                    <span className="text-muted-foreground">({p.reviewCount})</span>
                  </div>
                  <span className="text-muted-foreground">{p.totalTours} tours</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />{p.location}
                </div>
                <div className="flex flex-wrap gap-1">
                  {(p.specialties ?? []).slice(0, 3).map((s) => (
                    <span key={s} className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                      {s}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Button variant="outline" size="sm" className="flex-1 text-xs gap-1" onClick={() => setViewPartner(p)}>
                    <Eye className="h-3 w-3" /> Xem
                  </Button>
                  <Button size="sm" className="flex-1 text-xs gap-1 bg-indigo-600 hover:bg-indigo-700" onClick={() => handleOpenEdit(p)}>
                    <Pencil className="h-3 w-3" /> Sửa
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {/* Add card */}
          <button
            onClick={handleOpenCreate}
            className="rounded-xl border-2 border-dashed border-border hover:border-indigo-400 bg-card p-8 flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-indigo-600 transition-colors"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
              <Plus className="h-6 w-6 text-indigo-500" />
            </div>
            <span className="text-sm font-medium">Thêm đối tác mới</span>
          </button>
        </div>

        {/* Table */}
        <DataTable
          data={partners}
          searchKeys={["name", "location"]}
          searchPlaceholder="Tìm theo tên đối tác, địa điểm..."
          columns={[
            {
              key: "name",
              label: "Đối tác",
              render: (_, row) => (
                <div className="flex items-center gap-3">
                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-white border">
                    <Image src={row.logoUrl || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=32"} alt={row.name} fill className="object-contain p-1" sizes="32px" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{row.name}</p>
                    <p className="text-xs text-muted-foreground">Thành lập: {row.foundedYear}</p>
                  </div>
                </div>
              ),
            },
            {
              key: "location",
              label: "Địa điểm",
              render: (val) => (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />{val as string}
                </div>
              ),
            },
            {
              key: "rating",
              label: "Đánh giá",
              sortable: true,
              render: (_, row) => (
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-medium">{row.rating}</span>
                  <span className="text-muted-foreground text-xs">({row.reviewCount})</span>
                </div>
              ),
            },
            {
              key: "totalTours",
              label: "Tours",
              sortable: true,
              render: (val) => <span className="text-sm font-medium">{val as number}</span>,
            },
            {
              key: "followerCount",
              label: "Theo dõi",
              sortable: true,
              render: (val) => (
                <span className="text-sm text-muted-foreground">{(val as number).toLocaleString()}</span>
              ),
            },
            {
              key: "responseRate",
              label: "Phản hồi",
              render: (val) => <span className="text-sm font-medium text-emerald-600">{val as string}</span>,
            },
            {
              key: "verified",
              label: "Xác minh",
              render: (_, row) => (
                <Switch checked={row.verified} onCheckedChange={() => handleVerifiedToggle(row)} className="scale-90" />
              ),
            },
          ]}
          actions={(row) => (
            <div className="flex justify-end gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewPartner(row)}>
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(row)}>
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          )}
        />
      </div>

      {/* View partner dialog */}
      <Dialog open={!!viewPartner} onOpenChange={() => setViewPartner(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Thông tin Đối tác</DialogTitle>
          </DialogHeader>
          {viewPartner && (
            <div className="space-y-4">
              <div className="relative h-40 overflow-hidden rounded-xl">
                <Image src={viewPartner.bannerUrl || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=512"} alt={viewPartner.name} fill className="object-cover" sizes="512px" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <h3 className="text-lg font-bold text-white">{viewPartner.name}</h3>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{viewPartner.description}</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />{viewPartner.location}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />{viewPartner.phone}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  <a href={viewPartner.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline truncate">
                    {viewPartner.website}
                  </a>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-semibold">{viewPartner.rating}</span>
                  <span className="text-muted-foreground">/ 5.0</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Chuyên môn</p>
                <div className="flex flex-wrap gap-2">
                  {(viewPartner.specialties ?? []).map((s) => (
                    <span key={s} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit/Create Dialog */}
      <Dialog open={!!editPartner || showCreate} onOpenChange={() => { setEditPartner(null); setShowCreate(false); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editPartner ? "Chỉnh sửa Đối tác" : "Thêm Đối tác mới"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Tên đối tác</Label><Input ref={nameRef} defaultValue={editPartner?.name} placeholder="Tên công ty lữ hành..." /></div>
            <div className="space-y-2">
              <Label>Logo đối tác (Avatar)</Label>
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white border flex items-center justify-center">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo preview" className="h-full w-full object-contain p-1" />
                  ) : (
                    <span className="text-[10px] text-muted-foreground text-center font-medium">No Logo</span>
                  )}
                </div>
                <div className="flex-1 flex gap-2">
                  <Input
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="Đường dẫn URL hoặc chọn tải lên..."
                    className="flex-1"
                  />
                  <div className="relative">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadLogo}
                      disabled={uploading}
                      className="hidden"
                      id="partner-logo-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploading}
                      onClick={() => document.getElementById("partner-logo-upload")?.click()}
                    >
                      {uploading ? "Đang tải..." : "Tải ảnh"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2"><Label>Địa chỉ</Label><Input ref={locationRef} defaultValue={editPartner?.location} placeholder="TP. Hồ Chí Minh" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Số điện thoại</Label><Input ref={phoneRef} defaultValue={editPartner?.phone} /></div>
              <div className="space-y-2"><Label>Năm thành lập</Label><Input ref={foundedYearRef} type="number" defaultValue={editPartner?.foundedYear} /></div>
            </div>
            <div className="space-y-2"><Label>Website</Label><Input ref={websiteRef} defaultValue={editPartner?.website} placeholder="https://" /></div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Đã xác minh</p>
                <p className="text-xs text-muted-foreground">Đối tác đã xác minh pháp lý</p>
              </div>
              <Switch checked={formVerified} onCheckedChange={setFormVerified} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditPartner(null); setShowCreate(false); }}>Hủy</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleSave}>
              {editPartner ? "Lưu thay đổi" : "Tạo đối tác"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
