const http = require("http");
const crypto = require("crypto");

const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = process.env;
const REDIRECT_URI = "http://127.0.0.1:8888/callback";
const SCOPE = "user-read-currently-playing user-read-playback-state";

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
  console.error("Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env first.");
  process.exit(1);
}

const state = crypto.randomBytes(8).toString("hex");
const authUrl =
  "https://accounts.spotify.com/authorize?" +
  new URLSearchParams({
    response_type: "code",
    client_id: SPOTIFY_CLIENT_ID,
    scope: SCOPE,
    redirect_uri: REDIRECT_URI,
    state,
  });

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://127.0.0.1:8888");
  if (url.pathname !== "/callback") {
    res.writeHead(404);
    return res.end();
  }
  if (url.searchParams.get("state") !== state) {
    res.writeHead(400);
    return res.end("State mismatch.");
  }
  try {
    const basic = Buffer.from(
      `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`,
    ).toString("base64");
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: url.searchParams.get("code"),
        redirect_uri: REDIRECT_URI,
      }),
    });
    const json = await tokenRes.json();
    if (!json.refresh_token) {
      res.writeHead(500);
      return res.end("No refresh token returned: " + JSON.stringify(json));
    }
    console.log("\n✅  SPOTIFY_REFRESH_TOKEN:\n\n" + json.refresh_token + "\n");
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<h2>Done</h2><p>Refresh token printed in your terminal. You can close this tab.</p>");
    setTimeout(() => process.exit(0), 300);
  } catch (err) {
    res.writeHead(500);
    res.end("Error: " + err.message);
  }
});

server.listen(8888, () =>
  console.log("\nOpen this URL in your browser to authorize:\n\n" + authUrl + "\n"),
);
