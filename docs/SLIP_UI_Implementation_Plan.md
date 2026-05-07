# SLIP UI — Unification Implementation Plan

## Goal

Redesign all three app screens (Verdict, Mirror, Payslip) under one unified UI language — where each page has its own product identity (accent color, tone, scale) but they all unmistakably belong to the same system. Payslip is **not** made to look like Verdict or Mirror. Instead, all three are brought up to the same standard.

The Payslip screen already handles one thing correctly that the others don't: **the navbar does not visually bleed into the page**. That behaviour must be preserved and replicated across Verdict and Mirror.

---

## The Two Core Problems

### 1. The pages feel built by different people
Each screen uses a different typographic scale, input shape, button radius, and spacing rhythm. They share a nav and a color palette but nothing else is consistent.

### 2. The navbar is not isolated from page backgrounds
On Verdict and Mirror, the page's dark surface bleeds directly into the navbar area — there's no visual separation. The navbar should feel like it floats above the content, not merge with it. Payslip already does this correctly and the other two pages need to match it.

---

## Design Rules (Apply to All Three Pages)

These rules unify the system without flattening the individual page identities.

| Rule | Detail |
|---|---|
| **Navbar isolation** | The navbar must sit in its own layer. Use a dedicated `nav` element with `position: sticky`, `top: 0`, `z-index: 100`, a solid or near-solid background (`#000` or `rgba(0,0,0,0.90)` + `backdrop-filter: blur`), and a `1px` bottom border using `--slip-stroke-soft`. The page content scrolls underneath it. |
| **Page content starts below the nav** | Each page's hero/input area must have a top margin or padding that clears the nav height. No content should visually touch or bleed into the nav. |
| **Eyebrow labels are semantic** | `01 · VERDICT` uses `--slip-red`. `02 · MIRROR` uses `--slip-blue`. `03 · PAYSLIP` uses `--slip-purple`. Same font (Space Mono), same size, same uppercase tracking — only the color changes. |
| **Each page owns its accent** | CTA buttons, active states, and key UI highlights use the page's designated accent color. Verdict = red, Mirror = blue, Payslip = purple. These never cross over. |
| **Typography scale is shared** | Page titles use Syne 800 at the same size across all three pages. Payslip's current oversized hero title must come down to match. Subtitles use Instrument Sans at the same size and muted color. |
| **Input shape is shared** | All input fields use `border-radius: var(--slip-radius-xs)` (8px). No page uses pill-shaped inputs. |
| **Spacing rhythm is shared** | The gap between the eyebrow, title, subtitle, and input cluster follows the same vertical rhythm on all three pages. |

---

## Page-by-Page Changes

### Verdict (01 · VERDICT)

**What's working:** Eyebrow label, sharp input bar, check-list panel below.

**What needs fixing:**

- **Navbar separation:** Add `position: sticky`, `top: 0`, `z-index: 100`, dark background + blur, and a `1px` bottom border to the `<nav>` element. The page body should start below it with a `padding-top` that matches nav height.
- **Page background:** Add a subtle `--slip-red`-tinted radial gradient at the top of the content area (behind the hero zone only) to give the page a Verdict identity without touching the nav. Example: `radial-gradient(circle at 50% 0%, rgba(255, 50, 50, 0.08), transparent 40%)`.
- **CTA button:** Ensure "Run Verdict →" uses `--slip-red` as its background, not a generic blue. Currently it appears red in the screenshot — confirm this is token-driven and not hardcoded.
- **Input field:** Already sharp-cornered. No change needed.

---

### Mirror (02 · MIRROR)

**What's working:** Three-column input layout is unique and correct for its function.

**What needs fixing:**

- **Navbar separation:** Same fix as Verdict — sticky nav, dark background, blur, bottom border.
- **Page background:** Add a subtle `--slip-blue`-tinted radial gradient at the top of the content area. Example: `radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.08), transparent 40%)`.
- **CTA button:** "Find Winners →" is already blue. Confirm it uses `--slip-blue` token, not hardcoded hex.
- **Input group:** The three-column input box currently has no outer border radius consistency. Wrap the group in a container with `border-radius: var(--slip-radius-xs)` and `border: 1px solid var(--slip-stroke-soft)`.
- **Column dividers:** The vertical dividers between input columns should use `--slip-stroke-soft` (not a heavier border).

---

### Payslip (03 · PAYSLIP)

**What's working:** Navbar separation is already handled correctly. Keep this exactly as-is.

**What needs fixing:**

