export interface BinanceBalance {
  asset: string;
  free: number;
  locked: number;
  total: number;
}

export interface BinanceAccount {
  accountType: string;
  canTrade: boolean;
  canWithdraw: boolean;
  canDeposit: boolean;
  updateTime: number | null;
  balances: BinanceBalance[];
  permissions: string[];
}

export interface BinanceApiResponse {
  success: boolean;
  data: BinanceAccount;
  message?: string;
  endpoint?: string;
}