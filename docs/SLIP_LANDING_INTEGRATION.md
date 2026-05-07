# SLIP Landing Page — Integration Guide
### Separate marketing site from the app

---

## File structure

You now have **two separate experiences**:

```
slip-app/
├── public/
│   └── SLIP_Website_Background.png          ← add your background image here
│
├── app/
│   ├── page.tsx                             ← LANDING (marketing)
│   ├── app/
│   │   ├── page.tsx                         ← CONNECT (app entry)
│   │   ├── payslip/[wallet]/page.tsx
│   │   └── api/
│   │
│   └── layout.tsx
│
└── components/
    ├── ConnectScreen.tsx
    ├── LoadingScreen.tsx
    ├── VerdictPanel.tsx
    ├── MirrorPanel.tsx
    └── ...
```

---

## Step 1 — Add the background image to your project

```bash
# Copy the image to your public folder
cp SLIP_Website_Background.png public/

# Verify it's there
ls -la public/SLIP_Website_Background.png
```

---

## Step 2 — Create the landing page

Create a new **root layout** that uses the landing page as the homepage, and then route `/app` as the entry point to the actual app.

### Option A: Simple (recommended for now)

Rename your current `app/page.tsx` (the connect screen) to `app/app/page.tsx`:

```bash
mkdir -p app/app
mv app/page.tsx app/app/page.tsx
```

Then create a new `app/page.tsx` that imports the landing page as a client component:

```tsx
// app/page.tsx
'use client';

import { useState } from 'react';

export default function LandingPage() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>SLIP — Onchain Trade Intelligence</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <style>{LANDING_CSS}</style>
      </head>
      <body>
        {/* ... entire landing page HTML goes here ... */}
      </body>
    </html>
  );
}

const LANDING_CSS = `...`; // paste all CSS from the HTML file
```

Actually, this is messy. Better approach below.

### Option B: Clean (recommended)

Create a new `pages/index.tsx` if you're using Pages Router, or create separate route groups:

```bash
# Using app router with route groups
mkdir -p app/(landing)
mkdir -p app/(app)

# Move landing to its own group
# Create app/(landing)/page.tsx with the landing HTML

# Move app logic to its own group
# Create app/(app)/page.tsx with the connect screen
# Create app/(app)/payslip/[wallet]/page.tsx
# etc.
```

Then in `app.tsx` (the root layout), handle both:

```tsx
// app/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SLIP — Onchain Trade Intelligence',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

---

## Step 3 — Create landing page component

Instead of embedding all HTML inline, create a component:

```tsx
// components/LandingPage.tsx
'use client';

import Link from 'next/link';

export default function LandingPage() {
  return (
    <>
      {/* NAV */}
      <nav className="nav">
        <div className="nav-logo">
          <div className="nav-logo-dot"></div>
          SLIP
        </div>

        <div className="nav-menu">
          <a href="#features" className="nav-item">Features</a>
          <a href="#how" className="nav-item">How it works</a>
          <a href="https://github.com/yourname/slip" target="_blank" className="nav-item">GitHub</a>
        </div>

        <div className="nav-cta">
          <span className="nav-badge">SOLANA</span>
          <Link href="/app" className="nav-btn">Connect Wallet</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-content">
          <p className="hero-eyebrow">ONCHAIN TRADE INTELLIGENCE</p>

          <h1 className="hero-title">
            Your trades.<br />
            <span className="unfiltered">Unfiltered.</span>
          </h1>

          <p className="hero-sub">
            Connect your wallet. SLIP reads your last 100 trades, scores your
            performance, shows you who won your money and why.
          </p>

          <div className="hero-actions">
            <Link href="/app" className="btn-primary">Analyze Wallet →</Link>
            <a href="#features" className="btn-secondary">See Features</a>
          </div>

          <div className="hero-stats">
            <div className="stat">
              <div className="stat-num">24.1K</div>
              <div className="stat-label">Wallets Analyzed</div>
            </div>
            <div className="stat">
              <div className="stat-num">218K</div>
              <div className="stat-label">Trades Analyzed</div>
            </div>
            <div className="stat">
              <div className="stat-num">141K</div>
              <div className="stat-label">SOL Left on Table</div>
            </div>
            <div className="stat">
              <div className="stat-num">9.4K</div>
              <div className="stat-label">Tokens Scanned</div>
            </div>
          </div>
        </div>
      </section>

      {/* Rest of landing page sections... */}

      <style jsx>{`
        ${LANDING_STYLES}
      `}</style>
    </>
  );
}

