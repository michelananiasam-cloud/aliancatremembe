/* ============================================================
   CONFIG
============================================================ */
const MOBILE_EDITABLE = false;

function isMobileEditAllowed() {
  return MOBILE_EDITABLE;
}

function canEdit() {
  return !(window.innerWidth <= 760 && !isMobileEditAllowed());
}

/* ============================================================
   CONSTANTES / STORAGE
============================================================ */
const TITLE_KEY = "Equipes_titulo";
const TITLE_DEFAULT = "Equipes Movimento Tremembé";
const ORG_KEY = "Equipes_dados_v2";

/* ============================================================
   MODELO
============================================================ */
function defaultModel() {
  return {
    coordenacao: [],
    interna: { responsaveis: [], equipes: [] },
    externa: { responsaveis: [], equipes: [] },
    apoio:   { responsaveis: [], equipes: [] }
  };
}

/* ============================================================
   TITLE
============================================================ */
function getTitulo() {
  try {
    return (localStorage.getItem(TITLE_KEY) || "").trim() || TITLE_DEFAULT;
  } catch {
    return TITLE_DEFAULT;
  }
}

function setTitulo(v) {
  try {
    localStorage.setItem(TITLE_KEY, (v || "").trim());
  } catch {}
}

function getTituloFormatado() {
  const base = getTitulo();
  const nome = base !== TITLE_DEFAULT ? base : "Movimento Tremembé";
  return "Equipes " + nome;
}

function atualizarTitulos() {
  const h1 = document.getElementById("titulo-web");
  const t = getTituloFormatado();

  if (h1) h1.textContent = t;
  document.title = t;
}

/* ============================================================
   STORAGE
============================================================ */
function normalizeModel(m) {
  if (!m || typeof m !== "object") return defaultModel();

  ["interna", "externa", "apoio"].forEach(k => {
    m[k] = m[k] || { responsaveis: [], equipes: [] };
    m[k].equipes = m[k].equipes || [];
  });

  return m;
}

function loadOrg() {
  try {
    const raw = localStorage.getItem(ORG_KEY);
    return raw ? normalizeModel(JSON.parse(raw)) : defaultModel();
  } catch {
    return defaultModel();
  }
}

function saveOrg(m) {
  localStorage.setItem(ORG_KEY, JSON.stringify(normalizeModel(m)));
}

/* ============================================================
   HELPERS
============================================================ */
function sortByNamePT(a, b) {
  return String(a).localeCompare(String(b), "pt-BR", {
    sensitivity: "base"
  });
}

function findEquipe(list, nome) {
  return (list || []).find(
    e => e.nome.toLowerCase() === nome.toLowerCase()
  );
}

/* ============================================================
   CORE
============================================================ */
function upsertEquipe(refKey, nome, pessoa, marcarRef) {
  const org = loadOrg();

  let eq = findEquipe(org[refKey].equipes, nome);

  if (!eq) {
    eq = { nome, pessoas: [], referencia: null };
    org[refKey].equipes.push(eq);
  }

  if (pessoa) {
    if (!eq.pessoas.some(p => p.nome === pessoa)) {
      eq.pessoas.push({ nome: pessoa, confirmado: null });
    }

    if (marcarRef) eq.referencia = pessoa;
  }

  saveOrg(org);
}

/* ============================================================
   UI HELPERS
============================================================ */
function el(tag, attrs = {}, children = []) {
  const e = document.createElement(tag);

  Object.entries(attrs).forEach(([k, v]) => {
    if (k === "className") e.className = v;
    else if (k.startsWith("on") && typeof v === "function") {
      e.addEventListener(k.slice(2), v);
    } else {
      e.setAttribute(k, v);
    }
  });

  [].concat(children).forEach(c => {
    if (typeof c === "string") e.appendChild(document.createTextNode(c));
    else if (c) e.appendChild(c);
  });

  return e;
}

/* ============================================================
   RENDER (FLUIDO)
============================================================ */
let renderQueued = false;

function safeRender() {
  if (renderQueued) return;

  renderQueued = true;
  requestAnimationFrame(() => {
    render();
    renderQueued = false;
  });
}

function render() {
  const root = document.getElementById("org");
  if (!root) return;

  root.innerHTML = "";

  const org = loadOrg();
  atualizarTitulos();

  const grid = el("div", { className: "grid-refs" });

  ["interna", "externa", "apoio"].forEach(ref => {
    const area = org[ref];

    const card = el("div", { className: "card" }, [
      el("h3", {}, ref.toUpperCase())
    ]);

    if (!area.equipes.length) {
      card.appendChild(
        el("p", { style: "opacity:.6;" }, "Sem equipes")
      );
    }

    area.equipes
      .slice()
      .sort((a, b) => sortByNamePT(a.nome, b.nome))
      .forEach(eq => {
        card.appendChild(
          el("div", { className: "team-line" }, eq.nome)
        );
      });

    grid.appendChild(card);
  });

  root.appendChild(grid);
}

/* ============================================================
   EXPORT
============================================================ */
function baixarJSONEquipes() {
  const json = JSON.stringify(loadOrg(), null, 2);

  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "equipes.json";
  a.click();

  URL.revokeObjectURL(url);
}

/* ============================================================
   UI BIND
============================================================ */
function bindUI() {
  const btnAdd = document.getElementById("btn-add-equipe");
  const btnExport = document.getElementById("btn-export-json");
  const btnAtualizar = document.getElementById("btn-atualizar");
  const btnAtualizarMobile = document.getElementById("btn-atualizar-mobile");

  if (btnAdd) {
    btnAdd.addEventListener("click", () => {
      const nome = document.getElementById("eq-nome")?.value?.trim();
      const pessoa = document.getElementById("eq-pessoa")?.value?.trim();
      const ref = document.getElementById("eq-ref")?.value || "interna";
      const marcarRef = document.getElementById("eq-marcar-ref")?.checked;

      if (!nome) return;

      upsertEquipe(ref, nome, pessoa, marcarRef);

      if (document.getElementById("eq-pessoa"))
        document.getElementById("eq-pessoa").value = "";

      safeRender();
    });
  }

  if (btnExport) {
    btnExport.addEventListener("click", baixarJSONEquipes);
  }

  if (btnAtualizar) {
    btnAtualizar.addEventListener("click", escolherAtualizacaoJSON);
  }

  if (btnAtualizarMobile) {
    btnAtualizarMobile.addEventListener("click", escolherAtualizacaoJSON);
  }
}

/* ============================================================
   INIT
============================================================ */
function initApp() {
  bindUI();
  safeRender();
}

/* ============================================================
   START
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  initApp();
});
