import type { CSSProperties } from 'react';

/** Words in a text, counted the way ScanText splits them. */
export const wordCount = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0);

/**
 * Text the AI is reading: it sits faded and its words come into full view one after another, then the whole text fades
 * back and the reading starts over (until the result arrives and the caller shows the plain text again). Several pieces
 * read as one text pass `offset` (words before this piece) and `total` (words in the whole reading), so the reading
 * flows from one piece into the next. The look is `.scan-read` in globals.css; reduced motion shows it faded and still.
 */
export function ScanText({ text, offset = 0, total }: { text: string; offset?: number; total?: number }) {
  const n = Math.max(1, total ?? wordCount(text));
  // About 14 words a second for short texts; long ones (an essay) read faster so one pass stays near 12 s.
  const step = Math.min(0.07, 10 / n);
  const duration = ((n + 14) * step) / 0.8;
  let k = 0;
  return (
    <>
      {text.split(/(\s+)/).map((part, i) => {
        if (!part || /^\s+$/.test(part)) return part;
        const style = { animationDuration: duration.toFixed(2) + 's', animationDelay: ((offset + k++) * step).toFixed(2) + 's' } as CSSProperties;
        return <span key={i} className="scan-read" style={style}>{part}</span>;
      })}
    </>
  );
}
