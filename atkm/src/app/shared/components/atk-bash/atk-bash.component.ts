// atk-bash.component.ts (Updated)
// Terminal component with service integration for sidebar communication

import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, effect, inject, input, NgZone, OnInit, output, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { AtkIconComponent } from '@shared/components/atk-icon/atk-icon.component';
import { finalize, firstValueFrom } from 'rxjs';

import { BinanceErrorHandlerService } from '@app/features/binance/services/binance-error-handler.service';
import { TransactionStateService } from '@app/features/binance/services/binance-transaction-state.service';
import { BinanceService } from '@features/binance/services/binance.service';

import {
  TerminalInputDirective,
  TerminalInputState
} from '@shared/directives/terminal-input.directive';
import { BalanceFormatPipe, CryptoPrecisionPipe, StatusBadgePipe, TimestampToDatePipe } from '@shared/pipes/pipes';
import { IBashConfigEvent, SidebarBashConfigService } from '../sidebar-bash-config/sidebar-bash-config.service';
import { AtkBashConfigFactory } from './atk-bash-config.factory';
import { BashData, IBashConfig, IBashLogEntry, IBashTerminalState } from './atk-bash.interfaces';
import { AtkBashService } from './atk-bash.service';

@Component({
  selector: 'atk-bash',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AtkIconComponent,
    BalanceFormatPipe,
    CryptoPrecisionPipe,
    StatusBadgePipe,
    TimestampToDatePipe,
    TerminalInputDirective
  ],
  templateUrl: './atk-bash.component.html',
  styleUrls: ['./atk-bash.component.css'],
})
export class AtkBashComponent implements OnInit {

  // Modern Angular 20 ViewChild syntax for directive reference
  private terminalDirective = viewChild(TerminalInputDirective);

  // Component inputs
  configId = input<string>('binance-debug-v2');
  autoLoad = input<boolean>(true);

  // Component outputs
  dataLoaded = output<BashData[]>();
  errorOccurred = output<string>();

  // Services
  private bashService = inject(AtkBashService);
  private bashConfigFactory = inject(AtkBashConfigFactory);
  public sidebarConfigService = inject(SidebarBashConfigService);
  private binanceService = inject(BinanceService);
  private errorHandler = inject(BinanceErrorHandlerService);
  private transactionState = inject(TransactionStateService);
  private destroyRef = inject(DestroyRef);
  private zone = inject(NgZone);

  // State signals
  currentConfig = signal<IBashConfig | null>(null);
  terminalState = signal<IBashTerminalState>({
    loading: false,
    connectionStatus: 'disconnected',
    requestParams: {}
  });
  data = signal<BashData[]>([]);
  error = signal<string | null>(null);

  // Terminal functionality signals (now managed by directive)
  logs = signal<IBashLogEntry[]>([]);
  cursorVisible = signal<boolean>(true);
  typingActive = signal<boolean>(false);
  terminalInputState = signal<TerminalInputState>({
    caretIndex: 0,
    selectionStart: 0,
    selectionEnd: 0,
    line: 1,
    column: 1,
    selectionText: '',
    currentLineText: '',
    currentWord: '',
    textValue: ''
  });

