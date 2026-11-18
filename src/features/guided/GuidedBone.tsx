'use client';

import { Skeleton } from '@/components/base/skeleton/skeleton';
import { ThinkingLoader } from '@/components/ui/thinking-loader';
import { CL } from '../chainlab/constants';

const Bone = ({ w = '100%', h = 11 }: { w?: number | string; h?: number }) => <Skeleton shape="text" style={{ width: w, height: h }} />;
const card = { borderRadius: 12, border: '1px solid ' + CL.border, background: '#fff' };

/** The shape of the guided-writing page while its paragraph is being written: sample on the left, the sentence to write on the right. */
export function GuidedBone({ phases }: { phases: string[] }) {
  return (
    <div className="co-skel-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', maxWidth: 1560, margin: '0 auto', padding: '24px 32px 24px', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', minHeight: 42, paddingBottom: 12 }}>
        <ThinkingLoader phases={phases} interval={2200} />
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 26 }}>
        <aside style={{ ...card, padding: '26px 26px 30px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Bone w={90} />
          {['96%', '88%', '92%', '70%', '94%', '82%', '60%'].map((w, i) => <Bone key={i} w={w} h={14} />)}
        </aside>
        <main style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 2 }}>
          <section style={{ ...card, padding: '28px 26px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Bone w={110} />
            <Bone w="80%" h={16} />
            <span style={{ display: 'flex', gap: 6 }}><Bone w={86} h={24} /><Bone w={110} h={24} /></span>
          </section>
          <div style={{ ...card, height: 96 }} />
        </main>
      </div>
    </div>
  );
}
