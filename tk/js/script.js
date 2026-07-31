document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================================================
       1. CONTADORES ANIMADOS (NÚMEROS DAS ESTATÍSTICAS)
       ========================================================================== */
    const counters = document.querySelectorAll('.stat-number');

    if (counters.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;

                const counter = entry.target;
                const target = parseInt(counter.dataset.target, 10);
                const duration = 2000;
                const startTime = performance.now();

                function animate(now) {
                    const progress = Math.min((now - startTime) / duration, 1);
                    const value = Math.floor(progress * target);

                    counter.textContent = value.toLocaleString('pt-BR');

                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    } else {
                        counter.textContent = target.toLocaleString('pt-BR');
                    }
                }

                requestAnimationFrame(animate);
                observer.unobserve(counter);
            });
        }, { threshold: 0.4 });

        counters.forEach(counter => observer.observe(counter));
    }

    /* ==========================================================================
       CÁLCULO DINÂMICO DOS ANOS DE FUNDAÇÃO (1999/2000 -> ANO ATUAL)
       ========================================================================== */
    const anoFundacao = 2000; 
    const anoAtual = new Date().getFullYear();
    const anosDecorridos = anoAtual - anoFundacao;

    // Elementos da tela
    const elemAnosTitulo = document.getElementById('anos-fundacao-titulo');
    const elemAnosTexto = document.getElementById('anos-fundacao-texto');
    const elemAnoCorrente = document.getElementById('ano-corrente');

    if (elemAnosTitulo) elemAnosTitulo.textContent = anosDecorridos;
    if (elemAnosTexto) elemAnosTexto.textContent = anosDecorridos;
    if (elemAnoCorrente) elemAnoCorrente.textContent = anoAtual;

    /* ==========================================================================
       2. CARROSSEL DE SLIDES/IMAGENS (BANNER)
       ========================================================================== */
    const slides = document.querySelector(".slides");
    const images = document.querySelectorAll(".slides img");
    const nextBtnSlide = document.querySelector(".next");
    const prevBtnSlide = document.querySelector(".prev");

    if (slides && images.length > 0) {
        let slideIndex = 0;

        function showSlide(i) {
            if (i >= images.length) slideIndex = 0;
            else if (i < 0) slideIndex = images.length - 1;
            else slideIndex = i;

            slides.style.transform = `translateX(-${slideIndex * 100}%)`;
        }

        if (nextBtnSlide) nextBtnSlide.addEventListener('click', () => showSlide(slideIndex + 1));
        if (prevBtnSlide) prevBtnSlide.addEventListener('click', () => showSlide(slideIndex - 1));

        // Autoplay do banner de imagens a cada 5s
        setInterval(() => showSlide(slideIndex + 1), 5000);
    }

    /* ==========================================================================
       3. CARROSSEL DE CARDS (OBRAS DE EVANGELIZAÇÃO) + SETAS INTELIGENTES + AUTOPLAY
       ========================================================================== */
    const track = document.querySelector('.carousel-track');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    if (track) {
        let autoPlayInterval;
        const intervalTime = 3500; // Tempo do autoplay dos cards (3.5s)

        // Atualiza a visibilidade das setas (Esconde se não houver para onde rolar)
        function updateCarouselButtons() {
            const scrollLeft = Math.ceil(track.scrollLeft);
            const maxScroll = track.scrollWidth - track.clientWidth;

            // Se não há rolagem disponível (conteúdo cabe na tela), esconde ambas as setas
            if (maxScroll <= 5) {
                if (prevBtn) prevBtn.style.display = 'none';
                if (nextBtn) nextBtn.style.display = 'none';
                return;
            }

            // Controle da Seta Esquerda
            if (prevBtn) {
                prevBtn.style.display = scrollLeft <= 5 ? 'none' : 'flex';
            }

            // Controle da Seta Direita
            if (nextBtn) {
                nextBtn.style.display = scrollLeft >= maxScroll - 5 ? 'none' : 'flex';
            }
        }

        // Função de avanço automático ajustada com reset do "Ler mais"
        function nextSlide() {
            const card = track.querySelector('.card');
            if (!card) return;

            // FECHA QUALQUER CARD EXPANDIDO ANTES DE ROLAR (Melhoria de UX no Mobile)
            document.querySelectorAll('.more-content.show').forEach(content => {
                content.classList.remove('show');
                const btn = content.closest('.card').querySelector('.read-more-btn');
                if (btn) btn.textContent = 'Ler mais';
            });

            const gap = parseInt(window.getComputedStyle(track).gap) || 15;
            const scrollAmount = card.offsetWidth + gap;
            const maxScroll = track.scrollWidth - track.clientWidth;

            if (track.scrollLeft >= maxScroll - 5) {
                track.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        }

        function startAutoPlay() {
            stopAutoPlay();
            autoPlayInterval = setInterval(nextSlide, intervalTime);
        }

        function stopAutoPlay() {
            if (autoPlayInterval) clearInterval(autoPlayInterval);
        }

        // Eventos de clique direto nas setas do carrossel
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                moveCarousel(-1);
                startAutoPlay(); // Reinicia o timer ao clicar
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                moveCarousel(1);
                startAutoPlay(); // Reinicia o timer ao clicar
            });
        }

        // Ouvintes de eventos para rolagem e botões
        track.addEventListener('scroll', updateCarouselButtons);
        window.addEventListener('resize', updateCarouselButtons);

        // Pausa autoplay em caso de interatividade do usuário
        track.addEventListener('mouseenter', stopAutoPlay);
        track.addEventListener('touchstart', stopAutoPlay, { passive: true });
        track.addEventListener('mouseleave', startAutoPlay);
        track.addEventListener('touchend', startAutoPlay);

        // Inicialização
        updateCarouselButtons();
        startAutoPlay();
    }
});

/* ==========================================================================
   4. FUNÇÕES GLOBAIS (CHAMADAS DIRETO PELO HTML)
   ========================================================================== */

// Função para expandir e recolher o "Ler mais"
function toggleReadMore(button) {
    const card = button.closest('.card');
    const moreContent = card.querySelector('.more-content');
    
    if (moreContent) {
        moreContent.classList.toggle('show');
        button.textContent = moreContent.classList.contains('show') ? 'Ler menos' : 'Ler mais';
    }
}

// Função para mover o carrossel via clique nos botões (setas)
function moveCarousel(direction) {
    const track = document.querySelector('.carousel-track');
    const card = document.querySelector('.card');
    
    if (track && card) {
        const gap = parseInt(window.getComputedStyle(track).gap) || 15;
        const scrollAmount = card.offsetWidth + gap;
        
        track.scrollBy({
            left: direction * scrollAmount,
            behavior: 'smooth'
        });
    }
}
