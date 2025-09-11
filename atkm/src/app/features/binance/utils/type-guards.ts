// NOUVEAU FICHIER - Utilitaires de validation de type
import { BinanceAccount, BinanceApiResponse, BinanceBalance } from '../models/binance.model';

/**
 * Type guard for BinanceAccount
 */
export function isBinanceAccount(obj: any): obj is BinanceAccount {
  return obj &&
    typeof obj === 'object' &&
    typeof obj.accountType === 'string' &&
    typeof obj.canTrade === 'boolean' &&
    typeof obj.canWithdraw === 'boolean' &&
    typeof obj.canDeposit === 'boolean' &&
    Array.isArray(obj.balances);
}

/**
 * Type guard for BinanceBalance
 */
export function isBinanceBalance(obj: any): obj is BinanceBalance {
  return obj &&
    typeof obj === 'object' &&
    typeof obj.asset === 'string' &&
    (typeof obj.free === 'string' || typeof obj.free === 'number') &&
    (typeof obj.locked === 'string' || typeof obj.locked === 'number');
}

/**
 * Type guard for API Response
 */
export function isBinanceApiResponse<T>(obj: any): obj is BinanceApiResponse<T> {
  return obj &&
    typeof obj === 'object' &&
    typeof obj.success === 'boolean' &&
    typeof obj.source === 'string' &&
    typeof obj.endpoint === 'string' &&
    typeof obj.timestamp === 'string' &&
    obj.data !== undefined;
}

/**
 * Safely convert balance values to numbers
 */
export function safeBalanceToNumber(value: string | number): number {
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}
