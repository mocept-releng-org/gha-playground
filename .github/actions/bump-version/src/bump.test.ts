import { describe, it, expect } from 'vitest';
import { bump, parseVersion } from './bump';

describe('parseVersion', () => {
  it('parses with v prefix', () => {
    const version = parseVersion('v1.2.3');
    expect(version).toEqual({ major: 1, minor: 2, patch: 3 });
  });
  it('parses without v prefix', () => {
    const version = parseVersion('1.2.3');
    expect(version).toEqual({ major: 1, minor: 2, patch: 3 });
  });
  it('throws on garbage', () => {
    expect(() => parseVersion('garbage')).toThrow();
  });
});

describe('bump', () => {
  it('patch increments patch', () => {
    expect(bump('1.2.3', 'patch')).toBe('v1.2.4');
  });
  it('minor resets patch', () => {
    expect(bump('1.2.3', 'minor')).toBe('v1.3.0');
  });
  it('major resets minor+patch', () => {
    expect(bump('1.2.3', 'major')).toBe('v2.0.0');
  });
  it('always prefixes output with v', () => {
    expect(bump('v1.2.3', 'patch')).toBe('v1.2.4');
  });
  it('throws on invalid bump type', () => {
    // @ts-expect-error
    expect(() => bump('1.2.3', 'invalid')).toThrow();
  });
});