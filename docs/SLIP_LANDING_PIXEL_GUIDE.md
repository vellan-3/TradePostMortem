# SLIP Landing Page — Pixel-Perfect Implementation Guide
### Every layer, effect, spacing, font, color, and interaction. Nothing estimated.

---

## FONTS — Install these first

All three fonts must be loaded before any CSS is written. In your `app/layout.tsx` or in the `<head>` of your landing page:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Instrument+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
```

### Font usage map — memorize this

| Element | Family | Weight | Size | Notes |
|---|---|---|---|---|
| SLIP logo | Syne | 800 | 40px | Logo only |
| • dot in logo | Syne | 800 | 40px | Color: #3B82F6 |
| Nav links | Instrument Sans | 600 | 14px | VERDICT / MIRROR / PAYSLIP |
| Connect Wallet | Instrument Sans | 600 | 16px | Button label |
| SOLANA pill | Instrument Sans | 600 | 14px | uppercase, opacity 0.4 |
| Hero eyebrow | Space Mono | 700 | 16px | uppercase, letter-spacing: 16px |
| Hero title | Syne | 800 | 144px | line-height: 0.9 |
| Hero subtitle | Instrument Sans | 600 | 20px | line-height: 1.44, opacity 0.6 |
| Get Started btn | Instrument Sans | 500 | 20px | |
| "How it works" pill | Space Mono | 400 | 12px | uppercase |
| How it works title | Instrument Sans | 400 | 52px | NOT bold, weight 400 |
| Feature badges | Space Mono | 700 | 16px | uppercase, letter-spacing: 0.4px |
| Feature section title | Instrument Sans | 600 | 52px | |
| Feature body text | Instrument Sans | 600 | 20px | line-height: 1.5, opacity 0.6 |
| Apart section title | Instrument Sans | 700 | 48px | |
| Apart sub | Instrument Sans | 400 | 20px | opacity 0.7 |
| Card label (THE PROBLEM) | Instrument Sans | 700 | 10px | uppercase, opacity 0.4 |
| Card title | Instrument Sans | 700 | 32px | |
| Card body | Instrument Sans | 400 | 16px | opacity 0.6, line-height: 1.44 |
| Card bullets | Instrument Sans | 600 | 16px | line-height: 2 |
| Stats number | Syne | 800 | 52px | |
| Stats label | Instrument Sans | 500 | 16px | opacity 0.7 |
| CTA title | Instrument Sans | 700 | 52px | line-height: 1.2 |
| CTA sub | Instrument Sans | 500 | 20px | opacity 0.7 |
| Start Analyzing btn | Instrument Sans | 600 | 24px | |
| Footer SLIP wordmark | Syne | 800 | 550px | uppercase |
| Footer links | Instrument Sans | 500 | 20px | uppercase |
| Footer copyright | Instrument Sans | 400 | 16px | opacity 0.5 |

---

## COLORS — Complete token set

```css
/* Background */
--bg: #000000;

/* Brand */
--blue:   #3B82F6;
--blue-dark: #234C90;
--red:    #FF3232;
--purple: #8B5CF6;
--green:  #10b981;

/* Feature badge backgrounds */
--verdict-bg: rgba(255, 50, 50, 0.20);
--mirror-bg:  rgba(59, 130, 246, 0.25);
--payslip-bg: rgba(139, 92, 246, 0.25);

/* Feature badge text */
--verdict-text: #FF3232;
--mirror-text:  #3B82F6;
--payslip-text: #8B5CF6;

/* Nav glass pill */
--nav-pill-bg:     rgba(255, 255, 255, 0.05);
--nav-pill-border: rgba(255, 255, 255, 0.25);
--nav-sep:         rgba(255, 255, 255, 0.40);

