import { Pipe, PipeTransform } from '@angular/core';

/**
 * @description Pipe add text to the value pass to pipe
 */
@Pipe({
  name: 'timestampToDate', 
  standalone: true,
})
export class TimestampToDatePipe  implements PipeTransform {

  /**
   * @description Transforms value pipe with addedValue
   * @param value
   * @param addedValue
   * @returns transform
   */
  transform(value: number, ...args: any[]): string {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
