const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed) {
  let state = seed || 1;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function setupTilt() {
  const target = document.querySelector('[data-console-tilt]');
  if (!target || reducedMotion) return;

  let raf = 0;
  let nextX = 0;
  let nextY = 0;

  target.addEventListener('pointermove', (event) => {
    const rect = target.getBoundingClientRect();
    nextX = clamp((event.clientX - rect.left) / rect.width - 0.5, -0.5, 0.5);
    nextY = clamp((event.clientY - rect.top) / rect.height - 0.5, -0.5, 0.5);

    if (!raf) {
      raf = requestAnimationFrame(() => {
        target.style.setProperty('--tilt-x', String(nextX));
        target.style.setProperty('--tilt-y', String(nextY));
        raf = 0;
      });
    }
  });

  target.addEventListener('pointerleave', () => {
    target.style.setProperty('--tilt-x', '0');
    target.style.setProperty('--tilt-y', '0');
  });
}

function setupStarfield() {
  const canvas = document.querySelector('[data-starfield]');
  if (!(canvas instanceof HTMLCanvasElement)) return;

  const context = canvas.getContext('2d', { alpha: true });
  if (!context) return;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let stars = [];
  let lastFrame = 0;
  let visible = true;
  let pointerX = 0;
  let pointerY = 0;
  const targetFps = reducedMotion ? 10 : 36;
  const frameGap = 1000 / targetFps;

  function makeStars(count) {
    const random = seededRandom(9147);
    stars = Array.from({ length: count }, () => ({
      x: random() * 2 - 1,
      y: random() * 2 - 1,
      z: 0.24 + random() * 1.35,
      speed: 0.18 + random() * 0.65,
      size: 0.65 + random() * 1.7,
      hue: random() > 0.72 ? 'amber' : random() > 0.54 ? 'green' : 'cyan',
    }));
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, Math.floor(rect.width));
    height = Math.max(1, Math.floor(rect.height));
    dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.2 : 1.5);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    const density = window.innerWidth < 700 ? 12500 : 9300;
    const count = reducedMotion
      ? 72
      : clamp(Math.round((width * height) / density), 92, window.innerWidth < 700 ? 140 : 230);
    makeStars(count);
  }

  function resetStar(star) {
    const random = Math.random;
    star.x = random() * 2 - 1;
    star.y = random() * 2 - 1;
    star.z = 1.45;
    star.speed = 0.18 + random() * 0.62;
    star.size = 0.65 + random() * 1.6;
  }

  function colorFor(hue, alpha) {
    if (hue === 'amber') return `rgba(255, 189, 99, ${alpha})`;
    if (hue === 'green') return `rgba(125, 255, 206, ${alpha})`;
    return `rgba(85, 215, 255, ${alpha})`;
  }

  function drawHud(time) {
    const centerX = width * (0.5 + pointerX * 0.018);
    const centerY = height * (0.48 + pointerY * 0.018);
    context.save();
    context.translate(centerX, centerY);
    context.strokeStyle = 'rgba(125, 255, 206, 0.16)';
    context.lineWidth = 1;
    for (let ring = 0; ring < 4; ring += 1) {
      const radius = 70 + ring * 76 + Math.sin(time * 0.0004 + ring) * 4;
      context.beginPath();
      context.arc(0, 0, radius, ring * 0.45, Math.PI * 1.45 + ring * 0.22);
      context.stroke();
    }
    context.strokeStyle = 'rgba(255, 189, 99, 0.18)';
    context.beginPath();
    context.moveTo(-width * 0.24, 0);
    context.lineTo(width * 0.24, 0);
    context.moveTo(0, -height * 0.18);
    context.lineTo(0, height * 0.18);
    context.stroke();
    context.restore();
  }

  function draw(time) {
    requestAnimationFrame(draw);
    if (!visible) return;
    if (time - lastFrame < frameGap) return;

    const delta = Math.min(48, time - lastFrame || frameGap);
    lastFrame = time;

    context.clearRect(0, 0, width, height);
    context.fillStyle = 'rgba(7, 10, 12, 0.34)';
    context.fillRect(0, 0, width, height);
    drawHud(time);

    const centerX = width * (0.5 + pointerX * 0.035);
    const centerY = height * (0.52 + pointerY * 0.035);

    for (const star of stars) {
      if (!reducedMotion) {
        star.z -= star.speed * delta * 0.00022;
      }
      if (star.z <= 0.16) resetStar(star);

      const scale = 1 / star.z;
      const x = centerX + star.x * width * 0.36 * scale;
      const y = centerY + star.y * height * 0.34 * scale;

      if (x < -40 || x > width + 40 || y < -40 || y > height + 40) {
        resetStar(star);
        continue;
      }

      const alpha = clamp(1.1 - star.z * 0.45, 0.22, 0.9);
      const size = star.size * scale;
      context.fillStyle = colorFor(star.hue, alpha);
      context.beginPath();
      context.arc(x, y, Math.min(3.4, size), 0, Math.PI * 2);
      context.fill();

      if (!reducedMotion && star.z < 0.72) {
        const tail = Math.min(42, (1 - star.z) * 48);
        context.strokeStyle = colorFor(star.hue, alpha * 0.32);
        context.lineWidth = Math.min(2, size * 0.55);
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x - star.x * tail, y - star.y * tail);
        context.stroke();
      }
    }
  }

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pointermove', (event) => {
    pointerX = clamp(event.clientX / window.innerWidth - 0.5, -0.5, 0.5);
    pointerY = clamp(event.clientY / window.innerHeight - 0.5, -0.5, 0.5);
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    visible = document.visibilityState === 'visible';
  });

  resize();
  requestAnimationFrame(draw);
}

