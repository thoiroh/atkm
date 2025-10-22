// Binance Models - Updated for PHP Response structure compatibility
import { Observable } from 'rxjs';

/**
 * Core Binance Account Interfaces
 */
export interface BinanceBalance {
  asset: string;
  free: number;
  locked: number;
  total?: number; // Computed field added by service
}

export interface BinanceAccount {
  accountType: 'SPOT' | 'MARGIN' | 'FUTURES';
  balances: BinanceBalance[];
  canTrade: boolean;
  canWithdraw: boolean;
  canDeposit: boolean;
  permissions: string[];
  updateTime?: number;
  buyerCommission?: number;
  sellerCommission?: number;
  takerCommission?: number;
  makerCommission?: number;
}

/**
 * PHP Backend Response Structure
 * Matches Atkb\Core\Response.php format
 */
export interface BinanceApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  timestamp?: string;
  source?: string;
  endpoint?: string;
  // Error structure for failed responses
  error?: {
    code: number;
    message: string;
    details?: any;
    timestamp: string;
  };
}

/**
 * Binance API Success Response
 * Used for Response::binanceSuccess() format
 */
export interface BinanceBoundSuccessResponse<T> extends BinanceApiResponse<T> {
  success: true;
  source: 'binance';
  endpoint: string;
  data: T;
  timestamp: string;
}

/**
 * Binance API Error Response
 * Used for Response::binanceError() format
 */
export interface BinanceBoundErrorResponse extends BinanceApiResponse<never> {
  success: false;
  source: 'binance';
  endpoint: string;
  error: {
    code: number;
    message: string;
    timestamp: string;
  };
}

/**
 * Standard PHP Success Response
 * Used for Response::success() format
 */
export interface StandardSuccessResponse<T> extends BinanceApiResponse<T> {
  success: true;
  message: string;
  data: T;
  timestamp: string;
}

/**
 * Standard PHP Error Response
 * Used for Response::error() format
 */
export interface StandardErrorResponse extends BinanceApiResponse<never> {
  success: false;
  error: {
    code: number;
    message: string;
    details?: any;
    timestamp: string;
  };
}

/**
 * Ticker Price Information
 */
export interface BinanceTickerPrice {
  symbol: string;
  price: number;
}

/**
 * Market Data Interface
 */
export interface BinanceMarketData {
  symbol: string;
  priceChange: number;
  priceChangePercent: number;
  weightedAvgPrice: number;
  prevClosePrice: number;
  lastPrice: number;
  lastQty: number;
  bidPrice: number;
  askPrice: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  volume: number;
  quoteVolume: number;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

/**
 * Order Book Entry
 */
export interface BinanceOrderBookEntry {
  price: number;
  quantity: number;
}

/**
 * Order Book Data
 */
export interface BinanceOrderBook {
  lastUpdateId: number;
  bids: BinanceOrderBookEntry[];
  asks: BinanceOrderBookEntry[];
}

/**
 * Kline/Candlestick Data
 */
export interface BinanceKline {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
  quoteAssetVolume: number;
  numberOfTrades: number;
  takerBuyBaseAssetVolume: number;
  takerBuyQuoteAssetVolume: number;
}

/**
 * API Status Information
 */
export interface BinanceApiStatus {
  status: 'NORMAL' | 'MAINTENANCE';
  msg: string;
}

/**
 * Server Time Response
 */
export interface BinanceServerTime {
  serverTime: number;
}

/**
 * Exchange Information
 */
export interface BinanceExchangeInfo {
  timezone: string;
  serverTime: number;
  rateLimits: Array<{
    rateLimitType: string;
    interval: string;
    intervalNum: number;
    limit: number;
  }>;
  exchangeFilters: any[];
  symbols: Array<{
    symbol: string;
    status: string;
    baseAsset: string;
    quoteAsset: string;
    filters: any[];
  }>;
}

/**
 * Account Information (Extended)
 */
export interface BinanceAccountInfo extends BinanceAccount {
  makerCommission: number;
  takerCommission: number;
  buyerCommission: number;
  sellerCommission: number;
  canTrade: boolean;
  canWithdraw: boolean;
  canDeposit: boolean;
  updateTime: number;
  accountType: 'SPOT' | 'MARGIN' | 'FUTURES';
  balances: BinanceBalance[];
  permissions: string[];
}

/**
 * User Asset Information (SAPI endpoint)
 * Represents detailed asset information including locked, frozen, and withdrawing amounts
 */
export interface BinanceUserAsset {
  asset: string;              // Asset symbol (e.g., "BTC", "ETH")
  free: string;               // Available balance
  locked: string;             // Locked balance (in orders)
  freeze: string;             // Frozen balance
  withdrawing: string;        // Amount currently being withdrawn
  ipoable: string;            // Amount available for IPO
  btcValuation?: string;      // BTC valuation (only if needBtcValuation=true)
}

/**
 * User Assets Response (from getUserAssets endpoint)
 */
export interface BinanceUserAssetsResponse {
  assets: BinanceUserAsset[];
  count: number;
  filters: {
    asset: string | null;
    needBtcValuation: boolean;
  };
}

/**
 * Type Guards for Response Validation
 */

export function isBinanceApiResponse<T>(obj: any): obj is BinanceApiResponse<T> {
  return obj && typeof obj === 'object' && typeof obj.success === 'boolean';
}

export function isSuccessResponse<T>(obj: BinanceApiResponse<T>): obj is StandardSuccessResponse<T> {
  return obj.success === true && obj.data !== undefined;
}

export function isErrorResponse(obj: BinanceApiResponse<any>): obj is StandardErrorResponse {
  return obj.success === false && obj.error !== undefined;
}

export function isBinanceSuccessResponse<T>(obj: BinanceApiResponse<T>): obj is BinanceBoundSuccessResponse<T> {
  return obj.success === true && obj.source === 'binance' && obj.data !== undefined;
}

export function isBinanceErrorResponse(obj: BinanceApiResponse<any>): obj is BinanceBoundErrorResponse {
  return obj.success === false && obj.source === 'binance' && obj.error !== undefined;
}

/**
 * Utility Types
 */

export type BinanceResponseUnion<T> =
  | BinanceBoundSuccessResponse<T>
  | StandardSuccessResponse<T>
  | BinanceBoundErrorResponse
  | StandardErrorResponse;

export type BinanceServiceResponse<T> = Observable<T>;

/**
 * Configuration Interfaces
 */
export interface BinanceServiceConfig {
  apiBaseUrl: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface BinanceCredentials {
  apiKey?: string;
  secretKey?: string;
}

/**
 * Cache Configuration
 */
export interface BinanceCacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum cache size
  enabled: boolean;
}
