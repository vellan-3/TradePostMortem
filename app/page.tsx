import Link from 'next/link';
import WalletInput from '@/components/WalletInput';

export default function LandingPage() {
  return (
    <>
      {/* ── NAV ── */}
      <nav className="nav">
        <Link href="/" className="nav-logo">
          <div className="nav-logo-dot" />
          TradePostmortem
        </Link>
        <div className="nav-right">
          <span className="nav-badge">SOLANA</span>
          <span>Beta</span>
        </div>
      </nav>

      {/* ── HERO ── */}
      <main
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '80px 24px 60px',
          position: 'relative',
        }}
      >
        <p className="hero-eyebrow">Solana Trade Autopsy Tool</p>

        <h1 className="hero-title">
          You <span className="strike">lost</span>
          <br />
          the trade.
        </h1>

        <p className="hero-sub">
          Paste your wallet. We reconstruct every bad swap — the entry percentile,
          the peak you missed, and the exact SOL you left on the table.
        </p>

        {/* ── WALLET INPUT ── */}
        <WalletInput />

        {/* ── STATS ── */}
        <div className="stats-row">
          <div className="stat-cell">
            <div className="stat-num">18.4K</div>
            <div className="stat-label">Wallets Autopsied</div>
          </div>
          <div className="stat-cell">
            <div className="stat-num">142K</div>
            <div className="stat-label">Trades Analyzed</div>
          </div>
          <div className="stat-cell">
            <div className="stat-num">94K</div>
            <div className="stat-label">SOL Left on Table</div>
          </div>
        </div>

        {/* ── HOW IT WORKS ── */}
        <div className="how-row">
          <div className="how-card">
            <div className="how-num">01</div>
            <div className="how-title">Fetch Swaps</div>
            <div className="how-text">
              We pull your last 100 swap transactions via Helius Enhanced API — no wallet connection needed.
            </div>
          </div>
          <div className="how-card">
            <div className="how-num">02</div>
            <div className="how-title">Price at Time</div>
            <div className="how-text">
              Birdeye Historical Price API prices every entry and exit at the exact block timestamp.
            </div>
          </div>
          <div className="how-card">
            <div className="how-num">03</div>
            <div className="how-title">Diagnose</div>
            <div className="how-text">
              We detect Bought The Top, Paper Hands, Diamond Hands Rekt, and more — ranked by damage score.
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
