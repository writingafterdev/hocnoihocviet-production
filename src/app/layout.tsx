import type { Metadata } from 'next';
// The font ships with the app (Fontsource), so builds never download from Google. One font everywhere: Inter.
import '@fontsource-variable/inter';
import '@fontsource-variable/inter/standard-italic.css';
import './globals.css';
import { Toaster } from '@/components/ui/toast';

export const metadata: Metadata = {
  title: 'hocnoihocviet',
  description: 'Luyện viết IELTS Task 2 theo mạch lập luận, chép mẫu và học từ vựng theo chủ đề.',
  icons: { icon: '/assets/brand/logo-icon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}<Toaster position="bottom-right" /></body>
    </html>
  );
}
