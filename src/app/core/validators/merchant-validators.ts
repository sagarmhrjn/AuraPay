import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class MerchantValidators {
  /**
   * Validates Nepal Inland Revenue Department (IRD) 9-Digit Permanent Account Number (PAN).
   */
  static pan(): ValidatorFn {
    const panPattern = /^\d{9}$/;
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      const valid = panPattern.test(control.value.toString().trim());
      return valid ? null : { invalidPan: { value: control.value } };
    };
  }

  /**
   * Validates Tax ID (Supports both Nepal 9-digit PAN and US EIN XX-XXXXXXX for compatibility).
   */
  static ein(): ValidatorFn {
    const einPattern = /^(\d{2}-\d{7}|\d{9})$/;
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      const valid = einPattern.test(control.value.toString().trim());
      return valid ? null : { invalidEin: { value: control.value } };
    };
  }

  /**
   * Validates Nepali Citizenship Certificate (नागरिकता नं) or 10-Digit National ID (NID).
   */
  static citizenship(): ValidatorFn {
    // Matches formats: 27-01-78-12345, 12-01-74-05432, 1234/5678, or 10-digit NID
    const citizenshipPattern = /^(\d{1,4}(?:[-\/]\d{1,6}){1,3}|\d{10})$/;
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      const valid = citizenshipPattern.test(control.value.toString().trim());
      return valid ? null : { invalidCitizenship: { value: control.value } };
    };
  }

  /**
   * Validates Personal Identification / US SSN
   */
  static ssn(): ValidatorFn {
    const ssnPattern = /^(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}$/;
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      const cleanVal = control.value.toString().trim();
      const valid = ssnPattern.test(cleanVal);
      return valid ? null : { invalidSsn: { value: control.value } };
    };
  }

  /**
   * Validates 9-digit NCHL-IPS / ABA Interbank Clearing Member Routing Code
   * using the weighted checksum algorithm:
   * (3*(d1 + d4 + d7) + 7*(d2 + d5 + d8) + 1*(d3 + d6 + d9)) mod 10 == 0
   */
  static nchlRouting(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      const clean = control.value.toString().replace(/\D/g, '');
      if (clean.length !== 9) {
        return { invalidAbaLength: { length: clean.length } };
      }

      const digits = clean.split('').map(Number);
      const checksum =
        3 * (digits[0] + digits[3] + digits[6]) +
        7 * (digits[1] + digits[4] + digits[7]) +
        1 * (digits[2] + digits[5] + digits[8]);

      if (checksum % 10 !== 0) {
        return { invalidAbaChecksum: { value: control.value } };
      }

      return null;
    };
  }

  /**
   * Alias for backwards compatibility
   */
  static abaRouting(): ValidatorFn {
    return MerchantValidators.nchlRouting();
  }

  /**
   * Cross-field validator ensuring high ticket size is greater than or equal to average ticket size
   */
  static ticketSizes(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const avgControl = control.get('averageTicketSize');
      const highControl = control.get('highTicketSize');

      if (!avgControl || !highControl) {
        return null;
      }

      const avg = Number(avgControl.value);
      const high = Number(highControl.value);

      if (avg > 0 && high > 0 && high < avg) {
        highControl.setErrors({ highTicketLessThanAverage: true });
        return { ticketSizeMismatch: true };
      }

      if (highControl.hasError('highTicketLessThanAverage')) {
        const errors = { ...highControl.errors };
        delete errors['highTicketLessThanAverage'];
        highControl.setErrors(Object.keys(errors).length ? errors : null);
      }

      return null;
    };
  }

  /**
   * Validates bank account number (between 4 and 18 digits for Nepalese commercial banks)
   */
  static bankAccountNumber(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      const clean = control.value.toString().replace(/[\s-]/g, '');
      const valid = /^\d{4,18}$/.test(clean);
      return valid ? null : { invalidBankAccount: { value: control.value } };
    };
  }

  /**
   * Validates Postal Code
   */
  static postalCode(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      const valid = /^\d{5}(-\d{4})?$/.test(control.value.trim());
      return valid ? null : { invalidPostalCode: { value: control.value } };
    };
  }

  /**
   * Validates Phone Number (10 digits, supporting Nepal mobile 98/97 & standard 10-digit)
   */
  static phone(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      const digits = control.value.replace(/\D/g, '');
      return digits.length === 10 ? null : { invalidPhone: { value: control.value } };
    };
  }
}
