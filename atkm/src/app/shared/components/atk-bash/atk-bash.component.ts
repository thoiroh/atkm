// atk-bash.component.v02.ts

import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, effect, inject, input, NgZone, OnInit, output, signal, untracked, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, firstValueFrom } from 'rxjs';

import { BashData, IBashConfig, IBashLogEntry, IBashTerminalState } from '@shared/components/atk-bash/atk-bash.interfaces';

import { BinanceErrorHandlerService } from '@features/binance/services/binance-error-handler.service';
import { TransactionStateService } from '@features/binance/services/binance-transaction-state.service';
import { BinanceService } from '@features/binance/services/binance.service';
import { AtkBashConfigFactory } from '@shared/components/atk-bash/atk-bash-config.factory';
import { AtkBashService } from '@shared/components/atk-bash/atk-bash.service';
import { IBashConfigEvent, SidebarBashConfigService } from '@shared/components/sidebar-bash-config/sidebar-bash-config.service';
import { ToolsService } from '@shared/services/tools.service';

import { AtkIconComponent } from '@shared/components/atk-icon/atk-icon.component';
import { TerminalInputDirective, TerminalInputState } from '@shared/directives/terminal-input.directive';

import { AtkDatatableComponent } from '@shared/components/atk-datatable/atk-datatable.component';
// import { BalanceFormatPipe, CryptoPrecisionPipe, StatusBadgePipe, TimestampToDatePipe } from '@shared/pipes/pipes';

@Component({
  selector: 'atk-bash',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AtkIconComponent,
    TerminalInputDirective,
    AtkDatatableComponent
  ],
  templateUrl: './atk-bash.component.html',
  styleUrls: ['./atk-bash.component.css']
})
export class AtkBashComponent implements OnInit {

  // ======================================================
  // DEPENDENCIES & INPUTS / OUTPUTS
  // ======================================================

  private terminalDirective = viewChild(TerminalInputDirective);
  private readonly tools = inject(ToolsService);

  configId = input<string>('binance-debug-v2');
  autoLoad = input<boolean>(true);
  dataLoaded = output<BashData[]>();
  errorOccurred = output<string>();
  public sidebarConfigService = inject(SidebarBashConfigService);
  public bashService = inject(AtkBashService);
  private bashConfigFactory = inject(AtkBashConfigFactory);
  private binanceService = inject(BinanceService);
  private errorHandler = inject(BinanceErrorHandlerService);
  private transactionState = inject(TransactionStateService);
  private destroyRef = inject(DestroyRef);
  private zone = inject(NgZone);

  // ======================================================
  // LOCAL STATE
  // ======================================================

  private _isProcessingEvent = false; // Anti-loop flag
  currentConfig = signal<IBashConfig | null>(null);
  terminalState = signal<IBashTerminalState>({
    loading: false,
    connectionStatus: 'disconnected',
    requestParams: {}
  });
  data = signal<BashData[]>([]);
  selectedRowData = signal<BashData | null>(null); // NEW
  error = signal<string | null>(null);
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

  // ======================================================
  // COMPUTED SIGNALS
  // ======================================================

  terminalText = computed(() => {
    const config = this.currentConfig();
    const sidebarState = this.sidebarConfigService.state();
    const endpoint = sidebarState.currentEndpoint;
    let output = '';
    // Header section
    if (config) {
      output += `Configuration: ${config.title}\n`;
      output += `${config.subtitle}\n`;
      output += `-----------------------------------------\n`;
    }
    // Service injection status
    output += `Service Status:\n`;
    output += `BinanceService: ${this.binanceService ? '✅ OK' : '❌ FAILED'}\n`;
    output += `ErrorHandler: ${this.errorHandler ? '✅ OK' : '❌ FAILED'}\n`;
    output += `TransactionState: ${this.transactionState ? '✅ OK' : '❌ FAILED'}\n`;
    output += `SidebarConfigService: ${this.sidebarConfigService ? '✅ OK' : '❌ FAILED'}\n`;
    output += `-----------------------------------------\n`;
    // Connection status
    output += `Connection Status:\n`;
    output += `Status: ${this.getStatusIcon(sidebarState.connectionStatus)} ${sidebarState.connectionStatus}\n`;
    output += `Current Endpoint: ${endpoint || 'None selected'}\n`;
    output += `-----------------------------------------\n`;
    const termState = this.terminalState();
    if (termState.responseMetadata) {
      output += `Last Response: ${termState.responseMetadata.statusCode} (${termState.responseMetadata.responseTime}ms)\n`;
      output += `Data Count: ${termState.responseMetadata.dataCount || 0}\n`;
      output += `-----------------------------------------\n`;
    }
    // Parameters section
    if (sidebarState.parameters && Object.keys(sidebarState.parameters).length > 0) {
      output += 'Request Parameters:\n';
      Object.entries(sidebarState.parameters).forEach(([key, value]) => {
        output += `${key}: ${value}\n`;
      });
      output += `-----------------------------------------\n`;
    }
    // Logs section with typewriter effect
    output += 'Terminal Log:\n';
    const logEntries = this.logs();
    if (logEntries.length === 0) {
      output += '(no logs yet)\n';
    } else {
      logEntries.forEach(log => {
        const timestamp = log.timestamp.toLocaleTimeString();
        const icon = this.getLogIcon(log.level);
        output += `[${timestamp}] ${icon} ${log.message}\n`;
      });
    }

    const cursor = this.cursorVisible() && this.typingActive() ? ' ▮' : '';
    return output + cursor;
  });

