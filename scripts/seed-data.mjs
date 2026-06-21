import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, Timestamp } from "firebase/firestore";

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

// Data mocks copied from mock-data.ts
const mockPartners = [
  {
    id: "vietravel",
    name: "Vietravel",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Vietravel_logo.svg/200px-Vietravel_logo.svg.png",
    bannerUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
    description: "Công ty du lịch hàng đầu Việt Nam với hơn 30 năm kinh nghiệm.",
    rating: 4.7,
    reviewCount: 2840,
    totalTours: 89,
    followerCount: 45200,
    location: "TP. Hồ Chí Minh",
    verified: true,
    specialties: ["Tour Đông Nam Á", "Tour Châu Âu", "Tour trong nước"],
    brandColor: 4278190335,
    foundedYear: 1992,
    responseRate: "98%",
    phone: "1800 8888",
    website: "https://www.vietravel.com",
  },
  {
    id: "saigontourist",
    name: "Saigon Tourist",
    logoUrl: "https://images.unsplash.com/photo-1549294413-26f195200c16?w=200",
    bannerUrl: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800",
    description: "Tập đoàn du lịch lớn nhất miền Nam với dịch vụ toàn diện.",
    rating: 4.6,
    reviewCount: 1920,
    totalTours: 67,
    followerCount: 38700,
    location: "TP. Hồ Chí Minh",
    verified: true,
    specialties: ["Tour MICE", "Tour nghỉ dưỡng", "Tour đặc sản ẩm thực"],
    brandColor: 4294198070,
    foundedYear: 1975,
    responseRate: "95%",
    phone: "1800 9999",
    website: "https://www.saigontourist.net",
  },
  {
    id: "nam_a_travel",
    name: "Nam Á Travel",
    logoUrl: "https://images.unsplash.com/photo-1474181487882-5abf3f0ba6c2?w=200",
    bannerUrl: "https://images.unsplash.com/photo-1474181487882-5abf3f0ba6c2?w=800",
    description: "Chuyên tour quốc tế chất lượng cao, no-shop, không phụ thu.",
    rating: 4.8,
    reviewCount: 1245,
    totalTours: 34,
    followerCount: 22100,
    location: "Hà Nội",
    verified: true,
    specialties: ["Tour Trung Quốc No-Shop", "Tour Nhật Bản", "Tour Hàn Quốc"],
    brandColor: 4279891410,
    foundedYear: 2008,
    responseRate: "99%",
    phone: "024 3825 5800",
    website: "https://namtour.com.vn",
  },
];

