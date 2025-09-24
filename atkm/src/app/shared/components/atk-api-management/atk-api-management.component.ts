import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, OnInit, output, signal } from '@angular/core';
import { BinanceAccount } from '@features/binance/models/binance.model';
import { BinanceService } from '@features/binance/services/binance.service';
import { AtkIconComponent } from '@shared/components/atk-icon/atk-icon.component';
import { ToolsService } from '@shared/components/atk-tools/tools.service';
import { firstValueFrom } from 'rxjs';
import { AtkBashConfigFactory } from '../atk-bash/atk-bash-config.factory';
import { AtkBashComponent } from '../atk-bash/atk-bash.component';
import { BashData, IBashConfig, IBashEndpointConfig, IBashEvent, IBashTerminalState } from '../atk-bash/atk-bash.interfaces';
import { AtkDatatableComponent } from '../atk-datatable/atk-datatable.component';
import { SidebarBashConfigComponent } from '../sidebar-bash-config/sidebar-bash-config.component';

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
    AtkIconComponent,
    AtkBashComponent,
    AtkDatatableComponent,
    SidebarBashConfigComponent
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
  private bashConfigFactory = inject(AtkBashConfigFactory);
  private binanceService = inject(BinanceService);
  private tools = inject(ToolsService);

  // Core state management
  bashConfig = signal<IBashConfig | null>(null);
  terminalState = signal<IBashTerminalState>({
    loading: false,
    connectionStatus: 'disconnected',
    requestParams: {}
  });
  currentEndpoint = signal<string>('');
  currentData = signal<BashData[]>([]);
  accountData = signal<BinanceAccount | null>(null);

  // UI state
  sidebarCollapsed = signal<boolean>(false);
  dataLoading = signal<boolean>(false);
  dataError = signal<string | null>(null);

  // Computed properties
  currentEndpointConfig = computed(() => {
    const config = this.bashConfig();
    const endpointId = this.currentEndpoint();

    if (!config || !endpointId) return null;

    return config.endpoints.find(ep => ep.id === endpointId) || null;
  });

  constructor() {
    // Load account data when component initializes
    effect(() => {
      const endpoint = this.currentEndpoint();
      if (endpoint === 'account') {
        this.loadAccountData();
      }
    });

    // Log state changes for debugging
    effect(() => {
      const config = this.bashConfig();
      const endpoint = this.currentEndpoint();
      const data = this.currentData();

      this.tools.consoleGroup({
        title: `ApiManagement state change`,
        tag: 'check',
        data: {
          hasConfig: !!config,
          endpoint,
          dataCount: data.length
        },
        palette: 'de',
        collapsed: true,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSizePx: 13
      });
    });
  }

  ngOnInit(): void {
    this.loadConfiguration();
  }

  /**
   * Handle bash configuration requests
   */
  onBashConfigRequest(configData: {
    config: IBashConfig | null;
    terminalState: IBashTerminalState;
    currentEndpoint: string
  }): void {
    this.bashConfig.set(configData.config);
    this.terminalState.set(configData.terminalState);

    // Update current endpoint if it changed
    if (configData.currentEndpoint !== this.currentEndpoint()) {
      this.currentEndpoint.set(configData.currentEndpoint);
      this.endpointChanged.emit(configData.currentEndpoint);
    }
  }

  /**
   * Handle data loaded from bash component
   */
  onBashDataLoaded(data: BashData[]): void {
    this.currentData.set(data);
    this.dataLoading.set(false);
    this.dataError.set(null);

    this.tools.consoleGroup({
      title: `ApiManagement data loaded from bash`,
      tag: 'check',
      data: { count: data.length, endpoint: this.currentEndpoint() },
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
    this.dataError.set(error);
    this.dataLoading.set(false);
    this.errorOccurred.emit(error);

    this.tools.consoleGroup({
      title: `ApiManagement bash error`,
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
    // Forward relevant events or handle specific ones
    if (event.type === 'data-loaded') {
      this.onBashDataLoaded(event.payload);
    }
  }

  /**
   * Handle sidebar configuration changes
   */
  onSidebarConfigChange(event: any): void {
    const managementEvent: IApiManagementEvent = {
      type: event.type,
      payload: event.payload,
      timestamp: new Date()
    };

    switch (event.type) {
      case 'endpoint-change':
        this.handleEndpointChange(event.payload.endpointId);
        break;

      case 'parameter-change':
        this.handleParameterChange(event.payload.parameter, event.payload.value);
        break;

      case 'action-execute':
        this.handleSidebarAction(event.payload.actionId);
        break;

      case 'account-refresh':
        this.loadAccountData();
        break;
    }
  }

  /**
   * Handle sidebar toggle
   */
  onSidebarToggle(): void {
    this.sidebarCollapsed.update(collapsed => !collapsed);
  }

  /**
   * Handle data table row clicks
   */
  onDataRowClick(row: BashData): void {
    this.dataRowSelected.emit(row);

    this.tools.consoleGroup({
      title: `ApiManagement row selected`,
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
    const endpoint = this.currentEndpoint();
    if (endpoint) {
      this.loadEndpointData(endpoint);
    }
  }

  /**
   * Handle data export requests
   */
  onDataExport(data: BashData[]): void {
    this.tools.consoleGroup({
      title: `ApiManagement data export requested`,
      tag: 'check',
      data: { count: data.length },
      palette: 'de',
      collapsed: true,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSizePx: 13
    });
  }

  // Private methods

  /**
   * Load configuration from factory
   */
  private async loadConfiguration(): Promise<void> {
    try {
      const configId = this.configId();
      let config: IBashConfig;

      switch (configId) {
        case 'binance-debug-v1':
          config = this.bashConfigFactory.createBinanceAccountConfig();
          break;
        case 'binance-debug-v2':
        default:
          config = this.bashConfigFactory.createBinanceDebugConfig();
          break;
        case 'ibkr-debug-v1':
          config = this.bashConfigFactory.createIbkrConfig();
          break;
      }

      this.bashConfig.set(config);

      // Set default endpoint
      if (config.endpoints.length > 0) {
        const defaultEndpoint = config.defaultEndpoint || config.endpoints[0].id;
        this.currentEndpoint.set(defaultEndpoint);

        if (this.autoLoad()) {
          this.loadEndpointData(defaultEndpoint);
        }
      }

    } catch (error) {
      this.tools.consoleGroup({
        title: `ApiManagement failed to load configuration`,
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
   * Handle endpoint changes from sidebar
   */
  private handleEndpointChange(endpointId: string): void {
    if (endpointId !== this.currentEndpoint()) {
      this.currentEndpoint.set(endpointId);
      this.loadEndpointData(endpointId);
      this.endpointChanged.emit(endpointId);
    }
  }

  /**
   * Handle parameter changes from sidebar
   */
  private handleParameterChange(paramKey: string, value: any): void {
    this.terminalState.update(state => ({
      ...state,
      requestParams: {
        ...state.requestParams,
        [paramKey]: value
      }
    }));

    // Reload data with new parameters
    const endpoint = this.currentEndpoint();
    if (endpoint) {
      this.loadEndpointData(endpoint);
    }
  }

  /**
   * Handle sidebar actions
   */
  private handleSidebarAction(actionId: string): void {
    switch (actionId) {
      case 'refresh-data':
        const endpoint = this.currentEndpoint();
        if (endpoint) {
          this.loadEndpointData(endpoint);
        }
        break;

      case 'clear-data':
        this.currentData.set([]);
        this.dataError.set(null);
        break;

      case 'refresh-account':
        this.loadAccountData();
        break;
    }
  }

  /**
   * Load data for specific endpoint
   */
  private async loadEndpointData(endpointId: string): Promise<void> {
    const config = this.bashConfig();
    if (!config) return;

    const endpoint = config.endpoints.find(ep => ep.id === endpointId);
    if (!endpoint) return;

    this.dataLoading.set(true);
    this.dataError.set(null);

    try {
      const data = await this.loadDataFromEndpoint(endpoint);
      this.currentData.set(data);

      this.terminalState.update(state => ({
        ...state,
        connectionStatus: 'connected',
        responseMetadata: {
          statusCode: 200,
          responseTime: Date.now() % 1000,
          dataCount: data.length
        }
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.dataError.set(errorMessage);

      this.terminalState.update(state => ({
        ...state,
        connectionStatus: 'disconnected',
        error: errorMessage
      }));

    } finally {
      this.dataLoading.set(false);
    }
  }

  /**
   * Load data from endpoint using appropriate service
   */
  private async loadDataFromEndpoint(endpoint: IBashEndpointConfig): Promise<BashData[]> {
    try {
      switch (endpoint.id) {
        case 'account':
          const accountInfo = await firstValueFrom(this.binanceService.getAccount());
          return [{ id: 'account', ...accountInfo }];

        case 'trades':
          const trades = await firstValueFrom(this.binanceService.getMyTrades('BTCUSDT', undefined, undefined, 100));
          return Array.isArray(trades) ? trades.map((trade: any, index: number) => ({
            id: trade.id || index,
            ...trade
          })) : [];

        case 'ticker':
          const ticker = await firstValueFrom(this.binanceService.getTickerPrice('BTCUSDT'));
          return [{ id: 'ticker', ...ticker }];

        case 'orders':
          const orders = await firstValueFrom(this.binanceService.getAllOrders('BTCUSDT', undefined, undefined, 100));
          return Array.isArray(orders) ? orders.map((order: any) => ({
            id: order.orderId || order.id,
            ...order
          })) : [];

        default:
          return [];
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Load account data for sidebar display
   */
  private async loadAccountData(): Promise<void> {
    try {
      const account = await firstValueFrom(this.binanceService.getAccount());
      this.accountData.set(account);

      this.tools.consoleGroup({
        title: `ApiManagement account data loaded`,
        tag: 'check',
        data: { accountType: account.accountType },
        palette: 'su',
        collapsed: true,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSizePx: 13
      });

    } catch (error) {
      this.tools.consoleGroup({
        title: `ApiManagement failed to load account data`,
        tag: 'cross',
        data: error,
        palette: 'er',
        collapsed: true,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSizePx: 13
      });
    }
  }
}
