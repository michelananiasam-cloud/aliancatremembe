const MOBILE_EDITABLE = false;

function isMobileEditAllowed() {
  return MOBILE_EDITABLE;
}

function canEdit() {
  return !(window.innerWidth <= 760 && !isMobileEditAllowed());
}

/* ============================================================
   PARTE 1 — Modelo de dados, storage e utilitários
============================================================ */

var TITLE_KEY = "Equipes_titulo";
var TITLE_DEFAULT = "Equipe Movimento Tremembé";
var ORG_KEY = "Equipes_dados_v2";

function defaultModel() {
  return {
    coordenacao: [],
    interna: { responsaveis: [], equipes: [] },
    externa: { responsaveis: [], equipes: [] },
    apoio:   { responsaveis: [], equipes: [] }
  };
}

function getTitulo() {
  try {
    var v = (localStorage.getItem(TITLE_KEY) || "").trim();
    return v || TITLE_DEFAULT;
  } catch (err) {
    return TITLE_DEFAULT;
  }
}

function setTitulo(v) {
  try {
    localStorage.setItem(TITLE_KEY, (v || "").trim());
  } catch (err) {}
}

function getTituloFormatado() {
  var base = getTitulo();
  base = (base || "").trim();
  var nome = base && base !== TITLE_DEFAULT ? base : TITLE_DEFAULT.replace(/^Equipes\s*/i, "");
  return "Equipe " + nome;
}

function atualizarTitulos() {
  var h1 = document.getElementById("titulo-web");
  var tituloFmt = getTituloFormatado();
  if (h1) h1.textContent = tituloFmt;
  document.title = tituloFmt;
}

function initTituloInput() {
  var inp = document.getElementById("evangelizacao");
  if (!inp) return;
  var t = getTitulo();
  inp.value = (t === TITLE_DEFAULT ? "Movimento Tremembé" : t);
}

function alterarTitulo(e) {
  if (e) e.preventDefault();
  var inp = document.getElementById("evangelizacao");
  var novo = (inp && inp.value || "").trim();
  setTitulo(novo);
  atualizarTitulos();
  syncPrintHeaderTitle();
}

function normalizeModel(m) {
  if (!m || typeof m !== "object") return defaultModel();
  if (!Array.isArray(m.coordenacao)) m.coordenacao = [];

  ["interna", "externa", "apoio"].forEach(function(key) {
    if (!m[key] || typeof m[key] !== "object") m[key] = { responsaveis: [], equipes: [] };
    if (!Array.isArray(m[key].responsaveis)) m[key].responsaveis = [];
    if (!Array.isArray(m[key].equipes)) m[key].equipes = [];

    m[key].equipes.forEach(function(eq) {
      if (!eq || typeof eq !== "object") return;
      if (typeof eq.nome !== "string") eq.nome = "";
      if (typeof eq.referencia === "undefined") eq.referencia = null;

      eq.pessoas = (eq.pessoas || []).map(function(p) {
        if (typeof p === "string") {
          return { nome: p, confirmado: null, dias: [] };
        } else if (typeof p === "object") {
          return {
            nome: p.nome || "",
            confirmado: (p.confirmado === true ? true : p.confirmado === false ? false : null),
            dias: Array.isArray(p.dias) ? p.dias : []
          };
        }
        return { nome: "", confirmado: null, dias: [] };
      });
    });
  });

  return m;
}

function loadOrg() {
  try {
    var raw = localStorage.getItem(ORG_KEY);
    if (!raw) return defaultModel();
    var m = JSON.parse(raw);
    return normalizeModel(m);
  } catch (err) {
    return defaultModel();
  }
}

function saveOrg(m) {
  try {
    localStorage.setItem(ORG_KEY, JSON.stringify(normalizeModel(m)));
  } catch (err) {
    alert("Não foi possível salvar localmente.");
  }
}

function sortByNamePT(a, b) {
  return String(a || "").localeCompare(String(b || ""), "pt-BR", { sensitivity: "base" });
}

function uniquePush(list, name) {
  if (!name) return;
  if (list.indexOf(name) === -1) list.push(name);
}

const ORDEM_DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function ordenarDias(dias) {
  return dias.slice().sort((a, b) => ORDEM_DIAS.indexOf(a) - ORDEM_DIAS.indexOf(b));
}

function orderPeopleForDisplay(eq) {
  const pessoas = eq.pessoas || [];
  const ref = eq.referencia || null;

  const refObj = ref ? pessoas.find(p => p.nome === ref) : null;
  const restantes = pessoas
    .filter(p => p.nome !== ref)
    .sort((a, b) => sortByNamePT(a.nome, b.nome));

  return refObj ? [refObj, ...restantes] : restantes;
}

function findEquipe(arr, nome) {
  var n = (nome || "").toLowerCase();
  for (var i = 0; i < (arr || []).length; i++) {
    var it = arr[i];
    if (it && String(it.nome || "").toLowerCase() === n) return it;
  }
  return null;
}

function countDistinctInEquipe(eq) {
  const set = new Set();
  (eq?.pessoas || []).forEach(p => {
    if (p && p.nome) set.add(p.nome.trim().toLowerCase());
  });
  return set.size;
}

function addPessoaChave(area, nome) {
  if (!nome) return;
  var org = loadOrg();
  if (area === "coordenacao") {
    uniquePush(org.coordenacao, nome);
    org.coordenacao.sort(sortByNamePT);
  } else {
    uniquePush(org[area].responsaveis, nome);
    org[area].responsaveis.sort(sortByNamePT);
  }
  saveOrg(org);
}

function removePessoaChave(area, nome) {
  var org = loadOrg();
  if (area === "coordenacao") {
    org.coordenacao = (org.coordenacao || []).filter(p => p !== nome);
  } else {
    org[area].responsaveis = (org[area].responsaveis || []).filter(p => p !== nome);
  }
  saveOrg(org);
}

function renamePessoaChave(area, oldName, newName) {
  newName = (newName || "").trim();
  if (!newName) return;
  var org = loadOrg();
  var list = (area === "coordenacao") ? org.coordenacao : org[area].responsaveis;

  var idx = list.indexOf(oldName);
  if (idx >= 0) {
    if (!list.includes(newName)) {
      list[idx] = newName;
      list.sort(sortByNamePT);
      saveOrg(org);
    }
  }
}

