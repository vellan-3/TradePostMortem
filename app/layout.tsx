import type { Metadata } from 'next';
import { DM_Mono, Instrument_Sans, Space_Grotesk, Space_Mono, Syne } from 'next/font/google';
import './globals.css';
import { WalletContextProvider } from '@/components/WalletContextProvider';

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '700', '800'],
  display: 'swap',
  variable: '--font-display-primary',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-display-secondary',
});

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-ui',
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-mono-secondary',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  display: 'swap',
  variable: '--font-mono-primary',
});

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
    <html
      lang="en"
      className={`${syne.variable} ${spaceGrotesk.variable} ${instrumentSans.variable} ${spaceMono.variable} ${dmMono.variable}`}
    >
      <body>
        <div className="grid-bg" />
        <WalletContextProvider>
          {children}
        </WalletContextProvider>
      </body>
    </html>
  );
}


/* SLIP v2 Official Release */
