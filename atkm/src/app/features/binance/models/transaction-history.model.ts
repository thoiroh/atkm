/**
 * Core Trade History Interfaces
 */
export interface BinanceTradeHistory {
  id: number;
  orderId: number;
  symbol: string;
  side: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  quoteQuantity: number;
  commission: number;
  commissionAsset: string;
  time: number;
  date: string;
  isMaker: boolean;
  isBestMatch: boolean;
  realizedPnl: number;
  runningQuantity: number;
  avgCost: number;
}

/**
 * Order History Interfaces
 */
export interface BinanceOrderHistory {
  orderId: number;
  symbol: string;
  status: 'NEW' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELED' | 'REJECTED' | 'EXPIRED';
  type: 'LIMIT' | 'MARKET' | 'STOP_LOSS' | 'STOP_LOSS_LIMIT' | 'TAKE_PROFIT' | 'TAKE_PROFIT_LIMIT';
  side: 'BUY' | 'SELL';
  price: number;
  origQty: number;
  executedQty: number;
  cumulativeQuoteQty: number;
  timeInForce: 'GTC' | 'IOC' | 'FOK';
  time: number;
  updateTime: number;
  date: string;
  fillPercentage: number;
}

/**
 * Transfer History Interfaces (Deposits/Withdrawals)
 */
export interface BinanceTransferHistory {
  id: string | null;
  coin: string;
  amount: number;
  status: string;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  address: string | null;
  addressTag: string | null;
  txId: string | null;
  network: string | null;
  time: number | null;
  date: string | null;
  fee: number;
  confirmTimes: string | null;
}

/**
 * Transaction Summary Interface
 */
export interface TransactionSummary {
  symbol: string;
  totalTrades: number;
  totalOrders: number;
  tradingVolume: {
    buy: number;
    sell: number;
    total: number;
  };
  tradingQuantity: {
    buy: number;
    sell: number;
    net: number;
  };
  averagePrices: {
    buy: number;
    sell: number;
  };
  totalCommission: number;
  estimatedPnl: number;
}

/**
 * Filter Interfaces
 */
export interface TransactionHistoryFilter {
  symbol: string;
  startTime?: number;
  endTime?: number;
  limit?: number;
}

export interface TransferHistoryFilter {
  coin?: string;
  startTime?: number;
  endTime?: number;
  limit?: number;
}

export interface DateRangeFilter {
  label: string;
  startTime: number | null;
  endTime: number | null;
}

/**
 * API Response Interfaces
 */
export interface TradeHistoryResponse {
  success: boolean;
  source: string;
  endpoint: string;
  data: {
    symbol: string;
    trades: BinanceTradeHistory[];
    totalTrades: number;
    filters: TransactionHistoryFilter;
  };
  timestamp: string;
}

export interface OrderHistoryResponse {
  success: boolean;
  source: string;
  endpoint: string;
  data: {
    symbol: string;
    orders: BinanceOrderHistory[];
    totalOrders: number;
    filters: TransactionHistoryFilter;
  };
  timestamp: string;
}

export interface TransferHistoryResponse {
  success: boolean;
  source: string;
  endpoint: string;
  data: {
    coin?: string;
    deposits?: BinanceTransferHistory[];
    withdrawals?: BinanceTransferHistory[];
    totalDeposits?: number;
    totalWithdrawals?: number;
    filters: TransferHistoryFilter;
  };
  timestamp: string;
}

export interface TransactionSummaryResponse {
  success: boolean;
  source: string;
  endpoint: string;
  data: TransactionSummary;
  timestamp: string;
}

/**
 * UI State Interfaces
 */
export interface TransactionHistoryState {
  activeTab: 'trades' | 'orders' | 'transfers';
  selectedSymbol: string | null;
  dateRange: DateRangeFilter;
  loading: boolean;
  error: string | null;
}