/* Connect Wallet button gradient */
--btn-gradient: linear-gradient(180deg, #3B82F6 20%, #234C90 80%);

/* Mockup card */
--mockup-bg-gradient: linear-gradient(180deg, #000000 10%, #1A1A1A 100%);
--mockup-border: rgba(255, 255, 255, 0.10);

/* Apart cards */
--problem-card-gradient: linear-gradient(180deg, rgba(255,255,255,0) 25%, rgba(255,50,50,0.15) 100%);
--solution-card-gradient: linear-gradient(180deg, rgba(255,255,255,0) 25%, rgba(0,214,138,0.16) 100%);
--card-border: #ffffff;

/* Footer glows */
--glow-red:    #FF3232;
--glow-purple: #8B5CF6;
--glow-blue:   #3B82F6;

/* Divider */
--divider: rgba(255, 255, 255, 0.25);
```

---

## GLOBAL RULES

```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background: #000;
  color: #fff;
  font-family: 'Instrument Sans', sans-serif;
  overflow-x: hidden;
}

/* Page outer wrapper — matches Figma padding: 40px, gap: 80px */
.page-wrapper {
  padding: 40px;
  display: flex;
  flex-direction: column;
  gap: 80px;
  background: #000;
}
```

---

## SECTION 1 — NAV

### Exact structure
The nav sits **inside the hero border-radius** in the Figma — it overlays the background image. It is `position: fixed` so it stays on scroll.

```css
nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 98px;                /* Figma: top: 47px for logo = ~half of 98px container */
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 64px;             /* Figma: logo at left: 64px */
  z-index: 100;
  pointer-events: none;        /* allows click-through to hero */
}

/* All interactive elements inside need pointer-events: all */
nav > * { pointer-events: all; }
```

### Logo
```css
.nav-logo {
  font-family: 'Syne', sans-serif;
  font-weight: 800;
  font-size: 40px;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 0;
  cursor: pointer;
  letter-spacing: -1px;
}

/* The blue dot — exact from Figma */
.nav-logo .dot {
  color: #3B82F6;
}
```

HTML:
```html
<div class="nav-logo">SLIP <span class="dot">•</span></div>
```

### Center nav pill
```css
.nav-pills {
  /* Figma: left: 774px on 1888px canvas = roughly centered */
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px 40px;           /* Figma: padding-top/bottom 24px, left/right 40px */
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  border: 2px solid rgba(255, 255, 255, 0.25);  /* Figma: outline 2px */
  backdrop-filter: blur(10px);  /* Figma: backdrop-filter: blur(10px) */
}

.nav-pills a {
  font-family: 'Instrument Sans', sans-serif;
  font-weight: 600;
  font-size: 14px;
  color: #fff;
  text-decoration: none;
}

.nav-pills .sep {
  font-family: 'Instrument Sans', sans-serif;
  font-weight: 600;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.40);
}
```

HTML:
```html
<div class="nav-pills">
  <a href="#verdict">VERDICT</a>
  <span class="sep">|</span>
  <a href="#mirror">MIRROR</a>
  <span class="sep">|</span>
  <a href="#payslip">PAYSLIP</a>
