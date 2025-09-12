import { Pipe, PipeTransform } from '@angular/core';


// // =================================================================================================
// // ==================== atk-decimal.pipe.ts ==============
// // =================================================================================================


@Pipe({
  name: 'atkDecimalEnhanced',
  standalone: true
})
export class AtkDecimalEnhancedPipe implements PipeTransform {

  /**
   * Enhanced version of your existing atkDecimal pipe
   * With additional options and crypto-specific formatting
   */
  transform(
    value: number | string,
    options: {
      minDecimals?: number;
      maxDecimals?: number;
      useGrouping?: boolean;
      cryptoMode?: boolean;
    } = {}
  ): string | null {

    if (value === null || value === undefined || isNaN(Number(value))) {
      return null;
    }

    const numberValue = Number(value);
    const {
      minDecimals = 2,
      maxDecimals = 8,
      useGrouping = true,
      cryptoMode = true
    } = options;

    let precision = maxDecimals;

    // Smart precision for crypto mode
    if (cryptoMode) {
      if (numberValue === 0) return '0';
      if (numberValue >= 1000) precision = 2;
      else if (numberValue >= 1) precision = 4;
      else if (numberValue >= 0.01) precision = 6;
      else precision = 8;
    }

    const fixedDecimals = numberValue.toFixed(precision);
    const parts = fixedDecimals.split('.');

    // Format integer part with grouping
    let integerPart = parts[0];
    if (useGrouping) {
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }

    const decimalPart = parts[1];

    // Remove trailing zeros from decimal part but respect minDecimals
    let cleanDecimalPart = decimalPart;
    if (cleanDecimalPart) {
      cleanDecimalPart = cleanDecimalPart.replace(/0+$/, '');
      const minDecimalLength = Math.min(minDecimals, precision);
      cleanDecimalPart = cleanDecimalPart.padEnd(minDecimalLength, '0');
    }

    return cleanDecimalPart ? `${integerPart}.${cleanDecimalPart}` : integerPart;
  }
}
