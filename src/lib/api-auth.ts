import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { DecodedIdToken } from "firebase-admin/auth";

/**
 * Verify the Firebase ID token from the Authorization header.
 * Returns the decoded token or throws a 401 response.
 */
export async function verifyAuth(
  req: NextRequest,
): Promise<DecodedIdToken | NextResponse> {
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json({ error: "Missing auth token" }, { status: 401 });
  }

  try {
    return await adminAuth.verifyIdToken(token);
  } catch {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 },
    );
  }
}

/** Type guard: if the return is a NextResponse it is an error response */
export function isAuthError(
  result: DecodedIdToken | NextResponse,
): result is NextResponse {
  return result instanceof NextResponse;
}

/** Helper to return a standard JSON error */
export function apiError(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}
