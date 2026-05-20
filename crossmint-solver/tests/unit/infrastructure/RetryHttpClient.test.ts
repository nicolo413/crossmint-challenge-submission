import { classifyHttpStatus } from '../../../src/domain/errors/ApiErrorClassification';
import { resolveDelay } from '../../../src/infrastructure/http/RetryHttpClient';

describe('classifyHttpStatus — retryCondition input', () => {
  it('classifies 429 as transient', () => {
    expect(classifyHttpStatus(429)).toBe('transient');
  });

  it('classifies 500 as transient', () => {
    expect(classifyHttpStatus(500)).toBe('transient');
  });

  it('classifies 503 as transient', () => {
    expect(classifyHttpStatus(503)).toBe('transient');
  });

  it('classifies 400 as permanent', () => {
    expect(classifyHttpStatus(400)).toBe('permanent');
  });

  it('classifies 401 as permanent', () => {
    expect(classifyHttpStatus(401)).toBe('permanent');
  });

  it('classifies 404 as permanent', () => {
    expect(classifyHttpStatus(404)).toBe('permanent');
  });

  it('classifies undefined (no response) as ambiguous', () => {
    expect(classifyHttpStatus(undefined)).toBe('ambiguous');
  });
});

describe('resolveDelay', () => {
  it('returns Retry-After seconds as milliseconds when header is a numeric string', () => {
    expect(resolveDelay('30', 1, 1000)).toBe(30_000);
  });

  it('ignores Retry-After when value is not a valid number or date', () => {
    const delay = resolveDelay('not-a-date', 1, 1000);
    // Falls through to exponential: base = 1000 * 2^0 = 1000, jitter ±25%
    expect(delay).toBeGreaterThanOrEqual(750);
    expect(delay).toBeLessThanOrEqual(1250);
  });

  it('applies exponential backoff without Retry-After', () => {
    // attempt=3, base = 1000 * 2^2 = 4000, jitter ±25% → [3000, 5000]
    const delay = resolveDelay(undefined, 3, 1000);
    expect(delay).toBeGreaterThanOrEqual(3000);
    expect(delay).toBeLessThanOrEqual(5000);
  });

  it('doubles delay on each subsequent attempt', () => {
    // Use a fixed random to test the scaling — sample midpoint (no jitter) by mocking Math.random
    jest.spyOn(Math, 'random').mockReturnValue(0.5); // 0.75 + 0.5*0.5 = 1.0 → no jitter
    const attempt1 = resolveDelay(undefined, 1, 1000); // 1000 * 1 = 1000
    const attempt2 = resolveDelay(undefined, 2, 1000); // 1000 * 2 = 2000
    expect(attempt2).toBeCloseTo(attempt1 * 2, 0);
    jest.restoreAllMocks();
  });
});
