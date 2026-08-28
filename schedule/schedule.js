<script>
let atividadeAtual = null;	
let isPrinting = false; // 👈 ADICIONE AQUI
const tiposAtividade = ["Chegada","Introdução","Institucional","Encerramento", "Adoração", "Acolhida", "Animação", "Almoço", "Café", "Dinâmica", "Efusão", "Jantar", "Teatro", "Momento", "Historinha", "Monólogo", "Oração", "Pausa", "Intervalo", "Palestra", "Partilha", "Pregação", "Testemunho", "Santa Missa"];
const dias = ["Segunda","Terça","Quarta","Quinta","Sexta","Sábado","Domingo"];
const LIST_KEY  = "Programação";
const HIST_KEY  = "historicos";
const EVANG_KEY = "evangelizacao";
const EVANG_DEFAULT = "Movimento Tremembé";

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

function getTempoRestante(data, inicio, fim) {

  if (!data || !inicio || !fim) return "";

  const agora = Date.now();

  const inicioDate = parseDateTime(data, inicio);
  const fimDate = parseDateTime(data, fim);

  if (!inicioDate || !fimDate) return "";

  // ✅ não depende de comparar string de data
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

function isDataValida(data, hora) {
  return !isNaN(new Date(`${data}T${hora}:00`).getTime());
}

function parseDateTime(data, hora) {
  if (!data || !hora) return null;
  return new Date(`${data}T${hora}:00`);
}
	function getStatusAtividade(data, inicio, fim) {

  const inicioDate = parseDateTime(data, inicio);
  const fimDate = parseDateTime(data, fim);

  if (!inicioDate || !fimDate) {
    return "futuro"; // ✅ fallback seguro
  }

  const agora = Date.now();

  if (agora >= inicioDate && agora <= fimDate) {
    return "em-andamento";
  }

  if (agora > fimDate) {
    return "encerrado";
  }

  return "futuro"; // ✅ sempre retorna algo
}

function marcarProximaAtividade(lista) {

  const agora = Date.now();

  let proximaIndex = -1;
  let menorDiff = Infinity;

  lista.forEach((p, i) => {

    const inicio = parseDateTime(p.data, p.inicio);

    // 🔴 ignora dados inválidos
    if (!inicio) return;

    if (inicio > agora && (inicio - agora) < menorDiff) {
      menorDiff = inicio - agora;
      proximaIndex = i;
    }
  });

  return proximaIndex;
}
	
function dataHoje(){
  const d = new Date();
  return `${d.getFullYear()}-${dois(d.getMonth()+1)}-${dois(d.getDate())}`;
}

function abrir(fim, inicio, titulo){
  const link =
    "https://relogioonline.com.br/temporizador/#date=" +
    dataHoje() + "T" + fim + ":00" +
    "&title=" + encodeURIComponent(titulo) +
    "&loop=0";
  window.open(link, "_blank");
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

      // ✅ garante observação
      if (item.obs === undefined) {
        item.obs = "";
      }

      // ✅ garante ID (ESSENCIAL)
      if (!item.id) {
        item.id = `id_${Date.now()}_${Math.random()}`;
      }

    });

    return dados;

  } catch(e){
    console.error(e);
    return [];
  }
}

function ordenarLista(lista) {

  lista.sort((a, b) => {

    const dateA = new Date(`${a.data}T${a.inicio}:00`);
    const dateB = new Date(`${b.data}T${b.inicio}:00`);

    return dateA - dateB;
  });

  return lista;
}
	
function el(tag, attrs={}, children=[]) {
  const e = document.createElement(tag);

  Object.entries(attrs).forEach(([k,v])=>{
	if (k === "className") e.className = v;
	else if (k.startsWith("on") && typeof v === "function")
	  e.addEventListener(k.slice(2), v);
	else
	  e.setAttribute(k, v);
  });

  (Array.isArray(children) ? children : [children]).forEach(c=>{
	if (typeof c === "string") e.appendChild(document.createTextNode(c));
	else if (c) e.appendChild(c);
  });

  return e;
}

