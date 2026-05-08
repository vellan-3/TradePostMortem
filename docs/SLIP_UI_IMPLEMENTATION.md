# SLIP Dashboard UI — Implementation Guide
### Verdict · Mirror · Payslip — exact changes per file

---

## What this guide does

Replaces the current inconsistent UI across your three app pages with the unified design from `SLIP_Dashboard.html`. Every class name, CSS variable, and component maps directly to your existing file structure. Nothing is renamed. Nothing is restructured. You are adding CSS and updating JSX — that is all.

---

## File change map

| File | What changes |
|---|---|
| `app/globals.css` | Add the full design system CSS at the bottom |
| `app/verdict/page.tsx` | Replace JSX with new layout |
| `app/mirror/page.tsx` | Replace JSX with new layout |
| `app/payslip/[wallet]/page.tsx` | Fix `padding-top` so nav doesn't clip |
| `components/ResultsView.tsx` | Replace grade row, stats strip, pattern banner, sort tabs |
| `components/TradeCard.tsx` | Replace card top row, expanded detail, action buttons |

---

## Step 1 — globals.css

Open `app/globals.css`. At the very bottom, after everything that already exists, paste this entire block. Do not delete anything already there.

```css
/* ═══════════════════════════════════════════
   SLIP DESIGN SYSTEM — Dashboard Pages
   Source: SLIP_Dashboard.html
═══════════════════════════════════════════ */

/* ── DESIGN TOKENS ── */
:root {
  --slip-bg:            #000000;
  --slip-surface-1:     #111111;
  --slip-surface-2:     #1a1a1a;
  --slip-surface-3:     rgba(255,255,255,0.05);
  --slip-stroke-soft:   rgba(255,255,255,0.10);
  --slip-stroke-strong: rgba(255,255,255,0.25);
  --slip-text:          #ffffff;
  --slip-text-muted:    rgba(255,255,255,0.70);
  --slip-text-soft:     rgba(255,255,255,0.46);
  --slip-blue:          #3B82F6;
  --slip-blue-dark:     #234C90;
  --slip-red:           #FF3232;
  --slip-purple:        #8B5CF6;
  --slip-success:       #10b981;
  --slip-warning:       #f59e0b;
  --slip-verdict-bg:    rgba(255,50,50,0.20);
  --slip-mirror-bg:     rgba(59,130,246,0.25);
  --slip-payslip-bg:    rgba(139,92,246,0.25);
  --slip-gradient-blue: linear-gradient(180deg, #3B82F6 20%, #234C90 80%);
  --slip-shadow-blue:
    0 8px 6px -4px rgba(0,0,0,0.75),
    0 48px 48px -6px rgba(0,0,0,0.75),
    0 20px 32px rgba(255,255,255,0.12) inset,
    0 -5px 10px rgba(0,0,0,0.50) inset,
    0 10px 12px rgba(255,255,255,0.08) inset;
  --slip-shadow-card: 0 0 0 1px rgba(255,255,255,0.06) inset;
  --slip-radius-xs:   8px;
  --slip-radius-sm:   12px;
  --slip-radius-md:   18px;
  --slip-radius-lg:   24px;
  --slip-radius-pill: 999px;
}

/* ── PAGE CANVAS ── */
.page-canvas {
  min-height: 100vh;
  padding: 64px 64px 80px;
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.canvas-verdict {
  background:
    radial-gradient(ellipse 70% 35% at 20% 0%, rgba(255,50,50,0.15) 0%, transparent 65%),
    radial-gradient(ellipse 40% 20% at 85% 100%, rgba(255,50,50,0.07) 0%, transparent 60%),
    #000;
}
.canvas-mirror {
  background:
    radial-gradient(ellipse 70% 35% at 80% 0%, rgba(59,130,246,0.14) 0%, transparent 65%),
    radial-gradient(ellipse 40% 20% at 10% 100%, rgba(59,130,246,0.06) 0%, transparent 60%),
    #000;
}
.canvas-payslip {
  background:
    radial-gradient(ellipse 70% 35% at 50% 0%, rgba(139,92,246,0.14) 0%, transparent 65%),
    radial-gradient(ellipse 40% 20% at 90% 100%, rgba(139,92,246,0.06) 0%, transparent 60%),
    #000;
}

/* ── EYEBROW ── */
.ds-eyebrow {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: "Space Mono", monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  margin-bottom: 16px;
}
.ds-eyebrow-num  { color: var(--slip-text-soft); }
.ds-eyebrow-sep  { width: 1px; height: 12px; background: var(--slip-stroke-strong); }
.ds-eyebrow-lbl-verdict { color: var(--slip-red); }
.ds-eyebrow-lbl-mirror  { color: var(--slip-blue); }
.ds-eyebrow-lbl-payslip { color: var(--slip-purple); }

/* ── PAGE TITLE ── */
.ds-page-title {
  font-family: "Syne", sans-serif;
  font-size: clamp(36px, 5vw, 64px);
  font-weight: 800;
  line-height: 0.92;
  letter-spacing: -0.05em;
  color: var(--slip-text);
  margin: 0 0 16px;
}
.ds-page-sub {
  font-size: 16px;
  line-height: 1.6;
  color: var(--slip-text-muted);
  max-width: 480px;
  margin: 0;
}

/* ── CARD ── */
.ds-card {
  border-radius: var(--slip-radius-lg);
  border: 1px solid var(--slip-stroke-soft);
  background: linear-gradient(160deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%);
  box-shadow: var(--slip-shadow-card);
  padding: 28px;
}

/* ── INPUT ROW ── */
.ds-input-row {
  display: flex;
  align-items: stretch;
  border-radius: var(--slip-radius-sm);
  border: 1px solid var(--slip-stroke-strong);
  background: rgba(255,255,255,0.04);
  overflow: hidden;
  max-width: 720px;
  transition: border-color 0.2s;
}
.ds-input-row:focus-within { border-color: rgba(255,255,255,0.38); }

.ds-input-row input {
  flex: 1;
  height: 56px;
  padding: 0 20px;
  font-size: 14px;
  color: var(--slip-text);
  background: transparent;
  border: none;
  outline: none;
  font-family: inherit;
}
.ds-input-row input::placeholder {
  color: var(--slip-text-soft);
  font-family: "Space Mono", monospace;
  font-size: 13px;
}

/* ── RUN BUTTONS ── */
.ds-btn-run {
  height: 56px;
  padding: 0 28px;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #fff;
  cursor: pointer;
  border: none;
  white-space: nowrap;
  transition: opacity 0.15s;
  border-radius: 0;
}
.ds-btn-run:hover { opacity: 0.88; }
.ds-btn-verdict { background: var(--slip-red); }
.ds-btn-mirror  { background: var(--slip-blue); }
.ds-btn-payslip { background: var(--slip-purple); }

/* ── GHOST BUTTON ── */
.ds-btn-ghost {
  height: 44px;
  padding: 0 18px;
  border-radius: var(--slip-radius-sm);
  border: 1px solid var(--slip-stroke-strong);
  color: var(--slip-text-muted);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  transition: border-color 0.15s, color 0.15s;
}
.ds-btn-ghost:hover { border-color: rgba(255,255,255,0.4); color: var(--slip-text); }

/* ── SECTION LABEL ── */
.ds-section-lbl {
  font-family: "Space Mono", monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--slip-text-soft);
  margin-bottom: 12px;
}

/* ── DIVIDER ── */
.ds-divider { height: 1px; background: var(--slip-stroke-soft); margin: 16px 0; }

/* ── IDLE STATE ── */
.ds-idle {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 24px;
  padding: 80px 0;
  text-align: center;
}
.ds-idle-checks {
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: left;
  min-width: 280px;
}
.ds-idle-hint {
  font-family: "Space Mono", monospace;
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--slip-text-soft);
  max-width: 400px;
}

/* ── CHECK ROW ── */
.ds-check-row {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: var(--slip-text-muted);
  font-weight: 500;
}
.ds-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.ds-dot-idle { background: rgba(255,255,255,0.2); }
.ds-dot-pass { background: var(--slip-success); box-shadow: 0 0 6px rgba(16,185,129,0.6); }
.ds-dot-fail { background: var(--slip-red);     box-shadow: 0 0 6px rgba(255,50,50,0.6); }
.ds-dot-warn { background: var(--slip-warning); box-shadow: 0 0 6px rgba(245,158,11,0.6); }

.ds-check-badge {
  margin-left: auto;
  font-family: "Space Mono", monospace;
  font-size: 10px; font-weight: 700;
  letter-spacing: 0.08em; text-transform: uppercase;
  padding: 3px 10px;
  border-radius: var(--slip-radius-pill);
}
.ds-cb-idle { color: var(--slip-text-soft); background: rgba(255,255,255,0.05); }
.ds-cb-pass { color: var(--slip-success); background: rgba(16,185,129,0.1); }
.ds-cb-fail { color: var(--slip-red);     background: rgba(255,50,50,0.1); }
.ds-cb-warn { color: var(--slip-warning); background: rgba(245,158,11,0.1); }

/* ── STAT PILL ── */
.ds-stat-pill {
  padding: 20px 24px;
  border-radius: var(--slip-radius-md);
  border: 1px solid var(--slip-stroke-soft);
  background: rgba(255,255,255,0.03);
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ds-stat-lbl {
  font-family: "Space Mono", monospace;
  font-size: 10px; font-weight: 700;
  letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--slip-text-soft);
}
.ds-stat-val {
  font-family: "Syne", sans-serif;
  font-size: 26px; font-weight: 800;
  letter-spacing: -0.04em;
}
.ds-stat-sub { font-size: 12px; color: var(--slip-text-soft); margin-top: 2px; }

/* ── VERDICT LAYOUT ── */
.ds-verdict-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 32px;
  align-items: start;
}
.ds-verdict-main { display: flex; flex-direction: column; gap: 0; }
.ds-verdict-sidebar { display: flex; flex-direction: column; gap: 12px; }

/* ── SCORE HERO ── */
.ds-score-hero {
  display: flex;
  align-items: center;
  gap: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--slip-stroke-soft);
  margin-bottom: 24px;
}
.ds-score-ring-wrap {
  position: relative;
  width: 96px; height: 96px;
  flex-shrink: 0;
}
.ds-score-ring-wrap svg { transform: rotate(-90deg); }
.ds-score-ring-center {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
}
.ds-score-number {
  font-family: "Syne", sans-serif;
  font-size: 30px; font-weight: 800;
  letter-spacing: -0.04em;
}
.ds-score-denom { font-size: 11px; color: var(--slip-text-soft); margin-top: -2px; }

.ds-score-meta { display: flex; flex-direction: column; gap: 12px; }

.ds-verdict-badge-lg {
  font-family: "Syne", sans-serif;
  font-size: 26px; font-weight: 800;
  letter-spacing: -0.03em;
}
.ds-verdict-summary {
  font-size: 13px;
  color: var(--slip-text-muted);
  line-height: 1.6;
  max-width: 420px;
}

/* Verdict status badge pill */
.ds-v-badge {
  display: inline-flex; align-items: center;
  font-family: "Space Mono", monospace;
  font-size: 10px; font-weight: 700;
  letter-spacing: 0.14em; text-transform: uppercase;
  padding: 5px 14px;
  border-radius: var(--slip-radius-pill);
  width: fit-content;
}
.ds-vb-clean   { color: var(--slip-success); background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.25); }
.ds-vb-caution { color: var(--slip-warning); background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.25); }
.ds-vb-risky   { color: var(--slip-red);     background: rgba(255,50,50,0.12);  border: 1px solid rgba(255,50,50,0.25); }
.ds-vb-trap    { color: #ff6b6b; background: rgba(255,50,50,0.20); border: 1px solid rgba(255,50,50,0.4); }

/* Check section within verdict card */
.ds-check-section { margin-bottom: 20px; }
.ds-check-section-title {
  font-family: "Space Mono", monospace;
  font-size: 10px; font-weight: 700;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--slip-text-soft);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* ── MIRROR LAYOUT ── */
.ds-mirror-input-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 180px auto;
  border-radius: var(--slip-radius-sm);
  border: 1px solid var(--slip-stroke-strong);
  background: rgba(255,255,255,0.04);
  overflow: hidden;
  max-width: 900px;
}
.ds-mirror-field {
  display: flex; flex-direction: column;
  padding: 14px 20px;
  border-right: 1px solid var(--slip-stroke-soft);
}
.ds-mirror-field:last-child { border-right: 0; }
.ds-mirror-field-lbl {
  font-family: "Space Mono", monospace;
  font-size: 9px; font-weight: 700;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--slip-text-soft);
  margin-bottom: 6px;
}
.ds-mirror-field input {
  font-size: 13px; color: var(--slip-text);
  background: transparent; height: 24px;
  border: none; outline: none; font-family: inherit;
}
.ds-mirror-field input::placeholder {
  color: rgba(255,255,255,0.28);
  font-family: "Space Mono", monospace; font-size: 12px;
}
.ds-mirror-submit {
  padding: 0 24px;
  background: var(--slip-blue); color: #fff;
  font-size: 14px; font-weight: 700;
  cursor: pointer; border: none;
  display: flex; align-items: center; gap: 6px;
  transition: opacity 0.15s; white-space: nowrap;
}
.ds-mirror-submit:hover { opacity: 0.88; }

.ds-mirror-layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 32px;
  align-items: start;
}
.ds-mirror-side { display: flex; flex-direction: column; gap: 16px; }

/* Leaderboard */
.ds-lb-head {
  display: grid;
  grid-template-columns: 48px 1fr 110px 110px 100px;
  padding: 10px 16px; gap: 16px;
}
.ds-lb-head-lbl {
  font-family: "Space Mono", monospace;
  font-size: 9px; font-weight: 700;
  letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--slip-text-soft);
}
.ds-lb-row {
  display: grid;
  grid-template-columns: 48px 1fr 110px 110px 100px;
  padding: 14px 16px; gap: 16px;
  border-radius: var(--slip-radius-sm);
  align-items: center;
  cursor: pointer;
  transition: background 0.15s;
  margin-bottom: 2px;
}
.ds-lb-row:hover { background: rgba(255,255,255,0.04); }
.ds-lb-row-you {
  background: rgba(59,130,246,0.07);
  border: 1px solid rgba(59,130,246,0.2);
}
.ds-lb-row-top { background: rgba(16,185,129,0.04); }

.ds-lb-rank {
  font-family: "Space Mono", monospace;
  font-size: 13px; font-weight: 700;
  color: var(--slip-text-soft); text-align: center;
}
.ds-lb-rank-1 { color: #fbbf24; }
.ds-lb-rank-2 { color: #94a3b8; }
.ds-lb-rank-3 { color: #b45309; }
.ds-lb-rank-you { color: var(--slip-blue); font-size: 10px; letter-spacing: 0.1em; }

.ds-lb-addr {
  font-family: "Space Mono", monospace;
  font-size: 12px; color: var(--slip-text-muted);
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 3px;
}
.ds-lb-sub { font-size: 10px; color: var(--slip-text-soft); }

.ds-wallet-tag {
  font-size: 9px; font-weight: 700;
  letter-spacing: 0.08em; text-transform: uppercase;
  padding: 2px 7px; border-radius: var(--slip-radius-pill);
}
.ds-wt-smart { color: var(--slip-success); background: rgba(16,185,129,0.12); }
.ds-wt-kol   { color: var(--slip-warning); background: rgba(245,158,11,0.12); }
.ds-wt-bot   { color: var(--slip-blue);    background: rgba(59,130,246,0.12); }
.ds-wt-you   { color: var(--slip-blue);    background: rgba(59,130,246,0.15); }

.ds-lb-pnl {
  font-family: "Syne", sans-serif;
  font-size: 15px; font-weight: 700;
  letter-spacing: -0.02em;
}
.ds-lb-pnl-pos { color: var(--slip-success); }
.ds-lb-pnl-neg { color: var(--slip-red); }
.ds-lb-entry { font-size: 12px; color: var(--slip-text-muted); font-family: "Space Mono", monospace; }
.ds-lb-hold  { font-size: 12px; color: var(--slip-text-soft); }

/* Gap card */
.ds-gap-card {
  padding: 22px;
  border-radius: var(--slip-radius-md);
  border: 1px solid var(--slip-stroke-soft);
  background: rgba(255,255,255,0.03);
}
.ds-gap-card-title {
  font-family: "Space Mono", monospace;
  font-size: 10px; font-weight: 700;
  letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--slip-text-soft); margin-bottom: 16px;
}
.ds-gap-vs {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 12px; align-items: center;
  margin-bottom: 16px;
}
.ds-gap-side { display: flex; flex-direction: column; gap: 3px; }
.ds-gap-side-lbl { font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--slip-text-soft); }
.ds-gap-side-val { font-family: "Syne", sans-serif; font-size: 22px; font-weight: 800; letter-spacing: -0.04em; }
.ds-gap-side-sub { font-size: 10px; color: var(--slip-text-soft); }
.ds-gap-divider  { text-align: center; color: var(--slip-text-soft); font-size: 14px; }

.ds-gap-stat {
  display: flex; justify-content: space-between;
  padding: 8px 0; border-top: 1px solid var(--slip-stroke-soft);
  font-size: 11px;
}
.ds-gap-key { color: var(--slip-text-soft); }
.ds-gap-val { font-family: "Syne", sans-serif; font-weight: 700; font-size: 12px; }
.ds-gap-val-neg { color: var(--slip-red); }
.ds-gap-val-pos { color: var(--slip-success); }

/* Pattern insights */
.ds-pattern-insights {
  padding: 20px;
  border-radius: var(--slip-radius-md);
  border: 1px solid rgba(59,130,246,0.25);
  background: rgba(59,130,246,0.05);
}
.ds-pi-title {
  font-family: "Syne", sans-serif;
  font-size: 14px; font-weight: 800;
  color: var(--slip-blue); margin-bottom: 12px;
  display: flex; align-items: center; gap: 8px;
}
.ds-pi-row {
  display: flex; justify-content: space-between;
  padding: 7px 0;
  border-top: 1px solid var(--slip-stroke-soft);
  font-size: 11px;
}
.ds-pi-key { color: var(--slip-text-soft); }
.ds-pi-val { font-family: "Syne", sans-serif; font-weight: 700; font-size: 12px; }

/* ── PAYSLIP GRADE ROW ── */
.ds-grade-row {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4px;
}
.ds-grade-main {
  padding: 28px 36px;
  background: linear-gradient(160deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02));
  border: 1px solid var(--slip-stroke-soft);
  border-radius: var(--slip-radius-lg) 0 0 var(--slip-radius-lg);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  min-width: 140px;
}
.ds-grade-letter {
  font-family: "Syne", sans-serif;
  font-size: 64px; font-weight: 800;
  letter-spacing: -0.04em; line-height: 1;
}
.ds-grade-score { font-size: 11px; color: var(--slip-text-soft); margin-top: 4px; }
.ds-grade-lbl   { font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--slip-text-soft); margin-top: 6px; }

.ds-grade-breakdown {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px;
}
.ds-grade-cell {
  background: linear-gradient(160deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02));
  border: 1px solid var(--slip-stroke-soft);
  padding: 18px 20px;
  display: flex; flex-direction: column; gap: 4px;
}
.ds-grade-cell:last-child { border-radius: 0 var(--slip-radius-lg) var(--slip-radius-lg) 0; }
.ds-grade-cell-lbl    { font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--slip-text-soft); }
.ds-grade-cell-letter { font-family: "Syne", sans-serif; font-size: 30px; font-weight: 800; letter-spacing: -0.04em; line-height: 1; margin-top: 6px; }
.ds-grade-cell-score  { font-size: 10px; color: var(--slip-text-soft); margin-top: 2px; }

.ds-grade-a { color: var(--slip-success); }
.ds-grade-b { color: #60a5fa; }
.ds-grade-c { color: var(--slip-warning); }
.ds-grade-d { color: #f97316; }
.ds-grade-f { color: var(--slip-red); }

/* ── STATS STRIP ── */
.ds-stats-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
}

/* ── PATTERN BANNER ── */
.ds-pattern-banner {
  border-radius: var(--slip-radius-md);
  border: 1px solid rgba(255,50,50,0.22);
  background: rgba(255,50,50,0.06);
  padding: 20px 24px;
  display: flex; align-items: flex-start; gap: 18px;
}
.ds-pb-icon  { font-size: 22px; flex-shrink: 0; margin-top: 2px; }
.ds-pb-title { font-family: "Syne", sans-serif; font-size: 16px; font-weight: 800; color: var(--slip-red); margin-bottom: 4px; letter-spacing: -0.02em; }
.ds-pb-text  { font-size: 13px; color: var(--slip-text-muted); line-height: 1.6; }
.ds-pb-text b { color: rgba(255,120,120,0.9); }

/* ── SORT TABS ── */
.ds-sort-row { display: flex; gap: 2px; }
.ds-sort-btn {
  padding: 8px 18px;
  border-radius: var(--slip-radius-xs);
  font-family: "Space Mono", monospace;
  font-size: 10px; font-weight: 700;
  letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--slip-text-soft); cursor: pointer;
  border: 1px solid transparent;
  background: rgba(255,255,255,0.03);
  transition: all 0.15s;
}
.ds-sort-btn:hover { color: var(--slip-text); border-color: var(--slip-stroke-soft); }
.ds-sort-btn.active {
  color: var(--slip-text);
  background: rgba(255,255,255,0.06);
  border-color: var(--slip-stroke-soft);
}

/* ── TRADE CARD ── */
.ds-trade-card {
  border-radius: var(--slip-radius-md);
  border: 1px solid var(--slip-stroke-soft);
  background: linear-gradient(160deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01));
  overflow: hidden;
  margin-bottom: 4px;
  cursor: pointer;
  transition: border-color 0.15s;
}
.ds-trade-card:hover { border-color: rgba(255,255,255,0.2); }
.ds-trade-card.open  { border-color: rgba(255,255,255,0.18); }

.ds-tc-bought  { border-left: 3px solid var(--slip-red); }
.ds-tc-sold    { border-left: 3px solid var(--slip-warning); }
.ds-tc-paper   { border-left: 3px solid var(--slip-warning); }
.ds-tc-diamond { border-left: 3px solid var(--slip-red); }
.ds-tc-good    { border-left: 3px solid var(--slip-success); }
.ds-tc-unknown { border-left: 3px solid var(--slip-stroke-strong); }

.ds-tc-top {
  display: grid;
  grid-template-columns: 40px 1fr 200px 160px;
  align-items: center;
  padding: 16px 20px 16px 14px;
}
.ds-tc-rank {
  font-family: "Syne", sans-serif;
  font-size: 18px; font-weight: 800;
  color: var(--slip-text-soft); text-align: center;
}
.ds-tc-rank-1 { color: var(--slip-red); }
.ds-tc-rank-2 { color: #f97316; }
.ds-tc-rank-3 { color: var(--slip-warning); }

.ds-tc-symbol { font-family: "Syne", sans-serif; font-size: 17px; font-weight: 800; letter-spacing: -0.02em; }
.ds-tc-token-row { display: flex; align-items: center; gap: 10px; margin-bottom: 3px; }
.ds-tc-date { font-size: 10px; color: var(--slip-text-soft); }

.ds-diag-pill {
  font-family: "Space Mono", monospace;
  font-size: 9px; font-weight: 700;
  letter-spacing: 0.06em; text-transform: uppercase;
  padding: 3px 9px; border-radius: var(--slip-radius-pill);
}
.ds-pill-red   { color: var(--slip-red);     background: rgba(255,50,50,0.12);  border: 1px solid rgba(255,50,50,0.22); }
.ds-pill-amber { color: var(--slip-warning); background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.22); }
.ds-pill-green { color: var(--slip-success); background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.22); }
.ds-pill-muted { color: var(--slip-text-soft); background: rgba(255,255,255,0.05); border: 1px solid var(--slip-stroke-soft); }

.ds-tc-winner-mini {
  font-size: 11px; color: var(--slip-text-soft);
  padding: 0 16px;
  border-left: 1px solid var(--slip-stroke-soft);
  border-right: 1px solid var(--slip-stroke-soft);
  line-height: 1.5;
}
.ds-tc-winner-pnl { font-family: "Syne", sans-serif; font-size: 13px; font-weight: 700; color: var(--slip-success); }
.ds-tc-winner-sub { font-size: 10px; color: var(--slip-text-soft); margin-top: 1px; }

.ds-tc-pnl { text-align: right; }
.ds-tc-pnl-val {
  font-family: "Syne", sans-serif;
  font-size: 20px; font-weight: 800;
  letter-spacing: -0.04em; line-height: 1;
}
.ds-tc-pnl-meta { font-size: 9px; color: var(--slip-text-soft); margin-top: 3px; letter-spacing: 0.06em; text-transform: uppercase; }

/* Trade card expanded */
.ds-tc-detail { display: none; border-top: 1px solid var(--slip-stroke-soft); }
.ds-trade-card.open .ds-tc-detail { display: block; }

.ds-tc-split {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 0; background: var(--slip-stroke-soft);
}
.ds-tc-half { background: rgba(255,255,255,0.02); padding: 22px; }
.ds-tc-half-title {
  font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase;
  margin-bottom: 16px;
  display: flex; align-items: center; gap: 8px;
}
.ds-th-you    { color: var(--slip-purple); }
.ds-th-winner { color: var(--slip-success); }

.ds-tc-stat {
  display: flex; justify-content: space-between; align-items: baseline;
  padding: 7px 0; border-bottom: 1px solid var(--slip-stroke-soft);
  font-size: 11px; gap: 12px;
}
.ds-tc-stat:last-child { border-bottom: 0; }
.ds-tc-stat-key { color: var(--slip-text-soft); flex-shrink: 0; }
.ds-tc-stat-val {
  font-family: "Syne", sans-serif;
  font-weight: 700; font-size: 13px; text-align: right;
}

.ds-tc-diagnosis {
  padding: 16px 22px;
  font-size: 12px; line-height: 1.75;
  color: var(--slip-text-muted);
  border-top: 1px solid var(--slip-stroke-soft);
  border-left: 3px solid transparent;
}
.ds-td-bought, .ds-td-diamond { border-left-color: var(--slip-red); }
.ds-td-sold, .ds-td-paper     { border-left-color: var(--slip-warning); }
.ds-td-good                   { border-left-color: var(--slip-success); }
.ds-tc-diagnosis b { color: var(--slip-text); font-family: "Syne", sans-serif; font-weight: 700; }

.ds-tc-actions {
  display: flex; align-items: center; gap: 8px;
  padding: 14px 22px;
  border-top: 1px solid var(--slip-stroke-soft);
  background: rgba(255,255,255,0.01);
}
.ds-action-btn {
  display: flex; align-items: center; gap: 7px;
  padding: 8px 16px;
  border-radius: var(--slip-radius-xs);
  font-family: "Space Mono", monospace;
  font-size: 10px; font-weight: 700;
  letter-spacing: 0.06em; text-transform: uppercase;
  cursor: pointer; border: 1px solid var(--slip-stroke-soft);
  color: var(--slip-text-soft); background: transparent;
  transition: all 0.15s;
}
.ds-action-btn:hover { color: var(--slip-text); border-color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.04); }
.ds-action-verdict { color: var(--slip-red); border-color: rgba(255,50,50,0.25); }
.ds-action-verdict:hover { background: rgba(255,50,50,0.08); }
.ds-action-mirror  { color: var(--slip-blue); border-color: rgba(59,130,246,0.25); }
.ds-action-mirror:hover  { background: rgba(59,130,246,0.08); }
.ds-action-x { background: #000; color: #fff; border-color: #333; }
.ds-action-x:hover { background: #111; }
.ds-action-share { margin-left: auto; }

/* ── ANIMATION ── */
@keyframes ds-fade-up {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}
.ds-fade-up { animation: ds-fade-up 0.28s ease both; }

/* ── RESPONSIVE ── */
@media (max-width: 900px) {
  .page-canvas { padding: 32px 20px 64px; }
  .ds-verdict-layout { grid-template-columns: 1fr; }
  .ds-mirror-layout  { grid-template-columns: 1fr; }
  .ds-mirror-input-grid { grid-template-columns: 1fr; }
  .ds-grade-breakdown { grid-template-columns: repeat(2, 1fr); }
  .ds-stats-strip { grid-template-columns: repeat(2, 1fr); }
  .ds-tc-top { grid-template-columns: 36px 1fr 140px; }
  .ds-tc-winner-mini { display: none; }
  .ds-tc-split { grid-template-columns: 1fr; }
}
```

