'use client';

import { useEffect, useState } from 'react';
import { saveProfile, useProfile, type Profile } from '@/lib/profile';
import { cn } from '@/lib/utils';

const BANDS = [5.5, 6, 6.5, 7, 7.5, 8, 8.5];
const SKIP = 'hnhv-goals-skip';

function BandPick({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[13px] font-medium text-ink-soft">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {BANDS.map((b) => (
          <button key={b} type="button" role="radio" aria-checked={value === b} onClick={() => onChange(b)}
            className={cn('h-10 min-w-[56px] cursor-pointer rounded-lg border-0 px-3 text-[15px] font-semibold tabular-nums transition-colors duration-[var(--duration-fast)]',
              value === b ? 'bg-blue-soft text-blue-deep shadow-[0_0_0_2px_var(--brand-blue-deep)]' : 'bg-paper-2 text-ink hover:bg-blue-soft/60')}>
            {b.toFixed(1)}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * First visit: ask what band the student is aiming for in Writing and Speaking (and when the exam is), once.
 * "Để sau" hides it for this browser; the Tiến độ page keeps a "Đặt mục tiêu" button either way.
 */
export function OnboardingDialog({ forceOpen, onClose }: { forceOpen?: boolean; onClose?: () => void }) {
  const profile = useProfile();
  const [skipped, setSkipped] = useState(true);
  const [w, setW] = useState<number | null>(null);
  const [s, setS] = useState<number | null>(null);
  const [exam, setExam] = useState('');
  const [busy, setBusy] = useState(false);
  const [closing, setClosing] = useState(false);
  useEffect(() => { try { setSkipped(localStorage.getItem(SKIP) === '1'); } catch { setSkipped(false); } }, []);
  useEffect(() => { if (profile) { setW(profile.targetWriting); setS(profile.targetSpeaking); setExam(profile.examDate || ''); } }, [profile]);

  const open = forceOpen ? true : profile === null && !skipped;
  if (!open) return null;

  const close = () => { setClosing(true); setTimeout(() => { setClosing(false); onClose?.(); }, 150); };
  const later = () => { try { localStorage.setItem(SKIP, '1'); } catch { /* private mode */ } setSkipped(true); close(); };
  const save = async () => {
    setBusy(true);
    const p: Profile = { targetWriting: w, targetSpeaking: s, examDate: exam || null };
    try { await saveProfile(p); close(); } catch { /* keep the dialog open so they can retry */ }
    setBusy(false);
  };

  return (
    <div className={'t-modal-back' + (closing ? ' is-closing' : '')} style={{ position: 'fixed', inset: 0, zIndex: 70, display: 'grid', placeItems: 'center', padding: 24, background: 'rgba(20,20,19,.45)' }}>
      <div role="dialog" aria-modal="true" aria-labelledby="goal-title" className="t-modal flex w-full max-w-[560px] flex-col gap-6 rounded-2xl bg-white p-7 shadow-pop">
        <div>
          <h2 id="goal-title" className="m-0 text-xl font-semibold tracking-[-0.01em] text-ink">Bạn muốn đạt band bao nhiêu?</h2>
          <p className="m-0 mt-1 text-sm text-ink-soft">Mình dùng mục tiêu này để chỉ cho bạn còn cách bao xa.</p>
        </div>
        <BandPick label="Writing" value={w} onChange={setW} />
        <BandPick label="Speaking" value={s} onChange={setS} />
        <label className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-ink-soft">Ngày thi (không bắt buộc)</span>
          <input type="date" value={exam} onChange={(e) => setExam(e.target.value)} className="h-10 w-fit rounded-lg border border-line bg-white px-3 text-[15px] text-ink outline-none focus:border-blue-deep" />
        </label>
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={forceOpen ? close : later} className="cl-btn h-9 rounded-[10px] px-3 text-sm font-medium text-ink-soft hover:bg-paper-2">{forceOpen ? 'Đóng' : 'Để sau'}</button>
          <button type="button" onClick={save} disabled={busy || (w === null && s === null)} className="cl-btn cl-primary inline-flex h-9 items-center rounded-[10px] px-4 text-sm font-medium">{busy ? 'Đang lưu…' : 'Lưu mục tiêu'}</button>
        </div>
      </div>
    </div>
  );
}
