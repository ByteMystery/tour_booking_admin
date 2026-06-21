"use client";

import { Header } from "@/components/layout/Header";
import { StatsCard } from "@/components/shared/StatsCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PageLoader } from "@/components/shared/PageLoader";
import { FirestoreError } from "@/components/shared/FirestoreError";
import {
  DollarSign,
  CalendarCheck,
  Users,
  Map,
  Clock,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useBookingsRealtime } from "@/hooks/useFirestore";
import { formatCurrency, formatNumber, formatDateTime } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

const TOUR_PLACEHOLDER =
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400";

export default function DashboardPage() {
  const { stats, revenueChart, bookingByType, loading, error } =
    useDashboardStats();
  const { data: recentBookings } = useBookingsRealtime();

  if (loading)
    return (
      <div className="page-transition">
        <Header title="Dashboard" subtitle="Tổng quan hoạt động nền tảng Tripzio" />
        <PageLoader />
      </div>
    );

  if (error)
    return (
      <div className="page-transition">
        <Header title="Dashboard" subtitle="Tổng quan hoạt động nền tảng Tripzio" />
        <FirestoreError error={error} />
      </div>
    );

  return (
    <div className="page-transition">
      <Header title="Dashboard" subtitle="Tổng quan hoạt động nền tảng Tripzio" />

      <div className="p-6 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Doanh thu tháng này"
            value={formatCurrency(stats?.totalRevenue ?? 0)}
            change={stats?.revenueGrowth ?? 0}
            changeLabel="so với tháng trước"
            icon={DollarSign}
            iconColor="text-indigo-600"
            iconBg="bg-indigo-100"
          />
          <StatsCard
            title="Tổng đơn đặt chỗ"
            value={formatNumber(stats?.totalBookings ?? 0)}
            change={stats?.bookingGrowth ?? 0}
            changeLabel="so với tháng trước"
            icon={CalendarCheck}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-100"
          />
          <StatsCard
            title="Khách hàng"
            value={formatNumber(stats?.totalUsers ?? 0)}
            change={stats?.userGrowth ?? 0}
            changeLabel="tháng này"
            icon={Users}
            iconColor="text-blue-600"
            iconBg="bg-blue-100"
          />
          <StatsCard
            title="Tours đang bán"
            value={(stats?.totalTours ?? 0).toString()}
            icon={Map}
            iconColor="text-amber-600"
            iconBg="bg-amber-100"
          />
        </div>

        {/* Pending alert */}
        {(stats?.pendingBookings ?? 0) > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">
                {stats?.pendingBookings} đơn đang chờ xử lý
              </p>
              <p className="text-xs text-amber-600">
                Các đơn này cần được xác nhận thanh toán hoặc liên hệ khách hàng
              </p>
            </div>
            <Link
              href="/dashboard/bookings?status=pending"
              className="flex items-center gap-1 text-xs font-medium text-amber-700 hover:underline"
            >
              Xem ngay <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue chart */}
          <div className="lg:col-span-2 rounded-xl border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Doanh thu theo tháng</h3>
                <p className="text-xs text-muted-foreground">12 tháng gần nhất</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                <TrendingUp className="h-3.5 w-3.5" />
                +{stats?.revenueGrowth ?? 0}% tháng này
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueChart}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}M` : `${(v / 1_000).toFixed(0)}K`
                  }
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), "Doanh thu"]}
                  contentStyle={{ borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: 12 }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Booking by type */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="mb-4">
              <h3 className="font-semibold">Đơn theo loại dịch vụ</h3>
              <p className="text-xs text-muted-foreground">Tổng {recentBookings.length} đơn</p>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={bookingByType} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {bookingByType.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value + " đơn", name]} contentStyle={{ borderRadius: "10px", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-2">
              {bookingByType.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent bookings */}
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b p-5">
            <div>
              <h3 className="font-semibold">Đơn đặt chỗ gần đây</h3>
              <p className="text-xs text-muted-foreground">Cập nhật theo thời gian thực</p>
            </div>
            <Link href="/dashboard/bookings" className="flex items-center gap-1 text-sm text-indigo-600 hover:underline font-medium">
              Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y">
            {recentBookings.slice(0, 5).map((booking) => (
              <div key={booking.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                  <Image src={booking.tourImage || TOUR_PLACEHOLDER} alt={booking.tourName} fill className="object-cover" sizes="48px" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{booking.tourName}</p>
                  <p className="text-xs text-muted-foreground">
                    {booking.bookingCode} · {formatDateTime(booking.createdAt)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold">{formatCurrency(booking.totalPrice)}</p>
                  <StatusBadge status={booking.status} />
                </div>
              </div>
            ))}
            {recentBookings.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Chưa có đơn nào. Dữ liệu sẽ hiển thị khi có booking từ Firestore.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
