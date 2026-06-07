// Apenas para melhorar navegação com botão
document.querySelectorAll(".card-button").forEach(btn => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();

    const card = e.target.closest("a");
    if (card) {
      window.location.href = card.getAttribute("href");
    }
  });
});