const mockTours = [
  {
    id: "t001",
    name: "Tour Mù Cang Chải - Chinh phục ruộng bậc thang vàng 3N2Đ",
    destination: "Mù Cang Chải",
    province: "Yên Bái",
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
    originalPrice: 2500000,
    salePrice: 1990000,
    discountPercent: 20,
    rating: 4.8,
    reviewCount: 124,
    duration: 3,
    nights: 2,
    departureSchedule: "Thứ 6, Thứ 7 hàng tuần",
    category: "Núi cao",
    region: "domestic",
    tourType: "tour",
    status: "active",
    accommodation: "Homestay cao cấp",
    isPopular: true,
    isFeatured: true,
    highlights: ["Chinh phục đỉnh Khau Phạ", "Tắm suối nước nóng Tú Lệ"],
    description: "Khám phá vẻ đẹp hoang sơ của ruộng bậc thang Mù Cang Chải...",
    includes: ["Xe đời mới đưa đón", "Ăn sáng", "Hướng dẫn viên"],
    excludes: ["Đồ uống", "Tip HDV", "VAT"],
    itinerary: [
      { day: 1, title: "Hà Nội → Tú Lệ → Mù Cang Chải", description: "Khởi hành sáng sớm..." },
      { day: 2, title: "Chinh phục Khau Phạ Pass", description: "Check-in cung đường đèo đẹp nhất Tây Bắc..." },
      { day: 3, title: "Mù Cang Chải → Hà Nội", description: "Sáng tự do khám phá chợ phiên..." },
    ],
    departureCities: ["Hà Nội"],
    schedules: [
      { date: "2026-07-15", price: 1990000, departureCity: "Hà Nội", availableSlots: 12, status: "available" },
      { date: "2026-07-22", price: 1990000, departureCity: "Hà Nội", availableSlots: 2, status: "available" },
      { date: "2026-07-29", price: 2190000, departureCity: "Hà Nội", availableSlots: 0, status: "full" },
    ],
    partnerId: "vietravel",
    partnerName: "Vietravel",
    partnerLogoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Vietravel_logo.svg/200px-Vietravel_logo.svg.png",
    partnerRating: 4.7,
  },
  {
    id: "t002",
    name: "Tour Sapa Trekking - Chinh phục Fansipan 4N3Đ",
    destination: "Sapa",
    province: "Lào Cai",
    imageUrl: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400",
    originalPrice: 4200000,
    salePrice: 3700000,
    discountPercent: 12,
    rating: 4.9,
    reviewCount: 287,
    duration: 4,
    nights: 3,
    departureSchedule: "Hằng ngày",
    category: "Trekking",
    region: "domestic",
    tourType: "tour",
    status: "active",
    accommodation: "Khách sạn 3 sao",
    isPopular: true,
    isFeatured: false,
    highlights: ["Leo cáp treo Fansipan", "Thăm bản Cát Cát", "Chèo thuyền hồ Tà Xùa"],
    description: "Trải nghiệm thiên nhiên hùng vĩ Tây Bắc...",
    includes: ["Tàu hỏa hạng mềm", "Khách sạn 3 sao", "Cáp treo Fansipan"],
    excludes: ["Vé máy bay", "Ăn tối", "Tip"],
    itinerary: [],
    departureCities: ["Hà Nội"],
    schedules: [],
    partnerId: "saigontourist",
    partnerName: "Saigon Tourist",
    partnerLogoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/a/a5/Saigontourist.png/200px-Saigontourist.png",
    partnerRating: 4.6,
  },
  {
    id: "nam_a_trung-quoc-thuong-hai",
    name: "Tour Thượng Hải - Hàng Châu - Ô Trấn 5N4Đ No-Shop",
    destination: "Thượng Hải",
    province: "Trung Quốc",
    imageUrl: "https://images.unsplash.com/photo-1474181487882-5abf3f0ba6c2?w=400",
    originalPrice: 15900000,
    salePrice: 13900000,
    discountPercent: 13,
    rating: 4.7,
    reviewCount: 56,
    duration: 5,
    nights: 4,
    departureSchedule: "Thứ 6, Thứ 7",
    category: "Quốc tế",
    region: "international",
    tourType: "tour",
    status: "active",
    accommodation: "Khách sạn 4 sao",
    isPopular: false,
    isFeatured: true,
    highlights: ["Ngoại Tân - Thượng Hải", "Phố Cổ Ô Trấn", "Tây Hồ - Hàng Châu"],
    description: "Hành trình khám phá đất nước Trung Hoa cổ đại...",
    includes: ["Vé máy bay khứ hồi", "Visa Trung Quốc", "Ăn 3 bữa/ngày"],
    excludes: ["Tiêu vặt cá nhân", "Tip HDV & lái xe", "Đồ uống"],
    itinerary: [],
    departureCities: ["Hà Nội", "Hồ Chí Minh"],
    schedules: [],
    partnerId: "nam_a_travel",
    partnerName: "Nam Á Travel",
    partnerLogoUrl: "https://namtour.com.vn/images/logo.png",
    partnerRating: 4.8,
  },
];