function setupSignals() {
  const canvases = Array.from(document.querySelectorAll('[data-signal]'));
  if (!canvases.length) return;

  const palette = {
    cyan: [85, 215, 255],
    green: [125, 255, 206],
    amber: [255, 189, 99],
    magenta: [255, 107, 214],
  };

  const signals = canvases
    .filter((canvas) => canvas instanceof HTMLCanvasElement)
    .map((canvas) => {
      const seed = hashString(canvas.dataset.seed || 'signal');
      const random = seededRandom(seed);
      return {
        canvas,
        context: canvas.getContext('2d'),
        random,
        seed,
        active: false,
        last: 0,
        accent: palette[canvas.dataset.accent || 'cyan'] || palette.cyan,
        intensity: Number(canvas.dataset.intensity || 64),
        phase: random() * Math.PI * 2,
        bars: Array.from({ length: 26 }, () => 0.25 + random() * 0.75),
      };
    })
    .filter((signal) => signal.context);

  function resize(signal) {
    const rect = signal.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.4);
    signal.canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    signal.canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    signal.context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw(signal, time) {
    const { canvas, context, accent, intensity, phase, bars } = signal;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const [r, g, b] = accent;
    const pulse = reducedMotion ? 0 : time * 0.0012;

    context.clearRect(0, 0, width, height);
    context.fillStyle = 'rgba(3, 7, 8, 0.64)';
    context.fillRect(0, 0, width, height);

    context.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.16)`;
    context.lineWidth = 1;
    const grid = 24;
    for (let x = 0; x < width; x += grid) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }
    for (let y = 0; y < height; y += grid) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }

    const centerY = height * 0.52;
    context.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.86)`;
    context.lineWidth = 2;
    context.beginPath();
    for (let x = 0; x <= width; x += 4) {
      const waveA = Math.sin(x * 0.026 + phase + pulse) * (18 + intensity * 0.09);
      const waveB = Math.sin(x * 0.071 + phase * 0.7 - pulse * 0.7) * (8 + intensity * 0.035);
      const y = centerY + waveA + waveB;
      if (x === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.stroke();

    const barWidth = width / bars.length;
    bars.forEach((value, index) => {
      const dynamic = reducedMotion ? 0 : Math.sin(pulse * 1.8 + index * 0.75 + phase) * 0.18;
      const barHeight = (value + dynamic) * height * 0.32;
      const x = index * barWidth + barWidth * 0.22;
      const y = height - barHeight - 14;
      context.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.18 + value * 0.36})`;
      context.fillRect(x, y, Math.max(2, barWidth * 0.38), barHeight);
    });

    context.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    context.strokeRect(10, 10, width - 20, height - 20);
    context.fillStyle = `rgba(${r}, ${g}, ${b}, 0.84)`;
    context.fillRect(16, 16, Math.max(22, width * (0.16 + intensity / 250)), 3);
    context.fillStyle = 'rgba(255, 189, 99, 0.82)';
    context.fillRect(width - 58, height - 19, 42, 3);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const signal = signals.find((item) => item.canvas === entry.target);
      if (signal) signal.active = entry.isIntersecting;
    });
  }, { rootMargin: '120px' });

  signals.forEach((signal) => {
    resize(signal);
    draw(signal, 0);
    observer.observe(signal.canvas);
  });

  window.addEventListener('resize', () => {
    signals.forEach((signal) => {
      resize(signal);
      draw(signal, performance.now());
    });
  }, { passive: true });

  function loop(time) {
    requestAnimationFrame(loop);
    signals.forEach((signal) => {
      if (!signal.active && !reducedMotion) return;
      if (time - signal.last < 1000 / 24) return;
      signal.last = time;
      draw(signal, time);
    });
  }

  requestAnimationFrame(loop);
}

function setupFilters() {
  const bar = document.querySelector('[data-filter-bar]');
  const rows = Array.from(document.querySelectorAll('[data-tags]'));
  if (!bar || !rows.length) return;

  bar.addEventListener('click', (event) => {
    const button = event.target.closest('[data-filter]');
    if (!(button instanceof HTMLButtonElement)) return;

    const filter = button.dataset.filter || 'all';
    bar.querySelectorAll('[data-filter]').forEach((item) => item.classList.remove('is-active'));
    button.classList.add('is-active');

    rows.forEach((row) => {
      const tags = (row.getAttribute('data-tags') || '').split('|');
      row.hidden = filter !== 'all' && !tags.includes(filter);
    });
  });
}

function setupAudioLegacy() {
  const dock = document.querySelector('[data-audio-dock]');
  if (!dock) return;

  const toggle = dock.querySelector('[data-audio-toggle]');
  const panel = dock.querySelector('[data-audio-panel]');
  const playButton = dock.querySelector('[data-audio-play]');
  const volumeInput = dock.querySelector('[data-audio-volume]');
  const volumeReadout = dock.querySelector('[data-audio-volume-readout]');
  const trackSelect = dock.querySelector('[data-audio-track]');
  const stateLabel = dock.querySelector('[data-audio-state]');
  const scope = dock.querySelector('[data-audio-scope]');
  const scopeContext = scope instanceof HTMLCanvasElement ? scope.getContext('2d') : null;

  if (!(toggle instanceof HTMLButtonElement) || !(panel instanceof HTMLElement)) return;
  if (!(playButton instanceof HTMLButtonElement)) return;
  if (!(volumeInput instanceof HTMLInputElement) || !(trackSelect instanceof HTMLSelectElement)) return;

  let audioContext = null;
  let master = null;
  let analyser = null;
  let nodes = [];
  let playing = false;
  let scopeData = null;
  let scopeLast = 0;

  const tracks = {
    drive: { notes: [46.25, 92.5, 138.75], type: 'sawtooth', filter: 640, pulse: 0.09 },
    relay: { notes: [38.89, 77.78, 155.56], type: 'triangle', filter: 480, pulse: 0.06 },
    cascade: { notes: [65.41, 130.82, 261.63], type: 'sine', filter: 920, pulse: 0.13 },
  };

  function setPanel(open) {
    toggle.setAttribute('aria-expanded', String(open));
    panel.hidden = !open;
  }

  function updateVolume() {
    const value = Number(volumeInput.value);
    if (volumeReadout) volumeReadout.textContent = `${value}%`;
    if (!master || !audioContext) return;
    const target = playing ? Math.pow(value / 500, 1.08) * 0.68 : 0;
    master.gain.setTargetAtTime(target, audioContext.currentTime, 0.035);
  }

  function stopNodes() {
    nodes.forEach((node) => {
      try {
        if ('stop' in node) node.stop();
      } catch {
        // Nodes may already be stopped after a track switch.
      }
      try {
        node.disconnect();
      } catch {
        // Disconnection is best-effort for mixed node types.
      }
    });
    nodes = [];
  }

  function createNoiseBuffer(context) {
    const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) {
      data[index] = (Math.random() * 2 - 1) * 0.38;
    }
    return buffer;
  }

  function buildTrack() {
    if (!audioContext || !master) return;
    stopNodes();

    const selected = tracks[trackSelect.value] || tracks.drive;
    const filter = audioContext.createBiquadFilter();
    const lfo = audioContext.createOscillator();
    const lfoGain = audioContext.createGain();
    const bedGain = audioContext.createGain();
    const noiseGain = audioContext.createGain();
    const noiseFilter = audioContext.createBiquadFilter();
    const noise = audioContext.createBufferSource();

    filter.type = 'lowpass';
    filter.frequency.value = selected.filter;
    filter.Q.value = 7;

    lfo.frequency.value = selected.pulse;
    lfoGain.gain.value = selected.filter * 0.28;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    bedGain.gain.value = 0.12;
    selected.notes.forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = selected.type;
      oscillator.frequency.value = frequency;
      oscillator.detune.value = index === 1 ? 4 : index === 2 ? -7 : 0;
      gain.gain.value = index === 0 ? 0.18 : 0.07;
      oscillator.connect(gain);
      gain.connect(filter);
      oscillator.start();
      nodes.push(oscillator, gain);
    });

    noise.buffer = createNoiseBuffer(audioContext);
    noise.loop = true;
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = selected.filter * 1.35;
    noiseFilter.Q.value = 0.8;
    noiseGain.gain.value = 0.025;
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(filter);
    noise.start();

    filter.connect(bedGain);
    bedGain.connect(master);
    lfo.start();
    nodes.push(filter, lfo, lfoGain, bedGain, noiseGain, noiseFilter, noise);
  }

  function ensureAudio() {
    if (audioContext) return;
    audioContext = new AudioContext();
    master = audioContext.createGain();
    analyser = audioContext.createAnalyser();
    const compressor = audioContext.createDynamicsCompressor();

    analyser.fftSize = 512;
    scopeData = new Uint8Array(analyser.frequencyBinCount);

    compressor.threshold.value = -20;
    compressor.knee.value = 18;
    compressor.ratio.value = 6;
    compressor.attack.value = 0.006;
    compressor.release.value = 0.18;
    master.gain.value = 0;

    master.connect(analyser);
    analyser.connect(compressor);
    compressor.connect(audioContext.destination);
    buildTrack();
  }

  async function start() {
    ensureAudio();
    await audioContext.resume();
    playing = true;
    playButton.textContent = '暂停';
    if (stateLabel) stateLabel.textContent = '播放中';
    updateVolume();
  }

  function stop() {
    if (!audioContext || !master) return;
    playing = false;
    master.gain.setTargetAtTime(0, audioContext.currentTime, 0.04);
    playButton.textContent = '播放';
    if (stateLabel) stateLabel.textContent = '待播放';
  }

  function drawScope(time) {
    requestAnimationFrame(drawScope);
    if (!scopeContext || !(scope instanceof HTMLCanvasElement)) return;
    if (time - scopeLast < 1000 / 28) return;
    scopeLast = time;

    const width = scope.clientWidth;
    const height = scope.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.4);
    if (scope.width !== Math.floor(width * dpr) || scope.height !== Math.floor(height * dpr)) {
      scope.width = Math.floor(width * dpr);
      scope.height = Math.floor(height * dpr);
      scopeContext.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    scopeContext.clearRect(0, 0, width, height);
    scopeContext.fillStyle = 'rgba(4, 7, 8, 0.72)';
    scopeContext.fillRect(0, 0, width, height);
    scopeContext.strokeStyle = 'rgba(255, 189, 99, 0.18)';
    scopeContext.strokeRect(0.5, 0.5, width - 1, height - 1);

    scopeContext.strokeStyle = playing ? 'rgba(255, 189, 99, 0.9)' : 'rgba(154, 184, 178, 0.38)';
    scopeContext.lineWidth = 2;
    scopeContext.beginPath();

    if (playing && analyser && scopeData) {
      analyser.getByteTimeDomainData(scopeData);
      for (let index = 0; index < scopeData.length; index += 1) {
        const x = (index / (scopeData.length - 1)) * width;
        const y = (scopeData[index] / 255) * height;
        if (index === 0) scopeContext.moveTo(x, y);
        else scopeContext.lineTo(x, y);
      }
    } else {
      const y = height / 2 + Math.sin(time * 0.003) * 4;
      scopeContext.moveTo(0, y);
      scopeContext.lineTo(width, y);
    }

    scopeContext.stroke();
  }

  toggle.addEventListener('click', () => {
    setPanel(toggle.getAttribute('aria-expanded') !== 'true');
  });

  document.addEventListener('click', (event) => {
    if (!dock.contains(event.target)) setPanel(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setPanel(false);
  });

  playButton.addEventListener('click', () => {
    if (playing) stop();
    else start();
  });

  volumeInput.addEventListener('input', updateVolume);
  trackSelect.addEventListener('change', () => {
    if (audioContext) {
      buildTrack();
      updateVolume();
    }
  });

  updateVolume();
  requestAnimationFrame(drawScope);
}

function setupAudio() {
  const dock = document.querySelector('[data-audio-dock]');
  if (!dock) return;

  const toggle = dock.querySelector('[data-audio-toggle]');
  const panel = dock.querySelector('[data-audio-panel]');
  const playButton = dock.querySelector('[data-audio-play]');
  const volumeInput = dock.querySelector('[data-audio-volume]');
  const volumeReadout = dock.querySelector('[data-audio-volume-readout]');
  const trackSelect = dock.querySelector('[data-audio-track]');
  const stateLabel = dock.querySelector('[data-audio-state]');
  const trackNameLabel = dock.querySelector('[data-audio-track-name]');
  const beatLabel = dock.querySelector('[data-audio-beat]');
  const scope = dock.querySelector('[data-audio-scope]');
  const scopeContext = scope instanceof HTMLCanvasElement ? scope.getContext('2d') : null;

  if (!(toggle instanceof HTMLButtonElement) || !(panel instanceof HTMLElement)) return;
  if (!(playButton instanceof HTMLButtonElement)) return;
  if (!(volumeInput instanceof HTMLInputElement) || !(trackSelect instanceof HTMLSelectElement)) return;

  let audioContext = null;
  let master = null;
  let analyser = null;
  let toneFilter = null;
  let delay = null;
  let delayFeedback = null;
  let delaySend = null;
  let playing = false;
  let scheduler = 0;
  let stepIndex = 0;
  let nextStepTime = 0;
  let startedAt = 0;
  let scopeData = null;
  let scopeLast = 0;
  let scheduledNodes = [];

  const tracks = {
    starlight: {
      label: '星河慢放',
      bpm: 74,
      lead: 'sine',
      pad: 'triangle',
      bass: 'triangle',
      filter: 2600,
      delay: 0.32,
      feedback: 0.28,
      delayMix: 0.24,
      chords: [
        [261.63, 329.63, 392],
        [220, 277.18, 329.63],
        [246.94, 311.13, 369.99],
        [196, 261.63, 329.63],
      ],
      melody: [659.25, null, 587.33, null, 493.88, null, 523.25, 587.33, 659.25, null, 783.99, null, 739.99, 659.25, 587.33, null],
      bassline: [130.81, null, null, null, 110, null, null, null, 123.47, null, null, null, 98, null, null, null],
      kick: [0, 8],
      hat: [2, 6, 10, 14],
    },
    night: {
      label: '夜航节拍',
      bpm: 104,
      lead: 'square',
      pad: 'sawtooth',
      bass: 'sawtooth',
      filter: 1850,
      delay: 0.22,
      feedback: 0.2,
      delayMix: 0.18,
      chords: [
        [196, 261.63, 329.63],
        [174.61, 220, 293.66],
        [220, 277.18, 349.23],
        [164.81, 246.94, 329.63],
      ],
      melody: [392, 493.88, null, 523.25, 587.33, null, 523.25, 493.88, 440, null, 392, 440, 493.88, null, 587.33, 659.25],
      bassline: [98, null, 98, null, 87.31, null, 87.31, null, 110, null, 110, null, 82.41, null, 82.41, null],
      kick: [0, 4, 8, 12],
      hat: [2, 6, 10, 14],
    },
    piano: {
      label: '轨道钢琴',
      bpm: 86,
      lead: 'triangle',
      pad: 'sine',
      bass: 'sine',
      filter: 3200,
      delay: 0.38,
      feedback: 0.24,
      delayMix: 0.22,
      chords: [
        [293.66, 369.99, 440],
        [246.94, 329.63, 392],
        [261.63, 329.63, 493.88],
        [220, 293.66, 369.99],
      ],
      melody: [880, null, 739.99, 659.25, null, 587.33, 659.25, null, 739.99, 880, null, 987.77, 880, null, 739.99, 659.25],
      bassline: [146.83, null, null, 146.83, 123.47, null, null, 123.47, 130.81, null, null, 130.81, 110, null, null, 110],
      kick: [0, 8],
      hat: [4, 12],
    },
  };

  function selectedTrack() {
    return tracks[trackSelect.value] || tracks.starlight;
  }

  function setPanel(open) {
    toggle.setAttribute('aria-expanded', String(open));
    panel.hidden = !open;
  }

  function formatTime(value) {
    const seconds = Math.max(0, Math.floor(value));
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }

  function updateTrackLabels() {
    const track = selectedTrack();
    if (trackNameLabel) trackNameLabel.textContent = track.label;
    if (beatLabel) {
      const elapsed = playing && audioContext ? audioContext.currentTime - startedAt : 0;
      beatLabel.textContent = formatTime(elapsed);
    }
  }

  function updateVolume() {
    const value = Number(volumeInput.value);
    if (volumeReadout) volumeReadout.textContent = `${value}%`;
    if (!master || !audioContext) return;
    const target = playing ? Math.pow(value / 350, 1.04) * 0.95 : 0;
    master.gain.setTargetAtTime(target, audioContext.currentTime, 0.035);
  }

  function disconnectNode(node) {
    try {
      node.disconnect();
    } catch {
      // Some nodes are already disconnected after their envelope ends.
    }
  }

  function stopScheduledNodes() {
    scheduledNodes.forEach((node) => {
      try {
        if ('stop' in node) node.stop();
      } catch {
        // Scheduled audio sources can already be stopped.
      }
      disconnectNode(node);
    });
    scheduledNodes = [];
  }

  function createNoiseBuffer(context) {
    const buffer = context.createBuffer(1, Math.floor(context.sampleRate * 0.08), context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) {
      data[index] = (Math.random() * 2 - 1) * 0.5;
    }
    return buffer;
  }

  function createTone(frequency, startTime, duration, type, level, detune = 0, sendAmount = 0.15) {
    if (!audioContext || !toneFilter) return;

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);
    oscillator.detune.setValueAtTime(detune, startTime);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(level, startTime + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    oscillator.connect(gain);
    gain.connect(toneFilter);

    if (delaySend && sendAmount > 0) {
      const send = audioContext.createGain();
      send.gain.value = sendAmount;
      gain.connect(send);
      send.connect(delaySend);
      scheduledNodes.push(send);
    }

    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.04);
    oscillator.addEventListener('ended', () => {
      disconnectNode(oscillator);
      disconnectNode(gain);
    }, { once: true });
    scheduledNodes.push(oscillator, gain);
  }

  function createKick(startTime) {
    if (!audioContext || !toneFilter) return;

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(118, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(44, startTime + 0.16);
    gain.gain.setValueAtTime(0.42, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.18);
    oscillator.connect(gain);
    gain.connect(toneFilter);
    oscillator.start(startTime);
    oscillator.stop(startTime + 0.2);
    oscillator.addEventListener('ended', () => {
      disconnectNode(oscillator);
      disconnectNode(gain);
    }, { once: true });
    scheduledNodes.push(oscillator, gain);
  }

  function createHat(startTime) {
    if (!audioContext || !toneFilter) return;

    const noise = audioContext.createBufferSource();
    const filter = audioContext.createBiquadFilter();
    const gain = audioContext.createGain();
    noise.buffer = createNoiseBuffer(audioContext);
    filter.type = 'highpass';
    filter.frequency.value = 5200;
    gain.gain.setValueAtTime(0.08, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.055);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(toneFilter);
    noise.start(startTime);
    noise.stop(startTime + 0.06);
    noise.addEventListener('ended', () => {
      disconnectNode(noise);
      disconnectNode(filter);
      disconnectNode(gain);
    }, { once: true });
    scheduledNodes.push(noise, filter, gain);
  }

  function configureEffects() {
    if (!audioContext || !toneFilter || !delay || !delayFeedback || !delaySend) return;

    const track = selectedTrack();
    toneFilter.frequency.setTargetAtTime(track.filter, audioContext.currentTime, 0.04);
    toneFilter.Q.setTargetAtTime(trackSelect.value === 'night' ? 5 : 2.2, audioContext.currentTime, 0.04);
    delay.delayTime.setTargetAtTime(track.delay, audioContext.currentTime, 0.04);
    delayFeedback.gain.setTargetAtTime(track.feedback, audioContext.currentTime, 0.04);
    delaySend.gain.setTargetAtTime(track.delayMix, audioContext.currentTime, 0.04);
  }

  function ensureAudio() {
    if (audioContext) return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    audioContext = new AudioContextClass();
    master = audioContext.createGain();
    analyser = audioContext.createAnalyser();
    toneFilter = audioContext.createBiquadFilter();
    delay = audioContext.createDelay(1);
    delayFeedback = audioContext.createGain();
    delaySend = audioContext.createGain();
    const compressor = audioContext.createDynamicsCompressor();

    analyser.fftSize = 512;
    scopeData = new Uint8Array(analyser.frequencyBinCount);
    toneFilter.type = 'lowpass';
    toneFilter.frequency.value = 2400;
    toneFilter.Q.value = 2.2;
    delay.delayTime.value = 0.28;
    delayFeedback.gain.value = 0.22;
    delaySend.gain.value = 0.18;
    compressor.threshold.value = -18;
    compressor.knee.value = 20;
    compressor.ratio.value = 5;
    compressor.attack.value = 0.006;
    compressor.release.value = 0.16;
    master.gain.value = 0;

    toneFilter.connect(master);
    delaySend.connect(delay);
    delay.connect(delayFeedback);
    delayFeedback.connect(delay);
    delay.connect(master);
    master.connect(analyser);
    analyser.connect(compressor);
    compressor.connect(audioContext.destination);
    configureEffects();
  }

  function scheduleStep(time) {
    const track = selectedTrack();
    const stepDuration = 60 / track.bpm / 2;
    const index = stepIndex % 16;

    if (index % 4 === 0) {
      const chord = track.chords[Math.floor(index / 4) % track.chords.length];
      chord.forEach((frequency, chordIndex) => {
        createTone(frequency, time, stepDuration * 3.4, track.pad, 0.048, chordIndex * 5 - 5, 0.2);
      });
    }

    const bass = track.bassline[index];
    if (bass) createTone(bass, time, stepDuration * 1.45, track.bass, 0.16, 0, 0.06);

    const melody = track.melody[index];
    if (melody) createTone(melody, time + stepDuration * 0.04, stepDuration * 0.72, track.lead, 0.095, 0, 0.34);

    if (track.kick.includes(index)) createKick(time);
    if (track.hat.includes(index)) createHat(time + stepDuration * 0.02);

    stepIndex += 1;
    nextStepTime += stepDuration;
  }

  function runScheduler() {
    if (!audioContext || !playing) return;
    const lookAhead = audioContext.currentTime + 0.18;
    while (nextStepTime < lookAhead) scheduleStep(nextStepTime);
    updateTrackLabels();
  }

  function resetSequence() {
    if (!audioContext) return;
    stopScheduledNodes();
    configureEffects();
    stepIndex = 0;
    nextStepTime = audioContext.currentTime + 0.04;
    updateTrackLabels();
  }

  async function start() {
    ensureAudio();
    if (!audioContext || !master) return;

    await audioContext.resume();
    playing = true;
    startedAt = audioContext.currentTime;
    resetSequence();
    window.clearInterval(scheduler);
    scheduler = window.setInterval(runScheduler, 70);
    runScheduler();
    playButton.textContent = '暂停';
    if (stateLabel) stateLabel.textContent = '播放中';
    updateVolume();
  }

  function stop() {
    if (!audioContext || !master) return;
    playing = false;
    window.clearInterval(scheduler);
    master.gain.setTargetAtTime(0, audioContext.currentTime, 0.04);
    stopScheduledNodes();
    playButton.textContent = '播放';
    if (stateLabel) stateLabel.textContent = '待播放';
    updateTrackLabels();
  }

  function drawScope(time) {
    requestAnimationFrame(drawScope);
    if (!scopeContext || !(scope instanceof HTMLCanvasElement)) return;
    if (time - scopeLast < 1000 / 28) return;
    scopeLast = time;

    const width = scope.clientWidth;
    const height = scope.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.4);
    if (scope.width !== Math.floor(width * dpr) || scope.height !== Math.floor(height * dpr)) {
      scope.width = Math.floor(width * dpr);
      scope.height = Math.floor(height * dpr);
      scopeContext.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    scopeContext.clearRect(0, 0, width, height);
    scopeContext.fillStyle = 'rgba(4, 7, 8, 0.72)';
    scopeContext.fillRect(0, 0, width, height);
    scopeContext.strokeStyle = 'rgba(255, 189, 99, 0.18)';
    scopeContext.strokeRect(0.5, 0.5, width - 1, height - 1);
    scopeContext.strokeStyle = playing ? 'rgba(255, 189, 99, 0.9)' : 'rgba(154, 184, 178, 0.38)';
    scopeContext.lineWidth = 2;
    scopeContext.beginPath();

    if (playing && analyser && scopeData) {
      analyser.getByteTimeDomainData(scopeData);
      for (let index = 0; index < scopeData.length; index += 1) {
        const x = (index / (scopeData.length - 1)) * width;
        const y = (scopeData[index] / 255) * height;
        if (index === 0) scopeContext.moveTo(x, y);
        else scopeContext.lineTo(x, y);
      }
    } else {
      const y = height / 2 + Math.sin(time * 0.003) * 4;
      scopeContext.moveTo(0, y);
      scopeContext.lineTo(width, y);
    }

    scopeContext.stroke();
  }

  toggle.addEventListener('click', () => {
    setPanel(toggle.getAttribute('aria-expanded') !== 'true');
  });

  document.addEventListener('click', (event) => {
    if (!dock.contains(event.target)) setPanel(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setPanel(false);
  });

  playButton.addEventListener('click', () => {
    if (playing) stop();
    else start().catch(() => stop());
  });

  volumeInput.addEventListener('input', updateVolume);
  trackSelect.addEventListener('change', () => {
    updateTrackLabels();
    if (audioContext) {
      resetSequence();
      if (playing) runScheduler();
    }
  });

  updateVolume();
  updateTrackLabels();
  requestAnimationFrame(drawScope);
}

setupTilt();
setupStarfield();
setupSignals();
setupFilters();
setupAudio();
