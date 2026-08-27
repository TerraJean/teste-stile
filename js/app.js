/* ============================================================
   GRUPO BGR - PORTAL INTERNO | JavaScript Principal
   Controla: menu mobile, dropdown de usuário, carrossel 
   de notícias (estático + dinâmico via Decap CMS),
   animações on-scroll e carregamento de notícias.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ---- 1. Menu Mobile (Hamburger) ---- 
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const hamburgerIcon = document.getElementById('hamburger-icon');
  const closeIcon = document.getElementById('close-icon');

  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      hamburgerIcon.classList.toggle('hidden', isOpen);
      closeIcon.classList.toggle('hidden', !isOpen);
      mobileToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  // ---- 2. Dropdown de Usuário ---- 
  const userBtn = document.getElementById('user-dropdown-btn');
  const userDropdown = document.getElementById('user-dropdown');

  if (userBtn && userDropdown) {
    userBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('show');
    });

    // Fecha ao clicar fora
    document.addEventListener('click', (e) => {
      if (!userBtn.contains(e.target) && !userDropdown.contains(e.target)) {
        userDropdown.classList.remove('show');
      }
    });

    // Fecha com Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        userDropdown.classList.remove('show');
      }
    });
  }

  // ---- 3. Carrossel de Notícias (Função Reutilizável) ----
  // Extraída como função para poder reinicializar após
  // carregamento dinâmico de notícias do CMS.
  let autoplayInterval = null;

  function initCarousel() {
    const track = document.getElementById('carousel-track');
    const slides = track ? track.querySelectorAll('.carousel-slide') : [];
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');
    const dotsContainer = document.getElementById('carousel-dots');

    if (!track || slides.length === 0) return;

    let currentSlide = 0;
    const totalSlides = slides.length;

    // Limpa autoplay anterior (se existir, para reinicialização)
    if (autoplayInterval) clearInterval(autoplayInterval);

    // Limpa dots anteriores e recria
    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.classList.add('carousel-dot');
        dot.setAttribute('aria-label', `Ir para notícia ${i + 1}`);
        if (i === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToSlide(i));
        dotsContainer.appendChild(dot);
      });
    }

    const dots = dotsContainer
      ? dotsContainer.querySelectorAll('.carousel-dot')
      : [];

    function goToSlide(index) {
      currentSlide = index;
      track.style.transform = `translateX(-${currentSlide * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle('active', i === currentSlide));
    }

    function nextSlide() {
      goToSlide((currentSlide + 1) % totalSlides);
    }

    function prevSlide() {
      goToSlide((currentSlide - 1 + totalSlides) % totalSlides);
    }

    // Remove listeners antigos clonando os botões
    if (prevBtn) {
      const newPrev = prevBtn.cloneNode(true);
      prevBtn.parentNode.replaceChild(newPrev, prevBtn);
      newPrev.addEventListener('click', prevSlide);
    }
    if (nextBtn) {
      const newNext = nextBtn.cloneNode(true);
      nextBtn.parentNode.replaceChild(newNext, nextBtn);
      newNext.addEventListener('click', nextSlide);
    }

    // Autoplay (5s)
    autoplayInterval = setInterval(nextSlide, 5000);

    // Pausa autoplay no hover
    const carouselEl = document.getElementById('news-carousel');
    if (carouselEl) {
      // Remove listeners antigos para evitar acúmulo
      const newCarousel = carouselEl;
      newCarousel.onmouseenter = () => clearInterval(autoplayInterval);
      newCarousel.onmouseleave = () => {
        autoplayInterval = setInterval(nextSlide, 5000);
      };
    }

    // Touch/swipe support
    let touchStartX = 0;

    track.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    track.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 50) {
        diff > 0 ? nextSlide() : prevSlide();
      }
    }, { passive: true });

    // Reseta posição
    goToSlide(0);
  }

  // Inicializa o carrossel com os slides estáticos (placeholder)
  initCarousel();

  // ---- 4. Animações on-scroll (Intersection Observer) ---- 
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -60px 0px',
    threshold: 0.15
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-visible');
        // Adiciona a classe de animação real
        const animType = entry.target.dataset.animate;
        if (animType) {
          entry.target.classList.add(`animate-${animType}`);
        }
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('[data-animate]').forEach(el => {
    observer.observe(el);
  });

  // ---- 5. Header scroll effect ---- 
  const header = document.getElementById('main-header');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;
    
    if (currentScroll > 50) {
      header.classList.add('shadow-xl');
    } else {
      header.classList.remove('shadow-xl');
    }
    
    lastScroll = currentScroll;
  }, { passive: true });

  // ---- 6. Smooth scroll para links de navegação ---- 
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({ behavior: 'smooth' });
        
        // Fecha menu mobile se estiver aberto
        if (mobileMenu && mobileMenu.classList.contains('open')) {
          mobileMenu.classList.remove('open');
          hamburgerIcon.classList.remove('hidden');
          closeIcon.classList.add('hidden');
        }
      }
    });
  });

  // ---- 7. Ano atual no footer ---- 
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }


  // ============================================================
  // 8. CARREGAMENTO DINÂMICO DE NOTÍCIAS (Decap CMS)
  //
  // Busca o índice consolidado gerado pelo GitHub Action
  // e substitui os slides estáticos por conteúdo do CMS.
  // Se o fetch falhar ou o índice estiver vazio,
  // os slides estáticos permanecem como fallback.
  // ============================================================

  /**
   * Formata uma data ISO para o padrão brasileiro legível.
   * Ex: "2026-08-25T10:00:00.000Z" → "25 Ago 2026"
   * @param {string} isoDate - Data em formato ISO 8601
   * @returns {string} Data formatada (ex: "25 Ago 2026")
   */
  function formatDate(isoDate) {
    const meses = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return '';
    return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`;
  }

  /**
   * Gera o HTML de um slide de notícia, seguindo a mesma
   * estrutura e classes CSS dos slides estáticos existentes.
   * @param {Object} noticia - Objeto da notícia do CMS
   * @param {string} noticia.titulo - Título da notícia
   * @param {string} noticia.data - Data em ISO 8601
   * @param {string} noticia.resumo - Resumo curto
   * @param {string} noticia.imagem - Caminho da imagem de capa
   * @returns {string} HTML do slide
   */
  function criarSlideHTML(noticia) {
    // Sanitiza valores para prevenir XSS básico
    const titulo = escapeHTML(noticia.titulo || 'Sem título');
    const resumo = escapeHTML(noticia.resumo || '');
    const imagem = noticia.imagem || 'assets/uploads/placeholder.jpg';
    const dataFormatada = formatDate(noticia.data);

    return `
      <div class="carousel-slide">
        <img 
          src="${imagem}" 
          alt="${titulo}" 
          loading="lazy"
          onerror="this.src='assets/news-office.jpg'"
        >
        <div class="news-card-body">
          <span class="news-tag bg-bgr-100 text-bgr-700">Notícia</span>
          <h4 class="text-base font-bold text-gray-900 mt-2.5 leading-snug">
            ${titulo}
          </h4>
          <p class="text-sm text-gray-500 mt-1.5 line-clamp-2">
            ${resumo}
          </p>
          <div class="flex items-center gap-2 mt-3 text-xs text-gray-400">
            <i class="fa-regular fa-calendar"></i>
            <span>${dataFormatada}</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Escapa caracteres HTML para prevenir XSS.
   * @param {string} str - String a ser sanitizada
   * @returns {string} String escapada
   */
  function escapeHTML(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  /**
   * Busca as notícias do index.json e renderiza os slides dinâmicos.
   * Mantém os slides estáticos como fallback em caso de erro.
   */
  async function carregarNoticias() {
    try {
      // Cache-buster para evitar cache em atualizações recentes
      const response = await fetch(`/noticias/index.json?t=${Date.now()}`);

      // Se o arquivo não existir (404), mantém fallback silencioso
      if (!response.ok) {
        console.info('[CMS] index.json não encontrado — usando slides estáticos.');
        return;
      }

      const noticias = await response.json();

      // Valida que é um array e possui ao menos 1 notícia
      if (!Array.isArray(noticias) || noticias.length === 0) {
        console.info('[CMS] Nenhuma notícia encontrada — usando slides estáticos.');
        return;
      }

      // Ordena por data (mais recente primeiro)
      noticias.sort((a, b) => new Date(b.data) - new Date(a.data));

      // Limita a 10 notícias mais recentes no carrossel
      const noticiasRecentes = noticias.slice(0, 10);

      // Gera o HTML de todos os slides
      const slidesHTML = noticiasRecentes
        .map(noticia => criarSlideHTML(noticia))
        .join('');

      // Substitui o conteúdo do track do carrossel
      const track = document.getElementById('carousel-track');
      if (track) {
        track.innerHTML = slidesHTML;

        // Reinicializa o carrossel com os novos slides
        initCarousel();

        console.info(
          `[CMS] ✅ ${noticiasRecentes.length} notícia(s) carregada(s) do Decap CMS.`
        );
      }

    } catch (error) {
      // Em caso de erro de rede/parse, mantém slides estáticos
      console.warn('[CMS] Erro ao carregar notícias — usando slides estáticos:', error);
    }
  }

  // Executa o carregamento dinâmico
  carregarNoticias();

});
