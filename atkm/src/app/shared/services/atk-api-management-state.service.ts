// src/app/shared/services/api-management-state.service.ts
// Service for state management between sidebar-bash-config and api-management components

import { computed, inject, Injectable, signal } from '@angular/core';
import { BinanceAccount } from '@features/binance/models/binance.model';
import {
  BashData,
  IBashConfig,
  IBashTerminalState
} from '@shared/components/atk-bash/atk-bash.interfaces';
import { Subject } from 'rxjs';
import { ToolsService } from '../components/atk-tools/tools.service';

/**
 * Events for communication between components
 */
export interface ApiManagementEvent {
  type: 'endpoint-change' | 'parameter-change' | 'action-execute' | 'config-update' | 'data-loaded' | 'error-occurred';
  payload: any;
  timestamp: Date;
  source: 'sidebar' | 'terminal' | 'datatable';
}

/**
 * Complete state interface for API management
 */
export interface ApiManagementState {
  // Configuration
  currentConfig: IBashConfig | null;
  currentEndpoint: string;

  // Terminal state
  terminalState: IBashTerminalState;

  // Data state
  currentData: BashData[];
  dataLoading: boolean;
  dataError: string | null;

  // UI state
  sidebarCollapsed: boolean;

  // Account data (for Binance specifically)
  accountData: BinanceAccount | null;
}

@Injectable({
  providedIn: 'root'
})
export class ApiManagementStateService {

  // Core state signals
  private _currentConfig = signal<IBashConfig | null>(null);
  private _currentEndpoint = signal<string>('');
  private _terminalState = signal<IBashTerminalState>({
    loading: false,
    connectionStatus: 'disconnected',
    requestParams: {}
  });

  // Data signals
  private _currentData = signal<BashData[]>([]);
  private _dataLoading = signal<boolean>(false);
  private _dataError = signal<string | null>(null);

  // UI signals
  private _sidebarCollapsed = signal<boolean>(false);

  // Account data
  private _accountData = signal<BinanceAccount | null>(null);

  // Event streams
  private _eventsSubject = new Subject<ApiManagementEvent>();
  private _commandsSubject = new Subject<ApiManagementEvent>();

  // Public readonly signals
  readonly currentConfig = this._currentConfig.asReadonly();
  readonly currentEndpoint = this._currentEndpoint.asReadonly();
  readonly terminalState = this._terminalState.asReadonly();
  readonly currentData = this._currentData.asReadonly();
  readonly dataLoading = this._dataLoading.asReadonly();
  readonly dataError = this._dataError.asReadonly();
  readonly sidebarCollapsed = this._sidebarCollapsed.asReadonly();
  readonly accountData = this._accountData.asReadonly();

  // Computed properties
  readonly currentEndpointConfig = computed(() => {
    const config = this._currentConfig();
    const endpointId = this._currentEndpoint();
    if (!config || !endpointId) return null;
    return config.endpoints.find(ep => ep.id === endpointId) || null;
  });

  readonly isConnected = computed(() =>
    this._terminalState().connectionStatus === 'connected'
  );

  readonly hasError = computed(() =>
    !!this._dataError() || !!this._terminalState().error
  );

  readonly isLoading = computed(() =>
    this._dataLoading() || this._terminalState().loading
  );

  // Event observables
  readonly events$ = this._eventsSubject.asObservable();
  readonly commands$ = this._commandsSubject.asObservable();
  private tools = inject(ToolsService);

  constructor() {
    // TAG: binance-account-info.component.27 ================ CONSOLE LOG IN PROGRESS
    this.tools.consoleGroup({
      title: `ApiManagementStateService initialized ..`,
      tag: 'recycle',
      data: null,
      palette: 'su',
      collapsed: true,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSizePx: 13
    });
  }

  /**
   * Configuration management
   */
  setConfiguration(config: IBashConfig): void {
    this._currentConfig.set(config);

    // Set default endpoint if not set
    if (!this._currentEndpoint() && config.endpoints.length > 0) {
      const defaultEndpoint = config.defaultEndpoint || config.endpoints[0].id;
      this._currentEndpoint.set(defaultEndpoint);
    }

    this.emitEvent('config-update', { config }, 'terminal');
  }

