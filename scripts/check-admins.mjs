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

async function checkAdmins() {
  try {
    await signInWithEmailAndPassword(auth, "admin@tripzio.com", "123456");
    const snap = await getDocs(collection(db, "admins"));
    console.log(`Tổng số admin: ${snap.size}`);
    snap.docs.forEach((doc) => {
      console.log(`- ID: ${doc.id}, Email: ${doc.data().email}, Role: ${doc.data().role}, PartnerId: ${doc.data().partnerId || 'N/A'}`);
    });
    process.exit(0);
  } catch (err) {
    console.error("Lỗi:", err.message);
    process.exit(1);
  }
}

checkAdmins();
