// クライアントサイド簡易レコメンド
const TAGS = [
  { key: "むくみ対策", tokens: ["むくみ","血流","ふくらはぎ","足首"] },
  { key: "猫背矯正", tokens: ["猫背","姿勢","前傾","肩甲骨"] },
  { key: "夏の静音涼感", tokens: ["夏","扇風機","静音","サーキュレーター","涼しい"] },
  { key: "冬の足元あったか", tokens: ["冬","冷え","ヒーター","足温器","寒い"] },
  { key: "ストレッチ＆軽運動", tokens: ["ストレッチ","運動","揺れ","足踏み","デスクバイク"] },
  { key: "腰椎サポート", tokens: ["腰","ランバー","腰痛","背もたれ"] },
  { key: "視線・モニター調整", tokens: ["モニター","視線","PCスタンド","台"] },
  { key: "手首・肩ケア", tokens: ["手首","リストレスト","肩こり","アームレスト"] }
];

const INTENT_WEIGHTS = {
  "静音": 2.0, "省エネ": 1.5, "安い": 1.2, "軽量": 1.1, "冷感": 1.1, "通気": 1.1,
  "USB": 1.0, "首振り": 1.2, "高さ調整": 1.3, "低反発": 1.2, "メッシュ": 1.1,
  "タイマー": 1.2, "DC": 1.3, "在宅": 1.0
};

let PRODUCTS = [];
let FAQS = [];

function tokenize(text) {
  if (!text) return [];
  return text.toLowerCase()
    .replace(/[　]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

async function loadData() {
  const [pRes, fRes] = await Promise.all([
    fetch("products.json"),
    fetch("faq.json")
  ]);
  PRODUCTS = await pRes.json();
  FAQS = await fRes.json();
  renderTags();
  search(); // 初期表示
  renderFAQ();
}

function renderTags() {
  const wrap = document.getElementById("tags");
  wrap.innerHTML = "";
  TAGS.forEach(tag => {
    const el = document.createElement("button");
    el.className = "tag";
    el.textContent = tag.key;
    el.onclick = () => {
      el.classList.toggle("active");
      search();
    };
    wrap.appendChild(el);
  });
}

function getActiveTagTokens() {
  const active = [...document.querySelectorAll(".tag.active")].map(b => b.textContent);
  const tokens = [];
  TAGS.forEach(t => {
    if (active.includes(t.key)) tokens.push(...t.tokens);
  });
  return tokens;
}

function scoreProduct(p, queryTokens) {
  let score = 0;
  const kw = (p.keywords || []).join(" ") + " " + (p.use_case || []).join(" ");
  const s = kw + " " + p.name + " " + p.brand;
  queryTokens.forEach(t => {
    if (s.includes(t)) score += 1;
  });
  Object.entries(INTENT_WEIGHTS).forEach(([k, w]) => {
    if (s.includes(k)) score += w;
  });
  return score;
}

function search() {
  const q = document.getElementById("q").value.trim();
  const queryTokens = [...tokenize(q), ...getActiveTagTokens()];
  const results = PRODUCTS
    .map(p => ({ p, score: scoreProduct(p, queryTokens) }))
    .sort((a,b) => b.score - a.score)
    .slice(0, 12)
    .map(({p}) => p);
  renderResults(results, q);
  renderRecommendations(results, results.map(r => r.name));
}

function renderResults(list, q) {
  const wrap = document.getElementById("results");
  wrap.innerHTML = "";
  if (!list.length) {
    wrap.innerHTML = `<div class="card">条件に合うアイテムが見つかりませんでした。キーワードを変更してお試しください。</div>`;
    return;
  }
  list.forEach(item => {
    const pros = (item.pros || []).map(x => `<li>${x}</li>`).join("");
    const cons = (item.cons || []).map(x => `<li>${x}</li>`).join("");
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${item.name}</h3>
      <div class="muted">${item.brand}</div>
      <div><strong>こんな人向け：</strong> ${ (item.use_case || []).join(" / ") }</div>
      <div><strong>推す理由：</strong><ul>${pros}</ul></div>
      <div><strong>注意点：</strong><ul>${cons}</ul></div>
      <div><a class="btn" href="${item.affiliate_url}" target="_blank" rel="noopener">ストアで見る</a></div>
    `;
    wrap.appendChild(card);
  });
}

function renderFAQ() {
  const wrap = document.getElementById("faqList");
  wrap.innerHTML = "";
  FAQS.forEach(({q,a}) => {
    const d = document.createElement("details");
    const s = document.createElement("summary");
    s.textContent = q;
    const p = document.createElement("p");
    p.textContent = a;
    d.appendChild(s); d.appendChild(p);
    wrap.appendChild(d);
  });
}

document.getElementById("searchBtn").addEventListener("click", search);
document.getElementById("q").addEventListener("keydown", (e) => {
  if (e.key === "Enter") search();
});
document.getElementById("year").textContent = new Date().getFullYear();

loadData().catch(err => {
  console.error(err);
  document.getElementById("results").innerHTML = "<div class='card'>データの読み込みに失敗しました。再読み込みしてください。</div>";
});



// -------- 推薦（AI風）: クエリやタグから関連商品を提示 --------
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

  // 1) ベースの一覧から最頻タグを抽出
  const tag = mostCommonTag(baseList);
  let pool = PRODUCTS.filter(p => (p.tags || []).includes(tag));
  if (!pool.length) {
    // 2) タグがなければ「静音」「姿勢矯正」などの意図を拾う
    const fallbackTokens = ["静音","姿勢","足置き","ヒーター","スタンド","加湿"];
    pool = PRODUCTS.filter(p => fallbackTokens.some(t => (p.name + " " + (p.keywords||[]).join(" ")).includes(t)));
  }
  // 除外・重複排除
  pool = pool.filter(p => !excludeNames.includes(p.name));
  // 上位12件
  const list = pool.slice(0, 12);
  if (!list.length) {
    document.getElementById("reco").style.display = "none";
    return;
  }
  document.getElementById("reco").style.display = "block";
  list.forEach(item => {
    const pros = (item.pros || []).map(x => `<li>${x}</li>`).join("");
    const cons = (item.cons || []).map(x => `<li>${x}</li>`).join("");
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${item.name}</h3>
      <div class="muted">${item.brand} ・ ${(item.tags||[]).join(" / ")}</div>
      <div><strong>推す理由：</strong><ul>${pros}</ul></div>
      <div><a class="btn" href="${item.affiliate_url}" target="_blank" rel="noopener">ストアで見る</a></div>
    `;
    wrap.appendChild(card);
  });
}