  /**
   * Endpoint management
   */
  setCurrentEndpoint(endpointId: string): void {
    if (endpointId === this._currentEndpoint()) return;

    this._currentEndpoint.set(endpointId);
    this.clearData(); // Clear previous endpoint data
    this.emitEvent('endpoint-change', { endpointId }, 'sidebar');
  }

  /**
   * Terminal state management
   */
  updateTerminalState(updates: Partial<IBashTerminalState>): void {
    this._terminalState.update(current => ({
      ...current,
      ...updates
    }));
  }

  setLoading(loading: boolean): void {
    this._dataLoading.set(loading);
    this.updateTerminalState({ loading });
  }

  setConnectionStatus(status: IBashTerminalState['connectionStatus']): void {
    this.updateTerminalState({ connectionStatus: status });
  }

  /**
   * Data management
   */
  setCurrentData(data: BashData[]): void {
    this._currentData.set(data);
    this._dataError.set(null);
    this._dataLoading.set(false);

    // Update terminal state with success info
    this.updateTerminalState({
      loading: false,
      connectionStatus: 'connected',
      responseMetadata: {
        statusCode: 200,
        responseTime: Date.now() % 1000, // Mock response time
        dataCount: data.length
      }
    });

    this.emitEvent('data-loaded', { data, count: data.length }, 'terminal');
  }

  setDataError(error: string): void {
    this._dataError.set(error);
    this._dataLoading.set(false);

    // Update terminal state with error info
    this.updateTerminalState({
      loading: false,
      connectionStatus: 'disconnected',
      error
    });

    this.emitEvent('error-occurred', { error }, 'terminal');
  }

  clearData(): void {
    this._currentData.set([]);
    this._dataError.set(null);
  }

  /**
   * Parameter management
   */
  updateRequestParameter(key: string, value: any): void {
    this._terminalState.update(state => ({
      ...state,
      requestParams: {
        ...state.requestParams,
        [key]: value
      }
    }));

    this.emitEvent('parameter-change', { key, value }, 'sidebar');
  }

  updateRequestParameters(params: Record<string, any>): void {
    this._terminalState.update(state => ({
      ...state,
      requestParams: {
        ...state.requestParams,
        ...params
      }
    }));

    this.emitEvent('parameter-change', { parameters: params }, 'sidebar');
  }

  /**
   * UI state management
   */
  toggleSidebar(): void {
    this._sidebarCollapsed.update(collapsed => !collapsed);
  }

  setSidebarCollapsed(collapsed: boolean): void {
    this._sidebarCollapsed.set(collapsed);
  }

  /**
   * Account data management (Binance specific)
   */
  setAccountData(accountData: BinanceAccount): void {
    this._accountData.set(accountData);
    this.emitEvent('data-loaded', { accountData }, 'terminal');
  }

  /**
   * Action execution
   */
  executeAction(actionId: string, payload?: any): void {
    this.emitEvent('action-execute', { actionId, payload }, 'sidebar');
  }

  /**
   * Command execution (for terminal actions)
   */
  executeCommand(command: string, args?: string[]): void {
    this._commandsSubject.next({
      type: 'action-execute',
      payload: { command, args },
      timestamp: new Date(),
      source: 'terminal'
    });
  }

  /**
   * State utilities
   */
  getCompleteState(): ApiManagementState {
    return {
      currentConfig: this._currentConfig(),
      currentEndpoint: this._currentEndpoint(),
      terminalState: this._terminalState(),
      currentData: this._currentData(),
      dataLoading: this._dataLoading(),
      dataError: this._dataError(),
      sidebarCollapsed: this._sidebarCollapsed(),
      accountData: this._accountData()
    };
  }

  resetState(): void {
    this._currentConfig.set(null);
    this._currentEndpoint.set('');
    this._terminalState.set({
      loading: false,
      connectionStatus: 'disconnected',
      requestParams: {}
    });
    this._currentData.set([]);
    this._dataLoading.set(false);
    this._dataError.set(null);
    this._accountData.set(null);

    this.emitEvent('config-update', { reset: true }, 'terminal');
  }

  // Private helper methods
  private emitEvent(
    type: ApiManagementEvent['type'],
    payload: any,
    source: ApiManagementEvent['source']
  ): void {
    const event: ApiManagementEvent = {
      type,
      payload,
      timestamp: new Date(),
      source
    };

    this._eventsSubject.next(event);

    // Debug logging
    console.log(`📡 [${source}] ${type}:`, payload);
  }
}
