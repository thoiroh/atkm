// src/app/shared/formatters/crypto-trading.formatters.ts
// Extended formatters for cryptocurrency and trading data

import { Injectable } from '@angular/core';

export interface CryptoFormatterOptions {
  locale?: string;
  currency?: string;
  showSymbol?: boolean;
  precision?: number;
  minPrecision?: number;
  maxPrecision?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CryptoTradingFormatters {

  private readonly DEFAULT_LOCALE = 'fr-FR';
  private readonly DEFAULT_CURRENCY = 'EUR';

  // =========================================
  // BALANCE & AMOUNT FORMATTERS
  // =========================================

  /**
   * Format crypto balance with adaptive precision
   */
  formatBalance(value: number | string, asset?: string, options?: CryptoFormatterOptions): string {
    const numValue = this.parseNumber(value);
    if (numValue === 0) return '0';
    if (!numValue || isNaN(numValue)) return 'N/A';

    // Special handling for different asset types
    if (asset) {
      return this.formatByAssetType(numValue, asset, options);
    }

    return this.formatWithAdaptivePrecision(numValue, options);
  }

  /**
   * Format balance with asset-specific rules
   */
  private formatByAssetType(value: number, asset: string, options?: CryptoFormatterOptions): string {
    const upperAsset = asset.toUpperCase();

    // Stablecoins - show 2-4 decimal places
    if (['USDT', 'USDC', 'BUSD', 'DAI', 'FDUSD'].includes(upperAsset)) {
      return this.formatCurrency(value, {
        ...options,
        minPrecision: 2,
        maxPrecision: 4
      });
    }

    // Major cryptocurrencies - show 4-8 decimal places
    if (['BTC', 'ETH', 'BNB'].includes(upperAsset)) {
      return this.formatWithAdaptivePrecision(value, {
        ...options,
        minPrecision: 4,
        maxPrecision: 8
      });
    }

    // Altcoins - adaptive precision based on value
    return this.formatWithAdaptivePrecision(value, options);
  }

  /**
   * Format with adaptive precision based on value magnitude
   */
  private formatWithAdaptivePrecision(value: number, options?: CryptoFormatterOptions): string {
    if (value === 0) return '0';

    const opts = {
      locale: this.DEFAULT_LOCALE,
      minPrecision: 0,
      maxPrecision: 8,
      ...options
    };

    let precision: number;

    // Determine precision based on value magnitude
    if (value >= 1000000) {
      precision = 2; // Millions: 1,234,567.89
    } else if (value >= 100) {
      precision = 4; // Hundreds: 123.4567
    } else if (value >= 1) {
      precision = 6; // Units: 1.234567
    } else if (value >= 0.01) {
      precision = 8; // Cents: 0.12345678
    } else if (value >= 0.0001) {
      precision = 8; // Small decimals: 0.00123456
    } else {
      // Very small values: scientific notation
      return value.toExponential(4);
    }

    precision = Math.max(opts.minPrecision, Math.min(precision, opts.maxPrecision));

    return value.toLocaleString(opts.locale, {
      minimumFractionDigits: opts.minPrecision,
      maximumFractionDigits: precision
    });
  }

  // =========================================
  // PRICE FORMATTERS
  // =========================================

  /**
   * Format trading pair price with appropriate precision
   */
  formatPrice(value: number | string, tradingPair?: string, options?: CryptoFormatterOptions): string {
    const numValue = this.parseNumber(value);
    if (!numValue || isNaN(numValue)) return 'N/A';

    if (tradingPair) {
      return this.formatByTradingPair(numValue, tradingPair, options);
    }

    return this.formatPriceGeneric(numValue, options);
  }

  /**
   * Format price based on trading pair characteristics
   */
  private formatByTradingPair(value: number, pair: string, options?: CryptoFormatterOptions): string {
    const upperPair = pair.toUpperCase();

    // USD pairs - 2-4 decimal places
    if (upperPair.endsWith('USDT') || upperPair.endsWith('USDC') || upperPair.endsWith('USD')) {
      if (value >= 100) return this.formatCurrency(value, { ...options, maxPrecision: 2 });
      if (value >= 1) return this.formatCurrency(value, { ...options, maxPrecision: 4 });
      if (value >= 0.01) return this.formatCurrency(value, { ...options, maxPrecision: 6 });
      return this.formatCurrency(value, { ...options, maxPrecision: 8 });
    }

    // BTC pairs - 8 decimal places (satoshis)
    if (upperPair.endsWith('BTC')) {
      return this.formatWithAdaptivePrecision(value, { ...options, maxPrecision: 8 });
    }

    // ETH pairs - 6-8 decimal places
    if (upperPair.endsWith('ETH')) {
      return this.formatWithAdaptivePrecision(value, { ...options, maxPrecision: 8 });
    }

    return this.formatPriceGeneric(value, options);
  }

  /**
   * Generic price formatting
   */
  private formatPriceGeneric(value: number, options?: CryptoFormatterOptions): string {
    if (value >= 100) return this.formatCurrency(value, { ...options, maxPrecision: 2 });
    if (value >= 1) return this.formatCurrency(value, { ...options, maxPrecision: 4 });
    if (value >= 0.01) return this.formatCurrency(value, { ...options, maxPrecision: 6 });
    return this.formatCurrency(value, { ...options, maxPrecision: 8 });
  }

  // =========================================
  // PERCENTAGE & CHANGE FORMATTERS
  // =========================================

  /**
   * Format percentage change with color coding
   */
  formatPercentageChange(value: number | string, options?: {
    showSign?: boolean;
    precision?: number;
    colorCode?: boolean;
  }): { text: string; cssClass: string; colorCode?: string } {
    const numValue = this.parseNumber(value);
    if (!numValue || isNaN(numValue)) return { text: 'N/A', cssClass: 'neutral' };

    const opts = {
      showSign: true,
      precision: 2,
      colorCode: true,
      ...options
    };

    const sign = numValue >= 0 ? '+' : '';
    const formattedValue = numValue.toFixed(opts.precision);
    const text = opts.showSign ? `${sign}${formattedValue}%` : `${formattedValue}%`;

    let cssClass = 'neutral';
    let colorCode = '#656d76';

    if (numValue > 0) {
      cssClass = 'positive';
      colorCode = '#238636';
    } else if (numValue < 0) {
      cssClass = 'negative';
      colorCode = '#f85149';
    }

    return { text, cssClass, colorCode: opts.colorCode ? colorCode : undefined };
  }

  /**
   * Format price change in absolute value
   */
  formatPriceChange(value: number | string, quoteCurrency = 'USDT'): { text: string; cssClass: string } {
    const numValue = this.parseNumber(value);
    if (!numValue || isNaN(numValue)) return { text: 'N/A', cssClass: 'neutral' };

    const sign = numValue >= 0 ? '+' : '';
    const absValue = Math.abs(numValue);
    const formattedValue = this.formatPrice(absValue, quoteCurrency);

    const text = `${sign}${formattedValue}`;
    const cssClass = numValue > 0 ? 'positive' : numValue < 0 ? 'negative' : 'neutral';

    return { text, cssClass };
  }

  // =========================================
  // VOLUME & QUANTITY FORMATTERS
  // =========================================

  /**
   * Format trading volume with appropriate units
   */
  formatVolume(value: number | string, options?: CryptoFormatterOptions): string {
    const numValue = this.parseNumber(value);
    if (!numValue || isNaN(numValue)) return 'N/A';
    if (numValue === 0) return '0';

    // Large volumes - use K, M, B suffixes
    if (numValue >= 1000000000) {
      return `${(numValue / 1000000000).toFixed(2)}B`;
    } else if (numValue >= 1000000) {
      return `${(numValue / 1000000).toFixed(2)}M`;
    } else if (numValue >= 1000) {
      return `${(numValue / 1000).toFixed(2)}K`;
    }

    return this.formatWithAdaptivePrecision(numValue, options);
  }

  /**
   * Format order quantity
   */
  formatQuantity(value: number | string, asset?: string, options?: CryptoFormatterOptions): string {
    const numValue = this.parseNumber(value);
    if (!numValue || isNaN(numValue)) return 'N/A';
    if (numValue === 0) return '0';

    return this.formatBalance(numValue, asset, options);
  }

  // =========================================
  // TIME & DATE FORMATTERS
  // =========================================

  /**
   * Format timestamp for trading data
   */
  formatTradingTimestamp(timestamp: number | string, options?: {
    showDate?: boolean;
    showSeconds?: boolean;
    locale?: string;
  }): string {
    const opts = {
      showDate: true,
      showSeconds: true,
      locale: this.DEFAULT_LOCALE,
      ...options
    };

    let date: Date;

    if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else {
      // Handle both milliseconds and seconds timestamps
      date = new Date(timestamp < 10000000000 ? timestamp * 1000 : timestamp);
    }

    if (isNaN(date.getTime())) return 'Invalid Date';

    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      ...(opts.showSeconds && { second: '2-digit' }),
      hour12: false
    };

    if (opts.showDate) {
      Object.assign(timeOptions, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }

    return date.toLocaleString(opts.locale, timeOptions);
  }

  /**
   * Format relative time (ago format)
   */
  formatRelativeTime(timestamp: number | string): string {
    let date: Date;

    if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else {
      date = new Date(timestamp < 10000000000 ? timestamp * 1000 : timestamp);
    }

    if (isNaN(date.getTime())) return 'Unknown';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;

    return date.toLocaleDateString(this.DEFAULT_LOCALE);
  }

  // =========================================
  // SPECIALIZED TRADING FORMATTERS
  // =========================================

  /**
   * Format trading fees
   */
  formatFee(value: number | string, feeAsset?: string): string {
    const numValue = this.parseNumber(value);
    if (!numValue || isNaN(numValue)) return 'N/A';
    if (numValue === 0) return '0';

    const formatted = this.formatBalance(numValue, feeAsset, { maxPrecision: 8 });
    return feeAsset ? `${formatted} ${feeAsset}` : formatted;
  }

  /**
   * Format order status with styling
   */
  formatOrderStatus(status: string): { text: string; cssClass: string; icon: string } {
    const upperStatus = status.toUpperCase();

    const statusMap: Record<string, { text: string; cssClass: string; icon: string }> = {
      'NEW': { text: 'New', cssClass: 'status-new', icon: 'clock' },
      'PARTIALLY_FILLED': { text: 'Partial', cssClass: 'status-partial', icon: 'activity' },
      'FILLED': { text: 'Filled', cssClass: 'status-filled', icon: 'check-circle' },
      'CANCELED': { text: 'Canceled', cssClass: 'status-canceled', icon: 'x-circle' },
      'REJECTED': { text: 'Rejected', cssClass: 'status-rejected', icon: 'alert-circle' },
      'EXPIRED': { text: 'Expired', cssClass: 'status-expired', icon: 'clock-x' }
    };

    return statusMap[upperStatus] || { text: status, cssClass: 'status-unknown', icon: 'help-circle' };
  }

  /**
   * Format trade side with styling
   */
  formatTradeSide(side: string): { text: string; cssClass: string; icon: string } {
    const upperSide = side.toUpperCase();

    if (upperSide === 'BUY') {
      return { text: 'Buy', cssClass: 'side-buy', icon: 'trending-up' };
    } else if (upperSide === 'SELL') {
      return { text: 'Sell', cssClass: 'side-sell', icon: 'trending-down' };
    }

    return { text: side, cssClass: 'side-unknown', icon: 'help-circle' };
  }

  // =========================================
  // UTILITY METHODS
  // =========================================

  /**
   * Format currency with proper localization
   */
  private formatCurrency(value: number, options?: CryptoFormatterOptions): string {
    const opts = {
      locale: this.DEFAULT_LOCALE,
      currency: this.DEFAULT_CURRENCY,
      showSymbol: false,
      precision: 2,
      minPrecision: 0,
      maxPrecision: 8,
      ...options
    };

    if (opts.showSymbol && opts.currency) {
      return value.toLocaleString(opts.locale, {
        style: 'currency',
        currency: opts.currency,
        minimumFractionDigits: opts.minPrecision,
        maximumFractionDigits: opts.maxPrecision
      });
    }

    return value.toLocaleString(opts.locale, {
      minimumFractionDigits: opts.minPrecision,
      maximumFractionDigits: opts.maxPrecision
    });
  }

  /**
   * Parse number from various input types
   */
  private parseNumber(value: number | string): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      // Handle scientific notation
      if (value.includes('e') || value.includes('E')) {
        return parseFloat(value);
      }
      // Remove any non-numeric characters except decimal point and minus
      const cleaned = value.replace(/[^\d.-]/g, '');
      return parseFloat(cleaned);
    }
    return 0;
  }

  // =========================================
  // SIDEBAR-SPECIFIC FORMATTERS
  // =========================================

  /**
   * Format boolean values for sidebar display
   */
  formatSidebarBoolean(value: boolean): { text: string; icon: string; cssClass: string } {
    if (value) {
      return { text: 'Enabled', icon: 'check-circle', cssClass: 'boolean-true' };
    } else {
      return { text: 'Disabled', icon: 'x-circle', cssClass: 'boolean-false' };
    }
  }

  /**
   * Format account type for sidebar
   */
  formatAccountType(accountType: string): { text: string; icon: string; cssClass: string } {
    const upperType = accountType.toUpperCase();

    const typeMap: Record<string, { text: string; icon: string; cssClass: string }> = {
      'SPOT': { text: 'Spot Trading', icon: 'coins', cssClass: 'account-spot' },
      'MARGIN': { text: 'Margin Trading', icon: 'trending-up', cssClass: 'account-margin' },
      'FUTURES': { text: 'Futures Trading', icon: 'zap', cssClass: 'account-futures' },
      'OPTION': { text: 'Options Trading', icon: 'target', cssClass: 'account-option' }
    };

    return typeMap[upperType] || { text: accountType, icon: 'user', cssClass: 'account-unknown' };
  }

  /**
   * Format update time for sidebar
   */
  formatUpdateTime(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);

    if (diffSecs < 60) return 'Just updated';
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;

    return date.toLocaleDateString(this.DEFAULT_LOCALE, {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
