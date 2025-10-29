/**
 * ATK API Bash Component - ADVANCED VERSION
 * Full-featured bash terminal for API debugging
 *
 * Features:
 * - Editable terminal with TerminalInputDirective
 * - Complete terminal state (caret, selection, line/column tracking)
 * - Log system with typewriter effect
 * - Advanced terminal text generation
 * - Full datatable integration
 * - Event listening from state service
 *
 * @file atk-api-bash-advanced.component.ts
 * @version 2.0.0 (Advanced/Full)
 * @architecture Smart component with local state + state service integration
 */

import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, OnInit, signal, untracked, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AtkApiDatatableComponent } from '@shared/components/atk-api/atk-api-datatable/atk-api-datatable.component';
import { AtkIconComponent } from '@shared/components/atk-icon/atk-icon.component';
import { TerminalInputDirective, TerminalInputState } from '@shared/directives/terminal-input.directive';

import { ToolsService } from '@core/services/tools.service';
import { AtkApiStateService } from '@shared/components/atk-api/atk-api-state.service';

import type { AtkApiLogLevel, IAtkApiLogEntry } from '@shared/components/atk-api/atk-api.interfaces';

@Component({
  selector: 'atk-api-bash',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AtkIconComponent,
    AtkApiDatatableComponent,
    TerminalInputDirective
  ],
  templateUrl: './atk-api-bash.component.html',
  styleUrls: ['./atk-api-bash.component.css']
})
export class AtkApiBashComponent implements OnInit {

  // ====================================================
  // VIEW CHILDREN
  // ====================================================

  @ViewChild(TerminalInputDirective)
  private terminalDirective?: TerminalInputDirective;

  // ====================================================
  // DEPENDENCIES
  // ====================================================

  private readonly stateService = inject(AtkApiStateService);
  private readonly tools = inject(ToolsService);

  // ====================================================
  // PUBLIC READONLY SIGNALS (from state service)
  // ====================================================

  readonly state = this.stateService.state;
  readonly config = this.stateService.config;
  readonly currentEndpointConfig = this.stateService.currentEndpointConfig;
  readonly visibleColumns = this.stateService.visibleColumns;

  // ====================================================
  // LOCAL STATE SIGNALS
  // ====================================================

  /** Log entries for terminal display */
  logs = signal<IAtkApiLogEntry[]>([]);

  /** Cursor visibility for typewriter effect */
  cursorVisible = signal<boolean>(true);

  /** Typing active indicator */
  typingActive = signal<boolean>(false);

  /** Terminal input state from directive */
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

