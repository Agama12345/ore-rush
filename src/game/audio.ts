/*
 * Ultra-high-fidelity procedural Minecraft audio engine
 * Complete procedural synthesis of authentic Minecraft sounds:
 * - Rich resonant multi-formant cow moos with throat rattle & pitch inflection
 * - Pig oinks, sheep baa, chicken cluck, zombie groan, skeleton rattle, creeper hiss
 * - Material-accurate footsteps, mining, block breaking, and placing
 * - Ambient campfire crackling, bubbling lava, blizzard wind, cave echo
 * - Zero network latency, 100% reliable, zero external file dependency
 */

export type Material = "grass" | "stone" | "wood" | "sand" | "glass" | "wool" | "metal" | "plant" | "liquid" | "snow" | "fire";

type ToneOpts = {
  type?: OscillatorType;
  vol?: number;
  slide?: number;
  delay?: number;
  attack?: number;
  decay?: number;
  detune?: number;
};

export class SoundEngine {
  enabled = true;
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private dry: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private reverbSend: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private pinkNoiseBuffer: AudioBuffer | null = null;
  private last = new Map<string, number>();
  private ambientWindGain: GainNode | null = null;

  ensure(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      const ctx = new Ctor();
      this.ctx = ctx;

      // Master bus with limiter & compressor
      this.master = ctx.createGain();
      this.master.gain.value = 0.85;

      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -12;
      comp.knee.value = 12;
      comp.ratio.value = 6;
      comp.attack.value = 0.003;
      comp.release.value = 0.15;
      this.master.connect(comp).connect(ctx.destination);

      this.dry = ctx.createGain();
      this.dry.gain.value = 0.95;
      this.dry.connect(this.master);

      // Procedural cave/outdoor reverb impulse
      this.reverbNode = ctx.createConvolver();
      this.reverbNode.buffer = this.buildReverbImpulse(ctx, 2.0, 2.5);
      this.reverbSend = ctx.createGain();
      this.reverbSend.gain.value = 0.08;
      this.reverbSend.connect(this.reverbNode).connect(this.master);

      // Noise buffers
      this.noiseBuffer = this.buildWhiteNoise(ctx, 2.0);
      this.pinkNoiseBuffer = this.buildPinkNoise(ctx, 2.0);
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  setEnabled(v: boolean) {
    this.enabled = v;
    if (this.master) this.master.gain.value = v ? 0.85 : 0;
  }

  setEnvironment(caveFactor: number) {
    if (!this.ctx || !this.reverbSend) return;
    const rev = 0.06 + Math.min(1, Math.max(0, caveFactor)) * 0.45;
    this.reverbSend.gain.setTargetAtTime(rev, this.ctx.currentTime, 0.4);
  }

  private buildWhiteNoise(ctx: AudioContext, sec: number): AudioBuffer {
    const len = Math.floor(ctx.sampleRate * sec);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  private buildPinkNoise(ctx: AudioContext, sec: number): AudioBuffer {
    const len = Math.floor(ctx.sampleRate * sec);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return buf;
  }

  private buildReverbImpulse(ctx: AudioContext, seconds: number, decay: number): AudioBuffer {
    const rate = ctx.sampleRate;
    const len = Math.floor(rate * seconds);
    const impulse = ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        const t = i / len;
        const env = Math.pow(1 - t, decay);
        data[i] = (Math.random() * 2 - 1) * env;
      }
    }
    return impulse;
  }

  private throttle(key: string, gap: number): boolean {
    const ctx = this.ctx;
    if (!ctx) return false;
    const now = ctx.currentTime;
    const lastTime = this.last.get(key) ?? -1;
    if (now - lastTime < gap) return false;
    this.last.set(key, now);
    return true;
  }

