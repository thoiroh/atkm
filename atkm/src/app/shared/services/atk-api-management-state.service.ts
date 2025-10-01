// api-management-state.service.ts
// EXTENDED - Angular 20 service for API management with separated data streams

import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { BashData, IBashDataTransformResult, IBashEvent, IBashSidebarField } from '@shared/components/atk-bash/atk-bash.interfaces';
import { Subject } from 'rxjs';
import { ToolsService } from './tools.service';

/**
 * State interface for API management
 */
export interface ApiManagementState {
  configId: string | null;
  currentEndpoint: string | null;
  loading: boolean;
  error: string | null;
  rawData: any;
  sidebarData: Record<string, any>;
  tableData: BashData[];
  lastUpdated: Date | null;
}

/**
 * Commands that can be sent to the service
 */
export interface ApiManagementCommand {
  type: 'LOAD_ENDPOINT' | 'SET_CONFIG' | 'CLEAR_DATA' | 'REFRESH_DATA';
  payload?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ApiManagementStateService {

  // =========================================
  // ANGULAR 20 SIGNALS - Core State
  // =========================================

  private _configId = signal<string | null>(null);
  private _currentEndpoint = signal<string | null>(null);
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);
  private _rawData = signal<any>(null);
  private _sidebarData = signal<Record<string, any>>({});
  private _tableData = signal<BashData[]>([]);
  private _lastUpdated = signal<Date | null>(null);

  private tools = inject(ToolsService);

  // =========================================
  // PUBLIC READONLY SIGNALS
  // =========================================

  public readonly configId = this._configId.asReadonly();
  public readonly currentEndpoint = this._currentEndpoint.asReadonly();
  public readonly loading = this._loading.asReadonly();
  public readonly error = this._error.asReadonly();
  public readonly rawData = this._rawData.asReadonly();
  public readonly sidebarData = this._sidebarData.asReadonly();
  public readonly tableData = this._tableData.asReadonly();
  public readonly lastUpdated = this._lastUpdated.asReadonly();

  // =========================================
  // COMPUTED SIGNALS
  // =========================================

  /**
   * Complete state as computed signal
   */
  public readonly state = computed<ApiManagementState>(() => ({
    configId: this._configId(),
    currentEndpoint: this._currentEndpoint(),
    loading: this._loading(),
    error: this._error(),
    rawData: this._rawData(),
    sidebarData: this._sidebarData(),
    tableData: this._tableData(),
    lastUpdated: this._lastUpdated()
  }));

  /**
   * Has valid data
   */
  public readonly hasData = computed(() =>
    this._rawData() !== null &&
    (this._sidebarData() && Object.keys(this._sidebarData()).length > 0 ||
      this._tableData().length > 0)
  );

  /**
   * Is data stale (older than 5 minutes)
   */
  public readonly isStale = computed(() => {
    const lastUpdate = this._lastUpdated();
    if (!lastUpdate) return true;

    const fiveMinutes = 5 * 60 * 1000;
    return Date.now() - lastUpdate.getTime() > fiveMinutes;
  });

  /**
   * Summary info for debugging
   */
  public readonly summary = computed(() => ({
    configId: this._configId(),
    endpoint: this._currentEndpoint(),
    hasData: this.hasData(),
    isStale: this.isStale(),
    sidebarFields: Object.keys(this._sidebarData()).length,
    tableRows: this._tableData().length,
    lastUpdate: this._lastUpdated()?.toISOString()
  }));

  // =========================================
  // EVENT STREAMS - Angular 20 Recommended
  // =========================================

  private _events = new Subject<IBashEvent>();
  private _commands = new Subject<ApiManagementCommand>();

  public readonly events$ = this._events.asObservable();
  public readonly commands$ = this._commands.asObservable();

  // =========================================
  // CONSTRUCTOR & EFFECTS
  // =========================================

  constructor() {
    // Effect to emit events when data changes
    effect(() => {
      const sidebarData = this._sidebarData();
      const tableData = this._tableData();

      if (Object.keys(sidebarData).length > 0) {
        this.emitEvent('sidebar-data-updated', { data: sidebarData });
      }

      if (tableData.length > 0) {
        this.emitEvent('table-data-updated', { data: tableData });
      }
    });

    // Load from session storage on init
    this.loadFromSession();
  }

  // =========================================
  // PUBLIC METHODS - Angular 20 Style
  // =========================================

