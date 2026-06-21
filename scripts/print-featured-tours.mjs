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

async function printFeaturedTours() {
  try {
    const snap = await getDocs(collection(db, "tours"));
    let featuredCount = 0;
    let popularCount = 0;
    snap.docs.forEach((doc) => {
      const data = doc.data();
      if (data.isFeatured) {
        featuredCount++;
        console.log(`[FEATURED] ID: ${doc.id}, Name: ${data.name}, Image: ${data.imageUrl}`);
      }
      if (data.isPopular) {
        popularCount++;
        console.log(`[POPULAR]  ID: ${doc.id}, Name: ${data.name}, Image: ${data.imageUrl}`);
      }
    });
    console.log(`\nSummary: Total Featured = ${featuredCount}, Total Popular = ${popularCount}`);
  } catch (e) {
    console.error("Error:", e);
  }
  process.exit(0);
}

printFeaturedTours();
