import { NextRequest, NextResponse } from "next/server";

export const revalidate = 604800;

/**
 * GET /api/image-proxy?q=printer&source=wikipedia|pexels
 * source=wikipedia (default): generator=search + prop=pageimages — best for concrete nouns.
 * source=pexels: Pexels API search — best for verbs / actions.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const source = req.nextUrl.searchParams.get("source") ?? "wikipedia";
  if (!q) return NextResponse.json({ url: null });

  try {
    if (source === "pexels") {
      const apiKey = process.env.PEXELS_API_KEY;
      if (!apiKey) return NextResponse.json({ url: null });

      const pexelsUrl =
        `https://api.pexels.com/v1/search?` +
        new URLSearchParams({
          query: q,
          per_page: "5",
          orientation: "square",
        });

      const res = await fetch(pexelsUrl, {
        headers: { Authorization: apiKey },
        cache: "no-store",
      });
      if (!res.ok) return NextResponse.json({ url: null });

      const data = await res.json();
      const url: string | null =
        (data.photos as { src: { medium: string } }[])?.[0]?.src?.medium ??
        null;

      return NextResponse.json({ url });
    }

    // ── Wikipedia (default) ───────────────────────────────────────────────────
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
