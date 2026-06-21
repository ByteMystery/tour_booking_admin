/**
 * scripts/create-admin.mjs
 * ─────────────────────────────────────────────────────────────────
 * Chạy một lần để tạo tài khoản admin trong Firebase Auth
 * và document tương ứng trong Firestore collection `admins`.
 *
 * Cách dùng (TRƯỚC KHI CHẠY: điền FIREBASE_ADMIN_* vào .env.local):
 *   node scripts/create-admin.mjs
 *
 * Nếu chưa có service account key, dùng Client SDK fallback bên dưới.
 * ─────────────────────────────────────────────────────────────────
 */

import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

// ── Config (copy thẳng từ Firebase Console) ───────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyASTCzeCOpmO87T3BR17WokEYUHCuHUEuU",
  authDomain: "tripzio-app.firebaseapp.com",
  projectId: "tripzio-app",
  storageBucket: "tripzio-app.firebasestorage.app",
  messagingSenderId: "560230236557",
  appId: "1:560230236557:web:a3737de80a61917e137dc4",
};

// ── Thông tin tài khoản admin cần tạo ────────────────────────────
const ADMIN_EMAIL = "admin@tripzio.com";
const ADMIN_PASSWORD = "123456";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdmin() {
  let uid;

  // Thử tạo mới, nếu đã tồn tại thì login để lấy UID
  try {
    console.log(`Tạo user: ${ADMIN_EMAIL} ...`);
    const cred = await createUserWithEmailAndPassword(
      auth,
      ADMIN_EMAIL,
      ADMIN_PASSWORD
    );
    uid = cred.user.uid;
    console.log(`✅ Tạo Firebase Auth user thành công. UID: ${uid}`);
  } catch (err) {
    if (err.code === "auth/email-already-in-use") {
      console.log("⚠️  User đã tồn tại, đang đăng nhập để lấy UID...");
      const cred = await signInWithEmailAndPassword(
        auth,
        ADMIN_EMAIL,
        ADMIN_PASSWORD
      );
      uid = cred.user.uid;
      console.log(`✅ Lấy UID thành công: ${uid}`);
    } else {
      throw err;
    }
  }

  // Tạo / cập nhật document trong collection `admins`
  console.log(`Ghi document admins/${uid} ...`);
  await setDoc(
    doc(db, "admins", uid),
    {
      displayName: "Admin Tripzio",
      email: ADMIN_EMAIL,
      role: "super_admin",
      status: "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  console.log("✅ Document Firestore đã tạo xong!");
  console.log("──────────────────────────────────────");
  console.log("Thông tin đăng nhập admin:");
  console.log(`  Email   : ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log(`  UID     : ${uid}`);
  console.log("──────────────────────────────────────");
  process.exit(0);
}

createAdmin().catch((err) => {
  console.error("❌ Lỗi:", err.message);
  process.exit(1);
});
