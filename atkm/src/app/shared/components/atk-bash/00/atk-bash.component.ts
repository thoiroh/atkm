// src/app/shared/components/atk-bash/atk-bash.component.ts
// Simplified AtkBashComponent without cursor tracking

import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, effect, inject, input, NgZone, OnInit, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AtkIconComponent } from '@shared/components/atk-icon/atk-icon.component';
import { firstValueFrom } from 'rxjs';

import { BinanceErrorHandlerService } from '@app/features/binance/services/binance-error-handler.service';
import { TransactionStateService } from '@app/features/binance/services/binance-transaction-state.service';
import { BinanceService } from '@features/binance/services/binance.service';

import {
  TerminalInputDirective,
  TerminalScrollState
} from '@shared/directives/terminal-input.directive';
import { AtkBashConfigFactory } from './atk-bash-config.factory';
import { BashData, IBashConfig, IBashEvent, IBashLogEntry, IBashTerminalState } from './atk-bash.interfaces';
import { AtkBashService } from './atk-bash.service';

@Component({
  selector: 'atk-bash',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AtkIconComponent,
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
  eventEmitted = output<IBashEvent>();
  terminalContentChange = output<string>();
  configRequest = output<{ config: IBashConfig | null; terminalState: IBashTerminalState; currentEndpoint: string }>();

  // Services
  private bashService = inject(AtkBashService);
  private bashConfigFactory = inject(AtkBashConfigFactory);
  private binanceService = inject(BinanceService);
  private errorHandler = inject(BinanceErrorHandlerService);
  private transactionState = inject(TransactionStateService);
  private destroyRef = inject(DestroyRef);
  private zone = inject(NgZone);

  // Core state signals
  currentConfig = signal<IBashConfig | null>(null);
  currentEndpoint = signal<string>('');
  terminalState = signal<IBashTerminalState>({
    loading: false,
    connectionStatus: 'disconnected',
    requestParams: {}
  });
  data = signal<BashData[]>([]);
  error = signal<string | null>(null);

  // Terminal functionality signals (simplified)
  logs = signal<IBashLogEntry[]>([]);
  terminalScrollState = signal<TerminalScrollState | null>(null);

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

    return output;
  });

  // Status computed properties
  isLoading = computed(() => this.terminalState().loading);
  hasError = computed(() => !!this.error());
  isConnected = computed(() => this.terminalState().connectionStatus === 'connected');

  constructor() {
    // Auto-scroll effect when terminal content changes
    effect(() => {
      const terminalText = this.terminalText();
      const directive = this.terminalDirective();

      if (directive && terminalText) {
        // Update terminal content and auto-scroll
        directive.setContent(terminalText);
      }
    });

    // Emit config for sidebar when config or state changes
    effect(() => {
      const config = this.currentConfig();
      const state = this.terminalState();
      const endpoint = this.currentEndpoint();

      if (config) {
        this.configRequest.emit({
          config,
          terminalState: state,
          currentEndpoint: endpoint
        });
      }
    });
  }

  ngOnInit(): void {
    this.loadConfiguration();

    if (this.autoLoad()) {
      this.initializeEndpoint();
    }
  }

  /**
   * Handle terminal content changes from user input
   */
  onTerminalContentChange(content: string): void {
    this.terminalContentChange.emit(content);

    // Parse potential commands from user input
    this.parseTerminalCommands(content);
  }

  /**
   * Handle terminal scroll state changes
   */
  onTerminalScrollChange(scrollState: TerminalScrollState): void {
    this.terminalScrollState.set(scrollState);
  }

  /**
   * Handle endpoint selection change
   */
  onEndpointChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const endpointId = target.value;

    if (endpointId) {
      this.currentEndpoint.set(endpointId);
      this.loadEndpointData(endpointId);
      this.addLog(`Endpoint changed to: ${endpointId}`, 'info');
    }
  }

  /**
   * Execute API call for current endpoint
   */
  async executeEndpoint(): Promise<void> {
    const config = this.currentConfig();
    const endpointId = this.currentEndpoint();

    if (!config || !endpointId) {
      this.addLog('No configuration or endpoint selected', 'error');
      return;
    }

    const endpoint = config.endpoints.find(ep => ep.id === endpointId);
    if (!endpoint) {
      this.addLog(`Endpoint not found: ${endpointId}`, 'error');
      return;
    }

    this.setLoading(true);
    this.addLog(`Executing ${endpoint.name}...`, 'info');

    try {
      const data = await this.loadDataFromEndpoint(endpoint);
      this.data.set(data);
      this.dataLoaded.emit(data);
      this.addLog(`✅ Success: ${data.length} records loaded`, 'success');

      // Update terminal state
      this.terminalState.update(state => ({
        ...state,
        connectionStatus: 'connected',
        responseMetadata: {
          statusCode: 200,
          responseTime: Date.now() % 1000, // Mock response time
          dataCount: data.length
        }
      }));

    } catch (error) {
      this.handleError(error);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Clear terminal content and logs
   */
  clearTerminal(): void {
    this.logs.set([]);
    this.data.set([]);
    this.error.set(null);

    const directive = this.terminalDirective();
    if (directive) {
      directive.clearContent();
    }

    this.addLog('Terminal cleared', 'info');
  }

  /**
   * Export terminal content
   */
  exportTerminalContent(): void {
    const content = this.terminalText();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `terminal-export-${new Date().toISOString().slice(0, 16)}.txt`;
    a.click();

    URL.revokeObjectURL(url);
    this.addLog('Terminal content exported', 'info');
  }

  /**
   * Handle configuration changes from sidebar
   */
  onConfigChange(event: any): void {
    switch (event.type) {
      case 'endpoint-change':
        this.currentEndpoint.set(event.payload.endpointId);
        this.loadEndpointData(event.payload.endpointId);
        break;

      case 'parameter-change':
        this.updateRequestParameter(event.payload.parameter, event.payload.value);
        break;

      case 'action-execute':
        this.handleSidebarAction(event.payload.actionId);
        break;

      case 'config-update':
        this.handleConfigUpdate(event.payload);
        break;
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'connected': return '🟢';
      case 'connecting': return '🟡';
      case 'disconnected': return '🔴';
      default: return '⚫';
    }
  }

  getLogIcon(level: string): string {
    switch (level) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'info':
      default: return 'ℹ️';
    }
  }

  /**
   * Handle sidebar actions
   */
  private handleSidebarAction(actionId: string): void {
    switch (actionId) {
      case 'clear-terminal':
        this.clearTerminal();
        break;
      case 'export-logs':
        this.exportTerminalContent();
        break;
      case 'export-data':
        this.exportData();
        break;
      case 'test-connection':
        this.testConnection();
        break;
      case 'reload-config':
        this.reloadConfiguration();
        break;
      case 'clear-error':
        this.error.set(null);
        break;
    }
  }

  /**
   * Update request parameter
   */
  private updateRequestParameter(paramKey: string, value: any): void {
    this.terminalState.update(state => ({
      ...state,
      requestParams: {
        ...state.requestParams,
        [paramKey]: value
      }
    }));

    this.addLog(`Parameter updated: ${paramKey} = ${value}`, 'info');
  }

  /**
   * Handle configuration updates from sidebar
   */
  private handleConfigUpdate(payload: any): void {
    if (payload.reset) {
      this.loadConfiguration();
      this.addLog('Configuration reset to defaults', 'info');
      return;
    }

    // Handle specific config changes
    if (payload.section === 'terminal') {
      this.handleTerminalConfigUpdate(payload.item, payload.value);
    }
  }

  /**
   * Handle terminal configuration updates
   */
  private handleTerminalConfigUpdate(itemId: string, value: any): void {
    const directive = this.terminalDirective();
    if (!directive) return;

    switch (itemId) {
      case 'terminal-height':
        this.currentConfig.update(config => {
          if (config) {
            config.terminal.height = `${value}px`;
          }
          return config;
        });
        this.addLog(`Terminal height updated: ${value}px`, 'info');
        break;

      case 'auto-scroll':
        // This would require updating the directive's autoScroll input
        this.addLog(`Auto-scroll ${value ? 'enabled' : 'disabled'}`, 'info');
        break;
    }
  }

  /**
   * Export current data
   */
  private exportData(): void {
    const data = this.data();
    if (data.length === 0) {
      this.addLog('No data to export', 'warning');
      return;
    }

    const csv = this.convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `data-export-${Date.now()}.csv`;
    a.click();

    URL.revokeObjectURL(url);
    this.addLog(`Data exported: ${data.length} records`, 'success');
  }

  /**
   * Test connection to current endpoint
   */
  private async testConnection(): Promise<void> {
    const endpoint = this.currentEndpoint();
    if (!endpoint) {
      this.addLog('No endpoint selected for testing', 'warning');
      return;
    }

    this.addLog(`Testing connection to ${endpoint}...`, 'info');

    try {
      // Simple ping test
      await this.executeEndpoint();
      this.addLog(`✅ Connection test successful`, 'success');
    } catch (error) {
      this.addLog(`❌ Connection test failed: ${error}`, 'error');
    }
  }

  /**
   * Reload configuration
   */
  private async reloadConfiguration(): Promise<void> {
    this.addLog('Reloading configuration...', 'info');
    await this.loadConfiguration();
    this.addLog('Configuration reloaded successfully', 'success');
  }

  /**
   * Convert data to CSV format
   */
  private convertToCSV(data: BashData[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' ? `"${value}"` : value;
        }).join(',')
      )
    ].join('\n');

    return csvContent;
  }

  private async loadConfiguration(): Promise<void> {
    try {
      const configId = this.configId();
      let config: IBashConfig;

      // Use the correct factory methods based on configId
      switch (configId) {
        case 'binance-debug-v1':
          config = this.bashConfigFactory.createBinanceAccountConfig();
          break;
        case 'binance-debug-v2':
        default:
          config = this.bashConfigFactory.createBinanceDebugConfig();
          break;
        case 'ibkr-debug-v1':
          config = this.bashConfigFactory.createIbkrConfig();
          break;
      }

      this.currentConfig.set(config);
      this.addLog(`Configuration loaded: ${config.title}`, 'info');
    } catch (error) {
      this.addLog(`Failed to load configuration: ${error}`, 'error');
    }
  }

  private initializeEndpoint(): void {
    const config = this.currentConfig();
    if (config && config.endpoints.length > 0) {
      const defaultEndpoint = config.defaultEndpoint || config.endpoints[0].id;
      this.currentEndpoint.set(defaultEndpoint);
      this.addLog(`Default endpoint set: ${defaultEndpoint}`, 'info');
    }
  }

  private async loadEndpointData(endpointId: string): Promise<void> {
    const config = this.currentConfig();
    if (!config) return;

    const endpoint = config.endpoints.find(ep => ep.id === endpointId);
    if (!endpoint) return;

    this.setLoading(true);
    try {
      const data = await this.loadDataFromEndpoint(endpoint);
      this.data.set(data);
      this.addLog(`Data loaded for ${endpoint.name}: ${data.length} records`, 'info');
    } catch (error) {
      this.handleError(error);
    } finally {
      this.setLoading(false);
    }
  }

  private async loadDataFromEndpoint(endpoint: any): Promise<BashData[]> {
    // Implementation depends on endpoint type
    if (endpoint.id.includes('binance')) {
      return this.loadBinanceData(endpoint);
    }

    // Default fallback
    return [];
  }

  private async loadBinanceData(endpoint: any): Promise<BashData[]> {
    try {
      switch (endpoint.id) {
        case 'account':
          const accountInfo = await firstValueFrom(this.binanceService.getAccount());
          return [{ id: 'account', ...accountInfo }];

        case 'trades':
          const trades = await firstValueFrom(this.binanceService.getMyTrades('BTCUSDT', undefined, undefined, 100));
          return Array.isArray(trades) ? trades.map((trade: any, index: number) => ({
            id: trade.id || index,
            ...trade
          })) : [];

        case 'ticker':
          const ticker = await firstValueFrom(this.binanceService.getTickerPrice('BTCUSDT'));
          return [{ id: 'ticker', ...ticker }];

        default:
          return [];
      }
    } catch (error) {
      throw error;
    }
  }

  private parseTerminalCommands(content: string): void {
    const lines = content.split('\n');
    const lastLine = lines[lines.length - 1]?.trim();

    if (lastLine?.startsWith('/')) {
      const command = lastLine.slice(1).toLowerCase();
      this.executeTerminalCommand(command);
    }
  }

  private executeTerminalCommand(command: string): void {
    const [cmd, ...args] = command.split(' ');

    switch (cmd) {
      case 'clear':
        this.clearTerminal();
        break;
      case 'export':
        this.exportTerminalContent();
        break;
      case 'connect':
        if (args[0]) {
          this.currentEndpoint.set(args[0]);
          this.loadEndpointData(args[0]);
        }
        break;
      case 'help':
        this.showHelp();
        break;
      default:
        this.addLog(`Unknown command: /${cmd}`, 'warning');
    }
  }

  private showHelp(): void {
    const helpText = [
      'Available commands:',
      '/clear - Clear terminal',
      '/export - Export terminal content',
      '/connect <endpoint> - Connect to endpoint',
      '/help - Show this help'
    ];

    helpText.forEach(line => this.addLog(line, 'info'));
  }

  private addLog(message: string, level: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    const logEntry: IBashLogEntry = {
      timestamp: new Date(),
      level,
      message,
      metadata: {
        source: 'bash-component'
      }
    };

    this.logs.update(logs => [...logs, logEntry]);

    // Emit event
    this.eventEmitted.emit({
      type: 'log-added',
      payload: logEntry,
      timestamp: new Date()
    });
  }

  private setLoading(loading: boolean): void {
    this.terminalState.update(state => ({ ...state, loading }));
  }

  private handleError(error: any): void {
    const errorMessage = error?.message || 'Unknown error occurred';
    this.error.set(errorMessage);
    this.addLog(`❌ Error: ${errorMessage}`, 'error');
    this.errorOccurred.emit(errorMessage);

    this.terminalState.update(state => ({
      ...state,
      connectionStatus: 'disconnected',
      error: errorMessage
    }));
  }

}
