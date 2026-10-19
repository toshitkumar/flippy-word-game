/**
 * FLIPPY WORDS - Infinite Arcade Word Flight (Enhanced Edition)
 * Hybrid Flappy Bird + Word Spelling Mechanics + Power-ups & Floating FX
 */

// --- Anti-Tamper & State Protection Helper ---
const AntiCheat = {
  _salt: 'FLIPPY_SALT_984321',
  encode(data) {
    const jsonStr = JSON.stringify(data);
    let out = '';
    for (let i = 0; i < jsonStr.length; i++) {
      out += String.fromCharCode(jsonStr.charCodeAt(i) ^ this._salt.charCodeAt(i % this._salt.length));
    }
    return btoa(out);
  },
  decode(cipher) {
    try {
      const raw = atob(cipher);
      let out = '';
      for (let i = 0; i < raw.length; i++) {
        out += String.fromCharCode(raw.charCodeAt(i) ^ this._salt.charCodeAt(i % this._salt.length));
      }
      return JSON.parse(out);
    } catch (e) {
      return null;
    }
  }
};

// --- Web Audio Synthesizer with Procedural BGM (Zero External Assets) ---
class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.bgmTimer = null;
    this.bgmStep = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.startBGM();
  }

  startBGM() {
    if (this.bgmTimer) return;
    // Cheerful 8-step chord arpeggio loop (C - G - Am - F progression)
    const chords = [
      [261.63, 329.63, 392.00], // C
      [196.00, 246.94, 293.66], // G
      [220.00, 261.63, 329.63], // Am
      [174.61, 220.00, 261.63]  // F
    ];

    this.bgmTimer = setInterval(() => {
      if (!this.enabled || !this.ctx || this.ctx.state !== 'running') return;
      const chordIndex = Math.floor(this.bgmStep / 2) % chords.length;
      const noteIndex = this.bgmStep % chords[chordIndex].length;
      const freq = chords[chordIndex][noteIndex];
      this.playPluckNote(freq * 1.5, 0.04);
      this.bgmStep++;
    }, 280);
  }

  playPluckNote(freq, volume) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  playFlap() {
    if (!this.enabled || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(260 + Math.random() * 40, now);
    osc.frequency.exponentialRampToValueAtTime(540, now + 0.14);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  playCollect() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);
      gain.gain.setValueAtTime(0.28, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.04 + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.28);
    });
  }

  playShield() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.linearRampToValueAtTime(800, now + 0.3);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  playWrong() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(70, now + 0.25);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  playCrash() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.35;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.exponentialRampToValueAtTime(40, now + 0.35);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    whiteNoise.start(now);
  }

  playLevelUp() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880, 1108.73];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      gain.gain.setValueAtTime(0.32, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.07 + 0.32);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.32);
    });
  }
}

// --- Word Bank & Infinite Level Generator ---
const WORD_VAULT = {
  tier1: ['CAT', 'SUN', 'FLY', 'SKY', 'FOX', 'OWL', 'BEE', 'RUN', 'AIR', 'JOY', 'GEM', 'TOP', 'BAT', 'CUP', 'RED'],
  tier2: ['BIRD', 'WING', 'STAR', 'BLUE', 'WIND', 'GOLD', 'HERO', 'FAST', 'MOON', 'LUCK', 'PEAK', 'LEAP', 'DAWN', 'ROAR', 'GLOW'],
  tier3: ['CLOUD', 'MAGIC', 'FLIGHT', 'BRAVE', 'STORM', 'SHINE', 'EAGLE', 'SWIFT', 'LIGHT', 'RIVER', 'CROWN', 'SPARK', 'FLASH', 'SPACE', 'DREAM'],
  tier4: ['FALCON', 'GALAXY', 'PHOENIX', 'THUNDER', 'LEGEND', 'VICTORY', 'FEATHER', 'HORIZON', 'CRYSTAL', 'DRAGON', 'SHADOW', 'COSMIC']
};

class LevelManager {
  constructor() {
    this.currentLevel = 1;
    this.wordsSolved = 0;
  }

  getWordForLevel(level) {
    let pool;
    if (level <= 5) {
      pool = WORD_VAULT.tier1;
    } else if (level <= 15) {
      pool = WORD_VAULT.tier2;
    } else if (level <= 30) {
      pool = WORD_VAULT.tier3;
    } else {
      pool = WORD_VAULT.tier4;
    }
    const idx = (level - 1) % pool.length;
    return pool[idx];
  }

