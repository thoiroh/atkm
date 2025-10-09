// src/app/shared/components/atk-api-management/atk-api-management.component.ts
// CORRECTED - Component using the new ApiManagementStateService

import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, OnInit, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BinanceService } from '@features/binance/services/binance.service';
import { AtkBashConfigFactory } from '@shared/components/atk-bash/atk-bash-config.factory';
import { AtkBashComponent } from '@shared/components/atk-bash/atk-bash.component';
import { AtkDatatableComponent } from '@shared/components/atk-datatable/atk-datatable.component';
import { AtkIconComponent } from '@shared/components/atk-icon/atk-icon.component';
import { ApiManagementStateService } from '@shared/services/atk-api-management-state.service';
import { ToolsService } from '@shared/services/tools.service';
import { firstValueFrom } from 'rxjs';
import { BashData, IBashColumn, IBashEndpointConfig, IBashEvent } from '../atk-bash/atk-bash.interfaces';

/**
 * Configuration event from sidebar
 */
interface IApiManagementEvent {
  type: 'endpoint-change' | 'parameter-change' | 'action-execute' | 'config-update' | 'account-refresh';
  payload: any;
  timestamp: Date;
}

@Component({
  selector: 'atk-api-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AtkIconComponent,
    AtkBashComponent,
    AtkDatatableComponent
  ],
  templateUrl: './atk-api-management.component.html',
  styleUrls: ['./atk-api-management.component.css']
})
export class AtkApiManagementComponent implements OnInit {

  // Component inputs
  configId = input<string>('binance-debug-v2');
  autoLoad = input<boolean>(true);

  // Component outputs
  dataRowSelected = output<BashData>();
  endpointChanged = output<string>();
  errorOccurred = output<string>();

  // Services
  private configFactory = inject(AtkBashConfigFactory);
  private binanceService = inject(BinanceService);
  private tools = inject(ToolsService);

  // CORRECTED: Use the corrected service
  public apiStateService = inject(ApiManagementStateService);

  // =========================================
  // COMPUTED SIGNALS
  // =========================================

  private currentConfig = computed(() => {
    const configId = this.configId();
    switch (configId) {
      case 'binance-debug-v2':
        return this.configFactory.createBinanceDebugConfig();
      default:
        return this.configFactory.createBinanceDebugConfig();
    }
  });

  private currentEndpoint = computed(() => this.apiStateService.currentEndpoint());

  currentEndpointColumns(): IBashColumn[] {
    // Return your columns array here
    return [
      { key: 'id', label: 'ID', type: 'text', width: '80px' },
      { key: 'name', label: 'Name', type: 'text', width: '200px' },
      { key: 'status', label: 'Status', type: 'badge', width: '100px' }
      // Add more columns as needed
    ];
  }

  // =========================================
  // CONSTRUCTOR & LIFECYCLE
  // =========================================

  constructor() {
    // Subscribe to state service events to handle sidebar actions
    this.apiStateService.events$.subscribe(event => {
      this.handleStateServiceEvent(event);
    });

    // Subscribe to state service commands for terminal actions
    this.apiStateService.commands$.subscribe(command => {
      this.handleStateServiceCommand(command);
    });

    // Log state changes for debugging
    effect(() => {
      const summary = this.apiStateService.summary();

      // OFF: atk-api-management.121 ================ CONSOLE LOG IN PROGRESS
      // this.tools.consoleGroup({
      //   title: `atk-api-management state change ${summary.configId}`,
      //   tag: 'check',
      //   data: {
      //     configId: summary.configId,
      //     endpoint: summary.endpoint,
      //     hasData: summary.hasData,
      //     tableRows: summary.tableRows,
      //     sidebarFields: summary.sidebarFields,
      //     loading: this.apiStateService.loading(),
      //     error: this.apiStateService.error()
      //   },
      //   palette: 'de',
      //   collapsed: true,
      //   fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      //   fontSizePx: 13
      // });
    });

    // Effect to initialize configuration
    effect(() => {
      const configId = this.configId();
      this.apiStateService.setConfigId(configId);
    });
  }

  ngOnInit(): void {
    this.loadConfiguration();
  }

  // =========================================
  // EVENT HANDLERS
  // =========================================

  /**
   * Handle data loaded from bash component
   */
  onBashDataLoaded(data: BashData[]): void {
    // Data is now automatically synced via ApiManagementStateService
    this.tools.consoleGroup({
      title: `AtkApiManagement data loaded from bash`,
      tag: 'check',
      data: { count: data.length, endpoint: this.apiStateService.currentEndpoint() },
      palette: 'su',
      collapsed: true,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSizePx: 13
    });
  }

  /**
   * Handle bash errors
   */
  onBashError(error: string): void {
    // Error is now automatically synced via ApiManagementStateService
    this.errorOccurred.emit(error);

    this.tools.consoleGroup({
      title: `AtkApiManagement bash error`,
      tag: 'cross',
      data: error,
      palette: 'er',
      collapsed: true,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSizePx: 13
    });
  }