function upsertEquipe(refKey, nomeEquipe, pessoaOpcional, marcarRef) {
  var org = loadOrg();
  var list = org[refKey].equipes;
  var eq = findEquipe(list, nomeEquipe);

  if (!eq) {
    eq = { nome: nomeEquipe, pessoas: [], referencia: null };
    list.push(eq);
    list.sort((a, b) => sortByNamePT(a.nome, b.nome));
  }

  if (pessoaOpcional) {
    if (!eq.pessoas.some(p => p.nome === pessoaOpcional)) {
      eq.pessoas.push({
        nome: pessoaOpcional,
        confirmado: null,
        dias: []
      });
    }
  }

  if (marcarRef && pessoaOpcional) {
    eq.referencia = pessoaOpcional;
  }

  saveOrg(org);
}

function deleteEquipe(refKey, nomeEquipe) {
  var org = loadOrg();
  org[refKey].equipes = (org[refKey].equipes || []).filter(e => e.nome !== nomeEquipe);
  saveOrg(org);
}

function renameEquipe(refKey, oldName, newName) {
  newName = (newName || "").trim();
  if (!newName) return;
  var org = loadOrg();
  var list = org[refKey].equipes;
  var eq = findEquipe(list, oldName);
  if (!eq) return;

  if (findEquipe(list, newName)) return;

  eq.nome = newName;
  list.sort((a, b) => sortByNamePT(a.nome, b.nome));
  saveOrg(org);
}

function addPessoaToEquipe(refKey, nomeEquipe, pessoa, marcarRef) {
  pessoa = (pessoa || "").trim();
  if (!pessoa) return;

  var org = loadOrg();
  var eq = findEquipe(org[refKey].equipes, nomeEquipe);
  if (!eq) return;

  if (!eq.pessoas.some(p => p.nome === pessoa)) {
    eq.pessoas.push({
      nome: pessoa,
      confirmado: null,
      dias: []
    });
  }

  if (marcarRef) eq.referencia = pessoa;
  saveOrg(org);
}

function removePessoaFromEquipe(refKey, nomeEquipe, pessoa) {
  var org = loadOrg();
  var eq = findEquipe(org[refKey].equipes, nomeEquipe);
  if (!eq) return;

  eq.pessoas = eq.pessoas.filter(p => p.nome !== pessoa);
  if (eq.referencia === pessoa) eq.referencia = null;

  saveOrg(org);
}

function renamePessoaInEquipe(refKey, nomeEquipe, oldName, newName) {
  newName = (newName || "").trim();
  if (!newName) return;

  var org = loadOrg();
  var eq = findEquipe(org[refKey].equipes, nomeEquipe);
  if (!eq) return;

  var idx = eq.pessoas.findIndex(p => p.nome === oldName);
  if (idx < 0) return;

  if (!eq.pessoas.some(p => p.nome === newName)) {
    eq.pessoas[idx].nome = newName;
    if (eq.referencia === oldName) eq.referencia = newName;
  }

  saveOrg(org);
}

function toggleReferencia(refKey, nomeEquipe, pessoa) {
  var org = loadOrg();
  var eq = findEquipe(org[refKey].equipes, nomeEquipe);
  if (!eq) return;
  eq.referencia = (eq.referencia === pessoa) ? null : pessoa;
  saveOrg(org);
}

function startInlineEdit(targetEl, initialText, onSave, opts) {
  opts = opts || {};
  var parent = targetEl.parentNode;
  if (!parent) return;

  var input = document.createElement("input");
  input.type = "text";
  input.value = initialText || "";
  input.placeholder = opts.placeholder || "";
  input.style.minWidth = "120px";
  input.style.fontSize = "inherit";
  input.style.padding = "4px 6px";
  input.style.borderRadius = "6px";
  input.style.border = "1px solid rgba(0,0,0,.2)";
  input.style.background = "var(--bg)";
  input.style.color = "var(--text)";

  parent.replaceChild(input, targetEl);

  setTimeout(function() {
    input.focus();
    if (opts.selectAll !== false) input.select();
  }, 0);

  function commit() {
    var v = (input.value || "").trim();
    try { onSave(v); } finally {}
  }

  input.addEventListener("keydown", function(e) {
    if (e.key === "Enter") { e.preventDefault(); commit(); }
    if (e.key === "Escape") { e.preventDefault(); render(); }
  });
  input.addEventListener("blur", function() { commit(); });

  return input;
}

window.ORG = {
  getTitulo, setTitulo, atualizarTitulos, initTituloInput, alterarTitulo,
  load: loadOrg, save: saveOrg, orderPeopleForDisplay, sortByNamePT,
  addPessoaChave, removePessoaChave, renamePessoaChave,
  upsertEquipe, deleteEquipe, renameEquipe, addPessoaToEquipe, removePessoaFromEquipe, renamePessoaInEquipe, toggleReferencia,
  findEquipe, startInlineEdit
};

/* ============================================================
   PARTE 2 — Componentes DOM, Renderização e Ações Web
============================================================ */

function el(tag, attrs, children) {
  attrs = attrs || {};
  children = children || [];
  const E = document.createElement(tag);

  for (const k in attrs) {
    const v = attrs[k];
    if (k === "className") E.className = v;
    else if (k.startsWith("on") && typeof v === "function") {
      E.addEventListener(k.slice(2), v);
    } else {
      E.setAttribute(k, v);
    }
  }

  if (!Array.isArray(children)) children = [children];
  children.forEach(c => {
    if (typeof c === "string") E.appendChild(document.createTextNode(c));
    else if (c) E.appendChild(c);
  });

  return E;
}

