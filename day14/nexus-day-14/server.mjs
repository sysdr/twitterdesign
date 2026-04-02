import http from 'node:http';
import { performance } from 'node:perf_hooks';
import { createEngine, DIMS } from './engine.mjs';

const PORT = parseInt(process.env.PORT ?? '3140', 10);

const SEED_TOPICS = [
  'kafka distributed streaming events topic partition consumer offset',
  'redis in-memory cache pub sub fast low latency key value expiry',
  'surrealdb graph polyglot database multi model relations edges',
  'redpanda kafka compatible streaming rust jvm free performance',
  'distributed consensus raft paxos leader election quorum fault',
  'postgres relational sql acid transactions schema indexes joins',
  'vector embeddings semantic search cosine similarity nearest neighbor',
  'docker kubernetes container orchestration deployment scaling',
  'event sourcing cqrs command query write read separation projection',
  'nodejs async event loop non blocking io concurrency streams',
];

const TOPICS_200 = [
  'kafka message queue distributed streaming events topic partition consumer',
  'redis pub sub in memory cache fast low latency key value store',
  'surrealdb graph database polyglot multi model relations edges nodes',
  'redpanda kafka compatible streaming without jvm rust performance',
  'distributed systems consensus raft paxos leader election quorum',
  'postgres sql acid transactions relational schema indexes joins',
  'vector embeddings semantic search similarity cosine nearest neighbor',
  'docker container orchestration kubernetes deployment scaling replicas',
  'event sourcing cqrs write side read side command query separation',
  'nodejs async event loop non blocking io concurrency streams buffers',
];

let useOllama = !!process.env.NEXUS_MODE;
let engine;

async function instantiateEngine() {
  if (useOllama) process.env.NEXUS_MODE = 'ollama';
  else delete process.env.NEXUS_MODE;
  try {
    engine = await createEngine();
  } catch (err) {
    console.error('[server] Ollama unavailable, using in-process:', err.message);
    useOllama = false;
    delete process.env.NEXUS_MODE;
    engine = await createEngine();
  }
}

async function seedDefaultTweets() {
  for (const text of SEED_TOPICS) {
    const rec = engine.create('tweet', { text, author: 'nexus_seed' });
    const vec = await Promise.resolve(engine.embed(text));
    engine.storeEmbedding(rec.id, vec);
  }
}

await instantiateEngine();
await seedDefaultTweets();
console.log(`[server] seeded ${SEED_TOPICS.length} tweets  http://localhost:${PORT}`);

function statsPayload() {
  const s = engine.stats();
  return {
    ollama: useOllama,
    node: s.mode === 'ollama' ? 'ollama' : 'in-process',
    dims: s.dims,
    embedCount: s.embedCount,
    avgEmbedMs: s.avgEmbedMs,
    vectorsStored: s.vectorsStored,
  };
}

