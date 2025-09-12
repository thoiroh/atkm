
// ========================================
// crypto-precision.pipe.ts
// ========================================

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'cryptoPrecision',
  standalone: true
})
export class CryptoPrecisionPipe implements PipeTransform {

  /**
   * Smart precision formatting for crypto prices
   * Adapts decimal places based on value magnitude
   */
  transform(value: number | string, type: 'price' | 'quantity' | 'fee' = 'price'): string {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (!numValue || isNaN(numValue)) return '0';

    switch (type) {
      case 'price':
        return this.formatPrice(numValue);
      case 'quantity':
        return this.formatQuantity(numValue);
      case 'fee':
        return this.formatFee(numValue);
      default:
        return numValue.toString();
    }
  }

  private formatPrice(value: number): string {
    if (value < 0.01) return value.toFixed(8);
    if (value < 1) return value.toFixed(6);
    if (value < 100) return value.toFixed(4);
    if (value < 10000) return value.toFixed(2);

    return value.toLocaleString('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  }

  private formatQuantity(value: number): string {
    return value.toLocaleString('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 8
    });
  }

  private formatFee(value: number): string {
    return value.toFixed(8);
  }
}
