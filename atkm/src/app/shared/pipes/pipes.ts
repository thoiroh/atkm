import { Pipe, PipeTransform } from '@angular/core';


// // =========================================================================================================
//    ================================= balance-format.pipe.ts ================================================
// // =========================================================================================================

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

// // =========================================================================================================
// // =================================== crypto-precision.pipe.ts ============================================
// // =========================================================================================================

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

// // =================================================================================================
// // =================================== status-badge.pipe.ts ========================================
// // =================================================================================================

export interface StatusBadgeConfig {
  text: string;
  cssClass: string;
  icon?: string;
}

@Pipe({
  name: 'statusBadge',
  standalone: true
})
export class StatusBadgePipe implements PipeTransform {

  /**
   * Transform status values into badge configurations
   * Returns object with text, cssClass, and optional icon
   */
  transform(value: string | boolean, type: 'trade-side' | 'order-status' | 'connection' | 'permission' = 'trade-side'): StatusBadgeConfig {

    switch (type) {
      case 'trade-side':
        return this.getTradeSideBadge(value as string);
      case 'order-status':
        return this.getOrderStatusBadge(value as string);
      case 'connection':
        return this.getConnectionBadge(value as string);
      case 'permission':
        return this.getPermissionBadge(value as boolean);
      default:
        return { text: value?.toString() || '', cssClass: 'badge-default' };
    }
  }

  private getTradeSideBadge(side: string): StatusBadgeConfig {
    const upperSide = side?.toUpperCase();

    switch (upperSide) {
      case 'BUY':
        return {
          text: 'BUY',
          cssClass: 'badge badge-success side-buy',
          icon: 'trending-up'
        };
      case 'SELL':
        return {
          text: 'SELL',
          cssClass: 'badge badge-danger side-sell',
          icon: 'trending-down'
        };
      default:
        return {
          text: upperSide || 'UNKNOWN',
          cssClass: 'badge badge-secondary'
        };
    }
  }

  private getOrderStatusBadge(status: string): StatusBadgeConfig {
    const upperStatus = status?.toUpperCase();

    const statusMap: Record<string, StatusBadgeConfig> = {
      'FILLED': {
        text: 'FILLED',
        cssClass: 'badge badge-success',
        icon: 'check-circle'
      },
      'PARTIALLY_FILLED': {
        text: 'PARTIAL',
        cssClass: 'badge badge-warning',
        icon: 'clock'
      },
      'NEW': {
        text: 'ACTIVE',
        cssClass: 'badge badge-info',
        icon: 'activity'
      },
      'CANCELED': {
        text: 'CANCELED',
        cssClass: 'badge badge-secondary',
        icon: 'x-circle'
      },
      'REJECTED': {
        text: 'REJECTED',
        cssClass: 'badge badge-danger',
        icon: 'alert-circle'
      },
      'EXPIRED': {
        text: 'EXPIRED',
        cssClass: 'badge badge-dark',
        icon: 'clock'
      }
    };

    return statusMap[upperStatus] || {
      text: upperStatus || 'UNKNOWN',
      cssClass: 'badge badge-secondary'
    };
  }

  private getConnectionBadge(status: string): StatusBadgeConfig {
    switch (status?.toLowerCase()) {
      case 'connected':
        return {
          text: 'Connected',
          cssClass: 'badge badge-success connection-ok',
          icon: 'wifi'
        };
      case 'connecting':
        return {
          text: 'Connecting...',
          cssClass: 'badge badge-warning connection-pending',
          icon: 'loader'
        };
      case 'disconnected':
        return {
          text: 'Disconnected',
          cssClass: 'badge badge-danger connection-error',
          icon: 'wifi-off'
        };
      default:
        return {
          text: 'Unknown',
          cssClass: 'badge badge-secondary',
          icon: 'help-circle'
        };
    }
  }

