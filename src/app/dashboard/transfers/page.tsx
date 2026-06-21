"use client";

import { useState, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { DataTable } from "@/components/shared/DataTable";
import { PageLoader } from "@/components/shared/PageLoader";
import { FirestoreError } from "@/components/shared/FirestoreError";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTransfers, deleteDocById, updateDocById, createDoc } from "@/hooks/useFirestore";
import { formatCurrency } from "@/lib/utils";
import type { Transfer } from "@/types";
import { Plus, Pencil, Trash2, Car, Star } from "lucide-react";
import toast from "react-hot-toast";

const vehicleLabels: Record<string, string> = { "4-seater": "4 chỗ", "7-seater": "7 chỗ", "limousine": "Limousine" };
const vehicleColors: Record<string, string> = { "4-seater": "bg-blue-100 text-blue-700", "7-seater": "bg-green-100 text-green-700", "limousine": "bg-purple-100 text-purple-700" };

export default function TransfersPage() {
  const { data: transfers, loading, error, refetch } = useTransfers();
  const [editTransfer, setEditTransfer] = useState<Transfer | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [formVehicleType, setFormVehicleType] = useState<string>("7-seater");

  // Form refs
  const airportRef = useRef<HTMLInputElement>(null);
  const destinationRef = useRef<HTMLInputElement>(null);
  const durationRef = useRef<HTMLInputElement>(null);
  const supplierRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);

  const handleDelete = async (id: string) => {
    try {
      await deleteDocById("transfers", id);
      refetch();
      toast.success("Đã xóa dịch vụ xe");
    } catch (e) {
      toast.error("Xóa thất bại: " + (e as Error).message);
    }
  };

  const handleSave = async () => {
    try {
      const payload = {
        airport: airportRef.current?.value ?? "",
        destination: destinationRef.current?.value ?? "",
        vehicleType: formVehicleType,
        duration: durationRef.current?.value ?? "",
        supplierName: supplierRef.current?.value ?? "",
        price: Number(priceRef.current?.value ?? 0),
      };
      if (editTransfer) {
        await updateDocById("transfers", editTransfer.id, payload);
        toast.success("Đã cập nhật");
      } else {
        await createDoc("transfers", {
          ...payload,
          imageUrl: "",
          rating: 0,
          description: "",
        });
        toast.success("Đã thêm dịch vụ xe");
      }
      refetch();
      setEditTransfer(null);
      setShowCreate(false);
    } catch (e) {
      toast.error("Lưu thất bại: " + (e as Error).message);
    }
  };

  if (loading) return (
    <div className="page-transition">
      <Header title="Quản lý Xe đưa đón" subtitle="Đang tải..." />
      <PageLoader />
    </div>
  );

  if (error) return (
    <div className="page-transition">
      <Header title="Quản lý Xe đưa đón" subtitle="" />
      <FirestoreError error={error} />
    </div>
  );

  return (
    <div className="page-transition">
      <Header title="Quản lý Xe đưa đón" subtitle={`${transfers.length} dịch vụ xe`} />

      <div className="p-6 space-y-5">
        <div className="flex justify-end">
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700" onClick={() => {
            setFormVehicleType("7-seater");
            setShowCreate(true);
          }}>
            <Plus className="h-4 w-4" />
            Thêm dịch vụ xe
          </Button>
        </div>

        <DataTable
          data={transfers}
          searchKeys={["airport", "destination", "supplierName"]}
          searchPlaceholder="Tìm theo sân bay, điểm đến, nhà cung cấp..."
          columns={[
            {
              key: "airport",
              label: "Sân bay",
              render: (_, row) => (
                <div>
                  <p className="text-sm font-medium">{row.airport}</p>
                  <p className="text-xs text-muted-foreground">→ {row.destination}</p>
                </div>
              ),
            },
            {
              key: "vehicleType",
              label: "Loại xe",
              render: (val) => (
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${vehicleColors[val as string] ?? "bg-gray-100 text-gray-600"}`}>
                  {vehicleLabels[val as string] ?? val as string}
                </span>
              ),
            },
            {
              key: "supplierName",
              label: "Nhà cung cấp",
              render: (val) => <span className="text-sm">{val as string}</span>,
            },
            {
              key: "duration",
              label: "Thời gian",
              render: (val) => <span className="text-sm text-muted-foreground">{val as string}</span>,
            },
            {
              key: "price",
              label: "Giá",
              sortable: true,
              render: (val) => <span className="text-sm font-semibold">{formatCurrency(val as number)}</span>,
            },
            {
              key: "rating",
              label: "Đánh giá",
              sortable: true,
              render: (val) => (
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-medium">{val as number}</span>
                </div>
              ),
            },
          ]}
          actions={(row) => (
            <div className="flex justify-end gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                setFormVehicleType(row.vehicleType);
                setEditTransfer(row);
              }}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-500" onClick={() => handleDelete(row.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        />
      </div>

      <Dialog open={!!editTransfer || showCreate} onOpenChange={() => { setEditTransfer(null); setShowCreate(false); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-indigo-600" />
              {editTransfer ? "Chỉnh sửa dịch vụ xe" : "Thêm dịch vụ xe"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Sân bay</Label><Input ref={airportRef} defaultValue={editTransfer?.airport} placeholder="Sân bay Nội Bài" /></div>
            <div className="space-y-2"><Label>Điểm đến</Label><Input ref={destinationRef} defaultValue={editTransfer?.destination} placeholder="Trung tâm Hà Nội" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Loại xe</Label>
                <Select value={formVehicleType} onValueChange={setFormVehicleType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4-seater">4 chỗ</SelectItem>
                    <SelectItem value="7-seater">7 chỗ</SelectItem>
                    <SelectItem value="limousine">Limousine</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Thời gian di chuyển</Label><Input ref={durationRef} defaultValue={editTransfer?.duration} placeholder="45 phút" /></div>
            </div>
            <div className="space-y-2"><Label>Nhà cung cấp</Label><Input ref={supplierRef} defaultValue={editTransfer?.supplierName} /></div>
            <div className="space-y-2"><Label>Giá (VNĐ)</Label><Input ref={priceRef} type="number" defaultValue={editTransfer?.price} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditTransfer(null); setShowCreate(false); }}>Hủy</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleSave}>
              {editTransfer ? "Lưu" : "Tạo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
