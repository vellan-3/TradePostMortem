import { Suspense } from 'react';
import Link from 'next/link';
import ResultsView from '@/components/ResultsView';
import LoadingScreen from '@/components/LoadingScreen';
import { TradeAnalysis, WalletSummary } from '@/types';

interface PageProps {
  params: { wallet: string };
}

async function fetchAnalysis(wallet: string): Promise<{
  analyses: TradeAnalysis[];
  summary: WalletSummary;
  error?: string;
  message?: string;
}> {
  try {
    // Use absolute URL for server-side fetch in App Router
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    const res = await fetch(`${baseUrl}/api/analyze?wallet=${wallet}`, {
      cache: 'no-store', // always fresh — trades change
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        analyses: [],
        summary: emptySummary(wallet),
        error: data.error || `Request failed (${res.status})`,
      };
    }

    return await res.json();
  } catch (e) {
    return {
      analyses: [],
      summary: emptySummary(wallet),
      error: e instanceof Error ? e.message : 'Network error',
    };
  }
}

function emptySummary(wallet: string): WalletSummary {
  return {
    wallet,
    tradesAnalyzed: 0,
    totalPnlSOL: 0,
    totalLeftOnTable: 0,
    worstTradePnl: 0,
    avgDamageScore: 0,
    overallGrade: 'C',
    avgEntryPercentile: null,
  };
}

async function AnalysisContent({ wallet }: { wallet: string }) {
  const data = await fetchAnalysis(wallet);

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

      <main
        style={{
          padding: '80px 24px 100px',
          maxWidth: 900,
          margin: '0 auto',
        }}
      >
        {data.error && (
          <div className="error-block">
            ⚠ {data.error}
            {data.error.includes('fetch') || data.error.includes('network') ? (
              <> — check your API keys in <code>.env.local</code></>
            ) : null}
          </div>
        )}

        {data.message && !data.error && (
          <div
            style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              padding: '16px 20px',
              color: 'var(--muted)',
              marginBottom: 24,
              fontSize: 13,
            }}
          >
            {data.message}
          </div>
        )}

        <ResultsView
          wallet={wallet}
          analyses={data.analyses}
          summary={data.summary}
        />
      </main>
    </>
  );
}

export default function AnalyzePage({ params }: PageProps) {
  const { wallet } = params;

  return (
    <Suspense fallback={<LoadingScreen wallet={wallet} />}>
      <AnalysisContent wallet={wallet} />
    </Suspense>
  );
}

export function generateMetadata({ params }: PageProps) {
  const short = `${params.wallet.slice(0, 6)}...${params.wallet.slice(-4)}`;
  return {
    title: `Trade Autopsy — ${short} | TradePostmortem`,
    description: `See the worst trades and damage scores for Solana wallet ${short}.`,
  };
}
