'use client';
import { useState, useRef, useEffect } from 'react';
import type { AnalyticsEvent, AnalyticsSession } from '@/lib/types';
import type { DailyTrafficPoint } from '@/lib/seedAnalytics';
import { Ic } from '../AdIcons';

export type TimeRange = 'today' | '7d' | '30d' | '90d' | 'custom';

export function isPaidMedium(medium: string) {
  const normalized = medium.toLowerCase().replace(/[\s-]+/g, '_');
  return ['paid', 'cpc', 'ppc', 'display', 'sponsored'].includes(normalized)
    || normalized.startsWith('paid_') || normalized.endsWith('_paid');
}

export function rangeDaysOf(range: TimeRange, customStart?: string, customEnd?: string): number {
  if (range === 'today') return 1;
  if (range === '7d') return 7;
  if (range === '30d') return 30;
  if (range === '90d') return 90;
  if (range === 'custom' && customStart && customEnd) {
    const s = new Date(customStart).getTime();
    const e = new Date(customEnd).getTime();
    if (!isNaN(s) && !isNaN(e) && e >= s) {
      return Math.max(1, Math.round((e - s) / 86400000) + 1);
    }
  }
  return 30;
}

export function rangeLabelOf(range: TimeRange, customStart?: string, customEnd?: string): string {
  if (range === 'today') return 'Today';
  if (range === 'custom' && customStart && customEnd) {
    return `${customStart} – ${customEnd}`;
  }
  return `Last ${rangeDaysOf(range)} days`;
}

/** Start timestamp (ms) of the first day in the visible traffic window. */
export function windowStartOf(visibleTraffic: DailyTrafficPoint[]) {
  return visibleTraffic[0] ? new Date(`${visibleTraffic[0].isoDate}T00:00:00.000Z`).getTime() : 0;
}

export function sessionsInWindow(sessions: AnalyticsSession[], start: number, end: number = Date.now()) {
  return sessions.filter((s) => {
    const t = new Date(s.createdAt).getTime();
    return t >= start && t <= end;
  });
}

export function eventsInWindow(events: AnalyticsEvent[], start: number, end: number = Date.now()) {
  return events.filter((e) => {
    const t = new Date(e.timestamp).getTime();
    return t >= start && t <= end;
  });
}

const RANGE_OPTIONS: Array<{ value: TimeRange; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
];

interface RangeTabsProps {
  value: TimeRange;
  onChange: (range: TimeRange, start?: string, end?: string) => void;
  customStart?: string;
  customEnd?: string;
}

export function RangeTabs({ value, onChange, customStart, customEnd }: RangeTabsProps) {
  const [openPicker, setOpenPicker] = useState(false);
  const [localStart, setLocalStart] = useState(customStart || '');
  const [localEnd, setLocalEnd] = useState(customEnd || '');
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close custom popover on outside click
  useEffect(() => {
    if (!openPicker) return;
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpenPicker(false);
      }
    };
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, [openPicker]);

  const applyCustom = () => {
    if (localStart && localEnd) {
      onChange('custom', localStart, localEnd);
      setOpenPicker(false);
    }
  };

  return (
    <div className="an-date-controls">
      <div className="crm-tabs" aria-label="Date range">
        {RANGE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            id={`range-${option.value}`}
            className={value === option.value ? 'on' : ''}
            onClick={() => {
              setOpenPicker(false);
              onChange(option.value);
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="an-custom-picker-wrap" ref={popoverRef} style={{ position: 'relative' }}>
        <button
          type="button"
          id="custom-date-btn"
          className={`crm-btn ${value === 'custom' ? 'pri' : ''}`}
          onClick={() => setOpenPicker((p) => !p)}
          title="Select a custom date range"
        >
          <Ic k="calendar" s={16} />
          <span>
            {value === 'custom' && customStart && customEnd
              ? `${customStart} → ${customEnd}`
              : 'Custom Date'}
          </span>
        </button>

        {openPicker && (
          <div className="an-custom-popover">
            <div className="an-popover-title">Choose date range</div>
            <div className="an-popover-fields">
              <label>
                <span>From</span>
                <input
                  type="date"
                  className="crm-in"
                  value={localStart}
                  onChange={(e) => setLocalStart(e.target.value)}
                />
              </label>
              <label>
                <span>To</span>
                <input
                  type="date"
                  className="crm-in"
                  value={localEnd}
                  onChange={(e) => setLocalEnd(e.target.value)}
                />
              </label>
            </div>
            <div className="an-popover-actions">
              <button
                type="button"
                className="crm-sm"
                onClick={() => setOpenPicker(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="crm-btn pri"
                style={{ height: 36, padding: '0 16px' }}
                disabled={!localStart || !localEnd || localStart > localEnd}
                onClick={applyCustom}
              >
                Apply Range
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
