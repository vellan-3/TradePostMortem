import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SLIP — Onchain Trade Intelligence',
  description:
    "Don't get in wrong. Know who's winning while you're in. Know what it cost you after. Verdict · Mirror · Payslip.",
  keywords: ['Solana', 'trading', 'DeFi', 'token safety', 'meme coins', 'SLIP', 'trade autopsy', 'Colosseum'],
  openGraph: {
    title: 'SLIP — Onchain Trade Intelligence',
    description: "Don't get in wrong. Know who's winning while you're in. Know what it cost you after.",
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SLIP — Onchain Trade Intelligence',
    description: 'Verdict · Mirror · Payslip. Full onchain trade intelligence for Solana.',
  },
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
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Mono:ital,wght@0,300;0,400;0,500;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
