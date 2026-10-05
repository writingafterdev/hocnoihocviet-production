/** Client side of the AI routes (/api/ai/*). */
import { SignedOutError } from '../attempts/store';

export type AiErrorCode = 'not_configured' | 'limit' | 'refused' | 'bad_output' | 'upstream' | 'network' | 'invalid' | 'timeout';

export class AiRequestError extends Error {
  constructor(public code: AiErrorCode) { super(code); }
}

/** What to tell the student when a call fails. */
export const AI_ERROR_TEXT: Record<AiErrorCode, string> = {
  not_configured: 'Phần chấm bằng AI chưa được bật.',
  limit: 'Bạn đã dùng hết lượt hôm nay. Mai quay lại nhé.',
  refused: 'AI không xử lý được nội dung này. Thử sửa lại rồi gửi lại.',
  bad_output: 'AI trả về kết quả lỗi. Thử lại sau ít phút.',
  upstream: 'Máy chủ AI đang bận. Thử lại sau ít phút.',
  network: 'Mạng đang chập chờn. Thử lại nhé.',
  invalid: 'Dữ liệu gửi đi chưa hợp lệ. Tải lại trang rồi thử lại.',
  timeout: 'AI mất quá lâu để trả lời. Thử lại nhé (lượt này không bị tính).',
};

/** How long the browser waits per route before giving up (ms): a bit more than the server's two attempts. */
const WAIT_MS: Record<string, number> = { 'chain-review': 260_000, 'essay-review': 320_000, translate: 70_000, 'vocab-paragraph': 100_000, 'vocab-groups': 30_000 };

export async function postAi<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), WAIT_MS[path] || 120_000);
  try {
    res = await fetch('/api/ai/' + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(body), signal: ctl.signal });
  } catch {
    throw new AiRequestError(ctl.signal.aborted ? 'timeout' : 'network');
  } finally {
    clearTimeout(timer);
  }
  if (res.status === 401) throw new SignedOutError();
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new AiRequestError((data && data.error) || 'upstream');
  return data as T;
}

/**
 * A route that streams the AI's reply (Messages API events) straight through. Returns the reply text and
 * why it stopped; a stream that ends early counts as cut off ("max_tokens"), so a mostly complete reply
 * can still be used.
 */
export async function postAiStream(path: string, body: unknown): Promise<{ text: string; stop: string }> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), WAIT_MS[path] || 120_000);
  try {
    let res: Response;
    try {
      res = await fetch('/api/ai/' + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(body), signal: ctl.signal });
    } catch {
      throw new AiRequestError(ctl.signal.aborted ? 'timeout' : 'network');
    }
    if (res.status === 401) throw new SignedOutError();
    if (!res.ok || !res.body) {
      const data = await res.json().catch(() => null);
      throw new AiRequestError((data && data.error) || 'upstream');
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '', text = '', stop = '';
    const handle = (block: string) => {
      const data = block.split('\n').filter((l) => l.startsWith('data:')).map((l) => l.slice(5).trim()).join('');
      if (!data) return;
      let ev: { type?: string; delta?: { type?: string; text?: string; stop_reason?: string } };
      try { ev = JSON.parse(data); } catch { return; }
      if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta') text += ev.delta.text || '';
      else if (ev.type === 'message_delta' && ev.delta?.stop_reason) stop = ev.delta.stop_reason;
      else if (ev.type === 'error') throw new AiRequestError('upstream');
    };
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let i: number;
        while ((i = buf.indexOf('\n\n')) >= 0) { handle(buf.slice(0, i)); buf = buf.slice(i + 2); }
      }
      if (buf.trim()) handle(buf);
    } catch (e) {
      if (e instanceof AiRequestError) throw e;
      if (!text) throw new AiRequestError(ctl.signal.aborted ? 'timeout' : 'network');
      stop = 'max_tokens'; // broke off mid-reply: keep what arrived if it is complete enough
    }
    if (!text) throw new AiRequestError('upstream');
    if (stop === 'refusal') throw new AiRequestError('refused');
    return { text, stop: stop || 'max_tokens' };
  } finally {
    clearTimeout(timer);
  }
}
