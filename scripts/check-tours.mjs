import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, getDocs } from "firebase/firestore";

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

async function check() {
  try {
    await signInWithEmailAndPassword(auth, "admin@tripzio.com", "123456");
    const snap = await getDocs(collection(db, "tours"));
    console.log(`Tổng số tour trong collection 'tours': ${snap.size}`);
    snap.docs.forEach((doc) => {
      const data = doc.data();
      console.log(`\n- ID: ${doc.id}`);
      console.log(`  Name: ${data.name}`);
      console.log(`  Original Price: ${data.originalPrice}, Sale Price: ${data.salePrice}`);
      console.log(`  Departure Cities:`, data.departureCities);
      console.log(`  Schedules:`, JSON.stringify(data.schedules, null, 2));
    });
    process.exit(0);
  } catch (err) {
    console.error("Lỗi:", err.message);
    process.exit(1);
  }
}

check();
