/**
 * Dùng Firebase REST API để deploy Security Rules
 * node scripts/set-firestore-rules.mjs
 */
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyASTCzeCOpmO87T3BR17WokEYUHCuHUEuU",
  authDomain: "tripzio-app.firebaseapp.com",
  projectId: "tripzio-app",
};

const RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSystemAdmin() {
      return request.auth != null
        && exists(/databases/$(database)/documents/admins/$(request.auth.uid))
        && get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.role
           in ['super_admin', 'admin'];
    }

    function isPartnerAdmin(partnerId) {
      return request.auth != null
        && exists(/databases/$(database)/documents/admins/$(request.auth.uid))
        && get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.partnerId == partnerId;
    }

    match /tours/{tourId} {
      allow read: if true;
      allow write: if isSystemAdmin()
        || (request.resource.data.partnerId != null
            && isPartnerAdmin(request.resource.data.partnerId));
    }
    match /last_minute_tours/{id} {
      allow read: if true;
      allow write: if isSystemAdmin()
        || (request.resource.data.partnerId != null
            && isPartnerAdmin(request.resource.data.partnerId));
    }
    match /zero_dong_tours/{id} {
      allow read: if true;
      allow write: if isSystemAdmin()
        || (request.resource.data.partnerId != null
            && isPartnerAdmin(request.resource.data.partnerId));
    }
    match /combos/{id} {
      allow read: if true;
      allow write: if isSystemAdmin()
        || (request.resource.data.partnerId != null
            && isPartnerAdmin(request.resource.data.partnerId));
    }
    match /bookings/{bookingId} {
      allow read: if request.auth != null
        && (resource.data.userId == request.auth.uid || isSystemAdmin());
      allow create: if request.auth != null
        && request.resource.data.userId == request.auth.uid;
      allow update, delete: if isSystemAdmin();
    }
    match /admins/{adminId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.role == 'super_admin';
    }
    match /users/{userId} {
      allow read: if request.auth != null
        && (request.auth.uid == userId || isSystemAdmin());
      allow write: if isSystemAdmin();
    }
    match /tour_reviews/{id} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if isSystemAdmin();
    }
    match /partners/{id}     { allow read: if true; allow write: if isSystemAdmin(); }
    match /hotels/{id}       { allow read: if true; allow write: if isSystemAdmin(); }
    match /flights/{id}      { allow read: if true; allow write: if isSystemAdmin(); }
    match /transfers/{id}    { allow read: if true; allow write: if isSystemAdmin(); }
    match /banners/{id}      { allow read: if true; allow write: if isSystemAdmin(); }
    match /destinations/{id} { allow read: if true; allow write: if isSystemAdmin(); }
    match /themes/{id}       { allow read: if true; allow write: if isSystemAdmin(); }
    match /articles/{id}     { allow read: if true; allow write: if isSystemAdmin(); }
    match /promos/{id}       { allow read: if true; allow write: if isSystemAdmin(); }
    match /app_config/{id}   { allow read: if true; allow write: if isSystemAdmin(); }
  }
}`;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function deployRules() {
  // Lấy ID token của admin để gọi API
  const cred = await signInWithEmailAndPassword(auth, "admin@tripzio.com", "123456");
  const token = await cred.user.getIdToken();

  const projectId = "tripzio-app";
  const url = `https://firebaserules.googleapis.com/v1/projects/${projectId}/rulesets`;

  // Tạo ruleset mới
  const createRes = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source: {
        files: [{ name: "firestore.rules", content: RULES }],
      },
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    // Nếu lỗi permission, hướng dẫn manual
    console.log("⚠️  Không thể deploy qua API (cần Owner permission).");
    console.log("→ Hãy copy rules dưới đây vào Firebase Console thủ công:\n");
    console.log("URL: https://console.firebase.google.com/project/tripzio-app/firestore/rules");
    console.log("\n" + RULES);
    process.exit(0);
  }

  const ruleset = await createRes.json();
  const rulesetName = ruleset.name;

  // Gắn ruleset vào release production
  const releaseUrl = `https://firebaserules.googleapis.com/v1/projects/${projectId}/releases/cloud.firestore`;
  const releaseRes = await fetch(releaseUrl, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      release: { name: `projects/${projectId}/releases/cloud.firestore`, rulesetName },
    }),
  });

  if (releaseRes.ok) {
    console.log("✅ Security Rules đã deploy thành công!");
  } else {
    console.log("⚠️  Tạo ruleset OK nhưng release thất bại. Copy rules thủ công.");
    console.log(RULES);
  }
  process.exit(0);
}

deployRules().catch((e) => {
  console.error("Lỗi:", e.message);
  process.exit(1);
});
