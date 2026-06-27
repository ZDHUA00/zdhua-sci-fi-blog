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

function categoryClass(category = '') {
  const slug = String(category).toLowerCase().replace(/[^a-z0-9-]/g, '');
  return `signal-art-${slug || 'deploy'}`;
}

function setSignalVisual(element, post) {
  if (!(element instanceof HTMLElement) || !post) return;
  for (const name of Array.from(element.classList)) {
    if (name.startsWith('signal-art-') && name !== 'signal-art') {
      element.classList.remove(name);
    }
  }
  element.classList.add(categoryClass(post.category));
  element.dataset.signal = post.signal || 'NO SIGNAL';
  element.dataset.category = post.category || 'Design';
}

function seededRandom(seedText) {
  let seed = 2166136261;
  for (let i = 0; i < seedText.length; i += 1) {
    seed ^= seedText.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }
  return () => {
    seed = Math.imul(seed ^ (seed >>> 15), 2246822507);
    seed = Math.imul(seed ^ (seed >>> 13), 3266489909);
    seed ^= seed >>> 16;
    return (seed >>> 0) / 4294967296;
  };
}

function initSignalArt() {
  document.querySelectorAll('.signal-art').forEach((art, artIndex) => {
    if (!(art instanceof HTMLElement) || art.dataset.enhanced === 'true') return;
    art.dataset.enhanced = 'true';
    const rand = seededRandom(`${art.dataset.signal || 'ZDHUA'}-${artIndex}`);
    const count = art.classList.contains('featured-visual') ? 8 : 4;

    for (let i = 0; i < count; i += 1) {
      const particle = document.createElement('span');
      particle.className = 'signal-particle';
      particle.style.setProperty('--x', `${Math.round(8 + rand() * 84)}%`);
      particle.style.setProperty('--y', `${Math.round(10 + rand() * 78)}%`);
      particle.style.setProperty('--size', `${(2 + rand() * 3.8).toFixed(2)}px`);
      particle.style.setProperty('--delay', `${(-rand() * 4.6).toFixed(2)}s`);
      art.appendChild(particle);
    }
  });
}

