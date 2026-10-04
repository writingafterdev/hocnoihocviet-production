import type { Metadata } from 'next';
import { Be_Vietnam_Pro, DM_Sans, Lora, Newsreader } from 'next/font/google';
import './globals.css';

export const metadata: Metadata = {
  title: 'hocnoihocviet',
  description: 'Luyện viết IELTS Task 2 theo mạch lập luận, chép mẫu và học từ vựng theo chủ đề.',
  icons: { icon: '/assets/brand/logo-icon.svg' },
};

// Self-hosted at build time; the token files map --font-* onto these variables (see globals.css).
const sans = Be_Vietnam_Pro({ subsets: ['latin', 'vietnamese'], weight: ['400', '500', '600', '700'], style: ['normal', 'italic'], variable: '--nf-sans', display: 'swap' });
const market = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], style: ['normal', 'italic'], variable: '--nf-market', display: 'swap' });
const serif = Lora({ subsets: ['latin', 'vietnamese'], weight: ['400', '500', '600', '700'], style: ['normal', 'italic'], variable: '--nf-serif', display: 'swap' });
const heading = Newsreader({ subsets: ['latin'], weight: ['400', '500'], style: ['normal', 'italic'], variable: '--nf-heading', display: 'swap' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={[sans.variable, market.variable, serif.variable, heading.variable].join(' ')}>
      <body>{children}</body>
    </html>
  );
}
