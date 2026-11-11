import type { ReactNode } from 'react';

/**
 * The app frame (AppSidebar) carries the brand, the navigation, the page title and the account. Scrolling pages need
 * nothing more at the top; the full-height workspaces keep a slim strip that shows a status such as "Đã lưu".
 */
export function PageHeader() {
  return null;
}

export function WorkspaceHeader({ status }: { status?: ReactNode }) {
  // Takes no height: the status sits in the page's top padding, so the page's top and bottom gaps stay equal.
  return (
    <header style={{ position: 'relative', width: '100%', maxWidth: 1560, margin: '0 auto', height: 0, flexShrink: 0 }}>
      {status && <div style={{ position: 'absolute', top: 5, right: 32, lineHeight: '14px' }}>{status}</div>}
    </header>
  );
}