function abrirSeletorDias(refKey, equipeName, pessoaObj) {
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.background = "rgba(0,0,0,.4)";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = "9999";

  const box = document.createElement("div");
  box.style.background = "#fff";
  box.style.padding = "16px";
  box.style.borderRadius = "12px";

  const diasSemana = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  const atual = new Set(pessoaObj.dias || []);

  diasSemana.forEach(d => {
    const btn = document.createElement("button");
    btn.textContent = d;
    btn.style.margin = "4px";
    btn.style.padding = "6px 10px";
    btn.style.borderRadius = "6px";
    btn.style.border = "1px solid #ccc";

    if (atual.has(d)) {
      btn.style.background = "#4caf50";
      btn.style.color = "#fff";
    }

    btn.onclick = () => {
      if (atual.has(d)) {
        atual.delete(d);
        btn.style.background = "";
        btn.style.color = "";
      } else {
        atual.add(d);
        btn.style.background = "#4caf50";
        btn.style.color = "#fff";
      }
    };

    box.appendChild(btn);
  });

  const salvar = document.createElement("button");
  salvar.textContent = "Salvar";
  salvar.style.display = "block";
  salvar.style.marginTop = "12px";

  salvar.onclick = () => {
    const org = ORG.load();
    const eq = ORG.findEquipe(org[refKey].equipes, equipeName);
    const p = eq.pessoas.find(p => p.nome === pessoaObj.nome);

    p.dias = ordenarDias(Array.from(atual));
    saveOrg(org);
    document.body.removeChild(overlay);
    render();
  };

  const cancelar = document.createElement("button");
  cancelar.textContent = "Cancelar";
  cancelar.style.marginTop = "8px";
  cancelar.onclick = () => document.body.removeChild(overlay);

  box.appendChild(salvar);
  box.appendChild(cancelar);
  overlay.appendChild(box);

  document.body.appendChild(overlay);
}

function normalizarDia(d) {
  return d.toLowerCase()
    .replace("á", "a").replace("ã", "a").replace("â", "a")
    .replace("é", "e").replace("í", "i").replace("ó", "o").replace("ú", "u");
}

function makePessoaChip(refKey, equipeName, pessoaObj, isRef) {
  const nome = pessoaObj.nome;
  const classes = ["chip"];
  if (pessoaObj.confirmado === true) classes.push("chip-ok");
  else if (pessoaObj.confirmado === false) classes.push("chip-pend");

  const chip = el("div", { className: classes.join(" ") });
  const nameSpan = el("span", { className: "chip-name" }, nome);

  nameSpan.ondblclick = function(e) {
    e.stopPropagation();
    ORG.startInlineEdit(nameSpan, nome, (newName) => {
      ORG.renamePessoaInEquipe(refKey, equipeName, nome, newName);
      render();
    });
  };

  chip.appendChild(nameSpan);

  if (pessoaObj.dias && pessoaObj.dias.length) {
    const diasWrap = el("div", { className: "chip-days" });
    ordenarDias(pessoaObj.dias).forEach(d => {
      const classeDia = "chip-day " + normalizarDia(d);
      diasWrap.appendChild(el("span", { className: classeDia }, d + "."));
    });
    chip.appendChild(diasWrap);
  }

  chip.addEventListener("click", function() {
    if (!canEdit()) return;

    if (pessoaObj.confirmado === null) pessoaObj.confirmado = true;
    else if (pessoaObj.confirmado === true) pessoaObj.confirmado = false;
    else pessoaObj.confirmado = null;

    const org = ORG.load();
    const eq = ORG.findEquipe(org[refKey].equipes, equipeName);
    const pessoa = eq.pessoas.find(p => p.nome === nome);
    pessoa.confirmado = pessoaObj.confirmado;

    saveOrg(org);
    render();
  });

  if (isRef) chip.appendChild(el("span", { className: "chip-star" }, "⭐"));

  const actions = el("div", { className: "chip-actions" });

  actions.appendChild(el("button", {
    title: "Editar",
    onclick: (e) => {
      e.stopPropagation();
      ORG.startInlineEdit(nameSpan, nome, (newName) => {
        ORG.renamePessoaInEquipe(refKey, equipeName, nome, newName);
        render();
      });
    }
  }, "✎"));

  actions.appendChild(el("button", {
    title: "Definir dias disponíveis",
    onclick: (e) => {
      e.stopPropagation();
      if (!canEdit()) return;
      abrirSeletorDias(refKey, equipeName, pessoaObj);
    }
  }, "📅"));

  actions.appendChild(el("button", {
    title: "Referência",
    onclick: (e) => {
      e.stopPropagation();
      ORG.toggleReferencia(refKey, equipeName, nome);
      render();
    }
  }, "⭐"));

  actions.appendChild(el("button", {
    title: "Remover",
    onclick: (e) => {
      e.stopPropagation();
      if (confirm("Remover " + nome + "?")) {
        ORG.removePessoaFromEquipe(refKey, equipeName, nome);
        render();
      }
    }
  }, "✕"));

  chip.appendChild(actions);
  return chip;
}

function makeEquipeHeader(refKey, equipe) {
  const line = el("div", { className: "team-line" });
  const qtd = countDistinctInEquipe(equipe);
  const nameSpan = el("span", { className: "team-name" }, `${equipe.nome} (${qtd})`);

  nameSpan.ondblclick = function() {
    if (!canEdit()) return;
    ORG.startInlineEdit(nameSpan, equipe.nome, function(newName) {
      ORG.renameEquipe(refKey, equipe.nome, newName);
      render();
    });
  };

  line.appendChild(nameSpan);

  const acts = el("div", { className: "team-actions" });

  acts.appendChild(el("button", {
    title: "Editar nome da equipe",
    onclick: function() {
      if (!canEdit()) return;
      ORG.startInlineEdit(nameSpan, equipe.nome, function(newName) {
        ORG.renameEquipe(refKey, equipe.nome, newName);
        render();
      });
    }
  }, "✎"));

  acts.appendChild(el("button", {
    title: "Adicionar pessoa à equipe",
    onclick: function() {
      if (!canEdit()) return;
      const p = prompt("Nome da nova pessoa:");
      if (p) {
        ORG.addPessoaToEquipe(refKey, equipe.nome, p, false);
        render();
      }
    }
  }, "＋"));

  acts.appendChild(el("button", {
    title: "Marcar / desmarcar como referência da equipe",
    onclick: function() {
      if (!canEdit()) return;
      if (!equipe.pessoas || !equipe.pessoas.length) {
        alert("Adicione pelo menos 1 pessoa antes de marcar referência.");
        return;
      }
      if (equipe.referencia) {
        ORG.toggleReferencia(refKey, equipe.nome, equipe.referencia);
      } else {
        const p = prompt("Digite o nome da pessoa que será a referência:\n" + (equipe.pessoas || []).map(x => x.nome).join("\n"));
        if (p && equipe.pessoas.some(x => x.nome === p)) {
          ORG.toggleReferencia(refKey, equipe.nome, p);
        } else if (p) {
          alert("Essa pessoa não pertence à equipe.");
        }
      }
      render();
    }
  }, "⭐"));

  acts.appendChild(el("button", {
    title: "Excluir equipe",
    onclick: function() {
      if (!canEdit()) return;
      if (confirm(`Excluir a equipe "${equipe.nome}"?`)) {
        ORG.deleteEquipe(refKey, equipe.nome);
        render();
      }
    }
  }, "🗑"));

  line.appendChild(acts);
  return line;
}