</div>
```

### Right side: Connect Wallet + SOLANA pill
```css
.nav-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* Connect Wallet button */
.btn-connect {
  padding: 20px 32px;           /* Figma: padding-top/bottom 20px, left/right 32px */
  background: linear-gradient(180deg, #3B82F6 20%, #234C90 80%);
  box-shadow:
    0px 8px 10px -4px rgba(0, 0, 0, 0.50),    /* outer drop shadow */
    0px 12px 32px white inset,                  /* top white glow inset */
    0px -5px 10px rgba(0, 0, 0, 0.50) inset,   /* bottom dark inset */
    0px 6px 12px white inset;                   /* second white inset */
  border-radius: 18px;
  border: none;
  font-family: 'Instrument Sans', sans-serif;
  font-weight: 600;
  font-size: 16px;
  line-height: 1.28;
  color: #fff;
  cursor: pointer;
}

/* SOLANA badge */
.pill-solana {
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.10);
  border-radius: 999px;
  border: 1.5px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(6px);
  font-family: 'Instrument Sans', sans-serif;
  font-weight: 600;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.40);  /* Figma: opacity 0.40 on text */
  text-transform: uppercase;
}
```

---

## SECTION 2 — HERO

### The hero is a card, not the viewport
The hero in Figma is a **bordered rounded card** with a background image inside it. It is NOT full-screen with a fixed background — it is a contained element with `border-radius: 40px` and `border: 2px solid white`.

```css
.hero {
  position: relative;
  width: 100%;
  height: 100vh;             /* fills viewport height */
  min-height: 800px;
  border-radius: 40px;       /* Figma: border-radius: 40px */
  border: 2px solid #fff;    /* Figma: outline: 2px white solid */
  overflow: hidden;           /* clips bg image to border-radius */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end; /* content sits at bottom */
  padding-bottom: 256px;     /* Figma: padding-bottom: 256px */
}
```

### Background image layer (layer 0)
```css
.hero-bg {
  position: absolute;
  inset: 0;
  background-image: url('/SLIP_Website_Background.png');
  background-size: cover;
  background-position: center center;
  z-index: 0;
}
```

### Gradient overlay layer (layer 1)
This is critical — it darkens top and bottom but leaves the middle transparent so the field and glowing portal are visible:
```css
.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.60) 0%,    /* dark at very top — nav area */
    rgba(0, 0, 0, 0.00) 25%,   /* transparent — let image breathe */
    rgba(0, 0, 0, 0.00) 75%,   /* transparent — let image breathe */
    rgba(0, 0, 0, 0.75) 100%   /* dark at bottom — content area */
  );
  z-index: 1;
}
```

### Hero content layer (layer 2)
```css
.hero-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;                  /* Figma: gap: 20px between title block items */
  width: 100%;
  padding: 0 64px;
}
```

### Eyebrow text
```css
.hero-eyebrow {
  font-family: 'Space Mono', monospace;
  font-weight: 700;
  font-size: 16px;
  text-transform: uppercase;
  letter-spacing: 16px;       /* Figma: letter-spacing: 16px — very wide */
  color: rgba(255, 255, 255, 0.70);  /* opacity: 0.70 */
  text-align: center;
  /* Add padding-right to optically compensate for letter-spacing on last char */
  padding-right: 16px;
}
```

### Hero title
```css
.hero-title {
  font-family: 'Syne', sans-serif;
  font-weight: 800;
  font-size: 144px;           /* Figma: 144px */
  line-height: 0.90;          /* Figma: line-height: 129.60px / 144px = 0.9 */
  color: #fff;
  text-align: center;
  letter-spacing: -2px;       /* tight tracking for this weight */
}
```

### Hero subtitle
```css
.hero-subtitle {
  font-family: 'Instrument Sans', sans-serif;
  font-weight: 600;
  font-size: 20px;
  line-height: 1.44;          /* Figma: line-height: 28.80px / 20px = 1.44 */
  color: rgba(255, 255, 255, 0.60);
  text-align: center;
  max-width: 698px;           /* Figma: width: 698px */
}
```

### Get Started button
The button sits at Figma: gap 320px below the title group — this is handled by `justify-content: space-between` or a large gap on the hero-body flex column. Set margin-top accordingly.

```css
.btn-get-started {
  /* Figma: height: 72px */
  height: 72px;
  padding: 16px 64px;          /* Figma: padding-top/bottom 16px, left/right 64px */
  background: linear-gradient(180deg, #3B82F6 20%, #234C90 80%);
  box-shadow:
    0px 8px 6px -4px rgba(0, 0, 0, 0.75),      /* hard bottom shadow */
    0px 48px 48px -6px rgba(0, 0, 0, 0.75),     /* large ambient shadow */
    0px 20px 32px white inset,                   /* bright top-center inset glow */
    0px -5px 10px rgba(0, 0, 0, 0.50) inset,    /* bottom inset shadow */
    0px 10px 12px white inset;                   /* secondary inset glow */
  overflow: hidden;                              /* Figma: overflow: hidden */
  border-radius: 24px;
  border: none;
  font-family: 'Instrument Sans', sans-serif;
  font-weight: 500;
  font-size: 20px;
  line-height: 1.28;
  color: #fff;
  cursor: pointer;
  /* The button needs top margin to push it to the bottom */
  margin-top: auto;
}
```

**IMPORTANT:** The hero layout from Figma is:
```
flex-direction: column
gap: 320px between the title group and the button
```

Achieve this with:
```css
.hero-content {
  /* Two flex children: title-group and button */
  justify-content: space-between;
  padding-top: 40px;
  padding-bottom: 0;
}
```

Or use explicit `margin-top: 280px` on the button.

---

## SECTION 3 — HOW IT WORKS INTRO

This section has a `border-bottom: 1.5px solid rgba(255,255,255,0.25)` — it's a divider section.

```css
.how-intro {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;  /* content anchors to bottom */
  height: 640px;              /* Figma: height: 640px */
  padding-bottom: 100px;      /* Figma: padding-bottom: 100px */
  border-bottom: 1.5px solid rgba(255, 255, 255, 0.25);
  gap: 64px;                  /* Figma: gap: 64px */
}

.pill-how {
  display: inline-flex;
  align-items: center;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 999px;
  font-family: 'Space Mono', monospace;
  font-weight: 400;
  font-size: 12px;
  text-transform: uppercase;
  color: #fff;
  letter-spacing: 1px;
}

.how-title {
  font-family: 'Instrument Sans', sans-serif;
  font-weight: 400;           /* NOTE: weight 400, not bold */
  font-size: 52px;
  color: #fff;
  text-align: center;
  max-width: 676px;           /* Figma: width: 676px */
  line-height: 1.1;
}
```

---

## SECTION 4 — FEATURE ROWS

### The white square border
There is a `1280px × 1280px` white bordered square centered behind all three feature rows. This is an absolute positioned element inside the section.

```css
.features-section {
  position: relative;
  padding: 64px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 120px;                 /* Figma: gap: 120px between rows */
}

/* The white square from Figma: width: 1280px, height: 1280px, outline: 4px white */
.features-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 1280px;
  height: 1280px;
  outline: 4px solid #fff;   /* Figma: outline: 4px white solid */
  pointer-events: none;
  z-index: 0;
}
```

### Feature row layout
```css
.feature-row {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 128px;                 /* Figma: gap: 128px */
  width: 100%;
  max-width: 1257px;          /* 489 + 128 + 640 = 1257px total */
}
```

### Feature text column
```css
.feature-text {
  width: 489px;               /* Figma: width: 489px, exact */
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 100px;                 /* Figma: gap: 100px between header and body */
}

