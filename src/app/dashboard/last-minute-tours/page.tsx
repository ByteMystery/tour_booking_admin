"use client";

import { useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Header } from "@/components/layout/Header";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PageLoader } from "@/components/shared/PageLoader";
import { FirestoreError } from "@/components/shared/FirestoreError";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useCollection, updateDocById, deleteDocById, createDoc, usePartners } from "@/hooks/useFirestore";
import { useAuth } from "@/contexts/AuthContext";
import { where, orderBy } from "firebase/firestore";
import { formatCurrency, formatNumber, getStatusLabel, cn } from "@/lib/utils";
import type { LastMinuteTour } from "@/types";
import {
  Plus,
  Pencil,
  Trash2,
  Star,
  MapPin,
  Globe,
  Home,
  Eye,
  Upload,
  Check,
  Lightbulb,
  LayoutGrid,
  Calendar,
  Image as ImageIcon,
  FileText,
  Sparkles,
  CheckCircle2,
  XCircle,
  Info,
  Save,
  Route,
} from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";

export default function LastMinuteToursPage() {
  const { admin } = useAuth();
  const { data: tours, loading, error, refetch } = useCollection<LastMinuteTour>(
    "last_minute_tours",
    admin?.role === "editor" && admin.partnerId
      ? [where("partnerId", "==", admin.partnerId), orderBy("createdAt", "desc")]
      : [orderBy("createdAt", "desc")]
  );
  const { data: partners } = usePartners();

  const [regionFilter, setRegionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editTour, setEditTour] = useState<LastMinuteTour | null>(null);
  const [viewTour, setViewTour] = useState<LastMinuteTour | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [schedCityFilter, setSchedCityFilter] = useState("all");
  const [schedMonthFilter, setSchedMonthFilter] = useState("all");
  const [dragActive, setDragActive] = useState(false);
  const [draggedPhotoIndex, setDraggedPhotoIndex] = useState<number | null>(null);

  // Form State
  const initialFormState: Partial<LastMinuteTour> = {
    name: "",
    destination: "",
    province: "",
    imageUrl: "",
    images: [],
    originalPrice: 0,
    salePrice: 0,
    discountPercent: 0,
    duration: 1,
    nights: 1,
    departureSchedule: "",
    category: "",
    region: "domestic",
    tourType: "tour",
    status: "active",
    accommodation: "",
    isPopular: false,
    isFeatured: false,
    highlights: [],
    description: "",
    includes: [],
    excludes: [],
    itinerary: [],
    departureCities: [],
    schedules: [],
    partnerId: "",
  };

  const [formData, setFormData] = useState<Partial<LastMinuteTour>>(initialFormState);

  // Temp states for lists
  const [tempHighlight, setTempHighlight] = useState("");
  const [tempInclude, setTempInclude] = useState("");
  const [tempExclude, setTempExclude] = useState("");
  const [tempCity, setTempCity] = useState("");

  // Temp states for Itinerary
  const [tempItinDay, setTempItinDay] = useState<number>(1);
  const [tempItinTitle, setTempItinTitle] = useState("");
  const [tempItinDesc, setTempItinDesc] = useState("");

  // Temp states for Schedules
  const [tempSchedDate, setTempSchedDate] = useState("");
  const [tempSchedPrice, setTempSchedPrice] = useState<number>(0);
  const [tempSchedCity, setTempSchedCity] = useState("");
  const [tempSchedSlots, setTempSchedSlots] = useState<number>(10);
  const [tempSchedStatus, setTempSchedStatus] = useState<"available" | "full" | "soldout">("available");

  const openEdit = (tour: LastMinuteTour) => {
    setFormData({ ...tour });
    setEditTour(tour);
    // Initialize next day for itinerary
    setTempItinDay((tour.itinerary?.length || 0) + 1);
  };

  const openCreate = () => {
    setFormData({ ...initialFormState });
    setShowCreate(true);
    setTempItinDay(1);
  };

  const closeForm = () => {
    setEditTour(null);
    setShowCreate(false);
    setFormData(initialFormState);
    // Reset temp inputs
    setTempHighlight("");
    setTempInclude("");
    setTempExclude("");
    setTempCity("");
    setTempItinTitle("");
    setTempItinDesc("");
    setTempSchedDate("");
    setTempSchedPrice(0);
    setTempSchedCity("");
    setTempSchedSlots(10);
    setTempSchedStatus("available");
  };

  const handleUploadCoverImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn tệp hình ảnh");
      return;
    }

    setUploading(true);
    const toastId = toast.loading("Đang tải ảnh đại diện lên Supabase...");

    try {
      const supabase = createClient();
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `last_minute_tours/${fileName}`;

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

      setFormData((prev) => {
        const currentImages = prev.images || [];
        const newImages = currentImages.includes(publicUrl) ? currentImages : [...currentImages, publicUrl];
        return {
          ...prev,
          imageUrl: publicUrl,
          images: newImages
        };
      });
      toast.success("Tải ảnh lên thành công!", { id: toastId });
    } catch (err) {
      console.error("Error uploading image:", err);
      toast.error("Tải ảnh lên thất bại: " + (err as Error).message, { id: toastId, duration: 6000 });
    } finally {
      setUploading(false);
    }
  };

  const handleUploadGalleryImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentImages = formData.images || [];
    if (currentImages.length + files.length > 10) {
      toast.error("Bạn chỉ có thể tải lên tối đa 10 hình ảnh cho tour");
      return;
    }

    setUploading(true);
    const toastId = toast.loading(`Đang tải lên ${files.length} ảnh...`);
    let successCount = 0;
    const uploadedUrls: string[] = [];

    try {
      const supabase = createClient();
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) continue;

        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `last_minute_tours/gallery/${fileName}`;

        const { data, error } = await supabase.storage
          .from("Tour")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) continue;

        const { data: { publicUrl } } = supabase.storage
          .from("Tour")
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
        successCount++;
      }

      if (uploadedUrls.length > 0) {
        setFormData(prev => {
          const newImages = [...(prev.images || []), ...uploadedUrls];
          const newImageUrl = prev.imageUrl || newImages[0] || "";
          return {
            ...prev,
            images: newImages,
            imageUrl: newImageUrl
          };
        });
        toast.success(`Đã tải lên thành công ${successCount}/${files.length} ảnh!`, { id: toastId });
      } else {
        toast.error("Không có ảnh nào được tải lên thành công", { id: toastId });
      }
    } catch (err) {
      console.error("Error uploading gallery images:", err);
      toast.error("Tải ảnh thất bại: " + (err as Error).message, { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const removeImageFromGallery = (urlToRemove: string) => {
    setFormData(prev => {
      const newImages = (prev.images || []).filter(url => url !== urlToRemove);
      let newImageUrl = prev.imageUrl;
      if (prev.imageUrl === urlToRemove) {
        newImageUrl = newImages[0] || "";
      }
      return {
        ...prev,
        images: newImages,
        imageUrl: newImageUrl
      };
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = e.dataTransfer.files;
      const currentImages = formData.images || [];
      if (currentImages.length + files.length > 10) {
        toast.error("Bạn chỉ có thể tải lên tối đa 10 hình ảnh cho tour");
        return;
      }

      setUploading(true);
      const toastId = toast.loading(`Đang tải lên ${files.length} ảnh...`);
      let successCount = 0;
      const uploadedUrls: string[] = [];

      try {
        const supabase = createClient();
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (!file.type.startsWith("image/")) continue;

          const fileExt = file.name.split(".").pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
          const filePath = `last_minute_tours/gallery/${fileName}`;

          const { data, error } = await supabase.storage
            .from("Tour")
            .upload(filePath, file, {
              cacheControl: "3600",
              upsert: false,
            });

          if (error) continue;

          const { data: { publicUrl } } = supabase.storage
            .from("Tour")
            .getPublicUrl(filePath);

          uploadedUrls.push(publicUrl);
          successCount++;
        }

        if (uploadedUrls.length > 0) {
          setFormData(prev => {
            const newImages = [...(prev.images || []), ...uploadedUrls];
            const newImageUrl = prev.imageUrl || newImages[0] || "";
            return {
              ...prev,
              images: newImages,
              imageUrl: newImageUrl
            };
          });
          toast.success(`Đã tải lên thành công ${successCount}/${files.length} ảnh!`, { id: toastId });
        } else {
          toast.error("Không có ảnh nào được tải lên thành công", { id: toastId });
        }
      } catch (err) {
        console.error(err);
        toast.error("Tải ảnh thất bại: " + (err as Error).message, { id: toastId });
      } finally {
        setUploading(false);
      }
    }
  };

  const handlePhotoDragStart = (index: number) => {
    setDraggedPhotoIndex(index);
  };

  const handlePhotoDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handlePhotoDrop = (index: number) => {
    if (draggedPhotoIndex === null || draggedPhotoIndex === index) return;
    const currentImages = [...(formData.images || [])];
    const draggedItem = currentImages[draggedPhotoIndex];
    currentImages.splice(draggedPhotoIndex, 1);
    currentImages.splice(index, 0, draggedItem);
    setFormData(prev => ({
      ...prev,
      images: currentImages
    }));
    setDraggedPhotoIndex(null);
  };

  const addHighlight = (text: string) => {
    if (!text.trim()) return;
    setFormData(prev => ({
      ...prev,
      highlights: [...(prev.highlights || []), text.trim()]
    }));
  };

  const removeHighlight = (index: number) => {
    setFormData(prev => ({
      ...prev,
      highlights: (prev.highlights || []).filter((_, i) => i !== index)
    }));
  };

  const addInclude = (text: string) => {
    if (!text.trim()) return;
    setFormData(prev => ({
      ...prev,
      includes: [...(prev.includes || []), text.trim()]
    }));
  };

  const removeInclude = (index: number) => {
    setFormData(prev => ({
      ...prev,
      includes: (prev.includes || []).filter((_, i) => i !== index)
    }));
  };

  const addExclude = (text: string) => {
    if (!text.trim()) return;
    setFormData(prev => ({
      ...prev,
      excludes: [...(prev.excludes || []), text.trim()]
    }));
  };

  const removeExclude = (index: number) => {
    setFormData(prev => ({
      ...prev,
      excludes: (prev.excludes || []).filter((_, i) => i !== index)
    }));
  };

  const addDepartureCity = (text: string) => {
    if (!text.trim()) return;
    setFormData(prev => ({
      ...prev,
      departureCities: [...(prev.departureCities || []), text.trim()]
    }));
  };

  const removeDepartureCity = (index: number) => {
    setFormData(prev => ({
      ...prev,
      departureCities: (prev.departureCities || []).filter((_, i) => i !== index)
    }));
  };

  const addItineraryItem = (day: number, title: string, desc: string) => {
    if (!title.trim() || !desc.trim()) {
      toast.error("Vui lòng điền đủ tiêu đề và nội dung chi tiết");
      return;
    }
    const newItem = { day, title: title.trim(), description: desc.trim() };
    setFormData(prev => {
      const items = [...(prev.itinerary || []), newItem];
      items.sort((a, b) => a.day - b.day);
      return { ...prev, itinerary: items };
    });
  };

  const removeItineraryItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      itinerary: (prev.itinerary || []).filter((_, i) => i !== index)
    }));
  };

  const addScheduleItem = (date: string, price: number, departureCity: string, availableSlots: number, status: "available" | "full" | "soldout") => {
    const formattedDate = date.includes("T") ? date : `${date}T00:00:00.000`;
    const newItem = { date: formattedDate, price, departureCity: departureCity.trim(), availableSlots, status };
    setFormData(prev => {
      const items = [...(prev.schedules || []), newItem];
      items.sort((a, b) => a.date.localeCompare(b.date));
      return { ...prev, schedules: items };
    });
  };

  const removeScheduleItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      schedules: (prev.schedules || []).filter((_, i) => i !== index)
    }));
  };

  const schedCities = Array.from(new Set([
    ...(formData.departureCities || []),
    ...(formData.schedules || []).map(s => s.departureCity)
  ].filter(Boolean)));

  const schedMonths = Array.from(new Set(
    (formData.schedules || [])
      .map(s => {
        const cleanDate = s.date.includes("T") ? s.date.split("T")[0] : s.date;
        const parts = cleanDate.split("-");
        return parts.length >= 2 ? `${parts[0]}-${parts[1]}` : "";
      })
      .filter(Boolean)
  )).sort();

  const filteredSchedules = (formData.schedules || []).filter(s => {
    if (schedCityFilter !== "all" && s.departureCity !== schedCityFilter) return false;
    if (schedMonthFilter !== "all") {
      const cleanDate = s.date.includes("T") ? s.date.split("T")[0] : s.date;
      const parts = cleanDate.split("-");
      if (parts.length >= 2) {
        const yearMonth = `${parts[0]}-${parts[1]}`;
        if (yearMonth !== schedMonthFilter) return false;
      } else {
        return false;
      }
    }
    return true;
  });

  const filtered = tours.filter((t) => {
    if (regionFilter !== "all" && t.region !== regionFilter) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    return true;
  });

  const handleDelete = async (id: string) => {
    try {
      await deleteDocById("last_minute_tours", id);
      refetch();
      toast.success("Đã xóa tour giờ chót");
    } catch (e) {
      toast.error("Xóa thất bại: " + (e as Error).message);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "hidden" : "active";
    try {
      await updateDocById("last_minute_tours", id, { status: newStatus });
      refetch();
      toast.success("Đã cập nhật trạng thái");
    } catch (e) {
      toast.error("Cập nhật thất bại: " + (e as Error).message);
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.name?.trim()) {
        toast.error("Vui lòng nhập tên tour");
        return;
      }
      if (!formData.partnerId) {
        toast.error("Vui lòng chọn đối tác");
        return;
      }

      const selectedPartner = partners.find(p => p.id === formData.partnerId);
      const originalPrice = Number(formData.originalPrice || 0);
      const salePrice = Number(formData.salePrice || 0);
      const discountPercent = originalPrice > 0 && salePrice < originalPrice
        ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
        : 0;

      const payload = {
        ...formData,
        originalPrice,
        salePrice,
        discountPercent,
        duration: Number(formData.duration || 1),
        nights: Number(formData.nights || 1),
        partnerName: selectedPartner?.name ?? "",
        partnerLogoUrl: selectedPartner?.logoUrl ?? "",
        partnerRating: selectedPartner?.rating ?? 0,
      };

      // Remove id from payload
      const { id, createdAt, updatedAt, ...saveData } = payload as any;

      if (editTour) {
        await updateDocById("last_minute_tours", editTour.id, saveData);
        toast.success("Đã cập nhật tour giờ chót thành công");
      } else {
        await createDoc("last_minute_tours", saveData);
        toast.success("Đã thêm tour giờ chót mới thành công");
      }
      refetch();
      closeForm();
    } catch (e) {
      toast.error("Lưu thất bại: " + (e as Error).message);
    }
  };

  if (loading) return (
    <div className="page-transition">
      <Header title="Quản lý Tour giờ chót" subtitle="Đang tải..." />
      <PageLoader />
    </div>
  );

  if (error) return (
    <div className="page-transition">
      <Header title="Quản lý Tour giờ chót" subtitle="" />
      <FirestoreError error={error} />
    </div>
  );

  return (
    <div className="page-transition">
      <Header
        title="Quản lý Tour giờ chót"
        subtitle={`${tours.length} tour giờ chót trong hệ thống`}
      />

      <div className="p-6 space-y-5">
        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Đang bán", value: tours.filter((t) => t.status === "active").length, color: "text-emerald-600 bg-emerald-50", border: "border-l-emerald-500" },
            { label: "Đã ẩn", value: tours.filter((t) => t.status === "hidden").length, color: "text-amber-600 bg-amber-50", border: "border-l-amber-500" },
            { label: "Trong nước", value: tours.filter((t) => t.region === "domestic").length, color: "text-blue-600 bg-blue-50", border: "border-l-blue-500" },
            { label: "Quốc tế", value: tours.filter((t) => t.region === "international").length, color: "text-purple-600 bg-purple-50", border: "border-l-purple-500" },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border border-l-4 bg-card p-4 shadow-sm ${s.border}`}>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters & actions */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả vùng</SelectItem>
              <SelectItem value="domestic">Trong nước</SelectItem>
              <SelectItem value="international">Quốc tế</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="active">Đang bán</SelectItem>
              <SelectItem value="hidden">Đã ẩn</SelectItem>
              <SelectItem value="inactive">Ngừng</SelectItem>
            </SelectContent>
          </Select>

          <Button
            className="ml-auto gap-2 bg-indigo-600 hover:bg-indigo-700"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4" />
            Thêm tour giờ chót
          </Button>
        </div>

        {/* Table */}
        <DataTable
          data={filtered}
          searchKeys={["name", "destination", "province", "partnerName"]}
          searchPlaceholder="Tìm theo tên tour, điểm đến, đối tác..."
          columns={[
            {
              key: "name",
              label: "Tour giờ chót",
              render: (_, row) => (
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative h-11 w-16 shrink-0 overflow-hidden rounded-lg">
                    <Image src={row.imageUrl || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400"} alt={row.name} fill className="object-cover" sizes="64px" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate max-w-[200px]">{row.name}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {row.destination}
                    </div>
                  </div>
                </div>
              ),
            },
            {
              key: "region",
              label: "Loại",
              render: (val) => (
                <div className="flex items-center gap-1 text-xs">
                  {val === "domestic" ? (
                    <><Home className="h-3 w-3 text-blue-500" /><span>Nội địa</span></>
                  ) : (
                    <><Globe className="h-3 w-3 text-purple-500" /><span>Quốc tế</span></>
                  )}
                </div>
              ),
            },
            {
              key: "salePrice",
              label: "Giá bán",
              sortable: true,
              render: (_, row) => (
                <div>
                  <p className="text-sm font-semibold">{formatCurrency(row.salePrice)}</p>
                  {row.discountPercent > 0 && (
                    <p className="text-xs text-muted-foreground line-through">
                      {formatCurrency(row.originalPrice)}
                    </p>
                  )}
                </div>
              ),
            },
            {
              key: "duration",
              label: "Thời gian",
              render: (_, row) => (
                <span className="text-sm">{row.duration}N{row.nights}Đ</span>
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
                  <span className="text-muted-foreground">({formatNumber(row.reviewCount)})</span>
                </div>
              ),
            },
            {
              key: "partnerName",
              label: "Đối tác",
              render: (val) => (
                <span className="text-xs text-muted-foreground">{val as string}</span>
              ),
            },
            {
              key: "status",
              label: "Trạng thái",
              render: (_, row) => (
                <div className="flex items-center gap-2">
                  <Switch
                    checked={row.status === "active"}
                    onCheckedChange={() => handleToggleStatus(row.id, row.status)}
                    className="scale-90"
                  />
                  <StatusBadge status={row.status} />
                </div>
              ),
            },
          ]}
          actions={(row) => (
            <div className="flex items-center justify-end gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewTour(row)}>
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(row)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:text-red-500"
                onClick={() => handleDelete(row.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        />
      </div>

      {/* View Tour Dialog */}
      <Dialog open={!!viewTour} onOpenChange={() => setViewTour(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết Tour giờ chót</DialogTitle>
          </DialogHeader>
          {viewTour && (
            <div className="space-y-4">
              <div className="relative h-48 w-full overflow-hidden rounded-xl">
                <Image src={viewTour.imageUrl || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400"} alt={viewTour.name} fill className="object-cover" sizes="672px" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <StatusBadge status={viewTour.status} />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold">{viewTour.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{viewTour.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted/50 p-4 text-sm">
                <div><p className="text-xs text-muted-foreground">Điểm đến</p><p className="font-medium">{viewTour.destination}, {viewTour.province}</p></div>
                <div><p className="text-xs text-muted-foreground">Thời gian</p><p className="font-medium">{viewTour.duration}N{viewTour.nights}Đ</p></div>
                <div><p className="text-xs text-muted-foreground">Giá bán</p><p className="font-bold text-indigo-600">{formatCurrency(viewTour.salePrice)}</p></div>
                <div><p className="text-xs text-muted-foreground">Đánh giá</p><p className="font-medium">⭐ {viewTour.rating} ({viewTour.reviewCount} đánh giá)</p></div>
                <div><p className="text-xs text-muted-foreground">Đối tác</p><p className="font-medium">{viewTour.partnerName}</p></div>
                <div><p className="text-xs text-muted-foreground">Phân loại</p><p className="font-medium">{getStatusLabel(viewTour.region)} · {viewTour.category}</p></div>
              </div>
              {viewTour.highlights?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Điểm nổi bật</p>
                  <ul className="space-y-1">
                    {viewTour.highlights.map((h, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {viewTour.schedules?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Lịch khởi hành</p>
                  <div className="space-y-2">
                    {viewTour.schedules.map((s, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                        <span>{s.date} · {s.departureCity}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{formatCurrency(s.price)}</span>
                          <StatusBadge status={s.status} />
                          <span className="text-xs text-muted-foreground">{s.availableSlots} chỗ</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit/Create Dialog */}
      <Dialog
        open={!!editTour || showCreate}
        onOpenChange={(open) => {
          if (!open) closeForm();
        }}
      >
        <DialogContent className="max-w-[80vw] w-[80vw] h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTour ? "Chỉnh sửa Tour giờ chót" : "Thêm Tour giờ chót mới"}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="flex border-b border-slate-100 bg-transparent rounded-none w-full justify-start gap-8 h-auto p-0 mb-6">
              <TabsTrigger 
                value="basic" 
                className="rounded-none border-b-2 border-transparent bg-transparent px-1 py-3 text-sm font-medium text-slate-500 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 data-[state=active]:bg-transparent shadow-none hover:text-slate-800 gap-2"
              >
                <LayoutGrid className="h-4 w-4" />
                Cơ bản
              </TabsTrigger>
              <TabsTrigger 
                value="pricing" 
                className="rounded-none border-b-2 border-transparent bg-transparent px-1 py-3 text-sm font-medium text-slate-500 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 data-[state=active]:bg-transparent shadow-none hover:text-slate-800 gap-2"
              >
                <Calendar className="h-4 w-4" />
                Giá & Khởi hành
              </TabsTrigger>
              <TabsTrigger 
                value="media" 
                className="rounded-none border-b-2 border-transparent bg-transparent px-1 py-3 text-sm font-medium text-slate-500 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 data-[state=active]:bg-transparent shadow-none hover:text-slate-800 gap-2"
              >
                <ImageIcon className="h-4 w-4" />
                Chi tiết & Media
              </TabsTrigger>
              <TabsTrigger 
                value="itinerary" 
                className="rounded-none border-b-2 border-transparent bg-transparent px-1 py-3 text-sm font-medium text-slate-500 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 data-[state=active]:bg-transparent shadow-none hover:text-slate-800 gap-2"
              >
                <Route className="h-4 w-4" />
                Lịch trình
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: BASIC INFO */}
            <TabsContent value="basic" className="space-y-4 py-1">
              <div className="space-y-2">
                <Label>Tên tour</Label>
                <Input
                  value={formData.name || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nhập tên tour..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Điểm đến</Label>
                  <Input
                    value={formData.destination || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
                    placeholder="Mù Cang Chải"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tỉnh/Thành</Label>
                  <Input
                    value={formData.province || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, province: e.target.value }))}
                    placeholder="Yên Bái"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Phân vùng</Label>
                  <Select
                    value={formData.region || "domestic"}
                    onValueChange={(val) => setFormData(prev => ({ ...prev, region: val as any }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="domestic">Trong nước</SelectItem>
                      <SelectItem value="international">Quốc tế</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Thể loại</Label>
                  <Input
                    value={formData.category || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="Núi cao, Biển đảo..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Loại tour</Label>
                  <Select
                    value={formData.tourType || "tour"}
                    onValueChange={(val) => setFormData(prev => ({ ...prev, tourType: val as any }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tour">Tour du lịch</SelectItem>
                      <SelectItem value="experience">Trải nghiệm</SelectItem>
                      <SelectItem value="cuisine">Ẩm thực</SelectItem>
                      <SelectItem value="shopping">Mua sắm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nơi lưu trú</Label>
                <Input
                  value={formData.accommodation || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, accommodation: e.target.value }))}
                  placeholder="Khách sạn 3 sao, homestay..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Đối tác</Label>
                  <Select
                    value={formData.partnerId || ""}
                    onValueChange={(val) => setFormData(prev => ({ ...prev, partnerId: val }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Chọn đối tác" /></SelectTrigger>
                    <SelectContent>
                      {partners.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Trạng thái</Label>
                  <Select
                    value={formData.status || "active"}
                    onValueChange={(val) => setFormData(prev => ({ ...prev, status: val as any }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Đang bán</SelectItem>
                      <SelectItem value="hidden">Ẩn</SelectItem>
                      <SelectItem value="inactive">Ngừng hoạt động</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: PRICING & SCHEDULES */}
            <TabsContent value="pricing" className="space-y-4 py-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Giá gốc (VNĐ)</Label>
                  <Input
                    type="number"
                    value={formData.originalPrice || 0}
                    onChange={(e) => setFormData(prev => ({ ...prev, originalPrice: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Giá bán (VNĐ)</Label>
                  <Input
                    type="number"
                    value={formData.salePrice || 0}
                    onChange={(e) => setFormData(prev => ({ ...prev, salePrice: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Số ngày</Label>
                  <Input
                    type="number"
                    value={formData.duration || 1}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Số đêm</Label>
                  <Input
                    type="number"
                    value={formData.nights || 1}
                    onChange={(e) => setFormData(prev => ({ ...prev, nights: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Lịch khởi hành chung</Label>
                <Input
                  value={formData.departureSchedule || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, departureSchedule: e.target.value }))}
                  placeholder="Ví dụ: Thứ 6 hàng tuần, Hằng ngày..."
                />
              </div>

              {/* Departure Cities string list */}
              <div className="space-y-2">
                <Label>Thành phố khởi hành</Label>
                <div className="flex gap-2">
                  <Input
                    value={tempCity}
                    onChange={(e) => setTempCity(e.target.value)}
                    placeholder="Ví dụ: Hà Nội"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addDepartureCity(tempCity);
                        setTempCity("");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      addDepartureCity(tempCity);
                      setTempCity("");
                    }}
                  >
                    Thêm
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {(formData.departureCities || []).map((c, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full border border-indigo-200">
                      {c}
                      <button
                        type="button"
                        onClick={() => removeDepartureCity(i)}
                        className="text-indigo-400 hover:text-indigo-600 font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-6 rounded-xl border p-4 bg-muted/30">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.isPopular || false}
                    onCheckedChange={(val) => setFormData(prev => ({ ...prev, isPopular: val }))}
                  />
                  <Label>Phổ biến (Popular)</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.isFeatured || false}
                    onCheckedChange={(val) => setFormData(prev => ({ ...prev, isFeatured: val }))}
                  />
                  <Label>Nổi bật (Featured)</Label>
                </div>
              </div>

              <div className="border-t my-6 pt-4 space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Cấu hình ngày khởi hành & giá cụ thể</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Thiết lập mức giá và số chỗ riêng cho từng ngày đi và điểm khởi hành khác nhau.</p>
                </div>

                <div className="space-y-4 border rounded-xl p-4 bg-muted/30">
                  <p className="text-sm font-semibold text-foreground">Thêm ngày khởi hành cụ thể</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Ngày đi</Label>
                      <Input
                        type="date"
                        value={tempSchedDate}
                        onChange={(e) => setTempSchedDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Giá bán ngày này (VNĐ)</Label>
                      <Input
                        type="number"
                        value={tempSchedPrice || formData.salePrice || 0}
                        onChange={(e) => setTempSchedPrice(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Điểm đi</Label>
                      <Select
                        value={tempSchedCity || ""}
                        onValueChange={setTempSchedCity}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Chọn điểm đi" />
                        </SelectTrigger>
                        <SelectContent>
                          {schedCities.length > 0 ? (
                            schedCities.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))
                          ) : (
                            <>
                              <SelectItem value="Hà Nội">Hà Nội</SelectItem>
                              <SelectItem value="Hồ Chí Minh">Hồ Chí Minh</SelectItem>
                              <SelectItem value="Đà Nẵng">Đà Nẵng</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Số chỗ trống</Label>
                      <Input
                        type="number"
                        value={tempSchedSlots}
                        onChange={(e) => setTempSchedSlots(Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Trạng thái chỗ</Label>
                      <Select
                        value={tempSchedStatus}
                        onValueChange={(val) => setTempSchedStatus(val as any)}
                      >
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Còn chỗ</SelectItem>
                          <SelectItem value="full">Hết chỗ</SelectItem>
                          <SelectItem value="soldout">Hết vé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full text-xs"
                    onClick={() => {
                      if (!tempSchedDate) {
                        toast.error("Vui lòng chọn ngày đi");
                        return;
                      }
                      if (!tempSchedCity) {
                        toast.error("Vui lòng chọn điểm đi");
                        return;
                      }
                      addScheduleItem(
                        tempSchedDate,
                        tempSchedPrice || formData.salePrice || 0,
                        tempSchedCity,
                        tempSchedSlots,
                        tempSchedStatus
                      );
                      setTempSchedDate("");
                    }}
                  >
                    Thêm ngày khởi hành
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label className="text-sm">Danh sách ngày đi ({formData.schedules?.length || 0})</Label>
                    
                    {/* Filters */}
                    <div className="flex gap-2">
                      <Select value={schedCityFilter} onValueChange={setSchedCityFilter}>
                        <SelectTrigger className="h-8 w-36 text-xs">
                          <SelectValue placeholder="Lọc điểm đi" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả điểm đi</SelectItem>
                          {schedCities.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={schedMonthFilter} onValueChange={setSchedMonthFilter}>
                        <SelectTrigger className="h-8 w-36 text-xs">
                          <SelectValue placeholder="Lọc tháng" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả các tháng</SelectItem>
                          {schedMonths.map((m) => (
                            <SelectItem key={m} value={m}>{formatMonthString(m)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 border rounded-lg p-2 bg-muted/10">
                    {filteredSchedules.map((s, i) => {
                      const realIndex = (formData.schedules || []).findIndex(
                        orig => orig.date === s.date && orig.departureCity === s.departureCity && orig.price === s.price
                      );
                      return (
                        <div key={i} className="flex justify-between items-center border rounded-lg p-2.5 bg-card text-xs hover:border-indigo-200 transition-colors">
                          <div className="flex flex-wrap gap-2 items-center">
                            <span className="font-semibold text-indigo-700">{formatDateString(s.date)}</span>
                            <span className="text-muted-foreground">| Khởi hành từ: <strong className="text-foreground">{s.departureCity}</strong></span>
                            <span className="font-bold text-slate-800">{formatCurrency(s.price)}</span>
                            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">{s.availableSlots} chỗ</span>
                            <StatusBadge status={s.status} />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                            onClick={() => removeScheduleItem(realIndex !== -1 ? realIndex : i)}
                          >
                            ×
                          </Button>
                        </div>
                      );
                    })}
                    {filteredSchedules.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-6">
                        {(formData.schedules || []).length === 0 
                          ? "Chưa có ngày khởi hành cụ thể nào được thiết lập." 
                          : "Không tìm thấy ngày khởi hành nào khớp với bộ lọc."}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: DESCRIPTION & MEDIA */}
            <TabsContent value="media" className="space-y-6 py-1">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                  <ImageIcon className="h-4.5 w-4.5 text-slate-500" />
                  Ảnh đại diện tour (URL)
                </Label>
                <div className="flex gap-4 items-start">
                  {formData.imageUrl && (
                    <div className="relative w-28 h-20 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-50 shadow-sm">
                      <img 
                        src={formData.imageUrl} 
                        alt="Ảnh đại diện preview" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400";
                        }}
                      />
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={formData.imageUrl || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="flex-1"
                      />
                      <div className="relative">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleUploadCoverImage}
                          disabled={uploading}
                          className="hidden"
                          id="tour-image-upload"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          disabled={uploading}
                          onClick={() => document.getElementById("tour-image-upload")?.click()}
                          className="flex items-center gap-2 border-slate-200 hover:bg-slate-50 text-slate-700 font-medium whitespace-nowrap"
                        >
                          <Upload className="h-4 w-4" />
                          Tải ảnh lên
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400">Ảnh đại diện sẽ được chọn từ thư viện ảnh bên dưới.</p>
                  </div>
                </div>
              </div>

              {/* Tour image gallery */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-slate-800">Thư viện ảnh tour</Label>
                
                {/* Drag and Drop Box */}
                <div
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer relative",
                    dragActive ? "border-indigo-600 bg-indigo-50/20" : "border-slate-200 hover:border-indigo-400 bg-slate-50/30",
                    uploading && "opacity-50 pointer-events-none"
                  )}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById("tour-gallery-upload")?.click()}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div className="text-sm text-center">
                    <span className="font-semibold text-indigo-600 block">Kéo & thả ảnh vào đây</span>
                    <span className="text-xs text-slate-500 mt-1 block">hoặc bấm để chọn ảnh từ thiết bị</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Hỗ trợ: JPG, PNG - Tối đa 10MB/ảnh</span>
                  
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleUploadGalleryImages}
                    disabled={uploading}
                    className="hidden"
                    id="tour-gallery-upload"
                  />
                </div>

                {/* Helper info */}
                <div className="flex items-center justify-between text-xs text-slate-500 px-0.5">
                  <div className="flex items-center gap-1.5">
                    <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <span>Bạn có thể tải lên nhiều ảnh. Kéo để sắp xếp thứ tự hiển thị.</span>
                  </div>
                  <span className="font-medium">Tối đa 10 ảnh</span>
                </div>

                {/* Images grid list */}
                <div className="flex flex-wrap gap-4 mt-3">
                  {(formData.images || []).map((imgUrl, idx) => {
                    const isCover = formData.imageUrl === imgUrl;
                    return (
                      <div 
                        key={idx} 
                        draggable
                        onDragStart={() => handlePhotoDragStart(idx)}
                        onDragOver={handlePhotoDragOver}
                        onDrop={() => handlePhotoDrop(idx)}
                        className={cn(
                          "relative w-[172px] h-[115px] overflow-hidden rounded-xl border-2 transition-all cursor-move group shrink-0 select-none shadow-sm",
                          isCover ? "border-indigo-600 shadow-indigo-100" : "border-slate-200 hover:border-indigo-300"
                        )}
                        onClick={() => setFormData(prev => ({ ...prev, imageUrl: imgUrl }))}
                      >
                        <img src={imgUrl} alt={`Gallery ${idx}`} className="h-full w-full object-cover pointer-events-none" />
                        
                        {/* Cover Image Badge */}
                        {isCover && (
                          <span className="absolute top-2 left-2 bg-indigo-600 text-white text-[9px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                            Ảnh đại diện
                          </span>
                        )}

                        {/* Radio selection circle */}
                        <div className={cn(
                          "absolute top-2 right-2 h-5 w-5 rounded-full flex items-center justify-center transition-all border shadow-sm",
                          isCover 
                            ? "bg-indigo-600 border-indigo-600 text-white" 
                            : "border-slate-300 bg-white/90"
                        )}>
                          {isCover && <Check className="h-3 w-3 text-white" />}
                        </div>

                        {/* Delete Button (Trash icon on hover) */}
                        <button
                          type="button"
                          className="absolute bottom-2 right-2 bg-black/60 hover:bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImageFromGallery(imgUrl);
                          }}
                          title="Xóa ảnh"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}

                  {/* Add Image Card (triggers file input) */}
                  {(formData.images || []).length < 10 && (
                    <div
                      onClick={() => document.getElementById("tour-gallery-upload")?.click()}
                      className="w-[172px] h-[115px] rounded-xl border-2 border-dashed border-slate-200 hover:border-indigo-500 hover:text-indigo-600 bg-slate-50/50 flex flex-col items-center justify-center gap-1 cursor-pointer shrink-0 transition-all shadow-sm"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                        <Plus className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-semibold text-indigo-600">Thêm ảnh</span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-400 mt-2">
                  Nhấp vào ảnh để chọn làm ảnh đại diện (ảnh đầu tiên sẽ được chọn mặc định).
                </p>
              </div>

              {/* Mô tả chi tiết */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                  <FileText className="h-4.5 w-4.5 text-slate-500" />
                  Mô tả chi tiết
                </Label>
                <div className="relative">
                  <textarea
                    className="w-full text-sm rounded-md border border-input bg-transparent px-3 py-2 shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring pb-6"
                    rows={4}
                    maxLength={2000}
                    value={formData.description || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Chương trình tour du lịch chất lượng cao..."
                  />
                  <span className="absolute bottom-2 right-3 text-[10px] text-slate-400">
                    {(formData.description || "").length}/2000
                  </span>
                </div>
              </div>

              {/* Highlights List */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                  <Sparkles className="h-4.5 w-4.5 text-indigo-500" />
                  Điểm nổi bật (Highlights)
                  <Info className="h-3.5 w-3.5 text-slate-400 cursor-pointer ml-0.5" />
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={tempHighlight}
                    onChange={(e) => setTempHighlight(e.target.value)}
                    placeholder="Nhập điểm nổi bật"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addHighlight(tempHighlight);
                        setTempHighlight("");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      addHighlight(tempHighlight);
                      setTempHighlight("");
                    }}
                    className="bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 font-medium px-4"
                  >
                    Thêm
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(formData.highlights || []).map((h, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 bg-indigo-50/80 text-indigo-700 text-xs px-3 py-1.5 rounded-full border border-indigo-100 transition-colors shadow-sm">
                      <Check className="h-3.5 w-3.5 text-indigo-600 bg-indigo-100 rounded-full p-0.5" />
                      <span className="font-medium">{h}</span>
                      <button
                        type="button"
                        onClick={() => removeHighlight(i)}
                        className="text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-full w-4 h-4 flex items-center justify-center font-bold transition-colors ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Includes List */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                  Bao gồm (Includes)
                  <Info className="h-3.5 w-3.5 text-slate-400 cursor-pointer ml-0.5" />
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={tempInclude}
                    onChange={(e) => setTempInclude(e.target.value)}
                    placeholder="Nhập dịch vụ bao gồm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addInclude(tempInclude);
                        setTempInclude("");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      addInclude(tempInclude);
                      setTempInclude("");
                    }}
                    className="bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 font-medium px-4"
                  >
                    Thêm
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(formData.includes || []).map((item, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 bg-emerald-50/80 text-emerald-700 text-xs px-3 py-1.5 rounded-full border border-emerald-100 transition-colors shadow-sm">
                      <Check className="h-3.5 w-3.5 text-emerald-600 bg-emerald-100 rounded-full p-0.5" />
                      <span className="font-medium">{item}</span>
                      <button
                        type="button"
                        onClick={() => removeInclude(i)}
                        className="text-emerald-400 hover:text-emerald-600 hover:bg-emerald-100 rounded-full w-4 h-4 flex items-center justify-center font-bold transition-colors ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Excludes List */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                  <XCircle className="h-4.5 w-4.5 text-rose-500" />
                  Không bao gồm (Excludes)
                  <Info className="h-3.5 w-3.5 text-slate-400 cursor-pointer ml-0.5" />
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={tempExclude}
                    onChange={(e) => setTempExclude(e.target.value)}
                    placeholder="Nhập dịch vụ không bao gồm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addExclude(tempExclude);
                        setTempExclude("");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      addExclude(tempExclude);
                      setTempExclude("");
                    }}
                    className="bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 font-medium px-4"
                  >
                    Thêm
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(formData.excludes || []).map((item, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 bg-rose-50/85 text-rose-700 text-xs px-3 py-1.5 rounded-full border border-rose-100 transition-colors shadow-sm">
                      <XCircle className="h-3.5 w-3.5 text-rose-600 bg-rose-100 rounded-full p-0.5" />
                      <span className="font-medium">{item}</span>
                      <button
                        type="button"
                        onClick={() => removeExclude(i)}
                        className="text-rose-400 hover:text-rose-600 hover:bg-rose-100 rounded-full w-4 h-4 flex items-center justify-center font-bold transition-colors ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* TAB 4: ITINERARY */}
            <TabsContent value="itinerary" className="space-y-4 py-1">
              <div className="space-y-4 border rounded-xl p-4 bg-muted/30">
                <p className="text-sm font-semibold text-foreground">Thêm lịch trình ngày mới</p>
                <div className="grid grid-cols-4 gap-3">
                  <div className="col-span-1 space-y-1">
                    <Label className="text-xs">Ngày thứ</Label>
                    <Input
                      type="number"
                      value={tempItinDay}
                      onChange={(e) => setTempItinDay(Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-3 space-y-1">
                    <Label className="text-xs">Tiêu đề ngày</Label>
                    <Input
                      value={tempItinTitle}
                      onChange={(e) => setTempItinTitle(e.target.value)}
                      placeholder="Ví dụ: Hà Nội → Tú Lệ → Mù Cang Chải"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Chi tiết hoạt động</Label>
                  <textarea
                    className="w-full text-sm rounded-md border border-input bg-transparent px-3 py-2 shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    rows={2}
                    value={tempItinDesc}
                    onChange={(e) => setTempItinDesc(e.target.value)}
                    placeholder="Mô tả hành trình trong ngày..."
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full text-xs"
                  onClick={() => {
                    addItineraryItem(tempItinDay, tempItinTitle, tempItinDesc);
                    setTempItinTitle("");
                    setTempItinDesc("");
                    setTempItinDay(prev => prev + 1);
                  }}
                >
                  Thêm vào lịch trình
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Lịch trình đã thêm ({formData.itinerary?.length || 0} ngày)</Label>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {(formData.itinerary || []).map((item, i) => (
                    <div key={i} className="flex justify-between items-start border rounded-lg p-3 bg-card text-sm">
                      <div className="space-y-1">
                        <p className="font-semibold text-indigo-600">Ngày {item.day}: {item.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:text-red-700 shrink-0"
                        onClick={() => removeItineraryItem(i)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                  {(!formData.itinerary || formData.itinerary.length === 0) && (
                    <p className="text-xs text-muted-foreground text-center py-4">Chưa có lịch trình nào được nhập.</p>
                  )}
                </div>
              </div>
            </TabsContent>


          </Tabs>

          <DialogFooter className="mt-6 border-t pt-4 flex items-center justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={closeForm}
              className="px-6 h-10 border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 text-sm font-medium rounded-lg"
            >
              Hủy
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 h-10 text-sm font-medium rounded-lg flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
              onClick={handleSave}
            >
              <Save className="h-4 w-4" />
              {editTour ? "Lưu thay đổi" : "Tạo tour"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const formatDateString = (dateStr: string) => {
  if (!dateStr) return "";
  const cleanDate = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const parts = cleanDate.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return cleanDate;
};

const formatMonthString = (monthStr: string) => {
  if (!monthStr) return "";
  const parts = monthStr.split("-");
  if (parts.length === 2) {
    return `Tháng ${parts[1]}/${parts[0]}`;
  }
  return monthStr;
};
