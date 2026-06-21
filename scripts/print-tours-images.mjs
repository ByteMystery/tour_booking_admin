import { initializeApp } from "firebase/app";
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
const db = getFirestore(app);

async function printTours() {
  try {
    const snap = await getDocs(collection(db, "tours"));
    console.log(`Total tours: ${snap.size}`);
    snap.docs.forEach((doc) => {
      const data = doc.data();
      console.log(`- ID: ${doc.id}`);
      console.log(`  Name: ${data.name}`);
      console.log(`  Image: ${data.imageUrl}`);
    });
  } catch (e) {
    console.error("Error:", e);
  }
  process.exit(0);
}

printTours();
