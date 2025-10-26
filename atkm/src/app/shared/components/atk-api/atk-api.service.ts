/**
 * ATK API Service
 * Unified state management and event bus for ATK API components
 * Single source of truth for all ATK API state
 */

import { effect, inject, Injectable, signal } from '@angular/core';
import { ToolsService } from '@core/services/tools.service';

import type {
  AtkApiConnectionStatus,
  AtkApiEventType,
  BashData,
  IAtkApiEvent,
  IAtkApiResponseMetadata,
  IAtkApiUnifiedState
} from './atk-api.interfaces';

@Injectable({
  providedIn: 'root'
})
export class AtkApiService {

  // ======================================================
  // DEPENDENCIES
  // ======================================================

  private readonly tools = inject(ToolsService);

  // ======================================================
  // INITIAL STATE
  // ======================================================

  private readonly initialState: IAtkApiUnifiedState = {
    configId: 'atkpi-debug-v2',
    currentEndpoint: 'account',
    parameters: {},
    tableData: [],
    sidebarData: null,
    selectedRowData: null,
    loading: false,
    error: null,
    connectionStatus: 'disconnected',
    sidebarCollapsed: true,
    sidebarPinned: false,
    responseMetadata: null
  };

  // ======================================================
  // STATE SIGNALS
  // ======================================================

  /** Main state signal - single source of truth */
  private _state = signal<IAtkApiUnifiedState>(this.initialState);

  /** Events signal - last 100 events */
  private _events = signal<IAtkApiEvent[]>([]);

  // ======================================================
  // PUBLIC READONLY SIGNALS
  // ======================================================

  /** Public readonly state */
  public readonly state = this._state.asReadonly();

  /** Public readonly events */
  public readonly events = this._events.asReadonly();

  // ======================================================
  // CONSTRUCTOR
  // ======================================================

  constructor() {
    // ⚠️ TEMPORARY DEBUG - Remove after fixing loop
    // this.enableDebugMode();

    this.tools.consoleGroup({
      title: 'AtkApiService -> constructor()',
      tag: 'recycle',
      palette: 'in',
      collapsed: true,
      data: this._state()
    });
  }

  // ======================================================
  // INITIALIZATION
  // ======================================================

  /**
   * Initialize service with config and default endpoint
   */
  initialize(configId: string, defaultEndpoint: string): void {
    this._state.update(s => ({
      ...s,
      currentEndpoint: defaultEndpoint,
      parameters: {},
      connectionStatus: 'disconnected'
    }));

    this.emitEvent('state-initialized', {
      configId,
      defaultEndpoint
    });

    this.tools.consoleGroup({
      title: 'AtkApiService -> initialize()',
      tag: 'check',
      palette: 'in',
      collapsed: true,
      data: { configId, defaultEndpoint, state: this._state() }
    });
  }

  // ======================================================
  // STATE MANAGEMENT - CONTEXT
  // ======================================================

  /**
   * Update current endpoint
   * Resets parameters, selection, and data
   */
  updateEndpoint(endpointId: string): void {
    const oldEndpoint = this._state().currentEndpoint;

    this._state.update(s => ({
      ...s,
      currentEndpoint: endpointId,
      parameters: {},
      selectedRowData: null,
      sidebarData: null,
      tableData: [],
      error: null
    }));

    this.emitEvent('endpoint-changed', {
      oldEndpoint,
      newEndpoint: endpointId
    });
  }

  /**
   * Update endpoint parameters
   * Merges with existing parameters
   */
  updateParameters(params: Record<string, any>): void {
    this._state.update(s => {
      let updated: Record<string, any> = {};

      // Si on passe all: true, on efface tout avant de fusionner
      if (!params.all) {
        updated = { ...s.parameters };
      }

      for (const key in params) {
        if (key === 'all') continue; // ignore le flag
        const value = params[key];
        if (value === null || value === undefined) {
          delete updated[key];
        } else {
          updated[key] = value;
        }
      }

      return { ...s, parameters: updated };
    });

    this.emitEvent('parameters-updated', { parameters: params });
  }


  // ======================================================
  // STATE MANAGEMENT - DATA
  // ======================================================

