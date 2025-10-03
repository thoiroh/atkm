// atk-bash.component.ts
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
  TerminalInputDirective
} from '@shared/directives/terminal-input.directive';
import { BalanceFormatPipe } from '@shared/pipes/pipes';
import { ApiManagementStateService } from '@shared/services/atk-api-management-state.service';
import { ToolsService } from '@shared/services/tools.service';
import { AtkBashConfigFactory } from './atk-bash-config.factory';
import { BashData, IBashConfig, IBashDataTransformResult, IBashEvent, IBashLogEntry, IBashTerminalState, ITerminalInputState } from './atk-bash.interfaces';
import { AtkBashService } from './atk-bash.service';

@Component({
  selector: 'atk-bash',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AtkIconComponent,
    BalanceFormatPipe,
    TerminalInputDirective
  ],
  templateUrl: './atk-bash.component.html',
  // styleUrls: ['./atk-bash.component.css'],
})
export class AtkBashComponent implements OnInit {

  // Modern Angular 20 ViewChild syntax for directive reference
  private terminalDirective = viewChild(TerminalInputDirective);
  private tools = inject(ToolsService);

  // Component inputs
  configId = input<string>('binance-debug-v2');
  autoLoad = input<boolean>(true);
  history: string[] = [];
  // Component outputs
  dataLoaded = output<BashData[]>();
  errorOccurred = output<string>();
  eventEmitted = output<IBashEvent>();

  // Services
  private bashService = inject(AtkBashService);
  private bashConfigFactory = inject(AtkBashConfigFactory);
  private binanceService = inject(BinanceService);
  private errorHandler = inject(BinanceErrorHandlerService);
  private transactionState = inject(TransactionStateService);
  private destroyRef = inject(DestroyRef);
  private zone = inject(NgZone);
  private apiManagementState = inject(ApiManagementStateService); // CORRECTED path

  // =========================================
  // SIGNALS - Angular 20 Style
  // =========================================

  private currentEndpoint = signal<string>('');
  private data = signal<BashData[]>([]);
  private error = signal<string | null>(null);
  private logs = signal<IBashLogEntry[]>([]);

  // State signals - accessible in template
  terminalState = signal<IBashTerminalState>({
    loading: false,
    connectionStatus: 'disconnected',
    requestParams: {},
  });

  protected currentConfig = signal<IBashConfig | null>(null);
  protected loading = signal<boolean>(false);
  scrollState = signal<{ contentHeight: number; visibleHeight: number }>({
    contentHeight: 0,
    visibleHeight: 0
  });

  scrollStateDisplay = computed(() => {
    const state = this.scrollState();
    return {
      contentHeight: state.contentHeight,
      visibleHeight: state.visibleHeight
    };
  });

  configRequest = output<IBashConfig>();

  emitCurrentConfig(): void {
    const config = this.currentConfig();
    if (config) {
      this.configRequest.emit(config);
    }
  }
  // =========================================
  // COMPUTED SIGNALS
  // =========================================

  // CORRECTED: Simple terminal state without directive dependency
  private terminalInputState = computed<ITerminalInputState>(() => ({
    content: '',
    line: 0,
    column: 0,
    caretIndex: 0,
    selectionText: '',
    history: [],
    historyIndex: -1
  }));

