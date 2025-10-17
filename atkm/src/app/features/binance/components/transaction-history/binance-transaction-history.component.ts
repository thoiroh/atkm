// components/binance-transaction-history/binance-transaction-history.component.ts

import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import {
  BinanceOrderHistory,
  BinanceTradeHistory,
  BinanceTransferHistory,
  DATE_RANGES,
  DateRangeFilter,
  ORDER_TABLE_COLUMNS,
  TRADE_TABLE_COLUMNS,
  TRANSFER_TABLE_COLUMNS
} from '@features/binance/models/transaction-history.model';
import { TransactionStateService } from '@features/binance/services/binance-transaction-state.service';
import { AtkIconComponent } from '@shared/components/atk-icon/atk-icon.component';

type TabType = 'trades' | 'orders' | 'transfers';

@Component({
  selector: 'atk-binance-transaction-history',
  standalone: true,
  imports: [CommonModule, FormsModule, AtkIconComponent],
  templateUrl: './binance-transaction-history.component.html',
  styleUrls: ['./binance-transaction-history.component.css']
})
export class BinanceTransactionHistoryComponent implements OnInit, OnDestroy {
  // Input for symbol from route or parent component
  symbol = input<string>();

  // Services
  private readonly transactionState = inject(TransactionStateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  // Local component state
  readonly activeTab = signal<TabType>('trades');
  readonly customDateRange = signal<{ start: string; end: string }>({ start: '', end: '' });
  readonly showCustomDatePicker = signal<boolean>(false);

  // State from service
  readonly trades = this.transactionState.trades;
  readonly orders = this.transactionState.orders;
  readonly allTransfers = this.transactionState.allTransfers;
  readonly summary = this.transactionState.summary;
  readonly selectedSymbol = this.transactionState.selectedSymbol;
  readonly dateRange = this.transactionState.dateRange;
  readonly loading = this.transactionState.loading;
  readonly errors = this.transactionState.errors;
  readonly isLoading = this.transactionState.isLoading;

  // Table configurations
  readonly tradeColumns = TRADE_TABLE_COLUMNS;
  readonly orderColumns = ORDER_TABLE_COLUMNS;
  readonly transferColumns = TRANSFER_TABLE_COLUMNS;
  readonly dateRanges = DATE_RANGES;

  // Computed data for current tab
  readonly currentData = computed(() => {
    switch (this.activeTab()) {
      case 'trades': return this.trades();
      case 'orders': return this.orders();
      case 'transfers': return this.allTransfers();
      default: return [];
    }
  });

  readonly currentError = computed(() => {
    const errors = this.errors();
    switch (this.activeTab()) {
      case 'trades': return errors.trades;
      case 'orders': return errors.orders;
      case 'transfers': return errors.transfers;
      default: return null;
    }
  });

  readonly currentLoading = computed(() => {
    const loading = this.loading();
    switch (this.activeTab()) {
      case 'trades': return loading.trades;
      case 'orders': return loading.orders;
      case 'transfers': return loading.transfers;
      default: return false;
    }
  });

  ngOnInit(): void {
    // Get symbol from route params or input
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const routeSymbol = params.get('symbol');
      const inputSymbol = this.symbol();
      const targetSymbol = routeSymbol || inputSymbol;

      if (targetSymbol && targetSymbol !== this.selectedSymbol()) {
        this.transactionState.setSelectedSymbol(targetSymbol.toUpperCase());
        this.loadInitialData(targetSymbol.toUpperCase());
      }
    });

