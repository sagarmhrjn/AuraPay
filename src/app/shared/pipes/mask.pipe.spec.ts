import { describe, expect, it } from 'vitest';
import { MaskSensitivePipe } from './mask.pipe';

describe('MaskSensitivePipe', () => {
  const pipe = new MaskSensitivePipe();

  it('should mask Nepal IRD PAN keeping only last 4 digits', () => {
    expect(pipe.transform('601234567', 'PAN')).toBe('•••••4567');
  });

  it('should mask Nepal Citizenship Certificate Number', () => {
    expect(pipe.transform('27-01-78-12345', 'CITIZENSHIP')).toBe('••-••-••-•2345');
  });

  it('should mask SSN keeping only last 4 digits', () => {
    expect(pipe.transform('123-45-6789', 'SSN')).toBe('•••-••-6789');
    expect(pipe.transform('987654321', 'SSN')).toBe('•••-••-4321');
  });

  it('should mask Bank Account keeping only last 4 digits', () => {
    expect(pipe.transform('123456789012', 'BANK_ACCOUNT')).toBe('••••••••9012');
  });

  it('should mask Federal Tax ID (EIN)', () => {
    expect(pipe.transform('12-3456789', 'EIN')).toBe('••-•••6789');
  });

  it('should return dash for null or empty input', () => {
    expect(pipe.transform(null)).toBe('—');
    expect(pipe.transform('')).toBe('—');
    expect(pipe.transform(undefined)).toBe('—');
  });
});
