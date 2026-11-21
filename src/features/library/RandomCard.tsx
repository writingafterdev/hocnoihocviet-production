'use client';

import { RiShuffleLine } from '@remixicon/react';

/**
 * The "random pick" card at the top of every library (Luyện viết, Chép mẫu, Phát triển ý, Nghĩ ý): the app's Pro
 * look (.pro-fill: the moving brand gradient under a fine grain) with the treasure-chest drawing on a white tile.
 */
export function RandomCard({ label, sub, onClick, disabled }: { label: string; sub?: string; onClick: () => void; disabled?: boolean }) {
  return (
    <span className="pro-fill" style={{ display: 'flex', width: '100%', opacity: disabled ? 0.6 : 1 }}>
      <button type="button" onClick={onClick} disabled={disabled} className="pl-card t-card-hover" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16, padding: 12, textAlign: 'left', fontFamily: 'var(--font-sans)', border: 'none', cursor: disabled ? 'default' : 'pointer', borderRadius: 12 }}>
        <div style={{ width: 136, height: 72, borderRadius: 8, background: 'rgba(255,255,255,0.9)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/illustrations/scuba-diver-opening-treasure-chest-of-opportunities.svg" alt="" style={{ width: 64, height: 64, objectFit: 'contain', mixBlendMode: 'multiply' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>{label}</p>
          {sub && <p style={{ margin: '2px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.88)', lineHeight: 1.4 }}>{sub}</p>}
        </div>
        <RiShuffleLine size={20} style={{ flexShrink: 0, marginRight: 8, color: '#fff' }} />
      </button>
    </span>
  );
}
