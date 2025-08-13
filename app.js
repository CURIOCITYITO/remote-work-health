// No-image app.js: uses products.json & faq.json, no <img> tags.
let PRODUCTS = [];
let FAQS = [];

const TAGS = [
  { key: "静音重視" }, { key: "姿勢矯正" }, { key: "足置き" }, { key: "省エネ・USB" },
  { key: "ランバーサポート" }, { key: "ながら運動" }, { key: "冬向け" }, { key: "夏向け" }
];

const TAG_COLORS = [
  {bg:"#FFE4E6", ink:"#7A1F3D"}, {bg:"#E0F2FE", ink:"#0B4A6F"},
  {bg:"#FDE68A", ink:"#7A4E00"}, {bg:"#E9D5FF", ink:"#4A2876"},
  {bg:"#DCFCE7", ink:"#0A5B3E"}, {bg:"#FFEDD5", ink:"#7A3E00"},
  {bg:"#F1F5F9", ink:"#0f172a"}, {bg:"#F5D0FE", ink:"#6b21a8"}
];

function renderTags() {
  const wrap = document.getElementById("tags");
  wrap.innerHTML = "";
  TAGS.forEach((tag, idx) => {
    const el = document.createElement("button");
    el.className = "tag";
    el.textContent = tag.key;
    const c = TAG_COLORS[idx % TAG_COLORS.length];
    el.style.background = c.bg; el.style.color = c.ink; el.style.borderColor = "rgba(0,0,0,.06)";
    el.onclick = () => {
      el.classList.toggle("active");
      if (el.classList.contains("active")) {
        el.style.background = "#ff3d71"; el.style.color = "#fff"; el.style.borderColor = "transparent";
      } else {
        el.style.background = c.bg; el.style.color = c.ink; el.style.borderColor = "rgba(0,0,0,.06)";
      }
      search();
    };
    wrap.appendChild(el);
  });
}

function loadData() {
  return Promise.all([
    fetch("products.json").then(r => r.json()).then(d => PRODUCTS = d),
    fetch("faq.json").then(r => r.json()).then(d => FAQS = d).catch(()=> FAQS=[])
  ]);
}

function renderResults(list, q="") {
  const wrap = document.getElementById("results");
  wrap.innerHTML = "";
  if (!list.length) {
    wrap.innerHTML = `<div class="muted">該当なし。キーワードを変えるかタグを選んでください。</div>`;
    document.getElementById("reco").style.display = "none";
    return;
  }
  list.forEach(item => {
    const prosList = (item.pros || []);
    const summary = (prosList.length ? prosList.slice(0,4).join("・") : (item.use_case||[]).join(" / ")) || "";
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${item.name}</h3>
      <div class="muted">${item.brand || ""}</div>
      <p class="desc">${summary}</p>
      <div><a class="btn" href="${item.affiliate_url}" target="_blank" rel="noopener">ストアで見る</a></div>
    `;
    wrap.appendChild(card);
  });
  renderRecommendations(list, list.map(x => x.name));
}

function mostCommonTag(items) {
  const counts = {};
  items.forEach(p => (p.tags || []).forEach(t => counts[t] = (counts[t]||0)+1));
  let best = null, bestCount = 0;
  Object.entries(counts).forEach(([t,c]) => { if (c>bestCount) { best=t; bestCount=c; } });
  return best;
}

function renderRecommendations(baseList, excludeNames = []) {
  const wrap = document.getElementById("recoList");
  wrap.innerHTML = "";
  if (!PRODUCTS.length) return;

  const tag = mostCommonTag(baseList);
  let pool = PRODUCTS.filter(p => (p.tags || []).includes(tag));
  if (!pool.length) {
    const fallbackTokens = ["静音","姿勢","足置き","ヒーター","スタンド","加湿"];
    pool = PRODUCTS.filter(p => fallbackTokens.some(t => (p.name + " " + (p.keywords||[]).join(" ")).includes(t)));
  }
  pool = pool.filter(p => !excludeNames.includes(p.name));
  const list = pool.slice(0, 12);
  if (!list.length) {
    document.getElementById("reco").style.display = "none";
    return;
  }
  document.getElementById("reco").style.display = "block";
  list.forEach(item => {
    const summary = ((item.pros||[]).slice(0,3).join("・")) || ((item.use_case||[]).join(" / "));
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${item.name}</h3>
      <div class="muted">${item.brand || ""} ・ ${(item.tags||[]).join(" / ")}</div>
      <p class="desc">${summary}</p>
      <div><a class="btn" href="${item.affiliate_url}" target="_blank" rel="noopener">ストアで見る</a></div>
    `;
    wrap.appendChild(card);
  });
}

function search() {
  const q = (document.getElementById("q").value || "").trim();
  const activeTags = Array.from(document.querySelectorAll(".tag.active")).map(el => el.textContent);
  let results = PRODUCTS.slice();

  if (q) {
    const t = q.toLowerCase();
    results = results.filter(p =>
      (p.name||"").toLowerCase().includes(t) ||
      (p.brand||"").toLowerCase().includes(t) ||
      (p.tags||[]).some(x => (x||"").toLowerCase().includes(t)) ||
      (p.use_case||[]).some(x => (x||"").toLowerCase().includes(t)) ||
      (p.keywords||[]).some(x => (x||"").toLowerCase().includes(t))
    );
  }
  if (activeTags.length) {
    results = results.filter(p => (p.tags||[]).some(t => activeTags.includes(t)));
  }
  renderResults(results, q);
}

function renderFAQ() {
  const wrap = document.getElementById("faqList");
  if (!FAQS.length) { wrap.innerHTML = ""; return; }
  wrap.innerHTML = "";
  FAQS.forEach(f => {
    const d = document.createElement("details");
    const s = document.createElement("summary");
    s.textContent = f.q; d.appendChild(s);
    const p = document.createElement("div");
    p.innerHTML = `<p>${f.a}</p>`; d.appendChild(p);
    wrap.appendChild(d);
  });
}

document.getElementById("searchBtn").addEventListener("click", search);
document.getElementById("q").addEventListener("keydown", (e) => { if (e.key === "Enter") search(); });
document.getElementById("year").textContent = new Date().getFullYear();

renderTags();
loadData().then(() => search()).then(() => renderFAQ());
