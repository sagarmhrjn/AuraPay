import { FormControl, FormGroup } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { MerchantValidators } from './merchant-validators';

describe('MerchantValidators', () => {
  describe('pan validator (Nepal IRD 9-digit PAN)', () => {
    const validator = MerchantValidators.pan();

    it('should validate valid 9-digit PAN', () => {
      const control = new FormControl('601234567');
      expect(validator(control)).toBeNull();
    });

    it('should reject PAN with letters or wrong length', () => {
      const control1 = new FormControl('60123456');
      expect(validator(control1)).toEqual({ invalidPan: { value: '60123456' } });

      const control2 = new FormControl('60123456A');
      expect(validator(control2)).toEqual({ invalidPan: { value: '60123456A' } });
    });
  });

  describe('citizenship validator (Nepal Citizenship Certificate / NID)', () => {
    const validator = MerchantValidators.citizenship();

    it('should validate district citizenship certificate format', () => {
      const control1 = new FormControl('27-01-78-12345');
      expect(validator(control1)).toBeNull();

      const control2 = new FormControl('1234/5678');
      expect(validator(control2)).toBeNull();
    });

    it('should validate 10-digit National ID (NID)', () => {
      const control = new FormControl('9876543210');
      expect(validator(control)).toBeNull();
    });
  });

  describe('ein validator', () => {
    const validator = MerchantValidators.ein();

    it('should validate valid EIN format XX-XXXXXXX or 9-digit PAN', () => {
      const control1 = new FormControl('12-3456789');
      expect(validator(control1)).toBeNull();

      const control2 = new FormControl('601234567');
      expect(validator(control2)).toBeNull();
    });

    it('should reject EIN with invalid characters or length', () => {
      const control = new FormControl('AB-1234567');
      expect(validator(control)).toEqual({ invalidEin: { value: 'AB-1234567' } });
    });

    it('should allow empty value (leave required check to Validators.required)', () => {
      const control = new FormControl('');
      expect(validator(control)).toBeNull();
    });
  });

  describe('ssn validator', () => {
    const validator = MerchantValidators.ssn();

    it('should validate valid SSN format XXX-XX-XXXX', () => {
      const control = new FormControl('123-45-6789');
      expect(validator(control)).toBeNull();
    });

    it('should reject SSN starting with 000 or 666', () => {
      const control = new FormControl('000-12-3456');
      expect(validator(control)).toEqual({ invalidSsn: { value: '000-12-3456' } });
    });

    it('should reject SSN without hyphens', () => {
      const control = new FormControl('123456789');
      expect(validator(control)).toEqual({ invalidSsn: { value: '123456789' } });
    });
  });

  describe('abaRouting checksum validator', () => {
    const validator = MerchantValidators.abaRouting();

    it('should accept valid Federal Reserve routing numbers', () => {
      const control1 = new FormControl('121000358');
      expect(validator(control1)).toBeNull();

      const control2 = new FormControl('011000138');
      expect(validator(control2)).toBeNull();
    });

    it('should reject routing numbers with incorrect checksum', () => {
      const control = new FormControl('123456789');
      expect(validator(control)).toEqual({ invalidAbaChecksum: { value: '123456789' } });
    });

    it('should reject routing numbers with invalid length', () => {
      const control = new FormControl('12345');
      expect(validator(control)).toEqual({ invalidAbaLength: { length: 5 } });
    });
  });

  describe('ticketSizes cross-field validator', () => {
    const validator = MerchantValidators.ticketSizes();

    it('should accept when highTicketSize >= averageTicketSize', () => {
      const group = new FormGroup({
        averageTicketSize: new FormControl(100),
        highTicketSize: new FormControl(500),
      });

      expect(validator(group)).toBeNull();
      expect(group.get('highTicketSize')?.hasError('highTicketLessThanAverage')).toBeFalsy();
    });

    it('should accept when highTicketSize === averageTicketSize', () => {
      const group = new FormGroup({
        averageTicketSize: new FormControl(100),
        highTicketSize: new FormControl(100),
      });

      expect(validator(group)).toBeNull();
    });

    it('should fail and set field error when highTicketSize < averageTicketSize', () => {
      const group = new FormGroup({
        averageTicketSize: new FormControl(250),
        highTicketSize: new FormControl(100),
      });

      expect(validator(group)).toEqual({ ticketSizeMismatch: true });
      expect(group.get('highTicketSize')?.hasError('highTicketLessThanAverage')).toBeTruthy();
    });
  });

  describe('phone and postalCode validators', () => {
    it('should validate 10-digit phone', () => {
      const validator = MerchantValidators.phone();
      expect(validator(new FormControl('9841234567'))).toBeNull();
      expect(validator(new FormControl('(555) 123-4567'))).toBeNull();
      expect(validator(new FormControl('123'))).toEqual({ invalidPhone: { value: '123' } });
    });

    it('should validate postal codes', () => {
      const validator = MerchantValidators.postalCode();
      expect(validator(new FormControl('44600'))).toBeNull();
      expect(validator(new FormControl('78701-1234'))).toBeNull();
      expect(validator(new FormControl('787'))).toEqual({ invalidPostalCode: { value: '787' } });
    });
  });
});
