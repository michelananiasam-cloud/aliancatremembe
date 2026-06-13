function carregarConfig() {
  fetch('./config/params.json?v=' + Date.now())
    .then(res => {
      if (!res.ok) {
        throw new Error("Erro ao carregar params.json");
      }
      return res.json();
    })
    .then(cfg => {

      document.title = cfg.nomeProjeto || "Aplicação";

      const nome = document.getElementById("nome-projeto");
      if (nome) nome.textContent = cfg.nomeProjeto || "";

      const brand = document.getElementById("brand-nome");
      if (brand) brand.textContent = cfg.brand || "";

      const footerProj = document.getElementById("footer-projeto");
      if (footerProj) footerProj.textContent = cfg.nomeProjeto || "";

      const copy = document.getElementById("footer-copy");
      if (copy) {
        copy.textContent = `© ${cfg.ano || ""} • Desenvolvido com ❤️ por ${cfg.autor || ""}`;
      }

      const logo = document.getElementById("app-logo");
      if (logo && cfg.logo) {
        logo.src = cfg.logo + "?v=" + Date.now();
        logo.alt = cfg.nomeProjeto || "Logo";
      }

      const favicon = document.getElementById("app-favicon");
      if (favicon && cfg.favicon) {
        favicon.href = cfg.favicon + "?v=" + Date.now();
      }

      const env = (cfg.env || "").toLowerCase();

      if (env === "dev") {
        document.documentElement.style.setProperty('--watermark-display', 'flex');
        console.log("✅ Ambiente DEV ativo");
      } else {
        document.documentElement.style.setProperty('--watermark-display', 'none');
      }

    })
    .catch(err => {
      console.error("❌ Erro ao carregar config:", err);
    });
}

document.addEventListener("DOMContentLoaded", carregarConfig);
