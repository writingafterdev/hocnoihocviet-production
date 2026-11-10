import type { ReactNode } from 'react';

/**
 * Pages in the app share the left sidebar, which carries the logo, the navigation and the account.
 * These two keep their place at the top of each screen: an empty strip for scrolling pages (where the sidebar's fold
 * button sits), and for the full-height workspaces a slim strip that also shows a status such as "Đã lưu".
 */
export function PageHeader() {
  return <div className="h-12" aria-hidden="true" />;
}

export function WorkspaceHeader({ status }: { status?: ReactNode }) {
  return (
    <header style={{ width: '100%', maxWidth: 1710, margin: '0 auto', padding: '10px 40px 4px 52px', flexShrink: 0, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
      {status}
    </header>
  );
}
