import { inject, Injectable, signal } from '@angular/core';
import { ToolsService } from '@shared/services/tools.service';

import type { BashData } from '@shared/components/atk-api/atk-api-bash/atk-api-bash.interfaces';

export interface IBashConfigState {
  currentEndpoint: string;
  parameters: Record<string, any>;
  loading: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  selectedRowData: BashData | null;
  sidebarData: Record<string, any> | null;
  isPinned: boolean;
}

export interface IBashConfigEvent {
  type: 'endpoint-change'
  | 'parameter-change'
  | 'action-trigger'
  | 'load-data'
  | 'test-connection'
  | 'row-selected'
  | 'row-deselected'
  | 'request-sidebar-open'
  | 'sidebar-data-updated';
  payload: any;
  timestamp: Date;
}

@Injectable({ providedIn: 'root' })

export class AtkApiSidebarConfigService {

  // =========================
  // DEPENDENCIES
  // =========================

  private readonly tools = inject(ToolsService);

  // =========================
  // STATE (Signals)
  // =========================

  private _state = signal<IBashConfigState>({
    currentEndpoint: 'account',
    parameters: {},
    loading: false,
    connectionStatus: 'disconnected',
    selectedRowData: null,
    sidebarData: null, // NEW
    isPinned: false
  });

  // 100% signals event bus
  private _events = signal<IBashConfigEvent[]>([]);

  // =========================
  // PUBLIC API (readonly)
  // =========================

  public readonly state = this._state.asReadonly();
  public readonly events = this._events.asReadonly();

  constructor() {
    this.tools.consoleGroup({ // TAG AtkApiSidebarConfigService -> constructor() ================= CONSOLE LOG IN PROGRESS
      title: 'AtkApiSidebarConfigService -> constructor()', tag: 'recycle', palette: 'in', collapsed: true,
      data: this._state()
    });
  }

  // =========================
  // STATE MUTATIONS
  // =========================

  /** Change endpoint (reset parameters and selection) */
  updateEndpoint(endpointId: string): void {
    this._state.update(s => ({
      ...s,
      currentEndpoint: endpointId,
      parameters: {},
      selectedRowData: null,
      sidebarData: null // NEW - Reset sidebar data on endpoint change
    }));
    this.emitEvent('endpoint-change', { endpointId });
  }

  /** Merge parameters */
  updateParameters(params: Record<string, any>): void {
    this._state.update(s => ({
      ...s,
      parameters: { ...s.parameters, ...params }
    }));
    this.emitEvent('parameter-change', { parameters: params });
  }

  /** connection status */
  updateConnectionStatus(status: IBashConfigState['connectionStatus']): void {
    this._state.update(s => ({ ...s, connectionStatus: status }));
  }

  /** loading spinner */
  updateLoadingState(loading: boolean): void {
    this._state.update(s => ({ ...s, loading }));
  }

  /**
   * Update global sidebar data from API response
   */
  updateSidebarData(data: Record<string, any> | null): void {
    this._state.update(s => ({ ...s, sidebarData: data }));
    this.emitEvent('sidebar-data-updated', { sidebarData: data });
    this.tools.consoleGroup({ // TAG AtkApiSidebarConfigService -> updateSidebarData()
      title: `AtkApiSidebarConfigService -> updateSidebarData()`, tag: 'recycle', palette: 'in', collapsed: true,
      data: this._state()
    });

  }
  // =========================
  // ROW SELECTION
  // =========================

  /**
   * Update selected row data
   */
  updateSelectedRow(rowData: BashData | null): void {
    this._state.update(s => ({ ...s, selectedRowData: rowData }));

    if (rowData) {
      this.emitEvent('row-selected', { rowData });
    } else {
      this.emitEvent('row-deselected', {});
    }
  }

  /**
   * Clear selected row
   */
  clearSelectedRow(): void {
    this.updateSelectedRow(null);
  }

  /**
   * Request sidebar to open (triggered by row selection)
   */
  requestSidebarOpen(): void {
    this.emitEvent('request-sidebar-open', {});
  }

  /**
   * Toggle pin state
   */
  togglePinned(): void {
    this._state.update(s => ({ ...s, isPinned: !s.isPinned }));
  }

  /**
   * Set pin state
   */
  setPinned(pinned: boolean): void {
    this._state.update(s => ({ ...s, isPinned: pinned }));
  }
  // =========================
  // TRIGGERS (events)
  // =========================

  triggerDataLoad(params?: Record<string, any>): void {
    if (params) this.updateParameters(params);
    this.updateLoadingState(true);
    this.clearSelectedRow();
    this.emitEvent('load-data', {
      endpoint: this._state().currentEndpoint,
      parameters: this._state().parameters
    });
  }

  triggerConnectionTest(): void {
    this.updateConnectionStatus('connecting');
    this.emitEvent('test-connection', {
      endpoint: this._state().currentEndpoint
    });
  }

  triggerAction(actionId: string, payload?: any): void {
    this.emitEvent('action-trigger', {
      actionId,
      payload,
      endpoint: this._state().currentEndpoint
    });
  }

  // =========================
  // UTILS
  // =========================

  getStateSnapshot(): IBashConfigState {
    return { ...this._state() };
  }

  resetState(): void {
    this._state.set({
      currentEndpoint: 'account',
      parameters: {},
      loading: false,
      connectionStatus: 'disconnected',
      selectedRowData: null,
      sidebarData: null, // NEW
      isPinned: false
    });
  }

  // =========================
  // PRIVATE
  // =========================

  private emitEvent(type: IBashConfigEvent['type'], payload: any): void {
    const event: IBashConfigEvent = { type, payload, timestamp: new Date() };
    this._events.update(list => {
      const updated = [...list, event];
      return updated.length > 50 ? updated.slice(-50) : updated;
    });
  }
}
