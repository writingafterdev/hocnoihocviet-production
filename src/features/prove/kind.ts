import { KIND_LABEL, type Statement } from '@/content/statements';
import { CL } from '../chainlab/constants';

/** A statement's type tag: its label and colours (impact splits into good and bad). Shared by the drill and the library. */
export function kindChip(s: Pick<Statement, 'kind' | 'tone'>) {
  if (s.kind === 'cause') return { label: KIND_LABEL.cause, bg: '#FFF0EB', fg: '#B33A1A' };
  if (s.kind === 'solution') return { label: KIND_LABEL.solution, bg: '#E4F5FA', fg: '#17667A' };
  return s.tone === 'cost' ? { label: 'Tác động · hại', bg: CL.redSoft, fg: CL.redText } : { label: 'Tác động · lợi', bg: CL.mintSoft, fg: CL.greenText };
}
