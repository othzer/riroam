import {
  PrismaClient,
  Role,
  BusinessType,
  PropertyType,
  VehicleType,
  BookingType,
  BookingStatus,
  PaymentStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Money is stored as integer paise everywhere — seed data is authored in whole
// rupees and converted here.
const inr = (rupees: number) => rupees * 100;

// Real Ladakh imagery (Unsplash). If any URL fails, the ListingImage component
// falls back to a tinted ridge silhouette, so the UI never shows a broken box.
const IMG = {
  pangong: "https://images.unsplash.com/photo-1591793073561-3d0f8f9a3e5a?w=1200&q=80",
  nubra: "https://images.unsplash.com/photo-1626621331169-5f10484dbf25?w=1200&q=80",
  leh: "https://images.unsplash.com/photo-1571536802807-30451e3955d8?w=1200&q=80",
  monastery: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200&q=80",
  zanskar: "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1200&q=80",
  tsomoriri: "https://images.unsplash.com/photo-1607247544736-4b9f9f9b1b5a?w=1200&q=80",
  sham: "https://images.unsplash.com/photo-1590689080414-4b0f7d7f8f0a?w=1200&q=80",
  markha: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1200&q=80",
  hotelRoom: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80",
  homestay: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=1200&q=80",
  camp: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200&q=80",
  enfield: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=1200&q=80",
  himalayan: "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=1200&q=80",
  taxi: "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200&q=80",
  suv: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&q=80",
};

const daysFromNow = (n: number) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + n);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
let codeSeq = 0;
function bookingCode() {
  // Deterministic-but-unique codes for a repeatable seed.
  codeSeq += 1;
  let n = codeSeq * 7919 + 100000;
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += ALPHABET[n % ALPHABET.length];
    n = Math.floor(n / ALPHABET.length) + 31;
  }
  return `RR-${out}`;
}

