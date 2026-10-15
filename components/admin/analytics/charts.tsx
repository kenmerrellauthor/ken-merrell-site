'use client';
import { useMemo, useState } from 'react';
import type { DailyTrafficPoint } from '@/lib/seedAnalytics';

/* Shared SVG chart geometry (matches the original dashboard chart). */
const W = 680;
const H = 280;
const L = 60;
const R = 660;
const T = 20;
const B = 220;

/** Round a max value up to a "nice" axis ceiling (1, 2, 5 × 10ⁿ). */
function niceMax(value: number) {
  if (value <= 5) return 5;
  const exp = Math.pow(10, Math.floor(Math.log10(value)));
  const f = value / exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return nice * exp;
}

function xAt(index: number, count: number) {
  return L + (index / Math.max(count - 1, 1)) * (R - L);
}

function yAt(value: number, max: number) {
  return B - (value / max) * (B - T);
}

function Gridlines({ max, top = T, bottom = B }: { max: number; top?: number; bottom?: number }) {
  return (
    <>
      {/* Vertical Y-axis label */}
      <text
        transform="rotate(-90)"
        x={-((top + bottom) / 2)}
        y={14}
        textAnchor="middle"
        className="an-chart-axis-name"
      >
        ↑ Y-Axis: Count (Visitors / Conversions)
      </text>
      {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
        const y = bottom - fraction * (bottom - top);
        return (
          <g key={fraction}>
            <line x1={L} y1={y} x2={R} y2={y} className="an-chart-gridline" />
            <text x={L - 10} y={y + 4} textAnchor="end" className="an-chart-axis-label">
              {Math.round(max * fraction).toLocaleString()}
            </text>
          </g>
        );
      })}
    </>
  );
}

function DateLabels({
  data,
  xFor,
  labelY = 240,
  axisY = 266,
}: {
  data: DailyTrafficPoint[];
  xFor: (i: number) => number;
  labelY?: number;
  axisY?: number;
}) {
  const isHourly = data.length === 24;
  return (
    <>
      {data.map((point, i) => {
        if (isHourly) {
          // Show every 3 hours: 12 AM, 3 AM, 6 AM, 9 AM, 12 PM, 3 PM, 6 PM, 9 PM
          if (i % 3 !== 0) return null;
          return (
            <text key={point.isoDate} x={xFor(i)} y={labelY} textAnchor="middle" className="an-chart-axis-label">
              {point.date}
            </text>
          );
        }
        const interval = Math.max(1, Math.ceil(data.length / 6));
        if (!(i === 0 || i === data.length - 1 || i % interval === 0)) return null;
        if (i !== data.length - 1 && data.length - 1 - i < interval / 2 && i !== 0) return null;
        return (
          <text key={point.isoDate} x={xFor(i)} y={labelY} textAnchor="middle" className="an-chart-axis-label">
            {point.date}
          </text>
        );
      })}
      <text x={(L + R) / 2} y={axisY} textAnchor="middle" className="an-chart-axis-name">
        → X-Axis: {isHourly ? 'Time of Day (Local Time)' : 'Timeline (Dates)'}
      </text>
    </>
  );
}

/* ─────────────────────────── Multi-series trend chart ─────────────────────────── */

type SeriesKey = 'visitors' | 'paidVisitors' | 'organicVisitors' | 'amazonClicks' | 'arcSignups';

const TREND_SERIES: Array<{ key: SeriesKey; label: string; color: string }> = [
  { key: 'visitors', label: 'All visitors', color: '#d7b66f' },
  { key: 'paidVisitors', label: 'Paid', color: '#5b9cf6' },
  { key: 'organicVisitors', label: 'Organic', color: '#e0a46b' },
  { key: 'amazonClicks', label: 'Amazon clicks', color: '#79c9a2' },
  { key: 'arcSignups', label: 'ARC signups', color: '#a78bfa' },
];

