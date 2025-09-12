import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { BinanceAccount, BinanceApiResponse } from '../models/binance.model';
import { BinanceErrorHandlerService } from './error-handler.service';

@Injectable({
  providedIn: 'root'
})
export class BinanceService {
  private readonly apiBaseUrl = 'http://localhost:8000';
  private http = inject(HttpClient);
  private errorHandler = inject(BinanceErrorHandlerService);

  /**
   * Get Binance account information
   * Returns account data with validated balances array
   */
  getAccount(): Observable<BinanceAccount> {
    return this.http.get<BinanceApiResponse<BinanceAccount>>(`${this.apiBaseUrl}/api/v3/account`)
      .pipe(
        map(response => {
          console.log('BinanceService: Raw API response received', response);

          // Validate response success using PHP structure
          if (!response.success) {
            const errorMessage = response.error?.message || response.message || 'Failed to get account data';
            console.error('BinanceService: API returned error', response.error);
            throw this.errorHandler.handleDataValidationError('getAccount - API Error', response);
          }

          // Validate data presence
          const accountData = response.data;
          if (!accountData) {
            console.error('BinanceService: No account data in response', response);
            throw this.errorHandler.handleDataValidationError('getAccount - No Data', response);
          }

          // Convert balances object to array if needed
          if (accountData.balances && !Array.isArray(accountData.balances)) {
            console.warn('BinanceService: balances is an object, converting to array...', {
              type: typeof accountData.balances,
              keys: Object.keys(accountData.balances).length
            });

            // Convert object with numeric keys to array
            accountData.balances = Object.values(accountData.balances);
            console.log('BinanceService: Converted balances to array:', accountData.balances.length, 'items');
          } else if (!accountData.balances) {
            console.warn('BinanceService: No balances property, setting empty array');
            accountData.balances = [];
          }

          // Add computed total for each balance
          const processedBalances = accountData.balances.map(balance => ({
            ...balance,
            free: Number(balance.free) || 0,
            locked: Number(balance.locked) || 0,
            total: (Number(balance.free) || 0) + (Number(balance.locked) || 0)
          }));

          const processedAccount = {
            ...accountData,
            balances: processedBalances
          };

          console.log('BinanceService: Account data processed successfully', {
            accountType: processedAccount.accountType,
            balancesCount: processedAccount.balances.length,
            canTrade: processedAccount.canTrade
          });

          return processedAccount;
        }),
        catchError(error => this.errorHandler.handleHttpError(error))
      );
  }

  /**
   * Get ticker price information
   * @param symbol Optional symbol filter
   */
  getTickerPrice(symbol?: string): Observable<any> {
    const url = symbol
      ? `${this.apiBaseUrl}/api/v3/ticker/price?symbol=${symbol.toUpperCase()}`
      : `${this.apiBaseUrl}/api/v3/ticker/price`;

    return this.http.get<BinanceApiResponse<any>>(url)
      .pipe(
        map(response => {
          if (!response.success) {
            const errorMessage = response.error?.message || response.message || 'Failed to get ticker price';
            throw this.errorHandler.handleDataValidationError('getTickerPrice - API Error', response);
          }
          return response.data;
        }),
        catchError(error => this.errorHandler.handleHttpError(error))
      );
  }

  /**
   * Get trade history for a specific symbol
   * @param symbol Trading pair symbol (required)
   * @param startTime Start timestamp in milliseconds (optional)
   * @param endTime End timestamp in milliseconds (optional)
   * @param limit Number of trades to return (optional, max 1000)
   */
  getMyTrades(symbol: string, startTime?: number, endTime?: number, limit: number = 500): Observable<any> {
    if (!symbol) {
      throw this.errorHandler.handleDataValidationError('getMyTrades - Missing Symbol', { symbol });
    }

    let url = `${this.apiBaseUrl}/api/v3/myTrades?symbol=${symbol.toUpperCase()}&limit=${limit}`;

    if (startTime) {
      url += `&startTime=${startTime}`;
    }
    if (endTime) {
      url += `&endTime=${endTime}`;
    }

    return this.http.get<BinanceApiResponse<any>>(url)
      .pipe(
        map(response => {
          if (!response.success) {
            const errorMessage = response.error?.message || response.message || 'Failed to get trade history';
            throw this.errorHandler.handleDataValidationError('getMyTrades - API Error', response);
          }
          return response.data;
        }),
        catchError(error => this.errorHandler.handleHttpError(error))
      );
  }

  /**
   * Get order history for a specific symbol
   * @param symbol Trading pair symbol (required)
   * @param startTime Start timestamp in milliseconds (optional)
   * @param endTime End timestamp in milliseconds (optional)
   * @param limit Number of orders to return (optional, max 1000)
   */
  getAllOrders(symbol: string, startTime?: number, endTime?: number, limit: number = 500): Observable<any> {
    if (!symbol) {
      throw this.errorHandler.handleDataValidationError('getAllOrders - Missing Symbol', { symbol });
    }

    let url = `${this.apiBaseUrl}/api/v3/allOrders?symbol=${symbol.toUpperCase()}&limit=${limit}`;

    if (startTime) {
      url += `&startTime=${startTime}`;
    }
    if (endTime) {
      url += `&endTime=${endTime}`;
    }

    return this.http.get<BinanceApiResponse<any>>(url)
      .pipe(
        map(response => {
          if (!response.success) {
            const errorMessage = response.error?.message || response.message || 'Failed to get order history';
            throw this.errorHandler.handleDataValidationError('getAllOrders - API Error', response);
          }
          return response.data;
        }),
        catchError(error => this.errorHandler.handleHttpError(error))
      );
  }
}
