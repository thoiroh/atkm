// sidebar-bash-config.service.v02.ts
// ======================================================
// FULL SIGNALS VERSION (Angular 20+)
// Panneau latéral de configuration pour ATK Bash
// - State via signals()
// - Event-bus via signal<IBashConfigEvent[]>
// - Plus aucun BehaviorSubject/Observable
// ======================================================

import { inject, Injectable, signal } from '@angular/core';
import { ToolsService } from '@shared/services/tools.service';

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

@Injectable({ providedIn: 'root' })
export class SidebarBashConfigService {
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
    connectionStatus: 'disconnected'
  });

  // Bus d’événements 100% signals
  private _events = signal<IBashConfigEvent[]>([]);

  // =========================
  // PUBLIC API (readonly)
  // =========================
  public readonly state = this._state.asReadonly();
  public readonly events = this._events.asReadonly();

  constructor() {
    this.tools.consoleGroup({
      title: 'SidebarBashConfigService -> constructor()',
      tag: 'check',
      palette: 'in',
      collapsed: true,
      data: this._state()
    });
  }

  // =========================
  // MUTATIONS D’ÉTAT
  // =========================

  /** Changer d’endpoint (réinitialise les paramètres) */
  updateEndpoint(endpointId: string): void {
    this._state.update(s => ({
      ...s,
      currentEndpoint: endpointId,
      parameters: {}
    }));
    this.emitEvent('endpoint-change', { endpointId });
  }

  /** Fusionner des paramètres */
  updateParameters(params: Record<string, any>): void {
    this._state.update(s => ({
      ...s,
      parameters: { ...s.parameters, ...params }
    }));
    this.emitEvent('parameter-change', { parameters: params });
  }

  /** Statut de connexion */
  updateConnectionStatus(status: IBashConfigState['connectionStatus']): void {
    this._state.update(s => ({ ...s, connectionStatus: status }));
  }

  /** Indicateur de chargement */
  updateLoadingState(loading: boolean): void {
    this._state.update(s => ({ ...s, loading }));
  }

  // =========================
  // TRIGGERS (événements)
  // =========================

  triggerDataLoad(params?: Record<string, any>): void {
    if (params) this.updateParameters(params);
    this.updateLoadingState(true);

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
      connectionStatus: 'disconnected'
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