  /**
   * Terminal display text with all information
   * Includes: config, status, parameters, logs, cursor
   */
  terminalText = computed(() => {
    const cfg = this.config();
    const state = this.state();
    const endpoint = this.currentEndpointConfig();

    let output = '';

    // ====================================================
    // HEADER SECTION
    // ====================================================

    if (cfg) {
      output += `${cfg.title.padEnd(59)}\n`;
      // output += `${cfg.subtitle.padEnd(59)}\n`;
      output += `Domain: ${cfg.domain.toUpperCase().padEnd(52)}\n`;
      output += `Config ID: ${cfg.id.padEnd(49)}\n`;
      output += `\n`;
    }

    // ====================================================
    // CONNECTION STATUS
    // ====================================================

    const statusIcon = this.getStatusIcon(state.connectionStatus);
    output += `Connection Status:${state.connectionStatus}\n`;
    // output += `  ${statusIcon} ${state.connectionStatus.toUpperCase()}\n\n`;

    // ====================================================
    // CURRENT ENDPOINT
    // ====================================================

    if (endpoint) {
      output += `Current Endpoint: ${endpoint.name}\n`;
      // output += `  Name: ${endpoint.name}\n`;
      // output += `  ID: ${endpoint.id}\n`;
      // output += `  Method: ${endpoint.method}\n`;
      // output += `  URL: ${endpoint.url}\n`;
      // output += `  Cacheable: ${endpoint.cacheable ? 'Yes' : 'No'}\n\n`;
    }

    // ====================================================
    // PARAMETERS
    // ====================================================

    if (Object.keys(state.parameters).length > 0) {
      output += `Request Parameters:\n`;
      Object.entries(state.parameters).forEach(([key, value]) => {
        output += `  ${key}: ${value}\n`;
      });
      output += `\n`;
    }

    // ====================================================
    // LAST RESPONSE METADATA
    // ====================================================

    if (state.responseMetadata) {
      const meta = state.responseMetadata;
      output += `Source: ${meta.fromCache ? 'Cache ⚡' : 'API 🌐'}\n`;

      // output += `Last Response:\n`;
      // output += `  Status Code: ${meta.statusCode}\n`;
      // output += `  Response Time: ${meta.responseTime}ms\n`;
      // output += `  Data Count: ${meta.dataCount} items\n`;
      // output += `  Source: ${meta.fromCache ? 'Cache ⚡' : 'API 🌐'}\n`;
      if (meta.timestamp) {
        output += `Timestamp: ${meta.timestamp.toLocaleTimeString()}\n`;
      }
      output += `\n`;
    }

    // ====================================================
    // LOGS SECTION
    // ====================================================

    output += `-----------------------------------------\n`;
    output += `Terminal Log:\n`;
    output += `-----------------------------------------\n`;

    const logEntries = this.logs();
    if (logEntries.length === 0) {
      output += `(no logs yet)\n`;
    } else {
      // Show last 10 logs
      const recentLogs = logEntries.slice(-10);
      recentLogs.forEach(log => {
        const timestamp = log.timestamp.toLocaleTimeString();
        const icon = this.getLogIcon(log.level);
        output += `[${timestamp}] ${icon} ${log.message}\n`;
      });
    }

    // ====================================================
    // CURSOR (Typewriter Effect)
    // ====================================================

    const cursor = this.cursorVisible() && this.typingActive() ? ' ▮' : '';
    output += cursor;

    return output;
  });

  /**
   * Terminal height from config
   */
  terminalHeight = computed(() => {
    const cfg = this.config();
    return cfg?.ui.terminalHeight || '100px';
  });

  /**
   * Last log entry for quick display
   */
  lastLog = computed(() => {
    const logList = this.logs();
    return logList.length > 0 ? logList[logList.length - 1] : null;
  });

  /**
   * Endpoint name for section header
   */
  endpointName = computed(() => {
    const endpoint = this.currentEndpointConfig();
    return endpoint?.name || 'Data Results';
  });

  /**
   * Endpoint name for section header
   */
  endpointId = computed(() => {
    const endpoint = this.currentEndpointConfig();
    return endpoint?.id || 'Data Results';
  });

  /**
   * Terminal input state shortcuts
   */
  line = computed(() => this.terminalInputState().line);
  column = computed(() => this.terminalInputState().column);
  caretIndex = computed(() => this.terminalInputState().caretIndex);
  selectionText = computed(() => this.terminalInputState().selectionText);

  // ====================================================
  // CONSTRUCTOR
  // ====================================================