const mockBookings = [
  {
    id: "bk001",
    bookingCode: "BK98432",
    userId: "user001",
    bookingType: "tour",
    tourId: "t001",
    tourName: "Tour Mù Cang Chải 3N2Đ",
    tourImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
    destination: "Mù Cang Chải",
    departureDate: Timestamp.fromDate(new Date("2026-07-15")),
    returnDate: Timestamp.fromDate(new Date("2026-07-17")),
    adults: 2,
    children: 1,
    totalPrice: 5970000,
    status: "upcoming",
    departureCity: "Hà Nội",
    createdAt: Timestamp.fromDate(new Date("2026-06-01")),
    updatedAt: Timestamp.fromDate(new Date("2026-06-01")),
  },
  {
    id: "bk002",
    bookingCode: "HT83421",
    userId: "user002",
    bookingType: "hotel",
    tourId: "hotel001",
    tourName: "Khách sạn Pullman Đà Nẵng",
    tourImage: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400",
    destination: "Đà Nẵng",
    departureDate: Timestamp.fromDate(new Date("2026-07-20")),
    returnDate: Timestamp.fromDate(new Date("2026-07-23")),
    adults: 2,
    totalPrice: 6600000,
    accommodation: "Deluxe Ocean View",
    status: "pending",
    createdAt: Timestamp.fromDate(new Date("2026-06-02")),
    updatedAt: Timestamp.fromDate(new Date("2026-06-02")),
  },
  {
    id: "bk003",
    bookingCode: "FL09312",
    userId: "user003",
    bookingType: "flight",
    tourId: "flight001",
    tourName: "Bamboo Airways QH-211",
    tourImage: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400",
    destination: "Hồ Chí Minh",
    departureDate: Timestamp.fromDate(new Date("2026-07-10")),
    adults: 1,
    totalPrice: 1200000,
    status: "completed",
    airlineName: "Bamboo Airways",
    flightNumber: "QH-211",
    passengerName: "Nguyễn Văn A",
    createdAt: Timestamp.fromDate(new Date("2026-05-28")),
    updatedAt: Timestamp.fromDate(new Date("2026-07-11")),
  },
  {
    id: "bk004",
    bookingCode: "BK74521",
    userId: "user004",
    bookingType: "tour",
    tourId: "t002",
    tourName: "Tour Sapa Trekking 4N3Đ",
    tourImage: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400",
    destination: "Sapa",
    departureDate: Timestamp.fromDate(new Date("2026-08-01")),
    returnDate: Timestamp.fromDate(new Date("2026-08-04")),
    adults: 4,
    totalPrice: 14800000,
    status: "pending",
    departureCity: "Hà Nội",
    createdAt: Timestamp.fromDate(new Date("2026-06-03")),
    updatedAt: Timestamp.fromDate(new Date("2026-06-03")),
  },
  {
    id: "bk005",
    bookingCode: "TR22145",
    userId: "user005",
    bookingType: "transfer",
    tourId: "transfer001",
    tourName: "Đưa đón sân bay Nội Bài",
    tourImage: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400",
    destination: "Hà Nội",
    departureDate: Timestamp.fromDate(new Date("2026-06-08")),
    adults: 3,
    totalPrice: 350000,
    status: "upcoming",
    vehicleType: "7-seater",
    pickUpTime: "14:30",
    pickUpLocation: "Sân bay Nội Bài T2",
    dropOffLocation: "18 Phạm Ngọc Thạch, Đống Đa, Hà Nội",
    createdAt: Timestamp.fromDate(new Date("2026-06-04")),
    updatedAt: Timestamp.fromDate(new Date("2026-06-04")),
  },
  {
    id: "bk006",
    bookingCode: "BK33891",
    userId: "user006",
    bookingType: "tour",
    tourId: "t003",
    tourName: "Tour Phú Quốc 5N4Đ - Nghỉ dưỡng cao cấp",
    tourImage: "https://images.unsplash.com/photo-1598887142487-3c854d51eabb?w=400",
    destination: "Phú Quốc",
    departureDate: Timestamp.fromDate(new Date("2026-06-20")),
    returnDate: Timestamp.fromDate(new Date("2026-06-24")),
    adults: 2,
    totalPrice: 12400000,
    status: "cancelled",
    departureCity: "Hà Nội",
    createdAt: Timestamp.fromDate(new Date("2026-05-15")),
    updatedAt: Timestamp.fromDate(new Date("2026-05-20")),
  },
];