  // Generic tone generator
  private tone(freq: number, dur: number, opts: ToneOpts = {}) {
    const ctx = this.ensure();
    if (!ctx || !this.dry) return;
    const t0 = ctx.currentTime + (opts.delay ?? 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = opts.type ?? "sine";
    if (opts.detune) osc.detune.setValueAtTime(opts.detune, t0);
    osc.frequency.setValueAtTime(Math.max(20, freq), t0);
    if (opts.slide) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.slide), t0 + dur);
    }

    const vol = opts.vol ?? 0.15;
    const att = opts.attack ?? 0.008;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + att);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    osc.connect(gain).connect(this.dry);
    if (this.reverbSend) gain.connect(this.reverbSend);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  // Generic noise burst
  private noise(
    dur: number,
    vol = 0.15,
    freq = 1200,
    filterType: BiquadFilterType = "lowpass",
    delay = 0,
    q = 1.0,
    usePink = false
  ) {
    const ctx = this.ensure();
    if (!ctx || !this.dry) return;
    const buf = usePink && this.pinkNoiseBuffer ? this.pinkNoiseBuffer : this.noiseBuffer;
    if (!buf) return;

    const t0 = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = 0.85 + Math.random() * 0.35;

    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.Q.value = q;
    filter.frequency.setValueAtTime(freq, t0);
    filter.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.35), t0 + dur);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    src.connect(filter).connect(gain).connect(this.dry);
    if (this.reverbSend) gain.connect(this.reverbSend);
    src.start(t0, Math.random() * 0.5);
    src.stop(t0 + dur + 0.05);
  }

  /* =====================================================================
   *  Vocal Formant Synth for Authentic Minecraft Animal Voices
   * ===================================================================== */
  private vocalize(opts: {
    pitchTrack: number[];
    duration: number;
    formants: { f: number; gain: number; q: number }[];
    formantsEnd?: { f: number; gain: number; q: number }[];
    volume?: number;
    throatRoughness?: number;
    tremoloRate?: number;
    tremoloDepth?: number;
    delay?: number;
  }) {
    const ctx = this.ensure();
    if (!ctx || !this.dry || !this.reverbSend) return;

    const t0 = ctx.currentTime + (opts.delay ?? 0);
    const dur = opts.duration;
    const vol = opts.volume ?? 0.35;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.0001, t0);
    masterGain.gain.exponentialRampToValueAtTime(vol, t0 + Math.min(0.08, dur * 0.15));
    masterGain.gain.setValueAtTime(vol, t0 + dur * 0.7);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    masterGain.connect(this.dry);
    masterGain.connect(this.reverbSend);

    // Multi-saw/tri glottal source
    const sourceBus = ctx.createGain();
    sourceBus.gain.value = 0.5;

    const oscCount = opts.throatRoughness ? 3 : 2;
    for (let i = 0; i < oscCount; i++) {
      const osc = ctx.createOscillator();
      osc.type = i === 0 ? "sawtooth" : i === 1 ? "triangle" : "sawtooth";
      const detune = (i - 1) * (opts.throatRoughness ?? 0.15) * 12;

      const pitches = opts.pitchTrack;
      const stepTime = dur / Math.max(1, pitches.length - 1);
      osc.frequency.setValueAtTime(pitches[0], t0);
      for (let p = 1; p < pitches.length; p++) {
        osc.frequency.linearRampToValueAtTime(pitches[p], t0 + p * stepTime);
      }
      osc.detune.setValueAtTime(detune, t0);

      // Tremolo / wobbly vibrato
      if (opts.tremoloRate) {
        const lfo = ctx.createOscillator();
        lfo.frequency.value = opts.tremoloRate;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = opts.tremoloDepth ?? 6;
        lfo.connect(lfoGain).connect(osc.frequency);
        lfo.start(t0);
        lfo.stop(t0 + dur + 0.05);
      }

      osc.connect(sourceBus);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    }

    // Parallel formant bandpass filters
    opts.formants.forEach((fmt, idx) => {
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.Q.value = fmt.q;
      bp.frequency.setValueAtTime(fmt.f, t0);
      if (opts.formantsEnd && opts.formantsEnd[idx]) {
        bp.frequency.exponentialRampToValueAtTime(opts.formantsEnd[idx].f, t0 + dur * 0.9);
      }

      const fg = ctx.createGain();
      fg.gain.value = fmt.gain;
      sourceBus.connect(bp).connect(fg).connect(masterGain);
    });

    // Throat noise / breath
    if (this.pinkNoiseBuffer) {
      const breath = ctx.createBufferSource();
      breath.buffer = this.pinkNoiseBuffer;
      const bf = ctx.createBiquadFilter();
      bf.type = "bandpass";
      bf.frequency.value = 1400;
      bf.Q.value = 1.2;
      const bg = ctx.createGain();
      bg.gain.value = vol * 0.18;
      breath.connect(bf).connect(bg).connect(masterGain);
      breath.start(t0, Math.random());
      breath.stop(t0 + dur + 0.05);
    }
  }

  /* =====================================================================
   *  Minecraft Animal Calls
   * ===================================================================== */

  // Authentic Deep Minecraft Cow Moo
  cowMoo() {
    if (!this.throttle("cow_moo", 1.2)) return;
    const variant = Math.floor(Math.random() * 3);

    if (variant === 0) {
      // Classic deep rising then falling warm "Moo-oooh"
      this.vocalize({
        pitchTrack: [85, 110, 128, 122, 95, 78],
        duration: 1.35,
        formants: [
          { f: 320, gain: 1.2, q: 4.5 },
          { f: 720, gain: 0.8, q: 5.5 },
          { f: 1250, gain: 0.35, q: 6.0 },
        ],
        formantsEnd: [
          { f: 450, gain: 1.0, q: 4.0 },
          { f: 880, gain: 0.6, q: 5.0 },
          { f: 1100, gain: 0.25, q: 5.0 },
        ],
        volume: 0.42,
        throatRoughness: 0.35,
        tremoloRate: 4.2,
        tremoloDepth: 4.5,
      });
    } else if (variant === 1) {
      // Shorter, higher questioning moo
      this.vocalize({
        pitchTrack: [115, 138, 142, 118, 92],
        duration: 1.05,
        formants: [
          { f: 360, gain: 1.1, q: 4.5 },
          { f: 780, gain: 0.85, q: 5.5 },
          { f: 1400, gain: 0.4, q: 6.0 },
        ],
        formantsEnd: [
          { f: 420, gain: 1.0, q: 4.0 },
          { f: 820, gain: 0.65, q: 5.0 },
          { f: 1200, gain: 0.3, q: 5.0 },
        ],
        volume: 0.38,
        throatRoughness: 0.28,
        tremoloRate: 5.0,
        tremoloDepth: 3.8,
      });
    } else {
      // Deep rumbling chest moo
      this.vocalize({
        pitchTrack: [72, 94, 108, 102, 82, 68],
        duration: 1.6,
        formants: [
          { f: 280, gain: 1.3, q: 4.0 },
          { f: 650, gain: 0.9, q: 5.0 },
          { f: 1100, gain: 0.3, q: 5.5 },
        ],
        formantsEnd: [
          { f: 380, gain: 1.0, q: 3.5 },
          { f: 720, gain: 0.7, q: 4.5 },
          { f: 980, gain: 0.2, q: 5.0 },
        ],
        volume: 0.45,
        throatRoughness: 0.4,
        tremoloRate: 3.8,
        tremoloDepth: 5.0,
      });
    }
  }

  // Authentic Minecraft Pig Oink
  pigOink() {
    if (!this.throttle("pig_oink", 0.8)) return;
    const snorts = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < snorts; i++) {
      const basePitch = 120 + Math.random() * 30;
      this.vocalize({
        pitchTrack: [basePitch, basePitch * 1.15, basePitch * 0.85],
        duration: 0.18,
        delay: i * 0.22,
        formants: [
          { f: 480, gain: 1.2, q: 4.0 },
          { f: 1250, gain: 0.8, q: 5.0 },
          { f: 2600, gain: 0.4, q: 6.0 },
        ],
        volume: 0.32,
        throatRoughness: 0.65,
        tremoloRate: 32,
        tremoloDepth: 18,
      });
    }
  }

  // Authentic Minecraft Sheep Baa
  sheepBaa() {
    if (!this.throttle("sheep_baa", 1.2)) return;
    const baseF = 260 + Math.random() * 40;
    this.vocalize({
      pitchTrack: [baseF, baseF * 1.18, baseF * 1.05, baseF * 0.9],
      duration: 0.85,
      formants: [
        { f: 680, gain: 1.1, q: 5.5 },
        { f: 1550, gain: 0.8, q: 6.5 },
        { f: 2700, gain: 0.35, q: 7.0 },
      ],
      formantsEnd: [
        { f: 820, gain: 1.0, q: 5.0 },
        { f: 1350, gain: 0.7, q: 6.0 },
        { f: 2500, gain: 0.25, q: 6.5 },
      ],
      volume: 0.32,
      throatRoughness: 0.4,
      tremoloRate: 8.5,
      tremoloDepth: 24,
    });
  }

  // Authentic Minecraft Chicken Cluck
  chickenCluck() {
    if (!this.throttle("chicken_cluck", 0.6)) return;
    const clucks = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < clucks; i++) {
      const f = 580 + Math.random() * 120;
      this.tone(f, 0.07, {
        type: "triangle",
        vol: 0.16,
        slide: f * 0.72,
        delay: i * 0.11,
      });
      this.noise(0.05, 0.08, 2200, "bandpass", i * 0.11, 2.0);
    }
  }

  // Authentic Minecraft Zombie Groan
  zombieGroan() {
    if (!this.throttle("zombie_groan", 1.5)) return;
    const baseF = 62 + Math.random() * 18;
    this.vocalize({
      pitchTrack: [baseF, baseF * 1.25, baseF * 1.15, baseF * 0.82],
      duration: 1.45,
      formants: [
        { f: 420, gain: 1.3, q: 4.2 },
        { f: 920, gain: 0.75, q: 5.0 },
        { f: 2100, gain: 0.2, q: 6.0 },
      ],
      formantsEnd: [
        { f: 360, gain: 1.1, q: 4.0 },
        { f: 780, gain: 0.6, q: 4.5 },
        { f: 1900, gain: 0.15, q: 5.0 },
      ],
      volume: 0.42,
      throatRoughness: 0.85,
      tremoloRate: 3.5,
      tremoloDepth: 6.0,
    });
  }

  // Skeleton rattle & bow
  skeletonRattle() {
    if (!this.throttle("skeleton_rattle", 1.0)) return;
    for (let i = 0; i < 3; i++) {
      this.tone(280 + Math.random() * 140, 0.04, {
        type: "square",
        vol: 0.1,
        slide: 180,
        delay: i * 0.06,
      });
      this.noise(0.04, 0.12, 3400, "highpass", i * 0.06);
    }
  }

  // Creeper fuse hiss: "SSSSSSSSsssss"
  creeperHiss() {
    this.noise(1.4, 0.32, 4800, "bandpass", 0, 1.2, true);
    this.noise(1.4, 0.2, 2200, "highpass", 0, 0.8, false);
  }

  /* =====================================================================
   *  Material-aware Footsteps, Mining, Breaking & Placing
   * ===================================================================== */

  step(mat: Material) {
    if (!this.throttle("step", 0.15)) return;
    const detune = 0.9 + Math.random() * 0.2;

    switch (mat) {
      case "grass":
      case "plant":
        this.noise(0.08, 0.22, 1400 * detune, "lowpass", 0, 0.8, true);
        this.noise(0.04, 0.12, 3200 * detune, "bandpass", 0, 1.5);
        break;
      case "wood":
        this.tone(160 * detune, 0.07, { type: "triangle", vol: 0.22, slide: 90 * detune });
        this.noise(0.06, 0.14, 950 * detune, "bandpass", 0, 1.2);
        break;
      case "stone":
      case "metal":
        this.tone(140 * detune, 0.05, { type: "square", vol: 0.12, slide: 80 });
        this.noise(0.05, 0.2, 1600 * detune, "bandpass", 0, 1.8);
        break;
      case "sand":
      case "snow":
        this.noise(0.09, 0.2, 1100 * detune, "lowpass", 0, 0.7, true);
        this.noise(0.05, 0.15, 2600 * detune, "bandpass", 0, 1.0);
        break;
      case "glass":
        this.tone(480 * detune, 0.05, { type: "sine", vol: 0.14, slide: 280 });
        this.noise(0.04, 0.12, 3800 * detune, "highpass");
        break;
      case "wool":
        this.noise(0.08, 0.16, 650 * detune, "lowpass", 0, 0.5, true);
        break;
      case "liquid":
        this.noise(0.12, 0.18, 900, "lowpass", 0, 0.8);
        this.tone(320 + Math.random() * 120, 0.08, { type: "sine", vol: 0.06, slide: 180 });
        break;
      default:
        this.noise(0.06, 0.16, 1200 * detune, "lowpass");
    }
  }

  mine(mat: Material) {
    if (!this.throttle("mine", 0.16)) return;
    const detune = 0.88 + Math.random() * 0.24;

    switch (mat) {
      case "stone":
      case "metal":
        this.tone(180 * detune, 0.06, { type: "square", vol: 0.18, slide: 95 * detune });
        this.noise(0.05, 0.22, 1800 * detune, "bandpass", 0, 2.2);
        break;
      case "wood":
        this.tone(190 * detune, 0.08, { type: "triangle", vol: 0.25, slide: 110 * detune });
        this.noise(0.06, 0.16, 1100 * detune, "bandpass", 0, 1.4);
        break;
      case "grass":
      case "plant":
      case "sand":
      case "snow":
        this.noise(0.07, 0.2, 1400 * detune, "lowpass", 0, 0.9, true);
        break;
      case "glass":
        this.tone(620 * detune, 0.06, { type: "sine", vol: 0.15, slide: 380 });
        this.noise(0.05, 0.18, 4200 * detune, "highpass");
        break;
      default:
        this.noise(0.06, 0.18, 1200, "bandpass");
    }
  }

  broke(mat: Material, ore = false) {
    const detune = 0.92 + Math.random() * 0.16;

    switch (mat) {
      case "stone":
      case "metal":
        this.tone(120 * detune, 0.18, { type: "square", vol: 0.28, slide: 55 });
        this.noise(0.18, 0.35, 1200 * detune, "lowpass", 0, 1.2);
        if (ore) {
          this.tone(780 * detune, 0.18, { type: "triangle", vol: 0.18, slide: 1100 });
          this.tone(1170 * detune, 0.22, { type: "sine", vol: 0.12, delay: 0.04 });
        }
        break;
      case "wood":
        this.tone(150 * detune, 0.16, { type: "triangle", vol: 0.3, slide: 75 });
        this.noise(0.16, 0.3, 850 * detune, "lowpass", 0, 1.0);
        break;
      case "glass":
        this.noise(0.24, 0.35, 5200, "highpass", 0, 1.2);
        [1400, 2100, 2900].forEach((f, idx) => {
          this.tone(f * detune, 0.14, { type: "sine", vol: 0.1, delay: idx * 0.03, slide: f * 0.6 });
        });
        break;
      case "grass":
      case "plant":
      case "sand":
      case "snow":
        this.noise(0.15, 0.28, 1100 * detune, "lowpass", 0, 0.8, true);
        break;
      default:
        this.noise(0.15, 0.28, 1000, "lowpass");
    }
  }

  place(mat: Material) {
    if (!this.throttle("place", 0.06)) return;
    const detune = 0.92 + Math.random() * 0.16;

    switch (mat) {
      case "wood":
        this.tone(210 * detune, 0.09, { type: "triangle", vol: 0.24, slide: 120 });
        this.noise(0.06, 0.14, 1200 * detune, "bandpass");
        break;
      case "stone":
      case "metal":
        this.tone(160 * detune, 0.08, { type: "square", vol: 0.18, slide: 90 });
        this.noise(0.06, 0.18, 1600 * detune, "bandpass");
        break;
      case "glass":
        this.tone(520 * detune, 0.07, { type: "sine", vol: 0.16, slide: 320 });
        this.noise(0.05, 0.14, 3600, "highpass");
        break;
      default:
        this.noise(0.08, 0.22, 1200 * detune, "lowpass", 0, 0.8, true);
    }
  }

  /* =====================================================================
   *  Combat, Tools, Food & UI
   * ===================================================================== */

  swing() {
    if (!this.throttle("swing", 0.14)) return;
    this.noise(0.12, 0.12, 1900, "bandpass", 0, 0.8);
    this.tone(360, 0.08, { type: "sine", vol: 0.06, slide: 160 });
  }

  hit(crit = false) {
    this.noise(0.14, crit ? 0.32 : 0.22, 900, "lowpass");
    this.tone(crit ? 360 : 220, 0.12, { type: "triangle", vol: 0.22, slide: 95 });
    if (crit) {
      this.tone(720, 0.16, { type: "sine", vol: 0.14, delay: 0.02, slide: 380 });
    }
  }

  bowDraw() {
    this.tone(180, 0.22, { type: "sine", vol: 0.08, slide: 440 });
    this.noise(0.2, 0.06, 1200, "bandpass");
  }

  bowShoot() {
    this.noise(0.14, 0.24, 2800, "highpass");
    this.tone(480, 0.12, { type: "sine", vol: 0.14, slide: 190 });
  }

  arrowHit() {
    this.tone(850, 0.08, { type: "square", vol: 0.14, slide: 320 });
    this.noise(0.08, 0.12, 2200, "bandpass");
  }

  hurt() {
    // Classic "OOF!" sound
    this.vocalize({
      pitchTrack: [160, 115, 80],
      duration: 0.22,
      formants: [
        { f: 580, gain: 1.2, q: 4.5 },
        { f: 1050, gain: 0.7, q: 5.5 },
      ],
      volume: 0.45,
      throatRoughness: 0.3,
    });
    this.noise(0.14, 0.18, 750, "lowpass");
  }

  die() {
    this.vocalize({
      pitchTrack: [180, 140, 95, 60],
      duration: 0.65,
      formants: [
        { f: 620, gain: 1.1, q: 4.0 },
        { f: 1100, gain: 0.6, q: 5.0 },
      ],
      volume: 0.48,
      throatRoughness: 0.4,
    });
    this.noise(0.3, 0.25, 600, "lowpass", 0.1);
  }

  eat() {
    for (let i = 0; i < 3; i++) {
      this.noise(0.08, 0.16, 1400 + i * 200, "bandpass", i * 0.14, 1.8);
      this.tone(220 + i * 40, 0.06, { type: "triangle", vol: 0.08, delay: i * 0.14, slide: 320 });
    }
  }

  jump() {
    this.tone(260, 0.09, { type: "triangle", vol: 0.1, slide: 420 });
    this.noise(0.06, 0.08, 1200, "bandpass");
  }

  land(hard = false) {
    this.noise(hard ? 0.18 : 0.09, hard ? 0.32 : 0.16, 480, "lowpass");
    if (hard) {
      this.tone(85, 0.18, { type: "sine", vol: 0.28, slide: 40 });
    }
  }

  splash() {
    this.noise(0.4, 0.32, 2200, "bandpass", 0, 0.6);
    this.noise(0.25, 0.2, 700, "lowpass", 0.04);
    for (let i = 0; i < 4; i++) {
      this.tone(550 + Math.random() * 600, 0.09, {
        type: "sine",
        vol: 0.08,
        delay: 0.06 + i * 0.04,
        slide: 1400,
      });
    }
  }

  swim() {
    if (!this.throttle("swim", 0.45)) return;
    this.noise(0.25, 0.12, 850, "lowpass", 0, 0.7);
    this.tone(360 + Math.random() * 150, 0.1, { type: "sine", vol: 0.04, slide: 650, delay: 0.05 });
  }

  explode() {
    const ctx = this.ensure();
    if (!ctx) return;
    this.noise(1.6, 0.65, 650, "lowpass", 0, 0.6);
    this.noise(0.4, 0.45, 2600, "lowpass");
    this.tone(52, 1.1, { type: "sine", vol: 0.55, slide: 24 });
  }

  sizzle() {
    if (!this.throttle("sizzle", 0.25)) return;
    this.noise(0.8, 0.24, 4500, "highpass", 0, 0.6);
    this.noise(0.5, 0.14, 1800, "bandpass", 0.08, 1.2);
  }

  fall() {
    this.noise(0.5, 0.15, 900, "bandpass", 0, 0.6);
  }

  ore(combo: number) {
    const scale = [0, 2, 4, 7, 9, 12, 14, 16, 19];
    const step = scale[Math.min(combo - 1, scale.length - 1)];
    const freq = 523 * Math.pow(2, step / 12);
    this.tone(freq, 0.32, { type: "triangle", vol: 0.18, slide: freq * 1.02 });
    this.tone(freq * 1.5, 0.25, { type: "sine", vol: 0.1, delay: 0.04 });
  }

  combo(level: number) {
    this.tone(680 + level * 65, 0.22, { type: "square", vol: 0.1, slide: 1050 + level * 65 });
  }

  ui() {
    this.tone(650, 0.05, { type: "triangle", vol: 0.08, slide: 850 });
  }

  select() {
    this.tone(850, 0.04, { type: "triangle", vol: 0.06 });
  }

  open() {
    this.tone(320, 0.12, { type: "triangle", vol: 0.12, slide: 580 });
    this.noise(0.1, 0.08, 1200, "bandpass");
  }

  close() {
    this.tone(520, 0.12, { type: "triangle", vol: 0.12, slide: 280 });
    this.noise(0.1, 0.08, 1000, "bandpass");
  }

  deny() {
    this.tone(180, 0.14, { type: "square", vol: 0.08, slide: 120 });
  }

  craft() {
    this.tone(523, 0.12, { type: "triangle", vol: 0.14 });
    this.tone(659, 0.12, { type: "triangle", vol: 0.14, delay: 0.06 });
    this.tone(784, 0.18, { type: "triangle", vol: 0.18, delay: 0.12 });
  }

  pickup() {
    if (!this.throttle("pickup", 0.06)) return;
    this.tone(880, 0.07, { type: "triangle", vol: 0.12, slide: 1200 });
  }

  slot() {
    this.tone(520, 0.04, { type: "sine", vol: 0.08 });
  }

  start() {
    [392, 523, 659, 784].forEach((f, i) => {
      this.tone(f, 0.35, { type: "triangle", vol: 0.12, delay: i * 0.08, attack: 0.01 });
    });
  }

  over() {
    [523, 440, 349, 262].forEach((f, i) => {
      this.tone(f, 0.45, { type: "sawtooth", vol: 0.12, delay: i * 0.14 });
    });
  }

  ambient(night: boolean) {
    const base = night ? 174.6 : 261.6;
    [1, 1.5, 2].forEach((mult, i) => {
      this.tone(base * mult, 2.8, { type: "sine", vol: night ? 0.04 : 0.035, delay: i * 0.2, attack: 0.6 });
    });
  }

  // Blizzard howling wind ambience (for Cold Apocalypse)
  setBlizzard(active: boolean, intensity = 1.0) {
    const ctx = this.ensure();
    if (!ctx || !this.dry) return;

    if (!this.ambientWindGain) {
      if (!this.pinkNoiseBuffer) return;
      const src = ctx.createBufferSource();
      src.buffer = this.pinkNoiseBuffer;
      src.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 650;
      filter.Q.value = 2.5;

      // LFO for whistling gusts
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.25;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 350;
      lfo.connect(lfoGain).connect(filter.frequency);
      lfo.start();

      this.ambientWindGain = ctx.createGain();
      this.ambientWindGain.gain.value = 0;

      src.connect(filter).connect(this.ambientWindGain).connect(this.dry);
      src.start();
    }

    const target = active ? 0.18 * Math.min(1, intensity) : 0;
    this.ambientWindGain.gain.setTargetAtTime(target, ctx.currentTime, 1.0);
  }

  // Campfire warm crackle
  campfireCrackle() {
    if (!this.throttle("campfire_crackle", 0.12)) return;
    this.noise(0.04, 0.12, 3200 + Math.random() * 1200, "highpass");
    if (Math.random() < 0.4) {
      this.tone(140 + Math.random() * 80, 0.05, { type: "sine", vol: 0.06 });
    }
  }

  // Mob Sound Dispatcher
  mob(kind: number) {
    switch (kind) {
      case 0:
        this.pigOink();
        break;
      case 1:
        this.sheepBaa();
        break;
      case 2:
        this.cowMoo();
        break;
      case 3:
        this.zombieGroan();
        break;
      case 4:
        this.chickenCluck();
        break;
      case 5:
        this.skeletonRattle();
        break;
      case 6:
        this.creeperHiss();
        break;
      default:
        this.pigOink();
    }
  }

  mobHurt(kind: number) {
    this.hit();
    switch (kind) {
      case 0:
        this.tone(260, 0.18, { type: "sawtooth", vol: 0.25, slide: 180 });
        break;
      case 1:
        this.tone(420, 0.22, { type: "triangle", vol: 0.22, slide: 320 });
        break;
      case 2:
        this.cowMoo();
        break;
      case 3:
        this.tone(130, 0.32, { type: "sawtooth", vol: 0.3, slide: 75 });
        break;
      case 4:
        this.chickenCluck();
        break;
      case 5:
        this.skeletonRattle();
        break;
      default:
        this.tone(200, 0.2, { type: "square", vol: 0.2 });
    }
  }
}

export const sound = new SoundEngine();