function renderPeople(refKey, equipeName, eq) {
  const ordered = ORG.orderPeopleForDisplay(eq);
  const wrap = el("div", { className: "people" });

  ordered.forEach(function(p) {
    const isRef = (eq.referencia === p.nome);
    const chip = makePessoaChip(refKey, equipeName, p, isRef);
    wrap.appendChild(chip);
  });

  return wrap;
}

function makeResponsaveisRow(areaKey, arr) {
  const wrap = el("div", { className: "people" });
  if (!arr || arr.length === 0) return wrap;

  arr.slice().sort((a, b) => ORG.sortByNamePT(a, b)).forEach(function(name) {
    const chip = el("div", { className: "chip" });
    const nameSpan = el("span", { className: "chip-name" }, name);

    nameSpan.ondblclick = function() {
      if (!canEdit()) return;
      ORG.startInlineEdit(nameSpan, name, function(newName) {
        ORG.renamePessoaChave(areaKey, name, newName);
        render();
      });
    };

    const actions = el("div", { className: "chip-actions" });

    actions.appendChild(el("button", {
      title: "Editar",
      onclick: function(e) {
        e.stopPropagation();
        if (!canEdit()) return;
        ORG.startInlineEdit(nameSpan, name, function(newName) {
          ORG.renamePessoaChave(areaKey, name, newName);
          render();
        });
      }
    }, "✎"));

    actions.appendChild(el("button", {
      title: "Excluir",
      onclick: function(e) {
        e.stopPropagation();
        if (!canEdit()) return;
        if (confirm(`Excluir "${name}" desta função?`)) {
          ORG.removePessoaChave(areaKey, name);
          render();
        }
      }
    }, "✕"));

    chip.appendChild(nameSpan);
    chip.appendChild(actions);
    wrap.appendChild(chip);
  });

  return wrap;
}

function renderRefCard(label, refKey, dataRef) {
  const card = el("section", { className: "card" + (refKey === "apoio" ? " ref-apoio" : "") });

  const titleBar = el("div", { className: "card-title" }, [
    el("span", { className: "badge" }, label),
    el("div", { className: "right" }, makeResponsaveisRow(refKey, dataRef.responsaveis)),
    el("div", { className: "ref-actions" }, [
      el("button", {
        className: "ref-btn",
        title: "Adicionar responsável",
        onclick: function() {
          const nome = prompt("Nome do responsável:");
          if (nome && nome.trim()) {
            ORG.addPessoaChave(refKey, nome.trim());
            render();
          }
        }
      }, "🙋‍＋"),
      el("button", {
        className: "ref-btn",
        title: "Adicionar nova equipe",
        onclick: function() {
          const nomeEq = prompt("Nome da nova equipe:");
          if (!nomeEq || !nomeEq.trim()) return;
          ORG.upsertEquipe(refKey, nomeEq.trim(), null, false);
          render();
        }
      }, "📋＋")
    ])
  ]);

  card.appendChild(titleBar);

  if (!dataRef.equipes || dataRef.equipes.length === 0) {
    card.appendChild(el("p", { style: "color:var(--muted);margin-top:12px;" }, "Nenhuma equipe cadastrada."));
    return card;
  }

  dataRef.equipes
    .slice()
    .sort((a, b) => ORG.sortByNamePT(a.nome, b.nome))
    .forEach(function(eq) {
      const eqContainer = el("div", { className: "team-container" });
      eqContainer.appendChild(makeEquipeHeader(refKey, eq));
      eqContainer.appendChild(renderPeople(refKey, eq.nome, eq));
      card.appendChild(eqContainer);
    });

  return card;
}

function collectDistinctFromRef(ref) {
  const set = new Set();
  (ref?.responsaveis || []).forEach(n => { if (n && n.trim()) set.add(n.trim().toLowerCase()); });
  (ref?.equipes || []).forEach(eq => {
    (eq?.pessoas || []).forEach(p => {
      if (p && p.nome) set.add(p.nome.trim().toLowerCase());
    });
  });
  return set;
}

function getDistinctCounts(org) {
  const internaSet = collectDistinctFromRef(org.interna);
  const externaSet = collectDistinctFromRef(org.externa);
  const apoioSet = collectDistinctFromRef(org.apoio);

  const totalSet = new Set();
  (org.coordenacao || []).forEach(n => { if (n && n.trim()) totalSet.add(n.trim().toLowerCase()); });
  [internaSet, externaSet, apoioSet].forEach(s => s.forEach(k => totalSet.add(k)));

  return {
    total: totalSet.size,
    interna: internaSet.size,
    externa: externaSet.size,
    apoio: apoioSet.size
  };
}

function renderCountsWeb(counts) {
  const card = el("section", { className: "card counts-card" });
  card.appendChild(el("div", { className: "card-title" }, [el("span", { className: "badge" }, "Número de Servos")]));
  const row = el("div", { className: "people" }, [
    el("div", { className: "chip" }, "Total: " + counts.total),
    el("div", { className: "chip" }, "Interna: " + counts.interna),
    el("div", { className: "chip" }, "Externa: " + counts.externa),
    el("div", { className: "chip" }, "Apoio: " + counts.apoio)
  ]);
  card.appendChild(row);
  return card;
}