  getDifficultyConfig(level) {
    // Highly balanced progression: friendly start, gradual speed up
    const baseSpeed = 2.0;
    const speedBoost = Math.min(1.6, (level - 1) * 0.05);
    const pipeGap = Math.max(160, 205 - Math.min(45, (level - 1) * 1.2));
    const pipeInterval = Math.max(115, 150 - Math.min(30, (level - 1) * 0.7));
    return {
      scrollSpeed: baseSpeed + speedBoost,
      pipeGap: pipeGap,
      pipeInterval: pipeInterval
    };
  }
}

// --- Particle & Floating Text FX Engine ---
class FXEngine {
  constructor() {
    this.particles = [];
    this.floatingTexts = [];
  }

  spawnBurst(x, y, color, count = 16) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1.2;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 3.5 + 2,
        color: color,
        alpha: 1,
        life: 1,
        decay: Math.random() * 0.03 + 0.02
      });
    }
  }

  spawnDustTrail(x, y) {
    this.particles.push({
      x: x + (Math.random() - 0.5) * 6,
      y: y + (Math.random() - 0.5) * 6,
      vx: -(Math.random() * 1.5 + 0.8),
      vy: (Math.random() - 0.5) * 0.6,
      radius: Math.random() * 3 + 1.5,
      color: 'rgba(255, 255, 255, 0.8)',
      alpha: 0.8,
      life: 1,
      decay: 0.04
    });
  }

  spawnConfetti(width, height) {
    const colors = ['#ffd600', '#ff4081', '#00e676', '#00b0ff', '#ff9100', '#e040fb'];
    for (let i = 0; i < 75; i++) {
      this.particles.push({
        x: Math.random() * width,
        y: -20,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3 + 2,
        radius: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 1,
        decay: 0.007,
        isConfetti: true,
        rot: Math.random() * Math.PI,
        vrot: (Math.random() - 0.5) * 0.25
      });
    }
  }

  addFloatingText(x, y, text, color = '#ffd600') {
    this.floatingTexts.push({
      x: x,
      y: y,
      text: text,
      color: color,
      alpha: 1,
      vy: -1.4,
      scale: 1.2
    });
  }

  update() {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      if (p.isConfetti) {
        p.rot += p.vrot;
      }
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.alpha -= 0.022;
      ft.scale = Math.max(1, ft.scale - 0.01);
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  render(ctx) {
    ctx.save();
    // Render particles
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      if (p.isConfetti) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillRect(-p.radius, -p.radius / 2, p.radius * 2, p.radius);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Render floating texts
    for (const ft of this.floatingTexts) {
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.font = '900 18px "Fredoka One", sans-serif';
      ctx.fillStyle = ft.color;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.7)';
      ctx.shadowBlur = 6;
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.restore();
  }
}