---

## Step 2 — Verdict page

Your verdict page file is at `app/verdict/page.tsx`. This is the page-level shell. Your existing API fetch logic stays completely unchanged — only the JSX that wraps the output changes.

Find where the page returns its JSX. The outer wrapper currently has no `page-canvas` class and no ambient background. Replace the outer wrapper structure:

```tsx
// app/verdict/page.tsx
// Keep all your existing imports, state, fetch logic, and API call unchanged.
// Only change the return JSX.

return (
  <div className="page-canvas canvas-verdict">

    {/* ── Header ── */}
    <div>
      <div className="ds-eyebrow ds-eyebrow-verdict">
        <span className="ds-eyebrow-num">01</span>
        <span className="ds-eyebrow-sep" />
        <span className="ds-eyebrow-lbl-verdict">Verdict</span>
      </div>
      <h1 className="ds-page-title">Token Safety<br />Scanner</h1>
      <p className="ds-page-sub">
        Paste any Solana token contract. Get a full verdict before you enter.
      </p>
    </div>

    {/* ── Input ── */}
    <div className="ds-input-row">
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        placeholder="Token contract address..."
        spellCheck={false}
        autoComplete="off"
      />
      <button className="ds-btn-run ds-btn-verdict" onClick={handleSubmit}>
        Run Verdict →
      </button>
    </div>

    {/* ── Idle state ── */}
    {!result && (
      <div className="ds-idle">
        <div className="ds-idle-checks">
          {[
            'Mint Authority', 'Freeze Authority', 'Liquidity Lock',
            'Transfer Hook', 'Sell Route Simulation', 'Deployer History', 'Entry Timing'
          ].map(label => (
            <div className="ds-check-row" key={label}>
              <span className="ds-dot ds-dot-idle" />
              {label}
              <span className="ds-check-badge ds-cb-idle">Pending</span>
            </div>
          ))}
        </div>
        <p className="ds-idle-hint">Paste a token contract address above to run a full scan</p>
      </div>
    )}

    {/* ── Result ── */}
    {result && (
      <div className="ds-fade-up">
        <div className="ds-verdict-layout">

          {/* Left: main card */}
          <div>
            <div className="ds-card">

              {/* Score hero */}
              <div className="ds-score-hero">
                <div className="ds-score-ring-wrap">
                  <svg width="96" height="96" viewBox="0 0 96 96">
                    <circle cx="48" cy="48" r="40" fill="none"
                      stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                    <circle cx="48" cy="48" r="40" fill="none"
                      stroke={getScoreColor(result.hero.score)} strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray="251.3"
                      strokeDashoffset={251.3 * (1 - result.hero.score / 100)} />
                  </svg>
                  <div className="ds-score-ring-center">
                    <span className="ds-score-number" style={{ color: getScoreColor(result.hero.score) }}>
                      {result.hero.score}
                    </span>
                    <span className="ds-score-denom">/100</span>
                  </div>
                </div>

                <div className="ds-score-meta">
                  <span className={`ds-v-badge ds-vb-${result.hero.verdict.toLowerCase()}`}>
                    {result.hero.verdict}
                  </span>
                  <div className="ds-verdict-badge-lg" style={{ color: getScoreColor(result.hero.score) }}>
                    {result.hero.verdict.toUpperCase()}
                  </div>
                  <p className="ds-verdict-summary">{result.hero.summary}</p>
                </div>
              </div>

              {/* Safety layer checks */}
              <div className="ds-check-section">
                <div className="ds-check-section-title">
                  <span>Safety Layer</span>
                  <span style={{ color: 'var(--slip-text-soft)', fontSize: 10, fontWeight: 400 }}>Can you exit?</span>
                </div>
                {result.safetyLayer?.map((check: any) => (
                  <div className="ds-check-row" key={check.name} style={{ marginBottom: 10 }}>
                    <span className={`ds-dot ds-dot-${check.status === 'pass' ? 'pass' : check.status === 'critical' ? 'fail' : 'warn'}`} />
                    {check.name}
                    <span style={{ flex: 1, fontSize: 11, color: 'var(--slip-text-soft)', marginLeft: 8 }}>
                      {check.detail}
                    </span>
                    <span className={`ds-check-badge ds-cb-${check.status === 'pass' ? 'pass' : check.status === 'critical' ? 'fail' : 'warn'}`}>
                      {check.badge}
                    </span>
                  </div>
                ))}
              </div>

              <div className="ds-divider" />

              {/* Market structure checks — same pattern as safetyLayer */}
              {/* Map your result.marketStructure array the same way */}

            </div>
          </div>

          {/* Right: sidebar stats */}
          <div className="ds-verdict-sidebar">
            <div className="ds-stat-pill">
              <span className="ds-stat-lbl">Market Cap</span>
              <span className="ds-stat-val">{result.marketCap ?? '—'}</span>
              <span className="ds-stat-sub">{result.marketCapSub ?? ''}</span>
            </div>
            <div className="ds-stat-pill">
              <span className="ds-stat-lbl">Liquidity</span>
              <span className="ds-stat-val">{result.liquidity ?? '—'}</span>
              <span className="ds-stat-sub">{result.liquiditySub ?? ''}</span>
            </div>
            {/* Add remaining sidebar stats following the same ds-stat-pill pattern */}
          </div>

        </div>
      </div>
    )}

  </div>
);

// Helper — same as your existing getScoreColor
function getScoreColor(score: number): string {
  if (score >= 80) return 'var(--slip-success)';
  if (score >= 60) return 'var(--slip-warning)';
  if (score >= 40) return '#f97316';
  return 'var(--slip-red)';
}
```