  /**
   * Handle bash events
   */
  onBashEvent(event: IBashEvent): void {
    // Events are now automatically handled via ApiManagementStateService
    if (event.type === 'endpoint-changed') {
      this.endpointChanged.emit(event.payload.endpoint);
    }
  }

  /**
   * Handle data table row clicks
   */
  onDataRowClick(row: BashData): void {
    this.dataRowSelected.emit(row);

    this.tools.consoleGroup({
      title: `AtkApiManagement row selected`,
      tag: 'check',
      data: row,
      palette: 'de',
      collapsed: true,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSizePx: 13
    });
  }

  /**
   * Handle data retry requests
   */
  onRetryDataLoad(): void {
    const endpoint = this.apiStateService.currentEndpoint();
    if (endpoint) {
      this.loadEndpointData(endpoint);
    }
  }

  /**
   * Handle data export requests
   */
  onDataExport(data: BashData[]): void {
    this.tools.consoleGroup({
      title: `AtkApiManagement data export requested`,
      tag: 'check',
      data: { count: Array.isArray(data) ? data.length : 0 },
      palette: 'de',
      collapsed: true,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSizePx: 13
    });
  }

  // =========================================
  // PRIVATE METHODS
  // =========================================

  /**
   * Load configuration from factory
   */
  private async loadConfiguration(): Promise<void> {
    try {
      const configId = this.configId();
      const config = this.currentConfig();

      // Set configuration in state service
      this.apiStateService.setConfigId(configId);

      // Auto-load data if enabled
      if (this.autoLoad() && config.endpoints.length > 0) {
        const defaultEndpoint = config.defaultEndpoint || config.endpoints[0].id;
        this.apiStateService.setCurrentEndpoint(defaultEndpoint);

        if (this.autoLoad()) {
          this.loadEndpointData(defaultEndpoint);
        }
      }

    } catch (error) {
      this.tools.consoleGroup({
        title: `AtkApiManagement failed to load configuration`,
        tag: 'cross',
        data: error,
        palette: 'er',
        collapsed: true,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSizePx: 13
      });
    }
  }

  /**
   * Handle events from state service (from sidebar)
   */
  private handleStateServiceEvent(event: any): void {
    switch (event.type) {
      case 'endpoint-changed':
        if (event.payload.endpoint) {
          this.loadEndpointData(event.payload.endpoint);
        }
        break;

      case 'data-loaded':
        // Data loaded - could trigger additional actions
        break;

      case 'error':
        this.errorOccurred.emit(event.payload.error);
        break;
    }
  }

  /**
   * Handle commands from state service (terminal commands)
   */
  private handleStateServiceCommand(command: any): void {
    if (command.type === 'LOAD_ENDPOINT') {
      const { endpoint } = command.payload;
      this.loadEndpointData(endpoint);
    }
  }

  /**
   * Load data for specific endpoint using the new system
   */
  private async loadEndpointData(endpointId: string): Promise<void> {
    const config = this.currentConfig();
    if (!config) return;

    const endpoint = config.endpoints.find(ep => ep.id === endpointId);
    if (!endpoint) return;

    this.apiStateService.setLoading(true);

    try {
      const rawData = await this.loadDataFromEndpoint(endpoint);

      // Use the endpoint's dataTransformer if available
      if (endpoint.dataTransformer) {
        this.apiStateService.setRawData(rawData, endpoint.dataTransformer);
      } else {
        // Fallback: treat as table data only
        this.apiStateService.updateData({
          sidebarData: {},
          tableData: Array.isArray(rawData) ? rawData : [rawData]
        });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.apiStateService.setError(errorMessage);

    } finally {
      this.apiStateService.setLoading(false);
    }
  }

  /**
   * Load data from endpoint using appropriate service
   */
  private async loadDataFromEndpoint(endpoint: IBashEndpointConfig): Promise<any> {
    try {
      switch (endpoint.id) {
        case 'account':
          return await firstValueFrom(this.binanceService.getAccount());

        case 'trades':
          const symbol = 'BTCUSDT'; // Could be parameterized
          return await firstValueFrom(
            this.binanceService.getMyTrades(symbol, undefined, undefined, 100)
          );

        case 'ticker':
          const tickerSymbol = 'BTCUSDT'; // Could be parameterized
          return await firstValueFrom(this.binanceService.getTickerPrice(tickerSymbol));

        case 'orders':
          const orderSymbol = 'BTCUSDT'; // Could be parameterized
          return await firstValueFrom(
            this.binanceService.getAllOrders(orderSymbol, undefined, undefined, 100)
          );

        default:
          return [];
      }
    } catch (error) {
      throw error;
    }
  }
}
