/**
 * ATK API Formatters
 * Pure formatting functions for data display
 * No dependencies - can be used anywhere in the application
 */

/**
 * Format balance values with appropriate decimals
 * Used for crypto asset balances
 */
export function formatBalance(value: number | string | null | undefined): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (numValue === null || numValue === undefined || isNaN(numValue) || numValue === 0) {
    return '0';
  }

  if (numValue < 0.00001) return numValue.toExponential(2);
  if (numValue < 1) return numValue.toFixed(8);

  return numValue.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8
  });
}

/**
 * Format price values with appropriate decimals
 * Used for asset prices and trading values
 */
export function formatPrice(value: number | string | null | undefined): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (numValue === null || numValue === undefined || isNaN(numValue) || !numValue) {
    return '0';
  }

  if (numValue < 0.01) return numValue.toFixed(8);
  if (numValue < 1) return numValue.toFixed(6);
  if (numValue < 100) return numValue.toFixed(4);

  return numValue.toFixed(2);
}

/**
 * Format quantity values
 * Used for order quantities and trade amounts
 */
export function formatQuantity(value: number | string | null | undefined): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (numValue === null || numValue === undefined || isNaN(numValue) || !numValue) {
    return '0';
  }

  return numValue.toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8
  });
}

/**
 * Format fee values with high precision
 * Used for trading fees and commissions
 */
export function formatFee(value: number | string | null | undefined): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (numValue === null || numValue === undefined || isNaN(numValue) || !numValue) {
    return '0';
  }

  return numValue.toFixed(8);
}

/**
 * Format date values
 * Supports timestamp (number) and Date objects
 */
export function formatDate(
  value: number | Date | string | null | undefined,
  locale: string = 'fr-FR',
  options?: Intl.DateTimeFormatOptions
): string {
  if (value === null || value === undefined) {
    return '-';
  }

  try {
    const date = typeof value === 'number' || typeof value === 'string'
      ? new Date(value)
      : value;

    if (isNaN(date.getTime())) {
      return '-';
    }

    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    };

    return date.toLocaleString(locale, options || defaultOptions);
  } catch {
    return '-';
  }
}

/**
 * Format percentage values
 * Used for price changes, returns, and commissions
 */
export function formatPercentage(
  value: number | string | null | undefined,
  decimals: number = 2,
  includeSign: boolean = true
): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (numValue === null || numValue === undefined || isNaN(numValue)) {
    return '0%';
  }

  const sign = includeSign && numValue > 0 ? '+' : '';
  return `${sign}${numValue.toFixed(decimals)}%`;
}

/**
 * Format currency values
 * Used for USD values and fiat amounts
 */
export function formatCurrency(
  value: number | string | null | undefined,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (numValue === null || numValue === undefined || isNaN(numValue)) {
    return `0 ${currency}`;
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numValue);
}

/**
 * Format status badge text
 * Used for order status, account status, etc.
 */
export function formatStatus(value: string | null | undefined): string {
  if (!value) return 'UNKNOWN';

  return value
    .toUpperCase()
    .replace(/_/g, ' ')
    .trim();
}

/**
 * Format boolean values
 * Used for permissions and flags
 */
export function formatBoolean(
  value: boolean | string | null | undefined,
  format: 'yes-no' | 'true-false' | 'on-off' | 'emoji' = 'yes-no'
): string {
  const boolValue = typeof value === 'string'
    ? value.toLowerCase() === 'true'
    : Boolean(value);

  switch (format) {
    case 'yes-no':
      return boolValue ? 'Yes' : 'No';
    case 'true-false':
      return boolValue ? 'True' : 'False';
    case 'on-off':
      return boolValue ? 'On' : 'Off';
    case 'emoji':
      return boolValue ? '✅' : '❌';
    default:
      return boolValue ? 'Yes' : 'No';
  }
}

/**
 * Format time duration
 * Used for response times, latency, etc.
 */
export function formatDuration(
  milliseconds: number | null | undefined,
  unit: 'ms' | 's' | 'auto' = 'auto'
): string {
  if (milliseconds === null || milliseconds === undefined) {
    return '-';
  }

  if (unit === 'ms') {
    return `${milliseconds.toFixed(0)}ms`;
  }

  if (unit === 's') {
    return `${(milliseconds / 1000).toFixed(2)}s`;
  }

  // Auto mode
  if (milliseconds < 1000) {
    return `${milliseconds.toFixed(0)}ms`;
  }

  return `${(milliseconds / 1000).toFixed(2)}s`;
}

/**
 * Format file size
 * Used for data export sizes
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || bytes === 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`;
}

/**
 * Format large numbers with K, M, B suffixes
 * Used for volume, market cap, etc.
 */
export function formatCompactNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || value === 0) {
    return '0';
  }

  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 1e9) {
    return `${sign}${(absValue / 1e9).toFixed(2)}B`;
  }
  if (absValue >= 1e6) {
    return `${sign}${(absValue / 1e6).toFixed(2)}M`;
  }
  if (absValue >= 1e3) {
    return `${sign}${(absValue / 1e3).toFixed(2)}K`;
  }

  return `${sign}${absValue.toFixed(2)}`;
}

/**
 * Formatters collection object
 * For easy import: import { Formatters } from './atk-api.formatters'
 */
export const Formatters = {
  balance: formatBalance,
  price: formatPrice,
  quantity: formatQuantity,
  fee: formatFee,
  date: formatDate,
  percentage: formatPercentage,
  currency: formatCurrency,
  status: formatStatus,
  boolean: formatBoolean,
  duration: formatDuration,
  fileSize: formatFileSize,
  compactNumber: formatCompactNumber
};
