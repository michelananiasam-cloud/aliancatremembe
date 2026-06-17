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
function defaultModel(){
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
function getTitulo(){
  try { return (localStorage.getItem(TITLE_KEY)||"").trim() || TITLE_DEFAULT }
  catch { return TITLE_DEFAULT }
}
function setTitulo(v){
  try { localStorage.setItem(TITLE_KEY, (v||"").trim()) } catch{}
}

function getTituloFormatado(){
  const base = getTitulo();
  const nome = base !== TITLE_DEFAULT ? base : "Movimento Tremembé";
  return "Equipes " + nome;
}

function atualizarTitulos(){
  const h1 = document.getElementById("titulo-web");
  const t = getTituloFormatado();
  if (h1) h1.textContent = t;
  document.title = t;
}

/* ============================================================
   STORAGE
============================================================ */
function normalizeModel(m){
  if (!m || typeof m !== "object") return defaultModel();

  ["interna","externa","apoio"].forEach(k=>{
    m[k] = m[k] || {responsaveis:[],equipes:[]};
    m[k].equipes = m[k].equipes || [];
  });

  return m;
}

function loadOrg(){
  try{
    const raw = localStorage.getItem(ORG_KEY);
    return raw ? normalizeModel(JSON.parse(raw)) : defaultModel();
  }catch {
    return defaultModel();
  }
}
function saveOrg(m){
  localStorage.setItem(ORG_KEY, JSON.stringify(normalizeModel(m)));
}

/* ============================================================
   HELPERS
============================================================ */
function sortByNamePT(a,b){
  return String(a).localeCompare(String(b),"pt-BR",{sensitivity:"base"});
}

function findEquipe(list, nome){
  return (list||[]).find(e => e.nome.toLowerCase() === nome.toLowerCase());
}

/* ============================================================
   CORE AÇÕES
============================================================ */
function upsertEquipe(refKey, nome, pessoa, marcarRef){
  const org = loadOrg();
  let eq = findEquipe(org[refKey].equipes, nome);

  if (!eq){
    eq = {nome, pessoas:[], referencia:null};
    org[refKey].equipes.push(eq);
  }

  if (pessoa){
    eq.pessoas.push({nome:pessoa, confirmado:null});
    if (marcarRef) eq.referencia = pessoa;
  }

  saveOrg(org);
}

/* ============================================================
   UI HELPERS
============================================================ */
function el(tag, attrs={}, children=[]){
  const e = document.createElement(tag);

  Object.entries(attrs).forEach(([k,v])=>{
    if(k==="className") e.className=v;
    else if(k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k,v);
  });

  [].concat(children).forEach(c=>{
    if(typeof c==="string") e.appendChild(document.createTextNode(c));
    else if(c) e.appendChild(c);
  });

  return e;
}

/* ============================================================
   RENDER
============================================================ */
function render(){
  const root = document.getElementById("org");
  root.innerHTML = "";

  const org = loadOrg();

  atualizarTitulos();

  const grid = el("div",{className:"grid-refs"});

  ["interna","externa","apoio"].forEach(ref=>{
    const card = el("div",{className:"card"},[
      el("h3",{},ref.toUpperCase())
    ]);

    org[ref].equipes.forEach(eq=>{
      card.appendChild(
        el("div",{className:"team-line"},[
          eq.nome
        ])
      );
    });

    grid.appendChild(card);
  });

  root.appendChild(grid);
}

/* ============================================================
   EXPORT / IMPORT EXEMPLO
============================================================ */
function baixarJSONEquipes(){
  const json = JSON.stringify(loadOrg(),null,2);
  const blob = new Blob([json],{type:"application/json"});

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "Equipes.json";
  a.click();
}

/* ============================================================
   INIT
============================================================ */
function bindUI(){
  document.getElementById("btn-add-equipe")
    ?.addEventListener("click", ()=>{
      const nome = document.getElementById("eq-nome").value;
      upsertEquipe("interna", nome);
      render();
    });

  document.getElementById("btn-export-json")
    ?.addEventListener("click", baixarJSONEquipes);
}

function initApp(){
  bindUI();
  render();
}

/* ============================================================
   START APP
============================================================ */
document.addEventListener("DOMContentLoaded", ()=>{
  initApp();
});