  private getPermissionBadge(enabled: boolean): StatusBadgeConfig {
    return {
      text: enabled ? 'Enabled' : 'Disabled',
      cssClass: enabled ? 'badge badge-success' : 'badge badge-secondary',
      icon: enabled ? 'check' : 'x'
    };
  }
}

// // =================================================================================================
// // ==================== atk-decimal.pipe.ts ========================================================
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

// // =========================================================================================================
// // ============================ crypto-change.pipe.ts - Pour les variations de prix ========================
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

// // =========================================================================================================
// // =================================== IconPipe ============================================================
// // =========================================================================================================

export type IconSpec =
  | string
  | { name?: string; variant?: string | null; color?: string | null; size?: number | null };

export interface IconDefaults {
  defaultName?: string;
  defaultVariant?: string | null;
  defaultColor?: string | null;
  size?: number;
}

export interface IconInputs {
  name: string;
  variant?: string | null;
  color?: string | null;
  size: number;
}

@Pipe({ name: 'icon', standalone: true, pure: true })
export class IconPipe implements PipeTransform {
  transform(value: IconSpec | null | undefined, defaults: IconDefaults = {}): IconInputs {
    const {
      defaultName = 'repo',
      defaultVariant = null,
      defaultColor = '#656d76',
      size = 16
    } = defaults;

    if (typeof value === 'string') {
      return { name: value.trim() || defaultName, variant: defaultVariant, color: defaultColor, size: Number(size) };
    }
    const v = value ?? {};
    return {
      name: (v.name && v.name.trim()) || defaultName,
      variant: v.variant ?? defaultVariant ?? null,
      color: (v.color && v.color.trim()) || defaultColor,
      size: Number(v.size ?? size) || Number(size)
    };
  }
}

// // =========================================================================================================
// // =================================== SlicePipe ===========================================================
// // =========================================================================================================

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

// // =========================================================================================================
// // =================================== TimestampToDatePipe =================================================
// // =========================================================================================================

/**
 * @description Pipe add text to the value pass to pipe
 */
@Pipe({
  name: 'timestampToDate',
  standalone: true,
})
export class TimestampToDatePipe implements PipeTransform {

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

// // =========================================================================================================
// // =================================== TextPipe ============================================================
// // =========================================================================================================

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

// // =========================================================================================================
// // =================================== SanitizePipe ========================================================
// // =========================================================================================================

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

// // =========================================================================================================
// // =================================== ObjToArrayPipe ======================================================
// // =========================================================================================================

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

// // =========================================================================================================
// // =================================== DateAddSubPipe ======================================================
// // =========================================================================================================

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

// // =========================================================================================================
// // =================================== SafePipe ============================================================
// // =========================================================================================================

import { DomSanitizer, SafeHtml, SafeResourceUrl, SafeScript, SafeStyle, SafeUrl } from '@angular/platform-browser';

/**
 * Sanitize HTML
 */
@Pipe({
  name: 'safepipe'
})
export class SafePipe implements PipeTransform {

  constructor(
    protected domSanitizer: DomSanitizer
  ) {
  }

  /**
   * @description Transforms safe pipe
   * @param value
   * @param type
   * @returns transform
   */
  public transform(value: string, type: string): SafeHtml | SafeStyle | SafeScript | SafeUrl | SafeResourceUrl {
    switch (type) {
      case 'html':
        return this.domSanitizer.bypassSecurityTrustHtml(value);
      case 'style':
        return this.domSanitizer.bypassSecurityTrustStyle(value);
      case 'script':
        return this.domSanitizer.bypassSecurityTrustScript(value);
      case 'url':
        return this.domSanitizer.bypassSecurityTrustUrl(value);
      case 'resourceUrl':
        return this.domSanitizer.bypassSecurityTrustResourceUrl(value);
      case 'vw':
        return this.domSanitizer.bypassSecurityTrustResourceUrl(value);
      default:
        return this.domSanitizer.bypassSecurityTrustHtml(value);
    }
  }
}