.feature-header {
  display: flex;
  flex-direction: column;
  gap: 32px;                  /* Figma: gap: 32px between badge and title */
}
```

### Feature badges — three variants
```css
.feature-badge {
  display: inline-flex;
  align-items: center;
  padding: 12px 28px;         /* Figma: padding: 12px 28px */
  border-radius: 999px;
  font-family: 'Space Mono', monospace;
  font-weight: 700;
  font-size: 16px;
  text-transform: uppercase;
  letter-spacing: 0.4px;      /* Figma: letter-spacing: 0.40px */
  line-height: 1.28;
  width: fit-content;
}

.badge-verdict { background: rgba(255, 50, 50, 0.20);   color: #FF3232; }
.badge-mirror  { background: rgba(59, 130, 246, 0.25);  color: #3B82F6; }
.badge-payslip { background: rgba(139, 92, 246, 0.25);  color: #8B5CF6; }
```

### Feature title
```css
.feature-title {
  font-family: 'Instrument Sans', sans-serif;
  font-weight: 600;
  font-size: 52px;
  line-height: 1.0;           /* Figma: line-height equals font-size */
  color: #fff;
}
```

### Feature body text
```css
.feature-body {
  width: 391px;               /* Figma: width: 391px */
  font-family: 'Instrument Sans', sans-serif;
  font-weight: 600;
  font-size: 20px;
  line-height: 1.5;           /* Figma: line-height: 30px / 20px = 1.5 */
  color: rgba(255, 255, 255, 0.60);
}
```

### Mockup card
```css
.feature-mockup {
  width: 640px;               /* Figma: width: 640px */
  height: 520px;              /* Figma: height: 520px */
  flex-shrink: 0;
  position: relative;
  background: linear-gradient(180deg, #000000 10%, #1A1A1A 100%);
  border-radius: 25px;        /* Figma: border-radius: 25px */
  border: 2px solid rgba(255, 255, 255, 0.10);
  overflow: hidden;
}
```

### Mockup pagination dots
Each mockup has 3 dots at the bottom — one bright, two dim — showing which slide is active.
```css
.mockup-dots {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 20px;                  /* Figma: gap: 20px */
}

.dot {
  width: 8px;                 /* Figma: 8px × 8px */
  height: 8px;
  background: #fff;
  border-radius: 9999px;
}

/* Active dot */
.dot.active { opacity: 0.80; }
/* Inactive dots */
.dot.inactive { opacity: 0.30; }
```

Dot active positions per feature:
- VERDICT: first dot active (`opacity: 0.80, 0.30, 0.30`)
- MIRROR: second dot active (`opacity: 0.30, 0.80, 0.30`)
- PAYSLIP: third dot active (`opacity: 0.30, 0.30, 0.80`)

### Inner screenshot positions (for when you drop in real screenshots)
```css
/* VERDICT screenshot */
.mockup-img-verdict {
  position: absolute;
  width: 480px;    /* Figma: 480px */
  height: 318px;   /* Figma: 318px */
  left: 80px;      /* Figma: left: 80px */
  top: 101.5px;    /* Figma: top: 101.50px */
  border-radius: 8px;
  object-fit: cover;
}

/* MIRROR screenshot */
.mockup-img-mirror {
  position: absolute;
  width: 529px;    /* Figma: 529px */
  height: 320px;   /* Figma: 320px */
  left: 55.5px;    /* Figma: left: 55.50px */
  top: 100px;      /* Figma: top: 100px */
  border-radius: 8px;
  object-fit: cover;
}

/* PAYSLIP screenshot */
.mockup-img-payslip {
  position: absolute;
  width: 543px;    /* Figma: 543px */
  height: 346.8px; /* Figma: 346.80px */
  left: 48px;      /* Figma: left: 48px */
  top: 87.1px;     /* Figma: top: 87.10px */
  border-radius: 8px;
  object-fit: cover;
}
```

---

## SECTION 5 — WHAT SETS SLIP APART

### Section wrapper
```css
.apart-section {
  padding-top: 144px;         /* Figma: padding-top: 144px */
  padding-bottom: 144px;      /* Figma: padding-bottom: 144px */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 80px;                  /* Figma: gap: 80px between all children */
}
```

### Top image (placeholder / real screenshot later)
```css
.apart-top-image {
  align-self: stretch;        /* Figma: align-self: stretch */
  height: 283px;              /* Figma: height: 283px */
  border-radius: 24px;
  border: 2px solid #fff;     /* Figma: outline: 2px white solid */
  object-fit: cover;
  width: 100%;
  max-width: 1264px;
}
```

### Text header block
```css
.apart-header {
  align-self: stretch;
  display: flex;
  flex-direction: column;
  gap: 40px;                  /* Figma: gap: 40px */
}

.apart-title {
  font-family: 'Instrument Sans', sans-serif;
  font-weight: 700;
  font-size: 48px;
  line-height: 1.28;          /* Figma: line-height: 61.44px / 48px = 1.28 */
  color: #fff;
}

.apart-sub {
  max-width: 594px;           /* Figma: width: 594px */
  font-family: 'Instrument Sans', sans-serif;
  font-weight: 400;
  font-size: 20px;
  line-height: 1.28;          /* Figma: line-height: 25.60px / 20px = 1.28 */
  color: rgba(255, 255, 255, 0.70);
}
```

### Two cards side by side
```css
.apart-cards {
  align-self: stretch;
  display: flex;
  gap: 64px;                  /* Figma: gap: 64px */
  align-items: center;
}

.apart-card {
  flex: 1;                    /* Both cards equal width */
  /* Figma: width: 600px each with 64px gap = 1264px total */
  padding: 72px 48px;         /* Figma: padding: 72px 48px */
  border-radius: 25px;
  border: 2px solid #fff;     /* Figma: outline: 2px white solid */
  display: flex;
  flex-direction: column;
  gap: 80px;                  /* Figma: gap: 80px between inner block and bullets */
}

/* Problem card — red gradient at bottom */
.card-problem {
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0) 25%,      /* transparent at top */
    rgba(255, 50, 50, 0.15) 100%     /* red tint at bottom */
  );
}

/* Solution card — green gradient at bottom */
.card-solution {
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0) 25%,      /* transparent at top */
    rgba(0, 214, 138, 0.16) 100%     /* green tint at bottom */
  );
}
```

### Card inner content
```css
.card-inner {
  display: flex;
  flex-direction: column;
  gap: 24px;                  /* Figma: gap: 24px */
}

