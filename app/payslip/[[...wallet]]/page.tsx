'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import Nav from '@/components/Nav';
import type { LabeledValue, PayslipTradeCard, PayslipViewModel } from '@/types';
import { buildSolscanTxLink } from '@/lib/utils';
import ShareModal from '@/components/ShareModal';
import VerdictPanel from '@/components/VerdictPanel';
import MirrorPanel from '@/components/MirrorPanel';
import { playSubmit, playLossTrade } from '@/lib/sound';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp, EASE_OUT_EXPO } from '@/lib/motion';

const DIAGNOSIS_PILL: Record<string, string> = {
  'Bought the Top': 'pill-red',
  'Sold the Bottom': 'pill-orange',
  'Paper Hands': 'pill-yellow',
  'Diamond Hands Rekt': 'pill-red',
  'Good Trade': 'pill-green',
  Unknown: 'pill-yellow',
};

export default function PayslipPage({ params }: { params: { wallet?: string[] } }) {
  const initialWallet = params.wallet?.[0] || '';
  const [wallet, setWallet] = useState(initialWallet);
  const { publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [data, setData] = useState<PayslipViewModel | null>(null);
  const bootstrapped = useRef(false);

  const generate = useCallback(async (nextWallet = wallet) => {
    const addr = nextWallet.trim();
    if (!addr) return;
    playSubmit();
    setLoading(true);
    setError(null);
    setMessage(null);
    setData(null);
    try {
      const res = await fetch(`/api/analyze?wallet=${encodeURIComponent(addr)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Analysis failed');
      if (json.message) setMessage(json.message);
      setData(json as PayslipViewModel);
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

  async function connectWalletAdapter() {
    setVisible(true);
  }

  async function analyzeConnectedWallet() {
    if (publicKey) {
      const addr = publicKey.toBase58();
      playSubmit();
      setWallet(addr);
      void generate(addr);
    }
  }

  return (
    <>
      <Nav />
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '140px 40px 120px' }}>
        <div style={{ marginBottom: '64px' }}>
          <div style={{ fontFamily: '"Space Mono", monospace', fontSize: '12px', color: '#3B82F6', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px' }}>03 · Payslip</div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '64px', fontWeight: 800, letterSpacing: '-2px', marginBottom: '16px' }}>Your Trade Autopsy</h1>
          <p style={{ fontSize: '20px', color: 'rgba(255,255,255,0.6)', maxWidth: '600px', lineHeight: 1.5 }}>What it cost you, who won it, and the pattern that keeps repeating.</p>
        </div>

        <div style={{ marginBottom: '64px' }}>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '24px', padding: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <input
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'white', padding: '16px 24px', fontSize: '18px', fontFamily: '"Instrument Sans", sans-serif' }}
              placeholder="Analyze wallet address..."
              value={wallet}
              spellCheck={false}
              autoComplete="off"
              disabled={loading}
              onChange={event => setWallet(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter') void generate();
              }}
            />
            <button 
              style={{ padding: '16px 32px', background: '#3B82F6', borderRadius: '16px', color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer', opacity: (loading || !wallet.trim()) ? 0.6 : 1 }}
              disabled={loading || !wallet.trim()} 
              onClick={() => void generate()}
            >
              {loading ? 'Analyzing...' : 'Generate Payslip →'}
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {publicKey && (
              <button onClick={analyzeConnectedWallet} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '12px', padding: '10px 16px', color: '#3B82F6', fontFamily: '"Instrument Sans", sans-serif', fontSize: '14px', cursor: 'pointer', transition: 'background 0.2s' }}>
                <span>🔗</span>
                <span>Analyze Connected Wallet</span>
                <span style={{ color: 'rgba(59,130,246,0.4)', marginLeft: '4px' }}>→</span>
              </button>
            )}
            <button onClick={connectWalletAdapter} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px 16px', color: 'white', fontFamily: '"Instrument Sans", sans-serif', fontSize: '14px', cursor: 'pointer', transition: 'background 0.2s' }}>
              <span>🔌</span>
              <span>Connect Wallet Provider</span>
              <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: '4px' }}>→</span>
            </button>
          </div>
        </div>

        {error && <div className="error-block" style={{ marginBottom: 24 }}>✕ {error}</div>}
        {message && !error && <div className="mirror-cta-card" style={{ marginBottom: 24 }}><div className="mirror-cta-text">{message}</div></div>}
        {loading && (
          <div className="v-loading">
            <div className="v-loading-ring" style={{ borderTopColor: 'var(--slip-purple)' }} />
            <p className="v-loading-text">Analyzing trades, computing grades, matching winners...</p>
          </div>
        )}
        {data && <PayslipResults data={data} />}
        {!data && !loading && !error && (
          <div className="v-empty">
            <div style={{ fontSize: 13, color: 'var(--slip-muted)', textAlign: 'center', lineHeight: 1.8, maxWidth: 420 }}>
              Paste any Solana wallet to run a trade autopsy with your grades, repeated mistake banner, and winner-vs-you comparisons on the tokens you traded.
            </div>
          </div>
        )}
      </section>
    </>
  );
}

function PayslipResults({ data }: { data: PayslipViewModel }) {
  const [openCard, setOpenCard] = useState<string | null>(data.trades[0]?.id ?? null);
  const [verdictMint, setVerdictMint] = useState<string | null>(null);
  const [mirrorMint,  setMirrorMint]  = useState<string | null>(null);
  const [panelSymbol, setPanelSymbol] = useState('');

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
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2px', background: 'rgba(255,255,255,0.1)', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '2px' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <div style={{ 
            fontSize: '120px', fontFamily: 'Syne, sans-serif', fontWeight: 800, letterSpacing: '-6px', lineHeight: 1,
            color: data.grades.overall.grade.startsWith('A') ? '#10b981' : data.grades.overall.grade.startsWith('B') ? '#3b82f6' : data.grades.overall.grade.startsWith('C') ? '#f59e0b' : '#ff3b3b'
          }}>{data.grades.overall.grade}</div>
          <div style={{ fontFamily: '"Space Mono", monospace', fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginTop: '8px' }}>{data.grades.overall.score} / 100 SCORE</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2px' }}>
          <GradeCell label="Entry Discipline" grade={data.grades.entryDiscipline.grade} score={data.grades.entryDiscipline.score} />
          <GradeCell label="Exit Discipline" grade={data.grades.exitDiscipline.grade} score={data.grades.exitDiscipline.score} />
          <GradeCell label="Size Management" grade={data.grades.sizeManagement.grade} score={data.grades.sizeManagement.score} />
          <GradeCell label="Token Selection" grade={data.grades.tokenSelection.grade} score={data.grades.tokenSelection.score} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2px', background: 'rgba(255,255,255,0.1)', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '48px' }}>
        <SummaryCell label="Total P&L" value={`${data.summary.totalPnlSol >= 0 ? '+' : ''}${data.summary.totalPnlSol.toFixed(1)} SOL`} sub={`Across ${data.summary.tradesAnalyzed} trades`} tone={data.summary.totalPnlSol >= 0 ? 'pass' : 'critical'} />
        <SummaryCell label="Left on Table" value={`+${data.summary.totalLeftOnTable.toFixed(1)} SOL`} sub="Peak vs actual exits" tone="warning" />
        <SummaryCell label="Worst Trade" value={`${data.summary.worstTradePnl.toFixed(1)} SOL`} sub="Selected trades" tone="critical" />
        <SummaryCell label="Avg Entry Percentile" value={`${data.summary.avgEntryPercentile || 'N/A'}${data.summary.avgEntryPercentile ? 'th' : ''}`} sub="Higher = worse timing" />
      </div>

      {data.banner && (
        <div className="pattern-banner">
          <div className="pb-icon">⚠</div>
          <div>
            <div className="pb-title">{data.banner.title}</div>
            <div className="pb-text">{data.banner.body}</div>
          </div>
        </div>
      )}

      <div className="section-label">Trade Breakdown</div>

      <div className="sort-row">
        <button className="sort-btn active">Worst First</button>
        <button className="sort-btn">Recent</button>
        <button className="sort-btn">Biggest Size</button>
      </div>

      <motion.div
        className="trades-list"
        initial="hidden"
        animate="visible"
      >
        {data.trades.map((trade, index) => (
          <motion.div
            key={trade.id}
            variants={fadeUp}
            custom={index}
          >
            <TradeCard
              trade={trade}
              rank={index + 1}
              isOpen={openCard === trade.id}
              onToggle={() => setOpenCard(openCard === trade.id ? null : trade.id)}
              onVerdictClick={openVerdict}
              onMirrorClick={openMirror}
            />
          </motion.div>
        ))}
      </motion.div>

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
    </>
  );
}

function GradeCell({ label, grade, score }: { label: string; grade: string; score: number }) {
  const color = 
    grade.startsWith('A') ? '#10b981' :
    grade.startsWith('B') ? '#3b82f6' :
    grade.startsWith('C') ? '#f59e0b' :
    '#ff3b3b';

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ fontSize: '10px', fontFamily: '"Space Mono", monospace', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '32px', fontFamily: 'Syne, sans-serif', fontWeight: 800, color }}>{grade}</div>
      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>{score} / 100</div>
    </div>
  );
}

function SummaryCell({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: 'pass' | 'warning' | 'critical' }) {
  const color = tone === 'pass' ? '#10b981' : tone === 'warning' ? '#f59e0b' : tone === 'critical' ? '#ff3b3b' : 'white';
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '24px' }}>
      <div style={{ fontSize: '10px', fontFamily: '"Space Mono", monospace', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '12px' }}>{label}</div>
      <div style={{ fontSize: '24px', fontFamily: 'Syne, sans-serif', fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>{sub}</div>
    </div>
  );
}

function TradeCard({
  trade,
  rank,
  isOpen,
  onToggle,
  onVerdictClick,
  onMirrorClick,
}: {
  trade: PayslipTradeCard;
  rank: number;
  isOpen: boolean;
  onToggle: () => void;
  onVerdictClick: (symbol: string, mint: string) => void;
  onMirrorClick: (symbol: string, mint: string) => void;
}) {
  const [showShare, setShowShare] = useState(false);
  const color = trade.pnlSol >= 0 ? '#10b981' : '#ff3b3b';
  const LOSS_DIAGNOSES = ['BOUGHT_THE_TOP', 'DIAMOND_HANDS_REKT', 'SOLD_THE_BOTTOM', 'PAPER_HANDS'];

  return (
    <div style={{ 
      background: isOpen ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.03)', 
      borderRadius: '24px', 
      border: '1px solid rgba(255,255,255,0.1)', 
      marginBottom: '8px', 
      overflow: 'hidden',
      transition: 'all 0.2s ease'
    }}>
      <div 
        style={{ padding: '24px 32px', display: 'grid', gridTemplateColumns: '60px 1fr 200px 150px', alignItems: 'center', gap: '24px', cursor: 'pointer' }}
        onClick={() => {
          const opening = !isOpen;
          onToggle();
          if (opening && LOSS_DIAGNOSES.includes(trade.diagnosis)) {
            playLossTrade();
          }
        }}
      >
        <div style={{ fontSize: '24px', fontFamily: 'Syne, sans-serif', fontWeight: 800, color: rank <= 3 ? (rank === 1 ? '#ff3b3b' : rank === 2 ? '#3b82f6' : '#f59e0b') : 'rgba(255,255,255,0.2)' }}>
          {rank}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <span style={{ fontSize: '20px', fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>${trade.tokenSymbol}</span>
            <span style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>{trade.diagnosisLabel}</span>
          </div>
          <div style={{ fontSize: '12px', fontFamily: '"Space Mono", monospace', color: 'rgba(255,255,255,0.4)' }}>{trade.entryDisplay}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '16px', fontWeight: 700, color: trade.topWinner ? '#10b981' : 'rgba(255,255,255,0.2)' }}>
            {trade.topWinner ? `+${trade.topWinner.totalPnlSol.toFixed(1)} SOL` : '—'}
          </div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>TOP WINNER</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '20px', fontFamily: 'Syne, sans-serif', fontWeight: 800, color }}>
            {trade.pnlSol >= 0 ? '+' : ''}{trade.pnlSol.toFixed(1)} SOL
          </div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{trade.pnlLabel}</div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height:  { duration: 0.32, ease: EASE_OUT_EXPO },
              opacity: { duration: 0.2, delay: isOpen ? 0.08 : 0 },
            }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 32px 32px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '32px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', marginBottom: '32px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontFamily: '"Space Mono", monospace', color: '#3B82F6', marginBottom: '20px' }}>◉ YOUR TRADE</div>
                  {trade.yourTrade.map(stat => <TradeStat key={stat.label} stat={stat} />)}
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontFamily: '"Space Mono", monospace', color: '#10b981', marginBottom: '20px' }}>◈ TOP WINNER · {trade.topWinner?.label ?? 'Unavailable'}</div>
                  {trade.topWinner ? (
                    <>
                      <TradeStat stat={{ label: 'Entry Market Cap', value: trade.topWinner.entryMarketCap ? `$${(trade.topWinner.entryMarketCap >= 1000 ? Math.round(trade.topWinner.entryMarketCap/1000) + 'k' : trade.topWinner.entryMarketCap)}` : 'Unavailable', tone: 'pass' }} />
                      <TradeStat stat={{ label: 'Entry Timing', value: trade.topWinner.entryTimingLabel, tone: trade.diagnosis === 'BOUGHT_THE_TOP' ? 'pass' : undefined }} />
                      <TradeStat stat={{ label: 'Exit Timing', value: trade.topWinner.exitTimingLabel }} />
                      <TradeStat stat={{ label: 'Total P&L', value: trade.topWinner.totalPnlSol >= 0 ? `+${trade.topWinner.totalPnlSol.toFixed(1)} SOL` : `${trade.topWinner.totalPnlSol.toFixed(1)} SOL`, tone: trade.topWinner.totalPnlSol >= 0 ? 'pass' : 'critical' }} />
                    </>
                  ) : (
                    <TradeStat stat={{ label: 'Winner data', value: 'Unavailable' }} />
                  )}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px', marginBottom: '32px', borderLeft: `4px solid ${color}` }}>
                <div style={{ fontSize: '14px', lineHeight: 1.6 }}>
                  <b style={{ color }}>Why they won and you didn&apos;t:</b> {trade.narrative}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => onVerdictClick(trade.tokenSymbol, trade.tokenMint)}
                  style={{ flex: 1, padding: '14px', background: 'rgba(255,59,59,0.1)', border: '1px solid rgba(255,59,59,0.2)', borderRadius: '12px', color: '#ff3b3b', fontWeight: 700, cursor: 'pointer' }}
                >
                  ⚖ Verdict on ${trade.tokenSymbol}
                </button>
                <button 
                  onClick={() => onMirrorClick(trade.tokenSymbol, trade.tokenMint)}
                  style={{ flex: 1, padding: '14px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '12px', color: '#3b82f6', fontWeight: 700, cursor: 'pointer' }}
                >
                  🪞 Full Mirror →
                </button>
                <button 
                  onClick={() => setShowShare(true)}
                  style={{ padding: '14px 24px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontWeight: 600, cursor: 'pointer' }}
                >
                  Share Payslip
                </button>
              </div>
              {showShare && <ShareModal trade={trade} onClose={() => setShowShare(false)} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


function TradeStat({ stat }: { stat: LabeledValue }) {
  const toneColor = stat.tone === 'pass' ? 'var(--slip-green)' : stat.tone === 'warning' ? 'var(--slip-orange)' : stat.tone === 'critical' ? 'var(--slip-red)' : '#eeeef5';
  return (
    <div className="detail-row">
      <span className="dr-key">{stat.label}</span>
      <span className="dr-val" style={{ color: toneColor }}>
        {stat.value}
        {stat.confidence && stat.confidence !== 'live' && <span className={`dr-tag ${stat.confidence === 'estimated' ? 'tag-estimated' : 'tag-unavailable'}`}>{stat.confidence === 'estimated' ? 'Estimated' : stat.confidence === 'simulated' ? 'Simulated' : 'Unavailable'}</span>}
      </span>
    </div>
  );
}

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return `${Math.round(value)}`;
}