  // Computed properties
  terminalText = computed(() => {
    const config = this.currentConfig();
    const sidebarState = this.sidebarConfigService.state();
    const endpoint = sidebarState.currentEndpoint;

    let output = '';

    // Header section
    if (config) {
      output += `1) Configuration: ${config.title}\n`;
      output += `   ${config.subtitle}\n\n`;
    }

    // Service injection status
    output += `2) Service Status:\n`;
    output += `   BinanceService: ${this.binanceService ? '✅ OK' : '❌ FAILED'}\n`;
    output += `   ErrorHandler: ${this.errorHandler ? '✅ OK' : '❌ FAILED'}\n`;
    output += `   TransactionState: ${this.transactionState ? '✅ OK' : '❌ FAILED'}\n`;
    output += `   SidebarConfigService: ${this.sidebarConfigService ? '✅ OK' : '❌ FAILED'}\n\n`;

    // Connection status
    output += `3) Connection Status:\n`;
    output += `   Status: ${this.getStatusIcon(sidebarState.connectionStatus)} ${sidebarState.connectionStatus}\n`;
    output += `   Current Endpoint: ${endpoint || 'None selected'}\n`;

    const termState = this.terminalState();
    if (termState.responseMetadata) {
      output += `   Last Response: ${termState.responseMetadata.statusCode} (${termState.responseMetadata.responseTime}ms)\n`;
      output += `   Data Count: ${termState.responseMetadata.dataCount || 0}\n`;
    }
    output += '\n';

    // Parameters section
    if (sidebarState.parameters && Object.keys(sidebarState.parameters).length > 0) {
      output += '4) Request Parameters:\n';
      Object.entries(sidebarState.parameters).forEach(([key, value]) => {
        output += `   ${key}: ${value}\n`;
      });
      output += '\n';
    }

    // Logs section with typewriter effect
    output += '5) Terminal Log:\n\n';
    const logEntries = this.logs();
    if (logEntries.length === 0) {
      output += '   (no logs yet)\n';
    } else {
      logEntries.forEach(log => {
        const timestamp = log.timestamp.toLocaleTimeString();
        const icon = this.getLogIcon(log.level);
        output += `[${timestamp}] ${icon} ${log.message}\n`;
      });
    }

    // Cursor with typing effect
    const cursor = this.cursorVisible() && (this.typingActive() || sidebarState.loading) ? ' ▮' : '';
    output += cursor;

    return output;
  });

  visibleColumns = computed(() => {
    const config = this.currentConfig();
    const sidebarState = this.sidebarConfigService.state();
    const endpoint = config?.endpoints.find(ep => ep.id === sidebarState.currentEndpoint);
    return endpoint?.columns.filter(col => col.visible !== false) || [];
  });

  constructor() {
    // Initialize configuration
    effect(() => {
      const configIdValue = this.configId();
      if (configIdValue === 'binance-debug-v2') {
        const config = this.bashConfigFactory.createBinanceDebugConfig();
        this.currentConfig.set(config);
        this.bashService.registerConfig(config);
      }
    }, { allowSignalWrites: true });

    // Subscribe to sidebar config service events
    this.sidebarConfigService.events$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(events => {
        const latestEvents = events.slice(-3);
        latestEvents.forEach(event => this.handleSidebarEvent(event));
      });

    // Auto-update terminal content when logs change
    effect(() => {
      this.updateTerminalContent();
    });

    // Start cursor blink
    this.startCursorBlink();
  }

  ngOnInit(): void {
    console.log('🚀 AtkBashComponent ngOnInit');
    this.addLog('ATK Bash Terminal initialized', 'info');
    this.sidebarConfigService.updateConnectionStatus('connected');
    this.addLog('Service integration with sidebar completed', 'success');
  }

  /**
   * Handle terminal state changes from directive
   */
  public onTerminalStateChange(state: TerminalInputState): void {
    this.terminalInputState.set(state);
  }

  /**
   * Update terminal content via directive
   */
  private updateTerminalContent(): void {
    const directive = this.terminalDirective();
    if (!directive) return;

    const newContent = this.terminalText();
    directive.clearContent();
    directive.insertAtCaret(newContent);
  }

  /**
   * Handle events from sidebar config service
   */
  private handleSidebarEvent(event: IBashConfigEvent): void {
    switch (event.type) {
      case 'endpoint-change':
        this.onEndpointChange(event.payload.endpointId);
        break;
      case 'parameter-change':
        this.onParameterChange(event.payload.parameters);
        break;
      case 'load-data':
        this.loadData(event.payload.parameters || {});
        break;
      case 'test-connection':
        this.testConnection();
        break;
      case 'action-trigger':
        this.handleActionTrigger(event.payload.actionId, event.payload.payload);
        break;
    }
  }

  /**
   * Get endpoint name from current sidebar state
   */
  public getCurrentEndpointName(endpointId: string): string {
    const config = this.currentConfig();
    const endpoint = config?.endpoints.find(ep => ep.id === endpointId);
    return endpoint?.name || '';
  }

  /**
   * Handle endpoint change from sidebar
   */
  private onEndpointChange(endpointId: string): void {
    this.data.set([]);
    this.error.set(null);
    this.addLog(`Switched to endpoint: ${endpointId}`, 'info');
    this.updateTerminalContent();
  }

