import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAuth, isAuthError } from "@/lib/api-auth";
import { SRSCard } from "@/types";
import { today } from "@/lib/utils";

/**
 * GET /api/cards?language=de&dueOnly=true
 * Returns all SRS cards for the authenticated user.
 */
export async function GET(req: NextRequest) {
  const decoded = await verifyAuth(req);
  if (isAuthError(decoded)) return decoded;

  const uid = decoded.uid;
  const language = req.nextUrl.searchParams.get("language");
  const dueOnly = req.nextUrl.searchParams.get("dueOnly") === "true";

  let q = adminDb
    .collection("users")
    .doc(uid)
    .collection("cards")
    .orderBy("dueDate") as FirebaseFirestore.Query;

  if (language) q = q.where("language", "==", language);
  if (dueOnly) q = q.where("dueDate", "<=", today());

  const snap = await q.get();
  const cards: SRSCard[] = snap.docs.map((d) => d.data() as SRSCard);

  return NextResponse.json(cards);
}