export interface TransactionTableColumn {
  key: string;
  label: string;
  type: 'text' | 'number' | 'currency' | 'percentage' | 'date';
  sortable: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

/**
 * Constants
 */
export const TRANSACTION_TYPES = {
  TRADE: 'trade',
  ORDER: 'order',
  DEPOSIT: 'deposit',
  WITHDRAWAL: 'withdrawal'
} as const;

export const ORDER_STATUS = {
  NEW: 'NEW',
  PARTIALLY_FILLED: 'PARTIALLY_FILLED',
  FILLED: 'FILLED',
  CANCELED: 'CANCELED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED'
} as const;

export const ORDER_TYPES = {
  LIMIT: 'LIMIT',
  MARKET: 'MARKET',
  STOP_LOSS: 'STOP_LOSS',
  STOP_LOSS_LIMIT: 'STOP_LOSS_LIMIT',
  TAKE_PROFIT: 'TAKE_PROFIT',
  TAKE_PROFIT_LIMIT: 'TAKE_PROFIT_LIMIT'
} as const;

export const TRANSFER_STATUS = {
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED'
} as const;

/**
 * Predefined date ranges for filtering
 */
export const DATE_RANGES: DateRangeFilter[] = [
  {
    label: 'Last 7 days',
    startTime: Date.now() - (7 * 24 * 60 * 60 * 1000),
    endTime: Date.now()
  },
  {
    label: 'Last 30 days',
    startTime: Date.now() - (30 * 24 * 60 * 60 * 1000),
    endTime: Date.now()
  },
  {
    label: 'Last 3 months',
    startTime: Date.now() - (90 * 24 * 60 * 60 * 1000),
    endTime: Date.now()
  },
  {
    label: 'Last 6 months',
    startTime: Date.now() - (180 * 24 * 60 * 60 * 1000),
    endTime: Date.now()
  },
  {
    label: 'Last year',
    startTime: Date.now() - (365 * 24 * 60 * 60 * 1000),
    endTime: Date.now()
  },
  {
    label: 'All time',
    startTime: null,
    endTime: null
  }
];

/**
 * Table column configurations
 */
export const TRADE_TABLE_COLUMNS: TransactionTableColumn[] = [
  { key: 'date', label: 'Date', type: 'date', sortable: true, width: '150px' },
  { key: 'symbol', label: 'Symbol', type: 'text', sortable: true, width: '100px' },
  { key: 'side', label: 'Side', type: 'text', sortable: true, width: '80px' },
  { key: 'price', label: 'Price', type: 'currency', sortable: true, width: '120px', align: 'right' },
  { key: 'quantity', label: 'Quantity', type: 'number', sortable: true, width: '120px', align: 'right' },
  { key: 'quoteQuantity', label: 'Total', type: 'currency', sortable: true, width: '120px', align: 'right' },
  { key: 'commission', label: 'Fee', type: 'number', sortable: true, width: '100px', align: 'right' },
  { key: 'realizedPnl', label: 'P&L', type: 'currency', sortable: true, width: '100px', align: 'right' }
];

export const ORDER_TABLE_COLUMNS: TransactionTableColumn[] = [
  { key: 'date', label: 'Date', type: 'date', sortable: true, width: '150px' },
  { key: 'symbol', label: 'Symbol', type: 'text', sortable: true, width: '100px' },
  { key: 'side', label: 'Side', type: 'text', sortable: true, width: '80px' },
  { key: 'type', label: 'Type', type: 'text', sortable: true, width: '100px' },
  { key: 'status', label: 'Status', type: 'text', sortable: true, width: '120px' },
  { key: 'price', label: 'Price', type: 'currency', sortable: true, width: '120px', align: 'right' },
  { key: 'origQty', label: 'Quantity', type: 'number', sortable: true, width: '120px', align: 'right' },
  { key: 'executedQty', label: 'Filled', type: 'number', sortable: true, width: '120px', align: 'right' },
  { key: 'fillPercentage', label: 'Fill %', type: 'percentage', sortable: true, width: '80px', align: 'right' }
];

export const TRANSFER_TABLE_COLUMNS: TransactionTableColumn[] = [
  { key: 'date', label: 'Date', type: 'date', sortable: true, width: '150px' },
  { key: 'coin', label: 'Coin', type: 'text', sortable: true, width: '80px' },
  { key: 'type', label: 'Type', type: 'text', sortable: true, width: '100px' },
  { key: 'amount', label: 'Amount', type: 'number', sortable: true, width: '150px', align: 'right' },
  { key: 'status', label: 'Status', type: 'text', sortable: true, width: '120px' },
  { key: 'fee', label: 'Fee', type: 'number', sortable: true, width: '100px', align: 'right' },
  { key: 'network', label: 'Network', type: 'text', sortable: false, width: '100px' },
  { key: 'txId', label: 'Transaction ID', type: 'text', sortable: false, width: '200px' }
];

/**
 * Utility Types
 */
export type TransactionType = keyof typeof TRANSACTION_TYPES;
export type OrderStatus = keyof typeof ORDER_STATUS;
export type OrderType = keyof typeof ORDER_TYPES;
export type TransferStatus = keyof typeof TRANSFER_STATUS;
