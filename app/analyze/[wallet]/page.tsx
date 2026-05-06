import { redirect } from 'next/navigation';

interface PageProps {
  params: { wallet: string };
}

export default function AnalyzeWalletRedirect({ params }: PageProps) {
  redirect(`/payslip/${encodeURIComponent(params.wallet)}`);
}

export function generateMetadata({ params }: PageProps) {
  const short = `${params.wallet.slice(0, 6)}...${params.wallet.slice(-4)}`;
  return {
    title: `Payslip — ${short} | SLIP`,
    description: `Run a full SLIP Payslip autopsy for wallet ${short}.`,
  };
}
