export type ClassifyResult =
  | { retryable: true;  reason: string }
  | { retryable: false; reason: string };

const RETRYABLE_NETWORK_CODES = new Set([
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'ENOTFOUND',
  'EAI_AGAIN',
  'EPIPE',
]);

function extractStatus(err: Record<string, unknown>): number | undefined {
  const direct = err.status ?? err.statusCode;
  if (typeof direct === 'number') return direct;
  const response = err.response;
  if (response && typeof response === 'object' && 'status' in response) {
    const s = (response as { status: unknown }).status;
    if (typeof s === 'number') return s;
  }
  return undefined;
}

export function classify(err: unknown): ClassifyResult {
  if (err === null || typeof err !== 'object') {
    return { retryable: false, reason: 'unknown-error' };
  }

  const e = err as Record<string, unknown>;

  const code = typeof e.code === 'string' ? e.code : undefined;
  if (code && RETRYABLE_NETWORK_CODES.has(code)) {
    return { retryable: true, reason: `network-error:${code}` };
  }

  const status = extractStatus(e);
  if (typeof status === 'number') {
    if (status === 429) return { retryable: true, reason: 'rate-limited' };
    if (status === 408) return { retryable: true, reason: 'request-timeout' };
    if (status >= 500 && status < 600) return { retryable: true, reason: `server-error:${status}` };
    if (status >= 400 && status < 500) return { retryable: false, reason: `client-error:${status}` };
  }

  const message = typeof e.message === 'string' ? e.message : '';
  if (/ECONNRESET|socket hang up|network/i.test(message)) {
    return { retryable: true, reason: 'network-error:message' };
  }

  return { retryable: false, reason: 'unknown-error' };
}
