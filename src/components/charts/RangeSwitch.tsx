'use client';

import { SegmentedControl, SegmentedControlItem } from '@/components/base/segmented-control/segmented-control';

/** The pill switcher at the top right of a chart ("Tuần / Tháng / Năm"). */
export function RangeSwitch<T extends string>({ options, value, onChange, label = 'Khoảng thời gian' }: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void; label?: string }) {
  return (
    <SegmentedControl aria-label={label} selectedKeys={[value]} onSelectionChange={(keys) => { const k = [...keys][0]; if (k !== undefined) onChange(String(k) as T); }}>
      {options.map((o) => <SegmentedControlItem key={o.id} id={o.id}>{o.label}</SegmentedControlItem>)}
    </SegmentedControl>
  );
}
