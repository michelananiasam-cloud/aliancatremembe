/* ========================================
   GLOBAL VERSION
======================================== */
let APP_VERSION = "dev";

/* ========================================
   UTIL (VERSIONAMENTO)
======================================== */
function versionedUrl(url, type = "static") {

  if (type === "config") {
    return url + "?v=" + Date.now();
  }

  return url + "?v=" + APP_VERSION;
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

  document.title = cfg.nomeProjeto;

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
    appLogo.src = versionedUrl(base + cfg.logo.replace("./", ""));
    appLogo.alt = cfg.nomeProjeto;
  }

  // ✅ FAVICON
  const favicon = document.getElementById("app-favicon");
  if (favicon) {
    favicon.href = versionedUrl(base + cfg.favicon.replace("./", ""));
  }

  aplicarWatermark(cfg);
}

/* ========================================
   WATERMARK DINÂMICA
======================================== */
function aplicarWatermark(cfg) {

  const watermark = document.getElementById("watermark");
  if (!watermark || !cfg.watermark) return;

  const env = (cfg.env || "").toLowerCase();

  const text =
    (cfg.watermark.texts && cfg.watermark.texts[env]) || "";

  watermark.textContent = text;

  if (!cfg.watermark.enabled || !text) {
    watermark.style.display = "none";
    return;
  }

  watermark.style.display = "flex";

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
   APPLY LOGIN
======================================== */
function aplicarLogin(cfg, base) {

  const loginNome = document.getElementById("login-nome");
  if (loginNome) {
    loginNome.textContent = cfg.nomeProjeto;
  }

  const logoHero = document.getElementById("logo-hero");
  if (logoHero) {
    logoHero.src = versionedUrl(base + cfg.logo.replace("./", ""));

    logoHero.onclick = () => {
      window.location.href = base + "index.html";
    };
  }
}

/* ========================================
   APPLY UI (NOVO)
======================================== */
function aplicarUI(cfg) {

  // ✅ controlar botão login
  if (!cfg.ui?.showLogin) {
    document.body.classList.add("hide-login");
  }
}

/* ========================================
   FETCH CONFIG (SEM CACHE)
======================================== */
function fetchConfig(base) {

  return fetch(versionedUrl(base + "config/params.json", "config"), {
    cache: "no-store"
  })
    .then(res => {
      if (!res.ok) {
        throw new Error("HTTP " + res.status);
      }
      return res.json();
    });
}

/* ========================================
   INIT
======================================== */
function carregarConfig() {

  const base = getBasePath();

  fetchConfig(base)
    .then(cfg => {

      APP_VERSION = cfg.version || APP_VERSION;

      localStorage.setItem("APP_CONFIG_CACHE", JSON.stringify(cfg));

      window.APP_CONFIG = cfg;

      aplicarConfigGeral(cfg, base);
      aplicarLogin(cfg, base);
      aplicarUI(cfg); // ✅ NOVO

      console.log("✅ Config ONLINE");
      console.log("📦 Versão:", APP_VERSION);
      console.log("🌎 Ambiente:", cfg.env);

    })
    .catch(err => {

      console.warn("⚠️ Falha no fetch, usando cache local");

      const cached = localStorage.getItem("APP_CONFIG_CACHE");

      if (cached) {
        const cfg = JSON.parse(cached);

        APP_VERSION = cfg.version || APP_VERSION;

        window.APP_CONFIG = cfg;

        aplicarConfigGeral(cfg, base);
        aplicarLogin(cfg, base);
        aplicarUI(cfg); // ✅ NOVO

        console.log("✅ Config CACHE LOCAL");
        console.log("📦 Versão:", APP_VERSION);
        console.log("🌎 Ambiente:", cfg.env);

      } else {
        console.error("❌ Nenhum config disponível", err);
      }
    });
}

/* ========================================
   START
======================================== */
document.addEventListener("DOMContentLoaded", carregarConfig);
