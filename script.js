// Exemplo simples (você pode evoluir depois)
console.log("App carregado ✅");

// ✅ deixar clique no botão funcionar sem necessidade do onclick no HTML
document.querySelectorAll(".card-button").forEach(btn => {
    btn.addEventListener("click", (e) => {
        const card = e.target.closest("a");
        if (card) {
            window.location.href = card.getAttribute("href");
        }
    });
});
