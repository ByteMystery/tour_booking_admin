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
import { useFlights, deleteDocById, updateDocById, createDoc } from "@/hooks/useFirestore";
import { formatCurrency } from "@/lib/utils";
import type { Flight } from "@/types";
import { Plus, Pencil, Trash2, Plane, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

const airlineColors: Record<string, string> = {
  VJ: "bg-red-100 text-red-700",
  QH: "bg-green-100 text-green-700",
  VN: "bg-blue-100 text-blue-700",
};

export default function FlightsPage() {
  const { data: flights, loading, error, refetch } = useFlights();
  const [editFlight, setEditFlight] = useState<Flight | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [formFlightType, setFormFlightType] = useState<string>("economy");

  // Form refs
  const airlineCodeRef = useRef<HTMLInputElement>(null);
  const airlineNameRef = useRef<HTMLInputElement>(null);
  const flightNumberRef = useRef<HTMLInputElement>(null);
  const departureCityRef = useRef<HTMLInputElement>(null);
  const arrivalCityRef = useRef<HTMLInputElement>(null);
  const departureTimeRef = useRef<HTMLInputElement>(null);
  const arrivalTimeRef = useRef<HTMLInputElement>(null);
  const durationRef = useRef<HTMLInputElement>(null);
  const originalPriceRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);

  const handleDelete = async (id: string) => {
    try {
      await deleteDocById("flights", id);
      refetch();
      toast.success("Đã xóa chuyến bay");
    } catch (e) {
      toast.error("Xóa thất bại: " + (e as Error).message);
    }
  };

  const handleSave = async () => {
    try {
      const originalPrice = Number(originalPriceRef.current?.value ?? 0);
      const price = Number(priceRef.current?.value ?? 0);
      const payload = {
        airlineCode: airlineCodeRef.current?.value ?? "",
        airlineName: airlineNameRef.current?.value ?? "",
        flightNumber: flightNumberRef.current?.value ?? "",
        departureCity: departureCityRef.current?.value ?? "",
        arrivalCity: arrivalCityRef.current?.value ?? "",
        departureTime: departureTimeRef.current?.value ?? "",
        arrivalTime: arrivalTimeRef.current?.value ?? "",
        duration: durationRef.current?.value ?? "",
        originalPrice,
        price,
        discountPercent: originalPrice > 0 ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0,
        flightType: formFlightType,
      };
      if (editFlight) {
        await updateDocById("flights", editFlight.id, payload);
        toast.success("Đã cập nhật");
      } else {
        await createDoc("flights", {
          ...payload,
          logoUrl: "",
          luggageClass: "7kg xách tay",
          dates: [],
        });
        toast.success("Đã thêm chuyến bay");
      }
      refetch();
      setEditFlight(null);
      setShowCreate(false);
    } catch (e) {
      toast.error("Lưu thất bại: " + (e as Error).message);
    }
  };

  if (loading) return (
    <div className="page-transition">
      <Header title="Quản lý Vé máy bay" subtitle="Đang tải..." />
      <PageLoader />
    </div>
  );

  if (error) return (
    <div className="page-transition">
      <Header title="Quản lý Vé máy bay" subtitle="" />
      <FirestoreError error={error} />
    </div>
  );

  return (
    <div className="page-transition">
      <Header title="Quản lý Vé máy bay" subtitle={`${flights.length} chuyến bay trong hệ thống`} />

      <div className="p-6 space-y-5">
        <div className="flex justify-end">
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700" onClick={() => {
            setFormFlightType("economy");
            setShowCreate(true);
          }}>
            <Plus className="h-4 w-4" />
            Thêm chuyến bay
          </Button>
        </div>

        <DataTable
          data={flights}
          searchKeys={["airlineName", "flightNumber", "departureCity", "arrivalCity"]}
          searchPlaceholder="Tìm theo hãng bay, số hiệu, tuyến bay..."
          columns={[
            {
              key: "airlineName",
              label: "Hãng bay",
              render: (_, row) => (
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${airlineColors[row.airlineCode] ?? "bg-gray-100 text-gray-600"}`}>
                    {row.airlineCode}
                  </span>
                  <span className="text-sm">{row.airlineName}</span>
                </div>
              ),
            },
            {
              key: "flightNumber",
              label: "Số hiệu",
              render: (val) => (
                <span className="font-mono text-sm font-semibold">{val as string}</span>
              ),
            },
            {
              key: "departureCity",
              label: "Tuyến bay",
              render: (_, row) => (
                <div className="flex items-center gap-1.5 text-sm">
                  <span>{row.departureCity}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{row.arrivalCity}</span>
                </div>
              ),
            },
            {
              key: "departureTime",
              label: "Giờ bay",
              render: (_, row) => (
                <div className="text-sm">
                  <span className="font-medium">{row.departureTime}</span>
                  <span className="text-muted-foreground mx-1">→</span>
                  <span>{row.arrivalTime}</span>
                  <span className="ml-2 text-xs text-muted-foreground">({row.duration})</span>
                </div>
              ),
            },
            {
              key: "price",
              label: "Giá vé",
              sortable: true,
              render: (_, row) => (
                <div>
                  <p className="text-sm font-semibold">{formatCurrency(row.price)}</p>
                  <p className="text-xs line-through text-muted-foreground">{formatCurrency(row.originalPrice)}</p>
                </div>
              ),
            },
            {
              key: "dates",
              label: "Ngày bay",
              render: (val) => (
                <span className="text-xs text-muted-foreground">{((val as string[]) ?? []).length} ngày</span>
              ),
            },
          ]}
          actions={(row) => (
            <div className="flex justify-end gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                setFormFlightType(row.flightType);
                setEditFlight(row);
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

      <Dialog open={!!editFlight || showCreate} onOpenChange={() => { setEditFlight(null); setShowCreate(false); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5 text-indigo-600" />
              {editFlight ? "Chỉnh sửa Chuyến bay" : "Thêm Chuyến bay"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Mã hãng bay</Label><Input ref={airlineCodeRef} defaultValue={editFlight?.airlineCode} placeholder="VJ / QH / VN" /></div>
              <div className="space-y-2"><Label>Tên hãng bay</Label><Input ref={airlineNameRef} defaultValue={editFlight?.airlineName} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Số hiệu</Label><Input ref={flightNumberRef} defaultValue={editFlight?.flightNumber} placeholder="VJ-264" /></div>
              <div className="space-y-2">
                <Label>Hạng vé</Label>
                <Select value={formFlightType} onValueChange={setFormFlightType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="economy">Economy</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Điểm đi</Label><Input ref={departureCityRef} defaultValue={editFlight?.departureCity} /></div>
              <div className="space-y-2"><Label>Điểm đến</Label><Input ref={arrivalCityRef} defaultValue={editFlight?.arrivalCity} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Giờ cất cánh</Label><Input ref={departureTimeRef} defaultValue={editFlight?.departureTime} placeholder="08:30" /></div>
              <div className="space-y-2"><Label>Giờ hạ cánh</Label><Input ref={arrivalTimeRef} defaultValue={editFlight?.arrivalTime} placeholder="10:45" /></div>
              <div className="space-y-2"><Label>Thời gian bay</Label><Input ref={durationRef} defaultValue={editFlight?.duration} placeholder="2h 15m" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Giá gốc</Label><Input ref={originalPriceRef} type="number" defaultValue={editFlight?.originalPrice} /></div>
              <div className="space-y-2"><Label>Giá bán</Label><Input ref={priceRef} type="number" defaultValue={editFlight?.price} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditFlight(null); setShowCreate(false); }}>Hủy</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleSave}>
              {editFlight ? "Lưu" : "Tạo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
