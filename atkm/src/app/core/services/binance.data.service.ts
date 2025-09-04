import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { BinanceService } from '../../features/binance/services/binance.service';
import { BinanceAccount } from '../../features/binance/models/binance.model';

export interface BinanceDataState {
  account: BinanceAccount | null;
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
}

@Injectable({
  providedIn: 'root'
})
export class BinanceDataService {
  // State signals
  private account = signal<BinanceAccount | null>(null);
  private loading = signal<boolean>(false);
  private error = signal<string | null>(null);
  private lastUpdate = signal<Date | null>(null);

  // Computed properties
  public readonly account$ = this.account.asReadonly();
  public readonly loading$ = this.loading.asReadonly();
  public readonly error$ = this.error.asReadonly();
  public readonly lastUpdate$ = this.lastUpdate.asReadonly();

  // Computed state
  public readonly state = computed<BinanceDataState>(() => ({
    account: this.account(),
    loading: this.loading(),
    error: this.error(),
    lastUpdate: this.lastUpdate()
  }));

  // Computed derived data
  public readonly significantBalances = computed(() => {
    const accountData = this.account();
    if (!accountData || !accountData.balances) return [];
    
    return accountData.balances.filter(balance => balance.total > 0);
  });

  public readonly totalPortfolioValue = computed(() => {
    const balances = this.significantBalances();
    // This would normally calculate USD value, for now just count assets
    return balances.length;
  });

  public readonly hasData = computed(() => this.account() !== null);
  public readonly isStale = computed(() => {
    const lastUpdate = this.lastUpdate();
    if (!lastUpdate) return true;
    
    const fiveMinutes = 5 * 60 * 1000;
    return Date.now() - lastUpdate.getTime() > fiveMinutes;
  });

  constructor(private binanceService: BinanceService) {
    // Initialize from session storage if available
    this.loadFromSession();
  }

  /**
   * Load account data from Binance API
   */
  loadAccountData(forceRefresh = false): Observable<BinanceAccount> {
    // Don't reload if we have fresh data and not forced
    if (!forceRefresh && this.hasData() && !this.isStale()) {
      return new Observable(observer => {
        observer.next(this.account()!);
        observer.complete();
      });
    }

    this.loading.set(true);
    this.error.set(null);

    return this.binanceService.getAccount().pipe(
      tap(account => {
        this.account.set(account);
        this.lastUpdate.set(new Date());
        this.loading.set(false);
        this.saveToSession();
      }),
      catchError(error => {
        this.error.set(error.message || 'Failed to load account data');
        this.loading.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Refresh account data manually
   */
  refreshAccountData(): Observable<BinanceAccount> {
    return this.loadAccountData(true);
  }

  /**
   * Clear all data
   */
  clearData(): void {
    this.account.set(null);
    this.error.set(null);
    this.lastUpdate.set(null);
    this.clearSession();
  }

  /**
   * Get specific balance by asset
   */
  getBalanceByAsset(asset: string) {
    return computed(() => {
      const accountData = this.account();
      if (!accountData) return null;
      
      return accountData.balances.find(balance => balance.asset === asset) || null;
    });
  }

  /**
   * Save data to session storage
   */
  private saveToSession(): void {
    try {
      const state: BinanceDataState = {
        account: this.account(),
        loading: false,
        error: this.error(),
        lastUpdate: this.lastUpdate()
      };
      
      sessionStorage.setItem('binance_data', JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save Binance data to session:', error);
    }
  }

  /**
   * Load data from session storage
   */
  private loadFromSession(): void {
    try {
      const savedData = sessionStorage.getItem('binance_data');
      if (savedData) {
        const state: BinanceDataState = JSON.parse(savedData);
        
        if (state.account) {
          this.account.set(state.account);
        }
        if (state.error) {
          this.error.set(state.error);
        }
        if (state.lastUpdate) {
          this.lastUpdate.set(new Date(state.lastUpdate));
        }
      }
    } catch (error) {
      console.warn('Failed to load Binance data from session:', error);
      this.clearSession();
    }
  }

  /**
   * Clear session storage
   */
  private clearSession(): void {
    try {
      sessionStorage.removeItem('binance_data');
    } catch (error) {
      console.warn('Failed to clear Binance session data:', error);
    }
  }
}