// --- Main Game Engine ---
class FlippyWordGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.sound = new SoundManager();
    this.levelMgr = new LevelManager();
    this.fx = new FXEngine();

    // DOM Elements
    this.ui = {
      levelDisplay: document.getElementById('level-display'),
      scoreDisplay: document.getElementById('score-display'),
      wordSlots: document.getElementById('word-slots'),
      livesDisplay: document.getElementById('lives-display'),
      shieldIndicator: document.getElementById('shield-indicator'),
      screenStart: document.getElementById('screen-start'),
      screenLevelComplete: document.getElementById('screen-level-complete'),
      screenGameOver: document.getElementById('screen-game-over'),
      screenPause: document.getElementById('screen-pause'),
      startHighScore: document.getElementById('start-high-score'),
      completedWord: document.getElementById('completed-word'),
      rewardPts: document.getElementById('reward-pts'),
      streakPts: document.getElementById('streak-pts'),
      finalScore: document.getElementById('final-score'),
      finalHighScore: document.getElementById('final-high-score'),
      finalLevel: document.getElementById('final-level'),
      finalWordsCount: document.getElementById('final-words-count'),
      btnPlay: document.getElementById('btn-play'),
      btnPause: document.getElementById('btn-pause'),
      btnResume: document.getElementById('btn-resume'),
      btnRestart: document.getElementById('btn-restart'),
      btnNextLevel: document.getElementById('btn-next-level'),
      btnRetry: document.getElementById('btn-retry'),
      btnSoundToggle: document.getElementById('btn-sound-toggle'),
      screenBuy: document.getElementById('screen-buy'),
      btnOpenBuy: document.getElementById('btn-open-buy'),
      btnCloseBuy: document.getElementById('btn-close-buy')
    };

    // State Variables
    this.state = 'START';
    this.score = 0;
    this.highScore = 0;
    this.lives = 3;
    this.shieldActive = false;
    this.currentLevel = 1;
    this.targetWord = '';
    this.letterIndex = 0;
    this.wordsCompletedInRun = 0;

    // Bird Properties: Ultra-responsive, buoyant, floaty physics
    this.bird = {
      x: 75,
      y: 250,
      radius: 19,
      velocity: 0,
      gravity: 0.16,      // Gentle gravity gives plenty of reaction time
      jumpForce: -4.2,    // Soft, natural flap
      maxFallSpeed: 3.6,  // Hard terminal velocity cap prevents plummeting
      rotation: 0,
      targetRotation: 0,
      wingTimer: 0,
      blinkTimer: 0,
      isBlinking: false
    };

    // World Elements
    this.pipes = [];
    this.letterBubbles = [];
    this.clouds = [];
    this.hills = [];
    this.groundY = 0;
    this.groundOffset = 0;
    this.hillsOffset = 0;
    this.frameCounter = 0;
    this.screenShake = 0;

    this.loadSaveData();
    this.setupResize();
    this.bindEvents();
    this.initBackgroundLayers();

    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  loadSaveData() {
    const raw = localStorage.getItem('__FLIPPY_SAVE__');
    if (raw) {
      const data = AntiCheat.decode(raw);
      if (data && typeof data.highScore === 'number') {
        this.highScore = data.highScore;
        this.ui.startHighScore.textContent = this.highScore;
      }
    }
  }

  saveGameData() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
    }
    const data = {
      highScore: this.highScore,
      timestamp: Date.now()
    };
    localStorage.setItem('__FLIPPY_SAVE__', AntiCheat.encode(data));
  }

  setupResize() {
    const resize = () => {
      const rect = this.canvas.parentElement.getBoundingClientRect();
      this.canvas.width = rect.width;
      this.canvas.height = rect.height;
      this.groundY = this.canvas.height - 65;
    };
    window.addEventListener('resize', resize);
    resize();
  }

  initBackgroundLayers() {
    this.clouds = [];
    for (let i = 0; i < 7; i++) {
      this.clouds.push({
        x: Math.random() * (this.canvas.width || 420),
        y: Math.random() * 200 + 35,
        speed: Math.random() * 0.35 + 0.15,
        scale: Math.random() * 0.5 + 0.7
      });
    }
  }

  setupLevel(level) {
    this.currentLevel = level;
    this.targetWord = this.levelMgr.getWordForLevel(level);
    this.letterIndex = 0;
    this.ui.levelDisplay.textContent = this.currentLevel;

    // Reset Word Slots
    this.ui.wordSlots.innerHTML = '';
    for (let i = 0; i < this.targetWord.length; i++) {
      const slot = document.createElement('div');
      slot.className = 'slot' + (i === 0 ? ' current-target' : '');
      slot.id = `slot-${i}`;
      slot.textContent = i === 0 ? this.targetWord[i] : '?';
      this.ui.wordSlots.appendChild(slot);
    }

    this.pipes = [];
    this.letterBubbles = [];
    this.frameCounter = 0;
  }

  startNewGame() {
    this.sound.init();
    this.score = 0;
    this.lives = 3;
    this.shieldActive = false;
    this.updateShieldUI();
    this.wordsCompletedInRun = 0;
    this.updateLivesDisplay();
    this.ui.scoreDisplay.textContent = '0';
    
    this.bird.y = this.canvas.height * 0.4;
    this.bird.velocity = 0;
    this.bird.rotation = 0;

    this.setupLevel(1);
    this.setScreen('NONE');
    this.state = 'PLAYING';
  }

  resumeAfterLevelComplete() {
    this.setupLevel(this.currentLevel + 1);
    this.bird.y = this.canvas.height * 0.4;
    this.bird.velocity = 0;
    this.setScreen('NONE');
    this.state = 'PLAYING';
  }

  flap() {
    if (this.state === 'PLAYING') {
      this.bird.velocity = this.bird.jumpForce;
      this.sound.playFlap();
      this.fx.spawnBurst(this.bird.x - 12, this.bird.y + 8, '#ffffff', 6);
    }
  }

  updateLivesDisplay() {
    const hearts = this.ui.livesDisplay.querySelectorAll('.heart');
    hearts.forEach((h, idx) => {
      if (idx < this.lives) {
        h.classList.remove('lost');
      } else {
        h.classList.add('lost');
      }
    });
  }

  updateShieldUI() {
    if (this.ui.shieldIndicator) {
      if (this.shieldActive) {
        this.ui.shieldIndicator.classList.remove('hidden');
      } else {
        this.ui.shieldIndicator.classList.add('hidden');
      }
    }
  }

  setScreen(name) {
    this.ui.screenStart.classList.remove('active');
    this.ui.screenLevelComplete.classList.remove('active');
    this.ui.screenGameOver.classList.remove('active');
    this.ui.screenPause.classList.remove('active');
    if (this.ui.screenBuy) this.ui.screenBuy.classList.remove('active');

    if (name === 'START') this.ui.screenStart.classList.add('active');
    if (name === 'LEVEL_COMPLETE') this.ui.screenLevelComplete.classList.add('active');
    if (name === 'GAMEOVER') this.ui.screenGameOver.classList.add('active');
    if (name === 'PAUSE') this.ui.screenPause.classList.add('active');
    if (name === 'BUY' && this.ui.screenBuy) this.ui.screenBuy.classList.add('active');
  }

  bindEvents() {
    const triggerFlap = (e) => {
      if (e.target.closest('button') || e.target.closest('a')) return;
      e.preventDefault();
      this.flap();
    };

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        this.flap();
      }
    });

    this.canvas.addEventListener('mousedown', triggerFlap);
    this.canvas.addEventListener('touchstart', triggerFlap, { passive: false });

    this.ui.btnPlay.addEventListener('click', () => this.startNewGame());
    this.ui.btnRetry.addEventListener('click', () => this.startNewGame());
    this.ui.btnNextLevel.addEventListener('click', () => this.resumeAfterLevelComplete());

    if (this.ui.btnOpenBuy) {
      this.ui.btnOpenBuy.addEventListener('click', (e) => {
        e.stopPropagation();
        this.setScreen('BUY');
      });
    }

    if (this.ui.btnCloseBuy) {
      this.ui.btnCloseBuy.addEventListener('click', (e) => {
        e.stopPropagation();
        this.setScreen('START');
      });
    }

    this.ui.btnPause.addEventListener('click', () => {
      if (this.state === 'PLAYING') {
        this.state = 'PAUSED';
        this.setScreen('PAUSE');
      }
    });

    this.ui.btnResume.addEventListener('click', () => {
      if (this.state === 'PAUSED') {
        this.state = 'PLAYING';
        this.setScreen('NONE');
      }
    });

    this.ui.btnRestart.addEventListener('click', () => {
      this.startNewGame();
    });

    this.ui.btnSoundToggle.addEventListener('click', () => {
      this.sound.enabled = !this.sound.enabled;
      this.ui.btnSoundToggle.textContent = this.sound.enabled ? '🔊 SOUND: ON' : '🔇 SOUND: OFF';
    });
  }

  spawnPipesAndLetters() {
    const diff = this.levelMgr.getDifficultyConfig(this.currentLevel);
    const minHeight = 65;
    const maxHeight = this.groundY - diff.pipeGap - minHeight;
    const topHeight = Math.floor(Math.random() * (maxHeight - minHeight)) + minHeight;
    const bottomY = topHeight + diff.pipeGap;
    const bottomHeight = this.groundY - bottomY;

    // Add Pipe Pair
    const pipeX = this.canvas.width + 40;
    this.pipes.push({
      x: pipeX,
      width: 60,
      topHeight: topHeight,
      bottomY: bottomY,
      bottomHeight: bottomHeight,
      passed: false
    });

    // 10% chance to spawn a Shield Powerup if not active
    if (!this.shieldActive && Math.random() < 0.12) {
      this.letterBubbles.push({
        x: pipeX + 115,
        y: topHeight + diff.pipeGap / 2,
        char: '🛡️',
        isPowerup: true,
        powerType: 'SHIELD',
        radius: 20,
        floatOffset: Math.random() * Math.PI * 2,
        collected: false
      });
      return;
    }

    // Spawn Letter Bubble
    const targetLetter = this.targetWord[this.letterIndex];
    const isTarget = Math.random() < 0.70; // 70% chance of target letter
    let charToSpawn = targetLetter;
    if (!isTarget) {
      const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      do {
        charToSpawn = alpha[Math.floor(Math.random() * alpha.length)];
      } while (charToSpawn === targetLetter);
    }

    const bubbleY = topHeight + diff.pipeGap / 2 + (Math.random() - 0.5) * 32;
    this.letterBubbles.push({
      x: pipeX + 115,
      y: bubbleY,
      char: charToSpawn,
      isTarget: charToSpawn === targetLetter,
      isPowerup: false,
      radius: 20,
      floatOffset: Math.random() * Math.PI * 2,
      collected: false
    });
  }

  onLetterCollected(bubble) {
    bubble.collected = true;

    // Handle Shield Powerup
    if (bubble.isPowerup && bubble.powerType === 'SHIELD') {
      this.sound.playShield();
      this.shieldActive = true;
      this.updateShieldUI();
      this.fx.spawnBurst(bubble.x, bubble.y, '#00e5ff', 30);
      this.fx.addFloatingText(bubble.x, bubble.y - 15, 'SHIELD ACTIVATED! 🛡️', '#00e5ff');
      return;
    }

    const neededLetter = this.targetWord[this.letterIndex];

    if (bubble.char === neededLetter) {
      // Correct Letter!
      this.sound.playCollect();
      this.score += 150;
      this.ui.scoreDisplay.textContent = this.score;
      this.fx.spawnBurst(bubble.x, bubble.y, '#ffd600', 30);
      this.fx.addFloatingText(bubble.x, bubble.y - 15, `+150! [${neededLetter}]`, '#ffd600');

      // Update Slot in HUD
      const slot = document.getElementById(`slot-${this.letterIndex}`);
      if (slot) {
        slot.textContent = neededLetter;
        slot.classList.remove('current-target');
        slot.classList.add('filled');
      }

      this.letterIndex++;

      // Check if Word Completed!
      if (this.letterIndex >= this.targetWord.length) {
        this.triggerLevelComplete();
      } else {
        const nextSlot = document.getElementById(`slot-${this.letterIndex}`);
        if (nextSlot) {
          nextSlot.textContent = this.targetWord[this.letterIndex];
          nextSlot.classList.add('current-target');
        }
      }
    } else {
      // Wrong Letter! Check if Shield protects
      if (this.shieldActive) {
        this.sound.playCrash();
        this.shieldActive = false;
        this.updateShieldUI();
        this.fx.spawnBurst(this.bird.x, this.bird.y, '#00e5ff', 25);
        this.fx.addFloatingText(this.bird.x, this.bird.y - 20, 'SHIELD BROKEN!', '#00e5ff');
      } else {
        this.sound.playWrong();
        this.screenShake = 12;
        this.lives--;
        this.updateLivesDisplay();
        this.fx.spawnBurst(bubble.x, bubble.y, '#f44336', 22);
        this.fx.addFloatingText(bubble.x, bubble.y - 15, '-1 LIFE! ❌', '#f44336');

        if (this.lives <= 0) {
          this.triggerGameOver('Wrong Letter Crashed!');
        }
      }
    }
  }

  triggerLevelComplete() {
    this.sound.playLevelUp();
    this.state = 'LEVEL_COMPLETE';
    this.wordsCompletedInRun++;
    const reward = 500 + this.currentLevel * 50;
    const streak = this.wordsCompletedInRun * 100;
    this.score += reward + streak;
    this.ui.scoreDisplay.textContent = this.score;
    this.saveGameData();

    this.fx.spawnConfetti(this.canvas.width, this.canvas.height);

    this.ui.completedWord.textContent = this.targetWord;
    this.ui.rewardPts.textContent = reward;
    this.ui.streakPts.textContent = streak;
    this.setScreen('LEVEL_COMPLETE');
  }

  triggerGameOver(reason) {
    this.sound.playCrash();
    this.state = 'GAMEOVER';
    this.screenShake = 18;
    this.saveGameData();

    this.ui.finalScore.textContent = this.score;
    this.ui.finalHighScore.textContent = this.highScore;
    this.ui.finalLevel.textContent = this.currentLevel;
    this.ui.finalWordsCount.textContent = this.wordsCompletedInRun;
    this.setScreen('GAMEOVER');
  }

  // --- Main Update Loop ---
  update(dt) {
    if (this.screenShake > 0) {
      this.screenShake *= 0.9;
      if (this.screenShake < 0.5) this.screenShake = 0;
    }

    // Parallax Clouds
    for (const c of this.clouds) {
      c.x -= c.speed;
      if (c.x < -100) c.x = this.canvas.width + 50;
    }

    if (this.state !== 'PLAYING') return;

    const diff = this.levelMgr.getDifficultyConfig(this.currentLevel);

    // Bird Physics (Smooth, floaty glide)
    this.bird.velocity += this.bird.gravity;
    if (this.bird.velocity > this.bird.maxFallSpeed) {
      this.bird.velocity = this.bird.maxFallSpeed;
    }
    this.bird.y += this.bird.velocity;

    // Smooth Lerp Rotation
    this.bird.targetRotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 5, (this.bird.velocity * 3.2) * Math.PI / 180));
    this.bird.rotation += (this.bird.targetRotation - this.bird.rotation) * 0.15;
    this.bird.wingTimer += 0.22;

    // Blinking animation logic
    this.bird.blinkTimer += dt;
    if (this.bird.blinkTimer > 3.5) {
      this.bird.isBlinking = true;
      if (this.bird.blinkTimer > 3.65) {
        this.bird.isBlinking = false;
        this.bird.blinkTimer = 0;
      }
    }

    // Spawn tiny dust sparkles behind bird
    if (this.frameCounter % 6 === 0) {
      this.fx.spawnDustTrail(this.bird.x - 14, this.bird.y);
    }

    // Ground & Ceiling Collisions
    if (this.bird.y + this.bird.radius >= this.groundY) {
      this.bird.y = this.groundY - this.bird.radius;
      if (this.shieldActive) {
        this.shieldActive = false;
        this.updateShieldUI();
        this.bird.velocity = -4.5; // Bounce off ground
        this.fx.addFloatingText(this.bird.x, this.bird.y - 20, 'SHIELD SAVED YOU! 🛡️', '#00e5ff');
      } else {
        this.triggerGameOver('Ground Hit');
        return;
      }
    }
    if (this.bird.y - this.bird.radius <= 0) {
      this.bird.y = this.bird.radius;
      this.bird.velocity = 0;
    }

    // Spawn Obstacles
    this.frameCounter++;
    if (this.frameCounter % diff.pipeInterval === 0) {
      this.spawnPipesAndLetters();
    }

    // Update Pipes
    for (let i = this.pipes.length - 1; i >= 0; i--) {
      const p = this.pipes[i];
      p.x -= diff.scrollSpeed;

      // Pipe clearance points
      if (!p.passed && p.x + p.width < this.bird.x) {
        p.passed = true;
        this.score += 10;
        this.ui.scoreDisplay.textContent = this.score;
      }

      // Check Bird-Pipe Collision
      const bLeft = this.bird.x - this.bird.radius + 3;
      const bRight = this.bird.x + this.bird.radius - 3;
      const bTop = this.bird.y - this.bird.radius + 3;
      const bBottom = this.bird.y + this.bird.radius - 3;

      if (bRight > p.x && bLeft < p.x + p.width) {
        if (bTop < p.topHeight || bBottom > p.bottomY) {
          if (this.shieldActive) {
            this.sound.playCrash();
            this.shieldActive = false;
            this.updateShieldUI();
            this.fx.spawnBurst(this.bird.x, this.bird.y, '#00e5ff', 30);
            this.fx.addFloatingText(this.bird.x, this.bird.y - 20, 'SHIELD BROKEN!', '#00e5ff');
            p.passed = true; // allow pass
          } else {
            this.triggerGameOver('Pipe Crash');
            return;
          }
        }
      }

      if (p.x + p.width < -60) {
        this.pipes.splice(i, 1);
      }
    }

    // Update Letter Bubbles
    for (let i = this.letterBubbles.length - 1; i >= 0; i--) {
      const b = this.letterBubbles[i];
      b.x -= diff.scrollSpeed;
      b.floatOffset += 0.05;
      const curY = b.y + Math.sin(b.floatOffset) * 8;

      if (!b.collected) {
        const dx = this.bird.x - b.x;
        const dy = this.bird.y - curY;
        const dist = Math.hypot(dx, dy);

        if (dist < this.bird.radius + b.radius) {
          this.onLetterCollected(b);
        }
      }

      if (b.x < -50 || b.collected) {
        this.letterBubbles.splice(i, 1);
      }
    }

    // Scroll parallax ground & hills
    this.groundOffset = (this.groundOffset + diff.scrollSpeed) % 24;
    this.hillsOffset = (this.hillsOffset + diff.scrollSpeed * 0.45) % 200;

    this.fx.update();
  }

  // --- Rendering ---
  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake;
      const shakeY = (Math.random() - 0.5) * this.screenShake;
      this.ctx.translate(shakeX, shakeY);
    }

    this.drawSkyBackground();
    this.drawDistantMountains();
    this.drawClouds();
    this.drawRollingHills();
    this.drawPipes();
    this.drawLetterBubbles();
    this.drawGround();
    this.drawBird();
    this.fx.render(this.ctx);

    this.ctx.restore();
  }

  drawSkyBackground() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const grad = this.ctx.createLinearGradient(0, 0, 0, h);
    if (this.currentLevel % 3 === 1) {
      grad.addColorStop(0, '#2193b0');
      grad.addColorStop(1, '#6dd5ed');
    } else if (this.currentLevel % 3 === 2) {
      grad.addColorStop(0, '#ff7e5f');
      grad.addColorStop(1, '#feb47b'); // Sunset
    } else {
      grad.addColorStop(0, '#141E30');
      grad.addColorStop(1, '#243B55'); // Twilight
    }
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, w, h);
  }

  drawDistantMountains() {
    const w = this.canvas.width;
    const yBase = this.groundY;
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    this.ctx.beginPath();
    this.ctx.moveTo(0, yBase);
    this.ctx.lineTo(w * 0.2, yBase - 140);
    this.ctx.lineTo(w * 0.45, yBase - 40);
    this.ctx.lineTo(w * 0.7, yBase - 160);
    this.ctx.lineTo(w * 0.95, yBase - 50);
    this.ctx.lineTo(w, yBase - 80);
    this.ctx.lineTo(w, yBase);
    this.ctx.closePath();
    this.ctx.fill();
  }

  drawClouds() {
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.48)';
    for (const c of this.clouds) {
      this.ctx.save();
      this.ctx.translate(c.x, c.y);
      this.ctx.scale(c.scale, c.scale);
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 24, 0, Math.PI * 2);
      this.ctx.arc(20, -10, 20, 0, Math.PI * 2);
      this.ctx.arc(40, 0, 24, 0, Math.PI * 2);
      this.ctx.arc(20, 10, 18, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
  }

  drawRollingHills() {
    const w = this.canvas.width;
    const y = this.groundY;
    this.ctx.fillStyle = 'rgba(46, 125, 50, 0.35)';
    this.ctx.beginPath();
    this.ctx.moveTo(0, y);
    for (let x = 0; x <= w + 40; x += 40) {
      const curY = y - 30 + Math.sin((x + this.hillsOffset) * 0.02) * 16;
      this.ctx.lineTo(x, curY);
    }
    this.ctx.lineTo(w, y);
    this.ctx.closePath();
    this.ctx.fill();
  }

  drawPipes() {
    for (const p of this.pipes) {
      this.drawPipeSection(p.x, 0, p.width, p.topHeight, true);
      this.drawPipeSection(p.x, p.bottomY, p.width, p.bottomHeight, false);
    }
  }

  drawPipeSection(x, y, w, h, isTop) {
    // Elegant arcade pipe gradient with drop shadow
    const grad = this.ctx.createLinearGradient(x, 0, x + w, 0);
    grad.addColorStop(0, '#388e3c');
    grad.addColorStop(0.3, '#66bb6a');
    grad.addColorStop(0.7, '#81c784');
    grad.addColorStop(1, '#2e7d32');

    this.ctx.fillStyle = grad;
    this.ctx.fillRect(x, y, w, h);

    // Specular highlight line
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.fillRect(x + 5, y, 4, h);

    // Lip Collar
    const capHeight = 22;
    const capExtra = 5;
    const capX = x - capExtra;
    const capW = w + capExtra * 2;
    const capY = isTop ? y + h - capHeight : y;

    this.ctx.fillStyle = grad;
    this.ctx.fillRect(capX, capY, capW, capHeight);
    this.ctx.strokeStyle = '#1b5e20';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(capX, capY, capW, capHeight);
  }

  drawLetterBubbles() {
    for (const b of this.letterBubbles) {
      const curY = b.y + Math.sin(b.floatOffset) * 8;
      this.ctx.save();
      this.ctx.translate(b.x, curY);

      if (b.isPowerup) {
        // Shield Bubble (Glowing Cyan)
        this.ctx.beginPath();
        this.ctx.arc(0, 0, b.radius + 6, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(0, 229, 255, 0.45)';
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(0, 188, 212, 0.9)';
        this.ctx.fill();
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2.5;
        this.ctx.stroke();

        this.ctx.font = '20px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(b.char, 0, 1);
        this.ctx.restore();
        continue;
      }

      // Outer Aura for Target Letter
      if (b.isTarget) {
        // Pulsating Star Halo
        this.ctx.beginPath();
        this.ctx.arc(0, 0, b.radius + 8, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 215, 0, 0.55)';
        this.ctx.fill();

        // 4-point golden star sparkle
        this.ctx.save();
        this.ctx.rotate(b.floatOffset * 1.5);
        this.ctx.fillStyle = '#fff9c4';
        for (let s = 0; s < 4; s++) {
          this.ctx.rotate(Math.PI / 2);
          this.ctx.beginPath();
          this.ctx.moveTo(0, -b.radius - 8);
          this.ctx.lineTo(3, -b.radius - 2);
          this.ctx.lineTo(0, -b.radius);
          this.ctx.lineTo(-3, -b.radius - 2);
          this.ctx.closePath();
          this.ctx.fill();
        }
        this.ctx.restore();
      } else {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, b.radius + 4, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.fill();
      }

      // Bubble Body
      const bGrad = this.ctx.createRadialGradient(-4, -4, 2, 0, 0, b.radius);
      if (b.isTarget) {
        bGrad.addColorStop(0, '#fffde7');
        bGrad.addColorStop(0.7, '#ffd600');
        bGrad.addColorStop(1, '#ffab00');
      } else {
        bGrad.addColorStop(0, '#ffffff');
        bGrad.addColorStop(0.8, '#b3e5fc');
        bGrad.addColorStop(1, '#81d4fa');
      }
      this.ctx.fillStyle = bGrad;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 2.5;
      this.ctx.stroke();

      // Letter text
      this.ctx.fillStyle = '#212121';
      this.ctx.font = '900 20px "Fredoka One", sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(b.char, 0, 1.5);

      this.ctx.restore();
    }
  }

  drawGround() {
    const w = this.canvas.width;
    const h = this.canvas.height - this.groundY;

    // Grass strip
    this.ctx.fillStyle = '#4caf50';
    this.ctx.fillRect(0, this.groundY, w, 14);

    // Dirt soil
    this.ctx.fillStyle = '#795548';
    this.ctx.fillRect(0, this.groundY + 14, w, h - 14);

    // Moving ground stripes
    this.ctx.strokeStyle = '#4e342e';
    this.ctx.lineWidth = 3;
    for (let x = -this.groundOffset; x < w + 30; x += 22) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, this.groundY + 14);
      this.ctx.lineTo(x - 8, this.groundY + h);
      this.ctx.stroke();
    }
  }

  drawBird() {
    this.ctx.save();
    this.ctx.translate(this.bird.x, this.bird.y);
    this.ctx.rotate(this.bird.rotation);

    // Translucent Shield Forcefield Bubble
    if (this.shieldActive) {
      this.ctx.beginPath();
      this.ctx.arc(0, 0, this.bird.radius + 12, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(0, 229, 255, 0.22)';
      this.ctx.fill();
      this.ctx.strokeStyle = '#00e5ff';
      this.ctx.lineWidth = 2.5;
      this.ctx.stroke();
    }

    // Cute Tail Feathers
    this.ctx.fillStyle = '#f57c00';
    this.ctx.beginPath();
    this.ctx.ellipse(-this.bird.radius + 2, 2, 8, 4, -0.3, 0, Math.PI * 2);
    this.ctx.fill();

    // Bird Body (Soft golden yellow gradient)
    const bodyGrad = this.ctx.createRadialGradient(-4, -4, 4, 0, 0, this.bird.radius);
    bodyGrad.addColorStop(0, '#fff59d');
    bodyGrad.addColorStop(0.75, '#ffca28');
    bodyGrad.addColorStop(1, '#ff9800');

    this.ctx.fillStyle = bodyGrad;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, this.bird.radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = '#e65100';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Cute Rosy Pink Cheek
    this.ctx.fillStyle = 'rgba(255, 64, 129, 0.45)';
    this.ctx.beginPath();
    this.ctx.arc(3, 4, 4.5, 0, Math.PI * 2);
    this.ctx.fill();

    // Crest Feather on Head
    this.ctx.fillStyle = '#ff9800';
    this.ctx.beginPath();
    this.ctx.arc(-2, -this.bird.radius, 4, 0, Math.PI * 2);
    this.ctx.fill();

    // Wing with smooth flap animation
    const wingFlapY = Math.sin(this.bird.wingTimer) * 5;
    this.ctx.fillStyle = '#fff9c4';
    this.ctx.beginPath();
    this.ctx.ellipse(-5, wingFlapY, 9, 6, -0.15, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = '#f57c00';
    this.ctx.lineWidth = 1.8;
    this.ctx.stroke();

    // Cartoon Eye with Highlight & Blinking
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(8, -5, 6, 0, Math.PI * 2);
    this.ctx.fill();

    if (this.bird.isBlinking) {
      // Closed Eye Line
      this.ctx.strokeStyle = '#212121';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(8, -5, 4, 0.1, Math.PI - 0.1);
      this.ctx.stroke();
    } else {
      // Big Pupil
      this.ctx.fillStyle = '#212121';
      this.ctx.beginPath();
      this.ctx.arc(9.5, -5, 3, 0, Math.PI * 2);
      this.ctx.fill();

      // Catchlight Sparkle in Eye
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(10.5, -6.5, 1.2, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Beak
    this.ctx.fillStyle = '#ff7043';
    this.ctx.beginPath();
    this.ctx.moveTo(14, -2);
    this.ctx.lineTo(24, 2);
    this.ctx.lineTo(14, 6);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.strokeStyle = '#d84315';
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();

    this.ctx.restore();
  }

  gameLoop(currentTime) {
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    this.update(dt);
    this.render();

    requestAnimationFrame((t) => this.gameLoop(t));
  }
}

// Start Game instance on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.flippyGame = new FlippyWordGame();
});
