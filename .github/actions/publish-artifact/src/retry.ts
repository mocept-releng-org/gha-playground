export interface RetryOpts {
  maxAttempts: number;   // total attempts including the first (min 1)
  baseMs: number;        // initial backoff, e.g. 1000
  capMs: number;         // max backoff between any two attempts, e.g. 30000
  jitterMs: number;      // random 0..jitterMs added to each backoff
}

export interface Attempt {
  attempt: number;       // 1-indexed
  error: unknown;
  delayMs: number;       // how long we waited AFTER this attempt failed
}

export interface RetryResult<T> {
  value: T;
  attempts: number;      // 1 if succeeded on first try
  history: Attempt[];    // failed-then-retried attempts; empty on first-try success
}

export type Sleep = (ms: number) => Promise<void>;
export type Random = () => number;  // returns [0, 1)
export type IsRetryable = (err: unknown) => boolean;

export async function retry<T>(
  fn: (attempt: number) => Promise<T>,
  opts: RetryOpts,
  isRetryable: IsRetryable,
  deps?: { sleep?: Sleep; random?: Random }
): Promise<RetryResult<T>> {
  const sleep = deps?.sleep ?? ((ms: number) => new Promise(resolve => setTimeout(resolve, ms)));
  const random = deps?.random ?? Math.random;

  const history: Attempt[] = [];
  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      const value = await fn(attempt);
      return { value, attempts: attempt, history };
    } catch (err) {
      if (attempt === opts.maxAttempts || !isRetryable(err)) {
        throw err;
      }
      const delayMs = Math.min(opts.capMs, opts.baseMs * 2 ** (attempt - 1)) + random() * opts.jitterMs;
      history.push({ attempt, error: err, delayMs });
      await sleep(delayMs);
    }
  }
  throw new Error('retry: unreachable — loop exited without return or throw');
}