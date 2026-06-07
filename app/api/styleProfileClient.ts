// API client helper for StyleProfile endpoint
const API_BASE = process.env.API_BASE || 'https://api.example.com';

export type StyleProfilePayload = {
  userId?: string | null;
  archetypes: string[];
  bodyShape?: string;
  measurements?: Record<string, number>;
  fitPreference?: string;
  occasionPriorities?: string[];
  colorPrefs?: string[];
  favoriteDesigners?: string[];
  budgetBand?: string;
  sustainabilityPriority?: boolean;
  wardrobeItems?: Array<{ imageUrl: string; category?: string; tags?: string[] }>;
};

export async function submitStyleProfile(payload: StyleProfilePayload) {
  const res = await fetch(`${API_BASE}/api/style-profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`submitStyleProfile failed: ${res.status} ${txt}`);
  }
  return res.json();
}
