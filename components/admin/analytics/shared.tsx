'use client';
import type { AnalyticsEvent, AnalyticsSession } from '@/lib/types';
import type { DailyTrafficPoint } from '@/lib/seedAnalytics';

export type TimeRange = 'today' | '7d' | '30d' | '120d';

export function isPaidMedium(medium: string) {
  const normalized = medium.toLowerCase().replace(/[\s-]+/g, '_');
  return ['paid', 'cpc', 'ppc', 'display', 'sponsored'].includes(normalized)
    || normalized.startsWith('paid_') || normalized.endsWith('_paid');
}

export function rangeDaysOf(range: TimeRange) {
  return range === 'today' ? 1 : range === '7d' ? 7 : range === '30d' ? 30 : 120;
}

export function rangeLabelOf(range: TimeRange) {
  return range === 'today' ? 'Today' : `Last ${rangeDaysOf(range)} days`;
}

/** Start timestamp (ms) of the first day in the visible traffic window. */
export function windowStartOf(visibleTraffic: DailyTrafficPoint[]) {
  return visibleTraffic[0] ? new Date(`${visibleTraffic[0].isoDate}T00:00:00.000Z`).getTime() : 0;
}

export function sessionsInWindow(sessions: AnalyticsSession[], start: number) {
  const now = Date.now();
  return sessions.filter((s) => {
    const t = new Date(s.createdAt).getTime();
    return t >= start && t <= now;
  });
}

export function eventsInWindow(events: AnalyticsEvent[], start: number) {
  const now = Date.now();
  return events.filter((e) => {
    const t = new Date(e.timestamp).getTime();
    return t >= start && t <= now;
  });
}

const RANGE_OPTIONS: Array<{ value: TimeRange; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '120d', label: 'Last 120 Days' },
];

export function RangeTabs({ value, onChange }: { value: TimeRange; onChange: (range: TimeRange) => void }) {
  return (
    <div className="crm-tabs" aria-label="Date range">
      {RANGE_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          id={`range-${option.value}`}
          className={value === option.value ? 'on' : ''}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
