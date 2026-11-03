/**
 * Web Audio API Synthesizer for retro arcade sound effects and chiptune music.
 * Completely self-contained, lightweight, zero external MP3/WAV dependencies.
 */

class SoundSystem {
  private ctx: AudioContext | null = null;
  public sfxEnabled: boolean = true;
  public musicEnabled: boolean = false;
  private musicInterval: number | null = null;
  private musicStep: number = 0;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Quick sound effect helper
  public playTone(freq: number, duration: number, type: OscillatorType = 'square', vol: number = 0.05, endFreq?: number) {
    if (!this.sfxEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      if (endFreq !== undefined) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), this.ctx.currentTime + duration);
      }

      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // AudioContext safe catch
    }
  }

  public playShoot() {
    this.playTone(650, 0.05, 'square', 0.025, 200);
  }

  public playSpecialShoot() {
    this.playTone(880, 0.08, 'sawtooth', 0.04, 300);
  }

  public playHit() {
    this.playTone(140, 0.18, 'sawtooth', 0.05, 50);
  }

  public playEnemyExplode(isBoss: boolean = false) {
    if (isBoss) {
      // Deeper rumble
      this.playTone(90, 0.45, 'sawtooth', 0.08, 30);
      setTimeout(() => this.playTone(150, 0.35, 'square', 0.07, 40), 100);
      setTimeout(() => this.playTone(220, 0.3, 'sawtooth', 0.06, 50), 200);
    } else {
      this.playTone(240, 0.1, 'triangle', 0.04, 80);
    }
  }

  public playEvidencePickup() {
    if (!this.sfxEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.025, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.04 + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.08);
      });
    } catch {}
  }

  public playPowerup() {
    if (!this.sfxEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [440, 554.37, 659.25, 880].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.035, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.1);
      });
    } catch {}
  }

  public playSM12Nuke() {
    if (!this.sfxEnabled) return;
    this.playTone(300, 0.5, 'sawtooth', 0.08, 900);
    setTimeout(() => this.playTone(600, 0.4, 'square', 0.07, 120), 250);
  }

  public playBossAlert() {
    if (!this.sfxEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(700, now + i * 0.18);
        osc.frequency.linearRampToValueAtTime(450, now + i * 0.18 + 0.12);
        gain.gain.setValueAtTime(0.06, now + i * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.18 + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.18);
        osc.stop(now + i * 0.18 + 0.16);
      }
    } catch {}
  }

  public playVictory() {
    if (!this.sfxEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const notes = [
        { f: 523.25, d: 0.12 },
        { f: 659.25, d: 0.12 },
        { f: 783.99, d: 0.12 },
        { f: 1046.5, d: 0.35 },
      ];
      let t = this.ctx.currentTime;
      notes.forEach((n) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.value = n.f;
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + n.d);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(t);
        osc.stop(t + n.d);
        t += n.d;
      });
    } catch {}
  }

  public playGameOver() {
    if (!this.sfxEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const notes = [400, 350, 300, 220, 150];
      let t = this.ctx.currentTime;
      notes.forEach((freq) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.045, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(t);
        osc.stop(t + 0.16);
        t += 0.14;
      });
    } catch {}
  }

  // Chiptune background music loop
  public toggleMusic(enable?: boolean): boolean {
    if (enable !== undefined) {
      this.musicEnabled = enable;
    } else {
      this.musicEnabled = !this.musicEnabled;
    }

    if (this.musicEnabled) {
      this.startMusicLoop();
    } else {
      this.stopMusicLoop();
    }
    return this.musicEnabled;
  }

  private startMusicLoop() {
    this.stopMusicLoop();
    this.initCtx();
    const bassNotes = [110, 110, 146.83, 146.83, 130.81, 130.81, 98.0, 123.47];
    const leadNotes = [220, 277.18, 329.63, 440, 329.63, 277.18, 246.94, 293.66];

    this.musicInterval = window.setInterval(() => {
      if (!this.musicEnabled || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const bFreq = bassNotes[this.musicStep % bassNotes.length];
        const lFreq = leadNotes[this.musicStep % leadNotes.length];

        // Bass osc
        const bOsc = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        bOsc.type = 'triangle';
        bOsc.frequency.value = bFreq;
        bGain.gain.setValueAtTime(0.02, now);
        bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        bOsc.connect(bGain);
        bGain.connect(this.ctx.destination);
        bOsc.start(now);
        bOsc.stop(now + 0.19);

        // Lead arp
        if (this.musicStep % 2 === 0) {
          const lOsc = this.ctx.createOscillator();
          const lGain = this.ctx.createGain();
          lOsc.type = 'square';
          lOsc.frequency.value = lFreq;
          lGain.gain.setValueAtTime(0.012, now);
          lGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
          lOsc.connect(lGain);
          lGain.connect(this.ctx.destination);
          lOsc.start(now);
          lOsc.stop(now + 0.13);
        }

        this.musicStep++;
      } catch {}
    }, 200);
  }

  private stopMusicLoop() {
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

export const sounds = new SoundSystem();