  public visibleColumns = computed(() => {
    const cfg = this.currentConfig();
    const sidebar = this.sidebarConfigService.state();
    const ep = cfg?.endpoints.find(e => e.id === sidebar.currentEndpoint);
    return ep?.columns.filter(c => c.visible !== false) || [];
  });

  /**
   * Get terminal height from config
   */
  public terminalHeight = computed(() => {
    const cfg = this.currentConfig();
    return cfg?.terminal.height || '100px';
  });

  /**
   * Get last log entry
   */
  public lastLog = computed(() => {
    const logList = this.logs();
    return logList.length > 0 ? logList[logList.length - 1] : null;
  });

  // ======================================================
  // CONSTRUCTOR
  // ======================================================

  constructor() {
    effect(() => {
      const events = this.bashService.events();
      const latest = events.at(-1);
      if (!latest || this._isProcessingEvent) return;

      // this.tools.consoleGroup({ // TAG AtkBashComponent -> effect(bashService.events)
      //   title: `AtkBashComponent -> effect(bashService.events) -> configId()`, tag: 'check', palette: 'ac', collapsed: false,
      //   data: { latestEv: latest, curcfg: this.currentConfig() }
      // });

      this._isProcessingEvent = true;
      untracked(() => {
        switch (latest.type) {
          case 'data-loaded':
            this.data.set(latest.payload.data);
            this.addLog(`✅ Data loaded (${latest.payload.data.length})`, 'success');
            this.dataLoaded.emit(latest.payload.data);
            break;
          case 'error':
            const err = latest.payload.error || 'Unknown error';
            this.error.set(err);
            this.addLog(`❌ ${err}`, 'error');
            this.errorOccurred.emit(err);
            break;
          case 'endpoint-changed':
            this.addLog(`Endpoint changed: ${latest.payload.configId}`, 'info');
            break;
        }
        this._isProcessingEvent = false;
      });
    });

    // Effect to sync selected row with sidebar service
    effect(() => {
      const selected = this.selectedRowData();
      untracked(() => {
        this.sidebarConfigService.updateSelectedRow(selected);
      });
    });

    effect(() => {
      const ev = this.sidebarConfigService.events();
      const last = ev.at(-1);
      if (!last || this._isProcessingEvent) return;

      // this.tools.consoleGroup({ // OFF AtkBashComponent -> effect(sidebarConfigService.events) ================= CONSOLE LOG IN PROGRESS
      //   title: `AtkBashComponent -> effect(sidebarConfigService.events) -> configId()`, tag: 'check', palette: 'ac', collapsed: false,
      //   data: { latestEv: last, curcfg: this.currentConfig() }
      // });

      this._isProcessingEvent = true;
      untracked(() => {
        switch (last.type) {
          case 'endpoint-change':
            this.data.set([]);
            this.error.set(null);
            this.addLog(`Switched to endpoint: ${last.payload.endpointId}`, 'info');
            break;

          case 'parameter-change':
            this.terminalState.update(s => ({
              ...s,
              requestParams: { ...s.requestParams, ...last.payload.parameters }
            }));
            this.addLog(`Parameters updated: ${JSON.stringify(last.payload.parameters)}`, 'info');
            break;

          case 'load-data':
            this.addLog(`🔄 Loading data from ${last.payload.endpoint}...`, 'info');
            this.loadData(last.payload.parameters || {});
            break;

          case 'test-connection':
            this.testConnection();
            break;

          case 'action-trigger':
            this.handleActionTrigger(last.payload.actionId, last.payload.payload);
            break;
        }
        this._isProcessingEvent = false;
      });
    });

    effect(() => {
      this.updateTerminalContent();
    });

    // Effect to update sidebar data when data is loaded
    effect(() => {
      const events = this.bashService.events();
      const latestEvent = events.at(-1);

      if (!latestEvent || latestEvent.type !== 'data-loaded') return;

      untracked(() => {
        const config = this.currentConfig();
        const endpoint = config?.endpoints.find(ep => ep.id === latestEvent.payload.endpointId);

        // Extract sidebarData from dataTransformer result
        if (endpoint?.dataTransformer && latestEvent.payload.data) {
          const transformResult = endpoint.dataTransformer(latestEvent.payload);

          // Update sidebar config service with sidebarData
          if (transformResult?.sidebarData) {
            this.sidebarConfigService.updateSidebarData(transformResult.sidebarData);
          }
        }
      });
    });
    // this.startCursorBlink();
  }