  /**
   * Handle parameter change from sidebar
   */
  private onParameterChange(params: Record<string, any>): void {
    this.terminalState.update(state => ({
      ...state,
      requestParams: { ...state.requestParams, ...params }
    }));
    this.addLog(`Parameters updated: ${JSON.stringify(params)}`, 'info');
  }

  /**
   * Handle action triggers from sidebar
   */
  private handleActionTrigger(actionId: string, payload?: any): void {
    switch (actionId) {
      case 'test-direct-http':
        this.testDirectHttp();
        break;
      case 'test-service-call':
        this.testServiceCall();
        break;
      case 'clear-cache':
        this.clearCache();
        break;
      case 'export-data':
        this.exportData();
        break;
      default:
        this.addLog(`Unknown action: ${actionId}`, 'warning');
    }
  }

  /**
   * Load data from current endpoint using existing services
   */
  public async loadData(params: Record<string, any> = {}): Promise<void> {
    const sidebarState = this.sidebarConfigService.state();
    const endpointId = sidebarState.currentEndpoint;

    if (!endpointId) {
      this.addLog('No endpoint selected', 'error');
      return;
    }

    this.addLog(`🔄 Loading data from ${endpointId}...`, 'info');
    this.sidebarConfigService.updateLoadingState(true);

    const startTime = performance.now();

    try {
      let data: BashData[] = [];

      // Use existing services based on endpoint
      switch (endpointId) {
        case 'account':
          data = await this.loadAccountData();
          break;
        case 'trades':
          data = await this.loadTradesData(params);
          break;
        case 'orders':
          data = await this.loadOrdersData(params);
          break;
        case 'ticker':
          data = await this.loadTickerData(params);
          break;
        default:
          throw new Error(`Unknown endpoint: ${endpointId}`);
      }

      const responseTime = Math.round(performance.now() - startTime);
      this.data.set(data);
      this.error.set(null);

      this.terminalState.update(state => ({
        ...state,
        responseMetadata: {
          statusCode: 200,
          responseTime,
          dataCount: data.length
        }
      }));

      this.addLog(`✅ Data loaded successfully (${data.length} items, ${responseTime}ms)`, 'success');
      this.dataLoaded.emit(data);

    } catch (error: any) {
      const responseTime = Math.round(performance.now() - startTime);
      const errorMessage = this.errorHandler.formatUserFriendlyError(error);

      this.error.set(errorMessage);
      this.addLog(`❌ Error loading data: ${errorMessage}`, 'error');
      this.errorOccurred.emit(errorMessage);

      this.terminalState.update(state => ({
        ...state,
        responseMetadata: {
          statusCode: error.status || 500,
          responseTime
        }
      }));
    } finally {
      this.sidebarConfigService.updateLoadingState(false);
    }
  }

  /**
   * Test current endpoint connection
   */
  async testConnection(): Promise<void> {
    const sidebarState = this.sidebarConfigService.state();
    const endpointId = sidebarState.currentEndpoint;

    if (!endpointId) {
      this.addLog('No endpoint to test', 'warning');
      return;
    }

    this.addLog(`🌐 Testing connection to ${endpointId}...`, 'info');
    this.sidebarConfigService.updateConnectionStatus('connecting');

    try {
      const startTime = performance.now();

      if (endpointId === 'account') {
        await firstValueFrom(this.binanceService.getAccount());
      } else {
        await firstValueFrom(this.binanceService.getTickerPrice('BTCUSDT'));
      }

      const responseTime = Math.round(performance.now() - startTime);
      this.sidebarConfigService.updateConnectionStatus('connected');
      this.addLog(`✅ Connection test successful (${responseTime}ms)`, 'success');

    } catch (error: any) {
      const errorMessage = this.errorHandler.formatUserFriendlyError(error);
      this.sidebarConfigService.updateConnectionStatus('disconnected');
      this.addLog(`❌ Connection test failed: ${errorMessage}`, 'error');
    }
  }

