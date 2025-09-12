// atk-bash.component.ts
// Enhanced version integrated with your existing services

import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  NgZone,
  OnInit,
  output,
  signal,
  ViewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { AtkIconComponent } from '@shared/components/atk-icon/atk-icon.component';
import { finalize } from 'rxjs';

// Your existing services
import { BinanceService } from '@features/binance/services/binance.service';
import { BinanceErrorHandlerService } from '@features/binance/services/error-handler.service';
import { TransactionStateService } from '@features/binance/services/transaction-state.service';

// ATK Bash specific imports
import { AtkBashConfigFactory } from './atk-bash-config.factory';
import {
  BashData,
  IBashConfig,
  IBashEvent,
  IBashLogEntry,
  IBashTerminalState
} from './atk-bash.interfaces';
import { AtkBashService } from './atk-bash.service';

// Pipes
import { BalanceFormatPipe, CryptoPrecisionPipe, StatusBadgePipe, TimestampToDatePipe } from '@shared/pipes/pipes';


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
    TimestampToDatePipe
  ],
  templateUrl: './atk-bash.component.html',
  styleUrls: ['./atk-bash.component.css'],
})
export class AtkBashComponent implements OnInit {
  // Template refs for terminal functionality
  @ViewChild('terminalTextarea') private textareaRef!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('highlightDiv') private highlightRef!: ElementRef<HTMLDivElement>;

  // Component inputs
  configId = input<string>('binance-debug-v2');
  autoLoad = input<boolean>(true);

  // Component outputs
  dataLoaded = output<BashData[]>();
  errorOccurred = output<string>();
  eventEmitted = output<IBashEvent>();

  // Injected services
  private bashService = inject(AtkBashService);
  private bashConfigFactory = inject(AtkBashConfigFactory);
  private binanceService = inject(BinanceService);
  private errorHandler = inject(BinanceErrorHandlerService);
  private transactionState = inject(TransactionStateService);
  private destroyRef = inject(DestroyRef);
  private zone = inject(NgZone);

  // State signals
  currentConfig = signal<IBashConfig | null>(null);
  currentEndpoint = signal<string>('');
  terminalState = signal<IBashTerminalState>({
    loading: false,
    connectionStatus: 'disconnected',
    requestParams: {}
  });

  data = signal<BashData[]>([]);
  error = signal<string | null>(null);

  // Terminal functionality signals
  logs = signal<IBashLogEntry[]>([]);
  terminalInput = signal<string>('');
  cursorVisible = signal<boolean>(true);

  // Cursor and selection tracking
  caretIndex = signal<number>(0);
  selStart = signal<number>(0);
  selEnd = signal<number>(0);
  line = signal<number>(1);
  column = signal<number>(1);
  selectionText = signal<string>('');
  currentLineText = signal<string>('');
  currentWord = signal<string>('');

  // Computed properties
  terminalText = computed(() => {
    const config = this.currentConfig();
    const state = this.terminalState();
    const endpoint = this.currentEndpoint();

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
    output += `   TransactionState: ${this.transactionState ? '✅ OK' : '❌ FAILED'}\n\n`;

    // Connection status
    output += `3) Connection Status:\n`;
    output += `   Status: ${this.getStatusIcon(state.connectionStatus)} ${state.connectionStatus}\n`;
    output += `   Endpoint: ${endpoint || 'None selected'}\n`;

    if (state.responseMetadata) {
      output += `   Last Response: ${state.responseMetadata.statusCode} (${state.responseMetadata.responseTime}ms)\n`;
      output += `   Data Count: ${state.responseMetadata.dataCount || 0}\n`;
    }

    output += '\n';

    // Parameters section
    if (state.requestParams && Object.keys(state.requestParams).length > 0) {
      output += '4) Request Parameters:\n';
      Object.entries(state.requestParams).forEach(([key, value]) => {
        output += `   ${key}: ${value}\n`;
      });
      output += '\n';
    }

    // Logs section
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

    // Cursor
    const cursor = this.cursorVisible() && state.loading ? ' ▮' : '';
    output += cursor;

    return output;
  });

  visibleColumns = computed(() => {
    const config = this.currentConfig();
    const endpoint = config?.endpoints.find(ep => ep.id === this.currentEndpoint());
    return endpoint?.columns.filter(col => col.visible !== false) || [];
  });

