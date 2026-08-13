import { describe, it, expect, vi } from 'vitest';
import { retry } from './retry';

const opts = { maxAttempts: 3, baseMs: 1000, capMs: 30000, jitterMs: 0 };
const alwaysRetryable = () => true;
const neverRetryable = () => false;

// deterministic deps: instant sleep, zero jitter
const fastDeps = { sleep: () => Promise.resolve(), random: () => 0 };

describe('retry', () => {
  it('returns first-try success with empty history', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await retry(fn, opts, alwaysRetryable, fastDeps);

    expect(result.value).toBe('ok');
    expect(result.attempts).toBe(1);
    expect(result.history).toEqual([]);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(1);
  });

  it('retries retryable failures until success', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValueOnce('ok');

    const result = await retry(fn, opts, alwaysRetryable, fastDeps);

    expect(result.value).toBe('ok');
    expect(result.attempts).toBe(3);
    expect(result.history).toHaveLength(2);
    expect(result.history[0].attempt).toBe(1);
    expect(result.history[1].attempt).toBe(2);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('records exponential backoff delays with zero jitter', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('a'))
      .mockRejectedValueOnce(new Error('b'))
      .mockResolvedValueOnce('ok');

    const result = await retry(fn, opts, alwaysRetryable, fastDeps);

    expect(result.history[0].delayMs).toBe(1000);
    expect(result.history[1].delayMs).toBe(2000);
  });

  it('respects capMs', async () => {
    const cappedOpts = { maxAttempts: 5, baseMs: 1000, capMs: 3000, jitterMs: 0 };
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('a'))
      .mockRejectedValueOnce(new Error('b'))
      .mockRejectedValueOnce(new Error('c'))
      .mockRejectedValueOnce(new Error('d'))
      .mockResolvedValueOnce('ok');

    const result = await retry(fn, cappedOpts, alwaysRetryable, fastDeps);

    expect(result.history.map((h) => h.delayMs)).toEqual([1000, 2000, 3000, 3000]);
  });

  it('adds jitter using injected random', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('a'))
      .mockResolvedValueOnce('ok');

    const result = await retry(
      fn,
      { maxAttempts: 2, baseMs: 1000, capMs: 30000, jitterMs: 500 },
      alwaysRetryable,
      { sleep: () => Promise.resolve(), random: () => 0.5 },
    );

    expect(result.history[0].delayMs).toBe(1000 + 250);
  });

  it('throws immediately on terminal error, no sleep', async () => {
    const boom = new Error('terminal');
    const fn = vi.fn().mockRejectedValue(boom);
    const sleep = vi.fn(() => Promise.resolve());

    await expect(
      retry(fn, opts, neverRetryable, { sleep, random: () => 0 }),
    ).rejects.toBe(boom);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('throws original error after maxAttempts', async () => {
    const last = new Error('final');
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('1'))
      .mockRejectedValueOnce(new Error('2'))
      .mockRejectedValueOnce(last);

    await expect(retry(fn, opts, alwaysRetryable, fastDeps)).rejects.toBe(last);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('does not sleep after the final failed attempt', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('x'));
    const sleep = vi.fn(() => Promise.resolve());

    await expect(
      retry(fn, opts, alwaysRetryable, { sleep, random: () => 0 }),
    ).rejects.toThrow();

    // 3 attempts → only 2 sleeps between them
    expect(sleep).toHaveBeenCalledTimes(2);
  });
});
