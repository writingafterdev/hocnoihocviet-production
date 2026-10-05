'use client';

import { Fragment, useState } from 'react';
import { CL, CL_CIRC, CL_IMPACT_AREAS, CL_SHAPE_LABEL } from '../constants';
import { chainStatus, extraLensesFor, lensesFor, openIssues, shapeOf } from '../model';
import { useSpec } from '../SpecContext';
import type { Chain, Lens } from '../types';
import { Branches } from './Branches';
import { FindingComposer, FindingRow } from './Findings';
import { ClIcon, ClLabel } from './primitives';
import { StepList } from './StepList';
import type { ReorderBinding } from './useReorder';

export interface FixTarget { id: string; label: string }

export interface ChainCardProps {
  chain: Chain;
  num: number;
  onChange: (c: Chain) => void;
  onDelete: () => void;
  drag: ReorderBinding;
  focused: boolean;
  /** Cause/problem chains a solution chain can link to. */
  targets?: FixTarget[];
}

/** One argument chain: header chips, steps, Scope split, and the "Thử mạch" lens row with findings. */
export function ChainCard({ chain, num, onChange, onDelete, drag, focused, targets = [] }: ChainCardProps) {
  const spec = useSpec();
  const [open, setOpen] = useState(true);
  const [composing, setComposing] = useState<Lens | null>(null);
  const [splitMode, setSplitMode] = useState(false);
  const [more, setMore] = useState(false);
  const shape = shapeOf(spec, chain), verdict = shape === 'verdict', multiQ = spec.questions.length > 1;
  const lenses = lensesFor(spec, chain);
  const extras = extraLensesFor(spec, chain);
  const status = chainStatus(spec, chain);
  const issues = openIssues(chain);
  const nIssues = issues.flags.length + issues.vague.length;
  const stale = chain.check && chain.check.snapshot !== chain.steps.join('||');
  const toneOn = chain.tone === 'benefit';

  const cycleQ = () => {
    const ns = spec.questions.map((q) => q.n);
    const nq = ns[(ns.indexOf(chain.q || 1) + 1) % ns.length];
    onChange({ ...chain, q: nq, tone: chain.tone || 'benefit', fixes: null });
    setComposing(null);
  };
  const tried = (k: string) => (k === 'Scope' ? !!chain.split : chain.findings.some((f) => f.kind === k));
  const onLens = (lens: Lens) => {
    if (lens.kind === 'Scope') { if (!chain.split) { setSplitMode(!splitMode); setComposing(null); } return; }
    setSplitMode(false);
    setComposing(composing && composing.kind === lens.kind ? null : lens);
  };
  const splitAt = (i: number, noun: string) => {
    const rest = chain.steps.slice(i + 1);
    const mk = () => ({ label: '', steps: rest.length ? [...rest] : [''], effect: '' });
    onChange({ ...chain, steps: chain.steps.slice(0, i + 1), split: { at: i, noun, branches: [mk(), mk()] } });
    setSplitMode(false);
  };
  const merge = () => onChange({ ...chain, steps: [...chain.steps, ...chain.split.branches[0].steps.filter(Boolean)], split: null, findings: chain.findings.map((f) => ({ ...f, target: 'all' as const })) });
  const shownLenses = [...lenses, ...extras.filter((l) => more || l.kind === (composing && composing.kind) || tried(l.kind))];

  return (
    <li id={'cl-chain-' + chain.id} {...drag.itemProps} style={{ listStyle: 'none', opacity: drag.isDragging ? 0.45 : 1, transition: 'opacity .15s' }}>
      <div style={{ overflow: 'hidden', borderRadius: 18, border: '1px solid ' + (drag.isOver ? CL.ink5 : focused ? CL.ink : CL.border), boxShadow: focused ? '0 0 0 4px ' + CL.ink1 : 'none', transition: 'border-color .3s, box-shadow .3s', background: '#fff' }}>
        <div onClick={(e) => { if (!(e.target as HTMLElement).closest('button,input,textarea,select')) setOpen(!open); }} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 58, padding: '0 14px', borderBottom: open ? '1px solid ' + CL.ink1 : 'none', cursor: 'pointer' }}>
          <button type="button" className="cl-btn cl-grip" {...drag.handleProps} aria-label="Kéo để sắp xếp" style={{ flexShrink: 0, width: 32, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: CL.ink3, cursor: 'grab' }}><ClIcon name="grip" size={16} /></button>
          {multiQ && <button type="button" className="cl-btn cl-link" title="Đổi câu hỏi mạch này trả lời" onClick={cycleQ} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontFamily: CL.sans, fontSize: 10.5, fontWeight: 600, color: CL.ink5, whiteSpace: 'nowrap', flexShrink: 0 }}>câu <span style={{ fontSize: 14, lineHeight: 1 }}>{CL_CIRC[(chain.q || 1) - 1]}</span></button>}
          {!verdict && <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 5, border: '1px solid ' + CL.ink2, padding: '4px 8px', fontFamily: CL.sans, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: CL.ink7, whiteSpace: 'nowrap' }}><span style={{ width: 8, height: 8, borderRadius: 2, background: CL.ink5 }} />{CL_SHAPE_LABEL[shape]}</span>}
          {verdict && (
            <button type="button" className="cl-btn" title="Đổi phía" onClick={() => onChange({ ...chain, tone: toneOn ? 'cost' : 'benefit' })} style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 5, border: '1px solid ' + CL.ink2, padding: '4px 8px', fontFamily: CL.sans, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: toneOn ? CL.greenText : CL.redText }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: toneOn ? CL.mint : CL.red }} />{toneOn ? 'Lợi ích' : 'Tác hại'}
            </button>
          )}
          <input value={chain.title} onChange={(e) => onChange({ ...chain, title: e.target.value })} placeholder="Mạch chưa đặt tên" aria-label="Tên mạch" style={{ flex: 1, minWidth: 60, border: 'none', outline: 'none', background: 'transparent', fontFamily: CL.sans, fontSize: 13.5, fontWeight: 600, color: CL.ink, cursor: 'text' }} />
          {nIssues > 0 && !stale && <span style={{ flexShrink: 0, borderRadius: 5, padding: '4px 8px', background: CL.redSoft, color: CL.redText, fontFamily: CL.sans, fontSize: 10.5, fontWeight: 600, whiteSpace: 'nowrap' }}>{nIssues} chỗ cần xem</span>}
          <span style={{ flexShrink: 0, borderRadius: 5, padding: '4px 8px', background: status.bg, color: status.fg, fontFamily: CL.sans, fontSize: 10.5, fontWeight: 600, whiteSpace: 'nowrap' }}>{status.label}</span>
          <button type="button" className="cl-btn" onClick={() => setOpen(!open)} aria-label={open ? 'Thu gọn' : 'Mở rộng'} aria-expanded={open} style={{ flexShrink: 0, width: 36, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: CL.ink5, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}><ClIcon name="chev" size={16} /></button>
        </div>
        {open && (
          <Fragment>
            <div style={{ padding: '24px 32px 22px 35px' }}>
              <AreaPicker value={chain.area} onChange={(area) => onChange({ ...chain, area })} />
              {shape === 'solution' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, fontFamily: CL.sans, fontSize: 12, color: CL.ink6 }}>
                  <span style={{ fontWeight: 600, color: CL.ink }}>Xử lý:</span>
                  {targets.length ? (
                    <select value={chain.fixes || ''} onChange={(e) => onChange({ ...chain, fixes: e.target.value || null })} style={{ minWidth: 0, maxWidth: '100%', borderRadius: 5, border: '1px solid ' + (chain.fixes ? CL.ink3 : CL.ink2), background: '#fff', padding: '5px 8px', fontFamily: CL.sans, fontSize: 12, fontWeight: 600, color: chain.fixes ? CL.ink : CL.ink5 }}>
                      <option value="">Chọn nguyên nhân / vấn đề nó xử lý…</option>
                      {targets.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                  ) : <span style={{ color: CL.ink5 }}>Thêm một mạch nguyên nhân hoặc vấn đề trước.</span>}
                </div>
              )}
              {splitMode && <p style={{ margin: '0 0 14px', fontFamily: CL.sans, fontSize: 12, color: CL.yellowText, background: CL.yellowSoft, borderRadius: 5, padding: '8px 12px' }}>Chọn bước chứa danh từ bạn muốn đổi điều kiện. Mạch sẽ tách ngay sau bước đó.</p>}
              <StepList steps={chain.steps} onChange={(steps) => onChange({ ...chain, steps })} firstIsDriver splitMode={splitMode} onSplitAt={splitAt} idPrefix={chain.id} jumps={splitMode ? [] : issues.flags.map((f) => f.at)} vague={splitMode ? [] : issues.vague} />
              {chain.split && <Branches verdict={verdict} num={num} split={chain.split} onChange={(split) => onChange({ ...chain, split })} onMerge={merge} />}
            </div>
            <div style={{ borderTop: '1px solid ' + CL.ink1, background: CL.panel, padding: '13px 22px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: chain.findings.length || composing ? 12 : 0 }}>
                <ClLabel style={{ marginRight: 6 }}>Thử mạch</ClLabel>
                {shownLenses.map((l) => {
                  const active = (composing && composing.kind === l.kind) || (l.kind === 'Scope' && splitMode);
                  const done = tried(l.kind);
                  return (
                    <button key={l.kind} type="button" className="cl-btn cl-lens" onClick={() => onLens(l)} aria-pressed={active} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, borderRadius: 5, border: '1px solid ' + (active ? CL.ink : CL.ink2), background: active ? CL.ink : '#fff', color: active ? '#fff' : done ? CL.ink : CL.ink5, fontFamily: CL.sans, fontSize: 11, fontWeight: 600, padding: '5px 10px' }}>
                      {done && !active && <ClIcon name="check" size={11} color={CL.green} />}{l.kind}
                    </button>
                  );
                })}
                {extras.length > 0 && <button type="button" className="cl-btn cl-link" onClick={() => setMore(!more)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginLeft: 4, fontFamily: CL.sans, fontSize: 11, fontWeight: 600, color: CL.ink5, padding: '5px 4px' }}>{more ? 'Thu gọn' : <Fragment><ClIcon name="plus" size={11} />Thêm góc nhìn</Fragment>}</button>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {composing && <FindingComposer verdict={verdict} key={composing.kind} lens={composing} num={num} split={chain.split} onCancel={() => setComposing(null)} onSave={(f) => { onChange({ ...chain, findings: [...chain.findings, { ...f, id: 'f' + Date.now(), side: null }] }); setComposing(null); }} />}
                {chain.findings.map((f) => <FindingRow verdict={verdict} key={f.id} f={f} split={chain.split} onDelete={() => onChange({ ...chain, findings: chain.findings.filter((x) => x.id !== f.id) })} />)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                <button type="button" className="cl-btn cl-link" onClick={onDelete} style={{ fontFamily: CL.sans, fontSize: 10.5, fontWeight: 600, color: CL.ink4 }}>Xoá mạch</button>
              </div>
            </div>
          </Fragment>
        )}
      </div>
    </li>
  );
}