  /**
   * Test direct HTTP call (from binance-debug functionality)
   */
  public async testDirectHttp(): Promise<void> {
    this.addLog('🌐 Starting direct HTTP test...', 'info');
    const url = 'http://localhost:8000/api/v3/account';

    try {
      const response = await fetch(url);
      const data = await response.json();

      this.addLog('✅ Direct HTTP SUCCESS', 'success');
      this.addLog(`Response: ${JSON.stringify(data, null, 2)}`, 'info');

    } catch (error: any) {
      this.addLog(`❌ Direct HTTP ERROR: ${error.message}`, 'error');
    }
  }

  /**
   * Test service call (from binance-debug functionality)
   */
  public async testServiceCall(): Promise<void> {
    this.addLog('🅰️ Starting service call test...', 'info');

    try {
      const account = await firstValueFrom(this.binanceService.getAccount());
      this.addLog('✅ Service call SUCCESS', 'success');
      this.addLog(`Account data received: ${JSON.stringify(account, null, 2)}`, 'info');

    } catch (error: any) {
      this.addLog(`❌ Service call ERROR: ${error.message}`, 'error');
    }
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.bashService.clearCache();
    this.addLog('🗑️ Cache cleared', 'info');
  }

  /**
   * Export data
   */
  public exportData(): void {
    const currentData = this.data();
    if (currentData.length === 0) {
      this.addLog('❌ No data to export', 'warning');
      return;
    }

    // Simple CSV export logic
    const csv = this.convertToCSV(currentData);
    this.downloadCSV(csv, 'bash-data-export.csv');
    this.addLog(`📤 Data exported (${currentData.length} records)`, 'success');
  }

