"use client";

import { Header } from "@/components/layout/Header";
import { DataTable } from "@/components/shared/DataTable";
import { PageLoader } from "@/components/shared/PageLoader";
import { FirestoreError } from "@/components/shared/FirestoreError";
import { Button } from "@/components/ui/button";
import { useArticles, deleteDocById } from "@/hooks/useFirestore";
import { Plus, Pencil, Trash2, Clock } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";

const tagColors: Record<string, string> = {
  "Cẩm nang": "bg-indigo-100 text-indigo-700",
  "Ẩm thực": "bg-orange-100 text-orange-700",
  "Mẹo du lịch": "bg-emerald-100 text-emerald-700",
  "Điểm đến": "bg-blue-100 text-blue-700",
};

export default function ArticlesPage() {
  const { data: articles, loading, error, refetch } = useArticles();

  const handleDelete = async (id: string) => {
    try {
      await deleteDocById("articles", id);
      refetch();
      toast.success("Đã xóa bài viết");
    } catch (e) {
      toast.error("Xóa thất bại: " + (e as Error).message);
    }
  };

  if (loading) return (
    <div className="page-transition">
      <Header title="Bài viết & Cẩm nang" subtitle="Đang tải..." />
      <PageLoader />
    </div>
  );

  if (error) return (
    <div className="page-transition">
      <Header title="Bài viết & Cẩm nang" subtitle="" />
      <FirestoreError error={error} />
    </div>
  );

  return (
    <div className="page-transition">
      <Header title="Bài viết & Cẩm nang" subtitle="Quản lý nội dung bài viết trên ứng dụng" />

      <div className="p-6 space-y-5">
        <div className="flex justify-end">
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700" onClick={() => toast("Tính năng sắp ra mắt")}>
            <Plus className="h-4 w-4" />
            Viết bài mới
          </Button>
        </div>

        <DataTable
          data={articles}
          searchKeys={["title", "tag"]}
          searchPlaceholder="Tìm theo tiêu đề, tag..."
          columns={[
            {
              key: "title",
              label: "Bài viết",
              render: (_, row) => (
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg">
                    <Image src={row.imageUrl} alt={row.title} fill className="object-cover" sizes="64px" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate max-w-xs">{row.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${tagColors[row.tag] ?? "bg-gray-100 text-gray-600"}`}>
                        {row.tag}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />{row.readTime}
                      </div>
                    </div>
                  </div>
                </div>
              ),
            },
            {
              key: "order",
              label: "Thứ tự",
              sortable: true,
              render: (val) => (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-sm font-bold">
                  {(val as number) + 1}
                </div>
              ),
            },
          ]}
          actions={(row) => (
            <div className="flex justify-end gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast("Mở trình chỉnh sửa...")}>
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