  /**
   * Update table and sidebar data after API call
   */
  updateData(
    tableData: BashData[],
    sidebarData: Record<string, any> | null = null
  ): void {
    this._state.update(s => ({
      ...s,
      tableData,
      sidebarData,
      error: null
    }));

    this.emitEvent('data-loaded', {
      endpoint: this._state().currentEndpoint,
      dataCount: tableData.length,
      responseTime: this._state().responseMetadata?.responseTime || 0
    });
  }

  /**
   * Update selected row data
   */
  updateSelectedRow(rowData: BashData | null): void {
    const previousRowData = this._state().selectedRowData;

    this._state.update(s => ({
      ...s,
      selectedRowData: rowData
    }));

    if (rowData) {
      this.emitEvent('row-selected', { rowData });
    } else {
      this.emitEvent('row-cleared', { previousRowData });
    }
  }

  /**
   * Clear selected row
   */
  clearSelectedRow(): void {
    this.updateSelectedRow(null);
  }

  // ======================================================
  // STATE MANAGEMENT - UI STATE
  // ======================================================

  /**
   * Set loading state
   */
  setLoading(loading: boolean): void {
    this._state.update(s => ({ ...s, loading }));

    if (loading) {
      this.emitEvent('data-loading', {
        endpoint: this._state().currentEndpoint,
        parameters: this._state().parameters
      });
    }
  }

  /**
   * Set error message
   */
  setError(error: string | null): void {
    this._state.update(s => ({ ...s, error, loading: false }));

    if (error) {
      this.emitEvent('data-error', {
        endpoint: this._state().currentEndpoint,
        error
      });
    }
  }

  /**
   * Set connection status
   */
  setConnectionStatus(status: AtkApiConnectionStatus): void {
    this._state.update(s => ({ ...s, connectionStatus: status }));
  }

  /**
   * Set response metadata
   */
  setResponseMetadata(metadata: IAtkApiResponseMetadata): void {
    this._state.update(s => ({ ...s, responseMetadata: metadata }));
  }

  // ======================================================
  // EVENT BUS
  // ======================================================

  /**
   * Emit an event to the event bus
   * Events are limited to last 100
   */
  emitEvent(type: AtkApiEventType, payload: any = {}): void {
    const event: IAtkApiEvent = {
      type,
      payload,
      timestamp: new Date()
    };

    this._events.update(list => {
      const updated = [...list, event];
      // Keep only last 100 events
      return updated.length > 100 ? updated.slice(-100) : updated;
    });

    // Debug log for important events
    if (this.shouldLogEvent(type)) {
      this.tools.consoleGroup({
        title: `AtkApiService -> Event: ${type}`,
        tag: 'check',
        palette: 'ac',
        collapsed: true,
        data: { event, currentState: this._state() }
      });
    }
  }

  /**
 * Debug: Log all state mutations with stack trace
 * ONLY FOR DEVELOPMENT - Remove in production
 */
  enableDebugMode(): void {
    effect(() => {
      const currentState = this._state();
      console.group('🔍 [DEBUG] AtkApiService State Change');
      console.log('Timestamp:', new Date().toISOString());
      console.log('State:', currentState);
      console.trace('Stack Trace:');
      console.groupEnd();
    });
  }

  /**
   * Determine if event should be logged
   */
  private shouldLogEvent(type: AtkApiEventType): boolean {
    const importantEvents: AtkApiEventType[] = [
      'data-loaded',
      'data-error',
      'endpoint-changed',
      'row-selected',
      'connection-tested'
    ];

    return importantEvents.includes(type);
  }

  // ======================================================
  // UTILITIES
  // ======================================================

  /**
   * Get current state snapshot (immutable copy)
   */
  getStateSnapshot(): Readonly<IAtkApiUnifiedState> {
    return { ...this._state() };
  }

  /**
   * Reset state to initial values
   */
  resetState(): void {
    this._state.set(this.initialState);
    this._events.set([]);
    this.emitEvent('state-reset', {});

    this.tools.consoleGroup({
      title: 'AtkApiService -> resetState()',
      tag: 'cross',
      palette: 'wa',
      collapsed: true,
      data: this._state()
    });
  }

  /**
   * Clear all data (keep context and UI state)
   */
  clearData(): void {
    this._state.update(s => ({
      ...s,
      tableData: [],
      sidebarData: null,
      selectedRowData: null,
      error: null,
      responseMetadata: null
    }));
  }
}
