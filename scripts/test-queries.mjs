import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, orderBy } from "firebase/firestore";

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

const queries = [
  { name: "banners", ref: collection(db, "banners"), order: orderBy("order") },
  { name: "destinations", ref: collection(db, "destinations"), order: orderBy("rank") },
  { name: "themes", ref: collection(db, "themes"), order: orderBy("order") },
  { name: "articles", ref: collection(db, "articles"), order: orderBy("createdAt", "desc") },
  { name: "promos", ref: collection(db, "promos"), order: orderBy("order") },
  { name: "partners", ref: collection(db, "partners"), order: orderBy("rating", "desc") },
  { name: "tours", ref: collection(db, "tours"), order: orderBy("name") },
  { name: "last_minute_tours", ref: collection(db, "last_minute_tours"), order: orderBy("name") },
  { name: "zero_dong_tours", ref: collection(db, "zero_dong_tours"), order: orderBy("name") },
  { name: "hotels", ref: collection(db, "hotels"), order: orderBy("name") },
  { name: "flights", ref: collection(db, "flights"), order: orderBy("departureTime") },
  { name: "transfers", ref: collection(db, "transfers"), order: orderBy("name") },
  { name: "combos", ref: collection(db, "combos"), order: orderBy("name") },
];

async function runTests() {
  console.log("Starting query validation tests...\n");
  for (const q of queries) {
    try {
      const qSnap = await getDocs(query(q.ref, q.order));
      console.log(`✅ [${q.name}]: Succeeded. Document count: ${qSnap.size}`);
    } catch (e) {
      console.error(`❌ [${q.name}]: Failed with error: ${e.message}`);
    }
  }
  process.exit(0);
}

runTests();
