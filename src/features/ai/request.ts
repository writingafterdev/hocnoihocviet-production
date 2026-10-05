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
const WAIT_MS: Record<string, number> = { 'chain-review': 260_000, 'essay-review': 320_000, translate: 70_000, 'vocab-paragraph': 100_000, 'vocab-groups': 100_000 };

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
