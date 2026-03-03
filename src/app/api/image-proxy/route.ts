import { NextRequest, NextResponse } from "next/server";

export const revalidate = 604800;

/**
 * GET /api/image-proxy?q=printer
 * Single Wikipedia API call: generator=search + prop=pageimages
 * Returns the first result that has a lead thumbnail.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ url: null });

  try {
    const apiUrl =
      `https://en.wikipedia.org/w/api.php?` +
      new URLSearchParams({
        action: "query",
        generator: "search",
        gsrsearch: q,
        gsrlimit: "5",
        prop: "pageimages",
        pithumbsize: "480",
        format: "json",
        origin: "*",
      });

    const res = await fetch(apiUrl, { cache: "no-store" });
    if (!res.ok) return NextResponse.json({ url: null });

    const data = await res.json();
    const pages: Record<
      string,
      { index?: number; thumbnail?: { source: string } }
    > = data?.query?.pages ?? {};

    // Sort by search rank (gsrsection index) and pick first with a thumbnail
    const url =
      Object.values(pages)
        .sort((a, b) => (a.index ?? 99) - (b.index ?? 99))
        .find((p) => p.thumbnail?.source)?.thumbnail?.source ?? null;

    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ url: null });
  }
}