const mockUsers = [
  {
    id: "user001",
    displayName: "Nguyễn Thị Lan",
    email: "lan.nguyen@gmail.com",
    phone: "0912345678",
    location: "Hà Nội",
    photoUrl: "https://i.pravatar.cc/100?img=1",
    favoriteTourIds: ["t001", "t002"],
    addresses: [{ id: "addr1", name: "Nguyễn Thị Lan", phone: "0912345678", detail: "12 Hoàn Kiếm, Hà Nội", isDefault: true }],
    createdAt: Timestamp.fromDate(new Date("2025-03-15")),
    updatedAt: Timestamp.fromDate(new Date("2026-05-10")),
  },
  {
    id: "user002",
    displayName: "Trần Minh Tuấn",
    email: "tuan.tran@gmail.com",
    phone: "0987654321",
    location: "Đà Nẵng",
    photoUrl: "https://i.pravatar.cc/100?img=8",
    favoriteTourIds: [],
    addresses: [],
    createdAt: Timestamp.fromDate(new Date("2025-07-22")),
    updatedAt: Timestamp.fromDate(new Date("2026-04-08")),
  },
  {
    id: "user003",
    displayName: "Phạm Quỳnh Anh",
    email: "quynh.pham@outlook.com",
    phone: "0345678901",
    location: "TP. Hồ Chí Minh",
    photoUrl: "https://i.pravatar.cc/100?img=25",
    favoriteTourIds: ["t001"],
    addresses: [],
    createdAt: Timestamp.fromDate(new Date("2024-11-05")),
    updatedAt: Timestamp.fromDate(new Date("2026-06-01")),
  },
];

const mockDestinations = [
  { id: "d1", name: "Đà Nẵng", province: "Đà Nẵng", rating: 4.8, reviewCount: 3241, imageUrl: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400", rank: 1 },
  { id: "d2", name: "Sapa", province: "Lào Cai", rating: 4.7, reviewCount: 2187, imageUrl: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400", rank: 2 },
  { id: "d3", name: "Hội An", province: "Quảng Nam", rating: 4.9, reviewCount: 4012, imageUrl: "https://images.unsplash.com/photo-1557750255-c76072a7aad1?w=400", rank: 3 },
  { id: "d4", name: "Phú Quốc", province: "Kiên Giang", rating: 4.6, reviewCount: 1876, imageUrl: "https://images.unsplash.com/photo-1598887142487-3c854d51eabb?w=400", rank: 4 },
  { id: "d5", name: "Hạ Long", province: "Quảng Ninh", rating: 4.8, reviewCount: 5234, imageUrl: "https://images.unsplash.com/photo-1528181304800-259b08848526?w=400", rank: 5 },
  { id: "d6", name: "Nha Trang", province: "Khánh Hòa", rating: 4.5, reviewCount: 2890, imageUrl: "https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=400", rank: 6 },
];

const mockBanners = [
  { id: "b1", title: "Khám phá Việt Nam", subtitle: "Ưu đãi hè lên đến 40%", buttonText: "Đặt tour ngay", imageUrl: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800", order: 0 },
  { id: "b2", title: "Tour quốc tế giá tốt", subtitle: "Nhật - Hàn - Châu Âu", buttonText: "Xem ưu đãi", imageUrl: "https://images.unsplash.com/photo-1474181487882-5abf3f0ba6c2?w=800", order: 1 },
  { id: "b3", title: "Flash Sale Cuối Tuần", subtitle: "Giảm thêm 20% thanh toán online", buttonText: "Xem ngay", imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800", order: 2 },
];

async function seed() {
  try {
    console.log("Đăng nhập tài khoản admin...");
    const cred = await signInWithEmailAndPassword(auth, "admin@tripzio.com", "123456");
    console.log("✅ Đăng nhập thành công!");

    // Seed partners
    console.log("Đang seed partners...");
    for (const p of mockPartners) {
      await setDoc(doc(db, "partners", p.id), p);
    }

    // Seed tours
    console.log("Đang seed tours...");
    for (const t of mockTours) {
      // Add createdAt and updatedAt
      t.createdAt = Timestamp.now();
      t.updatedAt = Timestamp.now();
      await setDoc(doc(db, "tours", t.id), t);
    }

    // Seed bookings
    console.log("Đang seed bookings...");
    for (const b of mockBookings) {
      await setDoc(doc(db, "bookings", b.id), b);
    }

    // Seed users
    console.log("Đang seed users...");
    for (const u of mockUsers) {
      await setDoc(doc(db, "users", u.id), u);
    }

    // Seed destinations
    console.log("Đang seed destinations...");
    for (const d of mockDestinations) {
      await setDoc(doc(db, "destinations", d.id), d);
    }

    // Seed banners
    console.log("Đang seed banners...");
    for (const b of mockBanners) {
      await setDoc(doc(db, "banners", b.id), b);
    }

    console.log("✅ Hoàn thành seed tất cả dữ liệu mẫu lên Firestore!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Lỗi seed:", err.message);
    process.exit(1);
  }
}

seed();