  /**
   * Set configuration ID
   */
  setConfigId(configId: string): void {
    this._configId.set(configId);
    this.emitEvent('endpoint-changed', { configId });
    // TAG: ApiManagementStateService.159 ================ CONSOLE LOG IN PROGRESS
    this.tools.consoleGroup({
      title: `ApiManagementStateService 159 -> setConfigId() -> configId: `,
      tag: 'check',
      data: { configId: configId, state: this.state() },
      palette: 'su',
    });
  }

  /**
   * Set current endpoint
   */
  setCurrentEndpoint(endpoint: string): void {
    this._currentEndpoint.set(endpoint);
    this.emitEvent('endpoint-changed', { endpoint });
  }

  /**
   * Update data from API response using transform result
   */
  updateData(transformResult: IBashDataTransformResult): void {
    this._sidebarData.set(transformResult.sidebarData);
    this._tableData.set(transformResult.tableData);
    this._lastUpdated.set(new Date());
    this._error.set(null);

    this.emitEvent('data-loaded', {
      sidebarCount: Object.keys(transformResult.sidebarData).length,
      tableCount: transformResult.tableData.length
    });

    this.saveToSession();
  }

  /**
   * Update raw data and transform it
   */
  setRawData(data: any, transformer?: (data: any) => IBashDataTransformResult): void {
    this._rawData.set(data);

    if (transformer) {
      const transformResult = transformer(data);
      this.updateData(transformResult);
    }
  }

  /**
   * Set loading state
   */
  setLoading(loading: boolean): void {
    this._loading.set(loading);
  }

  /**
   * Set error state
   */
  setError(error: string | null): void {
    this._error.set(error);
    this._loading.set(false);

    if (error) {
      this.emitEvent('error', { error });
    }
  }

  /**
   * Clear all data
   */
  clearData(): void {
    this._rawData.set(null);
    this._sidebarData.set({});
    this._tableData.set([]);
    this._error.set(null);
    this._lastUpdated.set(null);
    this.clearSession();
  }

  /**
   * Send command to the service
   */
  sendCommand(command: ApiManagementCommand): void {
    this._commands.next(command);

    // Handle commands
    switch (command.type) {
      case 'CLEAR_DATA':
        this.clearData();
        break;
      case 'SET_CONFIG':
        if (command.payload?.configId) {
          this.setConfigId(command.payload.configId);
        }
        if (command.payload?.endpoint) {
          this.setCurrentEndpoint(command.payload.endpoint);
        }
        break;
    }
  }

  /**
   * Get sidebar data for specific fields
   */
  getSidebarFieldsData(fields: IBashSidebarField[]): Record<string, any> {
    const sidebarData = this._sidebarData();
    const result: Record<string, any> = {};

    fields.forEach(field => {
      if (sidebarData.hasOwnProperty(field.key)) {
        result[field.key] = sidebarData[field.key];
      }
    });

    return result;
  }

  // =========================================
  // PRIVATE HELPER METHODS
  // =========================================

  private emitEvent(type: IBashEvent['type'], payload: any): void {
    this._events.next({
      type,
      payload: {
        ...payload,
        configId: this._configId(),
        endpoint: this._currentEndpoint(),
        timestamp: new Date()
      },
      timestamp: new Date()
    });
  }

  private saveToSession(): void {
    try {
      const state = this.state();
      sessionStorage.setItem('api_management_state', JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save API management state to session:', error);
    }
  }

  private loadFromSession(): void {
    try {
      const savedData = sessionStorage.getItem('api_management_state');
      if (savedData) {
        const state: ApiManagementState = JSON.parse(savedData);

        if (state.configId) this._configId.set(state.configId);
        if (state.currentEndpoint) this._currentEndpoint.set(state.currentEndpoint);
        if (state.error) this._error.set(state.error);
        if (state.rawData) this._rawData.set(state.rawData);
        if (state.sidebarData) this._sidebarData.set(state.sidebarData);
        if (state.tableData) this._tableData.set(state.tableData);
        if (state.lastUpdated) this._lastUpdated.set(new Date(state.lastUpdated));
      }
    } catch (error) {
      console.warn('Failed to load API management state from session:', error);
      this.clearSession();
    }
  }

  private clearSession(): void {
    try {
      sessionStorage.removeItem('api_management_state');
    } catch (error) {
      console.warn('Failed to clear API management session data:', error);
    }
  }

}