.card-label {
  font-family: 'Instrument Sans', sans-serif;
  font-weight: 700;
  font-size: 10px;
  line-height: 1.2;
  color: rgba(255, 255, 255, 0.40);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.card-title {
  font-family: 'Instrument Sans', sans-serif;
  font-weight: 700;
  font-size: 32px;
  line-height: 1.2;           /* Figma: line-height: 38.40px / 32px = 1.2 */
  color: #fff;
}

.card-body {
  font-family: 'Instrument Sans', sans-serif;
  font-weight: 400;
  font-size: 16px;
  line-height: 1.44;          /* Figma: line-height: 23.04px / 16px = 1.44 */
  color: rgba(255, 255, 255, 0.60);
}

.card-bullets {
  font-family: 'Instrument Sans', sans-serif;
  font-weight: 600;
  font-size: 16px;
  line-height: 2.0;           /* Figma: line-height: 32px / 16px = 2.0 */
  color: #fff;
}
```

---

## SECTION 6 — STATS

```css
.stats-section {
  height: 640px;              /* Figma: height: 640px */
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 96px;                  /* Figma: gap: 96px */
  border-bottom: 1.5px solid rgba(255, 255, 255, 0.25);
  /* NOTE: no padding — this section bleeds full width */
}

.stat-item {
  border-radius: 30px;        /* Figma: border-radius: 30px */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;                  /* Figma: gap: 24px */
}

.stat-number {
  font-family: 'Syne', sans-serif;
  font-weight: 800;
  font-size: 52px;            /* Figma: 52px — NOT 36px (that was v1) */
  line-height: 1.28;          /* Figma: line-height: 66.56px / 52px = 1.28 */
  text-align: center;
  color: #fff;
}

.stat-label {
  font-family: 'Instrument Sans', sans-serif;
  font-weight: 500;
  font-size: 16px;
  line-height: 1.28;          /* Figma: line-height: 20.48px / 16px = 1.28 */
  text-align: center;
  color: rgba(255, 255, 255, 0.70);
}
```

---

## SECTION 7 — CTA

```css
.cta-section {
  height: 800px;              /* Figma: height: 800px */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 100px;                 /* Figma: gap: 100px */
}

.cta-text-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;                  /* Figma: gap: 40px */
}

