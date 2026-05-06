# SLIP — Motion & Sound Implementation
### Based on your actual code. Minimal. Surgical. Nothing speculative.

---

## What you have, what gets motion, what gets sound

From the screenshots and code:

**Screens:** Landing (`page.tsx`) → ConnectScreen → LoadingScreen → ResultsView with TradeCards → VerdictPanel / MirrorPanel slide in as `.side-panel.open`

**The 4 animations that will actually elevate the experience:**
1. Trade cards stagger in when ResultsView mounts — currently they snap in with no entrance
2. TradeCard expand/collapse — currently `{expanded && ...}` snaps open with no transition
3. VerdictPanel and MirrorPanel — already use CSS `.open` class, need the slide to feel physical
4. LoadingScreen step opacity — already has `transition: 'opacity 0.3s ease'` inline, just needs the active step to animate in

**The 2 sounds that are actually useful:**
1. When the user clicks Generate Payslip → the analysis starts — confirms the action landed
2. When a trade card expands and it's a loss diagnosis — a low soft thud. Only for losses. One sound, one purpose: makes the bad trade feel real.

Everything else — hover states, page loads, panel opens, share modal — no sound. The app is a serious analysis tool, not a game.

---

## Step 1 — Install

```bash
npm install framer-motion
```

No other packages. Sound uses Web Audio API which is native to the browser.

---

## Step 2 — Sound engine

Create this file. It is self-contained, no imports needed anywhere else except the two places you call it.

```typescript
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
```

---

## Step 3 — Motion constants

One file, used by two components.

```typescript
// lib/motion.ts

// Ease curve used for all entrances — fast start, settles smoothly
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

// fadeUp — the only entrance variant you need
export const fadeUp = {
  hidden:  { opacity: 0, y: 18 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      delay: i * 0.055,        // stagger delay passed as custom prop
      ease: EASE_OUT_EXPO,
    },
  }),
};
```

---

## Step 4 — Wire sound into ConnectScreen

One line added to `handleSubmit`. That's the entire change to `ConnectScreen.tsx`.

```tsx
// ConnectScreen.tsx
// Add this import at the top:
import { playSubmit } from '@/lib/sound';

// Inside handleSubmit(), add one line before onAnalyze:
function handleSubmit() {
  const addr = input.trim();
  if (addr.length >= 32) {
    playSubmit();          // ← add this
    onAnalyze(addr);
  }
}
```

Same for the wallet connector buttons — they also call `onAnalyze`, so add `playSubmit()` before each:

```tsx
async function connectPhantom() {
  try {
    const { solana } = window as any;
    if (!solana?.isPhantom) { window.open('https://phantom.app/', '_blank'); return; }
    const response = await solana.connect();
    playSubmit();                                    // ← add
    onAnalyze(response.publicKey.toString());
  } catch { }
}

async function connectSolflare() {
  try {
    const { solflare } = window as any;
    if (!solflare) { window.open('https://solflare.com/', '_blank'); return; }
    await solflare.connect();
    if (solflare.publicKey) {
      playSubmit();                                  // ← add
      onAnalyze(solflare.publicKey.toString());
    }
  } catch { }
}
```

---

## Step 5 — Trade card stagger entrance in ResultsView

`ResultsView.tsx` renders a list of `TradeCard` components. Right now they all appear at once. Wrap the list in a Framer Motion container that staggers each card.

```tsx
// ResultsView.tsx
// Add imports at top:
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/motion';

// Replace this:
<div className="trades-list">
  {sorted.map((trade, i) => (
    <TradeCard
      key={...}
      trade={trade}
      rank={i + 1}
      wallet={wallet}
    />
  ))}
</div>

// With this:
<motion.div
  className="trades-list"
  initial="hidden"
  animate="visible"
>
  {sorted.map((trade, i) => (
    <motion.div
      key={[
        trade.signature,
        trade.tokenMint,
        trade.entryTimestamp,
        trade.exitTimestamp ?? 'open',
        trade.solSpent.toFixed(6),
      ].join(':')}
      variants={fadeUp}
      custom={i}              // passes i as the delay multiplier
    >
      <TradeCard
        trade={trade}
        rank={i + 1}
        wallet={wallet}
      />
    </motion.div>
  ))}
</motion.div>
```

That's it for ResultsView. The `custom={i}` prop passes the index into the `fadeUp` variant's delay calculation. Each card enters 55ms after the previous.

---

## Step 6 — Trade card expand animation + loss sound

`TradeCard.tsx` currently does `{expanded && <div className="trade-detail">}` which snaps open instantly. Replace it with an animated version and add the loss sound.

