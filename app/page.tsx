import Link from 'next/link';
import Nav from '@/components/Nav';

export default function LandingPage() {
  return (
    <>
      <Nav />

      <main className="slip-landing">
        <p className="land-tag">Onchain Trade Intelligence</p>

        <h1 className="land-title">SLIP</h1>

        <p className="land-sub">
          Don&apos;t get in wrong.<br />
          Know who&apos;s winning while you&apos;re in.<br />
          Know what it cost you after.
        </p>

        {/* ── FEATURE GRID ── */}
        <div className="feature-grid">

          <Link href="/verdict" className="feat-card card-verdict">
            <span className="feat-arrow">→</span>
            <div className="feat-num">01 · VERDICT</div>
            <div className="feat-name">Before<br />the trade</div>
            <div className="feat-desc">
              Full token safety and market structure scan. Mint authority, LP lock,
              transfer hooks, deployer history, holder concentration, timing position.
              One score. One verdict.
            </div>
            <span className="feat-when">Pre-Trade</span>
          </Link>

          <Link href="/mirror" className="feat-card card-mirror">
            <span className="feat-arrow">→</span>
            <div className="feat-num">02 · MIRROR</div>
            <div className="feat-name">During<br />the trade</div>
            <div className="feat-desc">
              Every wallet winning on your token right now, ranked by SOL gained.
              See who entered earlier, with more size, and why they&apos;re up while
              you&apos;re not. The gap, explained.
            </div>
            <span className="feat-when">Live Position</span>
          </Link>

          <Link href="/payslip" className="feat-card card-payslip">
            <span className="feat-arrow">→</span>
            <div className="feat-num">03 · PAYSLIP</div>
            <div className="feat-name">After<br />the trade</div>
            <div className="feat-desc">
              Your full trade autopsy. Entry percentile, peak missed, SOL left on table.
              Who won the most on each token. Your recurring mistakes. Your trading
              grade, broken down.
            </div>
            <span className="feat-when">Post-Trade</span>
          </Link>

        </div>

        {/* ── STATS ── */}
        <div className="land-stats">
          <div className="land-stat">
            <div className="land-stat-n">24.1K</div>
            <div className="land-stat-l">Wallets Analyzed</div>
          </div>
          <div className="land-stat">
            <div className="land-stat-n">218K</div>
            <div className="land-stat-l">Trades Autopsied</div>
          </div>
          <div className="land-stat">
            <div className="land-stat-n">141K</div>
            <div className="land-stat-l">SOL Left on Table</div>
          </div>
          <div className="land-stat">
            <div className="land-stat-n">9.4K</div>
            <div className="land-stat-l">Tokens Scanned</div>
          </div>
        </div>
      </main>
    </>
  );
}
