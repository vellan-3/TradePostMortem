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
      {/* ── Top row: Grade + Breakdown ── */}
      <div className="ds-payslip-grid">
        <div className="ds-grade-hero">
          <div className="ds-grade-letter" style={{
            color: data.grades.overall.grade.startsWith('A') ? 'var(--slip-success)' :
                   data.grades.overall.grade.startsWith('B') ? 'var(--slip-blue)' :
                   data.grades.overall.grade.startsWith('C') ? 'var(--slip-warning)' :
                   'var(--slip-red)'
          }}>
            {data.grades.overall.grade}
          </div>
          <div className="ds-grade-lbl">{data.grades.overall.score} / 100 SCORE</div>
        </div>
        
        <div className="ds-grade-breakdown">
          <GradeItem label="Entry Discipline" grade={data.grades.entryDiscipline.grade} />
          <GradeItem label="Exit Discipline" grade={data.grades.exitDiscipline.grade} />
          <GradeItem label="Size Management" grade={data.grades.sizeManagement.grade} />
          <GradeItem label="Token Selection" grade={data.grades.tokenSelection.grade} />
        </div>
      </div>

      {/* ── Summary strip ── */}
      <div className="ds-summary-strip">
        <SummaryItem label="Total P&L" val={`${data.summary.totalPnlSol >= 0 ? '+' : ''}${data.summary.totalPnlSol.toFixed(1)} SOL`} sub={`Across ${data.summary.tradesAnalyzed} trades`} tone={data.summary.totalPnlSol >= 0 ? 'pass' : 'fail'} />
        <SummaryItem label="Left on Table" val={`+${data.summary.totalLeftOnTable.toFixed(1)} SOL`} sub="Peak vs actual exits" tone="warn" />
        <SummaryItem label="Worst Trade" val={`${data.summary.worstTradePnl.toFixed(1)} SOL`} sub="Realized loss" tone="fail" />
        <SummaryItem label="Avg Entry Pct" val={`${data.summary.avgEntryPercentile || 0}th`} sub="Timing score" />
      </div>

      {/* ── Repeat Mistake Banner ── */}
      {data.banner && (
        <div className="ds-mistake-banner">
          <span className="ds-mb-icon">⚠</span>
          <div className="ds-mb-body">
            <div className="ds-mb-title">{data.banner.title}</div>
            <div className="ds-mb-text">{data.banner.body}</div>
          </div>
        </div>
      )}

      {/* ── Trades ── */}
      <div className="ds-section-lbl" style={{ marginTop: 40, marginBottom: 20 }}>Trade Breakdown</div>
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
