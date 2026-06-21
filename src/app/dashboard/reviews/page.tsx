"use client";

import { Header } from "@/components/layout/Header";
import { DataTable } from "@/components/shared/DataTable";
import { PageLoader } from "@/components/shared/PageLoader";
import { FirestoreError } from "@/components/shared/FirestoreError";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAllReviews, deleteDocById } from "@/hooks/useFirestore";
import { formatDate } from "@/lib/utils";
import { Star, Trash2, ThumbsUp, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

export default function ReviewsPage() {
  const { data: reviews, loading, error, refetch } = useAllReviews();

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const handleDelete = async (id: string) => {
    try {
      await deleteDocById("tour_reviews", id);
      refetch();
      toast.success("Đã xóa đánh giá");
    } catch (e) {
      toast.error("Xóa thất bại: " + (e as Error).message);
    }
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`h-3.5 w-3.5 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
      ))}
      <span className="ml-1 text-xs font-medium">{rating}.0</span>
    </div>
  );

  if (loading) return (
    <div className="page-transition">
      <Header title="Quản lý Đánh giá" subtitle="Đang tải..." />
      <PageLoader />
    </div>
  );

  if (error) return (
    <div className="page-transition">
      <Header title="Quản lý Đánh giá" subtitle="" />
      <FirestoreError error={error} />
    </div>
  );

  return (
    <div className="page-transition">
      <Header title="Quản lý Đánh giá" subtitle="Duyệt và quản lý reviews từ khách hàng" />

      <div className="p-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-3xl font-bold text-amber-500">{avgRating.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Điểm TB tổng thể</p>
            <div className="mt-1">{renderStars(Math.round(avgRating))}</div>
          </div>
          {[3, 4, 5].map(star => (
            <div key={star} className="rounded-xl border bg-card p-4 shadow-sm">
              <p className="text-2xl font-bold">{reviews.filter(r => r.rating === star).length}</p>
              <p className="text-xs text-muted-foreground">{star} sao</p>
            </div>
          ))}
        </div>

        <DataTable
          data={reviews}
          searchKeys={["userName", "comment"]}
          searchPlaceholder="Tìm theo tên, nội dung review..."
          columns={[
            {
              key: "userName",
              label: "Khách hàng",
              render: (_, row) => (
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={row.userAvatarUrl} />
                    <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700">{row.userName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{row.userName}</span>
                </div>
              ),
            },
            {
              key: "rating",
              label: "Điểm đánh giá",
              sortable: true,
              render: (val) => renderStars(val as number),
            },
            {
              key: "comment",
              label: "Nội dung",
              render: (val) => (
                <p className="text-sm text-muted-foreground max-w-xs truncate">{val as string}</p>
              ),
            },
            {
              key: "helpful",
              label: "Hữu ích",
              sortable: true,
              render: (val) => (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <ThumbsUp className="h-3.5 w-3.5" />{val as number}
                </div>
              ),
            },
            {
              key: "createdAt",
              label: "Ngày viết",
              sortable: true,
              render: (_, row) => (
                <span className="text-xs text-muted-foreground">{formatDate(row.createdAt)}</span>
              ),
            },
          ]}
          actions={(row) => (
            <div className="flex justify-end gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-emerald-500" onClick={() => toast.success("Đã duyệt đánh giá")}>
                <CheckCircle2 className="h-4 w-4" />
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
