import { formatGhanaianPhone, normalizeGhanaianPhone } from '../lib/phone';

describe('normalizeGhanaianPhone', () => {
  it.each([
    '0241234567',
    '024 123 4567',
    '024-123-4567',
    '+233241234567',
    '233241234567',
    '+233 (24) 123 4567',
  ])('normalises %s', (input) => {
    expect(normalizeGhanaianPhone(input)).toBe('+233241234567');
  });

  it.each(['', '12345', '024123456', '02412345678', '+44241234567'])(
    'rejects %p',
    (input) => {
      expect(normalizeGhanaianPhone(input)).toBeNull();
    },
  );
});

describe('formatGhanaianPhone', () => {
  it('formats E.164 numbers for display', () => {
    expect(formatGhanaianPhone('+233241234567')).toBe('024 123 4567');
  });

  it('leaves unrecognised values untouched', () => {
    expect(formatGhanaianPhone('000-000-0000')).toBe('000-000-0000');
  });
});
