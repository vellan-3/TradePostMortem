'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

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

const WHEEL_THRESHOLD = 60; // delta px needed to trigger a step change
const TRANSITION_MS   = 220;

export default function ScrollFeatures() {
  const outerRef      = useRef<HTMLDivElement>(null);
  const panelRef      = useRef<HTMLDivElement>(null);
  const stepRef       = useRef(0);          // live step for event handlers
  const inTransition  = useRef(false);
  const wheelAcc      = useRef(0);

  const [active,   setActive]   = useState(0);
  const [textKey,  setTextKey]  = useState(0);
  const [imgOut,   setImgOut]   = useState(false);

  // Absolute scroll-Y for a given step:
  //   step 0 → section top == viewport top
  //   step 1 → section scrolled 1vh
  //   step 2 → section scrolled 2vh  (rect.bottom === vh → exit edge)
  const canonicalY = useCallback((step: number) => {
    const outer = outerRef.current;
    if (!outer) return window.scrollY;
    const sectionTop = outer.getBoundingClientRect().top + window.scrollY;
    return sectionTop + step * window.innerHeight;
  }, []);

  const goTo = useCallback((next: number) => {
    if (inTransition.current) return;
    inTransition.current = true;
    wheelAcc.current = 0;

    // Snap scroll to the canonical position for the target step first,
    // so the panel position stays correct while content swaps.
    window.scrollTo({ top: canonicalY(next), behavior: 'instant' });

    setImgOut(true);
    setTimeout(() => {
      stepRef.current = next;
      setActive(next);
      setImgOut(false);
      setTextKey(k => k + 1);
      inTransition.current = false;
    }, TRANSITION_MS);
  }, [canonicalY]);

  // ── Panel positioning (fixed while in section, absolute otherwise) ──────
  function positionPanel() {
    const outer = outerRef.current;
    const panel = panelRef.current;
    if (!outer || !panel) return;

    const rect = outer.getBoundingClientRect();
    const vh   = window.innerHeight;

    if (rect.top <= 0 && rect.bottom >= vh) {
      // Section straddles viewport — pin panel
      panel.style.position = 'fixed';
      panel.style.top      = '0';
    } else if (rect.bottom < vh) {
      // Scrolled past — park at section bottom
      panel.style.position = 'absolute';
      panel.style.top      = `${outer.offsetHeight - vh}px`;
    } else {
      // Not yet reached — park at section top
      panel.style.position = 'absolute';
      panel.style.top      = '0';
    }
  }

  useEffect(() => {
    let rafId: number;

    function onWheel(e: WheelEvent) {
      const outer = outerRef.current;
      if (!outer) return;

      const rect = outer.getBoundingClientRect();
      const vh   = window.innerHeight;
      const step = stepRef.current;
      const inSection = rect.top <= 0 && rect.bottom >= vh;

      if (!inSection) {
        // Outside section — let browser scroll normally, update panel position
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(positionPanel);
        return;
      }

      const goingDown = e.deltaY > 0;

      // At boundaries: let scroll escape naturally
      if (goingDown && step === FEATURES.length - 1) {
        wheelAcc.current = 0;
        rafId = requestAnimationFrame(positionPanel);
        return;
      }
      if (!goingDown && step === 0) {
        wheelAcc.current = 0;
        rafId = requestAnimationFrame(positionPanel);
        return;
      }

      // Mid-section: eat the event and accumulate
      e.preventDefault();

      if (!inTransition.current) {
        wheelAcc.current += e.deltaY;

        if (goingDown && wheelAcc.current >= WHEEL_THRESHOLD) {
          goTo(step + 1);
        } else if (!goingDown && wheelAcc.current <= -WHEEL_THRESHOLD) {
          goTo(step - 1);
        }
      }

      positionPanel();
    }

    function onScroll() {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(positionPanel);
    }

    window.addEventListener('wheel',  onWheel,  { passive: false });
    window.addEventListener('scroll', onScroll, { passive: true  });
    positionPanel();

    return () => {
      window.removeEventListener('wheel',  onWheel);
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [goTo]);

  const f = FEATURES[active];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* 300vh outer: canonical positions sit at 0, 1vh, 2vh from section top */}
      <div ref={outerRef} className="sf-outer" id={FEATURES[active].id}>
        <div className="sf-grid-bg" />

        {/* Panel: JS toggles position fixed ↔ absolute */}
        <div ref={panelRef} className="sf-panel">
          <div className="sf-panel-inner">

            {/* LEFT — re-mounts on step change to replay CSS animations */}
            <div className="sf-text-col" key={textKey}>
              <span className={f.badgeClass}>{f.badge}</span>
              <h3 className="sf-title">{f.title}</h3>
              <div style={{ height: '180px' }} />
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
              <div className="sf-progress-dots">
                {FEATURES.map((_, i) => (
                  <div
                    key={i}
                    className={`sf-progress-dot${i === active ? ' sf-progress-dot--active' : ''}`}
                  />
                ))}
              </div>
            </div>

            {/* RIGHT */}
            <div className="sf-mockup-col">
              <div className="sl-mockup">
                <img
                  key={f.img}
                  src={f.img}
                  alt={f.badge}
                  className={`sf-mockup-img ${f.imgClass} ${imgOut ? 'sf-img-out' : 'sf-img-in'}`}
                />
                <div className="sl-mockup-dots">
                  {f.dots.map((opacity, i) => (
                    <div key={i} className="sl-dot" style={{ opacity }} />
                  ))}
                </div>
              </div>
            </div>

          </div>

          {active === 0 && (
            <div className="sf-scroll-hint">
              <span>Scroll to explore</span>
              <svg width="12" height="16" viewBox="0 0 12 16" fill="none">
                <path
                  d="M6 0v14M1 9l5 5 5-5"
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const STYLES = `
.sf-outer {
  position: relative;
  height: 300vh;
}

.sf-grid-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(50% 50% at 50% 50%, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 100%),
    url('/background-pattern.svg');
  pointer-events: none;
  z-index: 0;
}

/* Starts absolute; JS switches to fixed while section is in view */
.sf-panel {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background: #000;
  z-index: 1;
  overflow: hidden;
}

.sf-panel-inner {
  width: 100%;
  height: 100%;
  max-width: 1260px;
  margin: 0 auto;
  padding: 0 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 128px;
}

.sf-text-col {
  width: 489px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

.sf-text-col .sl-badge {
  margin-bottom: 24px;
  animation: sf-badge-in 0.35s cubic-bezier(0.16,1,0.3,1) both;
}

.sf-title {
  font-family: 'Instrument Sans', sans-serif;
  font-weight: 600;
  font-size: 52px;
  line-height: 1.0;
  color: #fff;
  margin: 0;
  animation: sf-title-in 0.45s cubic-bezier(0.16,1,0.3,1) both;
  animation-delay: 0.04s;
}

.sf-desc-lines {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-bottom: 56px;
}

.sf-desc-line {
  font-family: 'Instrument Sans', sans-serif;
  font-weight: 300;
  font-size: 20px;
  line-height: 1.6;
  color: rgba(255,255,255,0.6);
  margin: 0;
  opacity: 0;
  animation: sf-line-in 0.4s cubic-bezier(0.16,1,0.3,1) forwards;
}

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

.sf-mockup-col {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sf-mockup-img {
  position: absolute;
  border-radius: 8px;
  object-fit: cover;
}

.sf-img-in  { opacity: 1; transform: scale(1);    transition: opacity 0.22s ease, transform 0.22s ease; }
.sf-img-out { opacity: 0; transform: scale(0.97); transition: opacity 0.18s ease, transform 0.18s ease; }

.sf-scroll-hint {
  position: absolute;
  bottom: 32px;
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
}

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

@media (max-width: 900px) {
  .sf-outer  { height: auto; }
  .sf-panel  { position: relative !important; height: auto; min-height: 100vh; }
  .sf-panel-inner {
    flex-direction: column;
    gap: 40px;
    padding: 80px 20px 40px;
    height: auto;
    align-items: flex-start;
  }
  .sf-text-col { width: 100%; }
  .sf-scroll-hint { display: none; }
}
`;


/* SLIP v2 Official Release */