---

## Step 3 — Mirror page

Same approach. Keep your existing fetch logic. Replace only the JSX shell.

```tsx
// app/mirror/page.tsx — return JSX

return (
  <div className="page-canvas canvas-mirror">

    {/* Header */}
    <div>
      <div className="ds-eyebrow ds-eyebrow-mirror">
        <span className="ds-eyebrow-num">02</span>
        <span className="ds-eyebrow-sep" />
        <span className="ds-eyebrow-lbl-mirror">Mirror</span>
      </div>
      <h1 className="ds-page-title">Winner<br />Leaderboard</h1>
      <p className="ds-page-sub">See who is winning your token right now — and exactly how they're doing it.</p>
    </div>

    {/* Input grid */}
    <div className="ds-mirror-input-grid">
      <div className="ds-mirror-field">
        <div className="ds-mirror-field-lbl">Token Contract</div>
        <input value={mint} onChange={e => setMint(e.target.value)} placeholder="Token mint address..." spellCheck={false} />
      </div>
      <div className="ds-mirror-field">
        <div className="ds-mirror-field-lbl">Your Wallet (optional)</div>
        <input value={wallet} onChange={e => setWallet(e.target.value)} placeholder="For your row..." />
      </div>
      <div className="ds-mirror-field">
        <div className="ds-mirror-field-lbl">Your Entry (SOL)</div>
        <input value={entry} onChange={e => setEntry(e.target.value)} placeholder="e.g. 3.0" />
      </div>
      <button className="ds-mirror-submit" onClick={handleSubmit}>Find Winners →</button>
    </div>

    {/* Idle */}
    {!result && (
      <div className="ds-idle">
        <p className="ds-idle-hint">
          Enter a token mint address to rank all wallets that traded it,
          compare your position against the top winner, and see the winner pattern panel.
        </p>
      </div>
    )}

    {/* Result */}
    {result && (
      <div className="ds-fade-up ds-mirror-layout">

        {/* Left: leaderboard */}
        <div>
          <div className="ds-section-lbl">
            {result.symbol} · {result.totalTraders} traders · ranked by realized P&L
          </div>
          <div className="ds-lb-head">
            <div className="ds-lb-head-lbl">#</div>
            <div className="ds-lb-head-lbl">Wallet</div>
            <div className="ds-lb-head-lbl">P&L (SOL)</div>
            <div className="ds-lb-head-lbl">Entry</div>
            <div className="ds-lb-head-lbl">Hold</div>
          </div>

          {result.leaderboard?.map((winner: any, i: number) => (
            <div
              key={winner.wallet}
              className={`ds-lb-row ${i === 0 ? 'ds-lb-row-top' : ''} ${winner.isYou ? 'ds-lb-row-you' : ''}`}
            >
              <div className={`ds-lb-rank ${i === 0 ? 'ds-lb-rank-1' : i === 1 ? 'ds-lb-rank-2' : i === 2 ? 'ds-lb-rank-3' : ''} ${winner.isYou ? 'ds-lb-rank-you' : ''}`}>
                {winner.isYou ? 'YOU' : i + 1}
              </div>
              <div>
                <div className="ds-lb-addr">
                  {winner.walletLabel}
                  {winner.tag && <span className={`ds-wallet-tag ds-wt-${winner.tag.toLowerCase()}`}>{winner.tag}</span>}
                  {winner.isYou && <span className="ds-wallet-tag ds-wt-you">You</span>}
                </div>
                <div className="ds-lb-sub">{winner.entrySub}</div>
              </div>
              <div className={`ds-lb-pnl ${winner.totalPnlSol >= 0 ? 'ds-lb-pnl-pos' : 'ds-lb-pnl-neg'}`}>
                {winner.totalPnlSol >= 0 ? '+' : ''}{winner.totalPnlSol.toFixed(1)}
              </div>
              <div className="ds-lb-entry">{winner.entrySol} SOL</div>
              <div className="ds-lb-hold">{winner.holdDisplay}</div>
            </div>
          ))}
        </div>

        {/* Right: gap card + pattern insights */}
        <div className="ds-mirror-side">
          {result.yourRow && (
            <div className="ds-gap-card">
              <div className="ds-gap-card-title">Your Position vs #1 Winner</div>
              <div className="ds-gap-vs">
                <div className="ds-gap-side">
                  <span className="ds-gap-side-lbl" style={{ color: 'var(--slip-purple)' }}>You</span>
                  <span className="ds-gap-side-val" style={{ color: result.yourRow.totalPnlSol < 0 ? 'var(--slip-red)' : 'var(--slip-success)' }}>
                    {result.yourRow.totalPnlSol >= 0 ? '+' : ''}{result.yourRow.totalPnlSol.toFixed(1)} SOL
                  </span>
                  <span className="ds-gap-side-sub">{result.yourRow.entryMcapLabel}</span>
                </div>
                <div className="ds-gap-divider">vs</div>
                <div className="ds-gap-side" style={{ textAlign: 'right' }}>
                  <span className="ds-gap-side-lbl" style={{ color: 'var(--slip-success)' }}>Winner</span>
                  <span className="ds-gap-side-val" style={{ color: 'var(--slip-success)' }}>
                    +{result.leaderboard[0]?.totalPnlSol.toFixed(1)} SOL
                  </span>
                  <span className="ds-gap-side-sub">{result.leaderboard[0]?.entryMcapLabel}</span>
                </div>
              </div>
              {/* Gap stats — render result.gapStats array using ds-gap-stat pattern */}
            </div>
          )}

          {result.patternInsights && (
            <div className="ds-pattern-insights">
              <div className="ds-pi-title">◈ What Top 10 Winners Had in Common</div>
              {result.patternInsights.avgEntryMarketCap && (
                <div className="ds-pi-row"><span className="ds-pi-key">Avg entry market cap</span><span className="ds-pi-val">{result.patternInsights.avgEntryMarketCap}</span></div>
              )}
              {result.patternInsights.avgHoldBeforePartialExit && (
                <div className="ds-pi-row"><span className="ds-pi-key">Avg hold before exit</span><span className="ds-pi-val">{result.patternInsights.avgHoldBeforePartialExit}</span></div>
              )}
              {result.patternInsights.mostUsedDex && (
                <div className="ds-pi-row"><span className="ds-pi-key">Most used DEX</span><span className="ds-pi-val">{result.patternInsights.mostUsedDex}</span></div>
              )}
              {result.patternInsights.partialProfitFrequency && (
                <div className="ds-pi-row"><span className="ds-pi-key">Took partial profits</span><span className="ds-pi-val">{result.patternInsights.partialProfitFrequency}</span></div>
              )}
            </div>
          )}
        </div>

      </div>
    )}

  </div>
);
```

