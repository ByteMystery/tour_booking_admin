"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PageLoader } from "@/components/shared/PageLoader";
import { FirestoreError } from "@/components/shared/FirestoreError";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useBookings, updateDocById } from "@/hooks/useFirestore";
import { formatCurrency, formatDate, getStatusLabel } from "@/lib/utils";
import type { Booking, BookingStatus } from "@/types";
import { Eye, Download, Filter } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "pending", label: "Chờ thanh toán" },
  { value: "upcoming", label: "Sắp khởi hành" },
  { value: "completed", label: "Hoàn thành" },
  { value: "cancelled", label: "Đã hủy" },
];

const TYPE_OPTIONS = [
  { value: "all", label: "Tất cả loại" },
  { value: "tour", label: "Tour" },
  { value: "hotel", label: "Khách sạn" },
  { value: "flight", label: "Máy bay" },
  { value: "transfer", label: "Đưa đón" },
];

const TOUR_PLACEHOLDER = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400";

export default function BookingsPage() {
  const { data: bookings, loading, error, refetch } = useBookings();
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selected, setSelected] = useState<Booking | null>(null);

  const filtered = bookings.filter((b) => {
    if (statusFilter !== "all" && b.status !== statusFilter) return false;
    if (typeFilter !== "all" && b.bookingType !== typeFilter) return false;
    return true;
  });

  const handleStatusChange = async (bookingId: string, newStatus: BookingStatus) => {
    try {
      await updateDocById("bookings", bookingId, { status: newStatus });
      refetch();
      toast.success(`Đã cập nhật trạng thái đơn → ${getStatusLabel(newStatus)}`);
    } catch (e) {
      toast.error("Cập nhật thất bại: " + (e as Error).message);
    }
  };

  if (loading) return (
    <div className="page-transition">
      <Header title="Quản lý đơn đặt chỗ" subtitle="Đang tải..." />
      <PageLoader />
    </div>
  );

  if (error) return (
    <div className="page-transition">
      <Header title="Quản lý đơn đặt chỗ" subtitle="" />
      <FirestoreError error={error} />
    </div>
  );

  return (
    <div className="page-transition">
      <Header
        title="Quản lý đơn đặt chỗ"
        subtitle={`${bookings.length} đơn tổng cộng`}
      />

      <div className="p-6 space-y-5">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="ml-auto">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Xuất Excel
            </Button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATUS_OPTIONS.slice(1).map((s) => {
            const count = bookings.filter((b) => b.status === s.value).length;
            const colors: Record<string, string> = {
              pending: "border-l-amber-500",
              upcoming: "border-l-blue-500",
              completed: "border-l-emerald-500",
              cancelled: "border-l-red-500",
            };
            return (
              <button
                key={s.value}
                onClick={() => setStatusFilter(s.value)}
                className={`rounded-xl border border-l-4 bg-card p-4 text-left shadow-sm hover:shadow-md transition-all ${colors[s.value]} ${statusFilter === s.value ? "ring-2 ring-primary" : ""}`}
              >
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </button>
            );
          })}
        </div>

        {/* Table */}
        <DataTable
          data={filtered}
          searchKeys={["bookingCode", "tourName", "destination"]}
          searchPlaceholder="Tìm theo mã đơn, tên tour, điểm đến..."
          columns={[
            {
              key: "bookingCode",
              label: "Mã đơn",
              render: (_, row) => (
                <span className="font-mono text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                  {row.bookingCode}
                </span>
              ),
            },
            {
              key: "tourName",
              label: "Dịch vụ",
              render: (_, row) => (
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative h-9 w-12 shrink-0 overflow-hidden rounded-lg">
                    <Image src={row.tourImage || TOUR_PLACEHOLDER} alt={row.tourName} fill className="object-cover" sizes="48px" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate max-w-[180px]">{row.tourName}</p>
                    <p className="text-xs text-muted-foreground">{row.destination}</p>
                  </div>
                </div>
              ),
            },
            {
              key: "bookingType",
              label: "Loại",
              render: (val) => (
                <span className="text-xs font-medium capitalize bg-slate-100 text-slate-600 rounded px-2 py-0.5">
                  {getStatusLabel(val as string)}
                </span>
              ),
            },
            {
              key: "departureDate",
              label: "Ngày đi",
              sortable: true,
              render: (_, row) => (
                <span className="text-sm">{formatDate(row.departureDate)}</span>
              ),
            },
            {
              key: "adults",
              label: "Hành khách",
              render: (_, row) => (
                <span className="text-sm">
                  {row.adults} NL{row.children ? ` + ${row.children} TE` : ""}
                </span>
              ),
            },
            {
              key: "totalPrice",
              label: "Tổng tiền",
              sortable: true,
              render: (val) => (
                <span className="text-sm font-semibold">{formatCurrency(val as number)}</span>
              ),
            },
            {
              key: "status",
              label: "Trạng thái",
              render: (val) => <StatusBadge status={val as string} />,
            },
            {
              key: "createdAt",
              label: "Ngày đặt",
              sortable: true,
              render: (_, row) => (
                <span className="text-xs text-muted-foreground">{formatDate(row.createdAt)}</span>
              ),
            },
          ]}
          actions={(row) => (
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setSelected(row)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Select
                defaultValue={row.status}
                onValueChange={(v) => handleStatusChange(row.id, v as BookingStatus)}
              >
                <SelectTrigger className="h-8 w-36 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.slice(1).map((o) => (
                    <SelectItem key={o.value} value={o.value} className="text-xs">
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        />
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết đơn đặt chỗ</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 pt-2">
              {/* Header */}
              <div className="flex items-start gap-4">
                <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl">
                  <Image src={selected.tourImage || TOUR_PLACEHOLDER} alt={selected.tourName} fill className="object-cover" sizes="112px" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                      {selected.bookingCode}
                    </span>
                    <StatusBadge status={selected.status} />
                  </div>
                  <h3 className="font-semibold text-lg leading-tight">{selected.tourName}</h3>
                  <p className="text-sm text-muted-foreground">{selected.destination}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 rounded-xl bg-muted/50 p-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Loại dịch vụ</p>
                  <p className="font-medium">{getStatusLabel(selected.bookingType)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Ngày đặt</p>
                  <p className="font-medium">{formatDate(selected.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Ngày đi</p>
                  <p className="font-medium">{formatDate(selected.departureDate)}</p>
                </div>
                {selected.returnDate && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Ngày về</p>
                    <p className="font-medium">{formatDate(selected.returnDate)}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Số khách</p>
                  <p className="font-medium">
                    {selected.adults} người lớn{selected.children ? ` + ${selected.children} trẻ em` : ""}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Tổng thanh toán</p>
                  <p className="font-bold text-lg text-indigo-600">{formatCurrency(selected.totalPrice)}</p>
                </div>
                {selected.departureCity && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Điểm đi</p>
                    <p className="font-medium">{selected.departureCity}</p>
                  </div>
                )}
                {selected.accommodation && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Loại phòng/vé</p>
                    <p className="font-medium">{selected.accommodation}</p>
                  </div>
                )}
                {/* Flight extras */}
                {selected.bookingType === "flight" && (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Hãng bay</p>
                      <p className="font-medium">{selected.airlineName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Số hiệu</p>
                      <p className="font-medium">{selected.flightNumber}</p>
                    </div>
                  </>
                )}
                {/* Transfer extras */}
                {selected.bookingType === "transfer" && (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Loại xe</p>
                      <p className="font-medium">{selected.vehicleType}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Giờ đón</p>
                      <p className="font-medium">{selected.pickUpTime}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground mb-0.5">Điểm đón → Điểm trả</p>
                      <p className="font-medium">{selected.pickUpLocation} → {selected.dropOffLocation}</p>
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelected(null)}
                >
                  Đóng
                </Button>
                <Button
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  onClick={async () => {
                    try {
                      await updateDocById("bookings", selected.id, { status: "upcoming" });
                      refetch();
                      toast.success("Đã xác nhận đơn hàng");
                      setSelected(null);
                    } catch (e) {
                      toast.error("Xác nhận thất bại: " + (e as Error).message);
                    }
                  }}
                >
                  Xác nhận đơn
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
