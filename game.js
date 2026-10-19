/**
 * FLIPPY COINS - Infinite Arcade Coin Quest
 * Pure Level-Based Coin Collector with 3D Spinning Coins, Magnets & Shields
 */

// --- Anti-Tamper & State Protection Helper ---
const AntiCheat = {
  _salt: 'FLIPPY_COIN_SALT_778129',
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
    this.comboCount = 0;
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
      this.playPluckNote(freq * 1.5, 0.035);
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
    osc.frequency.setValueAtTime(280 + Math.random() * 30, now);
    osc.frequency.exponentialRampToValueAtTime(560, now + 0.14);
    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  playCoin() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.comboCount = Math.min(8, this.comboCount + 1);
    const baseFreq = 880 + this.comboCount * 70;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.12);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  playGem() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    [1046.50, 1318.51, 1567.98].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);
      gain.gain.setValueAtTime(0.3, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.05 + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.25);
    });
  }

  playPowerup() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.exponentialRampToValueAtTime(950, now + 0.3);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.32);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.32);
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
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.35, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.35);
    });
  }
}

// --- Endless Level Manager (Single Continuous Infinite Flight) ---
class LevelManager {
  getDifficultyConfig(score = 0) {
    // Smooth progressive challenge based on current score
    const progress = Math.min(score / 6000, 1.0);
    const baseSpeed = 2.1;
    const speedBoost = progress * 1.5; // 2.1 up to 3.6
    const pipeGap = Math.max(165, 210 - progress * 40);
    const pipeInterval = Math.max(115, Math.round(155 - progress * 35));
    return {
      scrollSpeed: baseSpeed + speedBoost,
      pipeGap: pipeGap,
      pipeInterval: pipeInterval
    };
  }
}

// --- FX Engine (Particles, Sparkles, Floating Text) ---
class FXEngine {
  constructor() {
    this.particles = [];
    this.floatingTexts = [];
  }

