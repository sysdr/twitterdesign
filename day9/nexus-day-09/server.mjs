import http from 'node:http';
import { performance } from 'node:perf_hooks';
import { InProcessEngine } from './engine.mjs';

const PORT = process.env.PORT ?? 3000;
// 0.0.0.0: required for WSL/Docker so Windows/browser "localhost" port forward can reach Node
const HOST = process.env.HOST ?? '0.0.0.0';

/** Served as /dashboard.js (avoid inline script + HTML parser edge cases). */
const DASHBOARD_JS = `
function apiUrl(path) {
  var u = new URL(path, window.location.origin);
  u.searchParams.set('_', String(Date.now()));
  return u.toString();
}
async function fetchJson(url) {
  var r = await fetch(url, { cache: 'no-store', headers: { 'Accept': 'application/json' } });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}
function applyStats(s) {
  if (!s || typeof s !== 'object') return;
  var hint = document.getElementById('live-hint');
  var st = document.getElementById('live-status');
  if (hint) hint.style.color = '#64748b';
  if (st) { st.textContent = 'Live'; st.style.color = '#34d399'; }
  document.getElementById('stat-cmd').textContent = s.commands;
  document.getElementById('stat-tot').textContent = s.totalEvents;
  var errEl = document.getElementById('stat-err');
  errEl.textContent = s.errors;
  errEl.className = 'val' + (s.errors > 0 ? ' warn' : '');
  var ec = s.eventCounts || {};
  var keys = Object.keys(ec).sort();
  document.getElementById('evt-body').innerHTML = keys.map(function(t) {
    return '<tr><td>' + t + '</td><td class="num">' + ec[t] + '</td></tr>';
  }).join('');
}
function showFetchErr(e) {
  var hint = document.getElementById('live-hint');
  var st = document.getElementById('live-status');
  if (st) { st.textContent = 'Offline'; st.style.color = '#f87171'; }
  if (hint) {
    hint.style.color = '#f87171';
    hint.title = 'Update failed: ' + (e && e.message ? e.message : String(e)) + ' - same-origin URL: ' + window.location.origin + '/';
  }
}
async function refreshStats() {
  try {
    applyStats(await fetchJson(apiUrl('/api/stats')));
  } catch (e) { console.warn('stats poll failed', e); showFetchErr(e); }
}
async function runDemo() {
  var b = document.getElementById('btn-demo');
  b.disabled = true;
  try {
    var d = await fetchJson(apiUrl('/api/demo'));
    if (d.stats) applyStats(d.stats);
  } catch (e) { showFetchErr(e); }
  finally { b.disabled = false; }
}
async function runBench() {
  var el = document.getElementById('bench');
  var btn = document.getElementById('btn-bench');
  btn.disabled = true;
  el.textContent = 'Benchmarking...';
  try {
    var d = await fetchJson(apiUrl('/api/benchmark'));
    el.textContent = d.results.map(function (row) {
      return row.name.padEnd(12) + ' P50: ' + row.p50 + 'ms  P99: ' + row.p99 + 'ms  ' + (row.pass ? '\\u2713' : '\\u2717');
    }).join('\\n');
  } catch (e) { el.textContent = 'Benchmark failed: ' + (e && e.message ? e.message : e); }
  finally { btn.disabled = false; }
}
window.dashRefresh = refreshStats;
window.dashDemo = runDemo;
window.dashBench = runBench;

function initDash() {
  document.getElementById('btn-refresh').addEventListener('click', function () { refreshStats(); });
  document.getElementById('btn-demo').addEventListener('click', function () { runDemo(); });
  document.getElementById('btn-bench').addEventListener('click', runBench);

  var pollMs = 500;
  setInterval(refreshStats, pollMs);
  refreshStats();

  if (typeof EventSource !== 'undefined') {
    try {
      var es = new EventSource(new URL('/api/stats/stream', window.location.origin).href);
      es.onmessage = function (ev) {
        try { applyStats(JSON.parse(ev.data)); } catch (err) {}
      };
    } catch (err) { console.warn('EventSource unavailable', err); }
  }

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) refreshStats();
  });
}
if (document.readyState === 'loading')
  document.addEventListener('DOMContentLoaded', initDash);
else
  initDash();
`.trim();

// Demo engine seeded on startup
const engine = new InProcessEngine();
const demoUsers = [];
for (let i = 0; i < 30; i++)
  demoUsers.push(engine.create('user', { handle: `demo_${i}` }).id);