```tsx
// TradeCard.tsx
// Add imports at top:
import { motion, AnimatePresence } from 'framer-motion';
import { playLossTrade } from '@/lib/sound';
import { EASE_OUT_EXPO } from '@/lib/motion';

// The loss diagnosis codes — sound plays for these only
const LOSS_DIAGNOSES = ['BOUGHT_THE_TOP', 'DIAMOND_HANDS_REKT', 'SOLD_THE_BOTTOM', 'PAPER_HANDS'];

// Update the click handler:
// Replace:
<div className="trade-card-top" onClick={() => setExpanded(!expanded)}>

// With:
<div
  className="trade-card-top"
  onClick={() => {
    const opening = !expanded;
    setExpanded(opening);
    // Play loss sound when expanding a loss trade — not on collapse
    if (opening && LOSS_DIAGNOSES.includes(trade.diagnosis)) {
      playLossTrade();
    }
  }}
>

// Replace:
{expanded && (
  <div className="trade-detail">
    ...
  </div>
)}

// With:
<AnimatePresence>
  {expanded && (
    <motion.div
      className="trade-detail"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{
        height:  { duration: 0.32, ease: EASE_OUT_EXPO },
        opacity: { duration: 0.2, delay: expanded ? 0.08 : 0 },
      }}
      style={{ overflow: 'hidden' }}
    >
      {/* everything that was inside trade-detail stays exactly the same */}
      <div className="detail-grid">
        ...
      </div>
      ...
    </motion.div>
  )}
</AnimatePresence>
```

**Important:** The `overflow: hidden` on the motion.div is required for the height animation to work. Do not put it on `.trade-detail` in CSS if it conflicts — move it to the inline style here.

---

## Step 7 — Panel slide animation (VerdictPanel + MirrorPanel)

Both panels already use `className={`side-panel ${isOpen ? 'open' : ''}`}` and your CSS handles the visual open state. The problem is the CSS transition on `.side-panel` controls the slide. Check your `global.css` for `.side-panel` — if you already have `transition: transform 0.3s` there, the panel already animates. If not, add this to `global.css`:

```css
/* global.css — add to .side-panel */
.side-panel {
  /* ...your existing styles... */
  transform: translateX(100%);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform;
}

.side-panel.open {
  transform: translateX(0);
}
```

The `cubic-bezier(0.16, 1, 0.3, 1)` is the same ease curve used for the cards — it feels fast and physical, not floaty. The `will-change: transform` hints to the browser to GPU-composite this layer so it never janks.

**You do not need Framer Motion for the panels** — they already use a CSS class toggle. CSS handles this better than JS for a fixed side panel because there's no layout calculation involved.

---

## Step 8 — LoadingScreen active step visual

The loading screen already has opacity transitions on each step. The only missing piece is making the active step feel like it's actually doing something. Add a subtle left-border pulse to the active step.

In `LoadingScreen.tsx`, find the inline style on the step div and update the active state style:

```tsx
// LoadingScreen.tsx
// Find the step div and update the style:
<div
  key={step.id}
  style={{ 
    display: 'flex', 
    alignItems: 'center', 
    gap: '16px', 
    padding: '16px 24px',
    borderLeft: isActive ? '2px solid #3B82F6' : '2px solid transparent',
    opacity: isActive ? 1 : isDone ? 0.5 : 0.2,
    transition: 'opacity 0.3s ease, border-color 0.3s ease',
    background: isActive ? 'rgba(59, 130, 246, 0.04)' : 'transparent',
  }}
>
```

This is pure CSS — no Framer Motion needed. The border appears when the step activates, fades when it completes. The subtle blue background tint makes it feel like active work without being distracting.

---

## What NOT to do

- Do not animate the nav. It's fixed and always visible — animating it on every page load is annoying.
- Do not animate the ConnectScreen entrance. The user lands there, fills in an address, submits. Any entrance animation just delays them.
- Do not animate the LoadingScreen entrance. The whole point is they're waiting — don't make them wait for an animation first.
- Do not add hover sounds. Not on nav links, not on buttons, not on trade card headers.
- Do not play the loss sound on collapse — only on expand. Playing it again on close would be irritating.
- Do not animate the summary strip or sort tabs in ResultsView. They're utility elements, not content.

---

## Complete list of changes by file

| File | Change | Lines touched |
|---|---|---|
| `lib/sound.ts` | New file — `playSubmit` + `playLossTrade` | — |
| `lib/motion.ts` | New file — `EASE_OUT_EXPO` + `fadeUp` variant | — |
| `ConnectScreen.tsx` | Add `playSubmit()` in 3 submit handlers | +1 line each |
| `ResultsView.tsx` | Wrap trades-list in `motion.div`, wrap each TradeCard in `motion.div` with `variants={fadeUp} custom={i}` | ~10 lines |
| `TradeCard.tsx` | Replace `{expanded && <div>}` with `<AnimatePresence><motion.div>`. Add `playLossTrade()` in click handler | ~15 lines |
| `global.css` | Add `transform: translateX(100%)` + `transition` to `.side-panel`, add `.side-panel.open { transform: translateX(0) }` | ~5 lines |
| `LoadingScreen.tsx` | Add `borderLeft` + `background` to active step inline style | ~3 lines |

**Total: 7 files, ~40 lines of actual changes.**

---

## Verify before shipping

After implementing, check these four things:

1. **Trade cards stagger** — open `/payslip/[wallet]` with real data, the cards should enter one by one, not all at once
2. **Expand animates** — click any trade card, the detail should slide open over ~320ms, not snap
3. **Loss sound fires once** — expand a BOUGHT_THE_TOP card, hear the thud; collapse and re-expand, it plays again; that's correct
4. **Submit sound fires** — type any 32+ char address and hit Generate Payslip, hear the sweep; it fires once on click
5. **Panels slide** — click Verdict or Mirror from within a trade card, the panel slides in from the right; close it, slides out

If the panel isn't sliding, check whether `.side-panel` in your `global.css` already has a conflicting `transition` property or `transform` that overrides what you added.

---

*7 files. ~40 lines. Nothing more.*