---

## Step 4 — Payslip page padding fix

Your payslip page at `app/payslip/[wallet]/page.tsx` (or wherever the shell lives) currently has the nav overlapping the top. Find the outermost wrapper div and make sure it uses `page-canvas canvas-payslip`. If it currently has `padding-top` hardcoded or uses a different class, replace it:

```tsx
// The outer wrapper of the payslip page shell:
<div className="page-canvas canvas-payslip">
  {/* ConnectScreen or ResultsView renders here */}
  {state === 'connect' ? <ConnectScreen ... /> : <ResultsView ... />}
</div>
```

The `page-canvas` class already has `padding: 64px 64px 80px` which clears the nav height. Remove any other `paddingTop` or `marginTop` you have on this wrapper.

---

## Step 5 — ResultsView.tsx

This is the biggest component change. Replace the existing class names with the design system classes. The data props and all logic stay identical.

```tsx
// components/ResultsView.tsx
// Logic unchanged. Only JSX class names and structure updated.

return (
  <>
    {/* Grade row */}
    <div className="ds-grade-row">
      <div className="ds-grade-main">
        <div className={`ds-grade-letter ${gradeColorClass(summary.overallGrade)}`}>
          {summary.overallGrade}
        </div>
        <div className="ds-grade-score">{summary.overallScore ?? '—'} / 100</div>
        <div className="ds-grade-lbl">Overall Grade</div>
      </div>

      <div className="ds-grade-breakdown">
        {[
          { lbl: 'Entry Discipline', letter: summary.entryGrade,   score: summary.entryScore },
          { lbl: 'Exit Discipline',  letter: summary.exitGrade,    score: summary.exitScore },
          { lbl: 'Size Management',  letter: summary.sizeGrade,    score: summary.sizeScore },
          { lbl: 'Token Selection',  letter: summary.selectionGrade, score: summary.selectionScore },
        ].map(g => (
          <div className="ds-grade-cell" key={g.lbl}>
            <span className="ds-grade-cell-lbl">{g.lbl}</span>
            <span className={`ds-grade-cell-letter ${gradeColorClass(g.letter ?? 'C')}`}>
              {g.letter ?? '—'}
            </span>
            <span className="ds-grade-cell-score">{g.score ?? '—'} / 100</span>
          </div>
        ))}
      </div>
    </div>

    {/* Stats strip */}
    <div className="ds-stats-strip">
      <div className="ds-stat-pill">
        <span className="ds-stat-lbl">Total P&L</span>
        <span className="ds-stat-val" style={{ color: summary.totalPnlSOL >= 0 ? 'var(--slip-success)' : 'var(--slip-red)' }}>
          {formatSol(summary.totalPnlSOL, true)}
        </span>
        <span className="ds-stat-sub">Across {summary.tradesAnalyzed} trades</span>
      </div>
      <div className="ds-stat-pill">
        <span className="ds-stat-lbl">Left on Table</span>
        <span className="ds-stat-val" style={{ color: 'var(--slip-warning)' }}>
          {summary.totalLeftOnTable > 0 ? `+${formatSol(summary.totalLeftOnTable)}` : '—'}
        </span>
        <span className="ds-stat-sub">Peak vs actual exits</span>
      </div>
      <div className="ds-stat-pill">
        <span className="ds-stat-lbl">Worst Trade</span>
        <span className="ds-stat-val" style={{ color: summary.worstTradePnl < 0 ? 'var(--slip-red)' : 'var(--slip-success)' }}>
          {formatSol(summary.worstTradePnl, true)}
        </span>
        <span className="ds-stat-sub">{summary.worstTradeToken ?? '—'}</span>
      </div>
      <div className="ds-stat-pill">
        <span className="ds-stat-lbl">Avg Entry Percentile</span>
        <span className="ds-stat-val">
          {summary.avgEntryPercentile !== null ? `${summary.avgEntryPercentile.toFixed(0)}th` : '—'}
        </span>
        <span className="ds-stat-sub">Higher = worse timing</span>
      </div>
    </div>

    {/* Pattern banner — only render if patternTax exists */}
    {summary.patternTax && (
      <div className="ds-pattern-banner">
        <div className="ds-pb-icon">⚠</div>
        <div>
          <div className="ds-pb-title">{summary.patternTax.title}</div>
          <div className="ds-pb-text" dangerouslySetInnerHTML={{ __html: summary.patternTax.text }} />
        </div>
      </div>
    )}

    {/* Sort tabs */}
    <div className="ds-sort-row">
      {(['worst', 'recent', 'size'] as SortMode[]).map(mode => (
        <button
          key={mode}
          className={`ds-sort-btn ${sort === mode ? 'active' : ''}`}
          onClick={() => setSort(mode)}
        >
          {mode === 'worst' ? 'Worst First' : mode === 'recent' ? 'Most Recent' : 'Biggest Size'}
        </button>
      ))}
    </div>

    {/* Trade list */}
    <div>
      {sorted.map((trade, i) => (
        <TradeCard
          key={[trade.signature, trade.tokenMint, trade.entryTimestamp, trade.exitTimestamp ?? 'open', trade.solSpent.toFixed(6)].join(':')}
          trade={trade}
          rank={i + 1}
          wallet={wallet}
        />
      ))}
    </div>

    <Link href="/" className="ds-btn-ghost" style={{ width: 'fit-content', marginTop: 16 }}>
      ← Analyze another wallet
    </Link>
  </>
);

// Grade color helper
function gradeColorClass(grade: string): string {
  if (grade.startsWith('A')) return 'ds-grade-a';
  if (grade.startsWith('B')) return 'ds-grade-b';
  if (grade.startsWith('C')) return 'ds-grade-c';
  if (grade.startsWith('D')) return 'ds-grade-d';
  return 'ds-grade-f';
}
```