for (let i = 0; i < 60; i++) {
  try {
    switch (i % 4) {
      case 0: engine.executeCommand('PostTweet',
        { userId: demoUsers[i % 30], content: `Demo tweet ${i}` }); break;
      case 1: engine.executeCommand('LikeTweet',
        { userId: demoUsers[i % 30], tweetId: `tweet:${i.toString(36).padStart(8,'0')}` }); break;
      case 2: engine.executeCommand('FollowUser',
        { followerId: demoUsers[i % 30], followeeId: demoUsers[(i + 1) % 30] }); break;
      case 3: engine.executeCommand('DeleteTweet',
        { userId: demoUsers[i % 30], tweetId: `tweet:${i.toString(36).padStart(8,'0')}` }); break;
    }
  } catch (_) {}
}

function renderHTML(stats) {
  const rows = Object.entries(stats.eventCounts ?? {})
    .map(([t, c]) => `<tr><td>${t}</td><td class="num">${c}</td></tr>`).join('');
  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8"><title>NEXUS Day 09 - CQRS Write Path</title>
<link rel="icon" href="/favicon.ico">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  :root{--bg:#fff7ed;--panel:#fff1e6;--panel2:#ffe7d1;--line:#f5c9a7;--text:#7c2d12;--muted:#9a5d34;--accent:#fb923c;--accent2:#fdba74;--good:#c2410c;--warn:#dc2626;--num:#b45309}
  body{font-family:ui-monospace,monospace;background:radial-gradient(1200px 600px at 15% -10%,#fed7aa 0%,transparent 60%),radial-gradient(900px 500px at 100% 0,#ffedd5 0%,transparent 55%),var(--bg);color:var(--text);padding:26px 24px 36px;min-height:100vh}
  .shell{max-width:1100px;margin:0 auto}
  .hero{display:flex;justify-content:space-between;align-items:end;gap:16px;margin-bottom:20px}
  h1{color:#9a3412;font-size:24px;line-height:1.2}
  .badge{display:inline-block;background:linear-gradient(90deg,var(--accent),var(--accent2));color:#7c2d12;font-size:11px;font-weight:800;padding:3px 10px;border-radius:999px;margin-left:10px;vertical-align:middle}
  .sub{color:var(--muted);font-size:13px}
  .grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-bottom:18px}
  .card{background:linear-gradient(160deg,var(--panel),var(--panel2));border:1px solid var(--line);border-radius:14px;padding:16px;box-shadow:0 8px 24px rgba(0,0,0,.22)}
  .card h3{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px}
  .card .val{font-size:34px;font-weight:800;color:var(--good)}
  .card .val.warn{color:var(--warn)}
  .section{background:linear-gradient(180deg,rgba(255,245,235,.92),rgba(255,237,213,.92));border:1px solid var(--line);border-radius:14px;padding:14px;box-shadow:0 8px 20px rgba(180,83,9,.10)}
  .section h2{color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px}
  table{width:100%;border-collapse:separate;border-spacing:0;background:transparent;margin-bottom:12px}
  th,td{padding:10px 12px;text-align:left;font-size:13px}
  thead tr{background:#ffedd5}
  thead th:first-child{border-top-left-radius:9px}
  thead th:last-child{border-top-right-radius:9px}
  tbody tr:nth-child(odd){background:rgba(255,244,233,.9)}
  tbody tr:nth-child(even){background:rgba(255,237,213,.85)}
  .num{color:var(--num);text-align:right;font-weight:700}
  .hint{color:var(--muted);font-size:12px;margin-bottom:12px}
  .actions{display:flex;flex-wrap:wrap;gap:8px}
  .btn{background:linear-gradient(180deg,#fb923c,#f97316);color:#fff7ed;border:1px solid #ea580c;padding:9px 14px;border-radius:9px;cursor:pointer;font-family:inherit;font-size:13px;font-weight:700;transition:transform .08s ease,filter .18s ease}
  .btn:hover{filter:brightness(1.08)}
  .btn:active{transform:translateY(1px)}
  .btn:disabled{opacity:.55;cursor:not-allowed}
  #bench{margin-top:14px;color:var(--good);white-space:pre;font-size:13px;line-height:1.6;background:#fff7ed;border:1px solid #f5c9a7;border-radius:9px;padding:10px;min-height:44px}
  @media (max-width:860px){.grid{grid-template-columns:1fr}.hero{flex-direction:column;align-items:flex-start}}
</style></head>
<body>
<div class="shell">
  <div class="hero">
    <h1>NEXUS 2.0 - Day 09 <span class="badge">P99 &lt; 10ms</span></h1>
    <p class="sub" id="sub-mode">Commands vs Events - CQRS Write Path - Mode: ${stats.mode}</p>
  </div>
  <div class="grid">
    <div class="card"><h3>Commands</h3><div class="val" id="stat-cmd">${stats.commands}</div></div>
    <div class="card"><h3>Total Events</h3><div class="val" id="stat-tot">${stats.totalEvents}</div></div>
    <div class="card"><h3>Errors</h3><div class="val${stats.errors > 0 ? ' warn' : ''}" id="stat-err">${stats.errors}</div></div>
  </div>
  <div class="section">
    <h2>Event Topics</h2>
    <table>
      <thead><tr><th>Topic</th><th style="text-align:right">Events</th></tr></thead>
      <tbody id="evt-body">${rows}</tbody>
    </table>
    <p class="hint" id="live-hint"><span id="live-status">Live</span> - metrics stream about 4/sec - <strong>Refresh</strong> / <strong>Run live demo</strong> also update totals (demo adds PostTweet: Commands, Total, tweet.created).</p>
    <div class="actions">
      <button type="button" class="btn" id="btn-refresh">&#8635; Refresh metrics</button>
      <button type="button" class="btn" id="btn-demo">&#9654; Run live demo</button>
      <button type="button" class="btn" id="btn-bench">&#9654; Run Benchmark (500 iter)</button>
    </div>
    <div id="bench"></div>
  </div>
</div>
<script src="/dashboard.js" defer></script>
</body></html>`;
}

const JSON_HDR = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, max-age=0',
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === '/favicon.ico') {
    res.writeHead(204, { 'Cache-Control': 'public, max-age=86400' });
    res.end();
    return;
  }

  if (url.pathname === '/dashboard.js') {
    res.writeHead(200, {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
    });
    res.end(DASHBOARD_JS);
    return;
  }

  if (url.pathname === '/') {
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
    });
    res.end(renderHTML(engine.stats()));
    return;
  }

  if (url.pathname === '/api/stats') {
    res.writeHead(200, JSON_HDR);
    res.end(JSON.stringify(engine.stats()));
    return;
  }

  if (url.pathname === '/api/stats/stream') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      Connection: 'keep-alive',
    });
    const send = () => {
      try {
        res.write(`data: ${JSON.stringify(engine.stats())}\n\n`);
      } catch {
        clearInterval(tick);
      }
    };
    send();
    const tick = setInterval(send, 250);
    req.on('close', () => clearInterval(tick));
    return;
  }

  if (url.pathname === '/api/demo') {
    const uid = demoUsers[Math.floor(Math.random() * demoUsers.length)];
    const result = engine.executeCommand('PostTweet', {
      userId:  uid,
      content: `Live command at ${new Date().toISOString()}`,
    });
    res.writeHead(200, JSON_HDR);
    res.end(JSON.stringify({ ...result, stats: engine.stats() }));
    return;
  }

  if (url.pathname === '/api/benchmark') {
    const bEng  = new InProcessEngine();
    const bUsers = [];
    for (let i = 0; i < 50; i++)
      bUsers.push(bEng.create('user', { h: `b${i}` }).id);

    function bench(name, fn, n = 500) {
      const lats = [];
      for (let i = 0; i < n; i++) { const t = performance.now(); fn(i); lats.push(performance.now() - t); }
      lats.sort((a, b) => a - b);
      const p99 = lats[Math.floor(n * 0.99)];
      return { name, p50: lats[Math.floor(n * 0.50)].toFixed(3), p99: p99.toFixed(3), pass: p99 < 10 };
    }

    const results = [
      bench('PostTweet',   i => bEng.executeCommand('PostTweet',   { userId: bUsers[i%50], content: `b${i}` })),
      bench('LikeTweet',   i => bEng.executeCommand('LikeTweet',   { userId: bUsers[i%50], tweetId: `tweet:${i.toString(36).padStart(8,'0')}` })),
      bench('FollowUser',  i => bEng.executeCommand('FollowUser',  { followerId: bUsers[i%50], followeeId: bUsers[(i+1)%50] })),
      bench('DeleteTweet', i => bEng.executeCommand('DeleteTweet', { userId: bUsers[i%50], tweetId: `tweet:${i.toString(36).padStart(8,'0')}` })),
    ];
    res.writeHead(200, JSON_HDR);
    res.end(JSON.stringify({ results }));
    return;
  }

  res.writeHead(404); res.end('Not found');
});

server.listen(Number(PORT), HOST, () => {
  console.log(`[server] http://127.0.0.1:${PORT}/  (bind ${HOST}:${PORT})`);
  console.log(`[server] NEXUS Day 09 — CQRS Write Path dashboard running`);
});
