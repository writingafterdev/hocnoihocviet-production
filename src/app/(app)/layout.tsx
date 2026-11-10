import { AppSidebar } from '@/components/shell/AppSidebar';

/** Every signed-in page shares the left sidebar. The (app) folder only groups the pages: it is not part of the URL. */
export default function Layout({ children }: { children: React.ReactNode }) {
  return <AppSidebar>{children}</AppSidebar>;
}
