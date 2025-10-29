/**
 * ATK API Component
 * Main orchestrator component for API debugging and data visualization
 *
 * Responsibilities:
 * - Initialize configuration via Factory
 * - Manage data loading lifecycle
 * - Orchestrate communication between child components
 * - Handle automatic data loading on endpoint/parameter changes
 *
 * @file atk-api.component.ts
 * @version 2.0.0
 * @architecture Orchestrator pattern with centralized state management
 */

import { CommonModule } from '@angular/common';
import { Component, effect, inject, OnInit, untracked } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { ToolsService } from '@core/services/tools.service';
import { AtkApiHttpService } from '@shared/components/atk-api/atk-api-http.service';
import { AtkApiStateService } from '@shared/components/atk-api/atk-api-state.service';

import { AtkApiBashComponent } from '@shared/components/atk-api/atk-api-bash/atk-api-bash.component';
import { AtkApiSidebarComponent } from '@shared/components/atk-api/atk-api-sidebar/atk-api-sidebar.component';
import { AtkIconComponent } from '@shared/components/atk-icon/atk-icon.component';

import { AtkApiFactory } from '@shared/components/atk-api/atk-api.factory';

/**
 * Supported API domain types
 */
export type AtkApiDomain = 'binance' | 'ibkr' | 'noconfig';

@Component({
  selector: 'atk-api',
  standalone: true,
  imports: [
    CommonModule,
    AtkIconComponent,
    AtkApiBashComponent,
    AtkApiSidebarComponent
  ],
  templateUrl: './atk-api.component.html',
  styles: []
})
export class AtkApiComponent implements OnInit {

  // =========================================
  // DEPENDENCIES
  // =========================================

  private readonly tools = inject(ToolsService);
  private readonly route = inject(ActivatedRoute);
  private readonly factory = inject(AtkApiFactory);
  private readonly httpService = inject(AtkApiHttpService);
  private readonly stateService = inject(AtkApiStateService);

  // =========================================
  // PUBLIC READONLY SIGNALS (for template)
  // =========================================

  readonly state = this.stateService.state;
  readonly config = this.stateService.config;

  // =========================================
  // CONSTRUCTOR
  // =========================================

  constructor() {

    // =====================================
    // EFFECT: Auto-load data on
    // endpoint/parameters change
    // =====================================

    effect(() => {
      // const context = this.stateService.endpointContextSignal();
      // if (!context.endpoint) { return; }
      const endpointId = this.stateService.endpointSignal();
      if (!endpointId) return;
      untracked(() => this.loadData());
    });

  }

  // =========================================
  // LIFECYCLE
  // =========================================
  // console.log(`🔥 configTypeInput: ${endpointConfig}`, endpointConfig);

  ngOnInit(): void {
    const configType = this.route.snapshot.data['configType'] as AtkApiDomain || 'noconfig';
    const config = this.getConfigForDomain(configType);
    if (!config) {
      this.tools.consoleGroup({ // TAG AtkApiComponent -> ngOnInit(ERROR)  ================ CONSOLE LOG IN PROGRESS
        title: `AtkApiComponent -> ngOnInit(ERROR): No config (${configType}) found`, tag: 'cross', palette: 'er', collapsed: true,
        data: { configType: configType }
      });
      return;
    }
    // Initialize state service with config // true = attempt to restore from localStorage with user confirmation
    this.stateService.initialize(config, true);
  }

  // =========================================
  // PRIVATE METHODS - CONFIGURATION
  // =========================================

  /**
   * Get configuration for specified domain
   * Uses factory to create appropriate config
   *
   * @param domain - API domain type
   * @returns Configuration object or null if unsupported
   */
  private getConfigForDomain(domain: AtkApiDomain) {
    switch (domain) {
      case 'binance':
        return this.factory.createBinanceConfig();
      case 'ibkr':
        return this.factory.createIBKRConfig();
      default:
        this.stateService.setError('Unsupported domain type');
        this.stateService.setConnectionStatus('disconnected');
        return null;
    }
  }

  // =========================================
  // PRIVATE METHODS - DATA LOADING
  // =========================================

  /**
   * Load data from API endpoint
   * Triggered automatically by effect when endpoint or parameters change
   *
   * Flow:
   * 1. Get current state and endpoint config
   * 2. Set loading state
   * 3. Call HTTP service to fetch data
   * 4. Update state with response data and metadata
   * 5. Handle errors and update connection status
   */
  public async loadData(): Promise<void> {
    const state = this.stateService.state();
    const endpointConfig = this.stateService.currentEndpointConfig();
    if (!endpointConfig) { return; }

    // Set loading state
    this.stateService.setLoading(true);
    this.stateService.setError(null);

    try {
      const response = await this.httpService.loadData(
        endpointConfig,
        state.parameters
      );

      if (response.error) {
        this.stateService.setError(response.error);
        this.stateService.setConnectionStatus('disconnected');
        return;
      }

      this.stateService.updateData(response.data, response.sidebarData || null);
      this.stateService.setResponseMetadata({
        statusCode: response.statusCode,
        responseTime: response.responseTime,
        dataCount: response.data.length,
        fromCache: response.fromCache,
        timestamp: new Date()
      });

      this.stateService.setConnectionStatus('connected');

    } catch (error: any) {
      // Handle unexpected errors
      const errorMessage = error.message || 'Unknown error occurred';
      this.stateService.setError(errorMessage);
      this.stateService.setConnectionStatus('disconnected');

    } finally {
      // Always clear loading state
      this.stateService.setLoading(false);
    }
  }

  // =========================================
  // PUBLIC METHODS - UI ACTIONS
  // =========================================

  /**
   * Toggle sidebar collapsed state
   * Called from template button click
   */
  toggleSidebar(): void {
    this.stateService.toggleSidebar();
  }

  /**
   * Received from the sidebar: commit then load the data
   */
  onSidebarLoadRequest(): void {
    this.stateService.commitPendingParameters();
    this.loadData();
  }
}