async function main() {
  const adminEmail = process.env.ADMIN_SEED_EMAIL;
  const adminPassword = process.env.ADMIN_SEED_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error("ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD must be set in .env");
  }

  // ── Reset (FK-safe order) so the seed is repeatable ────────────────────────
  await prisma.bookingExtra.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.itineraryDay.deleteMany();
  await prisma.extra.deleteMany();
  await prisma.room.deleteMany();
  await prisma.package.deleteMany();
  await prisma.hotel.deleteMany();
  await prisma.vehicleListing.deleteMany();
  await prisma.itineraryPlan.deleteMany();
  await prisma.vendorProfile.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // ── Admin ──────────────────────────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      name: "RiRoam Admin",
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 10),
      role: Role.ADMIN,
    },
  });

  // ── Tourists (for bookings + reviews) ───────────────────────────────────────
  const touristPassword = await bcrypt.hash("riroam-demo", 10);
  const tourists = await Promise.all(
    [
      ["Ankit Sharma", "ankit@example.com"],
      ["Priya Nair", "priya@example.com"],
      ["Rohan Mehta", "rohan@example.com"],
      ["Sara Khan", "sara@example.com"],
    ].map(([name, email]) =>
      prisma.user.create({
        data: { name, email, passwordHash: touristPassword, role: Role.TOURIST },
      }),
    ),
  );

  // ── Vendors ─────────────────────────────────────────────────────────────────
  const vendorPassword = await bcrypt.hash("riroam-vendor", 10);
  async function makeVendor(v: {
    name: string;
    email: string;
    businessName: string;
    slug: string;
    businessType: BusinessType;
    city: string;
    tagline: string;
    accentColor: string;
    pending?: boolean;
  }) {
    const user = await prisma.user.create({
      data: {
        name: v.name,
        email: v.email,
        passwordHash: vendorPassword,
        role: Role.VENDOR,
      },
    });
    return prisma.vendorProfile.create({
      data: {
        userId: user.id,
        businessName: v.businessName,
        slug: v.slug,
        businessType: v.businessType,
        description: v.tagline,
        phone: "+91 98765 43210",
        city: v.city,
        state: "Ladakh",
        serviceAreas: ["Leh", "Nubra", "Pangong", v.city],
        verificationDocUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        status: v.pending ? "PENDING_REVIEW" : "APPROVED",
        approvedAt: v.pending ? null : new Date(),
        tagline: v.tagline,
        accentColor: v.accentColor,
      },
    });
  }

  const julley = await makeVendor({
    name: "Tenzin Norbu",
    email: "julley@example.com",
    businessName: "Julley Expeditions",
    slug: "julley-expeditions",
    businessType: BusinessType.TOUR_AGENCY,
    city: "Leh",
    tagline: "Small-group Ladakh circuits, run by locals since 2012.",
    accentColor: "#0D6E8F",
  });
  const sham = await makeVendor({
    name: "Dorje Angmo",
    email: "sham@example.com",
    businessName: "Sham Homestays",
    slug: "sham-homestays",
    businessType: BusinessType.HOMESTAY,
    city: "Likir",
    tagline: "Village homestays along the gentle Sham Valley trail.",
    accentColor: "#9C6210",
  });
  const wheels = await makeVendor({
    name: "Stanzin Dawa",
    email: "wheels@example.com",
    businessName: "Ladakh Wheels",
    slug: "ladakh-wheels",
    businessType: BusinessType.VEHICLE_RENTAL,
    city: "Leh",
    tagline: "Well-serviced bikes and taxis for the high passes.",
    accentColor: "#7A4A31",
  });
  // One vendor left pending so the admin approval queue has content.
  await makeVendor({
    name: "Rigzin Wangmo",
    email: "tsomoriri@example.com",
    businessName: "Tso Moriri Camps",
    slug: "tso-moriri-camps",
    businessType: BusinessType.HOTEL,
    city: "Karzok",
    tagline: "Lakeside camps at Tso Moriri.",
    accentColor: "#2F6DB4",
    pending: true,
  });

  // ── Packages ─────────────────────────────────────────────────────────────────
  type DayInput = { title: string; location: string; altitudeMeters: number; description: string };
  async function makePackage(p: {
    vendorId: string;
    title: string;
    slug: string;
    description: string;
    destinations: string[];
    startCity: string;
    durationDays: number;
    durationNights: number;
    pricePerPerson: number; // rupees
    maxGroupSize: number;
    cover: string;
    days: DayInput[];
    extras: { name: string; description?: string; price: number }[];
  }) {
    const maxAltitudeMeters = Math.max(...p.days.map((d) => d.altitudeMeters));
    return prisma.package.create({
      data: {
        vendorId: p.vendorId,
        title: p.title,
        slug: p.slug,
        description: p.description,
        destinations: p.destinations,
        startCity: p.startCity,
        durationDays: p.durationDays,
        durationNights: p.durationNights,
        maxAltitudeMeters,
        pricePerPerson: inr(p.pricePerPerson),
        maxGroupSize: p.maxGroupSize,
        availableFrom: new Date("2026-05-01T00:00:00Z"),
        availableTo: new Date("2026-09-30T00:00:00Z"),
        freeCancellationDays: 3,
        coverImageUrl: p.cover,
        imageUrls: [p.cover],
        isPublished: true,
        itineraryDays: {
          create: p.days.map((d, i) => ({
            dayNumber: i + 1,
            title: d.title,
            location: d.location,
            altitudeMeters: d.altitudeMeters,
            description: d.description,
          })),
        },
        extras: { create: p.extras.map((e) => ({ ...e, price: inr(e.price), description: e.description ?? null })) },
      },
      include: { extras: true },
    });
  }

  const pkgNubra = await makePackage({
    vendorId: julley.id,
    title: "Nubra & Pangong circuit",
    slug: "nubra-pangong-circuit",
    description:
      "The classic north Ladakh loop: two easy acclimatization days in Leh, then over Khardung La into Nubra's dunes and on to the impossible blue of Pangong Tso.",
    destinations: ["Nubra", "Pangong"],
    startCity: "Leh",
    durationDays: 6,
    durationNights: 5,
    pricePerPerson: 18499,
    maxGroupSize: 8,
    cover: IMG.pangong,
    days: [
      { title: "Arrive in Leh — rest day", location: "Leh", altitudeMeters: 3524, description: "Land at Leh, transfer to the hotel and rest. No exertion — this is the acclimatization day." },
      { title: "Leh monasteries loop", location: "Leh", altitudeMeters: 3600, description: "Gentle day visiting Thiksey and Hemis monasteries, staying below 3,600 m." },
      { title: "Khardung La to Nubra", location: "Hunder", altitudeMeters: 5359, description: "Cross Khardung La and descend into the Nubra valley. Overnight at Hunder camp." },
      { title: "Hunder dunes & Diskit", location: "Nubra", altitudeMeters: 3050, description: "Double-humped camels on the dunes and the giant Maitreya at Diskit monastery." },
      { title: "Shyok road to Pangong", location: "Pangong", altitudeMeters: 4250, description: "The dramatic Shyok river road to a lakeside camp at Pangong Tso." },
      { title: "Chang La back to Leh", location: "Leh", altitudeMeters: 5360, description: "Sunrise at the lake, then back over Chang La to Leh. Trip ends." },
    ],
    extras: [
      { name: "Inner Line Permit handling", description: "Required for Nubra & Pangong", price: 600 },
      { name: "Oxygen cylinder backup", price: 800 },
      { name: "Local guide, all 6 days", price: 2500 },
    ],
  });

  const pkgSham = await makePackage({
    vendorId: sham.id,
    title: "Sham Valley homestay trail",
    slug: "sham-valley-homestay-trail",
    description:
      "The 'apricot valley' at a gentle pace — village homestays, ancient Likir and Alchi gompas, and easy walks between hamlets.",
    destinations: ["Likir", "Temisgam"],
    startCity: "Leh",
    durationDays: 4,
    durationNights: 3,
    pricePerPerson: 9999,
    maxGroupSize: 6,
    cover: IMG.sham,
    days: [
      { title: "Leh to Likir", location: "Likir", altitudeMeters: 3500, description: "Drive to Likir, visit the gompa and settle into a village homestay." },
      { title: "Likir to Yangthang", location: "Yangthang", altitudeMeters: 3650, description: "Easy walk over the Phobe La to Yangthang." },
      { title: "Hemis Shukpachan", location: "Hemis Shukpachan", altitudeMeters: 3700, description: "Cedar groves and a walk to the sacred juniper village." },
      { title: "Temisgam to Leh", location: "Leh", altitudeMeters: 3524, description: "Visit Temisgam castle and drive back to Leh." },
    ],
    extras: [
      { name: "Homestay full board", description: "All meals with the host families", price: 1200 },
      { name: "Local trekking guide", price: 1800 },
    ],
  });

  const pkgZanskar = await makePackage({
    vendorId: julley.id,
    title: "Zanskar road expedition",
    slug: "zanskar-road-expedition",
    description:
      "A remote overland expedition to the Zanskar heartland — Kargil, Rangdum, the Drang-Drung glacier and the medieval town of Padum.",
    destinations: ["Kargil", "Padum"],
    startCity: "Leh",
    durationDays: 8,
    durationNights: 7,
    pricePerPerson: 27500,
    maxGroupSize: 6,
    cover: IMG.zanskar,
    days: [
      { title: "Leh to Kargil", location: "Kargil", altitudeMeters: 2676, description: "Drive west via Lamayuru's moonland to Kargil." },
      { title: "Kargil to Rangdum", location: "Rangdum", altitudeMeters: 3657, description: "Up the Suru valley past Nun-Kun to remote Rangdum." },
      { title: "Drang-Drung to Padum", location: "Padum", altitudeMeters: 4400, description: "Cross Pensi La beside the Drang-Drung glacier into Zanskar." },
      { title: "Padum & Karsha", location: "Padum", altitudeMeters: 3600, description: "Explore Padum and the cliff-side Karsha monastery." },
      { title: "Phugtal excursion", location: "Phugtal", altitudeMeters: 3850, description: "Day walk toward the cave monastery of Phugtal." },
      { title: "Padum to Rangdum", location: "Rangdum", altitudeMeters: 3657, description: "Begin the return over Pensi La." },
      { title: "Rangdum to Kargil", location: "Kargil", altitudeMeters: 2676, description: "Down the Suru valley back to Kargil." },
      { title: "Kargil to Leh", location: "Leh", altitudeMeters: 3524, description: "Return to Leh. Expedition ends." },
    ],
    extras: [
      { name: "Camping equipment", description: "Tents, sleeping bags, mats", price: 3000 },
      { name: "Expedition cook", price: 3500 },
    ],
  });

  const pkgTsoMoriri = await makePackage({
    vendorId: julley.id,
    title: "Tso Moriri & Changthang",
    slug: "tso-moriri-changthang",
    description:
      "Into the Changthang plateau to Tso Moriri, home of the Changpa nomads and their pashmina goats, with Tso Kar's salt flats on the way.",
    destinations: ["Tso Kar", "Tso Moriri"],
    startCity: "Leh",
    durationDays: 5,
    durationNights: 4,
    pricePerPerson: 16500,
    maxGroupSize: 8,
    cover: IMG.tsomoriri,
    days: [
      { title: "Arrive in Leh", location: "Leh", altitudeMeters: 3524, description: "Arrival and rest day in Leh." },
      { title: "Leh acclimatization", location: "Leh", altitudeMeters: 3600, description: "Short Indus valley drive to Stakna and Matho, staying low." },
      { title: "Leh to Tso Kar", location: "Tso Kar", altitudeMeters: 4530, description: "Over Taglang La to the salt lake of Tso Kar." },
      { title: "Tso Kar to Tso Moriri", location: "Karzok", altitudeMeters: 4522, description: "Along the Changthang to Korzok village on Tso Moriri." },
      { title: "Return to Leh", location: "Leh", altitudeMeters: 3524, description: "Long scenic drive back to Leh. Trip ends." },
    ],
    extras: [
      { name: "Inner Line Permit handling", price: 600 },
      { name: "Nomad camp dinner", description: "Evening with a Changpa family", price: 1500 },
    ],
  });

  const pkgMonasteries = await makePackage({
    vendorId: julley.id,
    title: "Leh monasteries & culture",
    slug: "leh-monasteries-culture",
    description:
      "A short, low-altitude introduction to Ladakhi Buddhism — Thiksey at dawn, Hemis, Shey and the old town of Leh.",
    destinations: ["Thiksey", "Hemis"],
    startCity: "Leh",
    durationDays: 3,
    durationNights: 2,
    pricePerPerson: 7499,
    maxGroupSize: 10,
    cover: IMG.monastery,
    days: [
      { title: "Arrive in Leh", location: "Leh", altitudeMeters: 3524, description: "Arrival, rest, and an evening walk to Shanti Stupa." },
      { title: "Thiksey, Hemis & Shey", location: "Thiksey", altitudeMeters: 3600, description: "Dawn prayers at Thiksey, then Hemis and Shey palace." },
      { title: "Old Leh & depart", location: "Leh", altitudeMeters: 3524, description: "Leh palace, the old town and the central market. Trip ends." },
    ],
    extras: [{ name: "Cultural guide", price: 1500 }],
  });

  const pkgMarkha = await makePackage({
    vendorId: julley.id,
    title: "Markha Valley trek",
    slug: "markha-valley-trek",
    description:
      "Ladakh's best-loved teahouse trek through the Markha valley, under Kang Yatse and over the Kongmaru La at 5,260 m.",
    destinations: ["Markha", "Kongmaru La"],
    startCity: "Leh",
    durationDays: 7,
    durationNights: 6,
    pricePerPerson: 22000,
    maxGroupSize: 8,
    cover: IMG.markha,
    days: [
      { title: "Leh to Chilling to Skiu", location: "Skiu", altitudeMeters: 3400, description: "Drive to Chilling, walk into the valley to Skiu." },
      { title: "Skiu to Markha", location: "Markha", altitudeMeters: 3800, description: "Long valley walk past ruins and mani walls to Markha village." },
      { title: "Markha to Thachungtse", location: "Thachungtse", altitudeMeters: 4250, description: "Climb with views of Kang Yatse." },
      { title: "Thachungtse to Nimaling", location: "Nimaling", altitudeMeters: 4700, description: "High meadow camp below Kang Yatse." },
      { title: "Kongmaru La to Chogdo", location: "Chogdo", altitudeMeters: 5260, description: "Cross the Kongmaru La and descend the gorge." },
      { title: "Chogdo to Leh", location: "Leh", altitudeMeters: 3524, description: "Walk out and drive back to Leh." },
      { title: "Buffer & depart", location: "Leh", altitudeMeters: 3524, description: "Contingency day, then departure." },
    ],
    extras: [
      { name: "Full camping support", description: "Tents, cook, pack ponies", price: 4000 },
      { name: "Trekking guide", price: 3000 },
    ],
  });

  const packages = [pkgNubra, pkgSham, pkgZanskar, pkgTsoMoriri, pkgMonasteries, pkgMarkha];

  // ── Hotels + rooms ───────────────────────────────────────────────────────────
  async function makeHotel(h: {
    vendorId: string;
    name: string;
    slug: string;
    propertyType: PropertyType;
    description: string;
    address: string;
    city: string;
    altitudeMeters: number;
    latitude: number;
    longitude: number;
    amenities: string[];
    cover: string;
    rooms: { name: string; description: string; pricePerNight: number; capacity: number; totalUnits: number }[];
  }) {
    return prisma.hotel.create({
      data: {
        vendorId: h.vendorId,
        name: h.name,
        slug: h.slug,
        propertyType: h.propertyType,
        description: h.description,
        address: h.address,
        city: h.city,
        state: "Ladakh",
        latitude: h.latitude,
        longitude: h.longitude,
        altitudeMeters: h.altitudeMeters,
        amenities: h.amenities,
        freeCancellationDays: 2,
        coverImageUrl: h.cover,
        imageUrls: [h.cover],
        isPublished: true,
        rooms: {
          create: h.rooms.map((r) => ({
            name: r.name,
            description: r.description,
            pricePerNight: inr(r.pricePerNight),
            capacity: r.capacity,
            totalUnits: r.totalUnits,
            amenities: [],
            imageUrls: [IMG.hotelRoom],
          })),
        },
      },
      include: { rooms: true },
    });
  }

  const hotelNubra = await makeHotel({
    vendorId: sham.id,
    name: "Nubra Ecolodge",
    slug: "nubra-ecolodge",
    propertyType: PropertyType.HOTEL,
    description: "Mud-brick eco-lodge among the seabuckthorn near Hunder, walking distance from the dunes.",
    address: "Hunder village, Nubra",
    city: "Hunder",
    altitudeMeters: 3100,
    latitude: 34.5761,
    longitude: 77.4991,
    amenities: ["wifi", "breakfast", "parking", "garden", "restaurant"],
    cover: IMG.nubra,
    rooms: [
      { name: "Deluxe Double", description: "Valley-facing room with a private bath.", pricePerNight: 3500, capacity: 2, totalUnits: 4 },
      { name: "Family Room", description: "Two double beds, sleeps four.", pricePerNight: 5500, capacity: 4, totalUnits: 2 },
    ],
  });

  const hotelLeh = await makeHotel({
    vendorId: sham.id,
    name: "The Grand Dragon Leh",
    slug: "grand-dragon-leh",
    propertyType: PropertyType.HOTEL,
    description: "Leh's dependable full-service hotel, a short walk from the main bazaar with mountain views.",
    address: "Old Road, Leh",
    city: "Leh",
    altitudeMeters: 3524,
    latitude: 34.1526,
    longitude: 77.5771,
    amenities: ["wifi", "breakfast", "parking", "restaurant", "oxygen", "heating"],
    cover: IMG.leh,
    rooms: [
      { name: "Standard King", description: "Comfortable king room with heating.", pricePerNight: 6500, capacity: 2, totalUnits: 8 },
      { name: "Deluxe Suite", description: "Suite with a sitting area and valley view.", pricePerNight: 11000, capacity: 3, totalUnits: 3 },
    ],
  });

  const homestayLikir = await makeHotel({
    vendorId: sham.id,
    name: "Norbu Homestay, Likir",
    slug: "norbu-homestay-likir",
    propertyType: PropertyType.HOMESTAY,
    description: "A working farmhouse homestay in Likir with home-cooked Ladakhi meals and an apricot orchard.",
    address: "Likir village",
    city: "Likir",
    altitudeMeters: 3500,
    latitude: 34.3,
    longitude: 77.18,
    amenities: ["breakfast", "home-cooked meals", "garden", "parking"],
    cover: IMG.homestay,
    rooms: [
      { name: "Traditional Room", description: "Ladakhi-style room with shared bath.", pricePerNight: 2200, capacity: 2, totalUnits: 3 },
    ],
  });

  const campPangong = await makeHotel({
    vendorId: julley.id,
    name: "Pangong Lakeview Camp",
    slug: "pangong-lakeview-camp",
    propertyType: PropertyType.HOTEL,
    description: "Fixed-tent camp on the Pangong shore at Spangmik — sunrise over the lake from your tent.",
    address: "Spangmik, Pangong",
    city: "Spangmik",
    altitudeMeters: 4250,
    latitude: 33.75,
    longitude: 78.6,
    amenities: ["breakfast", "restaurant", "parking", "bonfire"],
    cover: IMG.camp,
    rooms: [
      { name: "Lakeview Tent", description: "Insulated tent facing the water.", pricePerNight: 4800, capacity: 2, totalUnits: 6 },
      { name: "Standard Tent", description: "Cosy tent a row back from the shore.", pricePerNight: 3600, capacity: 2, totalUnits: 8 },
    ],
  });

  const hotels = [hotelNubra, hotelLeh, homestayLikir, campPangong];

  // ── Vehicles ─────────────────────────────────────────────────────────────────
  async function makeVehicle(v: {
    vehicleType: VehicleType;
    title: string;
    brand: string;
    model: string;
    city: string;
    pricePerDay: number;
    seats?: number;
    transmission: string;
    fuelType: string;
    totalUnits: number;
    cover: string;
  }) {
    return prisma.vehicleListing.create({
      data: {
        vendorId: wheels.id,
        vehicleType: v.vehicleType,
        title: v.title,
        brand: v.brand,
        model: v.model,
        city: v.city,
        state: "Ladakh",
        pricePerDay: inr(v.pricePerDay),
        seats: v.seats ?? null,
        transmission: v.transmission,
        fuelType: v.fuelType,
        totalUnits: v.totalUnits,
        freeCancellationDays: 1,
        coverImageUrl: v.cover,
        imageUrls: [v.cover],
        isPublished: true,
      },
    });
  }

  const vehicles = await Promise.all([
    makeVehicle({ vehicleType: VehicleType.BIKE, title: "Royal Enfield Himalayan", brand: "Royal Enfield", model: "Himalayan 411", city: "Leh", pricePerDay: 2200, transmission: "manual", fuelType: "petrol", totalUnits: 5, cover: IMG.himalayan }),
    makeVehicle({ vehicleType: VehicleType.BIKE, title: "Royal Enfield Classic 350", brand: "Royal Enfield", model: "Classic 350", city: "Leh", pricePerDay: 1800, transmission: "manual", fuelType: "petrol", totalUnits: 6, cover: IMG.enfield }),
    makeVehicle({ vehicleType: VehicleType.BIKE, title: "KTM Adventure 390", brand: "KTM", model: "390 Adventure", city: "Leh", pricePerDay: 2600, transmission: "manual", fuelType: "petrol", totalUnits: 2, cover: IMG.himalayan }),
    makeVehicle({ vehicleType: VehicleType.TAXI, title: "Toyota Innova with driver", brand: "Toyota", model: "Innova Crysta", city: "Leh", pricePerDay: 5500, seats: 6, transmission: "manual", fuelType: "diesel", totalUnits: 4, cover: IMG.suv }),
    makeVehicle({ vehicleType: VehicleType.TAXI, title: "Mahindra Scorpio with driver", brand: "Mahindra", model: "Scorpio", city: "Leh", pricePerDay: 5000, seats: 6, transmission: "manual", fuelType: "diesel", totalUnits: 3, cover: IMG.suv }),
    makeVehicle({ vehicleType: VehicleType.TAXI, title: "Maruti Dzire with driver", brand: "Maruti", model: "Swift Dzire", city: "Leh", pricePerDay: 3800, seats: 4, transmission: "manual", fuelType: "petrol", totalUnits: 5, cover: IMG.taxi }),
  ]);

  // ── Bookings + reviews ───────────────────────────────────────────────────────
  // A completed, paid, reviewed booking for a package.
  const reviewSeeds: { rating: number; title: string; comment: string; reply?: string }[] = [
    { rating: 5, title: "Perfectly paced", comment: "The two easy days in Leh made Khardung La manageable. Camp at Pangong was the highlight.", reply: "Thank you Ankit — julley! Come back for Zanskar." },
    { rating: 5, title: "Unforgettable", comment: "Our guide knew every monastery's story. Homestay food was the best part." },
    { rating: 4, title: "Rugged and beautiful", comment: "Long driving days but the landscapes are worth every hour." },
    { rating: 5, title: "Bikers' dream", comment: "Bike was well-serviced and the backup support gave us real peace of mind." },
    { rating: 4, title: "Great stay", comment: "Warm room, hot water, and a short walk to the dunes." },
    { rating: 5, title: "Nomad country", comment: "Tso Moriri at sunrise is something I'll never forget." },
  ];

  let reviewIdx = 0;
  async function completedBooking(opts: {
    tourist: (typeof tourists)[number];
    vendorId: string;
    type: BookingType;
    packageId?: string;
    hotelId?: string;
    roomId?: string;
    vehicleId?: string;
    startOffset: number;
    nights: number;
    guestCount: number;
    unitCount: number;
    base: number; // rupees total
    review?: boolean;
    reviewTargetIsListing?: boolean;
  }) {
    const start = daysFromNow(opts.startOffset);
    const end = daysFromNow(opts.startOffset + opts.nights);
    const total = inr(opts.base);
    const booking = await prisma.booking.create({
      data: {
        bookingCode: bookingCode(),
        touristId: opts.tourist.id,
        vendorId: opts.vendorId,
        bookingType: opts.type,
        packageId: opts.packageId,
        hotelId: opts.hotelId,
        roomId: opts.roomId,
        vehicleId: opts.vehicleId,
        startDate: start,
        endDate: end,
        guestCount: opts.guestCount,
        unitCount: opts.unitCount,
        baseAmount: total,
        extrasAmount: 0,
        totalAmount: total,
        status: BookingStatus.COMPLETED,
        contactName: opts.tourist.name,
        contactPhone: "+91 90000 00000",
        payment: {
          create: {
            razorpayOrderId: `order_seed_${bookingCode()}`,
            razorpayPaymentId: `pay_seed_${bookingCode()}`,
            amount: total,
            status: PaymentStatus.PAID,
            paidAt: start,
          },
        },
      },
    });

    if (opts.review) {
      const seed = reviewSeeds[reviewIdx % reviewSeeds.length];
      reviewIdx += 1;
      await prisma.review.create({
        data: {
          bookingId: booking.id,
          touristId: opts.tourist.id,
          vendorId: opts.vendorId,
          packageId: opts.packageId,
          hotelId: opts.hotelId,
          vehicleId: opts.vehicleId,
          rating: seed.rating,
          title: seed.title,
          comment: seed.comment,
          vendorReply: seed.reply ?? null,
          repliedAt: seed.reply ? new Date() : null,
        },
      });
    }
    return booking;
  }

  // Completed + reviewed spread across listing types and tourists.
  await completedBooking({ tourist: tourists[0], vendorId: julley.id, type: BookingType.PACKAGE, packageId: pkgNubra.id, startOffset: -40, nights: 5, guestCount: 2, unitCount: 1, base: 36998, review: true });
  await completedBooking({ tourist: tourists[1], vendorId: julley.id, type: BookingType.PACKAGE, packageId: pkgMonasteries.id, startOffset: -30, nights: 2, guestCount: 2, unitCount: 1, base: 14998, review: true });
  await completedBooking({ tourist: tourists[2], vendorId: julley.id, type: BookingType.PACKAGE, packageId: pkgZanskar.id, startOffset: -60, nights: 7, guestCount: 2, unitCount: 1, base: 55000, review: true });
  await completedBooking({ tourist: tourists[3], vendorId: wheels.id, type: BookingType.VEHICLE, vehicleId: vehicles[0].id, startOffset: -20, nights: 4, guestCount: 1, unitCount: 1, base: 8800, review: true });
  await completedBooking({ tourist: tourists[0], vendorId: sham.id, type: BookingType.HOTEL, hotelId: hotelNubra.id, roomId: hotelNubra.rooms[0].id, startOffset: -25, nights: 2, guestCount: 2, unitCount: 1, base: 7000, review: true });
  await completedBooking({ tourist: tourists[1], vendorId: julley.id, type: BookingType.PACKAGE, packageId: pkgTsoMoriri.id, startOffset: -15, nights: 4, guestCount: 2, unitCount: 1, base: 33000, review: true });
  // A few more completed without reviews, for booking volume.
  await completedBooking({ tourist: tourists[2], vendorId: sham.id, type: BookingType.PACKAGE, packageId: pkgSham.id, startOffset: -12, nights: 3, guestCount: 2, unitCount: 1, base: 19998 });
  await completedBooking({ tourist: tourists[3], vendorId: wheels.id, type: BookingType.VEHICLE, vehicleId: vehicles[3].id, startOffset: -10, nights: 3, guestCount: 4, unitCount: 1, base: 16500 });

  // Two upcoming confirmed bookings (paid, in the future).
  async function upcomingBooking(opts: { tourist: (typeof tourists)[number]; vendorId: string; type: BookingType; packageId?: string; hotelId?: string; roomId?: string; startOffset: number; nights: number; base: number }) {
    const start = daysFromNow(opts.startOffset);
    const end = daysFromNow(opts.startOffset + opts.nights);
    const total = inr(opts.base);
    await prisma.booking.create({
      data: {
        bookingCode: bookingCode(),
        touristId: opts.tourist.id,
        vendorId: opts.vendorId,
        bookingType: opts.type,
        packageId: opts.packageId,
        hotelId: opts.hotelId,
        roomId: opts.roomId,
        startDate: start,
        endDate: end,
        guestCount: 2,
        unitCount: 1,
        baseAmount: total,
        extrasAmount: 0,
        totalAmount: total,
        status: BookingStatus.CONFIRMED,
        contactName: opts.tourist.name,
        contactPhone: "+91 90000 00000",
        payment: { create: { razorpayOrderId: `order_seed_${bookingCode()}`, razorpayPaymentId: `pay_seed_${bookingCode()}`, amount: total, status: PaymentStatus.PAID, paidAt: new Date() } },
      },
    });
  }
  await upcomingBooking({ tourist: tourists[0], vendorId: julley.id, type: BookingType.PACKAGE, packageId: pkgNubra.id, startOffset: 20, nights: 5, base: 36998 });
  await upcomingBooking({ tourist: tourists[1], vendorId: sham.id, type: BookingType.HOTEL, hotelId: hotelLeh.id, roomId: hotelLeh.rooms[0].id, startOffset: 14, nights: 3, base: 19500 });

  // ── Recompute denormalized rating/reviewCount from the reviews we created ─────
  async function recompute(model: "package" | "hotel" | "vehicleListing", ids: string[], key: "packageId" | "hotelId" | "vehicleId") {
    for (const id of ids) {
      const agg = await prisma.review.aggregate({ _avg: { rating: true }, _count: true, where: { [key]: id } });
      // @ts-expect-error dynamic model access is fine here
      await prisma[model].update({ where: { id }, data: { avgRating: agg._avg.rating ?? 0, reviewCount: agg._count } });
    }
  }
  await recompute("package", packages.map((p) => p.id), "packageId");
  await recompute("hotel", hotels.map((h) => h.id), "hotelId");
  await recompute("vehicleListing", vehicles.map((v) => v.id), "vehicleId");

  console.log(
    `Seeded: admin + ${tourists.length} tourists, 4 vendors (1 pending), ` +
      `${packages.length} packages, ${hotels.length} hotels, ${vehicles.length} vehicles, ` +
      `bookings + reviews.`,
  );
  console.log(`Admin: ${admin.email}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
