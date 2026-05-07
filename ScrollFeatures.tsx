'use client';

import { useRef, useEffect, useState } from 'react';

// ─── Data ──────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    id: 'verdict',
    badge: 'VERDICT',
    badgeClass: 'sl-badge sl-badge-v',
    title: 'Before The Trade',
    desc: [
      'Full token safety and market structure scan.',
      'Mint authority, LP lock, transfer hooks, deployer history, holder concentration, timing position.',
      'One score. One verdict.',
    ],
    img: '/Verdict.png',
    imgClass: 'sl-mockup-img sl-mockup-img-v',
    dots: [0.8, 0.3, 0.3],
  },
  {
    id: 'mirror',
    badge: 'MIRROR',
    badgeClass: 'sl-badge sl-badge-m',
    title: 'During the trade',
    desc: [
      'Every wallet winning on your token right now, ranked by SOL gained.',
      "See who entered earlier, with more size, and why they're up while you're not.",
      'The gap, explained.',
    ],
    img: '/Mirror.png',
    imgClass: 'sl-mockup-img sl-mockup-img-m',
    dots: [0.3, 0.8, 0.3],
  },
  {
    id: 'payslip',
    badge: 'PAYSLIP',
    badgeClass: 'sl-badge sl-badge-p',
    title: 'After the trade',
    desc: [
      'Your full trade autopsy. Entry percentile, peak missed, SOL left on table.',
      'Who won the most on each token. Your recurring mistakes.',
      'Your trading grade, broken down.',
    ],
    img: '/Payslip.png',
    imgClass: 'sl-mockup-img sl-mockup-img-p',
    dots: [0.3, 0.3, 0.8],
  },
] as const;

// ─── Component ─────────────────────────────────────────────────────────────

