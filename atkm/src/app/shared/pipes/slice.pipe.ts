import { Pipe, PipeTransform } from '@angular/core';

/**
 * @description Pipe add text to the value pass to pipe
 */
@Pipe({
  name: 'slicepipe'
})
export class SlicePipe implements PipeTransform {

  /**
   * @description Transforms value pipe with addedValue
   * @param value
   * @param addedValue
   * @returns transform
   */
  public transform(value: any, start: number, end: number): any {
    return (value.substring(start, end));
  }
}
