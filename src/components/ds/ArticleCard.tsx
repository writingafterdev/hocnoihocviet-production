import { Volume2 } from 'lucide-react';

export interface ArticleCardProps {
  image?: string;
  title: string;
  excerpt: string;
  author?: string;
  hasAudio?: boolean;
  onClick?: () => void;
}

/** ArticleCard — editorial article-feed card. */
export function ArticleCard({ image, title, excerpt, author, hasAudio, onClick }: ArticleCardProps) {
  return (
    <div onClick={onClick} style={{ display: 'flex', flexDirection: 'column', cursor: onClick ? 'pointer' : 'default', fontFamily: 'var(--font-sans)' }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '3/2', overflow: 'hidden', background: 'var(--ink-100)' }}>
        {image && <img src={image} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        {hasAudio && (
          <div style={{ position: 'absolute', bottom: 8, right: 8, background: '#fff', width: 24, height: 24, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-xs)' }}><Volume2 size={14} strokeWidth={2.5} /></div>
        )}
      </div>
      <div style={{ paddingTop: 16 }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, lineHeight: 1.2, letterSpacing: '-0.01em', color: 'var(--text-primary)', margin: '0 0 8px' }}>{title}</h3>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: 14, lineHeight: 1.5, color: 'var(--text-secondary)', margin: '0 0 16px' }}>{excerpt}</p>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>By {author || 'The Editors'}</span>
      </div>
    </div>
  );
}