function getDuracao(inicio, fim) {

  if (!inicio || !fim) return "";

  const i = new Date(`1970-01-01T${inicio}:00`);
  const f = new Date(`1970-01-01T${fim}:00`);
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

  if (duracao) {
    texto += ` (Total: ${duracao})`;
  }

  texto += `]`;

  if (p.tipo) {
    texto += ` ${p.tipo}`;
  }

  if (p.nome?.trim()) {
    texto += `: ${p.nome.trim()}`;
  }

  if (p.servo?.trim()) {
    texto += ` (${p.servo.trim()})`;
  }

  return texto;
}

function scrollParaAtividade() {

  const atual = document.querySelector("#atividade-atual");

  if (atual) {
    atual.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
    return;
  }

  const proxima = document.querySelector("#proxima-atividade");

  if (proxima) {
    proxima.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }
}
	
function getProgresso(data, inicio, fim){

  const hoje = new Date().toISOString().split("T")[0];

  // ❌ não é hoje → sem progresso
  if (data !== hoje) return 0;

  const agora = Date.now();

  const i = parseDateTime(data, inicio);
  const f = parseDateTime(data, fim);

  // 🔴 segurança: dados inválidos
  if (!i || !f) return 0;

  if (agora < i) return 0;
  if (agora > f) return 100;

  return Math.floor(((agora - i) / (f - i)) * 100);
}
/*
function renderizarLista() {

  const listaDiv = document.getElementById("lista");
  listaDiv.innerHTML = "";

  const lista = ordenarLista(carregarLista());
  const proximaIndex = marcarProximaAtividade(lista);

  const grupos = {};

  lista.forEach(p => {
    if (!grupos[p.data]) grupos[p.data] = [];
    grupos[p.data].push(p);
  });

  const datasOrdenadas = Object.keys(grupos).sort();

  datasOrdenadas.forEach(data => {

    const atividadesDoDia = grupos[data];

    const containerDia = el("section", {
      className: "pagina-detalhe"
    });

    const dataBr = data.split("-").reverse().join("/");
    const diaSemana = diaDaSemanaPorData(data);

    const h2Titulo = el("h2", { className: "print-only" }, getTituloProgramacao());
    const hDia = el("h3", {}, `${diaSemana} - ${dataBr}`);

    containerDia.appendChild(h2Titulo);
    containerDia.appendChild(hDia);

    const ul = el("ul", { className: "lista-atividades" });

    atividadesDoDia.forEach(p => {

      const idxReal = lista.indexOf(p);

      const status = getStatusAtividade(p.data, p.inicio, p.fim);
      const isProxima = (idxReal === proximaIndex);

      const li = el("li", {
        className: `
          item 
          ${status} 
          ${isProxima ? "proxima" : ""}
          ${p.destaque ? "destaque" : ""}
        `
      });

// ✅ MARCA PARA SCROLL
if (status === "em-andamento") {
  li.setAttribute("id", "atividade-atual");
}
else if (isProxima) {
  li.setAttribute("id", "proxima-atividade");
}

      // 💬 Observação
      const temObs = (p.obs || "").trim().length > 0;

      if (temObs) {
        const iconObs = el("span", { className: "icon-obs" }, "💬");

        iconObs.addEventListener("click", () => editarObservacao(idxReal));
        iconObs.setAttribute("title", p.obs);

        li.appendChild(iconObs);
      }

      // ✅ TEXTO BASE
      let texto = buildInfo(p);

      // ✅ TIMER CONTROLADO
      const timer = getTempoRestante(
        p.data,
        p.inicio,
        p.fim
      );

      if (!isPrinting && timer) {

        // 🔵 EM ANDAMENTO
        if (timer.startsWith("🔥")) {
          texto += ` • ${timer}`;
        }

        // ✅ ENCERRADO
        else if (timer.startsWith("✅")) {
          texto += ` • ${timer}`;
        }

        // 🌟 PRÓXIMA
        else if (isProxima && timer.startsWith("⏳")) {
          texto += ` • ${timer}`;
        }
      }

      const divInfo = el(
        "div",
        { className: "item-info" },
        texto
      );

const bEdit = el("button", { className: "edit" }, "Editar");
bEdit.addEventListener("click", () => editarAtividade(p.id));

const bDelete = el("button", { className: "delete" }, "Excluir");
bDelete.addEventListener("click", () => excluirAtividade(p.id));

const bClone = el("button", { className: "clone" }, "Clonar");
bClone.addEventListener("click", () => clonarAtividade(p.id));

const divBtns = el(
  "div",
  { className: "item-botoes" },
  [bEdit, bDelete, bClone]
);

li.appendChild(divInfo);

// ✅ PROGRESSO
const progresso = getProgresso(p.data, p.inicio, p.fim);

if (status === "em-andamento") {

  const barraContainer = el("div", {
    className: "progress-container"
  });


let classeBarra = "progress-bar ativo";
let classeItemExtra = "";


  const fimDate = parseDateTime(p.data, p.fim);
  const agora = Date.now();
  const diff = fimDate - agora;

  const minutosRestantes = diff / (1000 * 60);

  if (minutosRestantes <= 5) {
    classeBarra = "progress-bar danger";
  }
  else if (minutosRestantes <= 10) {
    classeBarra = "progress-bar warning";
  }

  const barra = el("div", {
    className: classeBarra,
    style: `width: ${progresso}%`
  });

  barraContainer.appendChild(barra);
  li.appendChild(barraContainer);
}

// ✅ botões continuam depois
li.appendChild(divBtns);

      ul.appendChild(li);

    });

    containerDia.appendChild(ul);
    listaDiv.appendChild(containerDia);

  });

}
*/