/**
 * "Vùng tác động": the 5 impact areas as chips. Picking several builds a path in order (Năng lực → An toàn);
 * the value stays a plain string, as before, so older chains and the AI review read it unchanged.
 */
function AreaPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const parts = (value || '').split('→').map((x) => x.trim()).filter(Boolean);
  const known = new Set(CL_IMPACT_AREAS.map(([l]) => l));
  const toggle = (l: string) => onChange((parts.includes(l) ? parts.filter((x) => x !== l) : [...parts, l]).join(' → '));
  return (
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
      <span style={{ marginRight: 4, fontFamily: CL.sans, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: CL.ink4 }}>Vùng tác động</span>
      {CL_IMPACT_AREAS.map(([l, t]) => {
        const k = parts.indexOf(l), on = k >= 0;
        return (
          <button key={l} type="button" className="cl-btn" onClick={() => toggle(l)} aria-pressed={on} title={t}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, borderRadius: 999, border: '1px solid ' + (on ? CL.ink : CL.ink2), background: on ? CL.ink : '#fff', color: on ? '#fff' : CL.ink6, padding: '4px 10px', fontFamily: CL.sans, fontSize: 11.5, fontWeight: 600 }}>
            {on && parts.length > 1 && <span style={{ fontSize: 10, opacity: 0.7 }}>{k + 1}</span>}{l}
          </button>
        );
      })}
      {/* Free text from older chains that isn't one of the 5 areas stays visible until removed. */}
      {parts.filter((x) => !known.has(x)).map((x) => (
        <button key={x} type="button" className="cl-btn" onClick={() => toggle(x)} title="Bỏ" style={{ borderRadius: 999, border: '1px dashed ' + CL.ink3, background: '#fff', color: CL.ink5, padding: '4px 10px', fontFamily: CL.sans, fontSize: 11.5 }}>{x} ×</button>
      ))}
    </div>
  );
}
