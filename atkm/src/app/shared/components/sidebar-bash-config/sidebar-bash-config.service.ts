// sidebar-bash-config.service.ts
// Service for communication between sidebar and terminal components

import { inject, Injectable, signal } from '@angular/core';
import { ToolsService } from '@shared/services/tools.service';
import { BehaviorSubject } from 'rxjs';

export interface IBashConfigState {
  currentEndpoint: string;
  parameters: Record<string, any>;
  loading: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
}

export interface IBashConfigEvent {
  type: 'endpoint-change' | 'parameter-change' | 'action-trigger' | 'load-data' | 'test-connection';
  payload: any;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class SidebarBashConfigService {

  // =========================================
  // DEPENDENCIES
  // =========================================

  private readonly tools = inject(ToolsService);

  // =========================================
  // STATE MANAGEMENT WITH SIGNALS
  // =========================================

  private configState = signal<IBashConfigState>({
    currentEndpoint: 'account',
    parameters: {},
    loading: false,
    connectionStatus: 'disconnected'
  });

  // =========================================
  // EVENT STREAM FOR COMPLEX COMMUNICATIONS
  // =========================================

  private eventsSubject = new BehaviorSubject<IBashConfigEvent[]>([]);

  // =========================================
  // PUBLIC READONLY SIGNALS
  // =========================================

  public readonly state = this.configState.asReadonly();
  public readonly events$ = this.eventsSubject.asObservable();

  // =========================================
  // CONSTRUCTOR
  // =========================================

  constructor() {
    this.tools.consoleGroup({ // TAG SidebarBashConfigService -> constructor() ================ CONSOLE LOG IN PROGRESS
      title: `SidebarBashConfigService -> constructor() `, tag: 'check', palette: 'in', collapsed: true,
      data: this.configState()
    });
  }

  /**
   * Update current endpoint selection
   */
  updateEndpoint(endpointId: string): void {
    this.configState.update(state => ({
      ...state,
      currentEndpoint: endpointId,
      parameters: {} // Reset parameters when changing endpoint
    }));

    this.emitEvent('endpoint-change', { endpointId });
    console.log(`📡 Endpoint changed to: ${endpointId}`);
  }

  /**
   * Update request parameters
   */
  updateParameters(params: Record<string, any>): void {
    this.configState.update(state => ({
      ...state,
      parameters: { ...state.parameters, ...params }
    }));

    this.emitEvent('parameter-change', { parameters: params });
    console.log('📝 Parameters updated:', params);
  }

  /**
   * Update connection status
   */
  updateConnectionStatus(status: IBashConfigState['connectionStatus']): void {
    this.configState.update(state => ({
      ...state,
      connectionStatus: status
    }));
  }

  /**
   * Update loading state
   */
  updateLoadingState(loading: boolean): void {
    this.configState.update(state => ({
      ...state,
      loading
    }));
  }

  /**
   * Trigger data loading action
   */
  triggerDataLoad(params?: Record<string, any>): void {
    if (params) {
      this.updateParameters(params);
    }

    this.updateLoadingState(true);
    this.emitEvent('load-data', {
      endpoint: this.configState().currentEndpoint,
      parameters: this.configState().parameters
    });

    console.log('🔄 Data load triggered');
  }

  /**
   * Trigger connection test
   */
  triggerConnectionTest(): void {
    this.updateConnectionStatus('connecting');
    this.emitEvent('test-connection', {
      endpoint: this.configState().currentEndpoint
    });

    console.log('🌐 Connection test triggered');
  }

  /**
   * Trigger custom action
   */
  triggerAction(actionId: string, payload?: any): void {
    this.emitEvent('action-trigger', {
      actionId,
      payload,
      endpoint: this.configState().currentEndpoint
    });

    console.log(`⚡ Action triggered: ${actionId}`);
  }

  /**
   * Get current state snapshot
   */
  getStateSnapshot(): IBashConfigState {
    return { ...this.configState() };
  }

  /**
   * Reset state to defaults
   */
  resetState(): void {
    this.configState.set({
      currentEndpoint: 'account',
      parameters: {},
      loading: false,
      connectionStatus: 'disconnected'
    });

    console.log('🔄 State reset to defaults');
  }

  // Private helper methods

  private emitEvent(type: IBashConfigEvent['type'], payload: any): void {
    const event: IBashConfigEvent = {
      type,
      payload,
      timestamp: new Date()
    };

    const currentEvents = this.eventsSubject.value;
    const updatedEvents = [...currentEvents, event];

    // Keep only last 50 events to prevent memory issues
    if (updatedEvents.length > 50) {
      updatedEvents.splice(0, updatedEvents.length - 50);
    }

    this.eventsSubject.next(updatedEvents);
  }
}
