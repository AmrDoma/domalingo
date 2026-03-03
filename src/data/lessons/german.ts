/**
 * ⚠️  NOT USED BY THE APP.
 * Lesson data lives in Firestore.
 * This file exists only as a reference — the canonical seed source
 * is scripts/seed.ts which populates Firestore directly.
 */
import { Lesson } from "@/types";

export const germanLessons: Lesson[] = [
  // ── Living Room ───────────────────────────────────────────────
  {
    id: "de_room_living",
    language: "de",
    category: "room",
    title: "Living Room",
    description: "Objects you find in a typical living room",
    emoji: "🛋️",
    items: [
      {
        id: "sofa",
        word: "das Sofa",
        translation: "sofa / couch",
        unsplashQuery: "sofa living room",
      },
      {
        id: "tisch",
        word: "der Tisch",
        translation: "table",
        unsplashQuery: "wooden table",
      },
      {
        id: "stuhl",
        word: "der Stuhl",
        translation: "chair",
        unsplashQuery: "chair furniture",
      },
      {
        id: "fenster",
        word: "das Fenster",
        translation: "window",
        unsplashQuery: "window inside house",
      },
      {
        id: "tuer",
        word: "die Tür",
        translation: "door",
        unsplashQuery: "wooden door",
      },
      {
        id: "lampe",
        word: "die Lampe",
        translation: "lamp",
        unsplashQuery: "lamp light",
      },
      {
        id: "teppich",
        word: "der Teppich",
        translation: "carpet / rug",
        unsplashQuery: "carpet rug floor",
      },
      {
        id: "regal",
        word: "das Regal",
        translation: "shelf",
        unsplashQuery: "bookshelf",
      },
    ],
  },

  // ── Kitchen ───────────────────────────────────────────────────
  {
    id: "de_room_kitchen",
    language: "de",
    category: "kitchen",
    title: "Kitchen",
    description: "Everything you need in the kitchen",
    emoji: "🍳",
    items: [
      {
        id: "herd",
        word: "der Herd",
        translation: "stove / cooker",
        unsplashQuery: "kitchen stove",
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
        unsplashQuery: "kitchen sink",
      },
      {
        id: "tasse",
        word: "die Tasse",
        translation: "cup / mug",
        unsplashQuery: "coffee mug",
      },
      {
        id: "teller",
        word: "der Teller",
        translation: "plate",
        unsplashQuery: "plate ceramic",
      },
      {
        id: "gabel",
        word: "die Gabel",
        translation: "fork",
        unsplashQuery: "fork cutlery",
      },
      {
        id: "messer",
        word: "das Messer",
        translation: "knife",
        unsplashQuery: "knife cutlery",
      },
      {
        id: "loeffel",
        word: "der Löffel",
        translation: "spoon",
        unsplashQuery: "spoon cutlery",
      },
    ],
  },

  // ── Colors ────────────────────────────────────────────────────
  {
    id: "de_colors",
    language: "de",
    category: "colors",
    title: "Colors",
    description: "Learn all the basic colors in German",
    emoji: "🎨",
    items: [
      {
        id: "rot",
        word: "rot",
        translation: "red",
        unsplashQuery: "red color",
      },
      {
        id: "blau",
        word: "blau",
        translation: "blue",
        unsplashQuery: "blue sky",
      },
      {
        id: "gruen",
        word: "grün",
        translation: "green",
        unsplashQuery: "green nature",
      },
      {
        id: "gelb",
        word: "gelb",
        translation: "yellow",
        unsplashQuery: "yellow flowers",
      },
      {
        id: "weiss",
        word: "weiß",
        translation: "white",
        unsplashQuery: "white snow",
      },
      {
        id: "schwarz",
        word: "schwarz",
        translation: "black",
        unsplashQuery: "black texture",
      },
      {
        id: "orange",
        word: "orange",
        translation: "orange",
        unsplashQuery: "orange fruit color",
      },
      {
        id: "lila",
        word: "lila",
        translation: "purple",
        unsplashQuery: "purple lavender",
      },
    ],
  },

  // ── Common Verbs ──────────────────────────────────────────────
  {
    id: "de_verbs_common",
    language: "de",
    category: "verbs",
    title: "Common Verbs",
    description: "The most essential German verbs",
    emoji: "⚡",
    items: [
      {
        id: "sehen",
        word: "sehen",
        translation: "to see",
        example: "Ich kann dich sehen.",
        exampleTranslation: "I can see you.",
      },
      {
        id: "gehen",
        word: "gehen",
        translation: "to go",
        example: "Wir gehen ins Kino.",
        exampleTranslation: "We are going to the cinema.",
      },
      {
        id: "kommen",
        word: "kommen",
        translation: "to come",
        example: "Er kommt morgen.",
        exampleTranslation: "He is coming tomorrow.",
      },
      {
        id: "machen",
        word: "machen",
        translation: "to do/make",
        example: "Was machst du?",
        exampleTranslation: "What are you doing?",
      },
      {
        id: "essen",
        word: "essen",
        translation: "to eat",
        example: "Ich esse gerne Pizza.",
        exampleTranslation: "I like to eat pizza.",
      },
      {
        id: "trinken",
        word: "trinken",
        translation: "to drink",
        example: "Sie trinkt Kaffee.",
        exampleTranslation: "She is drinking coffee.",
      },
      {
        id: "schlafen",
        word: "schlafen",
        translation: "to sleep",
        example: "Das Baby schläft.",
        exampleTranslation: "The baby is sleeping.",
      },
      {
        id: "abfahren",
        word: "abfahren",
        translation: "to depart",
        example: "Der Zug fährt um 10 Uhr ab.",
        exampleTranslation: "The train departs at 10 o'clock.",
      },
    ],
  },

  // ── Directions ────────────────────────────────────────────────
  {
    id: "de_directions",
    language: "de",
    category: "directions",
    title: "Directions",
    description: "Navigate in German",
    emoji: "🧭",
    items: [
      {
        id: "links",
        word: "links",
        translation: "left",
        unsplashQuery: "left arrow direction",
      },
      {
        id: "rechts",
        word: "rechts",
        translation: "right",
        unsplashQuery: "right arrow direction",
      },
      {
        id: "geradeaus",
        word: "geradeaus",
        translation: "straight ahead",
        unsplashQuery: "road ahead straight",
      },
      {
        id: "oben",
        word: "oben",
        translation: "up / above",
        unsplashQuery: "upward arrow",
      },
      {
        id: "unten",
        word: "unten",
        translation: "down / below",
        unsplashQuery: "downward stairs",
      },
      {
        id: "norden",
        word: "Norden",
        translation: "north",
        unsplashQuery: "compass north",
      },
      {
        id: "sueden",
        word: "Süden",
        translation: "south",
        unsplashQuery: "compass south",
      },
      {
        id: "ecke",
        word: "die Ecke",
        translation: "corner",
        unsplashQuery: "street corner",
      },
    ],
  },

  // ── Numbers 1-10 ──────────────────────────────────────────────
  {
    id: "de_numbers",
    language: "de",
    category: "numbers",
    title: "Numbers 1–10",
    description: "Count from one to ten in German",
    emoji: "🔢",
    items: [
      {
        id: "eins",
        word: "eins",
        translation: "one",
        unsplashQuery: "number one",
      },
      {
        id: "zwei",
        word: "zwei",
        translation: "two",
        unsplashQuery: "number two",
      },
      {
        id: "drei",
        word: "drei",
        translation: "three",
        unsplashQuery: "number three",
      },
      {
        id: "vier",
        word: "vier",
        translation: "four",
        unsplashQuery: "number four",
      },
      {
        id: "fuenf",
        word: "fünf",
        translation: "five",
        unsplashQuery: "number five",
      },
      {
        id: "sechs",
        word: "sechs",
        translation: "six",
        unsplashQuery: "number six",
      },
      {
        id: "sieben",
        word: "sieben",
        translation: "seven",
        unsplashQuery: "number seven",
      },
      {
        id: "acht",
        word: "acht",
        translation: "eight",
        unsplashQuery: "number eight",
      },
      {
        id: "neun",
        word: "neun",
        translation: "nine",
        unsplashQuery: "number nine",
      },
      {
        id: "zehn",
        word: "zehn",
        translation: "ten",
        unsplashQuery: "number ten",
      },
    ],
  },

  // ── Devices ───────────────────────────────────────────────────
  {
    id: "de_devices",
    language: "de",
    category: "devices",
    title: "Devices",
    description: "Tech and household devices",
    emoji: "📱",
    items: [
      {
        id: "handy",
        word: "das Handy",
        translation: "mobile phone",
        unsplashQuery: "smartphone phone",
      },
      {
        id: "computer",
        word: "der Computer",
        translation: "computer",
        unsplashQuery: "desktop computer",
      },
      {
        id: "laptop",
        word: "der Laptop",
        translation: "laptop",
        unsplashQuery: "laptop notebook",
      },
      {
        id: "fernseher",
        word: "der Fernseher",
        translation: "television / TV",
        unsplashQuery: "television screen",
      },
      {
        id: "drucker",
        word: "der Drucker",
        translation: "printer",
        unsplashQuery: "office printer",
      },
      {
        id: "tastatur",
        word: "die Tastatur",
        translation: "keyboard",
        unsplashQuery: "keyboard typing",
      },
      {
        id: "maus",
        word: "die Maus",
        translation: "mouse (computer)",
        unsplashQuery: "computer mouse",
      },
      {
        id: "kamera",
        word: "die Kamera",
        translation: "camera",
        unsplashQuery: "digital camera",
      },
    ],
  },

  // ── Food ──────────────────────────────────────────────────────
  {
    id: "de_food",
    language: "de",
    category: "food",
    title: "Food",
    description: "Everyday food vocabulary",
    emoji: "🍎",
    items: [
      {
        id: "apfel",
        word: "der Apfel",
        translation: "apple",
        unsplashQuery: "red apple",
      },
      {
        id: "brot",
        word: "das Brot",
        translation: "bread",
        unsplashQuery: "bread loaf",
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
        unsplashQuery: "glass of milk",
      },
      { id: "ei", word: "das Ei", translation: "egg", unsplashQuery: "egg" },
      {
        id: "fleisch",
        word: "das Fleisch",
        translation: "meat",
        unsplashQuery: "raw meat",
      },
      {
        id: "salat",
        word: "der Salat",
        translation: "salad",
        unsplashQuery: "green salad",
      },
      {
        id: "suppe",
        word: "die Suppe",
        translation: "soup",
        unsplashQuery: "bowl of soup",
      },
    ],
  },
];
