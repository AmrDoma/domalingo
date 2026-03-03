import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { apiError } from "@/lib/api-auth";

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
    };
  });

  return NextResponse.json(summaries);
}
