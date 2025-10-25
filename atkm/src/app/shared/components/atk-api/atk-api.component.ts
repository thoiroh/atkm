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
export type AtkApiDomain = 'binance' | 'ibkr';

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
  // INPUTS
  // =========================================

  /**
   * API domain type to use (binance, ibkr, etc.)
   * Determines which factory method to call
   */
  // configType = input<AtkApiDomain>('binance');

  // =========================================
  // PUBLIC READONLY SIGNALS (for template)
  // =========================================

  readonly state = this.stateService.state;
  readonly config = this.stateService.config;

  // =========================================
  // CONSTRUCTOR
  // =========================================

  constructor() {
    // this.tools.consoleGroup({ // OFF AtkApiComponent -> constructor() ================ CONSOLE LOG IN PROGRESS
    //   title: `AtkApiComponent -> constructor() -> this.configType(${this.configType()})`, tag: 'check', palette: 'ac', collapsed: false,
    //   data: { configType: this.configType(), config: this.config() }
    // });

    // =====================================
    // EFFECT: Auto-load data on endpoint/parameters change
    // Uses dedicated signals to avoid loops
    // =====================================

    effect(() => {
      const context = this.stateService.endpointContextSignal();      // Track only endpoint and parameters changes, not full state
      // console.log('🔄 EFFECT TRIGGERED', { endpoint: context.endpoint, parameters: context.parameters, timestamp: new Date().toISOString() });
      if (!context.endpoint) {
        // console.log('⏭️ EFFECT SKIPPED: No endpoint');
        return;
      }
      // this.tools.consoleGroup({// OFF AtkApiComponent -> constructor(Effect): Endpoint/Params Changed ================ CONSOLE LOG IN PROGRESS
      //   title: 'AtkApiComponent -> constructor(Effect): Endpoint/Params Changed', tag: 'check', palette: 'ac', collapsed: true,
      //   data: context
      // });
      // Load data outside tracking context
      untracked(() => this.loadData());
    });
  }

  // =========================================
  // LIFECYCLE
  // =========================================

  ngOnInit(): void {
    const configType = this.route.snapshot.data['configType'] as AtkApiDomain || 'binance';
    const config = this.getConfigForDomain(configType);
    // this.tools.consoleGroup({ // OFF AtkApiComponent -> ngOnInit() ================ CONSOLE LOG IN PROGRESS
    //   title: `AtkApiComponent -> ngOnInit() -> this.configType(${configType})`, tag: 'check', palette: 'ac', collapsed: false,
    //   data: { configType: configType, config: this.config() }
    // });
    if (!config) {
      this.tools.consoleGroup({ // TAG AtkApiComponent -> ngOnInit(ERROR)  ================ CONSOLE LOG IN PROGRESS
        title: 'AtkApiComponent -> ngOnInit(ERROR): No config found', tag: 'cross', palette: 'er', collapsed: true,
        data: { configType: configType }
      });
      return;
    }
    // Initialize state service with config // true = attempt to restore from localStorage with user confirmation
    this.stateService.initialize(config, true);
    // this.tools.consoleGroup({ // OFF AtkApiComponent -> ngOnInit(SUCCESS) SUCCESS ================ CONSOLE LOG IN PROGRESS
    //   title: 'AtkApiComponent -> ngOnInit(SUCCESS) ', tag: 'check', palette: 'in', collapsed: true,
    //   data: { config: config.id, domain: config.domain, endpoints: config.endpoints.length }
    // });
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
        this.tools.consoleGroup({  // TAG AtkApiComponent -> getConfigForDomain(ERROR) ================ CONSOLE LOG IN PROGRESS
          title: 'AtkApiComponent -> getConfigForDomain(ERROR) ', tag: 'cross', palette: 'er', collapsed: false,
          data: { domain, error: 'Unsupported domain type' }
        });
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

    if (!endpointConfig) {
      this.tools.consoleGroup({  // TAG AtkApiComponent -> loadData(SKIP) ================ CONSOLE LOG IN PROGRESS
        title: 'AtkApiComponent -> loadData(SKIP) ', tag: 'check', palette: 'wa', collapsed: true,
        data: { currentEndpoint: state.currentEndpoint }
      });
      return;
    }
    // Set loading state
    this.stateService.setLoading(true);
    this.stateService.setError(null);
    try {
      // Call HTTP service to fetch data
      const response = await this.httpService.loadData(
        endpointConfig,
        state.parameters
      );
      // Check for errors in response
      if (response.error) {
        this.stateService.setError(response.error);
        this.stateService.setConnectionStatus('disconnected');
        this.tools.consoleGroup({  // TAG AtkApiComponent -> loadData(ERROR) -> effect() ================ CONSOLE LOG IN PROGRESS
          title: 'AtkApiComponent -> loadData(ERROR) ', tag: 'cross', palette: 'er', collapsed: false,
          data: { endpoint: endpointConfig.id, error: response.error, statusCode: response.statusCode }
        });
        return;
      }
      // Update state with successful response
      this.stateService.updateData(response.data);
      // Set response metadata
      this.stateService.setResponseMetadata({
        statusCode: response.statusCode,
        responseTime: response.responseTime,
        dataCount: response.data.length,
        fromCache: response.fromCache,
        timestamp: new Date()
      });
      // Update connection status
      this.stateService.setConnectionStatus('connected');
      this.tools.consoleGroup({  // TAG AtkApiComponent -> loadData(SUCCESS) -> effect() ================ CONSOLE LOG IN PROGRESS
        title: 'AtkApiComponent -> loadData(SUCCESS) ', tag: 'check', palette: 'su', collapsed: true,
        data: { endpoint: endpointConfig.id, dataCount: response.data.length, responseTime: response.responseTime, fromCache: response.fromCache }
      });
    } catch (error: any) {
      // Handle unexpected errors
      const errorMessage = error.message || 'Unknown error occurred';
      this.stateService.setError(errorMessage);
      this.stateService.setConnectionStatus('disconnected');
      this.tools.consoleGroup({  // TAG AtkApiComponent -> loadData(EXCEPTION) -> effect() ================ CONSOLE LOG IN PROGRESS
        title: 'AtkApiComponent -> loadData(EXCEPTION) ', tag: 'cross', palette: 'er', collapsed: false,
        data: {
          endpoint: endpointConfig.id,
          error: errorMessage,
          exception: error
        }
      });

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
}