function initArchive() {
  const archive = document.querySelector('[data-posts]');
  if (!archive) return;

  const posts = JSON.parse(archive.dataset.posts || '[]');
  const cards = Array.from(document.querySelectorAll('.archive-card[data-index]'));
  const tabs = Array.from(document.querySelectorAll('#filterTabs button[data-category]'));
  const search = document.querySelector('#searchInput');
  const readerVisual = document.querySelector('#readerPanel .reader-visual');
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
    setSignalVisual(readerVisual, post);
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
      setSignalVisual(readerVisual, { signal: 'NO SIGNAL', category: 'Design' });
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

function initGalaxyCanvas() {
  const canvas = document.querySelector('#starCanvas');
  if (!(canvas instanceof HTMLCanvasElement)) return;
  const context = canvas.getContext('2d', { alpha: true });
  if (!context) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pointer = { x: 0, y: 0, active: false };
  let width = 0;
  let height = 0;
  let dpr = 1;
  let fieldStars = [];
  let armStars = [];
  let comets = [];
  let frame = 0;
  let lastFrame = 0;
  let running = !document.hidden;

  const rand = seededRandom('zdhua-galaxy');

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 760 ? 1 : 1.18);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    const fieldCount = Math.min(360, Math.max(150, Math.floor((width * height) / 5200)));
    const armCount = Math.min(150, Math.max(72, Math.floor((width * height) / 14500)));
    const galaxyRadius = Math.max(width, height) * 0.58;

    fieldStars = Array.from({ length: fieldCount }, () => ({
      x: rand() * width,
      y: rand() * height,
      size: 0.62 + rand() * 1.95,
      alpha: 0.22 + rand() * 0.74,
      drift: 0.08 + rand() * 0.28,
      tone: rand(),
    }));

    armStars = Array.from({ length: armCount }, (_, index) => {
      const arm = index % 4;
      const radius = Math.pow(rand(), 0.58) * galaxyRadius;
      const angle = arm * (Math.PI / 2) + radius * 0.011 + (rand() - 0.5) * 0.86;
      return {
        arm,
        radius,
        angle,
        size: 0.45 + rand() * 1.6,
        alpha: 0.18 + rand() * 0.72,
        spin: 0.000018 + rand() * 0.00004,
        tone: rand(),
      };
    });

    comets = Array.from({ length: width < 760 ? 1 : 2 }, (_, index) => ({
      x: rand() * width,
      y: rand() * height * 0.7,
      speed: 0.38 + rand() * 0.36,
      delay: index * 480,
      size: 1.4 + rand() * 1.8,
    }));
  };

  const drawNebula = (time, centerX, centerY) => {
    const pulse = 1 + Math.sin(time * 0.00032) * 0.035;
    const gradient = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) * 0.62 * pulse);
    gradient.addColorStop(0, 'rgba(38, 216, 255, 0.16)');
    gradient.addColorStop(0.26, 'rgba(155, 134, 255, 0.10)');
    gradient.addColorStop(0.48, 'rgba(255, 93, 126, 0.06)');
    gradient.addColorStop(1, 'rgba(2, 4, 10, 0)');
    context.fillStyle = gradient;
    context.beginPath();
    context.ellipse(centerX, centerY, Math.max(width, height) * 0.64, Math.max(width, height) * 0.3, -0.24, 0, Math.PI * 2);
    context.fill();
  };

  const drawTrails = (time, centerX, centerY) => {
    const radiusBase = Math.max(width, height) * 0.18;
    context.save();
    context.globalCompositeOperation = 'screen';
    for (let i = 0; i < 5; i += 1) {
      const radius = radiusBase + i * Math.max(width, height) * 0.044;
      const start = (time * 0.00008 * (i % 2 ? -1 : 1)) + i * 0.72;
      const end = start + Math.PI * (0.82 + i * 0.035);
      context.beginPath();
      context.ellipse(centerX, centerY, radius, radius * (0.28 + i * 0.012), -0.22 + i * 0.035, start, end);
      context.strokeStyle = i % 3 === 0
        ? 'rgba(110, 248, 164, 0.13)'
        : i % 3 === 1
          ? 'rgba(38, 216, 255, 0.16)'
          : 'rgba(255, 191, 95, 0.11)';
      context.lineWidth = i < 3 ? 1.15 : 0.85;
      context.stroke();
    }
    context.restore();
  };

  const draw = (time = 0) => {
    if (!running) {
      frame = 0;
      return;
    }
    if (!reduceMotion && time - lastFrame < 33) {
      frame = requestAnimationFrame(draw);
      return;
    }
    lastFrame = time;
    context.clearRect(0, 0, width, height);
    const parallaxX = pointer.active ? (pointer.x - width / 2) * 0.012 : 0;
    const parallaxY = pointer.active ? (pointer.y - height / 2) * 0.012 : 0;
    const centerX = width * 0.62 + parallaxX;
    const centerY = height * 0.38 + parallaxY;

    drawNebula(time, centerX, centerY);
    drawTrails(time, centerX, centerY);

    for (const star of fieldStars) {
      if (!reduceMotion) {
        star.x += star.drift;
        if (star.x > width + 6) star.x = -6;
      }
      const alpha = star.alpha * (0.72 + Math.sin(time * 0.001 + star.x) * 0.18);
      context.fillStyle = star.tone > 0.9
        ? `rgba(255, 191, 95, ${alpha})`
        : `rgba(206, 244, 255, ${alpha})`;
      context.beginPath();
      context.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      context.fill();
    }

    for (const star of armStars) {
      const angle = star.angle + (reduceMotion ? 0 : time * star.spin);
      const flatten = 0.42 + star.radius / Math.max(width, height) * 0.08;
      const x = centerX + Math.cos(angle) * star.radius + parallaxX * (star.radius / Math.max(width, height));
      const y = centerY + Math.sin(angle) * star.radius * flatten + parallaxY * 0.8;
      if (x < -20 || x > width + 20 || y < -20 || y > height + 20) continue;
      const twinkle = 0.72 + Math.sin(time * 0.0016 + star.arm + star.radius) * 0.22;
      const alpha = star.alpha * twinkle;
      context.fillStyle = star.tone > 0.86
        ? `rgba(255, 93, 126, ${alpha})`
        : star.tone > 0.68
          ? `rgba(110, 248, 164, ${alpha})`
          : `rgba(120, 225, 255, ${alpha})`;
      context.beginPath();
      context.arc(x, y, star.size, 0, Math.PI * 2);
      context.fill();
    }

    if (!reduceMotion) {
      for (const comet of comets) {
        const travel = ((time * comet.speed + comet.delay) % (width + 620)) - 360;
        const x = travel;
        const y = comet.y + Math.sin(time * 0.0007 + comet.delay) * 24;
        const tail = 120;
        const gradient = context.createLinearGradient(x - tail, y + 36, x, y);
        gradient.addColorStop(0, 'rgba(38, 216, 255, 0)');
        gradient.addColorStop(1, 'rgba(235, 252, 255, 0.72)');
        context.strokeStyle = gradient;
        context.lineWidth = comet.size;
        context.beginPath();
        context.moveTo(x - tail, y + 36);
        context.lineTo(x, y);
        context.stroke();
      }
    }

    if (!reduceMotion) frame = requestAnimationFrame(draw);
  };

  resize();
  draw();
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running && !reduceMotion && frame === 0) {
      lastFrame = 0;
      frame = requestAnimationFrame(draw);
    } else if (!running && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  });
  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
  }, { passive: true });
  window.addEventListener('beforeunload', () => cancelAnimationFrame(frame));
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

  const audio = document.querySelector('#bgmAudio');
  if (!(audio instanceof HTMLAudioElement)) return;

  audio.preload = 'auto';
  audio.volume = 1;
  let index = 0;
  let seeking = false;
  let visualFrame = 0;
  let wantsPlayback = false;
  let audioContext = null;
  let mediaSource = null;
  let audioGain = null;
  let synth = null;
  let synthStart = 0;
  const synthDuration = 96;

  const toggle = document.querySelector('#audioDockToggle');
  const close = document.querySelector('#audioDockClose');
  const title = document.querySelector('#trackTitle');
  const compactTitle = document.querySelector('#compactTrackTitle');
  const compactStatus = document.querySelector('#compactAudioStatus');
  const mood = document.querySelector('#trackMood');
  const status = document.querySelector('#audioStatus');
  const time = document.querySelector('#trackTime');
  const progress = document.querySelector('#trackProgress');
  const volume = document.querySelector('#volumeControl');
  const volumeReadout = document.querySelector('#volumeReadout');
  const play = document.querySelector('#playToggle');
  const prev = document.querySelector('#prevTrack');
  const next = document.querySelector('#nextTrack');
  const bars = Array.from(document.querySelectorAll('#audioVisualizer span'));

  const setStatus = (message, state = 'idle') => {
    dock.dataset.state = state;
    if (status) status.textContent = message;
    if (compactStatus) {
      compactStatus.textContent = state === 'playing' ? 'FM LIVE' : state === 'loading' ? 'LOADING' : state === 'error' || state === 'blocked' ? 'CHECK' : 'FM READY';
    }
  };

  const setOpen = (open) => {
    dock.dataset.open = String(open);
    toggle?.setAttribute('aria-expanded', String(open));
    toggle?.setAttribute('aria-label', open ? '背景音乐面板已打开' : '打开背景音乐面板');
    toggle?.setAttribute('title', open ? '背景音乐面板已打开' : '打开背景音乐面板');
  };

  const gainValue = () => {
    if (volume instanceof HTMLInputElement) return Math.max(0, Number(volume.value) || 0);
    return 1.8;
  };

  const syncVolumeReadout = () => {
    dock.dataset.gain = gainValue().toFixed(2);
    if (volumeReadout) volumeReadout.textContent = `${Math.round(gainValue() * 100)}%`;
  };

  const ensureAudioGraph = async () => {
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextConstructor) return false;
    if (!audioContext) audioContext = new AudioContextConstructor();
    if (!mediaSource) {
      mediaSource = audioContext.createMediaElementSource(audio);
      audioGain = audioContext.createGain();
      mediaSource.connect(audioGain);
      audioGain.connect(audioContext.destination);
    }
    audio.volume = 1;
    if (audioGain) audioGain.gain.setTargetAtTime(gainValue(), audioContext.currentTime, 0.015);
    await audioContext.resume();
    return true;
  };

  const isPlaying = () => Boolean(synth) || (!audio.paused && !audio.ended);

  const syncPlayState = () => {
    const playing = isPlaying();
    body.classList.toggle('audio-playing', playing);
    play?.setAttribute('aria-label', playing ? '暂停背景音乐' : '播放背景音乐');
    play?.setAttribute('title', playing ? '暂停背景音乐' : '播放背景音乐');
  };

  const stopSynth = () => {
    if (!synth) return;
    const now = synth.context.currentTime;
    synth.master.gain.cancelScheduledValues(now);
    synth.master.gain.setTargetAtTime(0, now, 0.04);
    synth.nodes.forEach((node) => {
      try {
        node.stop(now + 0.16);
      } catch {
        // Nodes can only be stopped once.
      }
    });
    synth = null;
  };

  const startFallbackSynth = async () => {
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextConstructor) return false;

    audio.pause();
    audio.currentTime = 0;
    if (!audioContext) audioContext = new AudioContextConstructor();
    await audioContext.resume();

    stopSynth();
    const baseFrequency = [92, 128, 73][index % 3];
    const master = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    const lfo = audioContext.createOscillator();
    const lfoGain = audioContext.createGain();
    const nodes = [];

    master.gain.value = gainValue() * 0.42;
    filter.type = 'lowpass';
    filter.frequency.value = 720;
    filter.Q.value = 0.55;
    lfo.frequency.value = 0.055;
    lfoGain.gain.value = 180;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    filter.connect(master);
    master.connect(audioContext.destination);

    [1, 1.5, 2.01].forEach((ratio, oscillatorIndex) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = oscillatorIndex === 1 ? 'triangle' : 'sine';
      oscillator.frequency.value = baseFrequency * ratio;
      gain.gain.value = [0.18, 0.08, 0.05][oscillatorIndex];
      oscillator.connect(gain);
      gain.connect(filter);
      oscillator.start();
      nodes.push(oscillator);
    });

    lfo.start();
    nodes.push(lfo);
    synth = { context: audioContext, master, nodes };
    synthStart = performance.now();
    setStatus(`正在播放备用合成音轨：${tracks[index].title}`, 'playing');
    syncPlayState();
    return true;
  };

  const updateProgress = () => {
    if (synth) {
      const elapsed = (performance.now() - synthStart) / 1000;
      if (!seeking && progress instanceof HTMLInputElement) {
        progress.value = String(Math.round(((elapsed % synthDuration) / synthDuration) * 1000));
      }
      if (time) time.textContent = formatTime(elapsed);
      return;
    }

    if (!seeking && progress instanceof HTMLInputElement && Number.isFinite(audio.duration) && audio.duration > 0) {
      progress.value = String(Math.round((audio.currentTime / audio.duration) * 1000));
    }
    if (time) time.textContent = formatTime(audio.currentTime);
  };

  const requestPlayback = async () => {
    wantsPlayback = true;
    stopSynth();
    setOpen(true);
    setStatus('正在加载本地音轨...', 'loading');
    syncPlayState();

    try {
      await ensureAudioGraph();
      if (!audio.currentSrc) audio.load();
      await audio.play();
      setStatus(`正在播放：${tracks[index].title}`, 'playing');
      syncPlayState();
    } catch (error) {
      console.warn('Audio element playback failed, starting Web Audio fallback.', error);
      const started = await startFallbackSynth();
      if (!started) {
        wantsPlayback = false;
        setStatus('浏览器阻止播放，请再点一次播放按钮。', 'blocked');
        syncPlayState();
      }
    }
  };

  const setTrack = (nextIndex, shouldPlay = false) => {
    index = (nextIndex + tracks.length) % tracks.length;
    const track = tracks[index];
    wantsPlayback = shouldPlay;
    stopSynth();
    audio.pause();
    audio.src = track.src;
    audio.load();
    if (title) title.textContent = track.title;
    if (compactTitle) compactTitle.textContent = track.title;
    if (mood) mood.textContent = track.mood;
    if (time) time.textContent = '0:00';
    if (progress instanceof HTMLInputElement) progress.value = '0';
    setStatus(shouldPlay ? '正在切换音轨...' : '点击播放，启动舰桥背景音', shouldPlay ? 'loading' : 'idle');
    syncPlayState();
    if (shouldPlay) requestPlayback();
  };

  const animateBars = () => {
    const playing = isPlaying();
    bars.forEach((bar, i) => {
      const wave = playing ? 0.38 + Math.abs(Math.sin(Date.now() / (230 + i * 43) + i)) * 0.62 : 0.18 + i * 0.04;
      bar.style.transform = `scaleY(${wave.toFixed(3)})`;
    });
    if (synth) updateProgress();
    visualFrame = requestAnimationFrame(animateBars);
  };

  play?.addEventListener('click', () => {
    if (isPlaying()) {
      wantsPlayback = false;
      stopSynth();
      audio.pause();
      setStatus('已暂停，点击继续播放。', 'idle');
      syncPlayState();
    } else {
      requestPlayback();
    }
  });

  prev?.addEventListener('click', () => setTrack(index - 1, isPlaying() || wantsPlayback));
  next?.addEventListener('click', () => setTrack(index + 1, isPlaying() || wantsPlayback));

  progress?.addEventListener('input', () => {
    seeking = true;
    if (progress instanceof HTMLInputElement) {
      if (synth) {
        const nextTime = (Number(progress.value) / 1000) * synthDuration;
        synthStart = performance.now() - nextTime * 1000;
        updateProgress();
      } else if (Number.isFinite(audio.duration) && audio.duration > 0) {
        audio.currentTime = (Number(progress.value) / 1000) * audio.duration;
        updateProgress();
      }
    }
  });

  progress?.addEventListener('change', () => {
    seeking = false;
  });

  volume?.addEventListener('input', () => {
    if (!(volume instanceof HTMLInputElement)) return;
    const value = Number(volume.value);
    syncVolumeReadout();
    if (audioGain && audioContext) {
      audioGain.gain.setTargetAtTime(value, audioContext.currentTime, 0.02);
    } else {
      audio.volume = Math.min(1, value);
    }
    if (synth) {
      synth.master.gain.setTargetAtTime(value * 0.42, synth.context.currentTime, 0.02);
    }
  });

  audio.addEventListener('playing', () => {
    stopSynth();
    setStatus(`正在播放：${tracks[index].title}`, 'playing');
    syncPlayState();
  });
  audio.addEventListener('pause', syncPlayState);
  audio.addEventListener('ended', () => setTrack(index + 1, true));
  audio.addEventListener('timeupdate', updateProgress);
  audio.addEventListener('loadedmetadata', updateProgress);
  audio.addEventListener('waiting', () => {
    if (wantsPlayback) setStatus('正在缓冲本地音轨...', 'loading');
  });
  audio.addEventListener('stalled', () => {
    if (wantsPlayback) setStatus('音频加载变慢，正在等待资源。', 'loading');
  });
  audio.addEventListener('error', async () => {
    if (wantsPlayback) {
      const started = await startFallbackSynth();
      if (!started) setStatus('音频加载失败，请检查浏览器声音权限。', 'error');
    } else {
      setStatus('音频加载失败，点击播放可启用备用音轨。', 'error');
    }
  });

  setTrack(0, false);
  syncVolumeReadout();
  toggle?.addEventListener('click', () => setOpen(dock.dataset.open !== 'true'));
  close?.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setOpen(false);
  });
  animateBars();
  window.addEventListener('beforeunload', () => {
    cancelAnimationFrame(visualFrame);
    stopSynth();
  });
}

initTheme();
initCursorGlow();
initSignalArt();
initArchive();
initGalaxyCanvas();
initReadProgress();
initAudioDock();
