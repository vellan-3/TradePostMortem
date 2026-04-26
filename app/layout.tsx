import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TradePostmortem — Solana Trade Autopsy Tool',
  description:
    'Paste your Solana wallet address. We reconstruct every bad swap — the entry percentile, the peak you missed, and the exact SOL you left on the table.',
  keywords: ['Solana', 'trading', 'DeFi', 'swap analysis', 'meme coins', 'Jupiter', 'crypto'],
  openGraph: {
    title: 'TradePostmortem — Solana Trade Autopsy',
    description: 'You lost the trade. We show you exactly why, when, and how much it cost you.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TradePostmortem',
    description: 'Solana trade autopsy tool. Find out exactly what went wrong.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="grid-bg" />
        {children}
      </body>
    </html>
  );
}
