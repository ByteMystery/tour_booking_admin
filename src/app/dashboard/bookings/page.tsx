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
import { formatCurrency, formatDate, formatDateTime, getStatusLabel } from "@/lib/utils";
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
                <button
                  onClick={() => setSelected(row)}
                  className="font-mono text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-800 px-2 py-1 rounded transition-colors text-left cursor-pointer"
                >
                  {row.bookingCode}
                </button>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/30 p-5 rounded-2xl border text-sm">
                
                {/* Cột 1: Thông tin đơn hàng & Khách hàng */}
                <div className="space-y-4">
                  <h4 className="font-bold text-xs text-indigo-600 uppercase tracking-wider border-b pb-1">
                    Thông tin đơn hàng
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">ID Hệ thống</p>
                      <p className="font-mono text-xs font-medium break-all select-all">{selected.id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Mã đơn đặt</p>
                      <p className="font-mono text-xs font-bold text-indigo-600">{selected.bookingCode}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Mã khách hàng</p>
                      <p className="font-mono text-xs font-medium break-all select-all">{selected.userId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Trạng thái đơn</p>
                      <div className="mt-0.5"><StatusBadge status={selected.status} /></div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Ngày đặt đơn</p>
                      <p className="font-medium">{formatDateTime(selected.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Cập nhật lúc</p>
                      <p className="font-medium">{formatDateTime(selected.updatedAt)}</p>
                    </div>
                    {selected.paymentDeadline && (
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground">Hạn thanh toán</p>
                        <p className="font-medium text-amber-600">{formatDateTime(selected.paymentDeadline)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cột 2: Thông tin dịch vụ & Địa điểm */}
                <div className="space-y-4">
                  <h4 className="font-bold text-xs text-indigo-600 uppercase tracking-wider border-b pb-1">
                    Thông tin dịch vụ
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Loại dịch vụ</p>
                      <p className="font-medium capitalize bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded inline-block text-xs mt-0.5">
                        {getStatusLabel(selected.bookingType)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Mã dịch vụ (ID)</p>
                      <p className="font-mono text-xs font-medium break-all select-all">{selected.tourId}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Tên dịch vụ</p>
                      <p className="font-medium">{selected.tourName}</p>
                    </div>
                    {selected.departureCity && (
                      <div>
                        <p className="text-xs text-muted-foreground">Điểm khởi hành</p>
                        <p className="font-medium">{selected.departureCity}</p>
                      </div>
                    )}
                    {selected.destination && (
                      <div>
                        <p className="text-xs text-muted-foreground">Điểm đến</p>
                        <p className="font-medium">{selected.destination}</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Lịch trình & Số lượng khách & Thông tin bổ sung */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/30 p-5 rounded-2xl border text-sm">
                
                {/* Lịch trình & Số lượng khách */}
                <div className="space-y-4">
                  <h4 className="font-bold text-xs text-indigo-600 uppercase tracking-wider border-b pb-1">
                    Thời gian & Hành khách
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Ngày đi / Bắt đầu</p>
                      <p className="font-medium">{formatDate(selected.departureDate)}</p>
                    </div>
                    {selected.returnDate && (
                      <div>
                        <p className="text-xs text-muted-foreground">Ngày về / Kết thúc</p>
                        <p className="font-medium">{formatDate(selected.returnDate)}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">Người lớn</p>
                      <p className="font-medium">{selected.adults} người</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Trẻ em</p>
                      <p className="font-medium">{selected.children || 0} trẻ em</p>
                    </div>
                    {selected.guestsCount && (
                      <div>
                        <p className="text-xs text-muted-foreground">Tổng số khách</p>
                        <p className="font-medium">{selected.guestsCount} người</p>
                      </div>
                    )}
                    {selected.accommodation && (
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground">Lưu trú / Chỗ ở</p>
                        <p className="font-medium">{selected.accommodation}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Thuộc tính bổ sung theo Loại dịch vụ */}
                <div className="space-y-4">
                  <h4 className="font-bold text-xs text-indigo-600 uppercase tracking-wider border-b pb-1">
                    Chi tiết bổ sung ({getStatusLabel(selected.bookingType)})
                  </h4>
                  
                  {selected.bookingType === "tour" && (
                    <div className="text-xs text-muted-foreground italic pt-2">
                      Dịch vụ Tour không có thuộc tính bổ sung đặc thù.
                    </div>
                  )}

                  {selected.bookingType === "hotel" && (
                    <div className="grid grid-cols-2 gap-3">
                      {selected.checkInDate && (
                        <div>
                          <p className="text-xs text-muted-foreground">Ngày nhận phòng</p>
                          <p className="font-medium">{formatDateTime(selected.checkInDate)}</p>
                        </div>
                      )}
                      {selected.checkOutDate && (
                        <div>
                          <p className="text-xs text-muted-foreground">Ngày trả phòng</p>
                          <p className="font-medium">{formatDateTime(selected.checkOutDate)}</p>
                        </div>
                      )}
                      {selected.roomType && (
                        <div>
                          <p className="text-xs text-muted-foreground">Loại phòng</p>
                          <p className="font-medium">{selected.roomType}</p>
                        </div>
                      )}
                      {selected.guestsCount && (
                        <div>
                          <p className="text-xs text-muted-foreground">Số lượng khách</p>
                          <p className="font-medium">{selected.guestsCount} khách</p>
                        </div>
                      )}
                    </div>
                  )}

                  {selected.bookingType === "flight" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Hãng bay</p>
                        <p className="font-medium flex items-center gap-1.5 mt-0.5">
                          {selected.airlineLogo && (
                            <img src={selected.airlineLogo} alt={selected.airlineName} className="h-4 w-4 object-contain shrink-0" />
                          )}
                          <span>{selected.airlineName || "—"}</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Số hiệu chuyến bay</p>
                        <p className="font-medium font-mono">{selected.flightNumber || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Hạng vé</p>
                        <p className="font-medium">{selected.flightClass || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Tên hành khách</p>
                        <p className="font-medium">{selected.passengerName || "—"}</p>
                      </div>
                    </div>
                  )}

                  {selected.bookingType === "transfer" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Loại xe</p>
                        <p className="font-medium">{selected.vehicleType || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Giờ đón</p>
                        <p className="font-medium">{selected.pickUpTime || "—"}</p>
                      </div>
                      {selected.flightCode && (
                        <div>
                          <p className="text-xs text-muted-foreground">Mã chuyến bay</p>
                          <p className="font-medium font-mono">{selected.flightCode}</p>
                        </div>
                      )}
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground">Điểm đón</p>
                        <p className="font-medium">{selected.pickUpLocation || "—"}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground">Điểm trả</p>
                        <p className="font-medium">{selected.dropOffLocation || "—"}</p>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Chi tiết thanh toán */}
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-sm text-indigo-900">Chi tiết thanh toán</h5>
                  <p className="text-xs text-indigo-700 mt-0.5">Đã bao gồm VAT và phí dịch vụ</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Tổng tiền thanh toán</p>
                  <p className="font-extrabold text-2xl text-indigo-600">{formatCurrency(selected.totalPrice)}</p>
                </div>
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