.cta-title {
  align-self: stretch;        /* Figma: align-self: stretch */
  font-family: 'Instrument Sans', sans-serif;
  font-weight: 700;
  font-size: 52px;
  line-height: 1.2;           /* Figma: line-height: 62.40px / 52px = 1.2 */
  text-align: center;
  color: #fff;
}

.cta-sub {
  align-self: stretch;
  font-family: 'Instrument Sans', sans-serif;
  font-weight: 500;
  font-size: 20px;
  text-align: center;
  color: rgba(255, 255, 255, 0.70);
}

/* Start Analyzing button */
.btn-start {
  height: 80px;               /* Figma: height: 80px (larger than Get Started) */
  padding: 16px 48px;         /* Figma: padding: 16px 48px */
  background: linear-gradient(180deg, #3B82F6 20%, #234C90 80%);
  box-shadow:
    0px 8px 6px -4px rgba(0, 0, 0, 0.75),
    0px 48px 48px -6px rgba(0, 0, 0, 0.75),
    0px 20px 32px white inset,
    0px -5px 10px rgba(0, 0, 0, 0.50) inset,
    0px 10px 12px white inset;
  border-radius: 24px;
  border: none;
  font-family: 'Instrument Sans', sans-serif;
  font-weight: 600;
  font-size: 24px;            /* Figma: 24px — bigger than the hero button */
  line-height: 1.28;
  color: #fff;
  cursor: pointer;
}
```

---

## SECTION 8 — FOOTER

### The giant SLIP wordmark
```css
.footer-section {
  height: 800px;              /* Figma: height: 800px */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 120px;                 /* Figma: gap: 120px */
  position: relative;
  overflow: hidden;
}

/* The SLIP letters at 550px — this clips out of viewport intentionally */
.slip-wordmark {
  align-self: stretch;
  font-family: 'Syne', sans-serif;
  font-weight: 800;
  font-size: 550px;           /* Figma: 550px */
  text-transform: uppercase;
  text-align: center;
  color: #fff;
  line-height: 0.85;
  letter-spacing: -12px;
  /* The S, L, IP are separate spans in Figma but rendered as one word */
}
```

### The three glow blobs behind the wordmark

These are absolute positioned divs with massive blur. They sit BEHIND the wordmark text.

```css
/* Blue glow — Figma: top: 7510px relative to page, blur: 220px */
.glow-blue {
  position: absolute;
  width: 100%;
  height: 100px;
  bottom: 100px;              /* approximate relative position in footer */
  left: 0;
  background: #3B82F6;
  border-radius: 9999px;
  filter: blur(220px);
  pointer-events: none;
  z-index: 0;
}

/* Red glow — Figma: blur: 360px, very large spread */
.glow-red {
  position: absolute;
  width: 100%;
  height: 100px;
  bottom: 200px;
  left: 0;
  background: #FF3232;
  border-radius: 9999px;
  filter: blur(360px);
  pointer-events: none;
  z-index: 0;
}

/* Purple glow — Figma: height 160px, blur: 240px */
.glow-purple {
  position: absolute;
  width: 100%;
  height: 160px;
  bottom: 150px;
  left: 0;
  background: #8B5CF6;
  border-radius: 9999px;
  filter: blur(240px);
  pointer-events: none;
  z-index: 0;
}

/* Wordmark sits above glows */
.slip-wordmark { position: relative; z-index: 1; }
```

### Footer bar (logo + links)
```css
.footer-bar {
  align-self: stretch;
  padding: 0 36px;            /* Figma: padding-left: 36px */
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  position: relative;
  z-index: 1;
}

.footer-left {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  gap: 60px;
}

/* The blue square logo mark */
.footer-logo-sq {
  width: 100px;               /* Figma: 100px × 100px */
  height: 100px;
  background: #3B82F6;
  /* no border-radius — it's a hard square */
}

.footer-copy {
  font-family: 'Instrument Sans', sans-serif;
  font-weight: 400;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.50);
}

