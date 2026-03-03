/**
 * Unsplash image helper.
 * Falls back gracefully if the API key is not configured.
 */

const ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY ?? "";
const BASE_URL = "https://api.unsplash.com";

export interface UnsplashPhoto {
  id: string;
  urls: {
    small: string;
    regular: string;
    thumb: string;
  };
  alt_description: string | null;
  user: {
    name: string;
    links: { html: string };
  };
}

/**
 * Search Unsplash for a single representative photo.
 * Returns null if no API key is set or the request fails.
 */
export async function searchUnsplash(
  query: string,
): Promise<UnsplashPhoto | null> {
  if (!ACCESS_KEY) return null;

  try {
    const url = new URL(`${BASE_URL}/search/photos`);
    url.searchParams.set("query", query);
    url.searchParams.set("per_page", "1");
    url.searchParams.set("orientation", "squarish");

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Client-ID ${ACCESS_KEY}` },
      next: { revalidate: 86400 }, // cache for 24h (Next.js fetch cache)
    });

    if (!res.ok) return null;

    const data = await res.json();
    const results: UnsplashPhoto[] = data.results ?? [];
    return results[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * Resolve the best image URL for a lesson item:
 * 1. Use the GCP Storage imageUrl if available
 * 2. Fall back to Unsplash search
 * 3. Return null (show placeholder)
 */
export async function resolveImageUrl(
  gcpUrl: string | undefined,
  unsplashQuery: string | undefined,
): Promise<string | null> {
  if (gcpUrl) return gcpUrl;
  if (!unsplashQuery) return null;

  const photo = await searchUnsplash(unsplashQuery);
  return photo?.urls.small ?? null;
}