  // ======================================================
  // LIFECYCLE
  // ======================================================

  ngOnInit(): void {
    const id = this.configId();
    let cfg = this.bashService.getConfig(id);

    // If config absent and id matches, create it via factory
    if (!cfg && id === 'binance-debug-v2') {
      cfg = this.bashConfigFactory.createBinanceDebugConfig();
      this.bashService.registerConfig(cfg);
    }

    if (cfg) {
      this.currentConfig.set(cfg);
      if (cfg.defaultEndpoint) {
        this.sidebarConfigService.updateEndpoint(cfg.defaultEndpoint);
      }
    }

    this.addLog('ATK Bash Terminal initialized', 'info');
    this.sidebarConfigService.updateConnectionStatus('connected');

    // Auto-load data if enabled and connected
    if (this.autoLoad() && this.sidebarConfigService.state().connectionStatus === 'connected') {
      const sidebarState = this.sidebarConfigService.state();

      if (sidebarState.currentEndpoint) {
        this.addLog(`🔄 Auto-loading data from ${sidebarState.currentEndpoint}...`, 'info');
        const defaultParams = this.getDefaultParameters();
        this.loadData(defaultParams);
      } else {
        this.addLog('⚠️ No endpoint selected for auto-load', 'warning');
      }
    }
  }

  // ======================================================
  // PUBLIC METHODS
  // ======================================================

  testLoadData(): void {
    this.loadData({ symbol: 'BTCUSDT' });
  }

  /**
   * Handle terminal state changes from directive
   */
  public onTerminalStateChange(state: TerminalInputState): void {
    this.terminalInputState.set(state);
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.bashService.clearCache();
    this.addLog('🗑️ Cache cleared', 'info');
  }

