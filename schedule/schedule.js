let offset = 0;
let atividadeAtual = null;   
let isPrinting = false; 
const LIST_KEY  = "Programação";
const HIST_KEY  = "historicos";
const EVANG_KEY = "evangelizacao";
const EVANG_DEFAULT = "Movimento Tremembé";

async function sincronizarHora() {
    try {
        const response = await fetch("https://fmyxypykokxfeojmdsuu.supabase.co/functions/v1/hora-certa");
        const data = await response.json();
        offset = data.timestamp - Date.now();
        const statusEl = document.getElementById("status");
        if (statusEl) statusEl.innerHTML = "✅ Sincronizado";
    } catch(err){
        const statusEl = document.getElementById("status");
        if (statusEl) statusEl.innerHTML = "❌ " + err.message;
    }
}

function getHoraAtual() {
    return Date.now() + offset;
}

function atualizarRelogio() {
    const agora = new Date(getHoraAtual());
    const hh = String(agora.getHours()).padStart(2,"0");
    const mm = String(agora.getMinutes()).padStart(2,"0");
    const ss = String(agora.getSeconds()).padStart(2,"0");
    const ms = String(agora.getMilliseconds()).padStart(3,"0");

    const horaEl = document.getElementById("hora");
    const msEl = document.getElementById("ms");

    if (horaEl) horaEl.innerHTML = `${hh}:${mm}:${ss}`;
    if (msEl) msEl.innerHTML = ms;
}

sincronizarHora();
setInterval(sincronizarHora, 60000);
setInterval(atualizarRelogio, 50);

function diaDaSemanaPorData(dataString) {
  const diasSemana = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
  const dataObj = new Date(dataString + "T00:00:00"); 
  return diasSemana[dataObj.getDay()];
}

function getEvangelizacao() {
  try {
    const v = localStorage.getItem(EVANG_KEY);
    return (v || "").trim() || EVANG_DEFAULT;
  } catch {
    return EVANG_DEFAULT;
  }
}

function setEvangelizacao(valor) {
  try {
    localStorage.setItem(EVANG_KEY, (valor || "").trim());
  } catch(e) {
    console.error("Erro salvando evangelização", e);
  }
}

function getTituloProgramacao() {
  return `Programação ${getEvangelizacao()}`;
}

function atualizarTitulos() {
  const h1 = document.getElementById("titulo-web");
  if (h1) h1.textContent = getTituloProgramacao();
  document.title = getTituloProgramacao();
}

function alterarEvangelizacao(e) {
  e?.preventDefault();
  const input = document.getElementById("evangelizacao");
  const novoValor = input.value.trim();
  setEvangelizacao(novoValor);
  atualizarTitulos();
  renderizarLista();
}

function dois(n){ return n.toString().padStart(2,'0'); }

function parseDateTime(data, hora) {
  if (!data || !hora) return null;
  return new Date(`${data}T${hora}:00`).getTime();
}

function getTempoRestante(data, inicio, fim) {
  if (!data || !inicio || !fim) return "";
  const agora = getHoraAtual();
  const inicioDate = parseDateTime(data, inicio);
  const fimDate = parseDateTime(data, fim);

  if (!inicioDate || !fimDate) return "";

  if (agora < inicioDate) {
    const diff = inicioDate - agora;
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff / (1000 * 60)) % 60);
    const s = Math.floor((diff / 1000) % 60);
    if (h > 0) return `⏳ Inicia em ${h}h ${m}min ${s}seg`;
    if (m > 0) return `⏳ Inicia em ${m}min ${s}seg`;
    return `⏳ Inicia em ${s}seg`;
  }

  if (agora >= inicioDate && agora <= fimDate) {
    const diff = fimDate - agora;
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff / (1000 * 60)) % 60);
    const s = Math.floor((diff / 1000) % 60);
    if (h > 0) return `🔥 ${h}h ${m}min ${s}seg restantes`;
    if (m > 0) return `🔥 ${m}min ${s}seg restantes`;
    return `🔥 ${s}seg restantes`;
  }

  return `✅ Encerrado`;
}

