// 🔹 Função global para evitar cache (NOVO)
function noCache(url) {
  return url + '?v=' + Date.now();
}

function carregarConfig() {
  // ✅ você já fazia certo aqui (mantive)
  fetch('./config/params.json?v=' + Date.now())
    .then(res => res.json())
    .then(cfg => {

      document.title = cfg.nomeProjeto;

      document.getElementById("nome-projeto").textContent = cfg.nomeProjeto;
      document.getElementById("brand-nome").textContent = cfg.brand;
      document.getElementById("footer-projeto").textContent = cfg.nomeProjeto;

      document.getElementById("footer-copy").textContent =
        `© ${cfg.ano} • Desenvolvido com ❤️ por ${cfg.autor}`;

      // ✅ ✅ AQUI ESTAVA O PROBLEMA
      const logo = document.getElementById("app-logo");
      logo.src = noCache(cfg.logo); // 👈 ALTERADO
      logo.alt = cfg.nomeProjeto;

      // ✅ ✅ E AQUI TAMBÉM
      document.getElementById("app-favicon").href = noCache(cfg.favicon); // 👈 ALTERADO

      // ✅ ENV (watermark)
      if ((cfg.env || "").toLowerCase() === "dev") {
        document.documentElement.style.setProperty('--watermark-display', 'flex');
      } else {
        document.documentElement.style.setProperty('--watermark-display', 'none');
      }

    })
    .catch(err => console.error("Erro config:", err));
}

document.addEventListener("DOMContentLoaded", carregarConfig);
console.log("App carregado ✅");
