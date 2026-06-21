import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, updateDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyASTCzeCOpmO87T3BR17WokEYUHCuHUEuU",
  authDomain: "tripzio-app.firebaseapp.com",
  projectId: "tripzio-app",
  storageBucket: "tripzio-app.firebasestorage.app",
  messagingSenderId: "560230236557",
  appId: "1:560230236557:web:a3737de80a61917e137dc4",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const bannerUpdates = {
  "banner1": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
  "banner2": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800",
  "banner3": "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800",
};

const tourUpdates = {
  "t18": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600",
  "t19": "https://images.unsplash.com/photo-1543731068-7e0f5beff43a?w=600",
  "t20": "https://images.unsplash.com/photo-1528127269322-539801943592?w=600",
  "t21": "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=600",
  "t22": "https://images.unsplash.com/photo-1508873696983-2df519f0397e?w=600",
  "t23": "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=600",
  "t24": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600",
  "t25": "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=600",
  "t26": "https://images.unsplash.com/photo-1473116763269-255f74a75f6c?w=600",
  "t27": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600",
};

async function migrate() {
  try {
    console.log("Đăng nhập tài khoản admin...");
    await signInWithEmailAndPassword(auth, "admin@tripzio.com", "123456");
    console.log("✅ Đăng nhập thành công!");

    console.log("Đang cập nhật ảnh banner...");
    for (const [id, url] of Object.entries(bannerUpdates)) {
      await updateDoc(doc(db, "banners", id), { imageUrl: url });
      console.log(`- Đã cập nhật banner ${id}`);
    }

    console.log("Đang cập nhật ảnh tour...");
    for (const [id, url] of Object.entries(tourUpdates)) {
      try {
        await updateDoc(doc(db, "tours", id), { imageUrl: url });
        console.log(`- Đã cập nhật tour ${id}`);
      } catch (e) {
        console.log(`- Bỏ qua cập nhật tour ${id} (không tồn tại trong DB)`);
      }
    }

    console.log("\n✅ Hoàn thành cập nhật tất cả URL ảnh lỗi thành URL Unsplash chất lượng cao!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Lỗi cập nhật:", err.message);
    process.exit(1);
  }
}

migrate();