/* Three link columns */
.footer-links {
  display: flex;
  gap: 48px;                  /* Figma: gap: 48px between columns */
  opacity: 0.70;
}

.footer-col {
  display: flex;
  flex-direction: column;
  gap: 48px;                  /* Figma: gap: 48px between links within column */
  padding: 10px;
}

.footer-link {
  font-family: 'Instrument Sans', sans-serif;
  font-weight: 500;
  font-size: 20px;
  text-transform: uppercase;
  color: #fff;
  text-decoration: none;
}
```

Footer columns content:
- Column 1: VERDICT, MIRROR, PAYSLIP
- Column 2: TWITTER, TELEGRAM, DISCORD
- Column 3: DOCS, ABOUT US, CONTACT

---

## EFFECTS REFERENCE

### The Connect Wallet / CTA button glow — how it works
The button appears to glow from the inside. It is achieved with **four box-shadows stacked**:

```
Layer 1 (outer): 0px 8px 6px -4px rgba(0,0,0,0.75)
  → A tight dark shadow directly under the button for grounding

Layer 2 (outer): 0px 48px 48px -6px rgba(0,0,0,0.75)
  → A large spread shadow giving floating depth

Layer 3 (inset): 0px 20px 32px white inset
  → The bright top-center white reflection (the "glass" look)

Layer 4 (inset): 0px -5px 10px rgba(0,0,0,0.50) inset
  → A dark shadow from the bottom edge inward

Layer 5 (inset): 0px 10px 12px white inset
  → A secondary smaller white glow near the top
```

This combination creates the appearance of a convex, lit surface.

### The hero overlay — why 4 stops
```
0%   → dark:        covers nav so text is readable on any background
25%  → transparent: reveals the field, sky, and glowing portal fully
75%  → transparent: keeps the middle pristine
100% → dark:        creates a dark base so hero text sits on readable ground
```

### The white border square in features
```
width: 1280px, height: 1280px
outline: 4px solid white
position: absolute, centered horizontally
top: 0 (of .features-section)