- **Title size:** The current `~80px` hero Syne title is too large — it breaks rhythm with Verdict and Mirror. Reduce to match the other pages' heading scale (approximately `36–44px`, Syne 800). The title content ("Your Trade Autopsy") is strong enough without the giant scale.
- **Subtitle:** Already good. Confirm it uses `--slip-text-muted` and `Instrument Sans` at the same size as Verdict's subtitle.
- **Input field:** Currently pill-shaped (`border-radius: 999px`). Change to `border-radius: var(--slip-radius-xs)` (8px) to match the system. Do not change the background, border color, or placeholder style.
- **CTA button:** "Generate Payslip →" should use `--slip-purple` as its background accent. If it is currently blue, correct it to purple. Shape should match the other CTAs — rectangular, not pill-shaped.
- **"Connect Wallet Provider" button:** Keep it as a secondary action below the input. Reduce its visual weight — use a ghost/outline style with `--slip-stroke-soft` border and `--slip-text-muted` label. It should not compete with the primary CTA.
- **Page background:** Add a subtle `--slip-purple`-tinted radial gradient at the top of the content area. Example: `radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.08), transparent 40%)`.

---

## Shared Component: Navbar

This is the most important structural fix. The navbar should be extracted into a single shared component used identically across all three pages.

```css
/* Nav container */
nav.slip-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
  height: 56px; /* or match current height */
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--slip-space-6);
  background: rgba(0, 0, 0, 0.90);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--slip-stroke-soft);
}

/* Page body clears the nav */
.slip-page-body {
  padding-top: var(--slip-space-8); /* 48px — or match nav height + breathing room */
}
```

If the app uses a JavaScript framework (React, Vue, etc.), the nav should be a single layout component wrapping all pages — not duplicated per-page.

---

## Shared Component: Page Eyebrow + Title + Subtitle

Each page's hero zone should use this same structure, with only the accent color and content varying:

```html
<div class="page-hero">
  <span class="eyebrow accent-[verdict|mirror|payslip]">01 · VERDICT</span>
  <h1 class="page-title">Token Safety Scanner</h1>
  <p class="page-subtitle">Paste any Solana token contract. Get a full verdict before you enter.</p>
</div>
```

```css
.eyebrow {
  font-family: "Space Mono", monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.eyebrow.accent-verdict { color: var(--slip-red); }
.eyebrow.accent-mirror  { color: var(--slip-blue); }
.eyebrow.accent-payslip { color: var(--slip-purple); }

.page-title {
  font-family: "Syne", sans-serif;
  font-size: clamp(32px, 4vw, 44px);
  font-weight: 800;
  letter-spacing: -0.04em;
  color: var(--slip-text);
  margin: var(--slip-space-2) 0 0;
}

.page-subtitle {
  font-family: "Instrument Sans", sans-serif;
  font-size: 15px;
  color: var(--slip-text-muted);
  margin: var(--slip-space-2) 0 0;
  max-width: 480px;
}
```

---

## Execution Order (Lowest Risk First)

1. **Extract and fix the navbar** — make it sticky with isolation. Test across all three pages before touching anything else.
2. **Fix Payslip title size** — one CSS rule change, no structural impact.
3. **Fix Payslip input radius** — one CSS rule change.
4. **Fix Payslip CTA shape and color** — two CSS rule changes.
5. **Add per-page background gradients** — purely additive, no risk of breaking layout.
6. **Audit Verdict and Mirror for hardcoded colors** — replace with token references.
7. **Normalize eyebrow/title/subtitle structure** — align markup and CSS across all three pages.

---

## What Must Not Change

- The Verdict check-list panel (green dot indicators) — unique to that page's function
- The Mirror three-column input layout — correct for its use case
- The Payslip navbar separation behaviour — it's already right, protect it
- The three product accent color assignments (red/blue/purple) — these carry semantic meaning per the design system

---

## Token Reference

| Token | Value | Used for |
|---|---|---|
| `--slip-red` | `#FF3232` | Verdict accent |
| `--slip-blue` | `#3B82F6` | Mirror accent + primary action |
| `--slip-purple` | `#8B5CF6` | Payslip accent |
| `--slip-stroke-soft` | `rgba(255,255,255,0.10)` | Nav border, input borders, dividers |
| `--slip-text-muted` | `rgba(255,255,255,0.70)` | Subtitles, secondary labels |
| `--slip-radius-xs` | `8px` | All input fields, all CTA buttons |
| `--slip-bg` | `#000000` | Nav background base |