  // Terminal display with cursor animation
  terminalContent = computed(() => {
    const state = this.terminalInputState();
    const logs = this.logs();

    let output = '';

    // Add logs
    logs.forEach(log => {
      const icon = this.getLogIcon(log.level);
      const timestamp = log.timestamp.toLocaleTimeString('fr-FR', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      output += `[${timestamp}] ${icon} ${log.message}\n`;
    });

    // Add current input line with cursor
    const cursor = Date.now() % 1000 < 500 ? '▮' : '';
    output += cursor;
    return output;
  });

  visibleColumns = computed(() => {
    const config = this.currentConfig();
    const endpoint = config?.endpoints.find(ep => ep.id === this.currentEndpoint());
    return endpoint?.columns.filter(col => col.visible !== false) || [];
  });

  // Get current endpoint name
  getCurrentEndpointName = computed(() => {
    const config = this.currentConfig();
    const endpointId = this.currentEndpoint();
    const endpoint = config?.endpoints.find(ep => ep.id === endpointId);
    return endpoint?.name || 'Unknown Endpoint';
  });

  // =========================================
  // CONSTRUCTOR & EFFECTS
  // =========================================

  constructor() {
    // Initialize configuration
    effect(() => {
      const configIdValue = this.configId();
      // TAG: atk-bash.165 ================ CONSOLE LOG IN PROGRESS
      this.tools.consoleGroup({
        title: `atk-bash 165 AtkBashComponent -> constructor -> effect() triggered / configIdValue: ${configIdValue}`,
        tag: 'check', palette: 'su', collapsed: true,
        data: null
      });

      if (configIdValue === 'binance-debug-v2') {
        const config = this.bashConfigFactory.createBinanceDebugConfig();
        console.log('Config created:', config);
        this.currentConfig.set(config);
        this.bashService.registerConfig(config);

        // Set config in API management service
        this.apiManagementState.setConfigId(configIdValue);
      }

      // Set default endpoint
      const config = this.currentConfig();
      if (config && config.defaultEndpoint) {
        console.log('Setting default endpoint:', config.defaultEndpoint);
        this.currentEndpoint.set(config.defaultEndpoint);

        // Set endpoint in API management service
        this.apiManagementState.setCurrentEndpoint(config.defaultEndpoint);

        if (this.autoLoad()) {
          this.loadData();
        }
      }
    });

    // Effect to sync data with ApiManagementStateService
    effect(() => {
      const tableData = this.apiManagementState.tableData();
      if (tableData.length > 0) {
        this.data.set(tableData);
        console.log('📊 Data synced from ApiManagementStateService:', tableData.length, 'items');
      }
    });

    // Effect to sync loading state
    effect(() => {
      const loading = this.apiManagementState.loading();
      this.terminalState.update(state => ({ ...state, loading }));
    });

    // Effect to sync error state
    effect(() => {
      const error = this.apiManagementState.error();
      if (error) {
        this.error.set(error);
        this.addLog(`❌ API Error: ${error}`, 'error');
      }
    });

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

    // Subscribe to API management events
    this.apiManagementState.events$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        // OFF: atk-bash.233 ================ CONSOLE LOG IN PROGRESS
        // this.tools.consoleGroup({
        //   title: `atk-bash 233 received event: ${event.type}`,
        //   tag: 'check',
        //   data: event.payload,
        //   palette: 'de',
        //   collapsed: true,
        //   fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        //   fontSizePx: 13
        // });
        this.handleApiManagementEvent(event);
      });

