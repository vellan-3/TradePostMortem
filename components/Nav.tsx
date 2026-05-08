'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

export default function Nav() {
  const router = useRouter();
  const { disconnect, connecting, publicKey } = useWallet();
  const { setVisible } = useWalletModal();

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Shorten for display: GMXj..yJsW
  const short = publicKey 
    ? publicKey.toBase58().slice(0, 4) + '..' + publicKey.toBase58().slice(-4) 
    : null;

  async function handleDisconnect() {
    try {
      await disconnect();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <nav style={{ 
      width: '100%', 
      position: 'fixed', 
      top: scrolled ? '0' : '10px', 
      left: 0, 
      right: 0, 
      zIndex: 1000, 
      display: 'flex', 
      justifyContent: 'center',
      transition: 'top 0.3s ease'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: scrolled ? '100%' : '1928px', 
        padding: scrolled ? '12px 32px' : '6px 15px', 
        background: scrolled ? 'rgba(0, 0, 0, 0.8)' : 'linear-gradient(180deg, rgba(153, 153, 153, 0.13) 50%, rgba(255, 255, 255, 0.05) 100%)', 
        overflow: 'visible', 
        borderRadius: scrolled ? '0' : '10px', 
        outline: scrolled ? 'none' : '1.50px solid rgba(255, 255, 255, 0.10)', 
        outlineOffset: '-1.50px', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        display: 'flex', 
        margin: scrolled ? '0' : '0 20px', 
        backdropFilter: 'blur(12px)', 
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.1)' : 'none',
        transition: 'all 0.3s ease'
      }}>
        
        <Link href="/" style={{ textDecoration: 'none', textAlign: 'center' }}>
          <span style={{ color: 'white', fontSize: '32px', fontFamily: 'var(--font-display-primary), sans-serif', fontWeight: 800, letterSpacing: '-2px', wordWrap: 'break-word' }}>SLIP </span>
          <span style={{ color: '#3B82F6', fontSize: '32px', fontFamily: 'var(--font-display-primary), sans-serif', fontWeight: 800, wordWrap: 'break-word' }}>•</span>
        </Link>
        
        {/* MIDDLE LINKS & RIGHT SECTION CONTAINER */}
        <div style={{ justifyContent: 'flex-start', alignItems: 'center', gap: '12px', display: 'flex' }}>
          
          {/* MENU LINKS */}
          <div style={{ justifyContent: 'flex-start', alignItems: 'center', gap: '4px', display: 'flex' }}>
            <Link href="/verdict" style={{ textDecoration: 'none', padding: '12px 18px', background: 'linear-gradient(180deg, rgba(68, 68, 68, 0.40) 25%, rgba(68, 68, 68, 0.40) 100%)', borderRadius: '12px', justifyContent: 'center', alignItems: 'center', gap: '20px', display: 'flex', transition: 'opacity 0.2s' }}>
              <div style={{ textAlign: 'center', color: 'white', fontSize: '12px', fontFamily: '"Instrument Sans", sans-serif', fontWeight: 600, wordWrap: 'break-word' }}>VERDICT</div>
            </Link>
            <Link href="/mirror" style={{ textDecoration: 'none', padding: '12px 18px', background: 'linear-gradient(180deg, rgba(68, 68, 68, 0.40) 25%, rgba(68, 68, 68, 0.40) 100%)', borderRadius: '12px', justifyContent: 'center', alignItems: 'center', gap: '20px', display: 'flex', transition: 'opacity 0.2s' }}>
              <div style={{ textAlign: 'center', color: 'white', fontSize: '12px', fontFamily: '"Instrument Sans", sans-serif', fontWeight: 600, wordWrap: 'break-word' }}>MIRROR</div>
            </Link>
            <Link href="/payslip" style={{ textDecoration: 'none', padding: '12px 18px', background: 'linear-gradient(180deg, rgba(68, 68, 68, 0.40) 25%, rgba(68, 68, 68, 0.40) 100%)', borderRadius: '12px', justifyContent: 'center', alignItems: 'center', gap: '20px', display: 'flex', transition: 'opacity 0.2s' }}>
              <div style={{ textAlign: 'center', color: 'white', fontSize: '12px', fontFamily: '"Instrument Sans", sans-serif', fontWeight: 600, wordWrap: 'break-word' }}>PAYSLIP</div>
            </Link>
          </div>
          
          {/* RIGHT ACTION BUTTONS */}
          <div style={{ justifyContent: 'flex-end', alignItems: 'center', gap: '12px', display: 'flex' }}>
            {short ? (
              <button 
                onClick={handleDisconnect}
                title="Disconnect wallet"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '15px 32px', background: 'rgba(255,255,255,0.05)', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', fontFamily: '"Space Mono", monospace', fontSize: '14px', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,50,50,0.1)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                <div style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%' }} />
                {short} <span style={{fontSize: '12px', opacity: 0.6, marginLeft: '4px'}}>✕</span>
              </button>
            ) : (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setVisible(true)}
                  disabled={connecting}
                  style={{
                    padding: '15px 32px',
                    background: connecting ? 'rgba(59,130,246,0.6)' : 'linear-gradient(180deg, #3B82F6 20%, #234C90 80%)',
                    boxShadow: '0px 10px 6px -6px rgba(0, 0, 0, 0.50), 0px 12px 32px white inset, 0px -5px 10px rgba(0, 0, 0, 0.50) inset, 0px 6px 12px white inset',
                    borderRadius: '18px',
                    color: 'white',
                    fontSize: '14px',
                    fontFamily: '"Instrument Sans", sans-serif',
                    fontWeight: 600,
                    lineHeight: '20.48px',
                    border: 'none',
                    cursor: connecting ? 'wait' : 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  {connecting ? 'Connecting...' : 'Connect Wallet'}
                </button>
              </div>
            )}
            <div style={{ padding: '9px 20px', background: 'rgba(255, 255, 255, 0.10)', borderRadius: '999px', outline: '1.50px solid rgba(255, 255, 255, 0.15)', outlineOffset: '-1.50px', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', justifyContent: 'center', alignItems: 'center', gap: '10px', display: 'flex' }}>
              <div style={{ opacity: 0.40, textAlign: 'center', color: 'white', fontSize: '12px', fontFamily: '"Instrument Sans", sans-serif', fontWeight: 600, textTransform: 'uppercase', wordWrap: 'break-word' }}>
                solana
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </nav>

  );
}
