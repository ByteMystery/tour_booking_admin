"use client";

import { useState, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PageLoader } from "@/components/shared/PageLoader";
import { FirestoreError } from "@/components/shared/FirestoreError";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAdmins, usePartners, updateDocById } from "@/hooks/useFirestore";
import { formatDate } from "@/lib/utils";
import type { Admin } from "@/types";
import { Plus, Pencil, Shield, UserCheck, UserX } from "lucide-react";
import toast from "react-hot-toast";

const ROLE_OPTIONS = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "editor", label: "Editor" },
  { value: "support", label: "Support" },
];

const roleColors: Record<string, string> = {
  super_admin: "bg-purple-100 text-purple-700",
  admin: "bg-blue-100 text-blue-700",
  editor: "bg-cyan-100 text-cyan-700",
  support: "bg-teal-100 text-teal-700",
};
const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  editor: "Editor",
  support: "Support",
};

export default function AdminsPage() {
  const { data: admins, loading, error, refetch } = useAdmins();
  const { data: partners } = usePartners();
  const [editAdmin, setEditAdmin] = useState<Admin | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // Edit form state
  const [editRole, setEditRole] = useState("admin");
  const [editPartnerId, setEditPartnerId] = useState("none");
  const [editStatus, setEditStatus] = useState("active");

  // Create form state
  const [createRole, setCreateRole] = useState("admin");
  const [createPartnerId, setCreatePartnerId] = useState("none");
  const createNameRef = useRef<HTMLInputElement>(null);
  const createEmailRef = useRef<HTMLInputElement>(null);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    try {
      await updateDocById("admins", id, { status: newStatus });
      refetch();
      toast.success("Đã cập nhật trạng thái tài khoản");
    } catch (e) {
      toast.error("Cập nhật thất bại: " + (e as Error).message);
    }
  };

  const handleEditSave = async () => {
    if (!editAdmin) return;
    try {
      await updateDocById("admins", editAdmin.id, {
        role: editRole,
        partnerId: editPartnerId === "none" ? "" : editPartnerId,
        status: editStatus,
      });
      refetch();
      toast.success("Đã cập nhật quyền");
      setEditAdmin(null);
    } catch (e) {
      toast.error("Cập nhật thất bại: " + (e as Error).message);
    }
  };

  const handleCreateSave = () => {
    // Tạo admin cần Admin SDK — không thể làm từ client
    toast("Tính năng tạo admin qua console Firebase (cần Admin SDK)", { icon: "ℹ️" });
    setShowCreate(false);
  };

  if (loading) return (
    <div className="page-transition">
      <Header title="Quản trị viên" subtitle="Đang tải..." />
      <PageLoader />
    </div>
  );

  if (error) return (
    <div className="page-transition">
      <Header title="Quản trị viên" subtitle="" />
      <FirestoreError error={error} />
    </div>
  );

  return (
    <div className="page-transition">
      <Header title="Quản trị viên" subtitle="Phân quyền và quản lý tài khoản admin" />

      <div className="p-6 space-y-5">
        {/* Role summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {ROLE_OPTIONS.map((r) => {
            const count = admins.filter(a => a.role === r.value).length;
            return (
              <div key={r.value} className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${roleColors[r.value]}`}>
                    {r.label}
                  </span>
                </div>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs text-muted-foreground">tài khoản</p>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end">
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700" onClick={() => {
            setCreateRole("admin");
            setCreatePartnerId("none");
            setShowCreate(true);
          }}>
            <Plus className="h-4 w-4" />
            Thêm quản trị viên
          </Button>
        </div>

        <DataTable
          data={admins}
          searchKeys={["displayName", "email"]}
          searchPlaceholder="Tìm theo tên, email..."
          columns={[
            {
              key: "displayName",
              label: "Quản trị viên",
              render: (_, row) => (
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={`https://i.pravatar.cc/100?u=${row.email}`} />
                    <AvatarFallback className="bg-indigo-100 text-indigo-700 text-sm font-semibold">
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
              key: "role",
              label: "Vai trò",
              render: (val) => (
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${roleColors[val as string]}`}>
                  {roleLabels[val as string]}
                </span>
              ),
            },
            {
              key: "partnerId",
              label: "Đối tác",
              render: (val) => {
                if (!val) return <span className="text-xs text-muted-foreground">Hệ thống</span>;
                const partner = partners.find(p => p.id === val);
                return <span className="text-xs font-medium">{partner?.name ?? val as string}</span>;
              },
            },
            {
              key: "status",
              label: "Trạng thái",
              render: (val) => <StatusBadge status={val as string} />,
            },
            {
              key: "createdAt",
              label: "Ngày tạo",
              sortable: true,
              render: (_, row) => (
                <span className="text-xs text-muted-foreground">{formatDate(row.createdAt)}</span>
              ),
            },
          ]}
          actions={(row) => (
            <div className="flex justify-end gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                setEditRole(row.role);
                setEditPartnerId(row.partnerId ?? "none");
                setEditStatus(row.status);
                setEditAdmin(row);
              }}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${row.status === "active" ? "hover:text-red-500" : "hover:text-emerald-500"}`}
                onClick={() => handleToggleStatus(row.id, row.status)}
              >
                {row.status === "active" ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
              </Button>
            </div>
          )}
        />
      </div>

      {/* Edit dialog */}
      <Dialog
        open={!!editAdmin}
        onOpenChange={() => setEditAdmin(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa quyền</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Họ tên</Label>
              <Input defaultValue={editAdmin?.displayName} disabled />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" defaultValue={editAdmin?.email} disabled />
            </div>
            <div className="space-y-2">
              <Label>Vai trò</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Đối tác (nếu là Partner Admin)</Label>
              <Select value={editPartnerId} onValueChange={setEditPartnerId}>
                <SelectTrigger><SelectValue placeholder="Không có (Admin hệ thống)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không có (Admin hệ thống)</SelectItem>
                  {partners.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="suspended">Đã khóa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditAdmin(null)}>Hủy</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleEditSave}>
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={() => setShowCreate(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm quản trị viên</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Họ tên</Label>
              <Input ref={createNameRef} placeholder="Nguyễn Văn A" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input ref={createEmailRef} type="email" placeholder="admin@tripzio.com" />
            </div>
            <div className="space-y-2">
              <Label>Mật khẩu tạm thời</Label>
              <Input type="password" placeholder="Tối thiểu 8 ký tự" disabled />
            </div>
            <div className="space-y-2">
              <Label>Vai trò</Label>
              <Select value={createRole} onValueChange={setCreateRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Đối tác (nếu là Partner Admin)</Label>
              <Select value={createPartnerId} onValueChange={setCreatePartnerId}>
                <SelectTrigger><SelectValue placeholder="Không có (Admin hệ thống)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không có (Admin hệ thống)</SelectItem>
                  {partners.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs text-amber-700">Tạo tài khoản admin yêu cầu Firebase Admin SDK. Vui lòng sử dụng Firebase Console hoặc script server-side.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Hủy</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleCreateSave}>
              Tạo tài khoản
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
