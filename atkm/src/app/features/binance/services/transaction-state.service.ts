// services/transaction-state.service.ts

import { HttpClient, HttpParams } from '@angular/common/http';
import { computed, effect, Injectable, signal } from '@angular/core';
import { forkJoin, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap, } from 'rxjs/operators';
import { BinanceApiResponse } from '../models/binance.model';
import {
  BinanceOrderHistory,
  BinanceTradeHistory,
  BinanceTransferHistory,
  DATE_RANGES,
  DateRangeFilter,
  TransactionHistoryFilter,
  TransactionSummary,
  TransferHistoryFilter
} from '../models/transaction-history.model';

export interface TransactionStateData {
  trades: BinanceTradeHistory[];
  orders: BinanceOrderHistory[];
  deposits: BinanceTransferHistory[];
  withdrawals: BinanceTransferHistory[];
  summary: TransactionSummary | null;
  availableSymbols: string[];
  selectedSymbol: string | null;
  dateRange: DateRangeFilter;
  loading: {
    trades: boolean;
    orders: boolean;
    transfers: boolean;
    summary: boolean;
  };
  errors: {
    trades: string | null;
    orders: string | null;
    transfers: string | null;
    summary: string | null;
  };
  lastUpdated: {
    trades: number | null;
    orders: number | null;
    transfers: number | null;
    summary: number | null;
  };
}

@Injectable({
  providedIn: 'root'
})
export class TransactionStateService {
  private readonly baseUrl = 'http://localhost:8000'; // Adjust based on your backend URL
  private readonly storageKey = 'atk_transaction_state';

  // Core state signals
  private readonly _state = signal<TransactionStateData>(this.getInitialState());

  // Public readonly state accessors
  public readonly state = this._state.asReadonly();

  // Computed selectors for common queries
  public readonly trades = computed(() => this._state().trades);
  public readonly orders = computed(() => this._state().orders);
  public readonly deposits = computed(() => this._state().deposits);
  public readonly withdrawals = computed(() => this._state().withdrawals);
  public readonly summary = computed(() => this._state().summary);
  public readonly availableSymbols = computed(() => this._state().availableSymbols);
  public readonly selectedSymbol = computed(() => this._state().selectedSymbol);
  public readonly dateRange = computed(() => this._state().dateRange);
  public readonly loading = computed(() => this._state().loading);
  public readonly errors = computed(() => this._state().errors);
  public readonly lastUpdated = computed(() => this._state().lastUpdated);

  // Computed derived data
  public readonly allTransfers = computed(() => [
    ...this._state().deposits,
    ...this._state().withdrawals
  ].sort((a, b) => (b.time || 0) - (a.time || 0)));

  public readonly isLoading = computed(() => {
    const loading = this._state().loading;
    return loading.trades || loading.orders || loading.transfers || loading.summary;
  });

  public readonly hasErrors = computed(() => {
    const errors = this._state().errors;
    return !!(errors.trades || errors.orders || errors.transfers || errors.summary);
  });

  public readonly tradesForSelectedSymbol = computed(() => {
    const symbol = this._state().selectedSymbol;
    return symbol ? this._state().trades.filter(trade => trade.symbol === symbol) : [];
  });

  public readonly ordersForSelectedSymbol = computed(() => {
    const symbol = this._state().selectedSymbol;
    return symbol ? this._state().orders.filter(order => order.symbol === symbol) : [];
  });

  constructor(private http: HttpClient) {
    // Auto-save state changes to localStorage
    this.setupStatePersistence();
  }

  /**
   * Initialize state with defaults or restored data
   */
  private getInitialState(): TransactionStateData {
    const stored = this.loadFromStorage();
    if (stored) {
      return stored;
    }

    return {
      trades: [],
      orders: [],
      deposits: [],
      withdrawals: [],
      summary: null,
      availableSymbols: [],
      selectedSymbol: null,
      dateRange: DATE_RANGES[1], // Last 30 days as default
      loading: {
        trades: false,
        orders: false,
        transfers: false,
        summary: false
      },
      errors: {
        trades: null,
        orders: null,
        transfers: null,
        summary: null
      },
      lastUpdated: {
        trades: null,
        orders: null,
        transfers: null,
        summary: null
      }
    };
  }

