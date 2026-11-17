import type { ChainKind } from '@/lib/ai/chain-coach';

/** What the two ends of a mạch ý are called on screen, by its kind. The AI's replies use the same words (TERMS in prompts.ts). */
export const ENDS: Record<ChainKind, { start: string; end: string }> = {
  cause: { start: 'Nguyên nhân', end: 'Kết quả' },
  impact: { start: 'Sự việc', end: 'Tác động' },
  solution: { start: 'Giải pháp', end: 'Vấn đề được giải quyết' },
};
