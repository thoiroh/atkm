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


// AJOUT - Nouvelle interface pour gérer la réponse PHP
export interface BinanceApiResponse<T = any> {
  success: boolean;
  source: string;
  endpoint: string;
  data: T;
  timestamp: string;
  message?: string;
}

// AJOUT - Interface d'erreur Binance
export interface BinanceErrorResponse {
  success: false;
  source: string;
  endpoint: string;
  error: {
    code: number;
    message: string;
    timestamp: string;
  };
}
