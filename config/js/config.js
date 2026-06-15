/* ========================================
   UTIL
======================================== */
function noCache(url) {
  return url + '?v=' + Date.now();
}

/* ========================================
   BASE PATH
======================================== */
function getBasePath() {
  return window.BASE_PATH || "./";
}

/* ========================================
   APPLY CONFIG GLOBAL
======================================== */
function aplicarConfigGeral(cfg, base) {

  // ✅ TITLE
  document.title = cfg.nomeProjeto;

  // ✅ TEXTOS GLOBAIS
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

  // ✅ LOGO HEADER
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

  // ✅ WATERMARK COMPLETA
  aplicarWatermark(cfg);
}

/* ========================================
   WATERMARK DINÂMICA
======================================== */
function aplicarWatermark(cfg) {

  const watermark = document.getElementById("watermark");
  if (!watermark || !cfg.watermark) return;

  const env = (cfg.env || "").toLowerCase();

  // ✅ TEXTO
  const text =
    (cfg.watermark.texts && cfg.watermark.texts[env]) || "";

  watermark.textContent = text;

  // ✅ VISIBILIDADE
  if (!cfg.watermark.enabled || !text) {
    watermark.style.display = "none";
    return;
  }

  watermark.style.display = "flex";

  // ✅ ESTILO DINÂMICO (OPCIONAL)
  if (cfg.watermark.styles && cfg.watermark.styles[env]) {
    const styles = cfg.watermark.styles[env];

    if (styles.color) watermark.style.color = styles.color;
    if (styles.opacity) watermark.style.opacity = styles.opacity;
    if (styles.fontSize) watermark.style.fontSize = styles.fontSize;
    if (styles.rotate) {
      watermark.style.transform =
        `translate(-50%, -50%) rotate(${styles.rotate})`;
    }
  }
}

/* ========================================
   APPLY LOGIN (AUTOMÁTICO)
======================================== */
function aplicarLogin(cfg, base) {

  const loginTitle = document.getElementById("login-title");
  if (loginTitle) {
    loginTitle.textContent = "Entrar no " + cfg.nomeProjeto;
  }

  const logoHero = document.getElementById("logo-hero");
  if (logoHero) {
    logoHero.src = noCache(base + cfg.logo.replace('./', ''));

    logoHero.onclick = () => {
      window.location.href = base + "index.html";
    };
  }
}

/* ========================================
   INIT
======================================== */
function carregarConfig() {

  const base = getBasePath();

  fetch(noCache(base + 'config/params.json'))
    .then(res => res.json())
    .then(cfg => {

      // ✅ GLOBAL
      window.APP_CONFIG = cfg;

      // ✅ APPLY
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
