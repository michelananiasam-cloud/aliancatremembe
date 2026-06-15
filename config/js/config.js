/* ========================================
   UTIL
======================================== */
function noCache(url) {
  return url + '?v=' + Date.now();
}

/* ========================================
   BASE PATH (HOME ou LOGIN)
======================================== */
function getBasePath() {
  return window.BASE_PATH || "./";
}

/* ========================================
   APPLY CONFIG (GLOBAL)
======================================== */
function aplicarConfigGeral(cfg, base) {

  // ✅ TITLE
  document.title = cfg.nomeProjeto;

  // ✅ TEXTO GLOBAL
  const nomeProjeto = document.getElementById("nome-projeto");
  const brand = document.getElementById("brand-nome");
  const footerProjeto = document.getElementById("footer-projeto");
  const footerCopy = document.getElementById("footer-copy");

  if (nomeProjeto) nomeProjeto.textContent = cfg.nomeProjeto;
  if (brand) brand.textContent = cfg.brand;
  if (footerProjeto) footerProjeto.textContent = cfg.nomeProjeto;
  if (footerCopy) {
    footerCopy.textContent =
      `© ${cfg.ano} • Desenvolvido com ❤️ por ${cfg.autor}`;
  }

  // ✅ LOGO HEADER (HOME)
  const appLogo = document.getElementById("app-logo");
  if (appLogo) {
    appLogo.src = noCache(base + cfg.logo.replace('./', ''));
    appLogo.alt = cfg.nomeProjeto;
  }

  // ✅ FAVICON
  const favicon = document.getElementById("app-favicon");
  if (favicon) {
    favicon.href = noCache(base + cfg.favicon.replace('./', ''));
  }

  // ✅ WATERMARK
  if ((cfg.env || "").toLowerCase() === "dev") {
    document.documentElement.style.setProperty('--watermark-display', 'flex');
  } else {
    document.documentElement.style.setProperty('--watermark-display', 'none');
  }
}

/* ========================================
   APPLY LOGIN (AUTOMÁTICO)
======================================== */
function aplicarLogin(cfg, base) {

  // ✅ TITLE LOGIN
  const loginTitle = document.getElementById("login-title");
  if (loginTitle) {
    loginTitle.textContent = "Entrar no " + cfg.nomeProjeto;
  }

  // ✅ LOGO HERO (LOGIN)
  const logoHero = document.getElementById("logo-hero");
  if (logoHero) {
    logoHero.src = noCache(base + cfg.logo.replace('./', ''));

    logoHero.onclick = () => {
      window.location.href = base + "index.html";
    };
  }
}

/* ========================================
   INIT CONFIG
======================================== */
function carregarConfig() {

  const base = getBasePath();

  fetch(noCache(base + 'config/params.json'))
    .then(res => res.json())
    .then(cfg => {

      // ✅ disponibiliza global
      window.APP_CONFIG = cfg;

      // ✅ aplica partes
      aplicarConfigGeral(cfg, base);
      aplicarLogin(cfg, base);

      console.log("✅ Config aplicada com sucesso");

    })
    .catch(err => console.error("❌ Erro config:", err));
}

/* ========================================
   START
======================================== */
document.addEventListener("DOMContentLoaded", carregarConfig);
