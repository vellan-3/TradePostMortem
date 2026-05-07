import { DiagnosisCode } from '@/types';

interface ScoreBadgeProps {
  grade: 'F' | 'D' | 'C' | 'B' | 'A';
}

export default function ScoreBadge({ grade }: ScoreBadgeProps) {
  const classMap: Record<string, string> = {
    F: 'score-tag score-f',
    D: 'score-tag score-d',
    C: 'score-tag score-c',
    B: 'score-tag score-b',
    A: 'score-tag score-a',
  };

  return <span className={classMap[grade] ?? 'score-tag score-c'}>{grade}</span>;
}

// ─── Diagnosis helpers (used by multiple components) ───────────────────────

export function diagnosisColor(code: DiagnosisCode): string {
  const map: Record<DiagnosisCode, string> = {
    BOUGHT_THE_TOP: 'var(--red)',
    SOLD_THE_BOTTOM: 'var(--orange)',
    PAPER_HANDS: 'var(--yellow)',
    DIAMOND_HANDS_REKT: 'var(--red)',
    GOOD_TRADE: 'var(--green)',
    UNKNOWN: 'var(--muted)',
  };
  return map[code] ?? 'var(--muted)';
}

export function diagnosisPillClass(code: DiagnosisCode): string {
  const map: Record<DiagnosisCode, string> = {
    BOUGHT_THE_TOP: 'pill-red',
    SOLD_THE_BOTTOM: 'pill-orange',
    PAPER_HANDS: 'pill-yellow',
    DIAMOND_HANDS_REKT: 'pill-red',
    GOOD_TRADE: 'pill-green',
    UNKNOWN: '',
  };
  return map[code] ?? '';
}

export function diagnosisBlockClass(code: DiagnosisCode): string {
  const map: Record<DiagnosisCode, string> = {
    BOUGHT_THE_TOP: 'diag-red',
    SOLD_THE_BOTTOM: 'diag-orange',
    PAPER_HANDS: 'diag-yellow',
    DIAMOND_HANDS_REKT: 'diag-red',
    GOOD_TRADE: 'diag-green',
    UNKNOWN: 'diag-muted',
  };
  return map[code] ?? 'diag-muted';
}

export function diagnosisLabel(code: DiagnosisCode): string {
  const map: Record<DiagnosisCode, string> = {
    BOUGHT_THE_TOP: 'Bought the Top',
    SOLD_THE_BOTTOM: 'Sold the Bottom',
    PAPER_HANDS: 'Paper Hands',
    DIAMOND_HANDS_REKT: 'Diamond Hands Rekt',
    GOOD_TRADE: 'Good Trade',
    UNKNOWN: 'Unknown',
  };
  return map[code] ?? 'Unknown';
}

