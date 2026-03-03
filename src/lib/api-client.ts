import { auth } from "@/lib/firebase";

/** Get the current user's Firebase ID token, or null if not signed in. */
async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

/** Build Authorization headers for authenticated API calls. */
async function authHeaders(): Promise<HeadersInit> {
  const token = await getIdToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Base URL for API calls (empty string = same origin) */
const BASE = "";

// ─────────────────────────────────────────────────────────────────

export const api = {
  /** GET /api/languages */
  async getLanguages() {
    const res = await fetch(`${BASE}/api/languages`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  /** GET /api/lessons?language=de */
  async getLessons(language: string) {
    const res = await fetch(`${BASE}/api/lessons?language=${language}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  /** GET /api/lessons/:id */
  async getLesson(id: string) {
    const res = await fetch(`${BASE}/api/lessons/${id}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  /** GET /api/session?language=de&limit=20[&lessonId=...] */
  async getSession(language: string, lessonId?: string, limit = 20) {
    const headers = await authHeaders();
    const params = new URLSearchParams({ language, limit: String(limit) });
    if (lessonId) params.set("lessonId", lessonId);
    const res = await fetch(`${BASE}/api/session?${params}`, { headers });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  /** POST /api/session */
  async saveSession(language: string, results: unknown[]) {
    const headers = await authHeaders();
    const res = await fetch(`${BASE}/api/session`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ language, results }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  /** GET /api/profile */
  async getProfile() {
    const headers = await authHeaders();
    const res = await fetch(`${BASE}/api/profile`, { headers });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  /** PUT /api/profile */
  async updateProfile(data: Record<string, unknown>) {
    const headers = await authHeaders();
    const res = await fetch(`${BASE}/api/profile`, {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  /** GET /api/cards?language=de&dueOnly=true */
  async getCards(language?: string, dueOnly = false) {
    const headers = await authHeaders();
    const params = new URLSearchParams();
    if (language) params.set("language", language);
    if (dueOnly) params.set("dueOnly", "true");
    const res = await fetch(`${BASE}/api/cards?${params}`, { headers });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};
