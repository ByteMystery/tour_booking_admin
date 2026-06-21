"use client";

import { Header } from "@/components/layout/Header";
import { DataTable } from "@/components/shared/DataTable";
import { PageLoader } from "@/components/shared/PageLoader";
import { FirestoreError } from "@/components/shared/FirestoreError";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { usePromos, deleteDocById, updateDocById } from "@/hooks/useFirestore";
import type { Promo } from "@/types";
import { Plus, Pencil, Trash2, Tag, Timer } from "lucide-react";
import toast from "react-hot-toast";

export default function PromosPage() {
  const { data: promos, loading, error, refetch } = usePromos();

  const handleDelete = async (id: string) => {
    try {
      await deleteDocById("promos", id);
      refetch();
      toast.success("Đã xóa khuyến mãi");
    } catch (e) {
      toast.error("Xóa thất bại: " + (e as Error).message);
    }
  };

  const handleCountdownToggle = async (row: Promo) => {
    try {
      await updateDocById("promos", row.id, { isCountdown: !row.isCountdown });
      refetch();
      toast.success("Đã cập nhật");
    } catch (e) {
      toast.error("Cập nhật thất bại: " + (e as Error).message);
    }
  };

  if (loading) return (
    <div className="page-transition">
      <Header title="Chương trình khuyến mãi" subtitle="Đang tải..." />
      <PageLoader />
    </div>
  );

  if (error) return (
    <div className="page-transition">
      <Header title="Chương trình khuyến mãi" subtitle="" />
      <FirestoreError error={error} />
    </div>
  );

  return (
    <div className="page-transition">
      <Header title="Chương trình khuyến mãi" subtitle="Quản lý mã giảm giá và ưu đãi" />

      <div className="p-6 space-y-5">
        {/* Promo cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {promos.map((promo) => (
            <div
              key={promo.id}
              className="rounded-xl p-5 text-white shadow-md"
              style={{ background: `linear-gradient(135deg, hsl(${Math.round((promo.gradientStart >> 16 & 0xff) / 255 * 360)}, 70%, 55%), hsl(${Math.round((promo.gradientEnd >> 16 & 0xff) / 255 * 360)}, 70%, 45%))` }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold opacity-80 mb-1">{promo.title}</p>
                  <p className="text-2xl font-bold">{promo.value}</p>
                  <p className="text-xs opacity-70 mt-1">{promo.subtitle}</p>
                </div>
                {promo.isCountdown && (
                  <div className="flex items-center gap-1 rounded-full bg-white/20 px-2 py-1 text-xs">
                    <Timer className="h-3 w-3" />
                    Live
                  </div>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="rounded-lg bg-white/20 px-3 py-1 text-xs font-mono font-bold">{promo.action}</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20" onClick={() => toast("Chỉnh sửa promo...")}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20 hover:text-red-300" onClick={() => handleDelete(promo.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          <button
            className="flex h-full min-h-[140px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-muted-foreground hover:border-indigo-400 hover:text-indigo-600 transition-colors"
            onClick={() => toast("Tính năng sắp ra mắt")}
          >
            <Plus className="h-6 w-6" />
            <span className="text-sm">Thêm khuyến mãi</span>
          </button>
        </div>

        <DataTable
          data={promos}
          searchKeys={["title", "action"]}
          searchPlaceholder="Tìm theo tên, mã code..."
          columns={[
            {
              key: "title",
              label: "Khuyến mãi",
              render: (_, row) => (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100">
                    <Tag className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{row.title}</p>
                    <p className="text-xs text-muted-foreground">{row.subtitle}</p>
                  </div>
                </div>
              ),
            },
            {
              key: "value",
              label: "Giá trị",
              render: (val) => (
                <span className="text-sm font-bold text-indigo-600">{val as string}</span>
              ),
            },
            {
              key: "action",
              label: "Mã code",
              render: (val) => (
                <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{val as string}</span>
              ),
            },
            {
              key: "isCountdown",
              label: "Countdown",
              render: (val, row) => (
                <div className="flex items-center gap-2">
                  <Switch
                    checked={val as boolean}
                    onCheckedChange={() => handleCountdownToggle(row)}
                    className="scale-90"
                  />
                  {val && <Timer className="h-3.5 w-3.5 text-amber-500" />}
                </div>
              ),
            },
            {
              key: "order",
              label: "Thứ tự",
              sortable: true,
              render: (val) => <span className="text-sm text-muted-foreground">#{(val as number) + 1}</span>,
            },
          ]}
          actions={(row) => (
            <div className="flex justify-end gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast("Chỉnh sửa...")}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-500" onClick={() => handleDelete(row.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        />
      </div>
    </div>
  );
}
