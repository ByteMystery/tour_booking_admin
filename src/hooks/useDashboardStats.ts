"use client";

/**
 * useDashboardStats.ts
 * ─────────────────────────────────────────────────────────────────
 * Tổng hợp số liệu Dashboard từ Firestore thật.
 * Firestore không có GROUP BY nên ta query từng collection riêng
 * và tính toán ở client — phù hợp với quy mô vừa/nhỏ (<50K docs).
 * ─────────────────────────────────────────────────────────────────
 */

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { DashboardStats, RevenueChartData, BookingByTypeData } from "@/types";
import { startOfMonth, subMonths, format } from "date-fns";
import { vi } from "date-fns/locale";

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueChart, setRevenueChart] = useState<RevenueChartData[]>([]);
  const [bookingByType, setBookingByType] = useState<BookingByTypeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        // ── 1. Tổng booking & doanh thu tháng này ──────────────
        const now = new Date();
        const thisMonthStart = Timestamp.fromDate(startOfMonth(now));
        const lastMonthStart = Timestamp.fromDate(startOfMonth(subMonths(now, 1)));

        const [allBookingsSnap, usersSnap, toursSnap] = await Promise.all([
          getDocs(collection(db, "bookings")),
          getDocs(collection(db, "users")),
          getDocs(query(collection(db, "tours"), where("status", "==", "active"))),
        ]);

        const allBookings = allBookingsSnap.docs.map((d) => d.data());

        // Current month
        const thisMonthBookings = allBookings.filter(
          (b) => (b.createdAt as Timestamp)?.toMillis() >= thisMonthStart.toMillis()
        );
        const lastMonthBookings = allBookings.filter(
          (b) =>
            (b.createdAt as Timestamp)?.toMillis() >= lastMonthStart.toMillis() &&
            (b.createdAt as Timestamp)?.toMillis() < thisMonthStart.toMillis()
        );

        const thisRevenue = thisMonthBookings.reduce(
          (s, b) => s + (b.totalPrice ?? 0),
          0
        );
        const lastRevenue = lastMonthBookings.reduce(
          (s, b) => s + (b.totalPrice ?? 0),
          0
        );
        const revenueGrowth =
          lastRevenue > 0
            ? parseFloat((((thisRevenue - lastRevenue) / lastRevenue) * 100).toFixed(1))
            : 0;

        const bookingGrowth =
          lastMonthBookings.length > 0
            ? parseFloat(
                (
                  ((thisMonthBookings.length - lastMonthBookings.length) /
                    lastMonthBookings.length) *
                  100
                ).toFixed(1)
              )
            : 0;

        const pendingBookings = allBookings.filter(
          (b) => b.status === "pending"
        ).length;

        setStats({
          totalRevenue: thisRevenue,
          totalBookings: allBookings.length,
          totalUsers: usersSnap.size,
          totalTours: toursSnap.size,
          pendingBookings,
          revenueGrowth,
          bookingGrowth,
          userGrowth: 0, // cần query riêng nếu muốn chính xác
        });

        // ── 2. Revenue chart — 12 tháng gần nhất ───────────────
        const chartData: RevenueChartData[] = [];
        for (let i = 11; i >= 0; i--) {
          const monthStart = Timestamp.fromDate(startOfMonth(subMonths(now, i)));
          const monthEnd = Timestamp.fromDate(startOfMonth(subMonths(now, i - 1)));
          const monthBookings = allBookings.filter(
            (b) =>
              (b.createdAt as Timestamp)?.toMillis() >= monthStart.toMillis() &&
              (b.createdAt as Timestamp)?.toMillis() < monthEnd.toMillis()
          );
          chartData.push({
            month: format(monthStart.toDate(), "T'.'MM", { locale: vi }),
            revenue: monthBookings.reduce((s, b) => s + (b.totalPrice ?? 0), 0),
            bookings: monthBookings.length,
          });
        }
        setRevenueChart(chartData);

        // ── 3. Booking by type ──────────────────────────────────
        const typeMap: Record<string, number> = {
          tour: 0,
          hotel: 0,
          flight: 0,
          transfer: 0,
        };
        allBookings.forEach((b) => {
          const t = b.bookingType as string;
          if (t in typeMap) typeMap[t]++;
        });
        setBookingByType([
          { name: "Tour", value: typeMap.tour, color: "#6366f1" },
          { name: "Khách sạn", value: typeMap.hotel, color: "#f59e0b" },
          { name: "Máy bay", value: typeMap.flight, color: "#10b981" },
          { name: "Đưa đón", value: typeMap.transfer, color: "#3b82f6" },
        ]);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return { stats, revenueChart, bookingByType, loading, error };
}
