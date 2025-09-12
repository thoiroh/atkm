// ========================================
// balance-format.pipe.ts
// ========================================

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'balanceFormat',
  standalone: true
})
export class BalanceFormatPipe implements PipeTransform {

  /**
   * Format crypto balance with intelligent precision
   * Uses your existing formatBalance logic
   */
  transform(value: number | string): string {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (!numValue || numValue === 0 || isNaN(numValue)) return '0';
    if (numValue < 0.00001) return numValue.toExponential(2);
    if (numValue < 1) return numValue.toFixed(8);

    return numValue.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    });
  }
}
