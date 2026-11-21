import { describe, expect, it } from 'vitest';
import { money } from './api';

describe('money', () => {
  it('formats USD', () => {
    expect(money(12.5)).toContain('12.50');
  });
});