function renderizarLista() {

  const listaDiv = document.getElementById("lista");
  listaDiv.innerHTML = "";

  const lista = ordenarLista(carregarLista());
  const proximaIndex = marcarProximaAtividade(lista);

  const grupos = {};

  lista.forEach(p => {
    if (!grupos[p.data]) grupos[p.data] = [];
    grupos[p.data].push(p);
  });

  const datasOrdenadas = Object.keys(grupos).sort();

  datasOrdenadas.forEach(data => {

    const atividadesDoDia = grupos[data];

    const containerDia = el("section", {
      className: "pagina-detalhe"
    });

    const dataBr = data.split("-").reverse().join("/");
    const diaSemana = diaDaSemanaPorData(data);

    const h2Titulo = el("h2", { className: "print-only" }, getTituloProgramacao());
    const hDia = el("h3", {}, `${diaSemana} - ${dataBr}`);

    containerDia.appendChild(h2Titulo);
    containerDia.appendChild(hDia);

    const ul = el("ul", { className: "lista-atividades" });

    atividadesDoDia.forEach(p => {

      const idxReal = lista.findIndex(item => item.id === p.id);
      const status = getStatusAtividade(p.data, p.inicio, p.fim);
      const isProxima = (idxReal === proximaIndex);

      const li = el("li", {
        className: `
          item 
          ${status} 
          ${isProxima ? "proxima" : ""}
          ${p.destaque ? "destaque" : ""}
        `
      });

      // 💬 OBS
      if ((p.obs || "").trim()) {
        const iconObs = el("span", { className: "icon-obs" }, "💬");
        iconObs.setAttribute("title", p.obs);
        iconObs.addEventListener("click", () => editarObservacao(p.id));
        li.appendChild(iconObs);
      }

      // ✅ TEXTO BASE
      let texto = buildInfo(p);

      const timer = getTempoRestante(p.data, p.inicio, p.fim);

      if (!isPrinting && timer) {

        if (timer.startsWith("🔥")) {
          texto += ` • ${timer}`;
        }
        else if (timer.startsWith("✅")) {
          texto += ` • ${timer}`;
        }
        else if (isProxima && timer.startsWith("⏳")) {
          texto += ` • ${timer}`;
        }
      }

      const divInfo = el("div", {
        className: "item-info"
      }, texto);

      li.appendChild(divInfo);

      // ✅ ===== PROGRESSO + COR DINÂMICA =====
      if (status === "em-andamento") {

        const progresso = getProgresso(p.data, p.inicio, p.fim);

        let classeBarra = "progress-bar ativo";
        let classeItemExtra = "ativo";

        const fimDate = parseDateTime(p.data, p.fim);
        const agora = Date.now();
        const minutosRestantes = (fimDate - agora) / (1000 * 60);

        if (minutosRestantes <= 5) {
          classeBarra = "progress-bar danger";
          classeItemExtra = "danger";
        }
        else if (minutosRestantes <= 10) {
          classeBarra = "progress-bar warning";
          classeItemExtra = "warning";
        }

        const barraContainer = el("div", {
          className: "progress-container"
        });

        const barra = el("div", {
          className: classeBarra,
          style: `width: ${progresso}%`
        });

        barraContainer.appendChild(barra);
        li.appendChild(barraContainer);

        // ✅ sincroniza borda lateral
        li.classList.add(classeItemExtra);
      }

      // ✅ BOTÕES (PADRÃO CORRETO COM ID)
      const bEdit = el("button", { className: "edit" }, "Editar");
      bEdit.addEventListener("click", () => editarAtividade(p.id));

      const bDelete = el("button", { className: "delete" }, "Excluir");
      bDelete.addEventListener("click", () => excluirAtividade(p.id));

      const bClone = el("button", { className: "clone" }, "Clonar");
      bClone.addEventListener("click", () => clonarAtividade(p.id));

      const divBtns = el("div", {
        className: "item-botoes"
      }, [bEdit, bDelete, bClone]);

      li.appendChild(divBtns);

      ul.appendChild(li);

    });

    containerDia.appendChild(ul);
    listaDiv.appendChild(containerDia);

  });

}	


