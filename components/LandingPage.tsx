'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import ScrollFeatures from '@/components/ScrollFeatures';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Instrument+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');

.sl { background:#000; color:#fff; font-family:'Instrument Sans',sans-serif; overflow-x:hidden; min-height:100vh; }
/* Scoped resets — prevent globals.css overrides */
.sl h1,.sl h2,.sl h3,.sl h4,.sl p,.sl a { margin:0; padding:0; }
.sl * { box-sizing:border-box; }

/* NAV */
.sl-nav { position:fixed; top:0; left:0; right:0; height:98px; display:flex; align-items:center; justify-content:space-between; padding:0 64px; z-index:1000; pointer-events:none; }
.sl-nav > * { pointer-events:all; }
.sl-logo { font-family:'Syne',sans-serif; font-weight:800; font-size:32px; letter-spacing:-1px; color:#fff; display:flex; align-items:center; text-decoration:none; cursor:pointer; }
.sl-logo-dot { color:#3B82F6; }
.sl-pills { display:flex; align-items:center; gap:20px; padding:28px 40px; background:rgba(255,255,255,.05); border-radius:20px; border:2px solid rgba(255,255,255,.25); backdrop-filter:blur(10px); }
.sl-pills a { font-family:'Instrument Sans',sans-serif; font-weight:600; font-size:14px; color:#fff; text-decoration:none; transition:opacity .2s; }
.sl-pills a:hover { opacity:.7; }
.sl-sep { color:rgba(255,255,255,.4); font-size:14px; }
.sl-nav-right { display:flex; align-items:center; gap:16px; }
.sl-btn-connect { padding:20px 32px; background:linear-gradient(180deg,#3B82F6 20%,#234C90 80%); box-shadow:0 8px 6px -4px rgba(0,0,0,.75),0 48px 48px -6px rgba(0,0,0,.75),0 20px 32px white inset,0 -5px 10px rgba(0,0,0,.5) inset,0 10px 12px white inset; border-radius:18px; border:none; font-family:'Instrument Sans',sans-serif; font-weight:600; font-size:16px; color:#fff; cursor:pointer; transition:opacity .2s,transform .1s; }
.sl-btn-connect:hover { opacity:.9; }
.sl-btn-connect:active { transform:scale(.98); }
.sl-solana { padding:12px 20px; background:rgba(255,255,255,.1); border-radius:999px; border:1.5px solid rgba(255,255,255,.15); backdrop-filter:blur(6px); font-family:'Instrument Sans',sans-serif; font-weight:600; font-size:14px; color:rgba(255,255,255,.4); text-transform:uppercase; }

/* PAGE */
.sl-page { padding:40px 20px; display:flex; flex-direction:column; gap:80px; background:#000; }

/* HERO */
.sl-hero-wrap { position:relative; margin-top: 45px; border-radius:21px; padding:2px; background:linear-gradient(180deg, rgba(255,255,255,0.15) 0%, #333333 100%); }
.sl-hero { position:relative; width:100%; height:87.5vh; min-height:700px; border-radius:20px; overflow:hidden; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; padding-bottom:256px; }
.sl-hero-bg { position:absolute; inset:0; background-image:url('/SLIP_Website_Background.png'); background-size:cover; background-position:center; z-index:0; transform:scale(1.15) translate(3px, 60px); transform-origin:center; }
.sl-hero-overlay { position:absolute; inset:0; background:linear-gradient(180deg,rgba(0,0,0,.6) 0%,rgba(0,0,0,0) 25%,rgba(0,0,0,0) 75%,rgba(0,0,0,.75) 100%); z-index:1; }
.sl-hero-body { position:relative; z-index:2; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:40px; width:100%; height:100%; padding:0 64px; transform:translateY(60px); }
.sl-eyebrow { font-family:'Space Mono',monospace; font-weight:700; font-size:16px; text-transform:uppercase; letter-spacing:16px; color:rgba(255,255,255,.7); text-align:center; padding-right:16px; margin:0; }
.sl-hero-main-group { display:flex; flex-direction:column; align-items:center; gap:12px; margin: -20px 0 0 0; }
.sl-hero-title { font-family:'Syne',sans-serif; font-weight:800; font-size:144px; line-height:.85; text-align:center; margin:0 auto; letter-spacing:-4px; background:radial-gradient(103.79% 100% at 50% 100%, #FFF 15%, rgba(255, 255, 255, 0.25) 35%, rgba(255, 255, 255, 0.60) 100%) !important; -webkit-background-clip:text !important; background-clip:text !important; -webkit-text-fill-color:transparent !important; width:fit-content; }
.sl-hero-sub { font-family:'Instrument Sans',sans-serif; font-weight:600; font-size:20px; line-height:1.44; color:rgba(255,255,255,.6); text-align:center; max-width:800px; margin:0; }
.sl-hero-action { display:flex; justify-content:center; margin-top: 160px; }
.sl-btn-start { height:72px; padding:16px 64px; background:linear-gradient(180deg, #3B82F6 20%, #234C90 80%); box-shadow: 0px 8px 6px -4px rgba(0,0,0,0.9), 0px 48px 48px -6px rgba(0,0,0,0.9), 0px 20px 32px white inset, 0px -5px 10px rgba(0,0,0,0.65) inset, 0px 10px 12px white inset; border-radius:24px; border:none; font-family:'Instrument Sans',sans-serif; font-weight:500; font-size:20px; color:#fff; cursor:pointer; transition:opacity 0.2s, transform 0.1s; }
.sl-btn-start:hover { opacity:.9; }
.sl-btn-start:active { transform:scale(.98); }

/* HOW INTRO */
.sl-how { display:flex; flex-direction:column; align-items:center; justify-content:flex-end; height:640px; padding-bottom:100px; border-bottom:1.5px solid rgba(255,255,255,.25); gap:64px; }
.sl-pill-label { display:inline-flex; align-items:center; padding:12px 24px; background:rgba(255,255,255,.15); border-radius:999px; font-family:'Space Mono',monospace; font-weight:400; font-size:12px; text-transform:uppercase; color:#fff; letter-spacing:1px; }
.sl-how-title { font-family:'Instrument Sans',sans-serif; font-weight:400; font-size:52px; color:#fff; text-align:center; max-width:676px; line-height:1.1; margin:0; }

/* FEATURES */
.sl-features { position:relative; padding:64px 40px; display:flex; flex-direction:column; align-items:center; gap:120px; }
.sl-features::before { content:''; position:absolute; left:0; top:0; width:100%; height:100%; background:radial-gradient(50% 50% at 50% 50%, rgba(255, 255, 255, 0.10) 0%, rgba(255, 255, 255, 0) 100%), url('/background-pattern.svg'); pointer-events:none; z-index:0; }
.sl-feature-row { position:relative; z-index:1; display:flex; align-items:center; gap:128px; width:100%; max-width:1260px; }
.sl-feature-text { width:489px; flex-shrink:0; display:flex; flex-direction:column; gap:100px; }
.sl-feature-header { display:flex; flex-direction:column; gap:32px; }
.sl-badge { display:inline-flex; align-items:center; padding:12px 28px; border-radius:999px; font-family:'Space Mono',monospace; font-weight:700; font-size:16px; text-transform:uppercase; letter-spacing:.4px; line-height:1.28; width:fit-content; }
.sl-badge-v { background:rgba(255,50,50,.2); color:#FF3232; }
.sl-badge-m { background:rgba(59,130,246,.25); color:#3B82F6; }
.sl-badge-p { background:rgba(139,92,246,.25); color:#8B5CF6; }
.sl-feature-title { font-family:'Instrument Sans',sans-serif; font-weight:600; font-size:52px; line-height:1; color:#fff; margin:0; }
.sl-feature-desc { font-family:'Instrument Sans',sans-serif; font-weight:600; font-size:20px; line-height:1.5; color:rgba(255,255,255,.6); margin:0; }
.sl-mockup { width:640px; height:520px; flex-shrink:0; position:relative; background:linear-gradient(180deg,#000 10%,#1a1a1a 100%); border-radius:25px; border:2px solid rgba(255,255,255,.1); overflow:hidden; }
.sl-mockup-dots { position:absolute; bottom:20px; left:50%; transform:translateX(-50%); display:flex; align-items:center; gap:20px; }
.sl-dot { width:8px; height:8px; background:#fff; border-radius:50%; }
.sl-mockup-img { position:absolute; border-radius:8px; object-fit:cover; }
.sl-mockup-img-v { width:480px; height:318px; left:80px; top:101px; }
.sl-mockup-img-m { width:529px; height:320px; left:56px; top:100px; }
.sl-mockup-img-p { width:543px; height:347px; left:48px; top:87px; }

/* APART */
.sl-apart { padding:144px 40px; display:flex; flex-direction:column; align-items:center; gap:80px; max-width:1400px; margin:0 auto; width:100%; }
.sl-apart-img-wrap { width:100%; max-width:1264px; padding:2px; border-radius:26px; background:linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.25) 100%); display:block; }
.sl-apart-img { width:100%; height:283px; border-radius:24px; border:none; background: url('/slip-apart.png') transparent 0.29px -297.134px / 100% 275.511% no-repeat; display:block; }
.sl-apart-hdr { width:100%; max-width:1264px; display:flex; flex-direction:column; gap:40px; }
.sl-apart-title { font-family:'Instrument Sans',sans-serif; font-weight:700; font-size:48px; line-height:1.28; color:#fff; margin:0; }
.sl-apart-sub { font-family:'Instrument Sans',sans-serif; font-weight:400; font-size:20px; line-height:1.28; color:rgba(255,255,255,.7); max-width:594px; margin:0; }
.sl-apart-cards { display:flex; gap:64px; width:100%; max-width:1264px; }
.sl-card { flex:1; padding:72px 48px; border-radius:25px; border:none; position:relative; display:flex; flex-direction:column; gap:80px; }
.sl-card::before { content:''; position:absolute; inset:0; padding:2px; border-radius:25px; background:linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.15) 100%); -webkit-mask:linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite:xor; mask-composite:exclude; pointer-events:none; }
.sl-card-prob { background:linear-gradient(180deg, rgba(255,255,255,0) 25%, rgba(255,50,50,0.15) 100%); }
.sl-card-sol { background:linear-gradient(180deg, rgba(255,255,255,0) 25%, rgba(0,214,138,0.15) 100%); }
.sl-card-inner { display:flex; flex-direction:column; gap:24px; }
.sl-card-label { font-family:'Instrument Sans',sans-serif; font-weight:700; font-size:10px; color:rgba(255,255,255,.4); text-transform:uppercase; letter-spacing:1px; margin:0; }
.sl-card-title { font-family:'Instrument Sans',sans-serif; font-weight:700; font-size:32px; line-height:1.2; color:#fff; margin:0; }
.sl-card-desc { font-family:'Instrument Sans',sans-serif; font-weight:400; font-size:16px; line-height:1.44; color:rgba(255,255,255,.6); margin:0; }
.sl-card-items { font-family:'Instrument Sans',sans-serif; font-weight:600; font-size:16px; line-height:2; color:#fff; margin:0; }

/* STATS */
.sl-stats { height:640px; display:flex; align-items:center; justify-content:center; gap:96px; border-bottom:1.5px solid rgba(255,255,255,.25); }
.sl-stat { display:flex; flex-direction:column; align-items:center; gap:24px; border-radius:30px; }
.sl-stat-n { font-family:'Syne',sans-serif; font-weight:800; font-size:52px; line-height:1.28; color:#fff; text-align:center; }
.sl-stat-l { font-family:'Instrument Sans',sans-serif; font-weight:500; font-size:16px; line-height:1.28; color:rgba(255,255,255,.7); text-align:center; }

/* CTA */
.sl-cta { height:800px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:100px; padding:0 40px; }
.sl-cta-text { display:flex; flex-direction:column; align-items:center; gap:40px; width:100%; }
.sl-cta-title { font-family:'Instrument Sans',sans-serif; font-weight:700; font-size:52px; line-height:1.2; color:#fff; text-align:center; margin:0; }
.sl-cta-sub { font-family:'Instrument Sans',sans-serif; font-weight:500; font-size:20px; color:rgba(255,255,255,.7); text-align:center; margin:0; }
.sl-btn-cta { height:80px; padding:16px 48px; background:linear-gradient(180deg,#3B82F6 20%,#234C90 80%); box-shadow:0 8px 6px -4px rgba(0,0,0,.75),0 48px 48px -6px rgba(0,0,0,.75),0 20px 32px white inset,0 -5px 10px rgba(0,0,0,.5) inset,0 10px 12px white inset; border-radius:24px; border:none; font-family:'Instrument Sans',sans-serif; font-weight:600; font-size:24px; line-height:1.28; color:#fff; cursor:pointer; transition:opacity .2s,transform .1s; }
.sl-btn-cta:hover { opacity:.9; }
.sl-btn-cta:active { transform:scale(.98); }

/* FOOTER */
.sl-footer { height:800px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:120px; width:100%; position:relative; }
.sl-footer::before { content:''; position:absolute; left:50%; bottom:280px; transform:translateX(-50%); width:100%; height:160px; background:#8B5CF6; border-radius:9999px; filter:blur(240px); pointer-events:none; z-index:0; }
.sl-footer::after { content:''; position:absolute; left:50%; bottom:320px; transform:translateX(-50%); width:100%; height:100px; background:#FF3232; border-radius:9999px; filter:blur(360px); pointer-events:none; z-index:0; }
.sl-footer-glow-blue { position:absolute; left:50%; bottom:100px; transform:translateX(-50%); width:100%; height:100px; background:#3B82F6; border-radius:9999px; filter:blur(220px); pointer-events:none; z-index:0; }
.sl-wordmark { font-family:'Syne',sans-serif; font-weight:800; font-size:clamp(200px,35vw,550px); text-transform:uppercase; color:#fff; text-align:center; line-height:.85; letter-spacing:-0.04em; position:relative; z-index:1; width:100%; }
.sl-footer-bar { width:100%; padding:0 36px; display:flex; align-items:flex-end; justify-content:space-between; position:relative; z-index:1; }
.sl-footer-left { display:flex; flex-direction:column; gap:60px; }
.sl-footer-sq { width:100px; height:100px; background:#3B82F6; flex-shrink:0; }
.sl-footer-copy { font-family:'Instrument Sans',sans-serif; font-weight:400; font-size:16px; color:rgba(255,255,255,.5); }
.sl-footer-links { display:flex; gap:48px; opacity:.7; }
.sl-footer-col { display:flex; flex-direction:column; gap:48px; padding:10px; }
.sl-footer-link { font-family:'Instrument Sans',sans-serif; font-weight:500; font-size:20px; text-transform:uppercase; color:#fff; text-decoration:none; transition:opacity .2s; }
.sl-footer-link:hover { opacity:.6; }

/* RESPONSIVE */
@media (max-width:900px) {
  .sl-nav { padding:0 24px; height:70px; }
  .sl-pills { display:none; }
  .sl-logo { font-size:28px; }
  .sl-page { padding:16px; gap:48px; }
  .sl-hero { border-radius:20px; padding-bottom:80px; }
  .sl-hero-title { font-size:clamp(48px,12vw,96px); }
  .sl-eyebrow { font-size:12px; letter-spacing:8px; }
  .sl-hero-sub { font-size:16px; }
  .sl-feature-row { flex-direction:column; gap:48px; max-width:100%; }
  .sl-feature-text { width:100%; }
  .sl-mockup { width:100%; height:320px; }
  .sl-features::before { display:none; }
  .sl-apart-cards { flex-direction:column; }
  .sl-stats { flex-wrap:wrap; height:auto; padding:80px 24px; gap:48px; }
  .sl-cta-title { font-size:36px; }
  .sl-wordmark { font-size:clamp(80px,25vw,300px); }
  .sl-footer-bar { flex-direction:column; gap:48px; }
  .sl-footer-links { flex-wrap:wrap; gap:32px; }
}
`;

export default function LandingPage() {
  const router = useRouter();
  const { disconnect, connecting, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const [scrolled, setScrolled] = useState(false);

  const short = publicKey 
    ? publicKey.toBase58().slice(0, 4) + '..' + publicKey.toBase58().slice(-4) 
    : null;

  // Intentionally do not auto-connect on mount per user request
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  async function handleDisconnect() {
    try {
      await disconnect();
    } catch (e) {
      console.error(e);
    }
  }


  return (
    <div className="sl">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ── NAV ── */}
      <nav style={{ width: '100%', position: 'fixed', top: '10px', left: 0, right: 0, zIndex: 1000, display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '1928px', padding: '6px 15px', background: scrolled ? 'linear-gradient(180deg, rgba(153, 153, 153, 0.13) 50%, rgba(255, 255, 255, 0.05) 100%)' : 'transparent', overflow: 'visible', borderRadius: '10px', outline: scrolled ? '1.50px solid rgba(255, 255, 255, 0.10)' : '1.50px solid transparent', outlineOffset: '-1.50px', justifyContent: 'space-between', alignItems: 'center', display: 'flex', margin: '0 20px', backdropFilter: scrolled ? 'blur(12px)' : 'none', WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none', transition: 'all 0.3s ease' }}>
          
          {/* LOGO */}
          <a href="/" style={{ textDecoration: 'none', textAlign: 'center' }}>
            <span style={{ color: 'white', fontSize: '32px', fontFamily: 'var(--font-display-primary), sans-serif', fontWeight: 800, letterSpacing: '-2px', wordWrap: 'break-word' }}>SLIP </span>
            <span style={{ color: '#3B82F6', fontSize: '32px', fontFamily: 'var(--font-display-primary), sans-serif', fontWeight: 800, wordWrap: 'break-word' }}>•</span>
          </a>
          
          {/* MIDDLE LINKS & RIGHT SECTION CONTAINER */}
          <div style={{ justifyContent: 'flex-start', alignItems: 'center', gap: '12px', display: 'flex' }}>
            
            {/* MENU LINKS */}
            <div style={{ justifyContent: 'flex-start', alignItems: 'center', gap: '4px', display: 'flex' }}>
              <Link href="/verdict" style={{ textDecoration: 'none', padding: '12px 18px', background: 'linear-gradient(180deg, rgba(68, 68, 68, 0.40) 25%, rgba(68, 68, 68, 0.40) 100%)', borderRadius: '12px', justifyContent: 'center', alignItems: 'center', gap: '20px', display: 'flex', transition: 'opacity 0.2s' }} className="sl-pills-link">
                <div style={{ textAlign: 'center', color: 'white', fontSize: '12px', fontFamily: '"Instrument Sans", sans-serif', fontWeight: 600, wordWrap: 'break-word' }}>VERDICT</div>
              </Link>
              <Link href="/mirror" style={{ textDecoration: 'none', padding: '12px 18px', background: 'linear-gradient(180deg, rgba(68, 68, 68, 0.40) 25%, rgba(68, 68, 68, 0.40) 100%)', borderRadius: '12px', justifyContent: 'center', alignItems: 'center', gap: '20px', display: 'flex', transition: 'opacity 0.2s' }} className="sl-pills-link">
                <div style={{ textAlign: 'center', color: 'white', fontSize: '12px', fontFamily: '"Instrument Sans", sans-serif', fontWeight: 600, wordWrap: 'break-word' }}>MIRROR</div>
              </Link>
              <Link href="/payslip" style={{ textDecoration: 'none', padding: '12px 18px', background: 'linear-gradient(180deg, rgba(68, 68, 68, 0.40) 25%, rgba(68, 68, 68, 0.40) 100%)', borderRadius: '12px', justifyContent: 'center', alignItems: 'center', gap: '20px', display: 'flex', transition: 'opacity 0.2s' }} className="sl-pills-link">
                <div style={{ textAlign: 'center', color: 'white', fontSize: '12px', fontFamily: '"Instrument Sans", sans-serif', fontWeight: 600, wordWrap: 'break-word' }}>PAYSLIP</div>
              </Link>
            </div>
            
            {/* RIGHT ACTION BUTTONS */}
            <div style={{ justifyContent: 'flex-end', alignItems: 'center', gap: '12px', display: 'flex' }}>
              {short ? (
                <button 
                  onClick={handleDisconnect}
                  title="Disconnect wallet"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '15px 32px', background: 'rgba(255,255,255,0.05)', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', fontFamily: '"Space Mono", monospace', fontSize: '14px', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,50,50,0.1)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                  <div style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%' }} />
                  {short} <span style={{fontSize: '12px', opacity: 0.6, marginLeft: '4px'}}>✕</span>
                </button>
              ) : (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setVisible(true)}
                  disabled={connecting}
                  style={{
                    padding: '15px 32px',
                    background: connecting ? 'rgba(59,130,246,0.6)' : 'linear-gradient(180deg, #3B82F6 20%, #234C90 80%)',
                    boxShadow: '0px 10px 6px -6px rgba(0, 0, 0, 0.50), 0px 12px 32px white inset, 0px -5px 10px rgba(0, 0, 0, 0.50) inset, 0px 6px 12px white inset',
                    borderRadius: '18px',
                    color: 'white',
                    fontSize: '14px',
                    fontFamily: '"Instrument Sans", sans-serif',
                    fontWeight: 600,
                    lineHeight: '20.48px',
                    border: 'none',
                    cursor: connecting ? 'wait' : 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  {connecting ? 'Connecting...' : 'Connect Wallet'}
                </button>
              </div>
              )}
              <div style={{ padding: '9px 20px', background: 'rgba(255, 255, 255, 0.10)', borderRadius: '999px', outline: '1.50px solid rgba(255, 255, 255, 0.15)', outlineOffset: '-1.50px', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', justifyContent: 'center', alignItems: 'center', gap: '10px', display: 'flex' }}>
                <div style={{ opacity: 0.40, textAlign: 'center', color: 'white', fontSize: '12px', fontFamily: '"Instrument Sans", sans-serif', fontWeight: 600, textTransform: 'uppercase', wordWrap: 'break-word' }}>
                  solana
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </nav>

      {/* ── PAGE WRAPPER ── */}
      <div className="sl-page">

        {/* HERO */}
        <div className="sl-hero-wrap">
          <section className="sl-hero">
            <div className="sl-hero-bg" />
            <div className="sl-hero-overlay" />
            <div className="sl-hero-body">
              <p className="sl-eyebrow">Onchain Trade Intelligence</p>
              
              <div className="sl-hero-main-group">
                <h1 className="sl-hero-title">Your trades.<br />Unfiltered.</h1>
                <p className="sl-hero-sub">
                  Connect your wallet. SLIP reads your last trades, scores your performance,<br />
                  shows you who won your money and why.
                </p>
              </div>

              <div className="sl-hero-action">
                <button className="sl-btn-start" onClick={() => router.push('/payslip')}>
                  Get Started
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* HOW IT WORKS */}
        <section className="sl-how">
          <div className="sl-pill-label">How it works</div>
          <h2 className="sl-how-title">
            Trading Platform that shows you Before, During, After Trade Analyses
          </h2>
        </section>

        {/* FEATURE ROWS — scroll-pinned */}
        <ScrollFeatures />

        {/* WHAT SETS SLIP APART */}
        <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 0 80px' }}>
          <div className="sl-apart">

            <div className="sl-apart-img-wrap">
              <div className="sl-apart-img" />
            </div>

            <div className="sl-apart-hdr">
              <h2 className="sl-apart-title">What sets SLIP apart</h2>
              <p className="sl-apart-sub">
                Not a scanner. Not a leaderboard. A complete diagnosis of where your edge went and who actually has it.
              </p>
            </div>

            <div className="sl-apart-cards">
              <div className="sl-card sl-card-prob">
                <div className="sl-card-inner">
                  <div className="sl-card-label">THE PROBLEM</div>
                  <div className="sl-card-title">You lose. Then what?</div>
                  <div className="sl-card-desc">
                    You check Solscan. You see your transaction. You see the price. You see your loss.
                    That&apos;s it. No one tells you why. No one shows you the winners. No one explains the pattern.
                  </div>
                </div>
                <div className="sl-card-items">
                  ◉ Losing feels random<br />
                  ◉ No context on who won<br />
                  ◉ No pattern recognition
                </div>
              </div>

              <div className="sl-card sl-card-sol">
                <div className="sl-card-inner">
                  <div className="sl-card-label">THE SLIP DIFFERENCE</div>
                  <div className="sl-card-title">Loss with understanding</div>
                  <div className="sl-card-desc">
                    SLIP shows you the exact wallet that took your money, how much they made, why they won,
                    and what they did different. Then it finds the pattern across your losses and quantifies the cost.
                  </div>
                </div>
                <div className="sl-card-items">
                  ◈ Loss diagnosis instead of confusion<br />
                  ◈ Winner leaderboard on every token<br />
                  ◈ Recurring mistake quantified
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* STATS */}
        <section className="sl-stats">
          <div className="sl-stat"><div className="sl-stat-n">24.1K</div><div className="sl-stat-l">Wallets Analyzed</div></div>
          <div className="sl-stat"><div className="sl-stat-n">218K</div><div className="sl-stat-l">Trades Autopsied</div></div>
          <div className="sl-stat"><div className="sl-stat-n">141K</div><div className="sl-stat-l">SOL Left on Table</div></div>
          <div className="sl-stat"><div className="sl-stat-n">9.4K</div><div className="sl-stat-l">Tokens Scanned</div></div>
        </section>

        {/* CTA */}
        <section className="sl-cta">
          <div className="sl-cta-text">
            <h2 className="sl-cta-title">
              See your Trades from a different angle.<br />Understand who won and why.
            </h2>
            <p className="sl-cta-sub">Stop guessing why you lost.</p>
          </div>
          <button className="sl-btn-cta" onClick={() => router.push('/payslip')}>
            Start Analyzing
          </button>
        </section>

        {/* FOOTER */}
        <section className="sl-footer">
          <div className="sl-footer-glow-blue" />
          <div className="sl-wordmark">SLIP</div>
          <div className="sl-footer-bar">
            <div className="sl-footer-left">
              <div className="sl-footer-sq" />
              <div className="sl-footer-copy">©2026 SLIP is built for solana traders.</div>
            </div>
            <div className="sl-footer-links">
              <div className="sl-footer-col">
                <Link href="/verdict" className="sl-footer-link">Verdict</Link>
                <Link href="/mirror" className="sl-footer-link">Mirror</Link>
                <Link href="/payslip" className="sl-footer-link">Payslip</Link>
              </div>
              <div className="sl-footer-col">
                <a href="#" className="sl-footer-link">Twitter</a>
                <a href="#" className="sl-footer-link">Telegram</a>
                <a href="#" className="sl-footer-link">Discord</a>
              </div>
              <div className="sl-footer-col">
                <a href="#" className="sl-footer-link">Docs</a>
                <a href="#" className="sl-footer-link">About us</a>
                <a href="#" className="sl-footer-link">Contact</a>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}


/* SLIP v2 Official Release */
