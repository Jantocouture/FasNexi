const API_BASE = process.env.API_BASE || 'http://localhost:4000';

export async function fetchFeed(profileId: string, page = 1, perPage = 20) {
  const q = `profileId=${encodeURIComponent(profileId)}&page=${page}&perPage=${perPage}`;
  const res = await fetch(`${API_BASE}/api/feed?${q}`);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`fetchFeed failed: ${res.status} ${txt}`);
  }
  return res.json();
}