function adicionarAtividade(){

  const data  = document.getElementById("data").value;
  const dia   = diaDaSemanaPorData(data);
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
    id: `id_${Date.now()}_${Math.random()}`, // ✅ ID único
    dia,
    data,
    tipo,
    nome,
    servo,
    inicio,
    fim,
    destaque: false,
    obs: ""
  });

  salvarLista(lista);
  renderizarLista();
}

function editarObservacao(index){

  const lista = carregarLista();

  const atual = lista[index].obs || "";

  const nova = prompt("Observação:", atual);

  if (nova === null) return;

  const texto = nova.trim();

  lista[index].obs = texto;

  lista[index].destaque = texto.length > 0;

  salvarLista(lista);
  renderizarLista();
}
	
function toggleDestaque(index){
  const lista = carregarLista();

  lista[index].destaque = !lista[index].destaque;

  salvarLista(lista);
  renderizarLista();
}
	
let intervalTimers = null;
let intervalProgresso = null;
let intervalGlobal = null;


function pararLoops() {

  if (!intervalGlobal) {
    return;
  }

  clearInterval(intervalGlobal);
  intervalGlobal = null;

}

function editarAtividade(id){

  const lista = carregarLista();

  const index = lista.findIndex(item => item.id === id);
  if (index === -1) {
    alert("Erro: atividade não encontrada");
    return;
  }

  const p = lista[index];

  const dataBrAtual = isoParaBr(p.data);

  const entradaDataBr = prompt("Editar data (DD/MM/AAAA):", dataBrAtual);
  if (entradaDataBr === null) return;

  const novaDataIso = brParaIso(entradaDataBr);
  if (!novaDataIso) {
    alert("Data inválida.");
    return;
  }

  const novoTipo = prompt("Tipo da atividade:", p.tipo || "");
  if (novoTipo === null) return;

  const novoNome = prompt("Nome da Atividade:", p.nome || "");
  if (novoNome === null) return;

  const novoServo = prompt("Servo:", p.servo || "");
  if (novoServo === null) return;

  const novoInicio = prompt("Hora início:", p.inicio);
  if (novoInicio === null) return;

  const novoFim = prompt("Hora fim:", p.fim);
  if (novoFim === null) return;

  const novaObs = prompt("Observação:", p.obs || "");
  if (novaObs === null) return;

  const textoObs = novaObs.trim();

  lista[index] = {
    ...p,
    dia: diaDaSemanaPorData(novaDataIso),
    data: novaDataIso,
    tipo: novoTipo,
    nome: novoNome.trim(),
    servo: novoServo.trim(),
    inicio: novoInicio,
    fim: novoFim,
    obs: textoObs,
    destaque: textoObs.length > 0
  };

  salvarLista(lista);
  renderizarLista();
}


