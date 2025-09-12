import { Pipe, PipeTransform } from '@angular/core';

// // =========================================================================================================
//    ========================== crypto - change.pipe.ts - Pour les variations de prix ========================
// // =========================================================================================================


@Pipe({
  name: 'cryptoChange',
  standalone: true
})
export class CryptoChangePipe implements PipeTransform {

  /**
   * Format price change with color coding and sign
   */
  transform(
    value: number | string,
    mode: 'percentage' | 'absolute' = 'percentage',
    includeSign: boolean = true
  ): { text: string; cssClass: string; isPositive: boolean } {

    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (!numValue || isNaN(numValue)) {
      return {
        text: '0.00%',
        cssClass: 'text-neutral',
        isPositive: false
      };
    }

    const isPositive = numValue > 0;
    const isNegative = numValue < 0;
    const sign = includeSign ? (isPositive ? '+' : '') : '';

    let text: string;
    if (mode === 'percentage') {
      text = `${sign}${numValue.toFixed(2)}%`;
    } else {
      text = `${sign}${numValue.toFixed(4)}`;
    }

    const cssClass = isPositive
      ? 'text-success price-positive'
      : isNegative
        ? 'text-danger price-negative'
        : 'text-muted price-neutral';

    return {
      text,
      cssClass,
      isPositive
    };
  }
}

