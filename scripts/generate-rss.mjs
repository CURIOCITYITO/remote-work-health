import { readFileSync, writeFileSync } from "node:fs";

function xmlEscape(s="") {
  return s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll("\"","&quot;").replaceAll("'","&apos;");
}

const siteTitle = "在宅ワーク×健康アイテム レコメンダー";
const siteLink = process.env.SITE_URL || "";
const siteDesc = "在宅ワークの快適性と健康を両立する、足置き・姿勢矯正・静音扇風機などの厳選アイテムを用途別にレコメンドします。";

const products = JSON.parse(readFileSync("products.json","utf-8"));
const now = new Date().toUTCString();

const items = products.map(p => {
  const title = `${p.name || ""}（${p.brand || ""}）`;
  const link = p.affiliate_url || "";
  const summary = (p.pros && p.pros.slice(0,4).join("・")) || (p.use_case && p.use_case.slice(0,3).join(" / ")) || "";
  const guid = `${p.brand || ""}-${p.name || ""}`.trim().replaceAll(" ","_");
  return `
    <item>
      <title>${xmlEscape(title)}</title>
      <link>${xmlEscape(link)}</link>
      <guid isPermaLink="false">${xmlEscape(guid)}</guid>
      <description>${xmlEscape(summary)}</description>
      <pubDate>${now}</pubDate>
    </item>`
}).join("");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${xmlEscape(siteTitle)}</title>
    <link>${xmlEscape(siteLink)}</link>
    <description>${xmlEscape(siteDesc)}</description>
    ${items}
  </channel>
</rss>`;

writeFileSync("rss.xml", xml, "utf-8");
console.log("rss.xml generated");