function excluirAtividade(id){

  if(!confirm("Deseja realmente excluir esta atividade?")) return;

  const lista = carregarLista();

  const novaLista = lista.filter(item => item.id !== id);

  salvarLista(novaLista);
  renderizarLista();
}

function clonarAtividade(id){

  const lista = carregarLista();

  const index = lista.findIndex(item => item.id === id);
  if (index === -1) {
    alert("Erro ao clonar");
    return;
  }

  const original = lista[index];

  const novoItem = {
    ...original,
    id: `id_${Date.now()}_${Math.random()}` // ✅ novo ID
  };

  lista.push(novoItem);

  salvarLista(lista);
  renderizarLista();
}

function isoParaBr(iso) {
  if (!iso) return "";
  const [yyyy, mm, dd] = iso.split("-");
  if (!yyyy || !mm || !dd) return iso;
  return `${dd}/${mm}/${yyyy}`;
}

function brParaIso(br) {
  const m = String(br || "").trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const dd = m[1], mm = m[2], yyyy = m[3];
  const dt = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
  if (
    isNaN(dt.getTime()) ||
    dt.getUTCFullYear() !== Number(yyyy) ||
    (dt.getUTCMonth() + 1) !== Number(mm) ||
    dt.getUTCDate() !== Number(dd)
  ) {
    return null;
  }
  return `${yyyy}-${mm}-${dd}`;
}

function gerarNomeArquivo() {
  const nome = getEvangelizacao()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

  return `Programacao_${nome || "backup"}.json`;
}

