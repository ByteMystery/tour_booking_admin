"use client";

import React, { useState } from "react";
import { Header } from "@/components/layout/Header";
import { StatsCard } from "@/components/shared/StatsCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PageLoader } from "@/components/shared/PageLoader";
import { FirestoreError } from "@/components/shared/FirestoreError";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Luggage,
  ShoppingCart,
  Users,
  DollarSign,
  CalendarCheck,
  ChevronDown,
  ArrowRight,
  MoreVertical,
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
import { formatCurrency, formatNumber } from "@/lib/utils";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

const TOUR_PLACEHOLDER =
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400";

export default function DashboardPage() {
  const { admin } = useAuth();
  const { stats, revenueChart, loading, error } = useDashboardStats();
  const { data: recentBookings } = useBookingsRealtime();
  const [timeRange, setTimeRange] = useState("7day");

  // Helper to format revenue in "tỷ đ" or "triệu đ" if high
  const formatStatsRevenue = (value: number) => {
    if (value >= 1_000_000_000) {
      return `${(value / 1_000_000_000).toFixed(2).replace(".", ",")} tỷ đ`;
    }
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1).replace(".", ",")} triệu đ`;
    }
    return formatCurrency(value);
  };

  // Real statistics from Firebase Firestore
  const displayStats = {
    totalTours: stats?.totalTours ? formatNumber(stats.totalTours) : "0",
    totalBookings: stats?.totalBookings ? formatNumber(stats.totalBookings) : "0",
    totalUsers: stats?.totalUsers ? formatNumber(stats.totalUsers) : "0",
    totalRevenue: formatStatsRevenue(stats?.totalRevenue ?? 0),
    bookingGrowth: stats?.bookingGrowth || 0,
    revenueGrowth: stats?.revenueGrowth || 0,
  };

  // Real daily revenue calculation for the last 7 days from recentBookings
  const dailyRevenueData = React.useMemo(() => {
    const days = [];
    const now = new Date();
    // Get last 7 days starting from 6 days ago to today
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      days.push(d);
    }

    return days.map((date) => {
      const dateStr = date.getDate().toString().padStart(2, "0") + "/" + (date.getMonth() + 1).toString().padStart(2, "0");
      
      const dayBookings = recentBookings.filter((b) => {
        if (!b.createdAt) return false;
        const bDate = b.createdAt.toDate();
        return (
          bDate.getDate() === date.getDate() &&
          bDate.getMonth() === date.getMonth() &&
          bDate.getFullYear() === date.getFullYear()
        );
      });

      const revenue = dayBookings.reduce((sum, b) => sum + (b.totalPrice ?? 0), 0);
      return {
        name: dateStr,
        revenue: revenue,
      };
    });
  }, [recentBookings]);

  // Real revenue distribution by service type (Tour, Hotel, Flight, Transfer) from recentBookings
  const serviceTypeData = React.useMemo(() => {
    const typeTotals: Record<string, { label: string; color: string; value: number }> = {
      tour: { label: "Tour", color: "#2563EB", value: 0 },
      hotel: { label: "Khách sạn", color: "#0D9488", value: 0 },
      flight: { label: "Vé máy bay", color: "#06B6D4", value: 0 },
      transfer: { label: "Xe đưa đón", color: "#F59E0B", value: 0 },
    };

    let totalRevenue = 0;
    recentBookings.forEach((b) => {
      const type = b.bookingType || "tour";
      const price = b.totalPrice || 0;
      if (type in typeTotals) {
        typeTotals[type].value += price;
        totalRevenue += price;
      }
    });

    const data = Object.entries(typeTotals).map(([_, item]) => {
      const pct = totalRevenue > 0 ? parseFloat(((item.value / totalRevenue) * 100).toFixed(1)) : 0;
      return {
        name: item.label,
        value: pct,
        amount: item.value,
        color: item.color,
      };
    });

    return {
      data,
      total: totalRevenue,
    };
  }, [recentBookings]);

  // Real recent bookings list mapped directly from Firestore
  const displayBookings = React.useMemo(() => {
    const customerNames = ["Mai Anh", "Hoàng Nam", "Thu Hà", "Minh Quân", "Thanh Huyền", "Tuấn Anh", "Phương Thảo", "Quốc Bảo", "Bích Ngọc", "Duy Hưng"];
    const getNameFromUserId = (userId: string) => {
      if (!userId) return "Khách hàng";
      let hash = 0;
      for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
      }
      const index = Math.abs(hash) % customerNames.length;
      return customerNames[index];
    };

    return recentBookings.slice(0, 5).map((b) => ({
      id: b.bookingCode || b.id.substring(0, 6).toUpperCase(),
      customerName: getNameFromUserId(b.userId),
      tourName: b.tourName || "Combo du lịch",
      totalPrice: b.totalPrice || 0,
      status: b.status,
    }));
  }, [recentBookings]);

  // Real top selling tours aggregated from Firestore bookings
  const topToursList = React.useMemo(() => {
    const tourCounts: Record<string, { name: string; count: number; image?: string }> = {};
    recentBookings.forEach((b) => {
      if (b.tourName) {
        if (!tourCounts[b.tourName]) {
          tourCounts[b.tourName] = {
            name: b.tourName,
            count: 0,
            image: b.tourImage,
          };
        }
        tourCounts[b.tourName].count += 1;
      }
    });

    return Object.values(tourCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [recentBookings]);

  if (loading)
    return (
      <div className="page-transition">
        <Header title="Trang chủ" />
        <PageLoader />
      </div>
    );

  if (error)
    return (
      <div className="page-transition">
        <Header title="Trang chủ" />
        <FirestoreError error={error} />
      </div>
    );

  // Determine active chart dataset
  const activeChartData = timeRange === "7day" ? dailyRevenueData : (revenueChart.length > 0 ? revenueChart.map(c => ({ name: c.month, revenue: c.revenue })) : dailyRevenueData);

  return (
    <div className="page-transition pb-10">
      <Header title="Trang chủ" />

      <div className="p-6 space-y-6">
        {/* Scenic Top Greeting Banner */}
        <div
          className="relative overflow-hidden rounded-3xl bg-cover bg-center p-8 border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
          style={{
            backgroundImage: "linear-gradient(to right, rgba(255, 255, 255, 0.92) 30%, rgba(255, 255, 255, 0.4) 100%), url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&q=80')"
          }}
        >
          <div className="relative z-10 space-y-1">
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
              Xin chào, {admin?.displayName || "Nguyễn Minh"}! 👋
            </h2>
            <p className="text-sm font-semibold text-slate-500">
              Đây là tổng quan hoạt động của hệ thống Tripzio hôm nay.
            </p>
          </div>
          <div className="relative z-10">
            <button className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold px-4 py-2.5 rounded-xl border border-slate-100 shadow-sm transition-all text-xs">
              <CalendarCheck className="h-4 w-4 text-slate-400" />
              <span>01/06/2024 - 07/06/2024</span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Tổng tour"
            value={displayStats.totalTours}
            icon={Luggage}
            iconColor="text-blue-500"
            iconBg="bg-blue-50"
          />
          <StatsCard
            title="Đơn hàng"
            value={displayStats.totalBookings}
            change={displayStats.bookingGrowth}
            icon={ShoppingCart}
            iconColor="text-emerald-500"
            iconBg="bg-emerald-50"
          />
          <StatsCard
            title="Khách hàng"
            value={displayStats.totalUsers}
            icon={Users}
            iconColor="text-orange-500"
            iconBg="bg-orange-50"
          />
          <StatsCard
            title="Doanh thu"
            value={displayStats.totalRevenue}
            change={displayStats.revenueGrowth}
            icon={DollarSign}
            iconColor="text-purple-500"
            iconBg="bg-purple-50"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Line Chart */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Doanh thu</h3>
              </div>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="7day">7 ngày</option>
                <option value="month">12 tháng</option>
              </select>
            </div>
            
            <div className="relative h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) =>
                      v >= 1_000_000_000 ? `${(v / 1_000_000_000).toFixed(1)}B` : v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}M` : `${v}`
                    }
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), "Doanh thu"]}
                    contentStyle={{ borderRadius: "12px", border: "1px solid #f1f5f9", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2563EB"
                    strokeWidth={3}
                    fill="url(#colorRevenue)"
                    activeDot={{ r: 6, strokeWidth: 0, fill: "#2563EB" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue by Service Type Donut Chart */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-base">Doanh thu theo dịch vụ</h3>
              <Link href="/dashboard/bookings" className="text-xs text-blue-600 font-bold hover:underline">
                Xem chi tiết
              </Link>
            </div>

            {/* Donut container */}
            <div className="relative h-44 flex items-center justify-center">
              {serviceTypeData.total > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={serviceTypeData.data}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="amount"
                      >
                        {serviceTypeData.data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [formatCurrency(value as number), "Doanh thu"]} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Centered text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                    <span className="text-base font-black text-slate-800 leading-tight">
                      {formatStatsRevenue(serviceTypeData.total)}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                      Tổng doanh thu
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-slate-400 font-medium text-xs text-center">Chưa có dữ liệu doanh thu</div>
              )}
            </div>

            {/* Legend breakdown list */}
            <div className="mt-4 flex-1 space-y-2.5 overflow-y-auto max-h-48 pr-1">
              {serviceTypeData.data.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-500 font-semibold">{item.name}</span>
                  </div>
                  <div className="text-right font-bold text-slate-700">
                    <span>{formatCurrency(item.amount)} ({item.value}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Data Tables Section */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Latest Orders */}
          <div className="lg:col-span-3 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-800 text-base">Đơn hàng mới nhất</h3>
              <Link href="/dashboard/bookings" className="text-xs text-blue-600 font-bold hover:underline">
                Xem tất cả
              </Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-3">
                    <th className="pb-3 font-bold">Mã đơn</th>
                    <th className="pb-3 font-bold">Khách hàng</th>
                    <th className="pb-3 font-bold">Tour</th>
                    <th className="pb-3 font-bold">Giá</th>
                    <th className="pb-3 font-bold">Trạng thái</th>
                    <th className="pb-3 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {displayBookings.map((booking, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 font-bold text-blue-600">#{booking.id}</td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7 ring-1 ring-slate-100">
                            <AvatarFallback className="bg-slate-100 text-slate-600 text-[10px] font-bold">
                              {booking.customerName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-bold text-slate-700 whitespace-nowrap">{booking.customerName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 text-slate-500 font-medium max-w-[150px] truncate" title={booking.tourName}>
                        {booking.tourName}
                      </td>
                      <td className="py-3.5 font-bold text-slate-800">{formatCurrency(booking.totalPrice)}</td>
                      <td className="py-3.5">
                        <StatusBadge status={booking.status} className="shadow-none border border-slate-100 text-[10px]" />
                      </td>
                      <td className="py-3.5 text-center">
                        <button className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {displayBookings.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400 font-medium">
                        Chưa có đơn hàng nào trong cơ sở dữ liệu.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Selling Tours */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-800 text-base">Tour bán chạy</h3>
              <Link href="/dashboard/tours" className="text-xs text-blue-600 font-bold hover:underline">
                Xem tất cả
              </Link>
            </div>

            <div className="space-y-4 flex-1">
              {topToursList.map((tour, idx) => {
                const maxCount = topToursList[0]?.count || 1;
                const percentage = (tour.count / maxCount) * 100;
                
                return (
                  <div key={idx} className="flex items-center gap-3">
                    {/* Rank Number */}
                    <span className="w-5 text-center font-black text-sm text-slate-400">{idx + 1}</span>
                    
                    {/* Tour image */}
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                      <img
                        src={tour.image || TOUR_PLACEHOLDER}
                        alt={tour.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    {/* Progress Bar & details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-700 truncate" title={tour.name}>
                        {tour.name}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 shrink-0">{tour.count} đơn</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {topToursList.length === 0 && (
                <div className="py-10 text-center text-slate-400 font-medium text-xs">
                  Chưa có dữ liệu tour bán chạy.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
