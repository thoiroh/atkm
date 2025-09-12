import { Pipe, PipeTransform } from '@angular/core';

/**
 * @description Pipe add text to the value pass to pipe
 */
@Pipe({
  name: 'decimalFormat',
  standalone: true,
})
export class DecimalFormatPipe implements PipeTransform {

  /**
   * @description Transforms decimal format pipe
   * @param value 
   * @returns transform 
   */
  transform(value: string): string {
    let parsedValue = parseFloat(value);
    if (parsedValue == null) {
      return '';
    }
    return parsedValue.toFixed(2);
  }
}
