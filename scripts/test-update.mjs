import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, updateDoc, getDoc } from "firebase/firestore";

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

async function test() {
  try {
    await signInWithEmailAndPassword(auth, "admin@tripzio.com", "123456");
    const docRef = doc(db, "banners", "banner1");
    
    console.log("1. Reading before update:");
    let snap = await getDoc(docRef);
    console.log(snap.data().imageUrl);
    
    console.log("2. Updating...");
    await updateDoc(docRef, { imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800" });
    
    console.log("3. Reading immediately after update:");
    snap = await getDoc(docRef);
    console.log(snap.data().imageUrl);
    
    console.log("4. Waiting 5 seconds...");
    await new Promise((r) => setTimeout(r, 5000));
    
    console.log("5. Reading after delay:");
    snap = await getDoc(docRef);
    console.log(snap.data().imageUrl);
    
  } catch (e) {
    console.error("Error:", e);
  }
  process.exit(0);
}

test();