function exportarBackup(){
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    current: {
      evangelizacao: getEvangelizacao(),
      lista: carregarLista()
    }
  };

  const blob = new Blob(
    [JSON.stringify(data, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = gerarNomeArquivo(); // ✅ nome melhorado

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

function handleImportFile(file){
  if(!file) return;
  const fr = new FileReader();
  fr.onload = () => {
    try{
      const obj = JSON.parse(fr.result);
      if(!obj || !Array.isArray(obj.current?.lista)) {
        alert("Arquivo JSON inválido.");
        return;
      }
      if(confirm("Deseja SUBSTITUIR a lista atual?")){
        salvarLista(obj.current.lista || []);
        setEvangelizacao(obj.current.evangelizacao || EVANG_DEFAULT);
        const inputEv = document.getElementById("evangelizacao");
        if (inputEv) inputEv.value = obj.current.evangelizacao || "";
      }
      atualizarTitulos();
      renderizarLista();
      alert("Backup importado com sucesso.");
    }catch(e){
      console.error(e);
      alert("Erro ao importar o arquivo.");
    }
  };
  fr.readAsText(file);
}

function zerarTudo(){
  if (!confirm("Tem certeza que deseja EXCLUIR essa PROGRAMAÇÃO? Esta ação não poderá ser revertida!")) {
    return;
  }
  try {
    localStorage.removeItem(LIST_KEY);
    localStorage.removeItem(HIST_KEY);
    atualizarTitulos();
    renderizarLista();
    alert("Pronto! Lista foi zerada.");
  } catch (e) {
    console.error(e);
    alert("Não foi possível excluir essa programação. Tente novamente.");
  }
}

function iniciarLoops() {

  if (intervalGlobal) return;

  intervalGlobal = setInterval(() => {
    renderizarLista();
  }, 1000);

}
	
function setPrintMode(state) {
  isPrinting = state;
  document.body.classList.toggle("printing", state);
}

function importarJSONDireto(json) {
  try {

    if (!json.current?.lista) {
      throw new Error("Formato inválido");
    }

    // ✅ atualiza dados
    salvarLista(json.current.lista);

    // ✅ atualiza evangelização
    if (json.current.evangelizacao) {
      setEvangelizacao(json.current.evangelizacao);
    }

    atualizarTitulos();
    renderizarLista();

    alert("✅ Programação atualizada com sucesso!");

  } catch (e) {
    console.error(e);
    alert("Erro ao importar JSON do servidor!");
  }
}
	
function escolherAtualizacaoJSON() {
  fetch('import/option.json?v=' + Date.now())
    .then(res => res.json())
    .then(opcoes => {

      const escolha = prompt(
        "Escolha o arquivo:\n\n" +
        opcoes.map((op, i) => `${i + 1} - ${op.nome}`).join("\n")
      );

      const idx = parseInt(escolha) - 1;
      if (!opcoes[idx]) return;

      const caminho = "import/" + opcoes[idx].arquivo;

      fetch(caminho)
        .then(r => r.json())
        .then(importarJSONDireto)
        .catch(() => alert("Erro ao carregar arquivo"));

    })
    .catch(() => alert("Erro ao carregar opções"));
}

window.escolherAtualizacaoJSON = escolherAtualizacaoJSON;

function baixarPDF() {
  setTimeout(() => {
    window.print();
  }, 100);
}
window.baixarPDF = baixarPDF;
	
document.addEventListener("DOMContentLoaded", () => {

  // ===============================
  // 🔹 INICIALIZA
  // ===============================
  const ev = getEvangelizacao();
  const input = document.getElementById("evangelizacao");
  if (input) input.value = (ev === EVANG_DEFAULT ? "" : ev);

  atualizarTitulos();
  renderizarLista();

  setTimeout(() => {
    scrollParaAtividade();
  }, 200);

  const btnZerar = document.getElementById('btn-zerar-tudo');
  if (btnZerar) btnZerar.addEventListener('click', zerarTudo);

  // ===============================
  // 🔹 MENU TOGGLE
  // ===============================
  const btn = document.getElementById("toggle-menu-adicao");
  const menu = document.getElementById("menu-adicao");

  if (btn && menu) {
    menu.classList.add("collapsed");
    btn.textContent = "+";

    btn.addEventListener("click", () => {
      const aberto = menu.classList.contains("expanded");

      if (aberto) {
        menu.classList.remove("expanded");
        menu.classList.add("collapsed");
        btn.textContent = "+";
      } else {
        menu.classList.remove("collapsed");
        menu.classList.add("expanded");
        btn.textContent = "-";
      }
    });
  }

  // ===============================
  // 🔥 LOOPS (CORRIGIDO)
  // ===============================
  iniciarLoops();

  // ===============================
  // 🖨 PRINT CONTROL
  // ===============================

window.addEventListener("beforeprint", () => {

  isPrinting = true;

  pararLoops();

  renderizarLista();

});

window.addEventListener("afterprint", () => {

  isPrinting = false;

  renderizarLista();

  iniciarLoops();

});

});
	
</script>
