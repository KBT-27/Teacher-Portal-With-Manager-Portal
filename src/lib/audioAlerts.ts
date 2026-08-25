// Web Audio API browser sound alerts for QR Station Attendance

class AudioManager {
  private audioCtx: AudioContext | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * Positive on-time check-in chime (Ascending dual-tone)
   */
  public playPresentChime() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      // 880Hz (A5) -> 1320Hz (E6)
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.15);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.45);
    } catch (err) {
      console.warn('Audio present chime could not be played:', err);
    }
  }

  /**
   * Audible warning tone for Late check-in
   * Plays a distinct warning double-beep / descending tone to immediately alert the station officer & teacher.
   */
  public playLateAlertTone() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      
      // Tone 1: Warning buzz pulse 1 (520Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(520, now);
      osc1.frequency.exponentialRampToValueAtTime(420, now + 0.2);

      gain1.gain.setValueAtTime(0.35, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.22);

      // Tone 2: Warning buzz pulse 2 (380Hz, lower warning alert)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(380, now + 0.25);
      osc2.frequency.exponentialRampToValueAtTime(280, now + 0.55);

      gain2.gain.setValueAtTime(0.35, now + 0.25);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.25);
      osc2.stop(now + 0.6);

      // Speech synthesis alert if supported
      if ('speechSynthesis' in window) {
        try {
          const utterance = new SpeechSynthesisUtterance('Notice: Late check in recorded');
          utterance.rate = 1.1;
          utterance.volume = 0.8;
          window.speechSynthesis.speak(utterance);
        } catch {
          // ignore speech failure
        }
      }
    } catch (err) {
      console.warn('Audio late alert tone could not be played:', err);
    }
  }

  /**
   * Audible error alarm when attempting to use an unauthorized QR code or invalid link
   */
  public playInvalidCodeTone() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Triple sharp dissonant warning buzzers (600Hz / 300Hz saw waves)
      [0, 0.15, 0.3].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(620, now + offset);
        osc.frequency.exponentialRampToValueAtTime(220, now + offset + 0.12);

        gain.gain.setValueAtTime(0.4, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.14);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.14);
      });

      if ('speechSynthesis' in window) {
        try {
          const utterance = new SpeechSynthesisUtterance('Alert: Invalid QR code or link. Only the official daily QR code or verified link is allowed.');
          utterance.rate = 1.05;
          utterance.volume = 0.9;
          window.speechSynthesis.speak(utterance);
        } catch {
          // ignore speech error
        }
      }
    } catch (err) {
      console.warn('Audio invalid tone could not be played:', err);
    }
  }
}

export const audioAlerts = new AudioManager();
