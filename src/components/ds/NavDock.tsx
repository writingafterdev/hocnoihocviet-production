'use client';

export interface NavItem { id: string; label: string }

const DEFAULT_ITEMS: NavItem[] = [
  { id: 'feed', label: 'Trang chủ' },
  { id: 'library', label: 'Học liệu' },
  { id: 'saved', label: 'Đã lưu' },
  { id: 'stats', label: 'Tiến độ' },
  { id: 'profile', label: 'Hồ sơ' },
];

/** NavDock — floating pill navigation with an active-item fill. */
export function NavDock({ items = DEFAULT_ITEMS, activeId = 'feed', onSelect }: { items?: NavItem[]; activeId?: string; onSelect?: (id: string) => void }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--gray-0)', border: '1px solid var(--gray-200)', borderRadius: 16, padding: 6, boxShadow: 'var(--shadow-nav)' }}>
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect && onSelect(item.id)}
            title={item.label}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, height: 44, padding: '0 14px', border: 'none', cursor: 'pointer',
              borderRadius: 12, fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500,
              background: isActive ? 'var(--gray-900)' : 'transparent',
              color: isActive ? 'var(--gray-0)' : 'var(--gray-500)',
              transition: 'background var(--duration-slow) var(--ease-default), color var(--duration-slow) var(--ease-default)',
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
