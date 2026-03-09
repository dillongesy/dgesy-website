/**
 * GET /api/spotify
 *
 * Returns the currently-playing Spotify track (sanitised — no tokens).
 * All credentials live exclusively in server-side environment variables
 * and are NEVER sent to the browser.
 *
 * ─── One-time setup ──────────────────────────────────────────────────────────
 *
 * 1. Go to https://developer.spotify.com/dashboard and create an app.
 *    Website:       https://dgesy.org
 *    Redirect URI:  https://dgesy.org   ← must match exactly (no trailing slash)
 *
 * 2. Copy CLIENT_ID and CLIENT_SECRET into .env.local (and into Vercel env vars).
 *
 * 3. Visit this URL in a browser while logged into Spotify (replace CLIENT_ID):
 *
 *    https://accounts.spotify.com/authorize?client_id=CLIENT_ID&response_type=code&redirect_uri=https%3A%2F%2Fdgesy.org&scope=user-read-currently-playing%20user-read-playback-state
 *
 * 4. Approve → Spotify redirects to https://dgesy.org?code=XXXX
 *    Copy the `code` value from the address bar.
 *
 * 5. Exchange it for tokens (replace CLIENT_ID, CLIENT_SECRET, CODE):
 *
 *    curl -X POST https://accounts.spotify.com/api/token \
 *      -H "Content-Type: application/x-www-form-urlencoded" \
 *      -H "Authorization: Basic $(echo -n CLIENT_ID:CLIENT_SECRET | base64)" \
 *      -d "grant_type=authorization_code&code=CODE&redirect_uri=https%3A%2F%2Fdgesy.org"
 *
 * 6. Copy `refresh_token` into .env.local as SPOTIFY_REFRESH_TOKEN.
 *    Add all three vars to Vercel → Settings → Environment Variables.
 *    The refresh token doesn't expire — one-time setup.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextResponse } from "next/server";

const TOKEN_URL = "https://accounts.spotify.com/api/token";
const NOW_PLAYING_URL = "https://api.spotify.com/v1/me/player/currently-playing";

// Revalidate every 30 s so Next.js caches the route response briefly
export const revalidate = 30;

async function getAccessToken(): Promise<string | null> {
  const clientId     = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

  // All three are required — bail silently if any are missing
  if (!clientId || !clientSecret || !refreshToken) return null;

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type:    "refresh_token",
      refresh_token: refreshToken,
    }),
    // Never cache token requests
    cache: "no-store",
  });

  if (!res.ok) return null;
  const data = await res.json();
  return (data.access_token as string) ?? null;
}

export async function GET() {
  const accessToken = await getAccessToken();

  // Spotify not configured — return a safe empty state
  if (!accessToken) {
    return NextResponse.json({ isPlaying: false, notConfigured: true });
  }

  const res = await fetch(NOW_PLAYING_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  // 204 = nothing playing; >400 = error
  if (res.status === 204 || res.status >= 400) {
    return NextResponse.json({ isPlaying: false });
  }

  const raw = await res.json();

  // Only return what the UI needs — zero credentials leak
  return NextResponse.json({
    isPlaying:   raw.is_playing      ?? false,
    title:       raw.item?.name      ?? null,
    artist:      raw.item?.artists?.map((a: { name: string }) => a.name).join(", ") ?? null,
    album:       raw.item?.album?.name ?? null,
    albumArt:    raw.item?.album?.images?.[0]?.url ?? null,
    songUrl:     raw.item?.external_urls?.spotify ?? null,
    progressMs:  raw.progress_ms     ?? 0,
    durationMs:  raw.item?.duration_ms ?? 0,
  });
}
