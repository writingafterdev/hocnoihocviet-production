'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/shell/BrandHeader';
import { OnboardingDialog } from '@/components/shell/OnboardingDialog';
import { useProfile } from '@/lib/profile';
import { bandOf } from '../desk/scoring';
import { attemptStore, SignedOutError, type Attempt } from '../attempts/store';
import { ProgressView, type Point, type ProgressData } from './ProgressView';

/** "Tiến độ": loads the signed-in student's attempts and goals and hands them to the view. */
export function ProgressPage() {
  const router = useRouter();
  const profile = useProfile();
  const [list, setList] = useState<Attempt[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);

  useEffect(() => {
    attemptStore.list().then(setList, (e) => { if (e instanceof SignedOutError) router.replace('/login?next=/progress'); else setFailed(true); });
  }, [router]);

  const data = useMemo<ProgressData | null>(() => {
    if (!list) return null;
    const writing: Point[] = list.filter((a) => a.essay?.review && a.essay.review.source !== 'sample').sort((a, b) => a.updatedAt - b.updatedAt).map((a) => {
      const s = a.essay.review!.scores;
      return { t: a.updatedAt, band: bandOf(s.tr, s.cc, s.lr, s.gra), scores: { tr: s.tr, cc: s.cc, lr: s.lr, gra: s.gra } };
    });
    return { points: { writing, speaking: [] }, activity: list.flatMap((a) => [a.createdAt, a.updatedAt]), goals: profile ?? null };
  }, [list, profile]);

  return (
    <div style={{ minHeight: '100%', background: '#fff' }}>
      <PageHeader />
      <main style={{ maxWidth: 1560, margin: '0 auto', padding: '24px 32px 24px' }}>
        {failed ? <p className="m-0 text-sm text-tomato-deep">Chưa tải được dữ liệu. Tải lại trang để thử lại.</p>
          : !data ? <p className="m-0 text-sm text-ink-soft">Đang tải…</p>
          : <ProgressView data={data} onEditGoal={() => setGoalOpen(true)} />}
      </main>
      {goalOpen && <OnboardingDialog forceOpen onClose={() => setGoalOpen(false)} />}
    </div>
  );
}