function render() {
  const root = document.getElementById("org");
  if (!root) return;
  root.innerHTML = "";

  const org = ORG.load();
  atualizarTitulos();

  const cardCoord = el("section", { className: "card" });
  cardCoord.appendChild(
    el("div", { className: "card-title" }, [
      el("span", { className: "badge" }, "Coordenação"),
      el("div", { className: "right" }, makeResponsaveisRow("coordenacao", org.coordenacao)),
      el("div", { className: "ref-actions" }, [
        el("button", {
          className: "ref-btn",
          title: "Adicionar coordenador(a)",
          onclick: function() {
            const nome = prompt("Nome do(a) coordenador(a):");
            if (nome && nome.trim()) {
              ORG.addPessoaChave("coordenacao", nome.trim());
              render();
            }
          }
        }, "👤＋")
      ])
    ])
  );
  root.appendChild(cardCoord);

  const grid = el("div", { className: "grid-refs" });
  grid.appendChild(renderRefCard("Interna", "interna", org.interna));
  grid.appendChild(renderRefCard("Externa", "externa", org.externa));
  grid.appendChild(renderRefCard("Apoio", "apoio", org.apoio));
  root.appendChild(grid);

  const counts = getDistinctCounts(org);
  root.appendChild(renderCountsWeb(counts));

  renderPrintVersion(org);
}

/* ============================================================
   PARTE 3 — Impressão e Relatórios
============================================================ */

function renderPrintVersion(org) {
  let wrap = document.getElementById("print-dynamic-content");

  if (!wrap) {
    const parent = document.getElementById("print-lists");
    if (!parent) return;

    parent.innerHTML = `
      <div id="print-dynamic-content"></div>
      <div class="print-break print-only">
        <div class="print-section-title">Controle de Presença dos Servos</div>
        <table class="tabela-presenca">
          <thead>
            <tr>
              <th class="col-nome-presenca">Servos</th>
              <th class="col-check">Sáb</th>
              <th class="col-check">Dom</th>
            </tr>
          </thead>
          <tbody id="tabela-presenca-body"></tbody>
        </table>
      </div>
    `;

    wrap = document.getElementById("print-dynamic-content");
  }

  wrap.innerHTML = "";

  const firstSpacer = document.createElement("div");
  firstSpacer.style.height = "26mm";
  firstSpacer.style.display = "block";
  wrap.appendChild(firstSpacer);

  function secTitle(txt) {
    const h = document.createElement("div");
    h.className = "print-section-title";
    h.textContent = txt;
    wrap.appendChild(h);
  }

  function mkList(items) {
    const box = document.createElement("div");
    box.className = "print-list-block";
    items.forEach(t => {
      const line = document.createElement("div");
      line.className = "print-line";
      line.textContent = t;
      box.appendChild(line);
    });
    wrap.appendChild(box);
  }

  function mkTeam(eq) {
    const outer = document.createElement("div");
    outer.className = "print-team-outer";

    const qtd = countDistinctInEquipe(eq);
    const ref = eq.referencia ? ` — Ref.: ${eq.referencia}` : "";

    const title = document.createElement("div");
    title.className = "team-title";
    title.textContent = `${eq.nome} (${qtd} servos)${ref}`;
    outer.appendChild(title);

    const ordered = ORG.orderPeopleForDisplay(eq).map(p => p.nome);
    let text = "";

    if (ordered.length === 1) text = ordered[0] + ".";
    else if (ordered.length === 2) text = ordered[0] + " e " + ordered[1] + ".";
    else if (ordered.length > 2) {
      text = `${ordered.slice(0, -1).join(", ")} e ${ordered.at(-1)}.`;
    }

    const ppl = document.createElement("div");
    ppl.className = "team-members-inline";
    ppl.textContent = text;
    outer.appendChild(ppl);

    wrap.appendChild(outer);
  }

  function pageBreak() {
    const d = document.createElement("div");
    d.className = "print-break";
    return d;
  }

  // PÁGINA 1
  secTitle("Coordenação Thalita Kum");
  mkList(org.coordenacao.length ? org.coordenacao.slice().sort(ORG.sortByNamePT) : ["(vazio)"]);

  secTitle("Referência [Interna]");
  mkList(org.interna.responsaveis.length ? org.interna.responsaveis.slice().sort(ORG.sortByNamePT) : ["(vazio)"]);

  secTitle("Equipes [Interna]");
  org.interna.equipes.slice().sort((a, b) => ORG.sortByNamePT(a.nome, b.nome)).forEach(mkTeam);

  // PÁGINA 2
  wrap.appendChild(pageBreak());
  const spacer2 = document.createElement("div");
  spacer2.style.height = "26mm";
  spacer2.style.display = "block";
  wrap.appendChild(spacer2);

  secTitle("Coordenação Thalita Kum");
  mkList(org.coordenacao.length ? org.coordenacao.slice().sort(ORG.sortByNamePT) : ["(vazio)"]);

  secTitle("Referência [Externa]");
  mkList(org.externa.responsaveis.length ? org.externa.responsaveis.slice().sort(ORG.sortByNamePT) : ["(vazio)"]);

  secTitle("Equipes [Externa]");
  org.externa.equipes.slice().sort((a, b) => ORG.sortByNamePT(a.nome, b.nome)).forEach(mkTeam);

  // PÁGINA 3
  wrap.appendChild(pageBreak());
  const spacer3 = document.createElement("div");
  spacer3.style.height = "26mm";
  spacer3.style.display = "block";
  wrap.appendChild(spacer3);

  secTitle("Coordenação — Thalita Kum");
  mkList(org.coordenacao.length ? org.coordenacao.slice().sort(ORG.sortByNamePT) : ["(vazio)"]);

  secTitle("Equipes [Apoio]");
  org.apoio.equipes.slice().sort((a, b) => ORG.sortByNamePT(a.nome, b.nome)).forEach(mkTeam);

  const totals = getDistinctCounts(org);
  secTitle("Número de Servos");
  mkList([
    "Total geral: " + totals.total,
    "Interna: " + totals.interna,
    "Externa: " + totals.externa,
    "Apoio: " + totals.apoio
  ]);
}