  constructor() {

    // ====================================================
    // EFFECT 1: Listen to state service events for logs
    // ====================================================

    effect(() => {
      const events = this.stateService.events();
      const latestEvent = events.at(-1);
      if (!latestEvent) return;
      this.tools.consoleGroup({ // TAG AtkApiBashComponent -> effect(1) ================ CONSOLE LOG IN PROGRESS
        title: 'AtkApiBashComponent -> effect(1)', tag: 'rook', palette: 'aapi', collapsed: false, arrayAsTable: false,
        data: { latestEvent: latestEvent }
      });
      untracked(() => {
        // Check if event is a log event
        if (latestEvent.type === 'log-added' as any) {
          const logEntry = (latestEvent.payload as any).log as IAtkApiLogEntry;
          this.addLogEntry(logEntry);
          return;
        }

        // Auto-log for important events
        switch (latestEvent.type) {
          case 'data-loaded':
            this.addLog(`Data loaded: ${latestEvent.payload.dataCount} items in ${latestEvent.payload.responseTime}ms`, 'success');
            break;

          case 'data-error':
            this.addLog(`❌ Error: ${latestEvent.payload.error}`, 'error');
            break;

          case 'endpoint-changed':
            this.addLog(`📍 Endpoint changed: ${latestEvent.payload.oldEndpoint} → ${latestEvent.payload.newEndpoint}`, 'info');
            break;

          case 'parameters-updated':
            const paramKeys = latestEvent.payload.changedKeys.join(', ');
            this.addLog(`⚙️ Parameters updated: ${paramKeys}`, 'info');
            break;

          case 'cache-cleared':
            this.addLog(`🗑️ Cache cleared: ${latestEvent.payload.clearedCount} entries`, 'info');
            break;

          case 'connection-tested':
            if (latestEvent.payload.success) {
              this.addLog(`Connection test successful: ${latestEvent.payload.responseTime}ms`, 'success');
            } else {
              this.addLog(`❌ Connection test failed: ${latestEvent.payload.error}`, 'error');
            }
            break;
        }
      });
    });

    // ====================================================
    // EFFECT 2: Cursor blink animation
    // ====================================================

    setInterval(() => {
      this.cursorVisible.update(v => !v);
    }, 500);

    // ====================================================
    // EFFECT 3: Auto-scroll when logs change
    // ====================================================

    effect(() => {
      // Track logs count changes
      const logCount = this.logs().length;

      // Execute scroll outside tracking context to avoid loops
      untracked(() => {
        if (logCount > 0 && this.terminalDirective) {
          // Small delay to ensure DOM is fully updated by Angular
          setTimeout(() => {
            this.terminalDirective?.scrollToBottom();
          }, 150);
        }
      });
    });

  }

  // ====================================================
  // LIFECYCLE
  // ====================================================

  ngOnInit(): void {
    this.addLog('Terminal initialized', 'info');
    // this.addLog('Waiting for commands...', 'info');

    // this.tools.consoleGroup({ // OFF AtkApiBashComponent -> loadData() ================ CONSOLE LOG IN PROGRESS
    //   title: 'AtkApiBashComponent -> ngOnInit()', tag: 'check', palette: 'in', collapsed: true,
    //   data: { config: this.config() }
    // });
  }

  // ====================================================
  // PUBLIC METHODS - LOG MANAGEMENT
  // ====================================================

  /**
   * Add log entry to terminal
   */
  addLog(message: string, level: AtkApiLogLevel = 'info', metadata?: any): void {
    const log: IAtkApiLogEntry = {
      timestamp: new Date(),
      message,
      level,
      metadata,
      source: 'AtkApiBashAdvancedComponent'
    };

    this.addLogEntry(log);
  }

  /**
   * Add log entry object directly
   */
  private addLogEntry(log: IAtkApiLogEntry): void {
    this.logs.update(list => {
      const updated = [...list, log];
      // Keep only last 100 logs
      // return updated.length > 100 ? updated.slice(-100) : updated;
      return updated;
    });
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs.set([]);
    this.addLog('Logs cleared', 'info');
  }

  // ====================================================
  // PUBLIC METHODS - TERMINAL INPUT
  // ====================================================

  /**
   * Handle terminal input state changes from directive
   */
  onTerminalStateChange(state: TerminalInputState): void {
    this.terminalInputState.set(state);
    // this.typingActive.set(state.textValue.length > 0);
  }

  // ====================================================
  // PUBLIC METHODS - UI ACTIONS
  // ====================================================

  /**
   * Handle row selection from datatable
   */
  onRowSelected(rowData: any): void {
    this.stateService.selectRow(rowData);
    this.addLog(`Row selected: ${rowData.id || rowData.symbol || 'unknown'}`, 'info');
  }

  // ====================================================
  // PRIVATE METHODS - FORMATTING
  // ====================================================

  /**
   * Get status icon based on connection status
   */
  private getStatusIcon(status: string): string {
    switch (status) {
      case 'connected':
        return '●';
      case 'connecting':
        return '◐';
      case 'disconnected':
        return '○';
      default:
        return '?';
    }
  }

  /**
   * Get log icon based on log level
   */
  private getLogIcon(level: AtkApiLogLevel): string {
    switch (level) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'debug':
        return '🔍';
      case 'info':
      default:
        return 'ℹ️';
    }
  }
}
