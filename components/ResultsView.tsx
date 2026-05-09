import TradeCard from './TradeCard';

export default function ResultsView({ data, openCard, setOpenCard, onVerdict, onMirror }: {
  data: any;
  openCard: string | null;
  setOpenCard: (id: string | null) => void;
  onVerdict: (s: string, m: string) => void;
  onMirror: (s: string, m: string) => void;
}) {
  return (
    <div className="ds-fade-up">
      {/* ── Top row: Red Alert Banner ── */}
      {data.banner && (
        <div className="ds-mistake-banner">
          <div className="ds-mb-icon">⚠</div>
          <div className="ds-mb-body">
            <div className="ds-mb-title">{data.banner.title}</div>
            <div className="ds-mb-text" dangerouslySetInnerHTML={{ __html: data.banner.body }} />
          </div>
        </div>
      )}

      {/* ── Sort Tabs ── */}
      <div className="ds-sort-tabs">
        <button className="ds-sort-btn active">WORST FIRST</button>
        <button className="ds-sort-btn">MOST RECENT</button>
        <button className="ds-sort-btn">BIGGEST SIZE</button>
      </div>

      {/* ── Trades ── */}
      <div className="ds-trades-list">
        {data.trades.map((trade: any, i: number) => (
          <TradeCard
            key={trade.id}
            trade={trade}
            rank={i + 1}
            isOpen={openCard === trade.id}
            onToggle={() => setOpenCard(openCard === trade.id ? null : trade.id)}
            onVerdict={onVerdict}
            onMirror={onMirror}
          />
        ))}
      </div>
    </div>
  );
}

function GradeItem({ label, grade }: { label: string; grade: string }) {
  return (
    <div className="ds-grade-item">
      <div className="ds-gi-lbl">{label}</div>
      <div className="ds-gi-val" style={{
        color: grade.startsWith('A') ? 'var(--slip-success)' :
               grade.startsWith('B') ? 'var(--slip-blue)' :
               grade.startsWith('C') ? 'var(--slip-warning)' :
               'var(--slip-red)'
      }}>{grade}</div>
    </div>
  );
}

function SummaryItem({ label, val, sub, tone }: { label: string; val: string; sub: string; tone?: string }) {
  const color = tone === 'pass' ? 'var(--slip-success)' : tone === 'warn' ? 'var(--slip-warning)' : tone === 'fail' ? 'var(--slip-red)' : 'var(--slip-text)';
  return (
    <div className="ds-summary-item">
      <div className="ds-si-lbl">{label}</div>
      <div className="ds-si-val" style={{ color }}>{val}</div>
      <div className="ds-si-sub">{sub}</div>
    </div>
  );
}


/* SLIP v2 Official Release */
