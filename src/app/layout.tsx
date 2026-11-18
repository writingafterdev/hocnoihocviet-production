import type { Metadata } from 'next';
// The font ships with the app (Fontsource), so builds never download from Google. One font everywhere: Inter.
import '@fontsource-variable/inter';
import '@fontsource-variable/inter/standard-italic.css';
import './globals.css';
import { Toaster } from '@/components/ui/toast';

export const metadata: Metadata = {
  title: 'hocnoihocviet',
  description: 'Luyện viết IELTS Task 2 theo mạch lập luận, chép mẫu và học từ vựng theo chủ đề.',
  // The H being placed by a hand, from the "Học Nói Học Viết" wordmark: SVG for browsers that take it, PNG for the rest.
  icons: {
    icon: [{ url: '/assets/brand/logo-mark.svg', type: 'image/svg+xml' }, { url: '/assets/brand/logo-mark-64.png', sizes: '64x64', type: 'image/png' }],
    apple: '/assets/brand/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}<Toaster position="bottom-right" /></body>
    </html>
  );
}