function gerarListaPresencaDinamica() {
  const tbody = document.getElementById('tabela-presenca-body');
  if (!tbody) return;

  const org = loadOrg();
  const servosSet = new Set();

  (org.coordenacao || []).forEach(n => { if (n && n.trim()) servosSet.add(n.trim()); });

  ["interna", "externa", "apoio"].forEach(area => {
    (org[area].responsaveis || []).forEach(n => { if (n && n.trim()) servosSet.add(n.trim()); });
    (org[area].equipes || []).forEach(eq => {
      (eq.pessoas || []).forEach(p => { if (p && p.nome) servosSet.add(p.nome.trim()); });
    });
  });

  const listaOrdenada = Array.from(servosSet).sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));

  tbody.innerHTML = '';
  listaOrdenada.forEach(nome => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${nome}</td>
      <td class="col-check"><div class="box-check"></div></td>
      <td class="col-check"><div class="box-check"></div></td>
    `;
    tbody.appendChild(tr);
  });
}

function syncPrintHeaderTitle() {
  try {
    const h = document.getElementById("print-title");
    if (!h) return;
    h.textContent = getTituloFormatado();
  } catch (e) {}
}

function imprimirRelatorioGeral() {
  const org = ORG.load();
  renderPrintVersion(org);
  gerarListaPresencaDinamica();
  setTimeout(() => window.print(), 100);
}

function imprimirEscalaSabDom() {
  gerarListaPresencaDinamica();
  setTimeout(() => window.print(), 100);
}

/* ============================================================
   PARTE 4 — Eventos, Importação e Exportação
============================================================ */

function handleAddPessoaChave(e) {
  if (e) e.preventDefault();
  var area = document.getElementById("chave-area");
  var nome = document.getElementById("chave-nome");
  var a = area ? area.value : "coordenacao";
  var n = (nome ? nome.value : "").trim();
  if (!n) { alert("Informe o nome."); return; }
  ORG.addPessoaChave(a, n);
  if (nome) nome.value = "";
  render();
}

function handleUpsertEquipe(e) {
  if (e) e.preventDefault();
  var ref = document.getElementById("eq-ref")?.value || "interna";
  var nome = (document.getElementById("eq-nome")?.value || "").trim();
  var pessoa = (document.getElementById("eq-pessoa")?.value || "").trim();
  var marcar = !!document.getElementById("eq-marcar-ref")?.checked;

  if (!nome) { alert("Informe o nome da equipe."); return; }

  ORG.upsertEquipe(ref, nome, pessoa, marcar);

  var pessoaEl = document.getElementById("eq-pessoa");
  var checkEl = document.getElementById("eq-marcar-ref");
  if (pessoaEl) pessoaEl.value = "";
  if (checkEl) checkEl.checked = false;

  render();
}

function handleRodapeSubmit(e) {
  ORG.alterarTitulo(e);
}

function handleClearAll() {
  if (!confirm("Tem certeza que deseja LIMPAR todas as informações do Equipes?")) return;
  localStorage.removeItem(ORG_KEY);
  var reset = confirm("Deseja TAMBÉM resetar o título para o padrão?");
  if (reset) {
    ORG.setTitulo("Equipe Movimento Tremembé");
    var inp = document.getElementById("evangelizacao");
    if (inp) inp.value = "";
  }
  ORG.atualizarTitulos();
  render();
}

function bindUI() {
  const btnChave = document.getElementById("btn-add-chave");
  const btnEquipe = document.getElementById("btn-add-equipe");
  const formRodape = document.getElementById("form-rodape");
  const btnZerar = document.getElementById("btn-zerar");

  if (btnChave) btnChave.addEventListener("click", handleAddPessoaChave);
  if (btnEquipe) btnEquipe.addEventListener("click", handleUpsertEquipe);
  if (formRodape) formRodape.addEventListener("submit", handleRodapeSubmit);
  if (btnZerar) btnZerar.addEventListener("click", handleClearAll);

  const inpPessoaChave = document.getElementById("chave-nome");
  if (inpPessoaChave) {
    inpPessoaChave.addEventListener("keydown", ev => {
      if (ev.key === "Enter") { ev.preventDefault(); handleAddPessoaChave(); }
    });
  }

  const inpEqPessoa = document.getElementById("eq-pessoa");
  if (inpEqPessoa) {
    inpEqPessoa.addEventListener("keydown", ev => {
      if (ev.key === "Enter") { ev.preventDefault(); handleUpsertEquipe(); }
    });
  }

  const inpEqNome = document.getElementById("eq-nome");
  if (inpEqNome) {
    inpEqNome.addEventListener("keydown", ev => {
      if (ev.key === "Enter") { ev.preventDefault(); handleUpsertEquipe(); }
    });
  }

  const btnExportMermaid = document.getElementById("btn-export-mermaid");
  if (btnExportMermaid) btnExportMermaid.addEventListener("click", baixarMermaidA4);

  const btnExportJSON = document.getElementById("btn-export-json");
  if (btnExportJSON) btnExportJSON.addEventListener("click", baixarJSONEquipes);

  const btnImport = document.getElementById("btn-import-json");
  const inputImport = document.getElementById("input-import-json");

  if (btnImport && inputImport) {
    btnImport.addEventListener("click", () => inputImport.click());
    inputImport.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (!file) { alert("Nenhum arquivo selecionado."); return; }
      importarJSONEquipes(file);
      inputImport.value = "";
    });
  }
}

function baixarJSONEquipes() {
  const json = gerarJSONEquipesComLinks();
  const conteudo = JSON.stringify(json, null, 2);

  let nomeArquivo = getTitulo()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase();

  if (!nomeArquivo) nomeArquivo = "Equipes";

  const blob = new Blob([conteudo], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo + ".json";
  a.click();
  URL.revokeObjectURL(url);
}

function baixarMermaidA4() {
  let txt = gerarMermaidA4().replace(/&amp;lt;/g, "<;").replace(/&amp;gt;/g, ">;");
  const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Equipes_a4_mermaid.txt";
  a.click();
  URL.revokeObjectURL(url);
}

function gerarJSONEquipesComLinks() {
  const org = ORG.load();
  let idCounter = 1;
  const nextId = () => String(idCounter++);

  const nodes = [];
  const links = [];

  const idCoord = nextId();
  nodes.push({ id: idCoord, name: "Coordenação", title: "Coordenação" });

  org.coordenacao.forEach(nome => {
    nodes.push({ id: nextId(), name: nome, title: "Coordenador", parentId: idCoord });
  });

  function processArea(areaObj, areaNome, areaTitle) {
    const idArea = nextId();
    nodes.push({ id: idArea, name: areaNome, title: areaTitle, parentId: idCoord });

    (areaObj.responsaveis || []).forEach(nome => {
      nodes.push({ id: nextId(), name: nome, title: "Referência", parentId: idArea });
    });

    (areaObj.equipes || []).forEach(eq => {
      const idEq = nextId();
      nodes.push({ id: idEq, name: eq.nome, title: eq.nome, parentId: idArea });

      (eq.pessoas || []).forEach(p => {
        nodes.push({
          id: nextId(),
          name: p.nome,
          title: "Servo",
          parentId: idEq,
          confirmado: p.confirmado === true ? true : p.confirmado === false ? false : null,
          isReferencia: eq.referencia === p.nome,
          dias: Array.isArray(p.dias) ? p.dias : []
        });
      });
    });

    return idArea;
  }

  const idInterna = processArea(org.interna, "Interna", "Referência Interna");
  const idExterna = processArea(org.externa, "Externa", "Referência Externa");

  const idApoio = nextId();
  nodes.push({ id: idApoio, name: "Apoio", title: "Apoio", parentId: idCoord });

  (org.apoio.equipes || []).forEach(eq => {
    const idEq = nextId();
    nodes.push({ id: idEq, name: eq.nome, title: eq.nome, parentId: idApoio });

    (eq.pessoas || []).forEach(p => {
      nodes.push({
        id: nextId(),
        name: p.nome,
        title: "Servo",
        parentId: idEq,
        confirmado: p.confirmado === true ? true : p.confirmado === false ? false : null,
        isReferencia: eq.referencia === p.nome
      });
    });
  });

  links.push({ from: idApoio, to: idInterna, type: "responde_para" });
  links.push({ from: idApoio, to: idExterna, type: "responde_para" });

  return { titulo: getTitulo(), nodes, links };
}

function gerarMermaidA4() {
  const org = ORG.load();

  function idSafe(str) {
    return String(str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_]/g, "_");
  }

  function esc(str) {
    return String(str || "").replace(/`/g, "\\`");
  }

  const BR = "<br/>";

  function caixaEquipe(eq) {
    const lista = (eq.pessoas && eq.pessoas.length)
      ? eq.pessoas.map(p => `• ${esc(p.nome)}${eq.referencia === p.nome ? " ⭐" : ""}`).join(BR)
      : "(vazio)";
    return `\`**${esc(eq.nome)}**${BR}${lista}\``;
  }

  function caixaReferencias(titulo, lista) {
    const nomes = (lista && lista.length) ? lista.map(n => esc(n)).join(BR) : "(vazio)";
    return `\`${esc(titulo)}${BR}${nomes}\``;
  }

  const coord = esc(org.coordenacao[0] || "—");
  const refInt = org.interna.responsaveis || [];
  const refExt = org.externa.responsaveis || [];
  const eqInt = org.interna.equipes || [];
  const eqExt = org.externa.equipes || [];
  const eqApo = org.apoio.equipes || [];

  return `flowchart TB
linkStyle default curve:linear

classDef coord fill:#dbe8ff,stroke:#6a9eff,stroke-width:1.5px,color:#1a1a1a,rx:4,ry:4,font-size:14px;
classDef apoio fill:#efe6ff,stroke:#b18cff,stroke-width:1.5px,color:#1a1a1a,rx:4,ry:4,font-size:14px;
classDef equipe fill:#ffffff,stroke:#00000022,stroke-width:1px,color:#222,rx:3,ry:3,font-size:11px;
classDef invis fill:none,stroke:none,color:#0000;

n0["\`Coordenação${BR}${coord}\`"]:::coord

subgraph GRUPOS_INTER [ ]
direction LR
    iL:::invis
    subgraph INTERNA ["INTERNA"]
    direction LR
${eqInt.map(eq => `        n_INTERNA_${idSafe(eq.nome)}["${caixaEquipe(eq)}"]:::equipe`).join("\n")}
    end
    subgraph CENTRO ["Referências"]
    direction TB
        n_ref_int["${caixaReferencias("Ref. Interna", refInt)}"]:::refInt
        n_ref_ext["${caixaReferencias("Ref. Externa", refExt)}"]:::refExt
    end
    subgraph EXTERNA ["EXTERNA"]
    direction LR
${eqExt.map(eq => `        n_EXTERNA_${idSafe(eq.nome)}["${caixaEquipe(eq)}"]:::equipe`).join("\n")}
    end
    iR:::invis
end

n0 --> n_ref_int
n0 --> n_ref_ext
${eqInt.map(eq => `n_ref_int --> n_INTERNA_${idSafe(eq.nome)}`).join("\n")}
${eqExt.map(eq => `n_ref_ext --> n_EXTERNA_${idSafe(eq.nome)}`).join("\n")}

n_apoio["Apoio"]:::header
n_ref_int --> n_apoio
n_ref_ext --> n_apoio

subgraph APOIO_EQ [" "]
direction LR
${eqApo.map(eq => `    n_APOIO_${idSafe(eq.nome)}["${caixaEquipe(eq)}"]:::apoio`).join("\n")}
end

${eqApo.map(eq => `n_apoio --> n_APOIO_${idSafe(eq.nome)}`).join("\n")}`;
}