export default function ScrollFeatures() {
  const outerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);           // 0 | 1 | 2
  const [textKey, setTextKey] = useState(0);          // forces re-mount → re-triggers CSS animation
  const [imgTransition, setImgTransition] = useState<'in' | 'out'>('in');
  const lastActive = useRef(0);

  // ── Scroll driver ──────────────────────────────────────────────────────
  useEffect(() => {
    function onScroll() {
      const el = outerRef.current;
      if (!el) return;

      const { top, height } = el.getBoundingClientRect();
      const vh = window.innerHeight;

      // progress: 0 when section top hits viewport top, 1 when section bottom hits viewport top
      // The sticky inner pins from 0–1 of progress across 3 beats (one per feature)
      const scrolled = -top; // px scrolled past the section top
      const scrollable = height - vh; // total scrollable distance inside this section
      const p = Math.max(0, Math.min(1, scrolled / scrollable));

      // Map 0–1 into three equal thirds
      let next: number;
      if (p < 1 / 3) next = 0;
      else if (p < 2 / 3) next = 1;
      else next = 2;

      if (next !== lastActive.current) {
        // Trigger image crossfade
        setImgTransition('out');
        setTimeout(() => {
          setActive(next);
          lastActive.current = next;
          setImgTransition('in');
          setTextKey(k => k + 1);   // re-mount text for entrance animation
        }, 180);                     // half the crossfade duration
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const f = FEATURES[active];

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <>
      <style>{STYLES}</style>

      {/*
        Outer: tall enough to give 3 full viewport-heights of scroll room.
        position: relative so the sticky child has something to pin against.
      */}
      <div
        ref={outerRef}
        className="sf-outer"
      >
        {/* Background grid — matches your .sl-features::before */}
        <div className="sf-grid-bg" />

        {/* Sticky inner — pins to viewport while outer scrolls */}
        <div className="sf-sticky">

          {/* ── LEFT: text ── */}
          <div className="sf-text-col" key={textKey}>
            <span className={f.badgeClass}>{f.badge}</span>
            <h3 className="sf-title">{f.title}</h3>
            <div className="sf-desc-lines">
              {f.desc.map((line, i) => (
                <p
                  key={i}
                  className="sf-desc-line"
                  style={{ animationDelay: `${0.08 + i * 0.07}s` }}
                >
                  {line}
                </p>
              ))}
            </div>

            {/* Progress dots — tell the user where they are */}
            <div className="sf-progress-dots">
              {FEATURES.map((_, i) => (
                <div
                  key={i}
                  className={`sf-progress-dot ${i === active ? 'sf-progress-dot--active' : ''}`}
                />
              ))}
            </div>
          </div>

          {/* ── RIGHT: mockup card ── */}
          <div className="sf-mockup-col">
            <div className="sl-mockup">

              {/* Image crossfades between features */}
              <img
                key={f.img}
                src={f.img}
                alt={f.badge}
                className={`sf-mockup-img ${f.imgClass} sf-img-${imgTransition}`}
              />

              {/* Pagination dots — match your existing ones */}
              <div className="sl-mockup-dots">
                {f.dots.map((opacity, i) => (
                  <div key={i} className="sl-dot" style={{ opacity }} />
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Scroll hint — visible only at the start, fades out once scrolled */}
        <div className="sf-scroll-hint">
          <span>Scroll to explore</span>
          <svg width="12" height="16" viewBox="0 0 12 16" fill="none">
            <path d="M6 0v14M1 9l5 5 5-5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const STYLES = `
/* ── Outer container: 300vh gives 3 scroll beats ── */
.sf-outer {
  position: relative;
  height: 300vh;           /* 3 viewport heights = 3 features worth of scroll */
}

/* ── Grid background from your original .sl-features::before ── */
.sf-grid-bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(50% 50% at 50% 50%, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 100%),
              url('/background-pattern.svg');
  pointer-events: none;
  z-index: 0;
}

/* ── Sticky inner: pins to top of viewport while outer scrolls ── */
.sf-sticky {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 128px;
  padding: 0 40px;
  max-width: 1260px;
  margin: 0 auto;
  z-index: 1;
}

/* ── LEFT column ── */
.sf-text-col {
  width: 489px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* Badge — inherits your .sl-badge classes from LandingPage CSS */
.sf-text-col .sl-badge {
  margin-bottom: 32px;
  animation: sf-badge-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
}

/* Title */
.sf-title {
  font-family: 'Instrument Sans', sans-serif;
  font-weight: 600;
  font-size: 52px;
  line-height: 1.0;
  color: #fff;
  margin: 0 0 40px 0;
  animation: sf-title-in 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: 0.04s;
}

/* Description lines — each animates in with a stagger */
.sf-desc-lines {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-bottom: 48px;
}

.sf-desc-line {
  font-family: 'Instrument Sans', sans-serif;
  font-weight: 600;
  font-size: 20px;
  line-height: 1.5;
  color: rgba(255,255,255,0.6);
  margin: 0 0 4px 0;
  opacity: 0;
  animation: sf-line-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* Progress indicator dots (not the mockup dots) */
.sf-progress-dots {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sf-progress-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  transition: background 0.3s ease, transform 0.3s ease;
}

.sf-progress-dot--active {
  background: #fff;
  transform: scale(1.3);
}

/* ── RIGHT column ── */
.sf-mockup-col {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Override the mockup position so it fills the card properly */
.sf-mockup-img {
  position: absolute;
  border-radius: 8px;
  object-fit: cover;
}

/* Image crossfade */
.sf-img-in {
  opacity: 1;
  transform: scale(1);
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.sf-img-out {
  opacity: 0;
  transform: scale(0.97);
  transition: opacity 0.18s ease, transform 0.18s ease;
}

/* Scroll hint — bottom center, fades out after first scroll beat */
.sf-scroll-hint {
  position: absolute;
  bottom: calc(100vh - 40px);   /* sits at bottom of first sticky view */
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(255,255,255,0.3);
  animation: sf-hint-fade 1s ease 2s both;
  pointer-events: none;
  z-index: 2;
}

/* ── Keyframes ── */

@keyframes sf-badge-in {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes sf-title-in {
  from { opacity: 0; transform: translateY(14px); filter: blur(4px); }
  to   { opacity: 1; transform: translateY(0);    filter: blur(0); }
}

@keyframes sf-line-in {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes sf-hint-fade {
  from { opacity: 0.3; }
  to   { opacity: 0; }
}

/* ── Responsive ── */
@media (max-width: 900px) {
  .sf-sticky {
    flex-direction: column;
    gap: 40px;
    padding: 80px 20px 40px;
    height: auto;
    min-height: 100vh;
  }

  .sf-text-col {
    width: 100%;
  }

  .sf-outer {
    height: auto;    /* on mobile, disable the scroll-pinning */
  }

  .sf-sticky {
    position: relative;   /* undo sticky on mobile */
  }

  .sf-scroll-hint {
    display: none;
  }
}
`;

