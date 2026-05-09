'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

import type { PayslipViewModel } from '@/types';
import VerdictPanel from '@/components/VerdictPanel';
import MirrorPanel from '@/components/MirrorPanel';
import { playSubmit } from '@/lib/sound';
import ResultsView from '@/components/ResultsView';
import { cleanSolanaAddress } from '@/lib/address';

export default function PayslipPage({ params }: { params: { wallet?: string[] } }) {
  const initialWallet = params.wallet?.[0] || '';
  const [wallet, setWallet] = useState(initialWallet);
  const { publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [data, setData] = useState<PayslipViewModel | null>(null);
  const [openCard, setOpenCard] = useState<string | null>(null);
  const [verdictMint, setVerdictMint] = useState<string | null>(null);
  const [mirrorMint, setMirrorMint] = useState<string | null>(null);
  const [panelSymbol, setPanelSymbol] = useState('');
  const bootstrapped = useRef(false);

  const generate = useCallback(async (nextWallet = wallet) => {
    const addr = cleanSolanaAddress(nextWallet);
    if (!addr) return;
    playSubmit();
    setLoading(true);
    setError(null);
    setMessage(null);
    setData(null);
    try {
      const res = await fetch(`/api/analyze?wallet=${encodeURIComponent(addr)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail ?? json.error ?? 'Analysis failed');
      if (json.message) setMessage(json.message);
      setData(json as PayslipViewModel);
      setOpenCard(json.trades?.[0]?.id ?? null);
      window.history.replaceState(null, '', `/payslip/${addr}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    const nextWallet = initialWallet.trim();
    if (!nextWallet) return;
    void generate(nextWallet);
  }, [generate, initialWallet]);

  function openVerdict(symbol: string, mint: string) {
    setMirrorMint(null);
    setPanelSymbol(symbol);
    setVerdictMint(mint);
  }

  function openMirror(symbol: string, mint: string) {
    setVerdictMint(null);
    setPanelSymbol(symbol);
    setMirrorMint(mint);
  }

  return (
    <div className="page-canvas canvas-payslip">
      {/* ── Header ── */}
      <div>
        <div className="ds-eyebrow ds-eyebrow-payslip">
          <span className="ds-eyebrow-num">03</span>
          <span className="ds-eyebrow-sep" />
          <span className="ds-eyebrow-lbl-payslip">Payslip</span>
        </div>
        <h1 className="ds-page-title">Your Trade<br />Autopsy</h1>
        <p className="ds-page-sub">What it cost you, who won it, and the pattern that keeps repeating.</p>
      </div>

      {/* ── Input ── */}
      <div className="ds-input-row">
        <input
          value={wallet}
          onChange={e => setWallet(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && void generate()}
          placeholder="Analyze wallet address..."
          spellCheck={false}
          autoComplete="off"
          disabled={loading}
        />
        <button className="ds-btn-run ds-btn-payslip" onClick={() => void generate()} disabled={loading || !wallet.trim()}>
          {loading ? 'Analyzing...' : 'Generate Payslip →'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
        {publicKey && (
          <button onClick={() => { setWallet(publicKey.toBase58()); void generate(publicKey.toBase58()); }} className="ds-btn-ghost">
            🔗 Connected Wallet
          </button>
        )}
        <button onClick={() => setVisible(true)} className="ds-btn-ghost">
          🔌 Connect Provider
        </button>
      </div>

      {error && <div style={{ color: 'var(--slip-red)', fontSize: '14px', fontFamily: 'Space Mono, monospace', marginTop: 24 }}>✕ {error}</div>}
      {message && !error && <div className="ds-card" style={{ marginTop: 24, padding: '16px 20px', color: 'var(--slip-blue)' }}>{message}</div>}

      {/* ── Loading ── */}
      {loading && (
        <div className="ds-idle">
           <div className="v-loading-ring" style={{ borderTopColor: 'var(--slip-purple)', width: 40, height: 40, borderWidth: 3 }} />
          <p className="ds-idle-hint">
            Analyzing trades, computing grades, matching winners...
          </p>
        </div>
      )}

      {/* ── Idle ── */}
      {!data && !loading && (
        <div className="ds-idle">
          <p className="ds-idle-hint">
            Paste any Solana wallet to run a trade autopsy with your grades,
            repeated mistake banner, and winner-vs-you comparisons.
          </p>
        </div>
      )}

      {/* ── Result ── */}
      {data && (
        <ResultsView
          data={data}
          openCard={openCard}
          setOpenCard={setOpenCard}
          onVerdict={openVerdict}
          onMirror={openMirror}
        />
      )}

      {/* VERDICT side panel */}
      <VerdictPanel
        mint={verdictMint}
        symbol={panelSymbol}
        onClose={() => setVerdictMint(null)}
      />

      {/* MIRROR side panel */}
      <MirrorPanel
        mint={mirrorMint}
        symbol={panelSymbol}
        onClose={() => setMirrorMint(null)}
      />

      {/* Backdrop */}
      <div
        className={`panel-backdrop ${(verdictMint || mirrorMint) ? 'open' : ''}`}
        onClick={() => { setVerdictMint(null); setMirrorMint(null); }}
      />
    </div>
  );
}

/* SLIP v2 Official Release */