---

## Step 6 — TradeCard.tsx

Replace the top row layout and expanded detail. Your `expanded` state, `setExpanded`, `shareOpen`, and all data access remain unchanged.

```tsx
// components/TradeCard.tsx
// Replace the return statement with:

const diagAccentClass = {
  BOUGHT_THE_TOP:    'ds-tc-bought',
  SOLD_THE_BOTTOM:   'ds-tc-sold',
  PAPER_HANDS:       'ds-tc-paper',
  DIAMOND_HANDS_REKT:'ds-tc-diamond',
  GOOD_TRADE:        'ds-tc-good',
  UNKNOWN:           'ds-tc-unknown',
}[trade.diagnosis] ?? 'ds-tc-unknown';

const diagPillClass = {
  BOUGHT_THE_TOP:    'ds-pill-red',
  SOLD_THE_BOTTOM:   'ds-pill-amber',
  PAPER_HANDS:       'ds-pill-amber',
  DIAMOND_HANDS_REKT:'ds-pill-red',
  GOOD_TRADE:        'ds-pill-green',
  UNKNOWN:           'ds-pill-muted',
}[trade.diagnosis] ?? 'ds-pill-muted';

const diagDetailClass = {
  BOUGHT_THE_TOP:    'ds-td-bought',
  SOLD_THE_BOTTOM:   'ds-td-sold',
  PAPER_HANDS:       'ds-td-paper',
  DIAMOND_HANDS_REKT:'ds-td-diamond',
  GOOD_TRADE:        'ds-td-good',
  UNKNOWN:           '',
}[trade.diagnosis] ?? '';

const rankClass = rank === 1 ? 'ds-tc-rank-1' : rank === 2 ? 'ds-tc-rank-2' : rank === 3 ? 'ds-tc-rank-3' : '';

return (
  <>
    <div className={`ds-trade-card ${diagAccentClass} ${expanded ? 'open' : ''}`}>

      {/* Top row */}
      <div className="ds-tc-top" onClick={() => setExpanded(!expanded)}>
        <div className={`ds-tc-rank ${rankClass}`}>{rank}</div>

        <div>
          <div className="ds-tc-token-row">
            <span className="ds-tc-symbol">${trade.tokenSymbol}</span>
            <span className={`ds-diag-pill ${diagPillClass}`}>{diagnosisLabel(trade.diagnosis)}</span>
          </div>
          <div className="ds-tc-date">{formatTs(trade.entryTimestamp)}</div>
        </div>

        <div className="ds-tc-winner-mini">
          {trade.topWinner ? (
            <>
              <div className="ds-tc-winner-pnl">+{trade.topWinner.totalPnlSol?.toFixed(1)} SOL</div>
              <div className="ds-tc-winner-sub">top winner · same token</div>
              {trade.topWinner.entryTimingLabel && (
                <div className="ds-tc-winner-sub" style={{ color: 'var(--slip-red)' }}>
                  {trade.topWinner.entryTimingLabel}
                </div>
              )}
            </>
          ) : (
            <div className="ds-tc-winner-sub">No winner data</div>
          )}
        </div>

        <div className="ds-tc-pnl">
          <div className="ds-tc-pnl-val" style={{ color: pnlColor }}>
            {pnlSign(pnl)}{pnl?.toFixed(2) ?? '—'} SOL
          </div>
          <div className="ds-tc-pnl-meta">{pnlLabel} · Damage {trade.damageScore}</div>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="ds-tc-detail">
          <div className="ds-tc-split">
            <div className="ds-tc-half">
              <div className="ds-tc-half-title ds-th-you">◉ Your Trade</div>
              <div className="ds-tc-stat"><span className="ds-tc-stat-key">Entry Price</span><span className="ds-tc-stat-val">{formatPrice(trade.entryPrice)}</span></div>
              <div className="ds-tc-stat"><span className="ds-tc-stat-key">Entry Percentile</span><span className="ds-tc-stat-val" style={{ color: trade.entryPercentile && parseInt(trade.entryPercentile) > 70 ? 'var(--slip-red)' : 'var(--slip-success)' }}>{trade.entryPercentile ?? '—'}</span></div>
              <div className="ds-tc-stat"><span className="ds-tc-stat-key">{trade.exitTimestamp ? 'Exit Price' : 'Current Price'}</span><span className="ds-tc-stat-val">{formatPrice(trade.exitPrice ?? trade.currentPrice)}</span></div>
              <div className="ds-tc-stat"><span className="ds-tc-stat-key">Peak After Entry</span><span className="ds-tc-stat-val" style={{ color: 'var(--slip-success)' }}>{formatPrice(trade.peakPriceAfterEntry)}</span></div>
              <div className="ds-tc-stat"><span className="ds-tc-stat-key">SOL Spent</span><span className="ds-tc-stat-val">{trade.solSpent.toFixed(3)} SOL</span></div>
              {trade.solReceived !== null && <div className="ds-tc-stat"><span className="ds-tc-stat-key">SOL Received</span><span className="ds-tc-stat-val" style={{ color: pnlColor }}>{trade.solReceived.toFixed(3)} SOL</span></div>}
              <div className="ds-tc-stat"><span className="ds-tc-stat-key">Left on Table</span><span className="ds-tc-stat-val" style={{ color: trade.leftOnTable ? 'var(--slip-warning)' : 'var(--slip-text-soft)' }}>{trade.leftOnTable !== null ? `+${trade.leftOnTable.toFixed(2)} SOL` : '—'}</span></div>
            </div>

            <div className="ds-tc-half">
              {trade.topWinner ? (
                <>
                  <div className="ds-tc-half-title ds-th-winner">◈ Top Winner · {trade.topWinner.walletLabel}</div>
                  <div className="ds-tc-stat"><span className="ds-tc-stat-key">Entry Market Cap</span><span className="ds-tc-stat-val" style={{ color: 'var(--slip-success)' }}>{trade.topWinner.entryMarketCap ?? '—'}</span></div>
                  <div className="ds-tc-stat"><span className="ds-tc-stat-key">Entry Timing</span><span className="ds-tc-stat-val" style={{ color: 'var(--slip-success)' }}>{trade.topWinner.entryTimingLabel ?? '—'}</span></div>
                  <div className="ds-tc-stat"><span className="ds-tc-stat-key">SOL Deployed</span><span className="ds-tc-stat-val">{trade.topWinner.solDeployed?.toFixed(1) ?? '—'} SOL</span></div>
                  <div className="ds-tc-stat"><span className="ds-tc-stat-key">Exit Timing</span><span className="ds-tc-stat-val">{trade.topWinner.exitTiming ?? '—'}</span></div>
                  <div className="ds-tc-stat"><span className="ds-tc-stat-key">Total P&L</span><span className="ds-tc-stat-val" style={{ color: 'var(--slip-success)' }}>+{trade.topWinner.totalPnlSol?.toFixed(1)} SOL</span></div>
                  <div className="ds-tc-stat"><span className="ds-tc-stat-key">Used DEX</span><span className="ds-tc-stat-val">{trade.topWinner.dex ?? '—'}</span></div>
                </>
              ) : (
                <>
                  <div className="ds-tc-half-title ds-th-winner">◈ Top Winner</div>
                  <div style={{ fontSize: 12, color: 'var(--slip-text-soft)', lineHeight: 1.6 }}>
                    No winner data available for this token.<br />
                    Run MIRROR for a deeper look.
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Diagnosis text */}
          <div className={`ds-tc-diagnosis ${diagDetailClass}`}>
            {trade.diagnosisText || 'No diagnosis available for this trade.'}
          </div>

          {/* Actions */}
          <div className="ds-tc-actions">
            <button
              className="ds-action-btn ds-action-verdict"
              onClick={e => { e.stopPropagation(); /* open verdict panel */ }}
            >
              ⚖ Run Verdict on ${trade.tokenSymbol}
            </button>
            <button
              className="ds-action-btn ds-action-mirror"
              onClick={e => { e.stopPropagation(); /* open mirror panel */ }}
            >
              🪞 Full Mirror →
            </button>
            <button
              className="ds-action-btn ds-action-x"
              onClick={e => { e.stopPropagation(); /* share to X */ }}
            >
              𝕏
            </button>
            <button
              className="ds-action-btn ds-action-share"
              onClick={e => { e.stopPropagation(); setShareOpen(true); }}
            >
              Share Payslip
            </button>
          </div>
        </div>
      )}
    </div>

    {shareOpen && (
      <ShareCard trade={trade} wallet={wallet} onClose={() => setShareOpen(false)} />
    )}
  </>
);
```

