'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { WorkspaceHeader } from '@/components/shell/BrandHeader';
import type { GuidedSample } from './data';
import { GuidedWriting } from './GuidedWriting';

/** Chép mẫu route shell: the prompt's sample essay, or a note when it has none yet. */
export function GuidedFlow({ sample }: { sample: (GuidedSample & { source: 'book' | 'hocnoihocviet' }) | null }) {
  const router = useRouter();
  return (
    <div style={{ height: '100%', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <WorkspaceHeader />
      <div style={{ flex: 1, minHeight: 0 }}>
        {sample ? (
          <GuidedWriting sample={sample} textLabel={sample.source === 'book' ? 'Bài mẫu · từ sách' : 'Bài mẫu'} onBack={() => router.push('/copy')} backLabel="Chép mẫu" />
        ) : (
          <main style={{ maxWidth: 520, margin: '96px auto 0', padding: '0 24px', fontFamily: 'var(--font-sans)', color: '#171717' }}>
            <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 10px' }}>Đề này chưa có bài mẫu</h1>
            <p style={{ fontSize: 14.5, lineHeight: 1.6, color: '#525252', margin: '0 0 24px' }}>Bài mẫu cho đề này đang được soạn. Trong lúc chờ, bạn có thể Tự viết với đề này, hoặc chọn một đề khác có bài mẫu.</p>
            <Link href="/copy" className="cl-primary" style={{ display: 'inline-flex', alignItems: 'center', height: 42, padding: '0 18px', borderRadius: 10, color: '#fff', fontSize: 13.5, fontWeight: 600 }}>Về thư viện đề</Link>
          </main>
        )}
      </div>
    </div>
  );
}
