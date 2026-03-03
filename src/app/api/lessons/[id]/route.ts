import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { apiError } from "@/lib/api-auth";

/**
 * GET /api/lessons/[id]
 * Returns a single lesson with its full items array.
 * Public — no auth required.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const doc = await adminDb.collection("lessons").doc(id).get();

  if (!doc.exists) return apiError("Lesson not found", 404);

  return NextResponse.json({ id: doc.id, ...doc.data() });
}
