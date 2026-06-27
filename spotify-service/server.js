const http = require("http");

const {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REFRESH_TOKEN,
  PORT = 4000,
  ALLOWED_ORIGIN,
} = process.env;

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
  console.error(
    "Missing env: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN",
  );
  process.exit(1);
}

const basic = Buffer.from(
  `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`,
).toString("base64");

let accessToken = null;
let accessTokenExpiry = 0;

async function getAccessToken() {
  if (accessToken && Date.now() < accessTokenExpiry - 30_000) return accessToken;
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: SPOTIFY_REFRESH_TOKEN,
    }),
  });
  if (!res.ok) throw new Error(`token refresh failed: ${res.status}`);
  const json = await res.json();
  accessToken = json.access_token;
  accessTokenExpiry = Date.now() + json.expires_in * 1000;
  return accessToken;
}

// Small response cache so we don't hammer the Spotify API.
let cache = { at: 0, body: null };
const CACHE_MS = 8_000;

async function fetchNowPlaying() {
  const token = await getAccessToken();
  const res = await fetch(
    "https://api.spotify.com/v1/me/player/currently-playing",
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (res.status === 204 || res.status >= 400) return { isPlaying: false };
  const song = await res.json();
  if (!song || !song.item) return { isPlaying: false };
  const item = song.item;
  return {
    isPlaying: Boolean(song.is_playing),
    title: item.name,
    artist: (item.artists || []).map((a) => a.name).join(", "),
    album: item.album?.name,
    albumImageUrl: item.album?.images?.[0]?.url,
    songUrl: item.external_urls?.spotify,
    progressMs: song.progress_ms,
    durationMs: item.duration_ms,
  };
}

const server = http.createServer(async (req, res) => {
  if (ALLOWED_ORIGIN) res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);

  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ ok: true }));
  }
  if (req.url !== "/now-playing") {
    res.writeHead(404);
    return res.end();
  }
  try {
    if (Date.now() - cache.at >= CACHE_MS || !cache.body) {
      cache = { at: Date.now(), body: await fetchNowPlaying() };
    }
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    });
    res.end(JSON.stringify(cache.body));
  } catch (err) {
    console.error(err);
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ isPlaying: false, error: "upstream_error" }));
  }
});

server.listen(PORT, () => console.log(`spotify-service listening on :${PORT}`));
