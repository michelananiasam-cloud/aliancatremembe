function noCache(url) {
  return url + '?v=' + Date.now();
}

function carregarConfig() {

  // ✅ NOVO (resolve login SEM quebrar home)
  const base = window.BASE_PATH || "./";

  fetch(base + 'config/params.json?v=' + Date.now())
    .then(res => res.json())
    .then(cfg => {

      document.title = cfg.nomeProjeto;

      if (document.getElementById("nome-projeto"))
        document.getElementById("nome-projeto").textContent = cfg.nomeProjeto;

      if (document.getElementById("brand-nome"))
        document.getElementById("brand-nome").textContent = cfg.brand;

      if (document.getElementById("footer-projeto"))
        document.getElementById("footer-projeto").textContent = cfg.nomeProjeto;

      if (document.getElementById("footer-copy"))
        document.getElementById("footer-copy").textContent =
          `© ${cfg.ano} • Desenvolvido com ❤️ por ${cfg.autor}`;

      // ✅ AJUSTE AQUI (base no logo)
      const logo = document.getElementById("app-logo");
      if (logo) {
        logo.src = noCache(base + cfg.logo.replace('./', ''));
        logo.alt = cfg.nomeProjeto;
      }

      // ✅ AJUSTE AQUI (base no favicon)
      const favicon = document.getElementById("app-favicon");
      if (favicon) {
        favicon.href = noCache(base + cfg.favicon.replace('./', ''));
      }

      // ✅ watermark (igual ao seu)
      if ((cfg.env || "").toLowerCase() === "dev") {
        document.documentElement.style.setProperty('--watermark-display', 'flex');
      } else {
        document.documentElement.style.setProperty('--watermark-display', 'none');
      }

      // ✅ mantém global
      window.APP_CONFIG = cfg;

    })
    .catch(err => console.error("Erro config:", err));
}

document.addEventListener("DOMContentLoaded", carregarConfig);
console.log("App carregado com sucesso ✅");