    // Auto-update terminal content when logs change
    effect(() => {
      this.updateTerminalContent();
    });
  }

  ngOnInit(): void {

    this.debugFactory();

    this.addLog('ATK Bash Terminal initialized', 'info');
    this.terminalState.update(state => ({
      ...state,
      connectionStatus: 'connected'
    }));
    this.addLog('Service integration check completed', 'success');

    // Post-init check

    // setTimeout(() => {
    //   // TAG: atk-bash.274 ================ CONSOLE LOG IN PROGRESS
    //   this.tools.consoleGroup({
    //     title: `atk-bash 274 AtkBashComponent -> ngOnInit -> setTimeout -> Current endpoint: ${this.currentConfig()}`,
    //     tag: 'check',
    //     data: {
    //       'Current endpoint:': this.currentEndpoint(),
    //       'Current config:': this.currentConfig()
    //     },
    //     palette: 'su',
    //     collapsed: true,
    //   });

    //   if (!this.currentEndpoint() && this.currentConfig()?.defaultEndpoint) {
    //     console.warn('⚠️ Endpoint not set, forcing default');
    //     this.currentEndpoint.set(this.currentConfig()!.defaultEndpoint!);
    //   }
    // }, 500);
  }

  // =========================================
  // PUBLIC METHODS
  // =========================================

  /**
   * Load data from current endpoint - EXTENDED with ApiManagementStateService
   */
  public async loadData(params: Record<string, any> = {}): Promise<void> {
    const config = this.currentConfig();
    const endpointId = this.currentEndpoint();

    if (!config || !endpointId) {
      this.addLog('No configuration or endpoint selected', 'error');
      return;
    }

    const endpoint = config.endpoints.find(ep => ep.id === endpointId);
    if (!endpoint) {
      this.addLog(`Endpoint ${endpointId} not found in configuration`, 'error');
      return;
    }

    this.addLog(`Loading data from ${endpointId}...`, 'info');

    // Set loading state in API management service
    this.apiManagementState.setLoading(true);

    this.terminalState.update(state => ({
      ...state,
      loading: true,
      requestParams: params,
      error: undefined
    }));

    const startTime = performance.now();

    try {
      let data: BashData[] = [];
      let rawApiResponse: any = null;

      // Use existing services based on endpoint
      switch (endpointId) {
        case 'account':
          rawApiResponse = await firstValueFrom(
            this.binanceService.getAccount()
              .pipe(finalize(() => this.apiManagementState.setLoading(false)))
          );
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

      // Transform data using endpoint's dataTransformer
      if (rawApiResponse && endpoint.dataTransformer) {
        const transformResult: IBashDataTransformResult = endpoint.dataTransformer(rawApiResponse);

        // Update ApiManagementStateService with transformed data
        this.apiManagementState.updateData(transformResult);

        // Set table data locally (will be synced via effect)
        data = transformResult.tableData;
      }

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
      console.error('❌ Data loading error:', error);

      const errorMessage = error.message || 'Unknown error occurred';
      this.error.set(errorMessage);

      // Set error in API management service
      this.apiManagementState.setError(errorMessage);

      this.terminalState.update(state => ({
        ...state,
        loading: false,
        error: errorMessage
      }));

      this.addLog(`❌ Error: ${errorMessage}`, 'error');
      this.errorOccurred.emit(errorMessage);
    }
  }

  /**
   * Change current endpoint
   */
  public changeEndpoint(endpointId: string): void {
    this.currentEndpoint.set(endpointId);

    // Update API management service
    this.apiManagementState.setCurrentEndpoint(endpointId);

    this.data.set([]);
    this.error.set(null);
    this.addLog(`Switched to endpoint: ${endpointId}`, 'info');
  }

  /**
   * Handle endpoint selection change
   */
  public onEndpointChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target && target.value) {
      this.changeEndpoint(target.value);
    }
  }

  /**
   * Execute custom terminal command
   */
  public executeCommand(command: string): void {
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
      case 'reload':
        this.loadData();
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
  public formatCellValue(value: any, column: any): string {
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
   * Track by function for table rows
   */
  public trackByIndex(index: number, item: any): any {
    return item.id || item.symbol || index;
  }

  // =========================================
  // PRIVATE HELPER METHODS
  // =========================================

  private addLog(message: string, level: IBashLogEntry['level']): void {
    const logEntry: IBashLogEntry = {
      timestamp: new Date(),
      message,
      level
    };

    this.logs.update(logs => {
      const newLogs = [...logs, logEntry];
      return newLogs.slice(-50);
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

  // Handle API Management Service events
  private handleApiManagementEvent(event: IBashEvent): void {
    switch (event.type) {
      case 'data-loaded':
        this.addLog(`📊 Data updated: ${event.payload.tableCount} table rows, ${event.payload.sidebarCount} sidebar fields`, 'success');
        break;
      case 'sidebar-data-updated':
        this.addLog(`🔧 Sidebar data updated`, 'info');
        break;
      case 'table-data-updated':
        this.addLog(`📋 Table data updated: ${event.payload.data.length} rows`, 'info');
        break;
      case 'error':
        this.addLog(`❌ API Management error: ${event.payload.error}`, 'error');
        break;
    }
  }

  private updateTerminalContent(): void {
    // Implementation for terminal content update if needed
  }

  private showHelp(): void {
    const config = this.currentConfig();
    const commands = ['clear', 'help', 'status', 'reload'];

    if (config?.terminal.customCommands) {
      commands.push(...config.terminal.customCommands.map(cmd => cmd.name));
    }

    this.addLog(`Available commands: ${commands.join(', ')}`, 'info');
  }

  private showStatus(): void {
    const state = this.terminalState();
    const summary = this.apiManagementState.summary();

    this.addLog(`Status: ${state.connectionStatus} | Data: ${summary.tableRows} rows | Endpoint: ${summary.endpoint}`, 'info');
  }

  // Private data loading methods using existing services
  private async loadAccountData(): Promise<BashData[]> {
    const account = await firstValueFrom(
      this.binanceService.getAccount()
        .pipe(finalize(() => this.terminalState.update(state => ({ ...state, loading: false }))))
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
        .pipe(finalize(() => this.terminalState.update(state => ({ ...state, loading: false }))))
    );

    if (!Array.isArray(trades)) return [];

    return trades.map((trade: any) => ({
      id: trade.id || `${trade.symbol}-${trade.time}`,
      symbol: trade.symbol,
      side: trade.isBuyer ? 'BUY' : 'SELL',
      quantity: parseFloat(trade.qty),
      price: parseFloat(trade.price),
      quoteQuantity: parseFloat(trade.quoteQty),
      commission: parseFloat(trade.commission),
      time: trade.time
    }));
  }

  private async loadOrdersData(params: Record<string, any>): Promise<BashData[]> {
    const symbol = params.symbol || 'BTCUSDT';
    const limit = params.limit || 100;

    const orders = await firstValueFrom(
      this.binanceService.getAllOrders(symbol, undefined, undefined, limit)
        .pipe(finalize(() => this.terminalState.update(state => ({ ...state, loading: false }))))
    );

    if (!Array.isArray(orders)) return [];

    return orders.map((order: any) => ({
      id: order.orderId || `${order.symbol}-${order.time}`,
      symbol: order.symbol,
      side: order.side,
      type: order.type,
      quantity: parseFloat(order.origQty),
      price: parseFloat(order.price),
      status: order.status,
      executedQty: parseFloat(order.executedQty),
      time: order.time
    }));
  }

  private async loadTickerData(params: Record<string, any>): Promise<BashData[]> {
    const symbol = params.symbol;

    const ticker = await firstValueFrom(
      this.binanceService.getTickerPrice(symbol)
        .pipe(finalize(() => this.terminalState.update(state => ({ ...state, loading: false }))))
    );

    const tickers = Array.isArray(ticker) ? ticker : [ticker];

    return tickers.map((ticker: any, index: number) => ({
      id: ticker.symbol || index,
      symbol: ticker.symbol,
      price: parseFloat(ticker.price),
      priceChange: Math.random() * 10 - 5,
      priceChangePercent: Math.random() * 20 - 10
    }));
  }

  // Status icon helper - accessible in template
  protected getStatusIcon(status: string): string {
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

  // CORRECTED: Convenient accessors for template (delegation to directive state)
  public line(): number { return 0; }
  public column(): number { return 0; }
  public caretIndex(): number { return 0; }
  public selectionText(): string { return ''; }

  public debugFactory(): void {
    // TAG: atk-bash.702 ================ CONSOLE LOG IN PROGRESS
    this.tools.consoleGroup({
      title: `atk-bash 702 AtkBashComponent -> debugFactory(1) -> currentConfig: ${this.currentConfig()}`,
      tag: 'check',
      data: { config: this.bashConfigFactory, currentConfig: this.currentConfig() },
      palette: 'su',
      collapsed: true,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSizePx: 13
    });

    const config = this.currentConfig();
    if (config) {
      // TAG: atk-bash.715 ================ CONSOLE LOG IN PROGRESS
      this.tools.consoleGroup({
        title: `atk-bash 715 AtkBashComponent -> debugFactory(2) -> currentEndpoint: ${this.currentEndpoint()}`,
        tag: 'check',
        data: {
          'Config endpoints': config.endpoints,
          'Default endpoint:': config.defaultEndpoint,
          'Current endpoint signal:': this.currentEndpoint()
        },
        palette: 'su',
        collapsed: true,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSizePx: 13
      });
    }
  }

  // Terminal event handlers
  protected onTerminalContentChange(event: any): void {
    // Handle terminal content changes
    console.log('Terminal content changed:', event);
  }

  protected onTerminalScroll(event: any): void {
    // Handle terminal scroll events
    this.scrollState.set({
      contentHeight: event.target.scrollHeight,
      visibleHeight: event.target.clientHeight
    });
  }
}
