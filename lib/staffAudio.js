/**
 * KNSDC Staff Audio System
 * Uses Web Audio API to synthesize premium notification sounds without external assets.
 */
class StaffAudio {
  constructor() {
    this.audioCtx = null;
    this.masterGain = null;
    this.enabled = true;
  }

  init() {
    if (this.audioCtx) return;
    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.value = 0.5;
      this.masterGain.connect(this.audioCtx.destination);
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  }

  resume() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  /**
   * Play a premium notification chime (for new messages)
   */
  playChime() {
    if (!this.enabled) return;
    this.init();
    this.resume();
    
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    
    // Note 1
    this.createOscillator(880, now, 0.1, 0.05, 'triangle'); // A5
    // Note 2
    this.createOscillator(1318.51, now + 0.08, 0.2, 0.05, 'triangle'); // E6
  }

  /**
   * Play a subtle "success" blip
   */
  playSuccess() {
    if (!this.enabled) return;
    this.init();
    this.resume();
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    this.createOscillator(1174.66, now, 0.05, 0.02, 'sine');
    this.createOscillator(1567.98, now + 0.05, 0.1, 0.02, 'sine');
  }

  /**
   * Play a high-priority SOS Alarm
   */
  playSOS() {
    if (!this.enabled) return;
    this.init();
    this.resume();
    if (!this.audioCtx) return;
    
    const now = this.audioCtx.currentTime;
    // Siren effect
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.5);
    osc.frequency.exponentialRampToValueAtTime(440, now + 1.0);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.1);
    gain.gain.linearRampToValueAtTime(0, now + 1.0);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(now);
    osc.stop(now + 1.0);
  }

  createOscillator(freq, time, duration, volume, type = 'sine') {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(time);
    osc.stop(time + duration);
  }
}

// Global instance
window.staffAudio = new StaffAudio();
