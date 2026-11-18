import { Skeleton } from '@/components/base/skeleton/skeleton';

const Bone = ({ w = '100%', h = 11, r }: { w?: number | string; h?: number; r?: number }) => <Skeleton shape="text" style={{ width: w, height: h, ...(r ? { borderRadius: r } : {}) }} />;
const card = { borderRadius: 12, border: '1px solid #EBEBEB', background: '#fff' } as const;

/** A page on its way: the illustration tile and title, then a grid of cards (the shape most pages share). */
export function PageBone() {
  return (
    <div role="status" aria-label="Đang mở trang" className="co-skel-in" style={{ maxWidth: 1560, margin: '0 auto', padding: '24px 32px', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, paddingBottom: 24, borderBottom: '1px solid #F0F0F0' }}>
        <Bone w={88} h={88} r={14} />
        <span style={{ display: 'flex', flexDirection: 'column', gap: 10 }}><Bone w={90} /><Bone w={260} h={30} /></span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, marginTop: 24 }}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ ...card, overflow: 'hidden' }}>
            <Bone h={120} r={0} />
            <span style={{ display: 'flex', flexDirection: 'column', gap: 9, padding: 16 }}><Bone w={80} /><Bone w="75%" h={15} /><Bone w="90%" /></span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** A writing workspace on its way: the toolbar, then the mạch ý, the essay and the side panel. */
export function WorkspaceBone() {
  return (
    <div role="status" aria-label="Đang mở bài" className="co-skel-in" style={{ flex: 1, minHeight: 0, width: '100%', maxWidth: 1560, margin: '0 auto', padding: '20px 32px 24px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Bone w={90} h={28} r={8} /><Bone w={110} h={28} r={8} />
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}><Bone w={60} h={34} r={10} /><Bone w={90} h={34} r={10} /></span>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.2fr) minmax(0,1fr)', gap: 16 }}>
        {[[0.9, 0.7, 0.8, 0.6], [0.95, 0.9, 0.85, 0.92, 0.7, 0.88, 0.6], [0.5, 0.9, 0.8]].map((col, i) => (
          <div key={i} style={{ ...card, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {col.map((w, k) => <Bone key={k} w={w * 100 + '%'} h={k ? 12 : 16} />)}
          </div>
        ))}
      </div>
    </div>
  );
}