function importarJSONEquipes(file) {
  if (!file) return;
  const reader = new FileReader();

  reader.onload = function(e) {
    try {
      const json = JSON.parse(e.target.result);
      if (!json || !Array.isArray(json.nodes)) {
        alert("JSON inválido.");
        return;
      }
      importarJSONDireto(json);
      alert("Importação concluída!");
    } catch (err) {
      console.error(err);
      alert("Erro ao importar JSON.");
    }
  };

  reader.readAsText(file);
}

function importarJSONDireto(json) {
  try {
    const novoModel = defaultModel();

    if (typeof json.titulo === "string") {
      setTitulo(json.titulo);
    }

    const areasMap = { "Interna": "interna", "Externa": "externa", "Apoio": "apoio" };

    json.nodes.filter(n => n.title === "Coordenador").forEach(n => novoModel.coordenacao.push(n.name));

    json.nodes.forEach(n => {
      const areaKey = areasMap[n.name];
      if (!areaKey) return;

      json.nodes.filter(x => x.parentId === n.id && x.title === "Referência").forEach(ref => {
        novoModel[areaKey].responsaveis.push(ref.name);
      });

      json.nodes.filter(x => x.parentId === n.id && x.title !== "Referência" && x.title !== "Servo").forEach(eqNode => {
        const eq = { nome: eqNode.name, pessoas: [], referencia: null };
        const pessoas = json.nodes.filter(p => p.parentId === eqNode.id && p.title === "Servo");

        pessoas.forEach(p => {
          eq.pessoas.push({
            nome: p.name,
            confirmado: p.confirmado ?? null,
            dias: Array.isArray(p.dias) ? p.dias : []
          });

          if (p.isReferencia) eq.referencia = p.name;
        });

        novoModel[areaKey].equipes.push(eq);
      });
    });

    saveOrg(novoModel);
    atualizarTitulos();
    render();
  } catch (e) {
    console.error(e);
    alert("Erro ao importar JSON!");
  }
}