  /**
   * Format cell value based on column configuration
   */
  public formatCellValue(value: any, column: any): string {
    if (value === null || value === undefined) return '';

    if (column.formatter) {
      return column.formatter(value);
    }

    switch (column.type) {
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : value.toString();
      case 'currency':
        return new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR'
        }).format(value);
      case 'percentage':
        return `${(value * 100).toFixed(2)}%`;
      case 'date':
        return new Date(value).toLocaleString('fr-FR');
      case 'boolean':
        return value ? '✅' : '❌';
      default:
        return value.toString();
    }
  }

  /**
   * Track by function for table rows
   */
  public trackByIndex(index: number, item: any): any {
    return item.id || item.symbol || index;
  }

  // Private data loading methods (same as before)
  private async loadAccountData(): Promise<BashData[]> {
    const account = await firstValueFrom(
      this.binanceService.getAccount()
        .pipe(finalize(() => this.sidebarConfigService.updateLoadingState(false)))
    );

    if (!account?.balances) return [];

    return account.balances
      .filter(balance =>
        parseFloat(balance.free.toString()) > 0 ||
        parseFloat(balance.locked.toString()) > 0
      )
      .map(balance => ({
        id: balance.asset,
        asset: balance.asset,
        free: parseFloat(balance.free.toString()),
        locked: parseFloat(balance.locked.toString()),
        total: parseFloat(balance.free.toString()) + parseFloat(balance.locked.toString()),
        usdValue: 0
      }));
  }

  private async loadTradesData(params: Record<string, any>): Promise<BashData[]> {
    const symbol = params.symbol || 'BTCUSDT';
    const limit = params.limit || 100;

    const trades = await firstValueFrom(
      this.binanceService.getMyTrades(symbol, undefined, undefined, limit)
        .pipe(finalize(() => this.sidebarConfigService.updateLoadingState(false)))
    );

    if (!Array.isArray(trades)) return [];

    return trades.map((trade: any) => ({
      id: trade.id || `${trade.symbol}-${trade.time}`,
      symbol: trade.symbol,
      side: trade.isBuyer ? 'BUY' : 'SELL',
      price: parseFloat(trade.price),
      qty: parseFloat(trade.qty),
      quoteQty: parseFloat(trade.quoteQty),
      commission: parseFloat(trade.commission),
      commissionAsset: trade.commissionAsset,
      time: trade.time,
      isBuyer: trade.isBuyer,
      isMaker: trade.isMaker
    }));
  }

  private async loadOrdersData(params: Record<string, any>): Promise<BashData[]> {
    const symbol = params.symbol || 'BTCUSDT';
    const limit = params.limit || 100;

    const orders = await firstValueFrom(
      this.binanceService.getAllOrders(symbol, undefined, undefined, limit)
        .pipe(finalize(() => this.sidebarConfigService.updateLoadingState(false)))
    );

    if (!Array.isArray(orders)) return [];

    return orders.map((order: any) => ({
      id: order.orderId,
      symbol: order.symbol,
      side: order.side,
      type: order.type,
      origQty: parseFloat(order.origQty),
      executedQty: parseFloat(order.executedQty),
      cummulativeQuoteQty: parseFloat(order.cummulativeQuoteQty),
      price: parseFloat(order.price),
      status: order.status,
      timeInForce: order.timeInForce,
      time: order.time,
      updateTime: order.updateTime
    }));
  }

  private async loadTickerData(params: Record<string, any>): Promise<BashData[]> {
    const symbol = params.symbol;

    const ticker = await firstValueFrom(
      this.binanceService.getTickerPrice(symbol)
        .pipe(finalize(() => this.sidebarConfigService.updateLoadingState(false)))
    );

    if (!ticker) return [];

    const tickers = Array.isArray(ticker) ? ticker : [ticker];

    return tickers.map((t: any, index: number) => ({
      id: t.symbol || index,
      symbol: t.symbol,
      price: parseFloat(t.price),
      priceChange: Math.random() * 10 - 5,
      priceChangePercent: Math.random() * 20 - 10
    }));
  }

  /**
   * Add log entry with typewriter effect (from binance-debug)
   */
  public async typeLog(message: string, level: IBashLogEntry['level'] = 'info'): Promise<void> {
    this.typingActive.set(true);

    // Add initial timestamp
    const timestamp = new Date().toLocaleTimeString();
    const initialEntry: IBashLogEntry = {
      timestamp: new Date(),
      message: `[${timestamp}] `,
      level
    };

    this.logs.update(logs => [...logs, initialEntry]);
    const logIndex = this.logs().length - 1;

    // Type character by character
    for (let i = 0; i < message.length; i++) {
      const char = message[i];

      this.logs.update(logs => {
        const copy = [...logs];
        copy[logIndex] = {
          ...copy[logIndex],
          message: copy[logIndex].message + char
        };
        return copy;
      });

      // Update terminal display
      this.updateTerminalContent();
      this.scheduleScroll();

      // Typing delay with variations
      const baseDelay = Math.random() * 15 + 10;
      const extraDelay =
        char === ' ' ? 40 + Math.random() * 80 :
          /[.,;:!?)]/.test(char) ? 80 + Math.random() * 140 : 0;

      await new Promise(resolve => setTimeout(resolve, baseDelay + extraDelay));
    }

    this.typingActive.set(false);
  }

  // Helper methods

  private addLog(message: string, level: IBashLogEntry['level']): void {
    const logEntry: IBashLogEntry = {
      timestamp: new Date(),
      message,
      level
    };

    this.logs.update(logs => {
      const newLogs = [...logs, logEntry];
      return newLogs.slice(-50); // Keep only last 50 logs
    });
  }

  private scheduleScroll(): void {
    const directive = this.terminalDirective();
    if (!directive) return;

    this.zone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          directive.scrollToBottom();
        });
      });
    });
  }

  private startCursorBlink(): void {
    this.zone.runOutsideAngular(() => {
      setInterval(() => this.cursorVisible.update(v => !v), 500);
    });
  }

  private getStatusIcon(status: string): string {
    switch (status) {
      case 'connected': return '🟢';
      case 'connecting': return '🟡';
      case 'disconnected': return '🔴';
      default: return '⚪';
    }
  }

  private getLogIcon(level: string): string {
    switch (level) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📝';
    }
  }

  private convertToCSV(data: BashData[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',')
            ? `"${value}"`
            : value;
        }).join(',')
      )
    ].join('\n');

    return csvContent;
  }

  private downloadCSV(csvContent: string, filename: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // Convenient accessors for template
  public line(): number {
    return this.terminalInputState().line;
  }

  public column(): number {
    return this.terminalInputState().column;
  }

  public caretIndex(): number {
    return this.terminalInputState().caretIndex;
  }

  public selectionText(): string {
    return this.terminalInputState().selectionText;
  }
}
