export type SoundType = 'radar' | 'beacon' | 'chime' | 'bell' | 'alarm' | 'digital';

const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', gain = 0.3, startTime = 0) {
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(gain, audioCtx.currentTime + startTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + startTime + duration);
  osc.connect(g);
  g.connect(audioCtx.destination);
  osc.start(audioCtx.currentTime + startTime);
  osc.stop(audioCtx.currentTime + startTime + duration);
}

// Radar - iPhone-style ascending triple beep
function playRadar() {
  [0, 0.15, 0.30].forEach((t, i) => {
    playTone(880 + i * 220, 0.12, 'sine', 0.35, t);
  });
  // Repeat after a pause
  [0.7, 0.85, 1.0].forEach((t, i) => {
    playTone(880 + i * 220, 0.12, 'sine', 0.35, t);
  });
}

// Beacon - Windows alarm-style pulsing tone
function playBeacon() {
  const pattern = [0, 0.2, 0.4, 0.8, 1.0, 1.2];
  pattern.forEach(t => {
    playTone(1047, 0.15, 'square', 0.2, t);
    playTone(1319, 0.15, 'square', 0.15, t + 0.02);
  });
}

// Chime - gentle descending melodic chime
function playChime() {
  const notes = [1319, 1175, 988, 784];
  notes.forEach((freq, i) => {
    playTone(freq, 0.4, 'sine', 0.25, i * 0.25);
  });
  // Soft harmony
  notes.forEach((freq, i) => {
    playTone(freq * 1.5, 0.3, 'sine', 0.1, i * 0.25 + 0.05);
  });
}

// Bell - classic bell ring
function playBell() {
  [0, 0.5, 1.0].forEach(t => {
    playTone(2093, 0.6, 'sine', 0.2, t);
    playTone(2637, 0.4, 'sine', 0.12, t);
    playTone(3136, 0.3, 'sine', 0.08, t + 0.01);
  });
}

// Alarm - urgent Windows-style alarm clock
function playAlarm() {
  for (let i = 0; i < 8; i++) {
    const t = i * 0.15;
    const freq = i % 2 === 0 ? 880 : 698;
    playTone(freq, 0.12, 'square', 0.25, t);
  }
  // Second burst
  for (let i = 0; i < 8; i++) {
    const t = 1.5 + i * 0.15;
    const freq = i % 2 === 0 ? 880 : 698;
    playTone(freq, 0.12, 'square', 0.25, t);
  }
}

// Digital - retro digital watch beep
function playDigital() {
  [0, 0.1, 0.3, 0.4, 0.7].forEach(t => {
    playTone(2000, 0.08, 'square', 0.2, t);
  });
  [1.0, 1.1, 1.3, 1.4, 1.7].forEach(t => {
    playTone(2000, 0.08, 'square', 0.2, t);
  });
}

export const SOUNDS: Record<SoundType, { label: string; description: string; play: () => void }> = {
  radar: { label: 'Radar', description: 'Ascending triple beep', play: playRadar },
  beacon: { label: 'Beacon', description: 'Pulsing alarm tone', play: playBeacon },
  chime: { label: 'Chime', description: 'Gentle melodic chime', play: playChime },
  bell: { label: 'Bell', description: 'Classic bell ring', play: playBell },
  alarm: { label: 'Alarm', description: 'Urgent alarm clock', play: playAlarm },
  digital: { label: 'Digital', description: 'Retro watch beep', play: playDigital },
};

export function playSound(type: SoundType) {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  SOUNDS[type].play();
}

export function previewSound(type: SoundType) {
  playSound(type);
}
