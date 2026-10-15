'use client';
import { useState, useRef, useEffect } from 'react';
import type { AnalyticsEvent, AnalyticsSession } from '@/lib/types';
import type { DailyTrafficPoint } from '@/lib/seedAnalytics';
import { Ic } from '../AdIcons';

export type TimeRange = 'today' | '7d' | '30d' | '90d' | 'custom';

export function cleanLocation(city?: string, region?: string, country?: string): string {
  const parts: string[] = [];
  if (city && city !== 'Unknown') {
    try {
      parts.push(decodeURIComponent(city.replace(/\+/g, ' ')));
    } catch {
      parts.push(city.replace(/%20/g, ' ').replace(/\+/g, ' '));
    }
  }
  if (region && region !== 'Unknown') {
    parts.push(region);
  }
  if (country && country !== 'Unknown') {
    parts.push(country);
  }
  return parts.length ? parts.join(' ') : 'Unknown';
}

export function cleanCity(city?: string): string {
  if (!city || city === 'Unknown') return 'Unknown';
  try {
    return decodeURIComponent(city.replace(/\+/g, ' '));
  } catch {
    return city.replace(/%20/g, ' ').replace(/\+/g, ' ');
  }
}

export function isPaidMedium(medium: string) {
  const normalized = medium.toLowerCase().replace(/[\s-]+/g, '_');
  return ['paid', 'cpc', 'ppc', 'display', 'sponsored'].includes(normalized)
    || normalized.startsWith('paid_') || normalized.endsWith('_paid');
}

export function parseDateBoundary(dateStr?: string, isEndOfDay: boolean = false): number {
  if (!dateStr) return isEndOfDay ? Date.now() : 0;
  if (dateStr.includes('T')) {
    const t = new Date(dateStr).getTime();
    if (!isNaN(t)) return t;
  }
  const clean = dateStr.slice(0, 10);
  const parts = clean.split('-').map(Number);
  if (parts.length === 3 && !parts.some(isNaN)) {
    const [y, m, d] = parts;
    if (isEndOfDay) {
      return new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
    }
    return new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
  }
  const fallback = new Date(dateStr).getTime();
  return isNaN(fallback) ? (isEndOfDay ? Date.now() : 0) : fallback;
}

export function rangeDaysOf(range: TimeRange, customStart?: string, customEnd?: string): number {
  if (range === 'today') return 1;
  if (range === '7d') return 7;
  if (range === '30d') return 30;
  if (range === '90d') return 90;
  if (range === 'custom' && customStart) {
    const s = parseDateBoundary(customStart, false);
    const e = parseDateBoundary(customEnd || customStart, true);
    if (!isNaN(s) && !isNaN(e) && e >= s) {
      return Math.max(1, Math.round((e - s) / 86400000));
    }
  }
  return 30;
}

export function rangeLabelOf(range: TimeRange, customStart?: string, customEnd?: string): string {
  if (range === 'today') return 'Today';
  if (range === 'custom' && customStart) {
    const s = customStart.slice(0, 10);
    const e = (customEnd || customStart).slice(0, 10);
    return s === e ? s : `${s} – ${e}`;
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
  const [useTime, setUseTime] = useState(Boolean(customStart?.includes('T') || customEnd?.includes('T')));
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (customStart) setLocalStart(customStart);
    if (customEnd) setLocalEnd(customEnd);
    if (customStart?.includes('T') || customEnd?.includes('T')) setUseTime(true);
  }, [customStart, customEnd]);

  // Close custom popover on outside click
  useEffect(() => {
    if (!openPicker) return;
    const handleClick = (e: Event) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpenPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, [openPicker]);

  const toggleUseTime = () => {
    setUseTime((prev) => {
      const next = !prev;
      if (next) {
        if (localStart && !localStart.includes('T')) setLocalStart(`${localStart}T00:00`);
        if (localEnd && !localEnd.includes('T')) setLocalEnd(`${localEnd}T23:59`);
      } else {
        if (localStart?.includes('T')) setLocalStart(localStart.slice(0, 10));
        if (localEnd?.includes('T')) setLocalEnd(localEnd.slice(0, 10));
      }
      return next;
    });
  };

  const setPreset = (days: number, offsetDays = 0) => {
    const end = new Date(Date.now() - offsetDays * 86400000);
    const start = new Date(end.getTime() - (days - 1) * 86400000);
    const sStr = start.toISOString().slice(0, 10);
    const eStr = end.toISOString().slice(0, 10);
    if (useTime) {
      setLocalStart(`${sStr}T00:00`);
      setLocalEnd(`${eStr}T23:59`);
    } else {
      setLocalStart(sStr);
      setLocalEnd(eStr);
    }
  };

  const applyCustom = () => {
    const startVal = localStart || localEnd;
    const endVal = localEnd || localStart;
    if (!startVal) return;

    let s = startVal;
    let e = endVal;
    if (s > e) {
      const temp = s;
      s = e;
      e = temp;
    }
    onChange('custom', s, e);
    setOpenPicker(false);
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

      <div className="an-custom-picker-wrap" ref={popoverRef}>
        <button
          type="button"
          id="custom-date-btn"
          className={`crm-btn ${value === 'custom' ? 'pri' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setOpenPicker((prev) => !prev);
          }}
          title="Select a custom date range"
        >
          <Ic k="calendar" s={16} />
          <span>
            {value === 'custom' && customStart
              ? rangeLabelOf('custom', customStart, customEnd)
              : 'Custom Date & Time'}
          </span>
        </button>

        {openPicker && (
          <div
            className="an-custom-popover"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="an-popover-head">
              <span className="an-popover-title">Choose date &amp; time</span>
              <button
                type="button"
                className="an-time-toggle-btn"
                onClick={toggleUseTime}
              >
                {useTime ? 'Date only' : '+ Add time'}
              </button>
            </div>

            {/* Quick date presets */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
              <button type="button" className="crm-sm" style={{ padding: '3px 8px', fontSize: 11 }} onClick={() => setPreset(1, 0)}>Today</button>
              <button type="button" className="crm-sm" style={{ padding: '3px 8px', fontSize: 11 }} onClick={() => setPreset(1, 1)}>Yesterday</button>
              <button type="button" className="crm-sm" style={{ padding: '3px 8px', fontSize: 11 }} onClick={() => setPreset(7, 0)}>7 Days</button>
              <button type="button" className="crm-sm" style={{ padding: '3px 8px', fontSize: 11 }} onClick={() => setPreset(30, 0)}>30 Days</button>
            </div>

            <div className="an-popover-fields">
              <label>
                <span>Start {useTime ? 'date & time' : 'date'}</span>
                <input
                  type={useTime ? 'datetime-local' : 'date'}
                  className="crm-in an-native-date-input"
                  value={localStart}
                  onChange={(e) => setLocalStart(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') applyCustom(); }}
                  onClick={(e) => {
                    try { (e.currentTarget as HTMLInputElement).showPicker?.(); } catch { /* ignore */ }
                  }}
                />
              </label>
              <label>
                <span>End {useTime ? 'date & time' : 'date'}</span>
                <input
                  type={useTime ? 'datetime-local' : 'date'}
                  className="crm-in an-native-date-input"
                  value={localEnd}
                  onChange={(e) => setLocalEnd(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') applyCustom(); }}
                  onClick={(e) => {
                    try { (e.currentTarget as HTMLInputElement).showPicker?.(); } catch { /* ignore */ }
                  }}
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
                style={{ height: 36, padding: '0 18px', fontWeight: 600 }}
                disabled={!localStart && !localEnd}
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
