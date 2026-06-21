"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { Admin } from "@/types";

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  admin: Admin | null;
  loading: boolean;
  isDemoMode: false;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  // Lấy profile admin từ Firestore sau khi xác thực Firebase Auth
  const fetchAdminProfile = useCallback(async (uid: string) => {
    try {
      const snap = await getDoc(doc(db, "admins", uid));
      if (snap.exists()) {
        setAdmin({ id: snap.id, ...snap.data() } as Admin);
      } else {
        // UID tồn tại trong Auth nhưng chưa có document admins/
        // → fallback để không block UI, admin tự tạo document sau
        setAdmin({
          id: uid,
          displayName: "Admin",
          email: firebaseUser?.email ?? "",
          role: "super_admin",
          status: "active",
          createdAt: null as any,
          updatedAt: null as any,
        });
      }
    } catch (err) {
      console.error("fetchAdminProfile error:", err);
      // Firestore rules chưa mở hoặc offline → vẫn cho vào dashboard
      setAdmin({
        id: uid,
        displayName: "Admin",
        email: "",
        role: "super_admin",
        status: "active",
        createdAt: null as any,
        updatedAt: null as any,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lắng nghe trạng thái auth Firebase (persist qua reload)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        await fetchAdminProfile(user.uid);
      } else {
        setAdmin(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [fetchAdminProfile]);

  /**
   * login — chấp nhận cả username ngắn lẫn email đầy đủ:
   *   "admin"              → "admin@tripzio.com"
   *   "admin@tripzio.com"  → dùng nguyên
   */
  const login = async (usernameOrEmail: string, password: string) => {
    const trimmed = usernameOrEmail.trim();
    const email = trimmed.includes("@")
      ? trimmed
      : `${trimmed}@tripzio.com`;

    const cred = await signInWithEmailAndPassword(auth, email, password);
    await fetchAdminProfile(cred.user.uid);
  };

  const logout = async () => {
    await signOut(auth);
    setAdmin(null);
    setFirebaseUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        admin,
        loading,
        isDemoMode: false,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
