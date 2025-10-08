// atk-bash.component.v02.ts

import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, effect, inject, input, NgZone, OnInit, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { BashData, IBashConfig, IBashLogEntry, IBashTerminalState } from '@shared/components/atk-bash/atk-bash.interfaces';

import { BinanceErrorHandlerService } from '@features/binance/services/binance-error-handler.service';
import { TransactionStateService } from '@features/binance/services/binance-transaction-state.service';
import { BinanceService } from '@features/binance/services/binance.service';
import { AtkBashConfigFactory } from '@shared/components/atk-bash/atk-bash-config.factory';
import { AtkBashService } from '@shared/components/atk-bash/atk-bash.service';
import { SidebarBashConfigService } from '@shared/components/sidebar-bash-config/sidebar-bash-config.service';
import { ToolsService } from '@shared/services/tools.service';

import { AtkIconComponent } from '@shared/components/atk-icon/atk-icon.component';
import { TerminalInputDirective, TerminalInputState } from '@shared/directives/terminal-input.directive';
// import { BalanceFormatPipe, CryptoPrecisionPipe, StatusBadgePipe, TimestampToDatePipe } from '@shared/pipes/pipes';

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

  currentConfig = signal<IBashConfig | null>(null);
  terminalState = signal<IBashTerminalState>({
    loading: false,
    connectionStatus: 'disconnected',
    requestParams: {}
  });
  data = signal<BashData[]>([]);
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

  // ======================================================
  // CONSTRUCTOR
  // ======================================================

  constructor() {
    effect(() => {
      const events = this.bashService.events();
      const latest = events.at(-1);
      if (!latest) return;

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
    });

    effect(() => this.updateTerminalContent());

    this.startCursorBlink();
  }

  // ======================================================
  // LIFECYCLE
  // ======================================================

  ngOnInit(): void {
    this.addLog('ATK Bash Terminal initialized', 'info');
    this.tools.consoleGroup({ // TAG AtkBashComponent -> ngOnInit() ================ CONSOLE LOG IN PROGRESS
      title: `AtkBashComponent -> ngOnInit() -> configId()`, tag: 'check', palette: 'in', collapsed: false,
      data: this.currentConfig()
    });
  }


  // ======================================================
  // PUBLIC METHODS
  // ======================================================

  public async loadData(): Promise<void> {
    const sidebar = this.sidebarConfigService.state();
    const endpointId = sidebar.currentEndpoint;
    const configId = this.currentConfig()?.id;

    if (!configId || !endpointId) {
      this.addLog('⚠️ No endpoint selected', 'warning');
      return;
    }

    this.addLog(`🔄 Loading data from ${endpointId}...`, 'info');
    const start = performance.now();

    const result = await this.bashService.loadData(configId, endpointId, sidebar.parameters || {});
    const time = Math.round(performance.now() - start);

    this.terminalState.update(s => ({
      ...s,
      responseMetadata: { statusCode: 200, responseTime: time, dataCount: result.length }
    }));
  }

  public clearCache(): void {
    this.bashService.clearCache();
    this.addLog('🗑️ Cache cleared', 'info');
  }

  public exportData(): void {
    const data = this.data();
    if (data.length === 0) {
      this.addLog('❌ No data to export', 'warning');
      return;
    }
    const csv = this.convertToCSV(data);
    this.downloadCSV(csv, 'bash-data-export.csv');
    this.addLog(`📤 Exported ${data.length} records`, 'success');
  }

  public async testConnection(): Promise<void> {
    const sidebar = this.sidebarConfigService.state();
    const endpointId = sidebar.currentEndpoint;
    const configId = this.currentConfig()?.id;
    if (!configId || !endpointId) return;

    this.addLog(`🌐 Testing ${endpointId}...`, 'info');
    const result = await this.bashService.testEndpoint(configId, endpointId);
    if (result.success) {
      this.addLog(`✅ Success (${result.responseTime}ms)`, 'success');
    } else {
      this.addLog(`❌ Failed (${result.error})`, 'error');
    }
  }

  // ======================================================
  // PRIVATE / TERMINAL LOGIC
  // ======================================================

  private updateTerminalContent(): void {
    const directive = this.terminalDirective();
    if (!directive) return;
    const newContent = this.terminalText();
    directive.clearContent();
    directive.insertAtCaret(newContent);
  }

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

  public onTerminalStateChange(state: TerminalInputState): void {
    this.terminalInputState.set(state);
  }

  public formatCellValue(value: any, column: any): string {
    if (value === null || value === undefined) return '';
    if (column.formatter) return column.formatter(value);
    switch (column.type) {
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : value.toString();
      case 'currency':
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
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

  public visibleColumns = computed(() => {
    const cfg = this.currentConfig();
    const sidebar = this.sidebarConfigService.state();
    const ep = cfg?.endpoints.find(e => e.id === sidebar.currentEndpoint);
    return ep?.columns.filter(c => c.visible !== false) || [];
  });

  public getCurrentEndpointName(endpointId: string): string {
    const cfg = this.currentConfig();
    const ep = cfg?.endpoints.find(e => e.id === endpointId);
    return ep?.name || '';
  }

  public trackByIndex(index: number, item: any): any {
    return item.id || item.symbol || index;
  }

}