The three feature rows sit IN FRONT of this square (z-index: 1).
The square is purely decorative — it creates a grid-like frame that adds
structure to the feature layout section without dominating the content.
```

### The glow blobs in footer
Three overlapping blurs at different colors and intensities create a chromatic gradient glow. The order matters — purple in the middle, red above it, blue below it. At `blur(360px)` the red becomes a wide, soft ambient. At `blur(220px)` the blue is tighter and denser. Combined they produce the gradient aurora effect visible in the footer behind SLIP.

---

## SPACING CHEATSHEET

| Section | Key measurement |
|---|---|
| Page padding | 40px all sides |
| Page gap | 80px between sections |
| Nav height | 98px |
| Nav padding horizontal | 64px |
| Hero border-radius | 40px |
| Hero bottom padding | 256px |
| Hero content gap | 20px |
| Gap between title block and button | 320px |
| How intro height | 640px |
| How intro padding-bottom | 100px |
| How intro gap | 64px |
| Features section gap | 120px |
| Feature white square | 1280px × 1280px |
| Feature row gap | 128px |
| Feature text width | 489px |
| Feature text internal gap | 100px |
| Feature header gap | 32px |
| Feature mockup width | 640px |
| Feature mockup height | 520px |
| Feature mockup border-radius | 25px |
| Apart section padding vertical | 144px |
| Apart section gap | 80px |
| Apart header gap | 40px |
| Apart cards gap | 64px |
| Apart card padding | 72px 48px |
| Apart card internal gap | 80px |
| Apart card inner gap | 24px |
| Stats section height | 640px |
| Stats gap | 96px |
| Stat item gap | 24px |
| CTA section height | 800px |
| CTA section gap | 100px |
| CTA text group gap | 40px |
| Footer section height | 800px |
| Footer section gap | 120px |
| Footer bar padding-left | 36px |
| Footer links gap | 48px |
| Footer col gap | 48px |
| Footer logo sq size | 100px × 100px |

---

## IMPLEMENTATION ORDER

Build in this order — each section is self-contained:

```
1. Install fonts in layout.tsx
2. Set global CSS (body, page-wrapper)
3. Nav — position: fixed, frosted pill, gradient button
4. Hero — card container, bg image layer, overlay layer, content layer
5. How intro — height: 640px, bottom-anchored content, divider
6. Features section — white square pseudo, three rows
7. Apart section — top image, header, two gradient cards
8. Stats section — height: 640px, four stat items, divider
9. CTA section — height: 800px, centered text, gradient button
10. Footer — glows, 550px wordmark, footer bar with logo sq and links
```

Test each section individually. Check it against the screenshot. Then move to the next.

---

## COMMON MISTAKES TO AVOID

1. **Hero is a card not a viewport background.** The `border: 2px solid white` and `border-radius: 40px` are on the hero container, not the body. The background image is clipped inside this card.

2. **The how-intro has NO top content.** It is `justify-content: flex-end` — the pill and title anchor to the bottom with `padding-bottom: 100px`. The top 540px of the section is empty space.

3. **Feature badge font is Space Mono, not Instrument Sans.** The small VERDICT/MIRROR/PAYSLIP labels inside the rounded pill use Space Mono 700. Do not use Instrument Sans here.

4. **Stats font-size is 52px in the final design.** An earlier design used 36px. Your Figma spec clearly shows 52px.

5. **The footer SLIP wordmark overflows.** At 550px font-size, the text exceeds the container width. This is intentional — `overflow: hidden` on the footer section clips it. Do not try to make it fit.

6. **Line-height on the hero title is 0.9, not 1.** `line-height: 129.60px` on `font-size: 144px` = `129.60 / 144 = 0.9`. This tight leading is what makes the two-line title feel like a single visual unit.

7. **The button box-shadow has 5 layers.** Most implementations use 1-2. All 5 are required for the convex lit-glass effect. Missing any of the inset shadows will flatten the button.

8. **The apart cards have equal flex: 1 width.** Figma shows `width: 600px` each but in a fluid layout they should be `flex: 1` with the parent `display: flex; gap: 64px`.

9. **Opacity is on the text, not the container.** `color: rgba(255,255,255,0.60)` not `opacity: 0.6` on the parent. Using opacity on the container affects all children including shadows and borders.

10. **The three glow blobs are inside the footer section**, positioned absolutely, with `z-index: 0`. The SLIP wordmark and footer bar are `z-index: 1`. The glows are behind the text, not in front.

---

*SLIP Landing Page — Implementation Guide*
*Fonts: Syne · Instrument Sans · Space Mono*
*Design source: Figma export + screenshot*

