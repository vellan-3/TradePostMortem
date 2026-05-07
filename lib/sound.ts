// lib/sound.ts

let _ctx: AudioContext | null = null;

function ctx(): AudioContext {
  if (!_ctx) _ctx = new AudioContext();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

/**
 * Played when the user submits a wallet address.
 * Short forward-motion whoosh. Confirms the action without being loud.
 */
export function playSubmit() {
  try {
    const c = ctx();
    const t = c.currentTime;

    const osc  = c.createOscillator();
    const gain = c.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(480, t + 0.22);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.09, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);

    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t);
    osc.stop(t + 0.25);
  } catch { /* AudioContext blocked or unavailable */ }
}

/**
 * Played when a trade card expands and the diagnosis is a loss.
 * Low soft thud. Weight without harshness.
 * Do NOT call this for GOOD_TRADE or UNKNOWN.
 */
export function playLossTrade() {
  try {
    const c = ctx();
    const t = c.currentTime;

    const osc  = c.createOscillator();
    const gain = c.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.28);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.14, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);

    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t);
    osc.stop(t + 0.32);
  } catch { /* AudioContext blocked */ }
}