---

## What does not change

- All API routes (`app/api/`) — untouched
- All TypeScript types (`types/index.ts`) — untouched
- `lib/helius.ts`, `lib/birdeye.ts`, `lib/analyzer.ts` — untouched
- `components/ShareCard.tsx`, `components/ScoreBadge.tsx` — untouched
- `components/Nav.tsx` — untouched
- `components/VerdictPanel.tsx`, `components/MirrorPanel.tsx` — untouched (these are side panels, not page shells)
- All existing CSS variables your app currently uses — untouched, the new `ds-` prefixed classes are additive

---

## Implementation order

```
1. globals.css   — paste the full CSS block at the bottom
2. Verdict page  — swap JSX shell, verify it loads
3. Mirror page   — swap JSX shell, verify it loads
4. Payslip page  — fix outer wrapper class to page-canvas canvas-payslip
5. ResultsView   — update grade row, stats strip, pattern banner, sort tabs
6. TradeCard     — update top row, expanded detail, action buttons
7. Test all three pages with a real wallet
```

Start with Step 1 and verify the CSS loaded before touching any component. Open the browser devtools and check that `--slip-success` resolves to `#10b981` on any page — if it does, the design system is active.

---

*SLIP Dashboard UI — Implementation Guide*
*Affects: globals.css · verdict page · mirror page · payslip page · ResultsView · TradeCard*
*Does not affect: API routes · types · lib files · Nav · panels · ShareCard*
