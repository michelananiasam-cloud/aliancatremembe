function carregarConfig() {

  fetch('/config/params.json?v=' + Date.now()) // ✅ AQUI
    .then(res => res.json())
    .then(cfg => {

      document.title = cfg.nomeProjeto;

      const nome = document.getElementById("nome-projeto");
      if (nome) nome.textContent = cfg.nomeProjeto;

      const logo = document.getElementById("app-logo");
      if (logo) {
        logo.src = cfg.logo;
      }

      const favicon = document.getElementById("app-favicon");
      if (favicon) {
        favicon.href = cfg.favicon;
      }

    });
}

document.addEventListener("DOMContentLoaded", carregarConfig);
