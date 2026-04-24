require("dotenv").config();
const express = require("express");
const AfyaAuthService = require("./src/authService");

const app = express();
app.use(express.json());

const auth = new AfyaAuthService({
  platformName: process.env.PLATFORM_NAME,
  platformKey: process.env.PLATFORM_KEY,
  platformSecret: process.env.PLATFORM_SECRET,
  baseUrl: process.env.API_BASE_URL,
  callbackUrl: process.env.CALLBACK_URL,
});

app.get("/callback", (req, res) => {
  auth._log("info", "Callback received", req.query);
  res.json({ success: true, data: req.query });
});

app.post("/api/initiate", async (req, res) => res.json(await auth.initiateHandshake()));
app.post("/api/complete", async (req, res) => res.json(await auth.completeHandshake()));
app.post("/api/full-flow", async (req, res) => res.json(await auth.runFullFlow()));
app.get("/api/state", (req, res) => res.json(auth.getState()));
app.get("/api/logs", (req, res) => res.json(auth.logs));

app.get("/", (req, res) => res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Afyanalytics Auth</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: monospace; background: #0d1117; color: #c9d1d9; padding: 32px; }
  h1 { font-size: 18px; margin-bottom: 24px; color: #58a6ff; }
  .btn-row { display: flex; gap: 12px; margin-bottom: 24px; }
  button {
    padding: 10px 20px; border: none; border-radius: 6px;
    font-family: monospace; font-size: 13px; cursor: pointer; font-weight: bold;
  }
  #btnInit { background: #238636; color: #fff; }
  #btnComplete { background: #1f6feb; color: #fff; }
  #btnFull { background: #6e40c9; color: #fff; }
  button:disabled { opacity: 0.4; cursor: not-allowed; }
  .panel { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
  .panel h2 { font-size: 12px; text-transform: uppercase; color: #8b949e; margin-bottom: 12px; letter-spacing: 1px; }
  pre { font-size: 12px; line-height: 1.6; white-space: pre-wrap; word-break: break-all; color: #7ee787; }
  .state-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #21262d; font-size: 12px; }
  .state-row:last-child { border: none; }
  .label { color: #8b949e; }
  .val { color: #c9d1d9; }
  .val.ok { color: #7ee787; }
  .val.err { color: #f85149; }
  .val.warn { color: #e3b341; }
</style>
</head>
<body>
<h1>Afyanalytics Auth Tester</h1>

<div class="btn-row">
  <button id="btnInit" onclick="call('/api/initiate','Init')">▶ Initiate Handshake</button>
  <button id="btnComplete" onclick="call('/api/complete','Complete')">✓ Complete Handshake</button>
  <button id="btnFull" onclick="call('/api/full-flow','Full Flow')">⚡ Full Flow</button>
</div>

<div class="panel">
  <h2>Token State</h2>
  <div id="state"><div class="state-row"><span class="label">Loading...</span></div></div>
</div>

<div class="panel">
  <h2>Last Response — <span id="respLabel">none</span></h2>
  <pre id="resp">// Click a button above</pre>
</div>

<script>
  async function call(url, label) {
    document.querySelectorAll('button').forEach(b => b.disabled = true);
    document.getElementById('respLabel').textContent = label + ' ...';
    try {
      const r = await fetch(url, { method: 'POST' });
      const data = await r.json();
      document.getElementById('resp').textContent = JSON.stringify(data, null, 2);
      document.getElementById('respLabel').textContent = label + ' — ' + (data.success ? '✅ success' : '❌ failed');
    } catch(e) {
      document.getElementById('resp').textContent = e.message;
    }
    document.querySelectorAll('button').forEach(b => b.disabled = false);
    refreshState();
  }

  async function refreshState() {
    const r = await fetch('/api/state');
    const s = await r.json();
    document.getElementById('state').innerHTML = \`
      <div class="state-row"><span class="label">Handshake Token</span><span class="val \${s.hasHandshakeToken ? 'ok' : 'err'}">\${s.hasHandshakeToken ? '✓ Present' : '✗ None'}</span></div>
      <div class="state-row"><span class="label">Handshake Expires</span><span class="val warn">\${s.handshakeExpiresAt || '—'}</span></div>
      <div class="state-row"><span class="label">Access Token</span><span class="val \${s.hasAccessToken ? 'ok' : 'err'}">\${s.hasAccessToken ? '✓ ' + s.accessTokenPreview : '✗ None'}</span></div>
      <div class="state-row"><span class="label">Access Expires</span><span class="val warn">\${s.accessExpiresAt || '—'}</span></div>
    \`;
  }

  refreshState();
  setInterval(refreshState, 10000);
</script>
</body>
</html>`));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on http://localhost:${PORT}`));