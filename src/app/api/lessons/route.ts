import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { apiError } from "@/lib/api-auth";
import { Lesson } from "@/types";

/**
 * GET /api/lessons?language=de
 * Returns lesson summaries (no items array) for a given language.
 * Public — no auth required.
 */
export async function GET(req: NextRequest) {
  const language = req.nextUrl.searchParams.get("language");
  if (!language) return apiError("Missing required query param: language");

  const snap = await adminDb
    .collection("lessons")
    .where("language", "==", language)
    .orderBy("category")
    .get();

  const summaries = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      language: data.language,
      category: data.category,
      title: data.title,
      description: data.description,
      emoji: data.emoji,
      itemCount: (data.items ?? []).length,
      imageSearch: data.imageSearch ?? false,
    };
  });

  return NextResponse.json(summaries);
}

/**
 * POST /api/lessons
 * Create or overwrite a lesson. Requires the `x-admin-key` header matching
 * the ADMIN_SECRET environment variable (set this in .env.local / Vercel env vars).
 *
 * The lesson `id` is auto-generated as `{language}_{category}_{slug}` if not provided.
 *
 * --- TEMPLATE (copy-paste for AI generation) ---
 * {
 *   "language": "de",
 *   "category": "food",
 *   "title": "At the Restaurant",
 *   "description": "Order food and drinks like a local.",
 *   "emoji": "🍽️",
 *   "items": [
 *     {
 *       "id": "steak",
 *       "word": "das Steak",
 *       "translation": "steak",
 *       "article": "das",
 *       "example": "Ich möchte ein Steak, bitte.",
 *       "exampleTranslation": "I would like a steak, please."
 *     }
 *   ]
 * }
 * -----------------------------------------------
 */
export async function POST(req: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET;
  const providedKey = req.headers.get("x-admin-key");

  if (!adminSecret) {
    return apiError("ADMIN_SECRET is not configured on the server.", 500);
  }
  if (providedKey !== adminSecret) {
    return apiError("Unauthorized — invalid x-admin-key header.", 401);
  }

  let body: Partial<Lesson>;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body.");
  }

  const { language, category, title, description, emoji, items } = body;
  if (
    !language ||
    !category ||
    !title ||
    !description ||
    !emoji ||
    !items?.length
  ) {
    return apiError(
      "Missing required fields: language, category, title, description, emoji, items",
    );
  }

  // Validate items
  for (const item of items) {
    if (!item.id || !item.word || !item.translation) {
      return apiError(
        `Each item must have id, word, and translation. Offending item: ${JSON.stringify(item)}`,
      );
    }
  }

  // Auto-generate ID if not provided: {language}_{category}_{title-slug}
  const lessonId =
    (body as Lesson).id ??
    `${language}_${category}_${title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")}`;

  const lesson: Lesson = {
    id: lessonId,
    language,
    category,
    title,
    description,
    emoji,
    items,
    ...(typeof (body as Lesson).imageSearch === "boolean" && {
      imageSearch: (body as Lesson).imageSearch,
    }),
    ...((body as Lesson).imageSource && {
      imageSource: (body as Lesson).imageSource,
    }),
  };

  await adminDb.collection("lessons").doc(lessonId).set(lesson);

  return NextResponse.json({ id: lessonId, created: true }, { status: 201 });
}
