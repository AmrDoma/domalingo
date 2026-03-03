import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/image-proxy?q=wooden+table
 * Proxies a single Unsplash photo URL server-side so the API key is hidden.
 */
export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query) return NextResponse.json({ url: null });

  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return NextResponse.json({ url: null });

  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=squarish`;
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${accessKey}` },
      next: { revalidate: 86400 },
    });

    if (!res.ok) return NextResponse.json({ url: null });

    const data = await res.json();
    const photo = data.results?.[0];
    return NextResponse.json({ url: photo?.urls?.small ?? null });
  } catch {
    return NextResponse.json({ url: null });
  }
}