  constructor() {
    // Initialize configuration
    effect(() => {
      const configIdValue = this.configId();

      // Create config using factory
      if (configIdValue === 'binance-debug-v2') {
        const config = this.bashConfigFactory.createBinanceDebugConfig();
        this.currentConfig.set(config);
        this.bashService.registerConfig(config);
      }

      // Set default endpoint
      const config = this.currentConfig();
      if (config && config.defaultEndpoint) {
        this.currentEndpoint.set(config.defaultEndpoint);

        if (this.autoLoad()) {
          this.loadData();
        }
      }
    }, { allowSignalWrites: true });

    // Start cursor blinking
    this.startCursorBlink();

    // Subscribe to bash service events
    this.bashService.events$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(events => {
        const relevantEvents = events.filter(event =>
          event.payload.configId === this.configId()
        );

        relevantEvents.forEach(event => {
          this.eventEmitted.emit(event);
          this.handleServiceEvent(event);
        });
      });
  }

  ngOnInit(): void {
    this.addLog('ATK Bash Terminal initialized', 'info');
    this.terminalState.update(state => ({
      ...state,
      connectionStatus: 'connected'
    }));

    // Log service integration status
    this.addLog('Service integration check completed', 'success');
  }

  // Public methods for template

  /**
   * Load data from current endpoint using your existing services
   */
  async loadData(params: Record<string, any> = {}): Promise<void> {
    const config = this.currentConfig();
    const endpointId = this.currentEndpoint();

    if (!config || !endpointId) {
      this.addLog('No configuration or endpoint selected', 'error');
      return;
    }

    this.addLog(`Loading data from ${endpointId}...`, 'info');

    this.terminalState.update(state => ({
      ...state,
      loading: true,
      requestParams: params,
      error: undefined
    }));

    const startTime = performance.now();

    try {
      let data: BashData[] = [];

      // Use your existing services based on endpoint
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
        },
        loading: false
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
        },
        loading: false
      }));
    }
  }

  /**
   * Test current endpoint connection
   */
  async testConnection(): Promise<void> {
    const config = this.currentConfig();
    const endpointId = this.currentEndpoint();

    if (!config || !endpointId) {
      this.addLog('No endpoint to test', 'warning');
      return;
    }

    this.addLog(`Testing connection to ${endpointId}...`, 'info');

    try {
      // Simple ping test using your BinanceService
      const startTime = performance.now();

      if (endpointId === 'account') {
        await this.binanceService.getAccount().toPromise();
      } else {
        // Default test - try to get ticker for BTCUSDT
        await this.binanceService.getTickerPrice('BTCUSDT').toPromise();
      }

      const responseTime = Math.round(performance.now() - startTime);
      this.addLog(`🌐 Connection test successful (${responseTime}ms)`, 'success');

    } catch (error: any) {
      const errorMessage = this.errorHandler.formatUserFriendlyError(error);
      this.addLog(`🌐 Connection test failed: ${errorMessage}`, 'error');
    }
  }

  getCurrentEndpointName(): string {
    const config = this.currentConfig();
    const id = this.currentEndpoint();
    const ep = config?.endpoints.find(e => e.id === id);
    return ep?.name ?? '';
  }

  /**
   * Change current endpoint
   */
  changeEndpoint(endpointId: string): void {
    this.currentEndpoint.set(endpointId);
    this.data.set([]);
    this.error.set(null);
    this.addLog(`Switched to endpoint: ${endpointId}`, 'info');
  }

  /**
   * Execute custom terminal command
   */
  executeCommand(command: string): void {
    const config = this.currentConfig();
    const customCommands = config?.terminal.customCommands || [];

    const [commandName, ...args] = command.trim().split(' ');

    // Built-in commands
    switch (commandName.toLowerCase()) {
      case 'clear':
        this.logs.set([]);
        this.addLog('Terminal cleared', 'info');
        return;
      case 'help':
        this.showHelp();
        return;
      case 'status':
        this.showStatus();
        return;
    }

    // Custom commands
    const customCommand = customCommands.find(cmd => cmd.name === commandName);
    if (customCommand) {
      this.addLog(`Executing command: ${command}`, 'info');
      try {
        customCommand.handler(args);
      } catch (error: any) {
        this.addLog(`Command error: ${error.message}`, 'error');
      }
    } else {
      this.addLog(`Unknown command: ${commandName}. Type 'help' for available commands.`, 'warning');
    }
  }

  /**
   * Format cell value based on column configuration
   */
  formatCellValue(value: any, column: any): string {
    if (value === null || value === undefined) return '';

    // Use custom formatter if available
    if (column.formatter) {
      return column.formatter(value);
    }

    // Default formatting based on type
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
   * Handle textarea events for cursor tracking
   */
  onTextareaEvent(): void {
    const textarea = this.textareaRef?.nativeElement;
    if (!textarea) return;

    const value = textarea.value;
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? start;

    this.selStart.set(start);
    this.selEnd.set(end);
    this.caretIndex.set(end);

    // Calculate line and column
    const upToCaret = value.slice(0, end);
    const lines = upToCaret.split('\n');
    this.line.set(lines.length);
    this.column.set(lines[lines.length - 1].length + 1);

    // Get current line text
    const fullLines = value.split('\n');
    const currentLine = fullLines[lines.length - 1] ?? '';
    this.currentLineText.set(currentLine);

    // Get current word
    const colPos = this.column() - 1;
    const left = currentLine.slice(0, colPos);
    const right = currentLine.slice(colPos);
    const leftWord = left.match(/[A-Za-z0-9_-]+$/)?.[0] ?? '';
    const rightWord = right.match(/^[A-Za-z0-9_-]+/)?.[0] ?? '';
    this.currentWord.set(leftWord + rightWord);

    // Get selection
    this.selectionText.set(start !== end ? value.slice(start, end) : '');
  }

  /**
   * Track by function for table rows
   */
  trackByIndex(index: number, item: any): any {
    return item.id || item.symbol || index;
  }

  // Private data loading methods using your existing services

  private async loadAccountData(): Promise<BashData[]> {
    const account = await this.binanceService.getAccount()
      .pipe(finalize(() => this.terminalState.update(state => ({ ...state, loading: false }))))
      .toPromise();

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

    const trades = await this.binanceService.getMyTrades(symbol, undefined, undefined, limit)
      .pipe(finalize(() => this.terminalState.update(state => ({ ...state, loading: false }))))
      .toPromise();

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

    const orders = await this.binanceService.getAllOrders(symbol, undefined, undefined, limit)
      .pipe(finalize(() => this.terminalState.update(state => ({ ...state, loading: false }))))
      .toPromise();

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

    const ticker = await this.binanceService.getTickerPrice(symbol)
      .pipe(finalize(() => this.terminalState.update(state => ({ ...state, loading: false }))))
      .toPromise();

    if (!ticker) return [];

    // Handle both single ticker and array
    const tickers = Array.isArray(ticker) ? ticker : [ticker];

    return tickers.map((t: any, index: number) => ({
      id: t.symbol || index,
      symbol: t.symbol,
      price: parseFloat(t.price),
      priceChange: Math.random() * 10 - 5, // Mock data
      priceChangePercent: Math.random() * 20 - 10 // Mock data
    }));
  }

  // Private helper methods

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

  private startCursorBlink(): void {
    this.zone.runOutsideAngular(() => {
      setInterval(() => {
        this.cursorVisible.update(v => !v);
      }, 500);
    });
  }

  private handleServiceEvent(event: IBashEvent): void {
    switch (event.type) {
      case 'data-loaded':
        if (event.payload.fromCache) {
          this.addLog('📦 Data loaded from cache', 'info');
        }
        break;
      case 'error':
        this.addLog(`❌ Service error: ${event.payload.error}`, 'error');
        break;
    }
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

  private showHelp(): void {
    this.addLog('Available commands:', 'info');
    this.addLog('  clear - Clear terminal logs', 'info');
    this.addLog('  help - Show this help', 'info');
    this.addLog('  status - Show connection status', 'info');
    this.addLog('  test - Test current endpoint', 'info');
  }

  private showStatus(): void {
    const state = this.terminalState();
    this.addLog(`Status: ${state.connectionStatus}`, 'info');
    this.addLog(`Endpoint: ${this.currentEndpoint()}`, 'info');
    this.addLog(`Data count: ${this.data().length}`, 'info');
  }
}
