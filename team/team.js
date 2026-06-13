
const KEY = "team_data";

function load(){
  return JSON.parse(localStorage.getItem(KEY) || "[]");
}

function save(data){
  localStorage.setItem(KEY, JSON.stringify(data));
}

function add(){
  const input = document.getElementById("nome");
  const nome = input.value.trim();

  if(!nome) return;

  const data = load();
  data.push(nome);

  save(data);
  input.value = "";

  render();
}

function render(){
  const root = document.getElementById("org");
  root.innerHTML = "";

  const data = load();

  data.forEach(nome => {
    const div = document.createElement("div");
    div.className = "team-line";
    div.textContent = nome;
    root.appendChild(div);
  });
}

// INIT
document.addEventListener("DOMContentLoaded", render);
