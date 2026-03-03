/**
 * scripts/seed.ts
 *
 * One-time script to populate Firestore with:
 *   - languages/  (language configs)
 *   - lessons/    (lesson docs with items)
 *
 * Usage:
 *   1. Copy .env.local to .env (or set env vars)
 *   2. npx tsx scripts/seed.ts
 *
 * Safe to re-run — uses set() with merge so existing data is not duplicated.
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, WriteBatch } from "firebase-admin/firestore";

// ─── Init ────────────────────────────────────────────────────────

const serviceAccountJson = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT;
if (!serviceAccountJson) {
  console.error("❌  Set FIREBASE_ADMIN_SERVICE_ACCOUNT in .env.local");
  process.exit(1);
}

const app = initializeApp({ credential: cert(JSON.parse(serviceAccountJson)) });
const db = getFirestore(app);

// ─── Data ────────────────────────────────────────────────────────

const languages = [
  { code: "de", name: "German", flag: "🇩🇪", active: true },
  { code: "fr", name: "French", flag: "🇫🇷", active: true },
  { code: "es", name: "Spanish", flag: "🇪🇸", active: true },
  { code: "it", name: "Italian", flag: "🇮🇹", active: true },
  { code: "pt", name: "Portuguese", flag: "🇵🇹", active: true },
  { code: "nl", name: "Dutch", flag: "🇳🇱", active: true },
  { code: "pl", name: "Polish", flag: "🇵🇱", active: true },
  { code: "tr", name: "Turkish", flag: "🇹🇷", active: true },
];

const lessons = [
  {
    id: "de_room_living",
    language: "de",
    category: "room",
    title: "Living Room",
    description: "Objects you find in a typical living room",
    emoji: "🛋️",
    imageSearch: true,
    items: [
      {
        id: "sofa",
        word: "das Sofa",
        translation: "sofa",
        unsplashQuery: "sofa",
      },
      {
        id: "tisch",
        word: "der Tisch",
        translation: "table",
        unsplashQuery: "table",
      },
      {
        id: "stuhl",
        word: "der Stuhl",
        translation: "chair",
        unsplashQuery: "chair",
      },
      {
        id: "fenster",
        word: "das Fenster",
        translation: "window",
        unsplashQuery: "window",
      },
      {
        id: "tuer",
        word: "die Tür",
        translation: "door",
        unsplashQuery: "door",
      },
      {
        id: "lampe",
        word: "die Lampe",
        translation: "lamp",
        unsplashQuery: "lamp",
      },
      {
        id: "teppich",
        word: "der Teppich",
        translation: "carpet",
        unsplashQuery: "carpet",
      },
      {
        id: "regal",
        word: "das Regal",
        translation: "bookshelf",
        unsplashQuery: "bookshelf",
      },
    ],
  },
  {
    id: "de_room_kitchen",
    language: "de",
    category: "kitchen",
    title: "Kitchen",
    description: "Everything you need in the kitchen",
    emoji: "🍳",
    imageSearch: true,
    items: [
      {
        id: "herd",
        word: "der Herd",
        translation: "stove",
        unsplashQuery: "stove",
      },
      {
        id: "kuehlschrank",
        word: "der Kühlschrank",
        translation: "refrigerator",
        unsplashQuery: "refrigerator",
      },
      {
        id: "spuele",
        word: "die Spüle",
        translation: "sink",
        unsplashQuery: "sink",
      },
      {
        id: "tasse",
        word: "die Tasse",
        translation: "mug",
        unsplashQuery: "mug",
      },
      {
        id: "teller",
        word: "der Teller",
        translation: "plate",
        unsplashQuery: "plate",
      },
      {
        id: "gabel",
        word: "die Gabel",
        translation: "fork",
        unsplashQuery: "fork",
      },
      {
        id: "messer",
        word: "das Messer",
        translation: "knife",
        unsplashQuery: "knife",
      },
      {
        id: "loeffel",
        word: "der Löffel",
        translation: "spoon",
        unsplashQuery: "spoon",
      },
    ],
  },
  {
    id: "de_colors",
    language: "de",
    category: "colors",
    title: "Colors",
    description: "Learn all the basic colors in German",
    emoji: "🎨",
    items: [
      { id: "rot", word: "rot", translation: "red" },
      { id: "blau", word: "blau", translation: "blue" },
      { id: "gruen", word: "grün", translation: "green" },
      { id: "gelb", word: "gelb", translation: "yellow" },
      { id: "weiss", word: "weiß", translation: "white" },
      { id: "schwarz", word: "schwarz", translation: "black" },
      { id: "orange", word: "orange", translation: "orange" },
      { id: "lila", word: "lila", translation: "purple" },
    ],
  },
  {
    id: "de_verbs_common",
    language: "de",
    category: "verbs",
    title: "Common Verbs",
    description: "The most essential German verbs",
    emoji: "⚡",
    imageSearch: true,
    imageSource: "pexels",
    items: [
      {
        id: "sehen",
        word: "sehen",
        translation: "to see",
        unsplashQuery: "person watching looking",
        example: "Ich kann dich sehen.",
        exampleTranslation: "I can see you.",
      },
      {
        id: "gehen",
        word: "gehen",
        translation: "to go",
        unsplashQuery: "person walking street",
        example: "Wir gehen ins Kino.",
        exampleTranslation: "We are going to the cinema.",
      },
      {
        id: "kommen",
        word: "kommen",
        translation: "to come",
        unsplashQuery: "person arriving door",
        example: "Er kommt morgen.",
        exampleTranslation: "He is coming tomorrow.",
      },
      {
        id: "machen",
        word: "machen",
        translation: "to do / make",
        unsplashQuery: "person working crafting",
        example: "Was machst du?",
        exampleTranslation: "What are you doing?",
      },
      {
        id: "essen",
        word: "essen",
        translation: "to eat",
        unsplashQuery: "person eating food",
        example: "Ich esse gerne Pizza.",
        exampleTranslation: "I like to eat pizza.",
      },
      {
        id: "trinken",
        word: "trinken",
        translation: "to drink",
        unsplashQuery: "person drinking water",
        example: "Sie trinkt Kaffee.",
        exampleTranslation: "She is drinking coffee.",
      },
      {
        id: "schlafen",
        word: "schlafen",
        translation: "to sleep",
        unsplashQuery: "person sleeping bed",
        example: "Das Baby schläft.",
        exampleTranslation: "The baby is sleeping.",
      },
      {
        id: "abfahren",
        word: "abfahren",
        translation: "to depart",
        unsplashQuery: "train departing station",
        example: "Der Zug fährt um 10 Uhr ab.",
        exampleTranslation: "The train departs at 10 o'clock.",
      },
    ],
  },
  {
    id: "de_directions",
    language: "de",
    category: "directions",
    title: "Directions",
    description: "Navigate in German",
    emoji: "🧭",
    items: [
      { id: "links", word: "links", translation: "left" },
      { id: "rechts", word: "rechts", translation: "right" },
      { id: "geradeaus", word: "geradeaus", translation: "straight ahead" },
      { id: "oben", word: "oben", translation: "up / above" },
      { id: "unten", word: "unten", translation: "down / below" },
      { id: "norden", word: "Norden", translation: "north" },
      { id: "sueden", word: "Süden", translation: "south" },
      { id: "ecke", word: "die Ecke", translation: "corner" },
    ],
  },
  {
    id: "de_numbers",
    language: "de",
    category: "numbers",
    title: "Numbers 1–10",
    description: "Count from one to ten in German",
    emoji: "🔢",
    items: [
      { id: "eins", word: "eins", translation: "one" },
      { id: "zwei", word: "zwei", translation: "two" },
      { id: "drei", word: "drei", translation: "three" },
      { id: "vier", word: "vier", translation: "four" },
      { id: "fuenf", word: "fünf", translation: "five" },
      { id: "sechs", word: "sechs", translation: "six" },
      { id: "sieben", word: "sieben", translation: "seven" },
      { id: "acht", word: "acht", translation: "eight" },
      { id: "neun", word: "neun", translation: "nine" },
      { id: "zehn", word: "zehn", translation: "ten" },
    ],
  },
  {
    id: "de_devices",
    language: "de",
    category: "devices",
    title: "Devices",
    description: "Tech and household devices",
    emoji: "📱",
    imageSearch: true,
    items: [
      {
        id: "handy",
        word: "das Handy",
        translation: "smartphone",
        unsplashQuery: "smartphone",
      },
      {
        id: "computer",
        word: "der Computer",
        translation: "desktop computer",
        unsplashQuery: "desktop computer",
      },
      {
        id: "laptop",
        word: "der Laptop",
        translation: "laptop",
        unsplashQuery: "laptop",
      },
      {
        id: "fernseher",
        word: "der Fernseher",
        translation: "television",
        unsplashQuery: "television",
      },
      {
        id: "drucker",
        word: "der Drucker",
        translation: "printer",
        unsplashQuery: "printer",
      },
      {
        id: "tastatur",
        word: "die Tastatur",
        translation: "computer keyboard",
        unsplashQuery: "computer keyboard",
      },
      {
        id: "maus",
        word: "die Maus",
        translation: "computer mouse",
        unsplashQuery: "computer mouse",
      },
      {
        id: "kamera",
        word: "die Kamera",
        translation: "camera",
        unsplashQuery: "camera",
      },
    ],
  },
  {
    id: "de_food",
    language: "de",
    category: "food",
    title: "Food",
    description: "Everyday food vocabulary",
    emoji: "🍎",
    imageSearch: true,
    items: [
      {
        id: "apfel",
        word: "der Apfel",
        translation: "apple",
        unsplashQuery: "apple",
      },
      {
        id: "brot",
        word: "das Brot",
        translation: "bread",
        unsplashQuery: "bread",
      },
      {
        id: "kaese",
        word: "der Käse",
        translation: "cheese",
        unsplashQuery: "cheese",
      },
      {
        id: "milch",
        word: "die Milch",
        translation: "milk",
        unsplashQuery: "milk",
      },
      { id: "ei", word: "das Ei", translation: "egg", unsplashQuery: "egg" },
      {
        id: "fleisch",
        word: "das Fleisch",
        translation: "meat",
        unsplashQuery: "meat",
      },
      {
        id: "salat",
        word: "der Salat",
        translation: "salad",
        unsplashQuery: "salad",
      },
      {
        id: "suppe",
        word: "die Suppe",
        translation: "soup",
        unsplashQuery: "soup",
      },
    ],
  },
];

// ─── Write ───────────────────────────────────────────────────────

async function seed() {
  console.log("🌱  Seeding Firestore…\n");

  // Languages — write in batches of 500
  console.log("Writing languages…");
  let batch: WriteBatch = db.batch();
  for (const lang of languages) {
    batch.set(db.collection("languages").doc(lang.code), lang, { merge: true });
  }
  await batch.commit();
  console.log(`  ✅  ${languages.length} languages written`);

  // Lessons
  console.log("\nWriting lessons…");
  batch = db.batch();
  for (const lesson of lessons) {
    const { id, ...data } = lesson;
    batch.set(db.collection("lessons").doc(id), data, { merge: true });
  }
  await batch.commit();
  console.log(`  ✅  ${lessons.length} lessons written`);

  console.log("\n🎉  Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌  Seed failed:", err);
  process.exit(1);
});
