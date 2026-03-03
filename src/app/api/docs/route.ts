import { NextResponse } from "next/server";
import spec from "@/lib/swagger";

/**
 * GET /api/docs
 * Returns the raw OpenAPI 3.0 JSON spec.
 * Consumed by the /api-docs Swagger UI page.
 */
export async function GET() {
  return NextResponse.json(spec);
}
