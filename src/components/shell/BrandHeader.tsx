import type { ReactNode } from 'react';

/**
 * The app frame (AppSidebar) carries the brand, the navigation, the page title and the account. Scrolling pages need
 * nothing more at the top; the full-height workspaces keep a slim strip that shows a status such as "Đã lưu".
 */
export function PageHeader() {
  return null;
}

export function WorkspaceHeader({ status }: { status?: ReactNode }) {
  return (
    <header style={{ width: '100%', maxWidth: 1710, margin: '0 auto', padding: '8px 40px 0', flexShrink: 0, minHeight: 30, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
      {status}
    </header>
  );
}
