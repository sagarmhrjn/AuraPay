import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'maskSensitive',
  standalone: true,
})
export class MaskSensitivePipe implements PipeTransform {
  /** Masks sensitive identifiers while preserving only the configured visible digits. */
  transform(
    value: string | null | undefined,
    type: 'PAN' | 'CITIZENSHIP' | 'SSN' | 'BANK_ACCOUNT' | 'EIN' | 'CARD' | 'GENERIC' = 'GENERIC',
    visibleDigits = 4
  ): string {
    if (!value) {
      return '—';
    }

    const clean = value.toString().trim();
    if (clean.length === 0) {
      return '—';
    }

    switch (type) {
      case 'PAN': {
        // Nepal 9-digit PAN: 601234567 -> •••••4567
        const digits = clean.replace(/\D/g, '');
        if (digits.length >= 4) {
          const last4 = digits.slice(-4);
          return `•••••${last4}`;
        }
        return '•••••••••';
      }

      case 'CITIZENSHIP': {
        // Nepal Citizenship No: 27-01-74-09876 -> ••-••-••-9876
        const last4 = clean.slice(-4);
        const prefix = clean.slice(0, -4).replace(/[0-9a-zA-Z]/g, '•');
        return `${prefix}${last4}`;
      }

      case 'SSN': {
        // Expected: XXX-XX-XXXX -> mask to •••-••-1234
        const digits = clean.replace(/\D/g, '');
        if (digits.length >= 4) {
          const last4 = digits.slice(-4);
          return `•••-••-${last4}`;
        }
        return '•••-••-••••';
      }

      case 'BANK_ACCOUNT': {
        // Mask all except last 4 digits: ••••••••1234
        if (clean.length <= visibleDigits) {
          return '••••';
        }
        const lastDigits = clean.slice(-visibleDigits);
        const maskedPortion = '•'.repeat(Math.max(4, clean.length - visibleDigits));
        return `${maskedPortion}${lastDigits}`;
      }

      case 'EIN': {
        // Expected: XX-XXXXXXX -> mask to ••-•••1234
        const digits = clean.replace(/\D/g, '');
        if (digits.length >= 4) {
          const last4 = digits.slice(-4);
          return `••-•••${last4}`;
        }
        return '••-•••••••';
      }

      case 'CARD': {
        const digits = clean.replace(/\D/g, '');
        const last4 = digits.slice(-4);
        return `•••• •••• •••• ${last4}`;
      }

      default: {
        if (clean.length <= visibleDigits) {
          return '••••';
        }
        const last = clean.slice(-visibleDigits);
        const masked = '•'.repeat(clean.length - visibleDigits);
        return `${masked}${last}`;
      }
    }
  }
}
