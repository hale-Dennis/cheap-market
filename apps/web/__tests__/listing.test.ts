import {
  cedisToPesewas,
  imageFileError,
  oneYearAgo,
  today,
} from '../lib/validation/listing';

describe('cedisToPesewas', () => {
  it.each([
    ['15', 1500],
    ['15.5', 1550],
    ['15.50', 1550],
    ['0.01', 1],
    ['19.99', 1999],
    ['1000000', 100_000_000],
  ])('converts %p to %p without float rounding', (input, expected) => {
    expect(cedisToPesewas(input)).toBe(expected);
  });
});

describe('dates', () => {
  it('formats today and one year ago as ISO dates', () => {
    const now = new Date(2026, 9, 24, 15, 30);
    expect(today(now)).toBe('2026-10-24');
    expect(oneYearAgo(now)).toBe('2025-10-24');
  });
});

describe('imageFileError', () => {
  const file = (name: string, type: string, size: number) =>
    new File([new Uint8Array(size)], name, { type });

  it('accepts JPEG and PNG up to 2 MB', () => {
    expect(imageFileError(file('a.jpg', 'image/jpeg', 2 * 1024 * 1024))).toBeNull();
    expect(imageFileError(file('a.png', 'image/png', 10))).toBeNull();
  });

  it('rejects other types and files over 2 MB', () => {
    expect(imageFileError(file('a.gif', 'image/gif', 10))).toBe('"a.gif" must be a JPEG or PNG image.');
    expect(imageFileError(file('big.jpg', 'image/jpeg', 2 * 1024 * 1024 + 1))).toBe(
      '"big.jpg" is larger than 2 MB.',
    );
  });
});