function getStatusAtividade(data, inicio, fim) {
  const inicioDate = parseDateTime(data, inicio);
  const fimDate = parseDateTime(data, fim);
  if (!inicioDate || !fimDate) return "futuro";
  const agora = getHoraAtual();
  if (agora >= inicioDate && agora <= fimDate) return "em-andamento";
  if (agora > fimDate) return "encerrado";
  return "futuro";
}

function marcarProximaAtividade(lista) {
  const agora = getHoraAtual();
  let proximaIndex = -1;
  let menorDiff = Infinity;
  lista.forEach((p, i) => {
    const inicio = parseDateTime(p.data, p.inicio);
    if (!inicio) return;
    if (inicio > agora && (inicio - agora) < menorDiff) {
      menorDiff = inicio - agora;
      proximaIndex = i;
    }
  });
  return proximaIndex;
}

function salvarLista(lista){
  try{
    localStorage.setItem(LIST_KEY, JSON.stringify(lista || []));
  }catch(e){
    alert("Não foi possível salvar localmente.");
  }
}

function carregarLista(){
  try {
    const lista = localStorage.getItem(LIST_KEY);
    const dados = lista ? JSON.parse(lista) : [];
    dados.forEach(item => {
      if (item.obs === undefined) item.obs = "";
      if (!item.id) item.id = `id_${Date.now()}_${Math.random()}`;
    });
    return dados;
  } catch(e){
    return [];
  }
}

function ordenarLista(lista) {
  lista.sort((a, b) => {
    const dateA = new Date(`${a.data}T${a.inicio}:00`).getTime();
    const dateB = new Date(`${b.data}T${b.inicio}:00`).getTime();
    return dateA - dateB;
  });
  return lista;
}

function el(tag, attrs={}, children=[]) {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v])=>{
    if (k === "className") e.className = v;
    else if (k.startsWith("on") && typeof v === "function") e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  });
  (Array.isArray(children) ? children : [children]).forEach(c=>{
    if (typeof c === "string") e.appendChild(document.createTextNode(c));
    else if (c) e.appendChild(c);
  });
  return e;
}

