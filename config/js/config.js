function carregarConfig() {
  fetch('./config/params.json?v=' + Date.now()) // ✅ CAMINHO CORRETO
    .then(res => res.json())
    .then(cfg => {

      document.title = cfg.nomeProjeto;

      document.getElementById("nome-projeto").textContent = cfg.nomeProjeto;
      document.getElementById("brand-nome").textContent = cfg.brand;
      document.getElementById("footer-projeto").textContent = cfg.nomeProjeto;

      document.getElementById("footer-copy").textContent =
        `© ${cfg.ano} • Desenvolvido com ❤️ por ${cfg.autor}`;

      const logo = document.getElementById("app-logo");
      logo.src = cfg.logo;
      logo.alt = cfg.nomeProjeto;

      document.getElementById("app-favicon").href = cfg.favicon;

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
``
