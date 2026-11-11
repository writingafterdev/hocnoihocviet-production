import { CHART, SERIES } from './palette';

export interface HBarItem { label: string; value: number; max?: number; color?: string; text?: string }

/** Horizontal bars with the label above and the figure on the right (BRIX "Age and gender" / "Browser usage"). */
export function HBars({ items, max }: { items: HBarItem[]; max?: number }) {
  const top = max ?? Math.max(1, ...items.map((i) => i.max ?? i.value));
  return (
    <ul className="m-0 flex list-none flex-col gap-4 p-0">
      {items.map((it, i) => {
        const pct = Math.max(2, Math.min(100, (it.value / (it.max ?? top)) * 100));
        return (
          <li key={it.label} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3 text-[14px]">
              <span className="truncate text-ink-soft">{it.label}</span>
              <span className="font-semibold text-ink tabular-nums">{it.text ?? it.value}</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full" style={{ background: CHART.track }}>
              <div className="h-full rounded-full transition-[width] duration-[var(--duration-slow)] ease-[var(--ease-smooth-out)]" style={{ width: pct + '%', background: it.color || SERIES[i % SERIES.length] }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
