import { describe, it, expect } from 'vitest';
import { classify } from './classify';

describe('classify', () => {
  it('non-object errors are terminal', () => {
    expect(classify(null)).toEqual({ retryable: false, reason: 'unknown-error' });
    expect(classify(undefined)).toEqual({ retryable: false, reason: 'unknown-error' });
    expect(classify('boom')).toEqual({ retryable: false, reason: 'unknown-error' });
    expect(classify(42)).toEqual({ retryable: false, reason: 'unknown-error' });
  });

  it('ECONNRESET is retryable', () => {
    const err = Object.assign(new Error('kaboom'), { code: 'ECONNRESET' });
    expect(classify(err)).toEqual({ retryable: true, reason: 'network-error:ECONNRESET' });
  });

  it.each(['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN', 'EPIPE'])(
    '%s is retryable',
    (code) => {
      const err = Object.assign(new Error('x'), { code });
      expect(classify(err)).toEqual({ retryable: true, reason: `network-error:${code}` });
    },
  );

  it('429 is rate-limited', () => {
    expect(classify({ status: 429 })).toEqual({ retryable: true, reason: 'rate-limited' });
  });

  it('408 is request-timeout', () => {
    expect(classify({ statusCode: 408 })).toEqual({ retryable: true, reason: 'request-timeout' });
  });

  it.each([500, 502, 503, 504, 599])('%d is retryable server-error', (status) => {
    expect(classify({ status })).toEqual({ retryable: true, reason: `server-error:${status}` });
  });

  it.each([400, 401, 403, 404, 422])('%d is terminal client-error', (status) => {
    expect(classify({ status })).toEqual({ retryable: false, reason: `client-error:${status}` });
  });

  it('reads status from err.response.status', () => {
    expect(classify({ response: { status: 503 } })).toEqual({
      retryable: true,
      reason: 'server-error:503',
    });
  });

  it('prefers direct status over response.status', () => {
    expect(classify({ status: 500, response: { status: 400 } })).toEqual({
      retryable: true,
      reason: 'server-error:500',
    });
  });

  it('message-sniffed network errors are retryable', () => {
    expect(classify(new Error('socket hang up'))).toEqual({
      retryable: true,
      reason: 'network-error:message',
    });
    expect(classify(new Error('unexpected network failure'))).toEqual({
      retryable: true,
      reason: 'network-error:message',
    });
  });

  it('unknown Error subclasses fall through to terminal', () => {
    expect(classify(new Error('validation failed'))).toEqual({
      retryable: false,
      reason: 'unknown-error',
    });
  });
});
