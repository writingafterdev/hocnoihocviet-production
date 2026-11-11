'use client';

import Link from 'next/link';
import { Fragment } from 'react';
import { CL } from '../constants';

export interface Step { label: string; href: string }

/** The ① Dựng mạch · ② Viết bài bar of a "Tự viết" attempt. Every step stays reachable. */
export function StepNav({ steps, current }: { steps: Step[]; current: number }) {
  return (
    <nav aria-label="Các bước" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {steps.map((s, i) => {
        const on = i === current;
        const st: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', minHeight: 30, borderRadius: 8, padding: '0 12px', fontFamily: CL.sans, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', textDecoration: 'none', border: 'none', boxShadow: on ? 'none' : '0 0 0 1px rgba(0,0,0,0.1)', background: on ? '#EEF3FC' : '#fff', color: on ? '#2F62C4' : CL.ink6 };
        return (
          <Fragment key={s.href}>
            {i > 0 && <span aria-hidden="true" style={{ width: 14, height: 1, background: CL.ink2 }} />}
            {on ? <span aria-current="step" style={st}>{s.label}</span> : <Link href={s.href} className="cl-btn" style={st}>{s.label}</Link>}
          </Fragment>
        );
      })}
    </nav>
  );
}
