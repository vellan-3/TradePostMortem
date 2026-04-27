'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavProps {
  active?: 'verdict' | 'mirror' | 'payslip';
}

export default function Nav({ active }: NavProps) {
  const pathname = usePathname();

  const activeVerdict = active === 'verdict' || (!active && pathname.startsWith('/verdict'));
  const activeMirror  = active === 'mirror'  || (!active && pathname.startsWith('/mirror'));
  const activePayslip = active === 'payslip' || (!active && (pathname.startsWith('/payslip') || pathname.startsWith('/analyze')));

  return (
    <nav className="slip-nav">
      <Link href="/" className="slip-nav-logo">
        <div className="slip-nav-dot" />
        SLIP
      </Link>

      <div className="slip-nav-tabs">
        <Link
          href="/verdict"
          className={`slip-nav-tab ${activeVerdict ? 'tab-active-verdict' : ''}`}
        >
          <span className="slip-tab-dot dot-red" />
          VERDICT
        </Link>
        <Link
          href="/mirror"
          className={`slip-nav-tab ${activeMirror ? 'tab-active-mirror' : ''}`}
        >
          <span className="slip-tab-dot dot-blue" />
          MIRROR
        </Link>
        <Link
          href="/payslip"
          className={`slip-nav-tab ${activePayslip ? 'tab-active-payslip' : ''}`}
        >
          <span className="slip-tab-dot dot-purple" />
          PAYSLIP
        </Link>
      </div>

      <div className="slip-nav-right">
        <span className="slip-nav-badge">SOLANA</span>
        <span className="slip-nav-version">Beta</span>
      </div>
    </nav>
  );
}
