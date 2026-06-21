import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, getDocs, doc, updateDoc, Timestamp } from "firebase/firestore";

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

async function fix() {
  try {
    await signInWithEmailAndPassword(auth, "admin@tripzio.com", "123456");
    const snap = await getDocs(collection(db, "tours"));
    
    let countMissingCreatedAt = 0;
    
    console.log(`Kiểm tra ${snap.size} tour...`);
    
    for (const d of snap.docs) {
      const data = d.data();
      const updates = {};
      
      if (!data.createdAt) {
        updates.createdAt = Timestamp.now();
        countMissingCreatedAt++;
      }
      
      if (!data.updatedAt) {
        updates.updatedAt = Timestamp.now();
      }
      
      // Đảm bảo partnerId và partnerName đồng bộ nếu thiếu
      if (!data.partnerId) {
        updates.partnerId = "nam_a_travel";
        updates.partnerName = "Nam Á Travel";
      }

      if (Object.keys(updates).length > 0) {
        console.log(`Cập nhật tour ${d.id}:`, updates);
        await updateDoc(doc(db, "tours", d.id), updates);
      }
    }
    
    console.log(`✅ Hoàn thành! Số tour thiếu createdAt được bổ sung: ${countMissingCreatedAt}`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Lỗi:", err.message);
    process.exit(1);
  }
}

fix();
