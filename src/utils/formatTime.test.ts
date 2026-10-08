import { describe, it, expect } from 'vitest';
import { formatTimeToLocale } from './formatTime';

describe('formatTimeToLocale', () => {
  it('should format time string to locale format', () => {
    const result = formatTimeToLocale('14:30');
    // The result should be a formatted time (exact format depends on locale)
    expect(result).toBeTruthy();
    expect(result).not.toBe('??');
  });

  it('should handle HH:MM:SS format', () => {
    const result = formatTimeToLocale('09:15:00');
    expect(result).toBeTruthy();
    expect(result).not.toBe('??');
  });

  it('should return ?? for undefined', () => {
    const result = formatTimeToLocale(undefined);
    expect(result).toBe('??');
  });

  it('should return ?? for empty string', () => {
    const result = formatTimeToLocale('');
    expect(result).toBe('??');
  });

  it('should return original string for invalid format', () => {
    const result = formatTimeToLocale('invalid');
    expect(result).toBe('invalid');
  });

  it('should handle edge cases like midnight', () => {
    const result = formatTimeToLocale('00:00');
    expect(result).toBeTruthy();
  });

  it('should handle edge cases like noon', () => {
    const result = formatTimeToLocale('12:00');
    expect(result).toBeTruthy();
  });
});
