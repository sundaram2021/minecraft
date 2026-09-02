// Next-Gen Procedural AAA Web Audio API Sound Synthesizer for Minecraft SFX & Music
// Engineered to authentically match real Minecraft acoustics, footsteps, mobs, tool whooshes, and C418 soundtrack.

export class SoundSynthesizer {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.reverbNode = null;
    this.masterCompressor = null;
    this.activeVoices = 0;
    this.maxVoices = 64;
    this.muted = false;
    this.musicPlaying = false;
    this.masterVolume = 0.85;
    this.sfxVolume = 0.9;
    this.musicVolume = 0.55;

    this.stepVariation = 0;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master output chain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.masterVolume;
      this.masterCompressor = this.ctx.createDynamicsCompressor();
      this.masterCompressor.threshold.value = -18;
      this.masterCompressor.knee.value = 12;
      this.masterCompressor.ratio.value = 4;
      this.masterCompressor.attack.value = 0.003;
      this.masterCompressor.release.value = 0.18;
      this.masterGain.connect(this.masterCompressor);
      this.masterCompressor.connect(this.ctx.destination);

      // SFX Bus
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.masterGain);

      // Music Bus with gentle stereo warmth
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVolume;
      this.musicGain.connect(this.masterGain);

      // Algorithmic Reverb Impulse for spatial depth
      this.initReverb();

      // Start C418-inspired ambient generative soundtrack
      this.startC418Soundtrack();
    } catch (e) {
      console.warn('Web Audio API not supported or blocked', e);
    }
  }

  ensureContext() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Algorithmic Reverb for realistic outdoor / cavern acoustic reflections
  initReverb() {
    if (!this.ctx) return;
    const rate = this.ctx.sampleRate;
    const length = Math.floor(rate * 1.8);
    const decay = 2.5;
    const impulse = this.ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = (length - i) / length;
      const factor = Math.pow(n, decay);
      left[i] = (Math.random() * 2 - 1) * factor;
      right[i] = (Math.random() * 2 - 1) * factor;
    }

    this.reverbNode = this.ctx.createConvolver();
    this.reverbNode.buffer = impulse;

    const reverbGain = this.ctx.createGain();
    reverbGain.gain.value = 0.25;
    this.reverbNode.connect(reverbGain);
    reverbGain.connect(this.masterGain);
  }

  // Seeded/filtered noise generator for granular acoustic realism
  createNoiseBuffer(duration = 0.15, type = 'pink') {
    if (!this.ctx) return null;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (type === 'pink') {
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        data[i] = (b0 + b1 + b2 + white * 0.5362) * 0.35;
      } else {
        // Brown/Earth noise
        b0 = (b0 + 0.02 * white) / 1.02;
        data[i] = b0 * 2.8;
      }
    }
    return buffer;
  }

  // --- AAA FOOTSTEP SYSTEM WITH MULTI-LAYER VARIATIONS ---
  playFootstep(material = 'grass') {
    this.ensureContext();
    if (!this.ctx || this.muted) return;

    this.stepVariation = (this.stepVariation + 1) % 4;
    const t = this.ctx.currentTime;
    const pitchOffset = 0.92 + Math.random() * 0.16;

    const outGain = this.ctx.createGain();
    outGain.connect(this.sfxGain);

    if (material === 'grass' || material === 'snow') {
      // Grass: Layer 1: High crisp leaf brush + Layer 2: Muffled earth thump
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer(0.11, 'pink');

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      const baseFreq = material === 'snow' ? 1400 : (1000 + this.stepVariation * 80);
      filter.frequency.setValueAtTime(baseFreq * pitchOffset, t);
      filter.Q.setValueAtTime(1.8, t);

      // Low earth thud
      const sub = this.ctx.createOscillator();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(110 * pitchOffset, t);
      sub.frequency.exponentialRampToValueAtTime(45, t + 0.09);

      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(0.35, t);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      noise.connect(filter);
      filter.connect(outGain);
      sub.connect(subGain);
      subGain.connect(outGain);

      outGain.gain.setValueAtTime(0.42, t);
      outGain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);

      noise.start(t);
      sub.start(t);
      noise.stop(t + 0.11);
      sub.stop(t + 0.09);
    } else if (material === 'stone') {
      // Stone: Sharp high click (2.4kHz) + resonant rock ring (340Hz)
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer(0.06, 'pink');

      const hiFilter = this.ctx.createBiquadFilter();
      hiFilter.type = 'bandpass';
      hiFilter.frequency.setValueAtTime(2200 * pitchOffset, t);
      hiFilter.Q.setValueAtTime(4.0, t);

      const ring = this.ctx.createOscillator();
      ring.type = 'triangle';
      ring.frequency.setValueAtTime((320 + this.stepVariation * 25) * pitchOffset, t);
      ring.frequency.exponentialRampToValueAtTime(120, t + 0.07);

      const ringGain = this.ctx.createGain();
      ringGain.gain.setValueAtTime(0.38, t);
      ringGain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

      noise.connect(hiFilter);
      hiFilter.connect(outGain);
      ring.connect(ringGain);
      ringGain.connect(outGain);

      outGain.gain.setValueAtTime(0.4, t);
      outGain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

      noise.start(t);
      ring.start(t);
      noise.stop(t + 0.06);
      ring.stop(t + 0.07);
    } else if (material === 'wood') {
      // Wood: Warm hollow plank click + fibrous knock
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime((190 + this.stepVariation * 15) * pitchOffset, t);
      osc.frequency.exponentialRampToValueAtTime(70, t + 0.09);

      const knockNoise = this.ctx.createBufferSource();
      knockNoise.buffer = this.createNoiseBuffer(0.05, 'brown');
      const knockFilter = this.ctx.createBiquadFilter();
      knockFilter.type = 'bandpass';
      knockFilter.frequency.setValueAtTime(450 * pitchOffset, t);
      knockFilter.Q.setValueAtTime(2.5, t);

      knockNoise.connect(knockFilter);
      knockFilter.connect(outGain);
      osc.connect(outGain);

      outGain.gain.setValueAtTime(0.48, t);
      outGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      osc.start(t);
      knockNoise.start(t);
      osc.stop(t + 0.09);
      knockNoise.stop(t + 0.05);
    } else if (material === 'sand' || material === 'gravel') {
      // Sand/Gravel: Coarse granular crunch
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer(0.12, 'pink');

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime((material === 'gravel' ? 1200 : 1800) * pitchOffset, t);
      filter.Q.setValueAtTime(2.2, t);

      noise.connect(filter);
      filter.connect(outGain);

      outGain.gain.setValueAtTime(0.38, t);
      outGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      noise.start(t);
      noise.stop(t + 0.12);
    } else if (material === 'water') {
      // Water: Splash transient + sub-surface bubble gurgle
      const splash = this.ctx.createOscillator();
      splash.type = 'sine';
      splash.frequency.setValueAtTime(420 * pitchOffset, t);
      splash.frequency.exponentialRampToValueAtTime(140, t + 0.18);

      const noise = this.ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer(0.14, 'pink');
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, t);

      noise.connect(filter);
      filter.connect(outGain);
      splash.connect(outGain);

      outGain.gain.setValueAtTime(0.35, t);
      outGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      splash.start(t);
      noise.start(t);
      splash.stop(t + 0.18);
      noise.stop(t + 0.14);
    }
  }

  // --- RHYTHMIC DIGGING HIT TICK (WHILE MINING BLOCKS) ---
  playDigTick(material = 'stone') {
    this.ensureContext();
    if (!this.ctx || this.muted) return;

    const t = this.ctx.currentTime;
    const pitch = 0.95 + Math.random() * 0.1;
    const gain = this.ctx.createGain();
    gain.connect(this.sfxGain);

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.06, 'pink');

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime((material === 'wood' ? 600 : (material === 'grass' ? 900 : 1600)) * pitch, t);
    filter.Q.setValueAtTime(2.0, t);

    const knock = this.ctx.createOscillator();
    knock.type = 'triangle';
    knock.frequency.setValueAtTime(180 * pitch, t);
    knock.frequency.exponentialRampToValueAtTime(60, t + 0.05);

    noise.connect(filter);
    filter.connect(gain);
    knock.connect(gain);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    noise.start(t);
    knock.start(t);
    noise.stop(t + 0.06);
    knock.stop(t + 0.05);
  }

  // --- FINAL BLOCK BREAK DESTRUCTION SOUND ---
  playBlockBreak(material = 'stone') {
    this.ensureContext();
    if (!this.ctx || this.muted) return;

    const t = this.ctx.currentTime;
    const gain = this.ctx.createGain();
    gain.connect(this.sfxGain);

    // Initial snap crack
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.22, 'pink');

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(material === 'wood' ? 500 : 1200, t);
    filter.Q.setValueAtTime(1.5, t);

    // Resonant destruction pop
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.18);

    noise.connect(filter);
    filter.connect(gain);
    osc.connect(gain);

    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    noise.start(t);
    osc.start(t);
    noise.stop(t + 0.22);
    osc.stop(t + 0.18);
  }

  // --- BLOCK PLACE SOLID CLUNK ---
  playBlockPlace(material = 'stone') {
    this.ensureContext();
    if (!this.ctx || this.muted) return;

    const t = this.ctx.currentTime;
    const gain = this.ctx.createGain();
    gain.connect(this.sfxGain);

    const pitch = 0.95 + Math.random() * 0.1;

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220 * pitch, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.12);

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.06, 'brown');
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);

    osc.connect(gain);
    noise.connect(filter);
    filter.connect(gain);

    gain.gain.setValueAtTime(0.55, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.start(t);
    noise.start(t);
    osc.stop(t + 0.12);
    noise.stop(t + 0.06);
  }

  // --- ITEM PICKUP CHIME ---
  playItemPickup() {
    this.ensureContext();
    if (!this.ctx || this.muted) return;

    const t = this.ctx.currentTime;
    const gain = this.ctx.createGain();
    gain.connect(this.sfxGain);

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    const baseFreq = 520 + Math.random() * 80;
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.8, t + 0.11);

    osc.connect(gain);
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  // --- WEAPON / TOOL AIR WHOOSH SWING ---
  playToolSwing() {
    this.ensureContext();
    if (!this.ctx || this.muted) return;

    const t = this.ctx.currentTime;
    const gain = this.ctx.createGain();
    gain.connect(this.sfxGain);

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.12, 'pink');

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, t);
    filter.frequency.exponentialRampToValueAtTime(320, t + 0.12);
    filter.Q.setValueAtTime(2.2, t);

    noise.connect(filter);
    filter.connect(gain);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    noise.start(t);
    noise.stop(t + 0.12);
  }

  // --- AUTHENTIC MINECRAFT PLAYER DAMAGE "OOF!" ---
  playPlayerHurt() {
    this.ensureContext();
    if (!this.ctx || this.muted) return;

    const t = this.ctx.currentTime;
    const gain = this.ctx.createGain();
    gain.connect(this.sfxGain);

    // Formant pitch-dropping grunt
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(230, t);
    osc.frequency.exponentialRampToValueAtTime(95, t + 0.24);

    const formant = this.ctx.createBiquadFilter();
    formant.type = 'bandpass';
    formant.frequency.setValueAtTime(650, t);
    formant.frequency.exponentialRampToValueAtTime(400, t + 0.24);
    formant.Q.setValueAtTime(3.5, t);

    // Punch impact transient
    const thump = this.ctx.createOscillator();
    thump.type = 'triangle';
    thump.frequency.setValueAtTime(120, t);
    thump.frequency.exponentialRampToValueAtTime(30, t + 0.1);

    osc.connect(formant);
    formant.connect(gain);
    thump.connect(gain);

    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.start(t);
    thump.start(t);
    osc.stop(t + 0.25);
    thump.stop(t + 0.1);
  }

  // --- EATING FOOD CRUNCH & SWALLOW ---
  playEatingCrunch() {
    this.ensureContext();
    if (!this.ctx || this.muted) return;

    const t = this.ctx.currentTime;
    const gain = this.ctx.createGain();
    gain.connect(this.sfxGain);

    // 3 rapid mini-crunches
    for (let i = 0; i < 3; i++) {
      const ct = t + i * 0.14;
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer(0.08, 'pink');

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200 + Math.random() * 400, ct);
      filter.Q.setValueAtTime(3.0, ct);

      const sub = this.ctx.createOscillator();
      sub.type = 'triangle';
      sub.frequency.setValueAtTime(180, ct);
      sub.frequency.exponentialRampToValueAtTime(70, ct + 0.06);

      noise.connect(filter);
      filter.connect(gain);
      sub.connect(gain);

      noise.start(ct);
      sub.start(ct);
      noise.stop(ct + 0.08);
      sub.stop(ct + 0.06);
    }

    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
  }

  // --- CREEPER HISS (SWELLING TERROR) ---
  playCreeperHiss() {
    this.ensureContext();
    if (!this.ctx || this.muted) return;

    const t = this.ctx.currentTime;
    const gain = this.ctx.createGain();
    gain.connect(this.sfxGain);

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(1.4, 'pink');

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2800, t);
    filter.frequency.linearRampToValueAtTime(4500, t + 1.4);

    noise.connect(filter);
    filter.connect(gain);

    gain.gain.setValueAtTime(0.04, t);
    gain.gain.linearRampToValueAtTime(0.55, t + 1.25);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);

    noise.start(t);
    noise.stop(t + 1.4);
  }

  // --- EXPLOSION BOOM (MASSIVE SUB-BASS & CRATER BLAST) ---
  playExplosion() {
    this.ensureContext();
    if (!this.ctx || this.muted) return;

    const t = this.ctx.currentTime;
    const gain = this.ctx.createGain();
    gain.connect(this.sfxGain);

    // Deep 35Hz sub-bass shockwave
    const sub = this.ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(140, t);
    sub.frequency.exponentialRampToValueAtTime(28, t + 1.1);

    // Shattering blast noise
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(1.2, 'pink');

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, t);
    filter.frequency.exponentialRampToValueAtTime(110, t + 1.2);

    sub.connect(gain);
    noise.connect(filter);
    filter.connect(gain);

    gain.gain.setValueAtTime(1.0, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

    sub.start(t);
    noise.start(t);
    sub.stop(t + 1.1);
    noise.stop(t + 1.2);
  }

  // --- ZOMBIE GUTTURAL GROAN ---
  playZombieGroan() {
    this.ensureContext();
    if (!this.ctx || this.muted) return;

    const t = this.ctx.currentTime;
    const gain = this.ctx.createGain();
    gain.connect(this.sfxGain);

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    const baseFreq = 85 + Math.random() * 25;
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.linearRampToValueAtTime(baseFreq * 1.2, t + 0.35);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.75, t + 0.85);

    // Dual vocal tract formant filter ("Huuuuhhhh")
    const formant = this.ctx.createBiquadFilter();
    formant.type = 'bandpass';
    formant.frequency.setValueAtTime(320, t);
    formant.Q.setValueAtTime(4.5, t);

    osc.connect(formant);
    formant.connect(gain);

    gain.gain.setValueAtTime(0.42, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);

    osc.start(t);
    osc.stop(t + 0.85);
  }

  // --- SKELETON BONE RATTLE ---
  playSkeletonRattle() {
    this.ensureContext();
    if (!this.ctx || this.muted) return;

    const t = this.ctx.currentTime;
    const gain = this.ctx.createGain();
    gain.connect(this.sfxGain);

    // 2 crisp bone clacks
    for (let i = 0; i < 2; i++) {
      const ct = t + i * 0.08;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800 + Math.random() * 300, ct);
      osc.frequency.exponentialRampToValueAtTime(600, ct + 0.04);

      osc.connect(gain);
      osc.start(ct);
      osc.stop(ct + 0.04);
    }

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  }

  // --- PIG OINK ---
  playPigOink() {
    this.ensureContext();
    if (!this.ctx || this.muted) return;

    const t = this.ctx.currentTime;
    const gain = this.ctx.createGain();
    gain.connect(this.sfxGain);

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.16);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, t);
    filter.Q.setValueAtTime(3.5, t);

    osc.connect(filter);
    filter.connect(gain);

    gain.gain.setValueAtTime(0.38, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.start(t);
    osc.stop(t + 0.18);
  }

  // --- COW MOO ---
  playCowMoo() {
    this.ensureContext();
    if (!this.ctx || this.muted) return;

    const t = this.ctx.currentTime;
    const gain = this.ctx.createGain();
    gain.connect(this.sfxGain);

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(130, t);
    osc.frequency.linearRampToValueAtTime(155, t + 0.35);
    osc.frequency.exponentialRampToValueAtTime(95, t + 0.9);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(380, t);
    filter.Q.setValueAtTime(3.0, t);

    osc.connect(filter);
    filter.connect(gain);

    gain.gain.setValueAtTime(0.42, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);

    osc.start(t);
    osc.stop(t + 0.9);
  }

  // --- C418-STYLE GENERATIVE AMBIENT SOUNDTRACK ---
  // Synthesizes soothing, iconic piano notes and warm Rhodes chords
  startC418Soundtrack() {
    if (this.musicPlaying || !this.ctx) return;
    this.musicPlaying = true;

    // C418 style melodic motifs in F# / D / G Major pentatonic
    const notes = [
      293.66, // D4
      329.63, // E4
      369.99, // F#4
      440.00, // A4
      493.88, // B4
      587.33, // D5
      659.25, // E5
      739.99, // F#5
    ];

    const chords = [
      [146.83, 220.00, 293.66, 369.99], // D Major 7
      [164.81, 246.94, 329.63, 392.00], // E Minor 7
      [196.00, 293.66, 369.99, 440.00], // G Major 7
      [220.00, 293.66, 369.99, 493.88], // A Sus / Bm
    ];

    let chordStep = 0;

    const playAmbientPhrase = () => {
      if (!this.musicPlaying || !this.ctx) return;

      const t = this.ctx.currentTime;
      const currentChord = chords[chordStep % chords.length];
      chordStep++;

      // 1. Play Warm Pad Chord
      currentChord.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        const padGain = this.ctx.createGain();
        padGain.connect(this.musicGain);

        const stagger = idx * 0.12;
        padGain.gain.setValueAtTime(0, t + stagger);
        padGain.gain.linearRampToValueAtTime(0.045, t + stagger + 1.8);
        padGain.gain.exponentialRampToValueAtTime(0.001, t + stagger + 8.0);

        osc.connect(padGain);
        osc.start(t + stagger);
        osc.stop(t + stagger + 8.0);
      });

      // 2. Play Delicately Spaced Piano Melody Notes
      const melodyCount = 3 + Math.floor(Math.random() * 3);
      for (let m = 0; m < melodyCount; m++) {
        const noteDelay = 1.0 + m * (1.2 + Math.random() * 0.6);
        const pitch = notes[Math.floor(Math.random() * notes.length)];
        this.playPianoNote(pitch, t + noteDelay);
      }

      // Next phrase every 12 to 18 seconds (mimicking Minecraft's peaceful quiet moments)
      setTimeout(playAmbientPhrase, 12000 + Math.random() * 6000);
    };

    setTimeout(playAmbientPhrase, 2500);
  }

  // Realistic synthesized acoustic piano note (Hammer strike + fundamental + harmonic overtones)
  playPianoNote(freq, time) {
    if (!this.ctx) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const osc3 = this.ctx.createOscillator();

    osc1.type = 'triangle'; // Warm fundamental
    osc1.frequency.setValueAtTime(freq, time);

    osc2.type = 'sine'; // 2nd harmonic
    osc2.frequency.setValueAtTime(freq * 2, time);

    osc3.type = 'sine'; // 3rd harmonic bell chime
    osc3.frequency.setValueAtTime(freq * 3, time);

    const gain = this.ctx.createGain();
    gain.connect(this.musicGain);

    // Piano envelope: immediate percussive attack + long singing exponential decay
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.07, time + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 4.5);

    osc1.connect(gain);
    osc2.connect(gain);
    osc3.connect(gain);

    osc1.start(time);
    osc2.start(time);
    osc3.start(time);

    osc1.stop(time + 4.5);
    osc2.stop(time + 4.5);
    osc3.stop(time + 4.5);
  }

  setVolume(master, sfx, music) {
    this.masterVolume = master;
    this.sfxVolume = sfx;
    this.musicVolume = music;

    if (this.masterGain) this.masterGain.gain.value = this.masterVolume;
    if (this.sfxGain) this.sfxGain.gain.value = this.sfxVolume;
    if (this.musicGain) this.musicGain.gain.value = this.musicVolume;
  }
}

export const sound = new SoundSynthesizer();