export function TrendChart({ data }: { data: DailyTrafficPoint[] }) {
  const [active, setActive] = useState<SeriesKey[]>(['visitors', 'amazonClicks', 'arcSignups']);
  const [hover, setHover] = useState<number | null>(null);

  const toggle = (key: SeriesKey) => {
    setActive((current) => {
      if (current.includes(key)) return current.length === 1 ? current : current.filter((k) => k !== key);
      return [...current, key];
    });
  };

  const visibleSeries = TREND_SERIES.filter((s) => active.includes(s.key));
  const max = niceMax(Math.max(1, ...data.flatMap((p) => visibleSeries.map((s) => p[s.key]))));
  const count = data.length;
  const xFor = (i: number) => (count === 1 ? (L + R) / 2 : xAt(i, count));
  const columnWidth = (R - L) / Math.max(count, 1);
  const hovered = hover !== null ? data[hover] : null;

  return (
    <div className="an-chart-block">
      <div className="an-toggle-row" role="group" aria-label="Chart series">
        {TREND_SERIES.map((s) => (
          <button
            key={s.key}
            type="button"
            id={`trend-toggle-${s.key}`}
            className={`an-toggle${active.includes(s.key) ? ' on' : ''}`}
            style={{ '--toggle-color': s.color } as React.CSSProperties}
            onClick={() => toggle(s.key)}
            aria-pressed={active.includes(s.key)}
          >
            <i aria-hidden="true" /> {s.label}
          </button>
        ))}
      </div>

      <div className="an-chart-container">
        {hovered && (
          <div className="an-chart-tooltip">
            <strong className="an-tip-date">
              {hovered.isoDate.includes('T') ? `${hovered.isoDate.slice(0, 10)} · ${hovered.date}` : hovered.date}
            </strong>
            {TREND_SERIES.map((s) => (
              <span key={s.key} className="an-tip-row" style={{ opacity: active.includes(s.key) ? 1 : 0.45 }}>
                <i style={{ background: s.color }} /> {s.label}: <strong>{hovered[s.key].toLocaleString()}</strong>
              </span>
            ))}
            {hovered.adNote && <span className="an-tip-note">★ {hovered.adNote}</span>}
          </div>
        )}

        <svg className="an-chart-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Traffic trend" onMouseLeave={() => setHover(null)}>
          <defs>
            {visibleSeries.map((s) => (
              <linearGradient key={s.key} id={`trend-fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.22" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>
          <Gridlines max={max} />

          {hover !== null && <line x1={xFor(hover)} x2={xFor(hover)} y1={T} y2={B} className="an-chart-guide" />}

          {visibleSeries.map((s) => {
            const pts = data.map((p, i) => ({ x: xFor(i), y: yAt(p[s.key], max) }));
            if (!pts.length) return null;
            const line = pts.map(({ x, y }, i) => `${i ? 'L' : 'M'} ${x} ${y}`).join(' ');
            const area = `M ${pts[0].x} ${B} ${pts.map(({ x, y }) => `L ${x} ${y}`).join(' ')} L ${pts[pts.length - 1].x} ${B} Z`;
            return (
              <g key={s.key} className="an-series">
                <path d={area} fill={`url(#trend-fill-${s.key})`} />
                <path d={line} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="an-chart-line" />
                {hover !== null && pts[hover] && (
                  <circle cx={pts[hover].x} cy={pts[hover].y} r="5" fill={s.color} className="an-chart-point" />
                )}
                {count <= 31 && pts.map(({ x, y }, i) => (i === hover ? null : (
                  <circle key={i} cx={x} cy={y} r="2.4" fill={s.color} className="an-chart-point" />
                )))}
              </g>
            );
          })}

          {data.map((p, i) => p.adNote ? (
            <g key={`promo-${p.isoDate}`}>
              <circle cx={xFor(i)} cy={B} r="7" className="an-chart-promo-ring" />
              <circle cx={xFor(i)} cy={B} r="3" fill="#86aaff" />
            </g>
          ) : null)}

          <DateLabels data={data} xFor={xFor} />

          {data.map((p, i) => (
            <rect
              key={`hit-${p.isoDate}`}
              x={xFor(i) - columnWidth / 2}
              y={T}
              width={columnWidth}
              height={B - T}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}

/* ─────────────────────────── Stacked paid / organic bars ─────────────────────────── */

export function StackedBars({ data }: { data: DailyTrafficPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(1, ...data.map((p) => p.paidVisitors + p.organicVisitors)));
  const count = Math.max(data.length, 1);
  const slot = (R - L) / count;
  const barWidth = Math.max(2, Math.min(28, slot * 0.68));
  const xFor = (i: number) => L + slot * i + slot / 2;
  const hovered = hover !== null ? data[hover] : null;

  const H_BARS = 390;
  const T_BARS = 20;
  const B_BARS = 325;

  return (
    <div className="an-chart-container an-chart-container-stacked">
      {hovered && (
        <div className="an-chart-tooltip">
          <strong className="an-tip-date">{hovered.isoDate.includes('T') ? `${hovered.isoDate.slice(0, 10)} · ${hovered.date}` : hovered.date}</strong>
          <span className="an-tip-row"><i style={{ background: '#5b9cf6' }} /> Paid: <strong>{hovered.paidVisitors}</strong></span>
          <span className="an-tip-row"><i style={{ background: '#c9a860' }} /> Organic: <strong>{hovered.organicVisitors}</strong></span>
          <span className="an-tip-row muted">Total: <strong>{hovered.paidVisitors + hovered.organicVisitors}</strong></span>
        </div>
      )}
      <svg className="an-chart-svg an-chart-svg-stacked" viewBox={`0 0 ${W} ${H_BARS}`} role="img" aria-label="Paid versus organic visitors per day" onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="bar-paid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7cb2ff" />
            <stop offset="100%" stopColor="#2f6fe0" />
          </linearGradient>
          <linearGradient id="bar-org" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ecd296" />
            <stop offset="100%" stopColor="#b8954d" />
          </linearGradient>
        </defs>
        <Gridlines max={max} top={T_BARS} bottom={B_BARS} />
        {data.map((p, i) => {
          const x = xFor(i) - barWidth / 2;
          const orgH = (p.organicVisitors / max) * (B_BARS - T_BARS);
          const paidH = (p.paidVisitors / max) * (B_BARS - T_BARS);
          const dim = hover !== null && hover !== i;
          return (
            <g key={p.isoDate} opacity={dim ? 0.45 : 1} className="an-bar-group">
              <rect x={x} y={B_BARS - orgH} width={barWidth} height={orgH} fill="url(#bar-org)" rx={barWidth > 6 ? 2 : 0} />
              <rect x={x} y={B_BARS - orgH - paidH} width={barWidth} height={paidH} fill="url(#bar-paid)" rx={barWidth > 6 ? 2 : 0} />
              <rect x={L + slot * i} y={T_BARS} width={slot} height={B_BARS - T_BARS} fill="transparent" onMouseEnter={() => setHover(i)} />
            </g>
          );
        })}
        <DateLabels data={data} xFor={xFor} labelY={350} axisY={376} />
      </svg>
    </div>
  );
}

/* ─────────────────────────── Donut chart ─────────────────────────── */

export type DonutSegment = { label: string; value: number; color: string };

export function Donut({ segments, centerLabel, emptyText }: { segments: DonutSegment[]; centerLabel: string; emptyText: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = 66;
  const circumference = 2 * Math.PI * radius;

  const arcs = useMemo(() => {
    let offset = 0;
    return segments.map((s) => {
      const length = total ? (s.value / total) * circumference : 0;
      const arc = { ...s, length, offset };
      offset += length;
      return arc;
    });
  }, [segments, total, circumference]);

  if (!total) return <p className="an-empty">{emptyText}</p>;

  const focus = hover !== null ? segments[hover] : null;

  return (
    <div className="an-donut-wrap">
      <div className="an-donut">
        <svg viewBox="0 0 180 180" role="img" aria-label={centerLabel}>
          <circle cx="90" cy="90" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="22" />
          {arcs.map((a, i) => (
            <circle
              key={a.label}
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke={a.color}
              strokeWidth={hover === i ? 27 : 22}
              strokeDasharray={`${Math.max(a.length - 1.5, 0)} ${circumference}`}
              strokeDashoffset={-a.offset}
              transform="rotate(-90 90 90)"
              className="an-donut-seg"
              opacity={hover !== null && hover !== i ? 0.4 : 1}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
          ))}
        </svg>
        <div className="an-donut-center">
          <strong>{(focus ? focus.value : total).toLocaleString()}</strong>
          <span>{focus ? focus.label : centerLabel}</span>
          {focus && <em>{Math.round((focus.value / total) * 100)}%</em>}
        </div>
      </div>
      <ul className="an-donut-legend">
        {segments.map((s, i) => (
          <li
            key={s.label}
            className={hover === i ? 'on' : ''}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <i style={{ background: s.color }} />
            <span className="lbl">{s.label}</span>
            <span className="val">{s.value.toLocaleString()}</span>
            <span className="pct">{Math.round((s.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─────────────────────────── Conversion funnel ─────────────────────────── */

export type FunnelStep = { label: string; value: number; color: string; hint: string };

export function Funnel({ steps }: { steps: FunnelStep[] }) {
  const top = Math.max(steps[0]?.value ?? 0, 1);
  return (
    <ol className="an-funnel">
      {steps.map((step, i) => {
        const width = Math.max((step.value / top) * 100, step.value ? 4 : 0);
        const ofTotal = Math.round((step.value / top) * 1000) / 10;
        const prev = i > 0 ? steps[i - 1].value : 0;
        const ofPrev = i > 0 && prev ? Math.round((step.value / prev) * 1000) / 10 : null;
        return (
          <li key={step.label} className="an-funnel-step">
            <div className="an-funnel-meta">
              <span className="an-funnel-idx">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <strong>{step.label}</strong>
                <small>{step.hint}</small>
              </div>
              <div className="an-funnel-nums">
                <strong>{step.value.toLocaleString()}</strong>
                <small>{i === 0 ? '100%' : `${ofTotal}% of visitors`}</small>
              </div>
            </div>
            <div className="an-funnel-track">
              <div className="an-funnel-fill" style={{ width: `${width}%`, '--fill': step.color } as React.CSSProperties} />
            </div>
            {ofPrev !== null && <span className="an-funnel-drop">↳ {ofPrev}% continued from previous step</span>}
          </li>
        );
      })}
    </ol>
  );
}

/* ─────────────────────────── Horizontal bar list ─────────────────────────── */

export type HBarRow = { label: string; value: number; hint?: string };

export function HBarList({ rows, color, emptyText, unit = '' }: { rows: HBarRow[]; color: string; emptyText: string; unit?: string }) {
  if (!rows.length) return <p className="an-empty">{emptyText}</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  const total = rows.reduce((sum, r) => sum + r.value, 0);
  return (
    <ul className="an-hbar-list">
      {rows.map((row, i) => (
        <li key={row.label} className="an-hbar">
          <div className="an-hbar-row">
            <span className="an-hbar-rank">{String(i + 1).padStart(2, '0')}</span>
            <span className="an-hbar-label" title={row.label}>{row.label}</span>
            {row.hint && <span className="an-hbar-hint">{row.hint}</span>}
            <span className="an-hbar-val">
              {row.value.toLocaleString()}{unit} <small>{total ? Math.round((row.value / total) * 100) : 0}%</small>
            </span>
          </div>
          <div className="an-hbar-track">
            <div className="an-hbar-fill" style={{ width: `${(row.value / max) * 100}%`, '--fill': color } as React.CSSProperties} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ─────────────────────────── Weekday × hour heatmap ─────────────────────────── */

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function Heatmap({ grid, onReset }: { grid: number[][]; onReset?: () => void }) {
  const max = Math.max(1, ...grid.flat());
  const total = grid.flat().reduce((a, b) => a + b, 0);
  let peak = { day: 0, hour: 0, value: 0 };
  grid.forEach((row, d) => row.forEach((v, h) => { if (v > peak.value) peak = { day: d, hour: h, value: v }; }));
  const hourLabel = (h: number) => `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? 'am' : 'pm'}`;

  if (!total) {
    return (
      <div className="an-heat-empty-box">
        <p className="an-empty">No visits recorded for this selected date.</p>
        {onReset && (
          <button type="button" className="an-heat-btn-reset" onClick={onReset}>
            View all dates in page range
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="an-heat-wrap">
      <div className="an-heat" role="table" aria-label="Visits by weekday and hour">
        <span className="an-heat-corner" />
        {Array.from({ length: 24 }, (_, h) => (
          <span key={`h-${h}`} className="an-heat-hour">{h % 3 === 0 ? hourLabel(h) : ''}</span>
        ))}
        {grid.map((row, d) => (
          <div key={WEEKDAYS[d]} className="an-heat-row" role="row">
            <span className="an-heat-day">{WEEKDAYS[d]}</span>
            {row.map((value, h) => (
              <span
                key={h}
                role="cell"
                className="an-heat-cell"
                style={{ '--heat': value ? 0.14 + (value / max) * 0.86 : 0 } as React.CSSProperties}
                title={`${WEEKDAYS[d]} ${hourLabel(h)}: ${value} visit${value === 1 ? '' : 's'}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="an-heat-foot">
        <span>Busiest: <strong>{WEEKDAYS[peak.day]} around {hourLabel(peak.hour)}</strong> ({peak.value} visits)</span>
        <span className="an-heat-scale">Less <i /><i /><i /><i /><i /> More</span>
      </div>
    </div>
  );
}
