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
  const readerCover = document.querySelector('#readerCover');
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
    if (readerCover instanceof HTMLImageElement) {
      readerCover.src = post.cover;
      readerCover.alt = post.coverAlt;
    }
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
      if (readerCover instanceof HTMLImageElement) {
        readerCover.removeAttribute('src');
        readerCover.alt = '';
      }
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
  if (!(canvas instanceof HTMLCanvasElement)) return;
  const context = canvas.getContext('2d');
  if (!context) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let width = 0;
  let height = 0;
  let stars = [];

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.width = Math.floor(window.innerWidth * dpr);
    height = canvas.height = Math.floor(window.innerHeight * dpr);
    const count = Math.min(190, Math.floor((width * height) / 24000));
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
        star.x += star.z * 0.2;
        if (star.x > width) star.x = 0;
      }
      const alpha = 0.22 + star.z * 0.58;
      context.fillStyle = star.tone > 0.88 ? `rgba(255,189,89,${alpha})` : `rgba(184,240,255,${alpha})`;
      const size = 1 + star.z * 1.4;
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
  if (!(progress instanceof HTMLElement)) return;

  const update = () => {
    const max = root.scrollHeight - window.innerHeight;
    const value = max > 0 ? (window.scrollY / max) * 100 : 0;
    progress.style.width = `${Math.min(100, Math.max(0, value))}%`;
  };

  update();
  window.addEventListener('scroll', update, { passive: true });
}

function formatTime(value) {
  if (!Number.isFinite(value)) return '0:00';
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function initAudioDock() {
  const dock = document.querySelector('#audioDock');
  if (!(dock instanceof HTMLElement)) return;

  const tracks = JSON.parse(dock.dataset.tracks || '[]');
  if (!tracks.length) return;

  const audio = new Audio();
  audio.preload = 'metadata';
  audio.volume = 0.42;
  let index = 0;
  let seeking = false;
  let visualFrame = 0;

  const title = document.querySelector('#trackTitle');
  const mood = document.querySelector('#trackMood');
  const time = document.querySelector('#trackTime');
  const progress = document.querySelector('#trackProgress');
  const volume = document.querySelector('#volumeControl');
  const play = document.querySelector('#playToggle');
  const prev = document.querySelector('#prevTrack');
  const next = document.querySelector('#nextTrack');
  const bars = Array.from(document.querySelectorAll('#audioVisualizer span'));

  const setTrack = (nextIndex, shouldPlay = false) => {
    index = (nextIndex + tracks.length) % tracks.length;
    const track = tracks[index];
    audio.src = track.src;
    if (title) title.textContent = track.title;
    if (mood) mood.textContent = track.mood;
    if (time) time.textContent = '0:00';
    if (progress instanceof HTMLInputElement) progress.value = '0';
    if (shouldPlay) {
      audio.play().catch(() => body.classList.remove('audio-playing'));
    }
  };

  const syncPlayState = () => {
    const playing = !audio.paused && !audio.ended;
    body.classList.toggle('audio-playing', playing);
    play?.setAttribute('aria-label', playing ? '暂停背景音乐' : '播放背景音乐');
    play?.setAttribute('title', playing ? '暂停背景音乐' : '播放背景音乐');
  };

  const updateProgress = () => {
    if (!seeking && progress instanceof HTMLInputElement && Number.isFinite(audio.duration) && audio.duration > 0) {
      progress.value = String(Math.round((audio.currentTime / audio.duration) * 1000));
    }
    if (time) time.textContent = formatTime(audio.currentTime);
  };

  const animateBars = () => {
    const playing = !audio.paused && !audio.ended;
    bars.forEach((bar, i) => {
      const wave = playing ? 0.42 + Math.abs(Math.sin(Date.now() / (260 + i * 45) + i)) * 0.58 : 0.18 + i * 0.04;
      bar.style.transform = `scaleY(${wave.toFixed(3)})`;
    });
    visualFrame = requestAnimationFrame(animateBars);
  };

  play?.addEventListener('click', () => {
    if (audio.paused) {
      audio.play().catch(() => body.classList.remove('audio-playing'));
    } else {
      audio.pause();
    }
  });

  prev?.addEventListener('click', () => setTrack(index - 1, !audio.paused));
  next?.addEventListener('click', () => setTrack(index + 1, !audio.paused));

  progress?.addEventListener('input', () => {
    seeking = true;
    if (Number.isFinite(audio.duration) && audio.duration > 0 && progress instanceof HTMLInputElement) {
      audio.currentTime = (Number(progress.value) / 1000) * audio.duration;
      updateProgress();
    }
  });
  progress?.addEventListener('change', () => {
    seeking = false;
  });

  volume?.addEventListener('input', () => {
    if (volume instanceof HTMLInputElement) audio.volume = Number(volume.value);
  });

  audio.addEventListener('play', syncPlayState);
  audio.addEventListener('pause', syncPlayState);
  audio.addEventListener('ended', () => setTrack(index + 1, true));
  audio.addEventListener('timeupdate', updateProgress);
  audio.addEventListener('loadedmetadata', updateProgress);

  setTrack(0, false);
  animateBars();
  window.addEventListener('beforeunload', () => cancelAnimationFrame(visualFrame));
}

initTheme();
initCursorGlow();
initArchive();
initStarfield();
initReadProgress();
initAudioDock();
