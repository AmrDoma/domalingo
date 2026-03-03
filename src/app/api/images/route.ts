import { NextRequest, NextResponse } from "next/server";

export const revalidate = 604800;

interface ImageQuery {
  q: string;
  source?: string;
}

// ── Wikipedia ────────────────────────────────────────────────────────────────

/**
 * Identical logic to GET /api/image-proxy for wikipedia:
 * generator=search + prop=pageimages, sorted by search rank.
 */
async function fetchWikipedia(q: string): Promise<string | null> {
  const url =
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
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    const pages: Record<
      string,
      { index?: number; thumbnail?: { source: string } }
    > = data?.query?.pages ?? {};
    return (
      Object.values(pages)
        .sort((a, b) => (a.index ?? 99) - (b.index ?? 99))
        .find((p) => p.thumbnail?.source)?.thumbnail?.source ?? null
    );
  } catch {
    return null;
  }
}

// ── Pexels ───────────────────────────────────────────────────────────────────

/** Single Pexels search — no batch API available, run in parallel. */
async function fetchPexels(q: string): Promise<string | null> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return null;
  const url =
    `https://api.pexels.com/v1/search?` +
    new URLSearchParams({ query: q, per_page: "5", orientation: "square" });
  try {
    const res = await fetch(url, {
      headers: { Authorization: apiKey },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (
      (data.photos as { src: { medium: string } }[])?.[0]?.src?.medium ?? null
    );
  } catch {
    return null;
  }
}

// ── Route ────────────────────────────────────────────────────────────────────

/**
 * POST /api/images
 * Body: { items: Array<{ q: string; source?: "wikipedia" | "pexels" }> }
 * Returns: Array<{ q: string; url: string | null }>
 *
 * All lookups run in parallel server-side — same logic as GET /api/image-proxy
 * but without the N sequential client round-trips.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  let items: ImageQuery[];
  try {
    const body = await req.json();
    items = Array.isArray(body?.items) ? body.items : [];
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (items.length === 0) return NextResponse.json([]);

  const results = await Promise.all(
    items.map(async ({ q, source = "wikipedia" }) => {
      const trimmed = q?.trim();
      if (!trimmed) return { q, url: null };
      const url =
        source === "pexels"
          ? await fetchPexels(trimmed)
          : await fetchWikipedia(trimmed);
      return { q, url };
    }),
  );

  return NextResponse.json(results);
}
