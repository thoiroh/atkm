/**
 * Wallet Asset Interface
 * Represents a cryptocurrency asset in the user's wallet with balance and real-time price data
 */

/**
 * Raw asset data from Binance getUserAsset endpoint
 */
export interface BinanceUserAsset {
  asset: string;           // Asset symbol (e.g., "BTC", "ETH")
  free: string;            // Available balance (as string from API)
  locked: string;          // Locked balance (as string from API)
  freeze: string;          // Frozen balance (as string from API)
  withdrawing: string;     // Balance in withdrawal (as string from API)
  btcValuation?: string;   // Optional BTC valuation
}

/**
 * Enhanced wallet asset with real-time price data
 */
export interface WalletAsset {
  symbol: string;          // Asset symbol (e.g., "BTC", "ETH")
  balance: number;         // Total balance (free + locked)
  freeBalance: number;     // Available balance
  lockedBalance: number;   // Locked balance
  currentPrice: number;    // Current price in USDT (from WebSocket)
  totalValue: number;      // Total value in USDT (balance * price)
  priceChange24h: number;  // 24h price change percentage
  priceDirection: 'up' | 'down' | 'neutral';  // Visual indicator for price direction
  lastUpdate: number;      // Timestamp of last price update
}

/**
 * WebSocket connection state
 */
export interface WebSocketState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error' | 'reconnecting';
  error?: string;
  reconnectAttempt?: number;
  lastConnected?: number;
}

/**
 * WebSocket Ticker Interface
 * Represents real-time ticker data from Binance WebSocket API
 * Based on Binance Stream: <symbol>@ticker
 */

/**
 * 24hr Ticker statistics from Binance WebSocket
 * Documentation: https://binance-docs.github.io/apidocs/spot/en/#individual-symbol-ticker-streams
 */
export interface BinanceTickerData {
  e: string;      // Event type: "24hrTicker"
  E: number;      // Event time (timestamp)
  s: string;      // Symbol (e.g., "BTCUSDT")
  p: string;      // Price change
  P: string;      // Price change percent
  w: string;      // Weighted average price
  x: string;      // First trade(F)-1 price (first trade before the 24hr rolling window)
  c: string;      // Last price
  Q: string;      // Last quantity
  b: string;      // Best bid price
  B: string;      // Best bid quantity
  a: string;      // Best ask price
  A: string;      // Best ask quantity
  o: string;      // Open price
  h: string;      // High price
  l: string;      // Low price
  v: string;      // Total traded base asset volume
  q: string;      // Total traded quote asset volume
  O: number;      // Statistics open time
  C: number;      // Statistics close time
  F: number;      // First trade ID
  L: number;      // Last trade ID
  n: number;      // Total number of trades
}

/**
 * Simplified ticker data for component usage
 */
export interface SimplifiedTicker {
  symbol: string;              // Trading pair symbol (e.g., "BTCUSDT")
  baseAsset: string;           // Base asset (e.g., "BTC" from "BTCUSDT")
  lastPrice: number;           // Current price
  priceChange: number;         // 24h price change
  priceChangePercent: number;  // 24h price change percentage
  high24h: number;             // 24h high price
  low24h: number;              // 24h low price
  volume24h: number;           // 24h trading volume
  timestamp: number;           // Update timestamp
}

/**
 * WebSocket message structure
 */
export interface WebSocketMessage {
  stream: string;              // Stream name (e.g., "btcusdt@ticker")
  data: BinanceTickerData;     // Ticker data
}