  /**
   * Setup automatic state persistence
   */
  private setupStatePersistence(): void {
    let timeoutId: any;
    let previousState: string = '';

    effect(() => {
      const currentState = JSON.stringify(this._state());
      if (currentState !== previousState) {
        previousState = currentState;
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          this.saveToStorage();
        }, 500);
      }
    });
  }

  /**
   * Save state to localStorage
   */
  private saveToStorage(): void {
    try {
      const stateToSave = {
        ...this._state(),
        // Don't persist loading states and errors
        loading: this.getInitialState().loading,
        errors: this.getInitialState().errors
      };
      localStorage.setItem(this.storageKey, JSON.stringify(stateToSave));
    } catch (error) {
      console.warn('Failed to save transaction state to localStorage:', error);
    }
  }

  /**
   * Load state from localStorage
   */
  private loadFromStorage(): TransactionStateData | null {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate and merge with initial state to ensure all properties exist
        return { ...this.getInitialState(), ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load transaction state from localStorage:', error);
      localStorage.removeItem(this.storageKey);
    }
    return null;
  }

  /**
   * Clear all state data
   */
  public clearState(): void {
    this._state.set(this.getInitialState());
    localStorage.removeItem(this.storageKey);
  }

  /**
   * Update selected symbol and clear related data
   */
  public setSelectedSymbol(symbol: string | null): void {
    this._state.update(state => ({
      ...state,
      selectedSymbol: symbol,
      // Clear existing data when symbol changes
      trades: symbol !== state.selectedSymbol ? [] : state.trades,
      orders: symbol !== state.selectedSymbol ? [] : state.orders,
      summary: symbol !== state.selectedSymbol ? null : state.summary,
      errors: {
        ...state.errors,
        trades: null,
        orders: null,
        summary: null
      }
    }));
  }

  /**
   * Update date range filter
   */
  public setDateRange(dateRange: DateRangeFilter): void {
    this._state.update(state => ({
      ...state,
      dateRange,
      // Clear existing data when date range changes significantly
      trades: [],
      orders: [],
      deposits: [],
      withdrawals: [],
      summary: null,
      errors: {
        trades: null,
        orders: null,
        transfers: null,
        summary: null
      }
    }));
  }

  /**
   * Add available symbols to the list
   */
  public addAvailableSymbols(symbols: string[]): void {
    this._state.update(state => ({
      ...state,
      availableSymbols: [...new Set([...state.availableSymbols, ...symbols])]
    }));
  }

  /**
   * Fetch trade history for selected symbol
   */
  public loadTradeHistory(symbol?: string, customFilter?: Partial<TransactionHistoryFilter>): Observable<BinanceTradeHistory[]> {
    const targetSymbol = symbol || this._state().selectedSymbol;
    if (!targetSymbol) {
      return throwError(() => new Error('No symbol selected'));
    }

    // Set loading state
    this._state.update(state => ({
      ...state,
      loading: { ...state.loading, trades: true },
      errors: { ...state.errors, trades: null }
    }));

    const filter = this.buildTradeFilter(targetSymbol, customFilter);
    const params = this.buildHttpParams(filter);

    // MODIFICATION - Gérer la réponse PHP standardisée
    return this.http.get<BinanceApiResponse<{ symbol: string, trades: BinanceTradeHistory[], totalTrades: number, filters: TransactionHistoryFilter }>>(`${this.baseUrl}/api/v3/myTrades`, { params })
      .pipe(
        map(response => {
          // AJOUT - Vérification de la réponse PHP
          if (!response.success) {
            throw new Error(response.error?.message || 'Failed to load trades');
          }

          // AJOUT - Validation des données trades
          if (!response.data || !Array.isArray(response.data.trades)) {
            throw new Error('Invalid trades data format received');
          }

          return response.data.trades;
        }),
        tap(trades => {
          this._state.update(state => ({
            ...state,
            trades,
            loading: { ...state.loading, trades: false },
            lastUpdated: { ...state.lastUpdated, trades: Date.now() }
          }));
        }),
        catchError(error => {
          this._state.update(state => ({
            ...state,
            loading: { ...state.loading, trades: false },
            errors: { ...state.errors, trades: error.message || 'Failed to load trades' }
          }));
          return throwError(() => error);
        })
      );
  }

  /**
 * Fetch order history for selected symbol
 */
  public loadOrderHistory(symbol?: string, customFilter?: Partial<TransactionHistoryFilter>): Observable<BinanceOrderHistory[]> {
    const targetSymbol = symbol || this._state().selectedSymbol;
    if (!targetSymbol) {
      return throwError(() => new Error('No symbol selected'));
    }

    this._state.update(state => ({
      ...state,
      loading: { ...state.loading, orders: true },
      errors: { ...state.errors, orders: null }
    }));

    const filter = this.buildTradeFilter(targetSymbol, customFilter);
    const params = this.buildHttpParams(filter);

    // MODIFICATION - Gérer la réponse PHP standardisée
    return this.http.get<BinanceApiResponse<{ symbol: string, orders: BinanceOrderHistory[], totalOrders: number, filters: TransactionHistoryFilter }>>(`${this.baseUrl}/api/v3/allOrders`, { params })
      .pipe(
        map(response => {
          // AJOUT - Vérification de la réponse PHP
          if (!response.success) {
            throw new Error(response.error?.message || 'Failed to load orders');
          }

          // AJOUT - Validation des données orders
          if (!response.data || !Array.isArray(response.data.orders)) {
            throw new Error('Invalid orders data format received');
          }

          return response.data.orders;
        }),
        tap(orders => {
          this._state.update(state => ({
            ...state,
            orders,
            loading: { ...state.loading, orders: false },
            lastUpdated: { ...state.lastUpdated, orders: Date.now() }
          }));
        }),
        catchError(error => {
          this._state.update(state => ({
            ...state,
            loading: { ...state.loading, orders: false },
            errors: { ...state.errors, orders: error.message || 'Failed to load orders' }
          }));
          return throwError(() => error);
        })
      );
  }

  /**
 * Fetch transfer history (deposits and withdrawals)
 */
  public loadTransferHistory(coin?: string, customFilter?: Partial<TransferHistoryFilter>): Observable<{
    deposits: BinanceTransferHistory[];
    withdrawals: BinanceTransferHistory[];
  }> {
    this._state.update(state => ({
      ...state,
      loading: { ...state.loading, transfers: true },
      errors: { ...state.errors, transfers: null }
    }));

    const filter = this.buildTransferFilter(coin, customFilter);
    const params = this.buildHttpParams(filter);

    // Gérer les réponses PHP standardisées pour deposits et withdrawals
    const deposits$ = this.http.get<BinanceApiResponse<{ coin?: string, deposits: BinanceTransferHistory[], totalDeposits: number, filters: TransferHistoryFilter }>>(`${this.baseUrl}/api/v1/capital/deposit/history`, { params })
      .pipe(
        map(response => {
          if (!response.success) {
            console.warn('Deposits request failed:', (response as any).error?.message);
            return [];
          }

          if (!response.data || !Array.isArray(response.data.deposits)) {
            console.warn('Invalid deposits data format received');
            return [];
          }

          return response.data.deposits;
        }),
        catchError((error) => {
          console.warn('Failed to load deposits, using empty array');
          return of([]);
        })
      );

    const withdrawals$ = this.http.get<BinanceApiResponse<{ coin?: string, withdrawals: BinanceTransferHistory[], totalWithdrawals: number, filters: TransferHistoryFilter }>>(`${this.baseUrl}/api/v1/capital/withdraw/history`, { params })
      .pipe(
        map(response => {
          if (!response.success) {
            console.warn('Withdrawals request failed:', (response as any).error?.message);
            return [];
          }

          if (!response.data || !Array.isArray(response.data.withdrawals)) {
            console.warn('Invalid withdrawals data format received');
            return [];
          }

          return response.data.withdrawals;
        }),
        catchError((error) => {
          console.warn('Failed to load withdrawals, using empty array');
          return of([]);
        })
      );

    // ✅ CORRECTION - Utiliser forkJoin au lieu de Promise.all
    return forkJoin({
      deposits: deposits$,
      withdrawals: withdrawals$
    }).pipe(
      tap(({ deposits, withdrawals }) => {
        // Validation finale des résultats
        const validDeposits = Array.isArray(deposits) ? deposits : [];
        const validWithdrawals = Array.isArray(withdrawals) ? withdrawals : [];

        this._state.update(state => ({
          ...state,
          deposits: validDeposits,
          withdrawals: validWithdrawals,
          loading: { ...state.loading, transfers: false },
          lastUpdated: { ...state.lastUpdated, transfers: Date.now() }
        }));
      }),
      map(({ deposits, withdrawals }) => ({
        deposits: Array.isArray(deposits) ? deposits : [],
        withdrawals: Array.isArray(withdrawals) ? withdrawals : []
      })),
      catchError(error => {
        this._state.update(state => ({
          ...state,
          loading: { ...state.loading, transfers: false },
          errors: { ...state.errors, transfers: error.message || 'Failed to load transfers' }
        }));
        return throwError(() => error);
      })
    );
  }

  /**
 * Fetch transaction summary
 */
  public loadTransactionSummary(symbol?: string): Observable<TransactionSummary> {
    const targetSymbol = symbol || this._state().selectedSymbol;
    if (!targetSymbol) {
      return throwError(() => new Error('No symbol selected'));
    }

    this._state.update(state => ({
      ...state,
      loading: { ...state.loading, summary: true },
      errors: { ...state.errors, summary: null }
    }));

    const dateRange = this._state().dateRange;
    const params = new HttpParams()
      .set('symbol', targetSymbol)
      .set('startTime', dateRange.startTime?.toString() || '')
      .set('endTime', dateRange.endTime?.toString() || '');

    // MODIFICATION - Gérer la réponse PHP standardisée
    return this.http.get<BinanceApiResponse<TransactionSummary>>(`${this.baseUrl}/api/v1/transaction/summary`, { params })
      .pipe(
        map(response => {
          // AJOUT - Vérification de la réponse PHP
          if (!response.success) {
            throw new Error(response.error?.message || 'Failed to load summary');
          }

          // AJOUT - Validation des données summary
          if (!response.data) {
            throw new Error('Invalid summary data format received');
          }

          return response.data;
        }),
        tap(summary => {
          this._state.update(state => ({
            ...state,
            summary,
            loading: { ...state.loading, summary: false },
            lastUpdated: { ...state.lastUpdated, summary: Date.now() }
          }));
        }),
        catchError(error => {
          this._state.update(state => ({
            ...state,
            loading: { ...state.loading, summary: false },
            errors: { ...state.errors, summary: error.message || 'Failed to load summary' }
          }));
          return throwError(() => error);
        })
      );
  }

  /**
 * Load comprehensive data for a symbol
 */
  public loadAllDataForSymbol(symbol: string): Observable<{
    trades: BinanceTradeHistory[];
    orders: BinanceOrderHistory[];
    summary: TransactionSummary;
  }> {
    this.setSelectedSymbol(symbol);

    // ✅ CORRECTION - Utiliser forkJoin au lieu de Promise.all
    return forkJoin({
      trades: this.loadTradeHistory(symbol),
      orders: this.loadOrderHistory(symbol),
      summary: this.loadTransactionSummary(symbol)
    }).pipe(
      map(({ trades, orders, summary }) => ({
        trades: trades || [],
        orders: orders || [],
        summary: summary
      })),
      catchError(error => {
        console.error('Failed to load all data for symbol:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Build trade/order filter with defaults
   */
  private buildTradeFilter(symbol: string, customFilter?: Partial<TransactionHistoryFilter>): TransactionHistoryFilter {
    const dateRange = this._state().dateRange;
    return {
      symbol,
      startTime: dateRange.startTime || undefined,
      endTime: dateRange.endTime || undefined,
      limit: 500,
      ...customFilter
    };
  }

  /**
   * Build transfer filter with defaults
   */
  private buildTransferFilter(coin?: string, customFilter?: Partial<TransferHistoryFilter>): TransferHistoryFilter {
    const dateRange = this._state().dateRange;
    return {
      coin,
      startTime: dateRange.startTime || undefined,
      endTime: dateRange.endTime || undefined,
      limit: 500,
      ...customFilter
    };
  }

  /**
   * Build HTTP params from filter object
   */
  private buildHttpParams(filter: any): HttpParams {
    let params = new HttpParams();
    Object.keys(filter).forEach(key => {
      const value = filter[key];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    // Ensure symbol is always present for trade/order requests
    if (filter.symbol && !params.has('symbol')) {
      params = params.set('symbol', filter.symbol);
    }

    return params;
  }

  /**
   * Get cache age for data type
   */
  public getCacheAge(dataType: 'trades' | 'orders' | 'transfers' | 'summary'): number | null {
    const lastUpdated = this._state().lastUpdated[dataType];
    return lastUpdated ? Date.now() - lastUpdated : null;
  }

  /**
   * Check if data needs refresh (cache is older than 5 minutes)
   */
  public needsRefresh(dataType: 'trades' | 'orders' | 'transfers' | 'summary'): boolean {
    const cacheAge = this.getCacheAge(dataType);
    return !cacheAge || cacheAge > 300000; // 5 minutes
  }
}
