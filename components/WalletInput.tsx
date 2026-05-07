'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const DEMO_WALLETS = [
  { label: 'Paper Hands Whale', address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU' },
  { label: 'Top Buyer', address: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKH' },
  { label: 'Diamond Hands L', address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM' },
];

export default function WalletInput() {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function validate(addr: string): boolean {
    if (!addr || addr.trim().length < 32) {
      setError('Enter a valid Solana wallet address (32–44 characters)');
      return false;
    }
    setError('');
    return true;
  }

  function handleSubmit() {
    const trimmed = value.trim();
    if (!validate(trimmed)) return;
    setLoading(true);
    router.push(`/analyze/${trimmed}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSubmit();
  }

  function loadDemo(address: string) {
    setValue(address);
    setError('');
  }

  return (
    <div className="input-wrapper">
      <label className="input-label" htmlFor="walletInput">
        Wallet Address
      </label>
      <div className="input-row">
        <input
          id="walletInput"
          className="wallet-input"
          type="text"
          placeholder="Enter Solana wallet address..."
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError('');
          }}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button
          className="btn-analyze"
          onClick={handleSubmit}
          disabled={loading}
          id="analyzeBtn"
        >
          {loading ? 'Loading...' : 'Autopsy →'}
        </button>
      </div>

      {error && (
        <p style={{ fontSize: 12, color: 'var(--red)', marginTop: 8 }}>{error}</p>
      )}

      <div className="demo-row">
        <span className="demo-label">Try a demo:</span>
        {DEMO_WALLETS.map((w) => (
          <button
            key={w.address}
            className="demo-chip"
            onClick={() => loadDemo(w.address)}
            type="button"
          >
            {w.label}
          </button>
        ))}
      </div>
    </div>
  );
}


/* SLIP v2 Official Release */
