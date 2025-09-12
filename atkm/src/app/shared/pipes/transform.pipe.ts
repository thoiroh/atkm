import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { formatDate } from '@angular/common';


/**
 * @description Transforms value pipe with addedValue
 * @param value
 * @param addedValue
 * @returns transform
 */
@Pipe({
  name: 'textpipe',
  standalone: true,
})
export class TextPipe implements PipeTransform {
  transform(value: any, addedValue: any): any {
    return (value + addedValue);
  }
}

/**
 * @description Pipe to format date
 */
@Pipe({
  name: 'sanitize',
  standalone: true,
})
export class SanitizePipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) { }

  transform(value: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(value);
  }
}
/**
 * @description Transforms object into array
 * @param value
 * @returns transform
 */
@Pipe({
  name: 'objToArray',
  standalone: true,
})
export class ObjToArrayPipe implements PipeTransform {
  transform(obj: any): [string, any][] {
    return Object.entries(obj);
  }
}

/**
* @description Transform date and add or substract time @ date
* @param value
* @param add
* @param subtract
* @example dateAddSub:{days:1}:{months:1}
*/
@Pipe({
  name: 'dateAddSub',
  standalone: true,
})
export class DateAddSubPipe implements PipeTransform {
  transform(
    value: any,
    add?: { days?: number; months?: number; years?: number },
    subtract?: { days?: number; months?: number; years?: number }
  ): any {
    if (!value) return null;
    let date = new Date(value);
    if (add) {
      if (add.days) date.setDate(date.getDate() + add.days);
      if (add.months) date.setMonth(date.getMonth() + add.months);
      if (add.years) date.setFullYear(date.getFullYear() + add.years);
    }
    if (subtract) {
      if (subtract.days) date.setDate(date.getDate() - subtract.days);
      if (subtract.months) date.setMonth(date.getMonth() - subtract.months);
      if (subtract.years) date.setFullYear(date.getFullYear() - subtract.years);
    }
    return date;
  }
}




