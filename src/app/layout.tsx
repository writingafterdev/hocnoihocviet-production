import type { Metadata } from 'next';
// Fonts ship with the app (Fontsource), so builds never download from Google. Family names match the design tokens.
import '@fontsource/be-vietnam-pro/400.css';
import '@fontsource/be-vietnam-pro/400-italic.css';
import '@fontsource/be-vietnam-pro/500.css';
import '@fontsource/be-vietnam-pro/600.css';
import '@fontsource/be-vietnam-pro/700.css';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/400-italic.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/lora/400.css';
import '@fontsource/lora/400-italic.css';
import '@fontsource/lora/500.css';
import '@fontsource/lora/500-italic.css';
import '@fontsource/lora/600.css';
import '@fontsource/lora/700.css';
import '@fontsource/newsreader/400.css';
import '@fontsource/newsreader/400-italic.css';
import '@fontsource/newsreader/500.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'hocnoihocviet',
  description: 'Luyện viết IELTS Task 2 theo mạch lập luận, chép mẫu và học từ vựng theo chủ đề.',
  icons: { icon: '/assets/brand/logo-icon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