function getDuracao(inicio, fim) {
  if (!inicio || !fim) return "";
  const i = new Date(`1970-01-01T${inicio}:00`).getTime();
  const f = new Date(`1970-01-01T${fim}:00`).getTime();
  const diff = f - i;
  if (diff <= 0) return "";
  const h = Math.floor(diff / (1000 * 60 * 60));
  const m = Math.floor((diff / (1000 * 60)) % 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}mim`;
}

function buildInfo(p) {
  const duracao = getDuracao(p.inicio, p.fim);
  let texto = `[${p.inicio} – ${p.fim}`;
  if (duracao) texto += ` (Total: ${duracao})`;
  texto += `]`;
  if (p.tipo) texto += ` ${p.tipo}`;
  if (p.nome?.trim()) texto += `: ${p.nome.trim()}`;
  if (p.servo?.trim()) texto += ` (${p.servo.trim()})`;
  return texto;
}

function getProgresso(data, inicio, fim){
  const hoje = new Date(getHoraAtual()).toISOString().split("T")[0];
  if (data !== hoje) return 0;
  const agora = getHoraAtual();
  const i = parseDateTime(data, inicio);
  const f = parseDateTime(data, fim);
  if (!i || !f || agora < i) return 0;
  if (agora > f) return 100;
  return Math.floor(((agora - i) / (f - i)) * 100);
}

function renderizarLista() {
  const listaDiv = document.getElementById("lista");
  if (!listaDiv) return;
  listaDiv.innerHTML = "";

  const lista = ordenarLista(carregarLista());
  const proximaIndex = marcarProximaAtividade(lista);
  const grupos = {};
  
  lista.forEach(p => {
    if (!grupos[p.data]) grupos[p.data] = [];
    grupos[p.data].push(p);
  });

  Object.keys(grupos).sort().forEach(data => {
    const atividadesDoDia = grupos[data];
    const containerDia = el("section", { className: "pagina-detalhe" });
    const dataBr = data.split("-").reverse().join("/");
    const diaSemana = diaDaSemanaPorData(data);

    containerDia.appendChild(el("h2", { className: "print-only" }, getTituloProgramacao()));
    containerDia.appendChild(el("h3", {}, `${diaSemana} - ${dataBr}`));

    const ul = el("ul", { className: "lista-atividades" });

    atividadesDoDia.forEach(p => {
      const idxReal = lista.findIndex(item => item.id === p.id);
      const status = getStatusAtividade(p.data, p.inicio, p.fim);
      const isProxima = (idxReal === proximaIndex);

      const li = el("li", {
        className: `item ${status} ${isProxima ? "proxima" : ""} ${p.destaque ? "destaque" : ""}`
      });

      if ((p.obs || "").trim()) {
        const iconObs = el("span", { className: "icon-obs" }, "💬");
        iconObs.setAttribute("title", p.obs);
        iconObs.addEventListener("click", () => editarObservacao(p.id));
        li.appendChild(iconObs);
      }

      let texto = buildInfo(p);
      const timer = getTempoRestante(p.data, p.inicio, p.fim);
      if (!isPrinting && timer) {
        if (timer.startsWith("🔥") || timer.startsWith("✅") || (isProxima && timer.startsWith("⏳"))) {
          texto += ` • ${timer}`;
        }
      }

      li.appendChild(el("div", { className: "item-info" }, texto));

      if (status === "em-andamento") {
        const progresso = getProgresso(p.data, p.inicio, p.fim);
        let classeBarra = "progress-bar ativo";
        let classeItemExtra = "ativo";
        const fimDate = parseDateTime(p.data, p.fim);
        const minutosRestantes = (fimDate - getHoraAtual()) / (1000 * 60);

        if (minutosRestantes <= 5) {
          classeBarra = "progress-bar danger";
          classeItemExtra = "danger";
        } else if (minutosRestantes <= 10) {
          classeBarra = "progress-bar warning";
          classeItemExtra = "warning";
        }

        const barraContainer = el("div", { className: "progress-container" });
        barraContainer.appendChild(el("div", { className: classeBarra, style: `width: ${progresso}%` }));
        li.appendChild(barraContainer);
        li.classList.add(classeItemExtra);
      }

      const bEdit = el("button", { className: "edit" }, "Editar");
      bEdit.addEventListener("click", () => editarAtividade(p.id));
      const bDelete = el("button", { className: "delete" }, "Excluir");
      bDelete.addEventListener("click", () => excluirAtividade(p.id));
      const bClone = el("button", { className: "clone" }, "Clonar");
      bClone.addEventListener("click", () => clonarAtividade(p.id));

      li.appendChild(el("div", { className: "item-botoes" }, [bEdit, bDelete, bClone]));
      ul.appendChild(li);
    });

    containerDia.appendChild(ul);
    listaDiv.appendChild(containerDia);
  });
}

function adicionarAtividade(){
  const data  = document.getElementById("data").value;
  const tipo  = document.getElementById("tipo").value;
  const nome  = document.getElementById("nome").value.trim();
  const servo = document.getElementById("servo").value.trim();
  const inicio = document.getElementById("inicio").value;
  const fim    = document.getElementById("fim").value;

  if(!data || !inicio || !fim){
    alert("Preencha a data e horários!");
    return;
  }

  const lista = carregarLista();
  lista.push({
    id: `id_${Date.now()}_${Math.random()}`,
    dia: diaDaSemanaPorData(data),
    data, tipo, nome, servo, inicio, fim,
    destaque: false,
    obs: ""
  });

  salvarLista(lista);
  renderizarLista();
}

function editarObservacao(id){
  const lista = carregarLista();
  const index = lista.findIndex(item => item.id === id);
  if (index === -1) return;
  const nova = prompt("Observação:", lista[index].obs || "");
  if (nova === null) return;
  lista[index].obs = nova.trim();
  lista[index].destaque = lista[index].obs.length > 0;
  salvarLista(lista);
  renderizarLista();
}

function editarAtividade(id){
  const lista = carregarLista();
  const index = lista.findIndex(item => item.id === id);
  if (index === -1) return;
  const p = lista[index];

  const novoInicio = prompt("Hora início:", p.inicio);
  if (novoInicio === null) return;
  const novoFim = prompt("Hora fim:", p.fim);
  if (novoFim === null) return;

  lista[index] = { ...p, inicio: novoInicio, fim: novoFim };
  salvarLista(lista);
  renderizarLista();
}

function excluirAtividade(id){
  if(!confirm("Deseja realmente excluir esta atividade?")) return;
  salvarLista(carregarLista().filter(item => item.id !== id));
  renderizarLista();
}

function clonarAtividade(id){
  const lista = carregarLista();
  const original = lista.find(item => item.id === id);
  if (!original) return;
  lista.push({ ...original, id: `id_${Date.now()}_${Math.random()}` });
  salvarLista(lista);
  renderizarLista();
}

function exportarBackup(){
  const data = { version: 1, current: { evangelizacao: getEvangelizacao(), lista: carregarLista() } };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Programacao_backup.json";
  a.click();
  URL.revokeObjectURL(url);
}

function handleImportFile(file){
  if(!file) return;
  const fr = new FileReader();
  fr.onload = () => {
    try{
      const obj = JSON.parse(fr.result);
      if(obj?.current?.lista){
        salvarLista(obj.current.lista);
        setEvangelizacao(obj.current.evangelizacao || EVANG_DEFAULT);
        atualizarTitulos();
        renderizarLista();
        alert("Backup importado com sucesso.");
      }
    }catch(e){ alert("Erro ao importar."); }
  };
  fr.readAsText(file);
}

function zerarTudo(){
  if (!confirm("Tem certeza que deseja EXCLUIR essa PROGRAMAÇÃO?")) return;
  localStorage.removeItem(LIST_KEY);
  localStorage.removeItem(HIST_KEY);
  atualizarTitulos();
  renderizarLista();
}

function baixarPDF() {
  window.print();
}

function escolherAtualizacaoJSON() {
  alert("Função de atualização remota via JSON ativada.");
}

let intervalGlobal = null;
function iniciarLoops() {
  if (intervalGlobal) return;
  intervalGlobal = setInterval(renderizarLista, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.add')?.addEventListener('click', adicionarAtividade);
  document.querySelector('.menu-rodape-content')?.addEventListener('submit', alterarEvangelizacao);
  document.getElementById('btn-zerar-tudo')?.addEventListener('click', zerarTudo);
  document.getElementById('btn-export')?.addEventListener('click', exportarBackup);
  document.getElementById('btn-import-local')?.addEventListener('click', () => document.getElementById('importar-arquivo').click());
  document.getElementById('importar-arquivo')?.addEventListener('change', (e) => handleImportFile(e.target.files[0]));
  document.getElementById('btn-pdf')?.addEventListener('click', baixarPDF);
  document.getElementById('btn-pdf-mobile')?.addEventListener('click', baixarPDF);
  document.getElementById('btn-atualizar')?.addEventListener('click', escolherAtualizacaoJSON);
  document.getElementById('btn-atualizar-mobile')?.addEventListener('click', escolherAtualizacaoJSON);

  const toggleBtn = document.getElementById('toggle-menu-adicao');
  const menuAdicao = document.getElementById('menu-adicao');
  if (toggleBtn && menuAdicao) {
    toggleBtn.addEventListener('click', () => {
      menuAdicao.classList.toggle('collapsed');
      toggleBtn.textContent = menuAdicao.classList.contains('collapsed') ? '+' : '-';
    });
  }

  const ev = getEvangelizacao();
  const input = document.getElementById("evangelizacao");
  if (input) input.value = (ev === EVANG_DEFAULT ? "" : ev);

  atualizarTitulos();
  renderizarLista();
  iniciarLoops();
});