function json(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => resolve(raw));
    req.on('error', reject);
  });
}

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>NEXUS Day 14 - EmbeddingEngine</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Outfit:wght@500;600;700&display=swap" rel="stylesheet">
<style>
  :root{
    --bg:#ede9fe;
    --surface:rgba(245,243,255,.92);
    --surface2:#faf5ff;
    --line:rgba(109,40,217,.2);
    --line2:rgba(124,58,237,.18);
    --text:#4c1d95;
    --muted:#6d28d9;
    --accent:#7c3aed;
    --mint:#6d28d9;
    --shadow:0 20px 50px rgba(91,33,182,.15);
    --radius:14px;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  body{
    font-family:'IBM Plex Mono','Courier New',monospace;
    background:var(--bg);
    color:var(--text);
    min-height:100vh;
    position:relative;
    line-height:1.45;
  }
  .ambient{
    position:fixed;inset:0;z-index:0;pointer-events:none;
    background:
      radial-gradient(ellipse 90% 55% at 50% -15%,rgba(167,139,250,.35),transparent 55%),
      radial-gradient(ellipse 50% 45% at 100% 30%,rgba(196,181,253,.4),transparent 50%),
      radial-gradient(ellipse 45% 50% at 0% 85%,rgba(221,214,254,.55),transparent 45%),
      linear-gradient(180deg,#f5f3ff 0%,var(--bg) 42%,#e9d5ff 100%);
  }
  .ambient::after{
    content:'';position:absolute;inset:0;opacity:.06;
    background-image:linear-gradient(rgba(91,33,182,.12) 1px,transparent 1px),
      linear-gradient(90deg,rgba(91,33,182,.12) 1px,transparent 1px);
    background-size:48px 48px;
  }
  .shell{
    position:relative;z-index:1;
    max-width:1180px;margin:0 auto;
    padding:32px 22px 40px;
  }
  .top{
    display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:22px;
    margin-bottom:28px;
    padding:24px 26px;border-radius:18px;
    background:linear-gradient(145deg,rgba(250,245,255,.95) 0%,rgba(237,233,254,.88) 100%);
    border:1px solid var(--line2);
    box-shadow:var(--shadow),inset 0 1px 0 rgba(255,255,255,.85);
    backdrop-filter:blur(14px);
  }
  .brand h1{
    font-family:'Outfit',sans-serif;
    font-size:clamp(1.35rem,2.5vw,1.65rem);
    font-weight:700;
    letter-spacing:-.02em;
    background:linear-gradient(120deg,#6d28d9 0%,#7c3aed 45%,#a78bfa 100%);
    -webkit-background-clip:text;background-clip:text;color:transparent;
    margin-bottom:8px;
  }
  .sub{color:var(--muted);font-size:.8rem;max-width:36rem}
  .toolbar{
    display:flex;flex-wrap:wrap;align-items:center;gap:10px;
    max-width:680px;justify-content:flex-end;
    padding:14px 16px;border-radius:14px;
    background:rgba(245,243,255,.75);
    border:1px solid var(--line2);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.9);
  }
  .engine-pill{font-size:.72rem;color:var(--accent);margin-right:6px;white-space:nowrap}
  .engine-pill strong{color:#5b21b6;font-weight:600}
  .btn{
    border:none;border-radius:10px;padding:9px 14px;
    font-family:inherit;font-size:.72rem;font-weight:600;cursor:pointer;color:#fff;
    display:inline-flex;align-items:center;gap:6px;
    box-shadow:0 2px 10px rgba(91,33,182,.22);
    transition:transform .12s ease,filter .12s ease,box-shadow .12s ease;
  }
  .btn:hover{filter:brightness(1.07);box-shadow:0 4px 14px rgba(91,33,182,.28)}
  .btn:active{transform:translateY(1px)}
  .btn-green{background:linear-gradient(165deg,#16a34a,#15803d)}
  .btn-orange{background:linear-gradient(165deg,#ea580c,#c2410c)}
  .btn-purple{background:linear-gradient(165deg,#9333ea,#7c3aed)}
  .btn-blue2{background:linear-gradient(165deg,#2563eb,#1d4ed8)}
  .btn-red{background:linear-gradient(165deg,#dc2626,#b91c1c)}
  .btn-cyan{background:linear-gradient(165deg,#0ea5e9,#0369a1)}
  .btn-olive{background:linear-gradient(165deg,#a16207,#854d0e)}
  .btn-navy{background:linear-gradient(165deg,#2d4a6f,#1e3a5f)}
  .btn-slate{background:linear-gradient(165deg,#475569,#334155)}
  .grid{
    display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:18px;
  }
  @media(max-width:920px){.grid{grid-template-columns:1fr}}
  .card{
    border-radius:var(--radius);
    padding:20px 22px;
    background:linear-gradient(165deg,rgba(255,255,255,.9) 0%,rgba(245,243,255,.95) 100%);
    border:1px solid var(--line);
    box-shadow:0 14px 40px rgba(91,33,182,.12),inset 0 1px 0 rgba(255,255,255,.95);
    position:relative;overflow:hidden;
  }
  .card::before{
    content:'';position:absolute;top:0;left:0;right:0;height:3px;
    background:linear-gradient(90deg,#a78bfa,#8b5cf6,#c4b5fd);opacity:.9;
  }
  .card h2,.panel-title{
    font-family:'Outfit',sans-serif;
    color:#5b21b6;font-size:.72rem;font-weight:600;
    letter-spacing:.12em;text-transform:uppercase;
    margin-bottom:16px;padding-bottom:12px;
    border-bottom:1px solid rgba(124,58,237,.2);
  }
  .search-card{margin-bottom:18px}
  .demo-card{margin-bottom:6px}
  .stat{
    display:flex;justify-content:space-between;align-items:center;
    padding:10px 14px;margin-bottom:6px;font-size:.76rem;
    border-radius:10px;
    background:rgba(237,233,254,.65);
    border:1px solid rgba(167,139,250,.35);
  }
  .stat:nth-child(even){background:rgba(221,214,254,.45)}
  .v{color:var(--mint);font-weight:600}
  .search-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px}
  .search-head .panel-title{margin:0;padding:0;border:0;letter-spacing:.1em}
  .results-meta{font-size:.72rem;color:#5b21b6;font-weight:600;padding:6px 12px;border-radius:999px;background:rgba(196,181,253,.45);border:1px solid rgba(124,58,237,.3)}
  .row-adv{display:none;align-items:center;gap:12px;margin-bottom:14px;font-size:.74rem;padding:12px 14px;border-radius:12px;background:rgba(237,233,254,.55);border:1px dashed rgba(124,58,237,.35)}
  .row-adv.on{display:flex}
  .row-adv label{color:#6d28d9;font-weight:500}
  .row-adv input{width:72px;padding:8px 10px;background:var(--surface2);border:1px solid var(--line2);border-radius:8px;color:var(--text);font-family:inherit}
  .inp-row{display:flex;gap:12px;align-items:stretch;flex-wrap:wrap;margin-bottom:14px}
  .inp-row input{
    flex:1;min-width:220px;padding:12px 16px;
    background:#faf5ff;border:1px solid var(--line2);border-radius:12px;
    color:var(--text);font-family:inherit;font-size:.82rem;margin:0;
    box-shadow:inset 0 2px 8px rgba(91,33,182,.06);
  }
  .inp-row input:focus{outline:none;border-color:rgba(124,58,237,.55);box-shadow:0 0 0 3px rgba(167,139,250,.25),inset 0 2px 8px rgba(91,33,182,.06)}
  .hit{
    background:linear-gradient(90deg,rgba(196,181,253,.35) 0%,rgba(250,245,255,.9) 100%);
    border-radius:12px;padding:14px 16px;margin-top:10px;
    border-left:4px solid #7c3aed;
    border:1px solid rgba(167,139,250,.4);border-left-width:4px;
  }
  .hit .sc{color:#6d28d9;font-size:.74rem;font-weight:600}
  .hit .tx{font-size:.78rem;margin-top:6px;color:#5b21b6;line-height:1.4}
  pre{
    background:var(--surface2);padding:18px;border-radius:12px;font-size:.72rem;
    overflow-x:auto;white-space:pre-wrap;border:1px solid var(--line2);
    color:#5b21b6;box-shadow:inset 0 2px 12px rgba(91,33,182,.08);
  }
  .bottom-bar{
    display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:20px;
    padding:16px;border-radius:16px;
    background:linear-gradient(180deg,rgba(245,243,255,.9) 0%,rgba(237,233,254,.75) 100%);
    border:1px solid var(--line2);
    box-shadow:0 12px 32px rgba(91,33,182,.12);
  }
  @media(max-width:820px){.bottom-bar{grid-template-columns:1fr 1fr}}
  .bottom-bar .btn{justify-content:center;padding:12px 12px;font-size:.74rem;border-radius:11px}
  .modal{position:fixed;inset:0;background:rgba(76,29,149,.35);backdrop-filter:blur(6px);display:none;align-items:center;justify-content:center;z-index:50;padding:20px}
  .modal.on{display:flex}
  .modal-inner{
    background:linear-gradient(165deg,rgba(255,255,255,.98) 0%,rgba(245,243,255,.98) 100%);
    border:1px solid var(--line);border-radius:16px;
    max-width:min(920px,96vw);max-height:86vh;overflow:auto;padding:22px 24px;width:100%;
    box-shadow:0 28px 60px rgba(91,33,182,.2);
  }
  .modal-inner h3{color:#5b21b6;font-family:'Outfit',sans-serif;font-size:1rem;margin-bottom:14px;font-weight:600}
  .modal-inner pre{max-height:58vh}
  .modal-close{margin-top:16px}
</style>
</head>
<body>
<div class="ambient" aria-hidden="true"></div>
<main class="shell">
<header class="top">
  <div class="brand">
    <h1>NEXUS Day 14 - EmbeddingEngine</h1>
    <p class="sub">Hash-based 384-dim embeddings CPU-only cosine topK search</p>
  </div>
  <div class="toolbar">
    <span class="engine-pill">Engine: <strong id="engineLabel">…</strong></span>
    <button type="button" class="btn btn-green" id="btnSwitch" onclick="switchEngineMode()">⇄ Switch to Ollama</button>
    <button type="button" class="btn btn-orange" onclick="clearIndex()">🗑 Clear Index</button>
    <button type="button" class="btn btn-purple" onclick="exportIndex()">↑ Export Index</button>
    <button type="button" class="btn btn-blue2" onclick="importIndex()">↓ Import Index</button>
    <button type="button" class="btn btn-red" onclick="restartEngine()">⟲ Restart Engine</button>
  </div>
</header>
<div class="grid">
  <div class="card">
    <h2>Engine Stats</h2>
    <div id="stats"><div class="stat"><span>loading…</span></div></div>
  </div>
  <div class="card">
    <h2>Benchmark (50 iters x 100 tweets)</h2>
    <div id="bench"><div class="stat"><span>click Run Benchmark</span></div></div>
    <button type="button" class="btn btn-cyan" onclick="runBench()">▶ Run Benchmark</button>
  </div>
</div>
<div class="card search-card">
  <div class="search-head">
    <h2 class="panel-title">Semantic Search - topK(3)</h2>
    <span class="results-meta" id="resultsCount"></span>
  </div>
  <div class="inp-row">
    <input id="q" type="text" placeholder="kafka streaming partition…" value="kafka distributed streaming">
    <button type="button" class="btn btn-cyan" onclick="toggleAdvanced()">⚙ Advanced Search</button>
  </div>
  <div class="row-adv" id="advRow">
    <label for="k">topK</label>
    <input id="k" type="number" min="1" max="20" value="3">
  </div>
  <button type="button" class="btn btn-cyan" onclick="search()">Search</button>
  <div id="results"></div>
</div>
<div class="card demo-card">
  <h2>Live Demo</h2>
  <div id="demo"><div class="stat"><span>loading…</span></div></div>
</div>
<div class="bottom-bar">
  <button type="button" class="btn btn-green" onclick="runDemo()">⌂ Run Demo</button>
  <button type="button" class="btn btn-olive" onclick="seed200()">📄 Seed 200 Tweets</button>
  <button type="button" class="btn btn-navy" onclick="viewAllTweets()">☰ View All Tweets</button>
  <button type="button" class="btn btn-slate" onclick="viewVectors()">▦ View Vectors</button>
</div>
</main>
<div id="modal" class="modal" onclick="modalBackdrop(event)">
  <div class="modal-inner" onclick="event.stopPropagation()">
    <h3 id="modalTitle"></h3>
    <div id="modalBody"></div>
    <button type="button" class="btn btn-cyan modal-close" onclick="closeModal()">Close</button>
  </div>
</div>
<script>
function toggleAdvanced(){
  document.getElementById('advRow').classList.toggle('on');
}
function modalBackdrop(e){
  if(e.target.id==='modal') closeModal();
}
function closeModal(){
  document.getElementById('modal').classList.remove('on');
}
async function loadStats(){
  const s=await fetch('/api/stats').then(function(r){return r.json();});
  document.getElementById('stats').innerHTML=
    '<div class="stat"><span>node</span><span class="v">'+s.node+'</span></div>'+
    '<div class="stat"><span>dims</span><span class="v">'+s.dims+'</span></div>'+
    '<div class="stat"><span>embedCount</span><span class="v">'+s.embedCount+'</span></div>'+
    '<div class="stat"><span>avgEmbedMs</span><span class="v">'+s.avgEmbedMs+'</span></div>'+
    '<div class="stat"><span>vectorsStored</span><span class="v">'+s.vectorsStored+'</span></div>';
  document.getElementById('engineLabel').textContent=s.node;
  document.getElementById('btnSwitch').textContent=s.ollama?'⇄ Switch to in-process':'⇄ Switch to Ollama';
}
async function runBench(){
  document.getElementById('bench').innerHTML='<div class="stat"><span>running…</span></div>';
  const b=await fetch('/api/benchmark').then(function(r){return r.json();});
  document.getElementById('bench').innerHTML=
    '<div class="stat"><span>P50/tweet</span><span class="v">'+b.p50+'ms</span></div>'+
    '<div class="stat"><span>P99/tweet</span><span class="v">'+b.p99+'ms</span></div>'+
    '<div class="stat"><span>throughput</span><span class="v">'+b.throughput.toLocaleString()+' tweets/sec</span></div>';
  loadStats();
}
function searchK(){
  var el=document.getElementById('k');
  var k=parseInt(el&&el.value?el.value:'3',10);
  if(isNaN(k)||k<1) k=1;
  if(k>20) k=20;
  return k;
}
async function search(){
  var q=document.getElementById('q').value;
  var k=searchK();
  var d=await fetch('/api/demo?q='+encodeURIComponent(q)+'&k='+k).then(function(r){return r.json();});
  document.getElementById('resultsCount').textContent='Results: '+(d.hits?d.hits.length:0);
  document.getElementById('results').innerHTML=(d.hits||[]).map(function(h){
    return '<div class="hit"><div class="sc">score: '+h.score.toFixed(4)+'</div>'+
           '<div class="tx">'+escapeHtml(h.text)+'</div></div>';
  }).join('');
}
function escapeHtml(t){
  return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
async function loadDemo(){
  var q=document.getElementById('q').value||'kafka distributed';
  var k=searchK();
  var d=await fetch('/api/demo?q='+encodeURIComponent(q)+'&k='+k).then(function(r){return r.json();});
  document.getElementById('demo').innerHTML='<pre>'+escapeHtml(JSON.stringify(d,null,2))+'</pre>';
}
async function runDemo(){
  await loadDemo();
  await search();
  await loadStats();
}
async function seed200(){
  await fetch('/api/seed200',{method:'POST'});
  await refreshAll();
}
async function viewAllTweets(){
  var d=await fetch('/api/tweets').then(function(r){return r.json();});
  document.getElementById('modalTitle').textContent='All tweets';
  document.getElementById('modalBody').innerHTML='<pre>'+escapeHtml(JSON.stringify(d,null,2))+'</pre>';
  document.getElementById('modal').classList.add('on');
}
async function viewVectors(){
  var d=await fetch('/api/vectors').then(function(r){return r.json();});
  document.getElementById('modalTitle').textContent='Vectors';
  document.getElementById('modalBody').innerHTML='<pre>'+escapeHtml(JSON.stringify(d,null,2))+'</pre>';
  document.getElementById('modal').classList.add('on');
}
async function exportIndex(){
  var r=await fetch('/api/export');
  var blob=await r.blob();
  var a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='nexus-day14-index.json';
  a.click();
  URL.revokeObjectURL(a.href);
}
function importIndex(){
  var input=document.createElement('input');
  input.type='file';
  input.accept='application/json,.json';
  input.onchange=function(e){
    var f=e.target.files&&e.target.files[0];
    if(!f) return;
    var reader=new FileReader();
    reader.onload=function(){
      fetch('/api/import',{method:'POST',headers:{'Content-Type':'application/json'},body:reader.result})
        .then(function(res){
          if(!res.ok) return res.json().then(function(j){ throw new Error(j.error||res.status); });
          return refreshAll();
        })
        .catch(function(err){ alert('Import failed: '+err.message); });
    };
    reader.readAsText(f);
  };
  input.click();
}
async function clearIndex(){
  await fetch('/api/engine/clear',{method:'POST'});
  await refreshAll();
}
async function restartEngine(){
  await fetch('/api/engine/restart',{method:'POST'});
  await refreshAll();
}
async function switchEngineMode(){
  var s=await fetch('/api/stats').then(function(r){return r.json();});
  var target=s.ollama?'in-process':'ollama';
  var res=await fetch('/api/engine/switch',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({target:target})});
  if(!res.ok){
    var err=await res.json().catch(function(){return{};});
    alert(err.error||'Engine switch failed');
  }
  await refreshAll();
}
async function refreshAll(){
  await loadStats();
  await loadDemo();
  await search();
}
loadStats();
loadDemo();
search();
runBench();
</script>
</body>
</html>`;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  try {
    if (path === '/' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(HTML);
      return;
    }

    if (path === '/api/stats' && req.method === 'GET') {
      json(res, 200, statsPayload());
      return;
    }

    if (path === '/api/demo' && req.method === 'GET') {
      const q = url.searchParams.get('q') ?? 'kafka streaming';
      const k = Math.min(20, Math.max(1, parseInt(url.searchParams.get('k') ?? '3', 10) || 3));
      const qvec = await engine.embed(q);
      const hits = engine.topK(qvec, k).map(h => {
        const rec = engine.selectOne(h.id);
        return { id: h.id, score: +h.score.toFixed(4), text: rec ? rec.text : '' };
      });
      json(res, 200, { query: q, dims: DIMS, hits });
      return;
    }

    if (path === '/api/benchmark' && req.method === 'GET') {
      const N = 100;
      const ITERS = 50;
      const texts = Array.from({ length: N }, (_, i) =>
        `bench tweet ${i} kafka redis distributed systems streaming`);
      await Promise.resolve(engine.batchEmbed(texts.slice(0, 10)));
      const times = [];
      for (let i = 0; i < ITERS; i++) {
        const t0 = performance.now();
        await Promise.resolve(engine.batchEmbed(texts));
        times.push(performance.now() - t0);
      }
      times.sort((a, b) => a - b);
      const total = times.reduce((s, x) => s + x, 0);
      const p50 = +(times[Math.floor(ITERS * 0.50)] / N).toFixed(4);
      const p99 = +(times[Math.floor(ITERS * 0.99)] / N).toFixed(4);
      const throughput = Math.round((ITERS * N) / (total / 1000));
      json(res, 200, { p50, p99, throughput, iters: ITERS, batchSize: N });
      return;
    }

    if (path === '/api/engine/clear' && req.method === 'POST') {
      await instantiateEngine();
      json(res, 200, { ok: true });
      return;
    }

    if (path === '/api/engine/restart' && req.method === 'POST') {
      await instantiateEngine();
      await seedDefaultTweets();
      json(res, 200, { ok: true });
      return;
    }

    if (path === '/api/engine/switch' && req.method === 'POST') {
      const raw = await readBody(req);
      let body = {};
      try { body = JSON.parse(raw || '{}'); } catch { /* ignore */ }
      const target = body.target === 'ollama' ? 'ollama' : 'in-process';
      useOllama = target === 'ollama';
      await instantiateEngine();
      await seedDefaultTweets();
      json(res, 200, { ok: true, ollama: useOllama });
      return;
    }

    if (path === '/api/export' && req.method === 'GET') {
      const tweets = engine.select('tweet');
      const payload = {
        version: 1,
        dims: DIMS,
        tweets: tweets.map(t => {
          const vec = engine.getEmbedding(t.id);
          return {
            id: t.id,
            text: t.text,
            author: t.author,
            embedding: vec ? [...vec] : null,
          };
        }),
      };
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="nexus-day14-index.json"',
      });
      res.end(JSON.stringify(payload));
      return;
    }

    if (path === '/api/import' && req.method === 'POST') {
      const raw = await readBody(req);
      let data = {};
      try { data = JSON.parse(raw || '{}'); } catch {
        json(res, 400, { error: 'Invalid JSON' });
        return;
      }
      const rows = data.tweets;
      if (!Array.isArray(rows)) {
        json(res, 400, { error: 'Expected { tweets: [...] }' });
        return;
      }
      await instantiateEngine();
      for (const row of rows) {
        if (!row || typeof row.text !== 'string') continue;
        const rec = engine.create('tweet', {
          text: row.text,
          author: row.author ?? 'import',
        });
        if (Array.isArray(row.embedding) && row.embedding.length === DIMS) {
          engine.storeEmbedding(rec.id, Float32Array.from(row.embedding));
        } else {
          const vec = await Promise.resolve(engine.embed(row.text));
          engine.storeEmbedding(rec.id, vec);
        }
      }
      json(res, 200, { ok: true, imported: engine.count('tweet') });
      return;
    }

    if (path === '/api/seed200' && req.method === 'POST') {
      const corpus = [];
      for (let i = 0; i < 200; i++)
        corpus.push(`${TOPICS_200[i % TOPICS_200.length]} idx_${i}`);
      for (let i = 0; i < corpus.length; i++) {
        const rec = engine.create('tweet', { text: corpus[i], idx: i });
        const vec = await Promise.resolve(engine.embed(corpus[i]));
        engine.storeEmbedding(rec.id, vec);
      }
      json(res, 200, { ok: true, tweets: engine.count('tweet') });
      return;
    }

    if (path === '/api/tweets' && req.method === 'GET') {
      json(res, 200, { tweets: engine.select('tweet') });
      return;
    }

    if (path === '/api/vectors' && req.method === 'GET') {
      const tweets = engine.select('tweet');
      const vectors = tweets.map(t => {
        const v = engine.getEmbedding(t.id);
        const sample = v ? Array.from(v.slice(0, 8)) : [];
        return { id: t.id, textPreview: String(t.text).slice(0, 48), dims: v ? v.length : 0, sample };
      });
      json(res, 200, { count: vectors.length, vectors });
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  } catch (e) {
    console.error('[server]', e);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: String(e.message) }));
  }
});

server.listen(PORT, () => {
  console.log(`[server] http://localhost:${PORT}  (Ctrl+C to stop)`);
});
