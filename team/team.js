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
   CHAVES
============================================================ */
var TITLE_KEY = "Equipes_titulo";
var TITLE_DEFAULT = "Equipes Movimento Tremembé";
var ORG_KEY = "Equipes_dados_v2";

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
  try {
    var v = (localStorage.getItem(TITLE_KEY) || "").trim();
    return v || TITLE_DEFAULT;
  } catch { return TITLE_DEFAULT; }
}

function setTitulo(v){
  try { localStorage.setItem(TITLE_KEY, (v||"").trim()); } catch {}
}

function getTituloFormatado(){
  var base = getTitulo();
  base = (base || "").trim();
  var nome = base && base !== TITLE_DEFAULT ? base : "Movimento Tremembé";
  return "Equipes " + nome;
}

function atualizarTitulos(){
  var h1 = document.getElementById("titulo-web");
  var tituloFmt = getTituloFormatado();
  if (h1) h1.textContent = tituloFmt;
  document.title = tituloFmt;
}

/* ============================================================
   STORAGE
============================================================ */
function normalizeModel(m){
  if (!m || typeof m !== "object") return defaultModel();

  ["interna","externa","apoio"].forEach(function(k){
    if (!m[k]) m[k] = { responsaveis: [], equipes: [] };
    if (!Array.isArray(m[k].responsaveis)) m[k].responsaveis = [];
    if (!Array.isArray(m[k].equipes)) m[k].equipes = [];
  });

  return m;
}

function loadOrg(){
  try{
    var raw = localStorage.getItem(ORG_KEY);
    if (!raw) return defaultModel();
    return normalizeModel(JSON.parse(raw));
  }catch{
    return defaultModel();
  }
}

function saveOrg(m){
  try{
    localStorage.setItem(ORG_KEY, JSON.stringify(normalizeModel(m)));
  }catch{
    alert("Erro ao salvar.");
  }
}

/* ============================================================
   HELPERS
============================================================ */
function sortByNamePT(a,b){
  return String(a||"").localeCompare(String(b||""),"pt-BR",{sensitivity:"base"});
}

function findEquipe(arr, nome){
  var n = (nome||"").toLowerCase();
  return (arr||[]).find(e => (e.nome||"").toLowerCase() === n);
}

/* ============================================================
   CORE
============================================================ */
function upsertEquipe(refKey, nomeEquipe, pessoa, marcarRef){
  var org = loadOrg();
  var list = org[refKey].equipes;
  var eq = findEquipe(list, nomeEquipe);

  if (!eq){
    eq = { nome: nomeEquipe, pessoas: [], referencia: null };
    list.push(eq);
    list.sort((a,b)=>sortByNamePT(a.nome,b.nome));
  }

  if (pessoa){
    if (!eq.pessoas.some(p=>p.nome===pessoa)){
      eq.pessoas.push({ nome:pessoa, confirmado:null });
    }
    if (marcarRef) eq.referencia = pessoa;
  }

  saveOrg(org);
}

/* ============================================================
   ELEMENT HELPER
============================================================ */
function el(tag, attrs={}, children=[]){
  const e = document.createElement(tag);

  Object.entries(attrs).forEach(([k,v])=>{
    if(k==="className") e.className=v;
    else if(k.startsWith("on") && typeof v==="function"){
      e.addEventListener(k.slice(2), v);
    } else e.setAttribute(k,v);
  });

  ([].concat(children)).forEach(c=>{
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
  if (!root) return;
  root.innerHTML = "";

  const org = loadOrg();
  atualizarTitulos();

  const grid = el("div",{className:"grid-refs"});

  ["interna","externa","apoio"].forEach(ref=>{
    const area = org[ref];

    const card = el("div",{className:"card"},[
      el("h3",{},ref.toUpperCase())
    ]);

    if (!area.equipes.length){
      card.appendChild(el("p",{style:"opacity:.6"},"Sem equipes"));
    }

    area.equipes
      .slice()
      .sort((a,b)=>sortByNamePT(a.nome,b.nome))
      .forEach(eq=>{
        card.appendChild(
          el("div",{className:"team-line"},eq.nome)
        );
      });

    grid.appendChild(card);
  });

  root.appendChild(grid);
}

/* ============================================================
   EXPORT
============================================================ */
function baixarJSONEquipes(){
  const json = JSON.stringify(loadOrg(),null,2);

  const blob = new Blob([json],{type:"application/json"});
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "equipes.json";
  a.click();

  URL.revokeObjectURL(url);
}

/* ============================================================
   BIND UI
============================================================ */
function bindUI(){
  const btnAdd = document.getElementById("btn-add-equipe");
  const btnExport = document.getElementById("btn-export-json");

  if(btnAdd){
    btnAdd.addEventListener("click",()=>{
      const nome = document.getElementById("eq-nome")?.value?.trim();
      const pessoa = document.getElementById("eq-pessoa")?.value?.trim();
      const ref = document.getElementById("eq-ref")?.value || "interna";
      const marcarRef = document.getElementById("eq-marcar-ref")?.checked;

      if(!nome) return;

      upsertEquipe(ref,nome,pessoa,marcarRef);

      document.getElementById("eq-pessoa").value="";
      render();
    });
  }

  if(btnExport){
    btnExport.addEventListener("click",baixarJSONEquipes);
  }
}

/* ============================================================
   INIT
============================================================ */
function initApp(){
  bindUI();
  render();
}

document.addEventListener("DOMContentLoaded", ()=>{
  initApp();
});

/* ============================================================
   🔥 FIX GLOBAL
============================================================ */
window.render = render;
window.loadOrg = loadOrg;
window.saveOrg = saveOrg;
window.baixarJSONEquipes = baixarJSONEquipes;
window.escolherAtualizacaoJSON = escolherAtualizacaoJSON || function(){};