function escolherAtualizacaoJSON() {
  fetch('import/option.json?v=' + Date.now())
    .then(res => res.json())
    .then(opcoes => {
      const escolha = prompt(
        "Escolha a Equipe:\n\n" +
        opcoes.map((op, i) => `${i + 1} - ${op.nome}`).join("\n")
      );

      const idx = parseInt(escolha) - 1;
      if (!opcoes[idx]) return;

      fetch("import/" + opcoes[idx].arquivo)
        .then(r => r.json())
        .then(importarJSONDireto)
        .catch(() => alert("Erro ao carregar Equipes"));
    })
    .catch(() => alert("Erro ao carregar as opções"));
}

function gerarImpressaoServos(listaServosCompleta) {
  const LIMITE_POR_PAGINA = 25;
  const container = document.getElementById('print-lists');
  if (!container) return;
  
  // REMOVIDO: container.innerHTML = ''; (Isso apagava o relatório de equipes)
  
  // Remove apenas as tabelas de presença geradas em tentativas anteriores de impressão
  const tabelasAntigas = container.querySelectorAll('.gerado-por-tabela-servos');
  tabelasAntigas.forEach(tabela => tabela.remove());

  for (let i = 0; i < listaServosCompleta.length; i += LIMITE_POR_PAGINA) {
    const bloco = listaServosCompleta.slice(i, i + LIMITE_POR_PAGINA);
    const numeroPagina = Math.floor(i / LIMITE_POR_PAGINA) + 1;

    const paginaDiv = document.createElement('div');
    
    // Adicionamos a classe 'gerado-por-tabela-servos' para controle e 'print-break' para forçar a nova página
    paginaDiv.className = 'gerado-por-tabela-servos print-list-block print-break';

    paginaDiv.innerHTML = `
      <div class="print-section-title escala-page-break">
        Lista de Presença dos Servos — Página ${numeroPagina}
      </div>
      <br>
      <br>
      <table class="escala-box">
        <thead>
          <tr>
            <th class="col-nome">LISTA PRESENÇA</th>
            <th class="col-dia">SÁBADO</th>
            <th class="col-dia">DOMINGO</th>
          </tr>
        </thead>
        <tbody>
          ${bloco.map(servo => {
            const nome = typeof servo === 'object' && servo !== null ? (servo.nome || '') : servo;
            return `
              <tr>
                <td class="col-nome">${nome}</td>
                <td class="col-dia"><span class="box-manual"></span></td>
                <td class="col-dia"><span class="box-manual"></span></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;

    // Adiciona as tabelas ao final do contêiner, mantendo as páginas de equipes intactas
    container.appendChild(paginaDiv);
  }
}

document.addEventListener('click', function(e) {
  // Apenas executa no mobile (telas até 760px)
  if (window.innerWidth > 760) return;

  // Verifica se o alvo do clique é a logo ou a barra mobile de botões permitidos
  const clicouLogo = e.target.closest('#web-header a.logo-link');
  const clicouMobileBar = e.target.closest('#mobile-bar');

  // Se não for nenhum dos dois, cancela o evento imediatamente
  if (!clicouLogo && !clicouMobileBar) {
    e.stopPropagation();
    e.preventDefault();
    return false;
  }
}, true);

document.addEventListener("DOMContentLoaded", () => {
  ORG.atualizarTitulos();
  ORG.initTituloInput();
  bindUI();
  render();
  syncPrintHeaderTitle();

  const btn = document.getElementById("toggle-form");
  const bloco = document.getElementById("form-bloco");

  if (btn && bloco) {
    bloco.classList.add("collapsed");
    btn.textContent = "+";

    btn.addEventListener("click", () => {
      const isOpen = bloco.classList.contains("expanded");
      if (isOpen) {
        bloco.classList.remove("expanded");
        bloco.classList.add("collapsed");
        btn.textContent = "+";
      } else {
        bloco.classList.remove("collapsed");
        bloco.classList.add("expanded");
        btn.textContent = "-";
      }
    });
  }
});

window.addEventListener('beforeprint', () => {
  syncPrintHeaderTitle();
  
  // Seleciona apenas os chips que estão dentro das listas de pessoas das equipes (ignora contadores e resumos)
  const chips = document.querySelectorAll('.people .chip, .team-members-inline .chip');
  const nomesSet = new Set();

  chips.forEach(chip => {
    const clone = chip.cloneNode(true);
    const actions = clone.querySelector('.chip-actions');
    if (actions) actions.remove();
    const days = clone.querySelector('.chip-days');
    if (days) days.remove();
    
    let nomeServo = clone.textContent.trim();
    // Remove estrelas e emojis com segurança
    nomeServo = nomeServo.replace(/🥁|🎤|🎸|🎹|⭐|★|☆|\*/g, '').trim();
    
    // Ignora textos vazios ou rótulos de contagem que possam vir por engano
    if (nomeServo && !nomeServo.includes(':') && !nomeServo.toLowerCase().includes('total')) {
      nomesSet.add(nomeServo);
    }
  });

  // Transforma em array e ordena em ordem alfabética exata
  const listaServosOrdenada = Array.from(nomesSet).sort((a, b) => a.localeCompare(b));

  // Dispara a criação das tabelas paginadas de 25 em 25
  gerarImpressaoServos(listaServosOrdenada);
});

window.imprimirEscalaSabDom = imprimirEscalaSabDom;
window.imprimirRelatorioGeral = imprimirRelatorioGeral;
window.escolherAtualizacaoJSON = escolherAtualizacaoJSON;
window.baixarJSONEquipes = baixarJSONEquipes;
window.baixarMermaidA4 = baixarMermaidA4;
window.handleRodapeSubmit = handleRodapeSubmit;
window.handleAddPessoaChave = handleAddPessoaChave;
window.handleUpsertEquipe = handleUpsertEquipe;
