"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { DataTable } from "@/components/shared/DataTable";
import { PageLoader } from "@/components/shared/PageLoader";
import { FirestoreError } from "@/components/shared/FirestoreError";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUsers, useBookings } from "@/hooks/useFirestore";
import { formatDate } from "@/lib/utils";
import type { User } from "@/types";
import { Eye, MapPin, Mail, Phone, Heart, ShoppingBag } from "lucide-react";

export default function UsersPage() {
  const { data: users, loading, error } = useUsers();
  const { data: bookings } = useBookings();
  const [selected, setSelected] = useState<User | null>(null);

  if (loading) return (
    <div className="page-transition">
      <Header title="Khách hàng" subtitle="Đang tải..." />
      <PageLoader />
    </div>
  );

  if (error) return (
    <div className="page-transition">
      <Header title="Khách hàng" subtitle="" />
      <FirestoreError error={error} />
    </div>
  );

  return (
    <div className="page-transition">
      <Header title="Khách hàng" subtitle={`${users.length} tài khoản đăng ký`} />

      <div className="p-6 space-y-5">
        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Tổng khách hàng", value: users.length, color: "border-l-indigo-500" },
            { label: "Đã đặt tour", value: bookings.length, color: "border-l-emerald-500" },
            { label: "TP. Hồ Chí Minh", value: users.filter(u => u.location?.includes("Hồ Chí Minh")).length, color: "border-l-blue-500" },
            { label: "Hà Nội", value: users.filter(u => u.location === "Hà Nội").length, color: "border-l-purple-500" },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border border-l-4 bg-card p-4 shadow-sm ${s.color}`}>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <DataTable
          data={users}
          searchKeys={["displayName", "email", "phone", "location"]}
          searchPlaceholder="Tìm theo tên, email, số điện thoại..."
          columns={[
            {
              key: "displayName",
              label: "Khách hàng",
              render: (_, row) => (
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={row.photoUrl} />
                    <AvatarFallback className="bg-indigo-100 text-indigo-700 text-sm">
                      {row.displayName?.charAt(0) ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{row.displayName}</p>
                    <p className="text-xs text-muted-foreground">{row.email}</p>
                  </div>
                </div>
              ),
            },
            {
              key: "phone",
              label: "Điện thoại",
              render: (val) => <span className="text-sm font-mono">{val as string}</span>,
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
              key: "favoriteTourIds",
              label: "Tour yêu thích",
              render: (val) => (
                <div className="flex items-center gap-1 text-sm">
                  <Heart className="h-3.5 w-3.5 text-red-400 fill-red-400" />
                  <span>{((val as string[]) ?? []).length} tour</span>
                </div>
              ),
            },
            {
              key: "createdAt",
              label: "Ngày tham gia",
              sortable: true,
              render: (_, row) => (
                <span className="text-xs text-muted-foreground">{formatDate(row.createdAt)}</span>
              ),
            },
          ]}
          actions={(row) => (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelected(row)}>
              <Eye className="h-4 w-4" />
            </Button>
          )}
        />
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Hồ sơ khách hàng</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selected.photoUrl} />
                  <AvatarFallback className="text-xl bg-indigo-100 text-indigo-700">
                    {selected.displayName?.charAt(0) ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-bold">{selected.displayName}</h3>
                  <p className="text-sm text-muted-foreground">ID: {selected.id}</p>
                </div>
              </div>
              <div className="space-y-2 rounded-xl bg-muted/50 p-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />{selected.email}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />{selected.phone}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />{selected.location}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Heart className="h-4 w-4 shrink-0 fill-red-400 text-red-400" />
                  {(selected.favoriteTourIds ?? []).length} tour yêu thích
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ShoppingBag className="h-4 w-4 shrink-0" />
                  {bookings.filter(b => b.userId === selected.id).length} đơn đặt chỗ
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                <p>Tham gia: {formatDate(selected.createdAt)}</p>
                <p>Cập nhật: {formatDate(selected.updatedAt)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