    // Load data if symbol is already set
    const currentSymbol = this.selectedSymbol();
    if (currentSymbol) {
      this.loadInitialData(currentSymbol);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load initial data based on current tab
   */
  private loadInitialData(symbol: string): void {
    switch (this.activeTab()) {
      case 'trades':
        this.loadTrades();
        break;
      case 'orders':
        this.loadOrders();
        break;
      case 'transfers':
        this.loadTransfers();
        break;
    }
  }

  /**
   * Switch active tab and load corresponding data
   */
  setActiveTab(tab: TabType): void {
    this.activeTab.set(tab);

    const symbol = this.selectedSymbol();
    if (!symbol && (tab === 'trades' || tab === 'orders')) {
      return;
    }

    // Load data for the selected tab
    switch (tab) {
      case 'trades':
        this.loadTrades();
        break;
      case 'orders':
        this.loadOrders();
        break;
      case 'transfers':
        this.loadTransfers();
        break;
    }
  }

  /**
   * Update selected symbol
   */
  setSelectedSymbol(symbol: string): void {
    if (symbol && symbol !== this.selectedSymbol()) {
      this.transactionState.setSelectedSymbol(symbol.toUpperCase());
      this.router.navigate(['/landing/binance/history', symbol.toUpperCase()]);
    }
  }

  /**
   * Update date range filter
   */
  setDateRange(dateRange: DateRangeFilter): void {
    this.transactionState.setDateRange(dateRange);
    this.showCustomDatePicker.set(false);
    this.refreshCurrentData();
  }

  /**
   * Apply custom date range
   */
  applyCustomDateRange(): void {
    const custom = this.customDateRange();
    if (custom.start && custom.end) {
      const startTime = new Date(custom.start).getTime();
      const endTime = new Date(custom.end).getTime();

      const customRange: DateRangeFilter = {
        label: `${custom.start} to ${custom.end}`,
        startTime,
        endTime
      };

      this.setDateRange(customRange);
    }
  }

  /**
   * Update custom date range start
   */
  updateCustomDateRangeStart(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.customDateRange.update(range => ({ ...range, start: target.value }));
  }

  /**
   * Update custom date range end
   */
  updateCustomDateRangeEnd(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.customDateRange.update(range => ({ ...range, end: target.value }));
  }

  /**
   * Refresh data for current tab
   */
  refreshCurrentData(): void {
    switch (this.activeTab()) {
      case 'trades':
        this.loadTrades();
        break;
      case 'orders':
        this.loadOrders();
        break;
      case 'transfers':
        this.loadTransfers();
        break;
    }
  }

  /**
   * Load trades data
   */
  private loadTrades(): void {
    const symbol = this.selectedSymbol();
    if (symbol) {
      this.transactionState.loadTradeHistory(symbol).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => console.log('Trades loaded successfully'),
        error: (error) => console.error('Failed to load trades:', error)
      });
    }
  }

  /**
   * Load orders data
   */
  private loadOrders(): void {
    const symbol = this.selectedSymbol();
    if (symbol) {
      this.transactionState.loadOrderHistory(symbol).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => console.log('Orders loaded successfully'),
        error: (error) => console.error('Failed to load orders:', error)
      });
    }
  }

  /**
   * Load transfers data
   */
  private loadTransfers(): void {
    // For transfers, we can optionally filter by coin (extract from symbol)
    const symbol = this.selectedSymbol();
    const baseCoin = symbol ? this.extractBaseCoin(symbol) : undefined;

    this.transactionState.loadTransferHistory(baseCoin).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => console.log('Transfers loaded successfully'),
      error: (error) => console.error('Failed to load transfers:', error)
    });
  }

  /**
   * Load comprehensive summary
   */
  loadSummary(): void {
    const symbol = this.selectedSymbol();
    if (symbol) {
      this.transactionState.loadTransactionSummary(symbol).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => console.log('Summary loaded successfully'),
        error: (error) => console.error('Failed to load summary:', error)
      });
    }
  }

  /**
   * Format currency values for display
   */
  formatCurrency(value: number): string {
    if (value === 0) return '0';
    if (Math.abs(value) < 0.00001) return value.toExponential(2);
    if (Math.abs(value) < 1) return value.toFixed(8);
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    });
  }

  /**
   * Format large numbers for display
   */
  formatNumber(value: number, decimals: number = 8): string {
    if (value === 0) return '0';
    if (Math.abs(value) < 0.00001) return value.toExponential(2);
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: decimals
    });
  }

  /**
   * Format date for display
   */
  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Format percentage for display
   */
  formatPercentage(value: number): string {
    return value.toFixed(1) + '%';
  }

  /**
   * Get CSS class for trade side (BUY/SELL)
   */
  getSideClass(side: string): string {
    return side === 'BUY' ? 'side-buy' : 'side-sell';
  }

  /**
   * Get CSS class for order status
   */
  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'filled': return 'status-filled';
      case 'canceled': return 'status-canceled';
      case 'rejected': return 'status-rejected';
      case 'expired': return 'status-expired';
      case 'new': return 'status-new';
      case 'partially_filled': return 'status-partial';
      default: return 'status-default';
    }
  }

  /**
   * Get CSS class for P&L values
   */
  getPnlClass(value: number): string {
    if (value > 0) return 'pnl-positive';
    if (value < 0) return 'pnl-negative';
    return 'pnl-neutral';
  }

  /**
   * Extract base coin from trading pair (e.g., BTCUSDT -> BTC)
   */
  private extractBaseCoin(symbol: string): string {
    // Simple extraction - assumes USDT, BUSD, USDC as quote currencies
    const quoteCurrencies = ['USDT', 'BUSD', 'USDC', 'BTC', 'ETH', 'BNB'];

    for (const quote of quoteCurrencies) {
      if (symbol.endsWith(quote)) {
        return symbol.slice(0, -quote.length);
      }
    }

    // Fallback: return first 3-4 characters
    return symbol.slice(0, 3);
  }

  /**
   * Track by function for ngFor optimization
   */
  trackByTrade(index: number, trade: BinanceTradeHistory): number {
    return trade.id;
  }

  trackByOrder(index: number, order: BinanceOrderHistory): number {
    return order.orderId;
  }

  trackByTransfer(index: number, transfer: BinanceTransferHistory): string {
    return transfer.id || `${transfer.coin}-${transfer.time}`;
  }

  /**
   * Export data to CSV (placeholder)
   */
  exportToCSV(): void {
    console.log('Export functionality to be implemented');
    // Implementation would depend on specific requirements
  }

  /**
   * Toggle custom date picker visibility
   */
  toggleCustomDatePicker(): void {
    this.showCustomDatePicker.update(show => !show);
  }
}
