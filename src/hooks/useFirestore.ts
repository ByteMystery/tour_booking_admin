"use client";

/**
 * useFirestore.ts
 * ─────────────────────────────────────────────────────────────────
 * Generic + typed hooks để lấy data thật từ Firestore.
 * Thay thế mock-data trong từng page bằng các hooks này.
 * ─────────────────────────────────────────────────────────────────
 */

import { useEffect, useState, useCallback } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  QueryConstraint,
  DocumentData,
  WhereFilterOp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ─────────────────────────────────────────────────────────────────
// Generic: lấy danh sách một collection (một lần)
// ─────────────────────────────────────────────────────────────────
export function useCollection<T extends { id: string }>(
  collectionName: string,
  constraints: QueryConstraint[] = []
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, collectionName), ...constraints);
      const snap = await getDocs(q);
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as T));
      setData(items);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [collectionName]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ─────────────────────────────────────────────────────────────────
// Generic: lắng nghe real-time (onSnapshot) một collection
// ─────────────────────────────────────────────────────────────────
export function useCollectionRealtime<T extends { id: string }>(
  collectionName: string,
  constraints: QueryConstraint[] = []
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, collectionName), ...constraints);
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as T));
        setData(items);
        setLoading(false);
      },
      (e) => {
        setError(e.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [collectionName]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error };
}

// ─────────────────────────────────────────────────────────────────
// Generic: lấy một document theo ID
// ─────────────────────────────────────────────────────────────────
export function useDocument<T extends { id: string }>(
  collectionName: string,
  docId: string | null
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!docId) {
      setLoading(false);
      return;
    }
    getDoc(doc(db, collectionName, docId))
      .then((snap) => {
        if (snap.exists()) {
          setData({ id: snap.id, ...snap.data() } as T);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [collectionName, docId]);

  return { data, loading, error };
}

// ─────────────────────────────────────────────────────────────────
// Generic CRUD helpers
// ─────────────────────────────────────────────────────────────────
export async function createDoc(
  collectionName: string,
  data: DocumentData
): Promise<string> {
  const ref = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateDocById(
  collectionName: string,
  docId: string,
  data: Partial<DocumentData>
): Promise<void> {
  await updateDoc(doc(db, collectionName, docId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteDocById(
  collectionName: string,
  docId: string
): Promise<void> {
  await deleteDoc(doc(db, collectionName, docId));
}

// ─────────────────────────────────────────────────────────────────
// Typed hooks cho từng collection cụ thể
// ─────────────────────────────────────────────────────────────────
import type {
  Tour,
  Booking,
  BookingStatus,
  Partner,
  User,
  Admin,
  Hotel,
  Flight,
  Transfer,
  Banner,
  Destination,
  TourReview,
  Promo,
  Article,
} from "@/types";

/** Lấy tất cả tours, filter theo partnerId nếu là partner admin */
export function useTours(partnerId?: string) {
  const constraints: QueryConstraint[] = [orderBy("createdAt", "desc")];
  if (partnerId) {
    constraints.unshift(where("partnerId", "==", partnerId));
  }
  return useCollection<Tour>("tours", constraints);
}

/**
 * Lắng nghe bookings real-time.
 * Truyền statusFilter để lọc theo trạng thái.
 */
export function useBookingsRealtime(statusFilter?: BookingStatus) {
  const constraints: QueryConstraint[] = [orderBy("createdAt", "desc"), limit(200)];
  if (statusFilter) {
    constraints.unshift(where("status", "==", statusFilter));
  }
  return useCollectionRealtime<Booking>("bookings", constraints);
}

/** Lấy bookings một lần (có thể filter) */
export function useBookings(filters?: {
  status?: BookingStatus;
  partnerId?: string;
}) {
  const constraints: QueryConstraint[] = [orderBy("createdAt", "desc")];
  if (filters?.status) {
    constraints.unshift(where("status", "==", filters.status));
  }
  return useCollection<Booking>("bookings", constraints);
}

/** Lấy danh sách pending bookings real-time — dùng cho alert trên Dashboard */
export function usePendingBookings() {
  return useCollectionRealtime<Booking>("bookings", [
    where("status", "==", "pending"),
    orderBy("createdAt", "desc"),
  ]);
}

/** Lấy tất cả đối tác */
export function usePartners() {
  return useCollection<Partner>("partners");
}

/** Lấy tất cả khách hàng */
export function useUsers() {
  return useCollection<User>("users", [orderBy("createdAt", "desc")]);
}

/** Lấy tất cả tài khoản admin */
export function useAdmins() {
  return useCollection<Admin>("admins");
}

/** Lấy danh sách khách sạn */
export function useHotels() {
  return useCollection<Hotel>("hotels");
}

/** Lấy danh sách chuyến bay */
export function useFlights() {
  return useCollection<Flight>("flights");
}

/** Lấy danh sách xe đưa đón */
export function useTransfers() {
  return useCollection<Transfer>("transfers");
}

/** Lấy banners theo thứ tự */
export function useBanners() {
  return useCollection<Banner>("banners", [orderBy("order", "asc")]);
}

/** Lấy điểm đến theo xếp hạng */
export function useDestinations() {
  return useCollection<Destination>("destinations", [orderBy("rank", "asc")]);
}

/** Lấy đánh giá của một tour cụ thể */
export function useTourReviews(tourId?: string) {
  const constraints: QueryConstraint[] = [orderBy("createdAt", "desc")];
  if (tourId) {
    constraints.unshift(where("tourId", "==", tourId));
  }
  return useCollection<TourReview>("tour_reviews", constraints);
}

/** Lấy tất cả đánh giá (admin view) */
export function useAllReviews() {
  return useCollection<TourReview>("tour_reviews", [
    orderBy("createdAt", "desc"),
  ]);
}

/** Lấy danh sách khuyến mãi */
export function usePromos() {
  return useCollection<Promo>("promos", [orderBy("order", "asc")]);
}

/** Lấy bài viết */
export function useArticles() {
  return useCollection<Article>("articles", [orderBy("order", "asc")]);
}