  /**
   * Handle row selection from datatable
   */
  public onRowSelected(row: BashData): void {
    console.log('🔥 BASH RECEIVED ROW', row); // DEBUG
    this.selectedRowData.set(row);

    // Request sidebar to open via service event
    this.sidebarConfigService.requestSidebarOpen();

    this.addLog(`📋 Row selected: ${row.asset || row.symbol || row.id}`, 'info');

    this.tools.consoleGroup({
      title: `Row selected in bash component`,
      tag: 'check',
      palette: 'su',
      collapsed: false,
      data: row
    });
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
   * Track by function for table rows
   */
  public trackByIndex(index: number, item: any): any {
    return item.id || item.symbol || index;
  }

  /**
   * Handle terminal scroll state changes
   */
  // onTerminalScrollChange(scrollState: TerminalScrollState): void {
  //   // this.terminalScrollState.set(scrollState);
  // }

  // =========================================
  // PRIVATE METHODS
  // =========================================

  /**
   * Update terminal content via directive
   */
  private updateTerminalContent(): void {
    const directive = this.terminalDirective();
    if (!directive) return;

    const newContent = this.terminalText();
    directive.clearContent();
    directive.insertAtCaret(newContent);
    this.scheduleScroll();

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
   * Get default parameters based on current endpoint
   */
  private getDefaultParameters(): Record<string, any> {
    const sidebarState = this.sidebarConfigService.state();
    const endpointId = sidebarState.currentEndpoint;

    // Return existing sidebar parameters if any
    if (Object.keys(sidebarState.parameters).length > 0) {
      return sidebarState.parameters;
    }

    // Otherwise return endpoint-specific defaults
    switch (endpointId) {
      case 'trades':
      case 'orders':
        return { symbol: 'BTCUSDT', limit: 100 };
      case 'ticker':
        return { symbol: 'BTCUSDT' };
      case 'account':
      default:
        return {};
    }
  }

  // =========================================
  // ASYNC OPERATIONS
  // =========================================

  /**
   * Load data from current endpoint using existing services
   *
   * @date 08/10/2025
   * @param [params={}]
   * @return {*}
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
   * Test connection to current endpoint
   *
   * @date 08/10/2025
   * @return {*}
   */
  async testConnection(): Promise<void> {
    const sidebarState = this.sidebarConfigService.state();
    const endpointId = sidebarState.currentEndpoint;

    if (!endpointId) {
      this.addLog('⚠️ No endpoint to test', 'warning');
      return;
    }

    this.addLog(`🌐 Testing connection to ${endpointId}...`, 'info');
    this.sidebarConfigService.updateConnectionStatus('connecting');

    try {
      const startTime = performance.now();

      // Test the actual selected endpoint
      switch (endpointId) {
        case 'account':
          await firstValueFrom(this.binanceService.getAccount());
          break;
        case 'trades':
          const tradeSymbol = sidebarState.parameters.symbol || 'BTCUSDT';
          await firstValueFrom(this.binanceService.getMyTrades(tradeSymbol, undefined, undefined, 1));
          break;
        case 'orders':
          const orderSymbol = sidebarState.parameters.symbol || 'BTCUSDT';
          await firstValueFrom(this.binanceService.getAllOrders(orderSymbol, undefined, undefined, 1));
          break;
        case 'ticker':
          const tickerSymbol = sidebarState.parameters.symbol || 'BTCUSDT';
          await firstValueFrom(this.binanceService.getTickerPrice(tickerSymbol));
          break;
        default:
          throw new Error(`Unknown endpoint: ${endpointId}`);
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
   *
   * @date 08/10/2025
   * @return {*}
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
   *
   * @date 08/10/2025
   * @return {*}
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

  // =========================================
  // PRIVATE DATA LOADING METHODS
  // =========================================

  /**
   * Load account data
   *
   * @date 08/10/2025
   * @private
   * @return {*}
   */
  // atk-bash.component.ts
  // MODIFICATION DE LA MÉTHODE loadAccountData() pour extraire sidebarData

  /**
   * Load account data
   */
  private async loadAccountData(): Promise<BashData[]> {
    const account = await firstValueFrom(
      this.binanceService.getAccount()
        .pipe(finalize(() => this.sidebarConfigService.updateLoadingState(false)))
    );

    if (!account?.balances) return [];

    // ====================================
    // EXTRACT SIDEBAR DATA - NEW
    // ====================================
    const sidebarData = {
      canTrade: account.canTrade || false,
      canWithdraw: account.canWithdraw || false,
      canDeposit: account.canDeposit || false,
      updateTime: account.updateTime || Date.now(),
      accountType: account.accountType || 'SPOT',
      // Additional properties from BinanceAccount
      makerCommission: account.makerCommission || 0,
      takerCommission: account.takerCommission || 0,
      buyerCommission: account.buyerCommission || 0,
      sellerCommission: account.sellerCommission || 0,
      permissions: account.permissions || []
    };

    // Update sidebar config service with extracted data
    this.sidebarConfigService.updateSidebarData(sidebarData);

    this.tools.consoleGroup({
      title: `🔍 Sidebar Data Extracted`,
      tag: 'check',
      palette: 'su',
      collapsed: false,
      data: { sidebarData, accountType: account.accountType }
    });
    // ====================================

    // Return table data (balances)
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

  /**
   * Load trades data
   *
   * @date 08/10/2025
   * @private
   * @param params
   * @return {*}
   */
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

  /**
   * Load orders data
   *
   * @date 08/10/2025
   * @private
   * @param params
   * @return {*}
   */
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

  /**
   * Load ticker data
   *
   * @date 08/10/2025
   * @private
   * @param params
   * @return {*}
   */
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
   * Typewriter log effect
   * Add log entry with typewriter effect
   * @date 08/10/2025
   * @param message
   * @param [level='info']
   * @return {*}
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

  // ======================================================
  // PRIVATE / TERMINAL LOGIC
  // ======================================================

  private addLog(message: string, level: IBashLogEntry['level']): void {
    untracked(() => {
      const logEntry: IBashLogEntry = {
        timestamp: new Date(),
        message,
        level
      };

      this.logs.update(logs => {
        const newLogs = [...logs, logEntry];
        return newLogs.slice(-50); // Keep only last 50 logs
      });
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

  // =========================================
  // CONVENIENT ACCESSORS FOR TEMPLATE
  // =========================================

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