const LANDING_STYLES = `
  /* Paste all CSS from the HTML landing page here */
`;
```

Then use it in your route:

```tsx
// app/(landing)/page.tsx
import LandingPage from '@/components/LandingPage';

export default function Home() {
  return <LandingPage />;
}
```

---

## Step 4 — Update nav links in the app

When users are on the app (at `/app` or `/app/payslip/...`), they should have a way back to the landing. Add a "Back to Home" button:

```tsx
// components/Nav.tsx (your app nav)
import Link from 'next/link';

export default function AppNav() {
  return (
    <nav className="app-nav">
      <Link href="/" className="nav-logo">
        <div className="nav-logo-dot" />
        SLIP
      </Link>
      {/* rest of nav */}
    </nav>
  );
}
```

Clicking the logo on `/app` takes them back to `/` (landing). Clicking it on `/` keeps them on landing (no navigation).

---

## Step 5 — Background image path

In your landing page component, reference the image correctly:

```tsx
// In your CSS or as a style prop:
.hero::before {
  background-image: url('/SLIP_Website_Background.png');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  opacity: 0.6;
}
```

The `/` at the start means it looks in the `public/` folder.

---

## Step 6 — Verify file structure

```bash
ls -la public/
# Should show:
# SLIP_Website_Background.png

ls -la app/
# Should show:
# (app)/      <- app routes (connect, payslip, etc)
# page.tsx    <- landing page

ls -la components/
# Should show:
# LandingPage.tsx
# ConnectScreen.tsx
# LoadingScreen.tsx
# VerdictPanel.tsx
# MirrorPanel.tsx
# etc.
```

---

## Step 7 — Update deploy link in nav button

The landing page has this button in the nav:

```tsx
<button className="nav-btn" onclick="goToApp()">Connect Wallet</button>
```

This should link to `/app`:

```tsx
<Link href="/app" className="nav-btn">Connect Wallet</Link>
```

And in the footer / CTA:

```tsx
<button className="cta-btn" onclick="goToApp()">Start Analyzing →</button>
```

Should be:

```tsx
<Link href="/app" className="cta-btn">Start Analyzing →</Link>
```

---

## Step 8 — Git commit

```bash
# Add the background image
git add public/SLIP_Website_Background.png

# Create the landing page component
git add components/LandingPage.tsx

# Update routes
git add app/page.tsx app/app/page.tsx

# Commit
git commit -m "feat(landing): marketing landing page with background image"

# Push
git push origin feat/slip-v2-wallet-entry
```

---

## Navigation flow

```
Landing (/)
  ↓
  [Connect Wallet button]
  ↓
Connect App (/app)
  ↓
  [submit wallet]
  ↓
Loading (/app)
  ↓
Payslip (/app/payslip/[wallet])
  ↓
  [VERDICT/MIRROR side panels]

Logo click → back to / (landing)
```

---

## Styling notes

The landing page uses **Space Grotesk** (display) and **Plus Jakarta Sans** (body) — different from the app which uses **Space Grotesk** (display) and **Azeret Mono** (monospace). This visual distinction is intentional: the landing feels premium and marketing-focused, the app feels technical and data-focused.

If you want them unified, update the font imports in the app's global.css to match.

---

*Landing page integrated. Navigation clear. Product separated from marketing.*