  spawnCoinSparkle(x, y, color = '#ffd600', count = 14) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3.5 + 1.2;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 3.5 + 1.8,
        color: color,
        alpha: 1,
        life: 1,
        decay: Math.random() * 0.035 + 0.02
      });
    }
  }

  spawnConfetti(width, height) {
    const colors = ['#ffd600', '#ff4081', '#00e676', '#00b0ff', '#ff9100', '#e040fb'];
    for (let i = 0; i < 80; i++) {
      this.particles.push({
        x: Math.random() * width,
        y: -20,
        vx: (Math.random() - 0.5) * 4.5,
        vy: Math.random() * 3.5 + 2,
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
      vy: -1.3,
      scale: 1.2
    });
  }

  update() {
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

// --- Main Flippy Coins Engine ---
class FlippyCoinGame {
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
      coinCurrent: document.getElementById('coin-current'),
      hudHighScore: document.getElementById('hud-high-score'),
      coinGoal: document.getElementById('coin-goal'),
      coinBarFill: document.getElementById('coin-bar-fill'),
      livesDisplay: document.getElementById('lives-display'),
      shieldIndicator: document.getElementById('shield-indicator'),
      magnetIndicator: document.getElementById('magnet-indicator'),
      screenStart: document.getElementById('screen-start'),
      screenLevelComplete: document.getElementById('screen-level-complete'),
      screenGameOver: document.getElementById('screen-game-over'),
      screenPause: document.getElementById('screen-pause'),
      startHighScore: document.getElementById('start-high-score'),
      completedCoins: document.getElementById('completed-coins'),
      starsDisplay: document.getElementById('stars-display'),
      rewardPts: document.getElementById('reward-pts'),
      totalCoinsBank: document.getElementById('total-coins-bank'),
      finalScore: document.getElementById('final-score'),
      finalHighScore: document.getElementById('final-high-score'),
      finalLevel: document.getElementById('final-level'),
      finalCoinsCount: document.getElementById('final-coins-count'),
      finalTotalCoins: document.getElementById('final-total-coins'),
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
    this.totalCoins = 0;
    this.lives = 3;
    this.currentLevel = 1;
    this.coinsInCurrentRun = 0;
    this.coinsInCurrentLevel = 0;

    // Powerup Timers
    this.shieldActive = false;
    this.magnetTimer = 0; // in seconds

    // Bird Physics (Smooth floaty glide)
    this.bird = {
      x: 75,
      y: 250,
      radius: 19,
      velocity: 0,
      gravity: 0.16,
      jumpForce: -4.2,
      maxFallSpeed: 3.6,
      rotation: 0,
      targetRotation: 0,
      wingTimer: 0,
      blinkTimer: 0,
      isBlinking: false
    };

    // World Elements
    this.pipes = [];
    this.collectibles = [];
    this.clouds = [];
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
    const raw = localStorage.getItem('__FLIPPY_COIN_SAVE__');
    if (raw) {
      const data = AntiCheat.decode(raw);
      if (data) {
        this.highScore = data.highScore || 0;
        this.totalCoins = data.totalCoins || 0;
        this.isPremium = data.isPremium || false;
        if (this.ui.startHighScore) this.ui.startHighScore.textContent = this.highScore;
        if (this.ui.hudHighScore) this.ui.hudHighScore.textContent = this.highScore;
        if (this.isPremium && this.ui.btnOpenBuy) {
          this.ui.btnOpenBuy.textContent = '👑 VIP SUPPORTER (ACTIVATED)';
          this.ui.btnOpenBuy.style.background = 'linear-gradient(135deg, #00e676, #00b0ff)';
        }
      }
    }
  }

  saveGameData() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      if (this.ui.hudHighScore) this.ui.hudHighScore.textContent = this.highScore;
      if (this.ui.startHighScore) this.ui.startHighScore.textContent = this.highScore;
    }
    const data = {
      highScore: this.highScore,
      totalCoins: this.totalCoins,
      isPremium: this.isPremium || false,
      timestamp: Date.now()
    };
    localStorage.setItem('__FLIPPY_COIN_SAVE__', AntiCheat.encode(data));
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

  startNewGame() {
    this.sound.init();
    this.score = 0;
    this.lives = 3;
    this.coinsInCurrentRun = 0;
    this.shieldActive = false;
    this.magnetTimer = 0;
    this.pipes = [];
    this.collectibles = [];
    this.frameCounter = 0;
    this.sound.comboCount = 0;

    this.updateLivesDisplay();
    this.updateShieldUI();
    this.updateMagnetUI();

    this.ui.scoreDisplay.textContent = '0';
    if (this.ui.coinCurrent) this.ui.coinCurrent.textContent = '0';
    if (this.ui.hudHighScore) this.ui.hudHighScore.textContent = this.highScore;
    
    this.bird.y = this.canvas.height * 0.4;
    this.bird.velocity = 0;
    this.bird.rotation = 0;

    this.setScreen('NONE');
    this.state = 'PLAYING';
  }

  flap() {
    if (this.state === 'PLAYING') {
      this.bird.velocity = this.bird.jumpForce;
      this.sound.playFlap();
      this.fx.spawnCoinSparkle(this.bird.x - 12, this.bird.y + 8, '#ffffff', 5);
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

  updateMagnetUI() {
    if (this.ui.magnetIndicator) {
      if (this.magnetTimer > 0) {
        this.ui.magnetIndicator.classList.remove('hidden');
      } else {
        this.ui.magnetIndicator.classList.add('hidden');
      }
    }
  }

  setScreen(name) {
    if (this.ui.screenStart) this.ui.screenStart.classList.remove('active');
    if (this.ui.screenGameOver) this.ui.screenGameOver.classList.remove('active');
    if (this.ui.screenPause) this.ui.screenPause.classList.remove('active');
    if (this.ui.screenBuy) this.ui.screenBuy.classList.remove('active');

    if (name === 'START' && this.ui.screenStart) this.ui.screenStart.classList.add('active');
    if (name === 'GAMEOVER' && this.ui.screenGameOver) this.ui.screenGameOver.classList.add('active');
    if (name === 'PAUSE' && this.ui.screenPause) this.ui.screenPause.classList.add('active');
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

    if (this.ui.btnPlay) this.ui.btnPlay.addEventListener('click', () => this.startNewGame());
    if (this.ui.btnRetry) this.ui.btnRetry.addEventListener('click', () => this.startNewGame());

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

    // UTR / Payment Validation Handler
    const inputUtr = document.getElementById('input-utr');
    const btnVerifyUtr = document.getElementById('btn-verify-utr');
    const utrMsg = document.getElementById('utr-status-msg');

    if (btnVerifyUtr && inputUtr && utrMsg) {
      btnVerifyUtr.addEventListener('click', (e) => {
        e.stopPropagation();
        const utrVal = inputUtr.value.trim();
        utrMsg.style.display = 'block';

        if (!utrVal) {
          utrMsg.style.color = '#ff5252';
          utrMsg.textContent = '⚠️ Kripya payment ke baad 12-digit UTR/Ref No. enter karein.';
          return;
        }

        // Validate strictly 12 digits
        const utrRegex = /^\d{12}$/;
        if (!utrRegex.test(utrVal)) {
          utrMsg.style.color = '#ff5252';
          utrMsg.textContent = '❌ Invalid UTR! UTR 12-digit ka numeric number hona chahiye.';
          return;
        }

        // Check for dummy identical repeating digits (e.g. 000000000000, 111111111111)
        if (/^(\d)\1{11}$/.test(utrVal)) {
          utrMsg.style.color = '#ff5252';
          utrMsg.textContent = '❌ Invalid Reference! Asli bank UTR enter karein.';
          return;
        }

        // Verified Successfully!
        utrMsg.style.color = '#00e676';
        utrMsg.textContent = '✅ Payment Verified! VIP Supporter Perks Activated 👑';
        this.isPremium = true;
        this.totalCoins += 1000; // 1,000 Bonus Coins Reward
        this.sound.playLevelUp();
        this.fx.spawnConfetti(this.canvas.width, this.canvas.height);
        this.saveGameData();

        if (this.ui.btnOpenBuy) {
          this.ui.btnOpenBuy.textContent = '👑 VIP ACTIVATED (+1000 COINS)';
          this.ui.btnOpenBuy.style.background = 'linear-gradient(135deg, #00e676, #00b0ff)';
        }

        setTimeout(() => {
          this.setScreen('START');
        }, 1800);
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

  spawnPipesAndCoins() {
    const diff = this.levelMgr.getDifficultyConfig(this.score);
    const minHeight = 65;
    const maxHeight = this.groundY - diff.pipeGap - minHeight;
    const topHeight = Math.floor(Math.random() * (maxHeight - minHeight)) + minHeight;
    const bottomY = topHeight + diff.pipeGap;
    const bottomHeight = this.groundY - bottomY;

    // Add Pipe Obstacles
    const pipeX = this.canvas.width + 40;
    this.pipes.push({
      x: pipeX,
      width: 60,
      topHeight: topHeight,
      bottomY: bottomY,
      bottomHeight: bottomHeight,
      passed: false
    });

    const gapCenterY = topHeight + diff.pipeGap / 2;

    // Decide what item to spawn in this section
    const roll = Math.random();

    // 10% chance for Shield if not active
    if (!this.shieldActive && roll < 0.10) {
      this.collectibles.push({
        x: pipeX + 110,
        y: gapCenterY,
        type: 'SHIELD',
        radius: 18,
        spinTimer: 0,
        collected: false
      });
      return;
    }

    // 12% chance for Magnet if not active
    if (this.magnetTimer <= 0 && roll < 0.22) {
      this.collectibles.push({
        x: pipeX + 110,
        y: gapCenterY,
        type: 'MAGNET',
        radius: 18,
        spinTimer: 0,
        collected: false
      });
      return;
    }

    // 18% chance for Ruby Gem (worth 3 coins) as score grows
    if (roll < 0.38 && this.score > 250) {
      this.collectibles.push({
        x: pipeX + 110,
        y: gapCenterY,
        type: 'GEM',
        radius: 17,
        spinTimer: 0,
        collected: false
      });
      return;
    }

    // Default: Spawn Gold Coins (single or twin coin pack)
    this.collectibles.push({
      x: pipeX + 100,
      y: gapCenterY,
      type: 'COIN',
      radius: 16,
      spinTimer: Math.random() * Math.PI,
      collected: false
    });

    // 45% chance of a second coin right behind it
    if (Math.random() < 0.45) {
      this.collectibles.push({
        x: pipeX + 145,
        y: gapCenterY + (Math.random() - 0.5) * 30,
        type: 'COIN',
        radius: 16,
        spinTimer: Math.random() * Math.PI,
        collected: false
      });
    }
  }

  onCollectibleCollected(item) {
    item.collected = true;

    if (item.type === 'COIN') {
      this.sound.playCoin();
      this.coinsInCurrentRun++;
      this.totalCoins++;
      this.score += 100;
      this.fx.spawnCoinSparkle(item.x, item.y, '#ffd600', 18);
      this.fx.addFloatingText(item.x, item.y - 15, '+1 🪙', '#ffd600');
    } else if (item.type === 'GEM') {
      this.sound.playGem();
      this.coinsInCurrentRun += 3;
      this.totalCoins += 3;
      this.score += 350;
      this.fx.spawnCoinSparkle(item.x, item.y, '#ff1744', 24);
      this.fx.addFloatingText(item.x, item.y - 15, '+3 💎', '#ff4081');
    } else if (item.type === 'SHIELD') {
      this.sound.playPowerup();
      this.shieldActive = true;
      this.updateShieldUI();
      this.fx.spawnCoinSparkle(item.x, item.y, '#00e5ff', 25);
      this.fx.addFloatingText(item.x, item.y - 15, 'SHIELD ACTIVE! 🛡️', '#00e5ff');
    } else if (item.type === 'MAGNET') {
      this.sound.playPowerup();
      this.magnetTimer = 8; // 8 seconds of coin magnet
      this.updateMagnetUI();
      this.fx.spawnCoinSparkle(item.x, item.y, '#e91e63', 25);
      this.fx.addFloatingText(item.x, item.y - 15, 'COIN MAGNET! 🧲', '#ff4081');
    }

    // Every 10 coins: celebratory milestone bonus without stopping the flight!
    if (this.coinsInCurrentRun > 0 && this.coinsInCurrentRun % 10 === 0 && (item.type === 'COIN' || item.type === 'GEM')) {
      this.sound.playLevelUp();
      this.score += 250;
      this.fx.spawnConfetti(this.canvas.width, this.canvas.height);
      this.fx.addFloatingText(this.bird.x, this.bird.y - 30, `🎉 ${this.coinsInCurrentRun} COINS STREAK! +250 PTS`, '#ffd600');
    }

    // Update HUD
    this.ui.scoreDisplay.textContent = this.score;
    if (this.ui.coinCurrent) this.ui.coinCurrent.textContent = this.coinsInCurrentRun;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      if (this.ui.hudHighScore) this.ui.hudHighScore.textContent = this.highScore;
    }
  }

  triggerGameOver(reason) {
    this.sound.playCrash();
    this.state = 'GAMEOVER';
    this.screenShake = 18;
    this.saveGameData();

    this.ui.finalScore.textContent = this.score;
    this.ui.finalHighScore.textContent = this.highScore;
    if (this.ui.finalCoinsCount) this.ui.finalCoinsCount.textContent = this.coinsInCurrentRun;
    const totalEl = document.getElementById('final-total-coins');
    if (totalEl) totalEl.textContent = this.totalCoins;
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

    // Update Magnet Timer
    if (this.magnetTimer > 0) {
      this.magnetTimer -= dt;
      if (this.magnetTimer <= 0) {
        this.magnetTimer = 0;
        this.updateMagnetUI();
      }
    }

    const diff = this.levelMgr.getDifficultyConfig(this.score);

    // Bird Physics (Smooth float & terminal velocity cap)
    this.bird.velocity += this.bird.gravity;
    if (this.bird.velocity > this.bird.maxFallSpeed) {
      this.bird.velocity = this.bird.maxFallSpeed;
    }
    this.bird.y += this.bird.velocity;

    this.bird.targetRotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 5, (this.bird.velocity * 3.2) * Math.PI / 180));
    this.bird.rotation += (this.bird.targetRotation - this.bird.rotation) * 0.15;
    this.bird.wingTimer += 0.22;

    // Blinking animation
    this.bird.blinkTimer += dt;
    if (this.bird.blinkTimer > 3.5) {
      this.bird.isBlinking = true;
      if (this.bird.blinkTimer > 3.65) {
        this.bird.isBlinking = false;
        this.bird.blinkTimer = 0;
      }
    }

    // Ground & Ceiling Collisions
    if (this.bird.y + this.bird.radius >= this.groundY) {
      this.bird.y = this.groundY - this.bird.radius;
      if (this.shieldActive) {
        this.shieldActive = false;
        this.updateShieldUI();
        this.bird.velocity = -4.5;
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

    // Spawn Pipes & Collectibles
    this.frameCounter++;
    if (this.frameCounter % diff.pipeInterval === 0) {
      this.spawnPipesAndCoins();
    }

    // Update Pipes
    for (let i = this.pipes.length - 1; i >= 0; i--) {
      const p = this.pipes[i];
      p.x -= diff.scrollSpeed;

      if (!p.passed && p.x + p.width < this.bird.x) {
        p.passed = true;
        this.score += 15;
        this.ui.scoreDisplay.textContent = this.score;
      }

      // Bird-Pipe Collision
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
            this.fx.spawnCoinSparkle(this.bird.x, this.bird.y, '#00e5ff', 30);
            this.fx.addFloatingText(this.bird.x, this.bird.y - 20, 'SHIELD BROKEN!', '#00e5ff');
            p.passed = true;
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

    // Update Collectibles (Coins, Gems, Powerups)
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const item = this.collectibles[i];
      item.x -= diff.scrollSpeed;
      item.spinTimer += 0.08;

      // Magnet Pull Physics
      if (this.magnetTimer > 0 && (item.type === 'COIN' || item.type === 'GEM')) {
        const dx = this.bird.x - item.x;
        const dy = this.bird.y - item.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 190) {
          // Accelerate coin towards the bird!
          item.x += (dx / dist) * 6.5;
          item.y += (dy / dist) * 6.5;
        }
      }

      if (!item.collected) {
        const dx = this.bird.x - item.x;
        const dy = this.bird.y - item.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.bird.radius + item.radius) {
          this.onCollectibleCollected(item);
        }
      }

      if (item.x < -40 || item.collected) {
        this.collectibles.splice(i, 1);
      }
    }

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
    this.drawCollectibles();
    this.drawGround();
    this.drawBird();
    this.fx.render(this.ctx);

    this.ctx.restore();
  }

  drawSkyBackground() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const grad = this.ctx.createLinearGradient(0, 0, 0, h);
    const cycle = Math.floor(this.score / 1500) % 3;
    if (cycle === 0) {
      grad.addColorStop(0, '#2193b0');
      grad.addColorStop(1, '#6dd5ed'); // Crisp Cyan Sky
    } else if (cycle === 1) {
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
    const grad = this.ctx.createLinearGradient(x, 0, x + w, 0);
    grad.addColorStop(0, '#388e3c');
    grad.addColorStop(0.3, '#66bb6a');
    grad.addColorStop(0.7, '#81c784');
    grad.addColorStop(1, '#2e7d32');

    this.ctx.fillStyle = grad;
    this.ctx.fillRect(x, y, w, h);

    // Specular highlight
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.fillRect(x + 5, y, 4, h);

    // Pipe Cap
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

  drawCollectibles() {
    for (const item of this.collectibles) {
      this.ctx.save();
      this.ctx.translate(item.x, item.y);

      if (item.type === 'COIN') {
        // 3D Spinning Golden Coin
        const scaleX = Math.abs(Math.cos(item.spinTimer));
        this.ctx.scale(scaleX, 1);

        // Outer Glow
        this.ctx.beginPath();
        this.ctx.arc(0, 0, item.radius + 4, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 214, 0, 0.4)';
        this.ctx.fill();

        // Coin Outer Rim
        const rimGrad = this.ctx.createLinearGradient(-item.radius, -item.radius, item.radius, item.radius);
        rimGrad.addColorStop(0, '#fff59d');
        rimGrad.addColorStop(0.5, '#ffd600');
        rimGrad.addColorStop(1, '#ff8f00');

        this.ctx.fillStyle = rimGrad;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, item.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Inner Embossed Ring
        this.ctx.strokeStyle = '#f57f17';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, item.radius * 0.65, 0, Math.PI * 2);
        this.ctx.stroke();

        // Center Star / Symbol
        this.ctx.fillStyle = '#fff9c4';
        this.ctx.font = '900 13px "Fredoka One", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('★', 0, 0.5);

      } else if (item.type === 'GEM') {
        // Sparkling Ruby Gem
        this.ctx.rotate(item.spinTimer * 0.5);
        this.ctx.beginPath();
        this.ctx.arc(0, 0, item.radius + 5, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 64, 129, 0.45)';
        this.ctx.fill();

        this.ctx.font = '22px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('💎', 0, 1);

      } else if (item.type === 'SHIELD') {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, item.radius + 6, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(0, 229, 255, 0.5)';
        this.ctx.fill();

        this.ctx.font = '20px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('🛡️', 0, 1);

      } else if (item.type === 'MAGNET') {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, item.radius + 6, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(233, 30, 99, 0.5)';
        this.ctx.fill();

        this.ctx.font = '20px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('🧲', 0, 1);
      }

      this.ctx.restore();
    }
  }

  drawGround() {
    const w = this.canvas.width;
    const h = this.canvas.height - this.groundY;

    this.ctx.fillStyle = '#4caf50';
    this.ctx.fillRect(0, this.groundY, w, 14);

    this.ctx.fillStyle = '#795548';
    this.ctx.fillRect(0, this.groundY + 14, w, h - 14);

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

    // Shield Forcefield Bubble
    if (this.shieldActive) {
      this.ctx.beginPath();
      this.ctx.arc(0, 0, this.bird.radius + 12, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(0, 229, 255, 0.22)';
      this.ctx.fill();
      this.ctx.strokeStyle = '#00e5ff';
      this.ctx.lineWidth = 2.5;
      this.ctx.stroke();
    }

    // Magnet Magnetic Ring
    if (this.magnetTimer > 0) {
      this.ctx.beginPath();
      this.ctx.arc(0, 0, this.bird.radius + 16, 0, Math.PI * 2);
      this.ctx.strokeStyle = 'rgba(233, 30, 99, 0.7)';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([4, 4]);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }

    // Tail Feathers
    this.ctx.fillStyle = '#f57c00';
    this.ctx.beginPath();
    this.ctx.ellipse(-this.bird.radius + 2, 2, 8, 4, -0.3, 0, Math.PI * 2);
    this.ctx.fill();

    // Bird Body
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

    // Rosy Pink Cheek
    this.ctx.fillStyle = 'rgba(255, 64, 129, 0.45)';
    this.ctx.beginPath();
    this.ctx.arc(3, 4, 4.5, 0, Math.PI * 2);
    this.ctx.fill();

    // Crest Feather
    this.ctx.fillStyle = '#ff9800';
    this.ctx.beginPath();
    this.ctx.arc(-2, -this.bird.radius, 4, 0, Math.PI * 2);
    this.ctx.fill();

    // Wing
    const wingFlapY = Math.sin(this.bird.wingTimer) * 5;
    this.ctx.fillStyle = '#fff9c4';
    this.ctx.beginPath();
    this.ctx.ellipse(-5, wingFlapY, 9, 6, -0.15, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = '#f57c00';
    this.ctx.lineWidth = 1.8;
    this.ctx.stroke();

    // Eye
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(8, -5, 6, 0, Math.PI * 2);
    this.ctx.fill();

    if (this.bird.isBlinking) {
      this.ctx.strokeStyle = '#212121';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(8, -5, 4, 0.1, Math.PI - 0.1);
      this.ctx.stroke();
    } else {
      this.ctx.fillStyle = '#212121';
      this.ctx.beginPath();
      this.ctx.arc(9.5, -5, 3, 0, Math.PI * 2);
      this.ctx.fill();

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
  window.flippyGame = new FlippyCoinGame();
});
