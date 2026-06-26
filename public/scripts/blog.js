const root = document.documentElement;
const body = document.body;

function initTheme() {
  const saved = localStorage.getItem('zdhua-theme');
  if (saved === 'light') body.classList.add('light-mode');

  document.querySelector('#themeToggle')?.addEventListener('click', () => {
    body.classList.toggle('light-mode');
    localStorage.setItem('zdhua-theme', body.classList.contains('light-mode') ? 'light' : 'dark');
  });
}

function initCursorGlow() {
  const glow = document.querySelector('#cursorGlow');
  if (!glow || window.matchMedia('(pointer: coarse)').matches) return;

  window.addEventListener('pointermove', (event) => {
    glow.style.opacity = '1';
    glow.style.left = `${event.clientX}px`;
    glow.style.top = `${event.clientY}px`;
  });
}

function initArchive() {
  const archive = document.querySelector('[data-posts]');
  if (!archive) return;

  const posts = JSON.parse(archive.dataset.posts || '[]');
  const cards = Array.from(document.querySelectorAll('.archive-card[data-index]'));
  const tabs = Array.from(document.querySelectorAll('#filterTabs button[data-category]'));
  const search = document.querySelector('#searchInput');
  const readerMeta = document.querySelector('#readerMeta');
  const readerTitle = document.querySelector('#readerTitle');
  const readerExcerpt = document.querySelector('#readerExcerpt');
  const readerTags = document.querySelector('#readerTags');
  const readerLink = document.querySelector('#readerLink');
  let activeCategory = 'All';
  let activeIndex = 0;

  const updateReader = (index) => {
    const post = posts[index];
    if (!post || !readerMeta || !readerTitle || !readerExcerpt || !readerTags || !readerLink) return;
    activeIndex = index;
    readerMeta.textContent = `${post.signal} / ${post.category} / ${post.readTime}`;
    readerTitle.textContent = post.title;
    readerExcerpt.textContent = post.description;
    readerTags.innerHTML = post.tags.map((tag) => `<span>${tag}</span>`).join('');
    readerLink.href = post.url;

    cards.forEach((card) => {
      card.classList.toggle('active', Number(card.dataset.index) === activeIndex);
    });
  };

  const applyFilters = () => {
    const query = (search?.value || '').trim().toLowerCase();
    let firstVisible = null;

    cards.forEach((card) => {
      const category = card.dataset.category || '';
      const haystack = (card.dataset.search || '').toLowerCase();
      const matchesCategory = activeCategory === 'All' || category === activeCategory;
      const matchesQuery = !query || haystack.includes(query);
      const visible = matchesCategory && matchesQuery;
      card.hidden = !visible;
      if (visible && firstVisible === null) firstVisible = Number(card.dataset.index);
    });

    if (firstVisible !== null && cards[activeIndex]?.hidden) updateReader(firstVisible);
    if (firstVisible === null && readerTitle && readerExcerpt && readerTags && readerMeta) {
      readerMeta.textContent = 'NO SIGNAL';
      readerTitle.textContent = '没有匹配文章';
      readerExcerpt.textContent = '换一个关键词或分类再试。';
      readerTags.innerHTML = '';
    }
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      activeCategory = tab.dataset.category || 'All';
      tabs.forEach((item) => item.setAttribute('aria-selected', String(item === tab)));
      applyFilters();
    });
  });

  cards.forEach((card) => {
    card.addEventListener('click', () => updateReader(Number(card.dataset.index)));
  });

  search?.addEventListener('input', applyFilters);
}

function initStarfield() {
  const canvas = document.querySelector('#starCanvas');
  if (!canvas) return;
  const context = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let width = 0;
  let height = 0;
  let stars = [];

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.width = Math.floor(window.innerWidth * dpr);
    height = canvas.height = Math.floor(window.innerHeight * dpr);
    const count = Math.min(170, Math.floor((width * height) / 26000));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      z: 0.2 + Math.random() * 0.8,
      tone: Math.random(),
    }));
  };

  const draw = () => {
    context.clearRect(0, 0, width, height);
    for (const star of stars) {
      if (!reduceMotion) {
        star.x += star.z * 0.18;
        if (star.x > width) star.x = 0;
      }
      const alpha = 0.25 + star.z * 0.55;
      context.fillStyle = star.tone > 0.87 ? `rgba(255,189,89,${alpha})` : `rgba(184,240,255,${alpha})`;
      const size = 1 + star.z * 1.5;
      context.fillRect(star.x, star.y, size, size);
    }
    if (!reduceMotion) requestAnimationFrame(draw);
  };

  resize();
  draw();
  window.addEventListener('resize', resize);
}

function initReadProgress() {
  const progress = document.querySelector('#readProgress');
  if (!progress) return;

  const update = () => {
    const max = root.scrollHeight - window.innerHeight;
    const value = max > 0 ? (window.scrollY / max) * 100 : 0;
    progress.style.width = `${Math.min(100, Math.max(0, value))}%`;
  };

  update();
  window.addEventListener('scroll', update, { passive: true });
}

initTheme();
initCursorGlow();
initArchive();
initStarfield();
initReadProgress();
