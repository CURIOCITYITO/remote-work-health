const products = [
  { name: "商品A", affiliate_url: "https://example.com/a" },
  { name: "商品B", affiliate_url: "https://example.com/b" }
];

function render(){
  const wrap = document.getElementById("results");
  wrap.innerHTML = "";
  products.forEach(p => {
    const card = document.createElement("div");
    card.innerHTML = `<h3>${p.name}</h3>
                      <a href="${p.affiliate_url}" target="_blank">ストアで見る</a>`;
    wrap.appendChild(card);
  });
}
render();
