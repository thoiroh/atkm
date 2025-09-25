// src/app/shared/components/atk-api-management/atk-api-management.component.ts
// Refactored component without sidebar, using ApiManagementStateService

import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, OnInit, output } from '@angular/core';
import { BinanceService } from '@features/binance/services/binance.service';
import { AtkIconComponent } from '@shared/components/atk-icon/atk-icon.component';
import { ToolsService } from '@shared/components/atk-tools/tools.service';
import { ApiManagementStateService } from '@shared/services/atk-api-management-state.service';
import { firstValueFrom } from 'rxjs';
import { AtkBashComponent } from '../atk-bash/atk-bash.component';
import { BashData, IBashConfig, IBashEndpointConfig, IBashEvent, IBashTerminalState } from '../atk-bash/atk-bash.interfaces';
import { AtkDatatableComponent } from '../atk-datatable/atk-datatable.component';
import { AtkApiManagementConfigFactory } from './atk-api-management-config.factory';

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
    AtkDatatableComponent
  ],
  template: `
    <div class="api-management-wrapper">
      <!-- Main Content Area -->
      <div class="api-content-area">

        <!-- Terminal Section -->
        <div class="terminal-section">
          <div class="terminal-content">
            <atk-icon class="terminal-toggle" name="triangle-right" color="var(--color-btn-bg-default)" />
            <atk-bash
              [configId]="configId()"
              [autoLoad]="autoLoad()"
              (configRequest)="onBashConfigRequest($event)"
              (dataLoaded)="onBashDataLoaded($event)"
              (errorOccurred)="onBashError($event)"
              (eventEmitted)="onBashEvent($event)" />
          </div>
        </div>

        <!-- Data Display Section -->
        <div class="data-section">
          <atk-datatable
            [data]="stateService.currentData()"
            [currentEndpoint]="stateService.currentEndpointConfig()"
            [loading]="stateService.dataLoading()"
            [error]="stateService.dataError()"
            [searchEnabled]="true"
            [itemsPerPage]="50"
            [rowClickable]="true"
            (rowClick)="onDataRowClick($event)"
            (retryLoad)="onRetryDataLoad()"
            (exportRequest)="onDataExport($event)" />
        </div>

      </div>
    </div>
  `,
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
  private configFactory = inject(AtkApiManagementConfigFactory);
  private binanceService = inject(BinanceService);
  private tools = inject(ToolsService);

  // NEW: State service injection
  public stateService = inject(ApiManagementStateService);

  constructor() {
    // Subscribe to state service events to handle sidebar actions
    this.stateService.events$.subscribe(event => {
      this.handleStateServiceEvent(event);
    });

    // Subscribe to state service commands for terminal actions
    this.stateService.commands$.subscribe(command => {
      this.handleStateServiceCommand(command);
    });

    // Log state changes for debugging
    effect(() => {
      const config = this.stateService.currentConfig();
      const endpoint = this.stateService.currentEndpoint();
      const data = this.stateService.currentData();

      this.tools.consoleGroup({
        title: `ApiManagement state change`,
        tag: 'check',
        data: {
          hasConfig: !!config,
          endpoint,
          dataCount: data.length,
          loading: this.stateService.dataLoading(),
          error: this.stateService.dataError()
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
    // Update state service with bash configuration
    if (configData.config) {
      this.stateService.setConfiguration(configData.config);
    }

    this.stateService.updateTerminalState(configData.terminalState);

    if (configData.currentEndpoint !== this.stateService.currentEndpoint()) {
      this.stateService.setCurrentEndpoint(configData.currentEndpoint);
      this.endpointChanged.emit(configData.currentEndpoint);
    }
  }

  /**
   * Handle data loaded from bash component
   */
  onBashDataLoaded(data: BashData[]): void {
    this.stateService.setCurrentData(data);

    this.tools.consoleGroup({
      title: `ApiManagement data loaded from bash`,
      tag: 'check',
      data: { count: data.length, endpoint: this.stateService.currentEndpoint() },
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
    this.stateService.setDataError(error);
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
    // Forward relevant events to state service
    if (event.type === 'data-loaded') {
      this.onBashDataLoaded(event.payload);
    }
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
    const endpoint = this.stateService.currentEndpoint();
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
          config = this.configFactory.createBinanceAccountConfig();
          break;
        case 'binance-debug-v2':
        default:
          config = this.configFactory.createBinanceDebugConfig();
          break;
        case 'ibkr-debug-v1':
          config = this.configFactory.createIbkrConfig();
          break;
      }

      // Set configuration in state service
      this.stateService.setConfiguration(config);

      // Auto-load data if enabled
      if (this.autoLoad() && config.endpoints.length > 0) {
        const defaultEndpoint = config.defaultEndpoint || config.endpoints[0].id;
        this.loadEndpointData(defaultEndpoint);
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
   * Handle events from state service (from sidebar)
   */
  private handleStateServiceEvent(event: any): void {
    switch (event.type) {
      case 'endpoint-change':
        this.loadEndpointData(event.payload.endpointId);
        break;

      case 'parameter-change':
        // Reload data with new parameters
        const endpoint = this.stateService.currentEndpoint();
        if (endpoint) {
          this.loadEndpointData(endpoint);
        }
        break;

      case 'action-execute':
        this.handleSidebarAction(event.payload.actionId);
        break;
    }
  }

  /**
   * Handle commands from state service (terminal commands)
   */
  private handleStateServiceCommand(command: any): void {
    if (command.type === 'action-execute') {
      const { command: cmd, args } = command.payload;
      this.executeTerminalCommand(cmd, args);
    }
  }

  /**
   * Handle sidebar actions via state service
   */
  private handleSidebarAction(actionId: string): void {
    switch (actionId) {
      case 'refresh-data':
        const endpoint = this.stateService.currentEndpoint();
        if (endpoint) {
          this.loadEndpointData(endpoint);
        }
        break;

      case 'clear-data':
        this.stateService.clearData();
        break;

      case 'refresh-account':
        this.loadAccountData();
        break;

      case 'test-connection':
        this.testConnection();
        break;

      case 'export-data':
        const data = this.stateService.currentData();
        this.onDataExport(data);
        break;
    }
  }

  /**
   * Execute terminal commands
   */
  private executeTerminalCommand(cmd: string, args: string[] = []): void {
    switch (cmd) {
      case 'refresh':
        const endpoint = this.stateService.currentEndpoint();
        if (endpoint) {
          this.loadEndpointData(endpoint);
        }
        break;

      case 'clear':
        this.stateService.clearData();
        break;

      case 'export':
        const data = this.stateService.currentData();
        this.onDataExport(data);
        break;
    }
  }

  /**
   * Load data for specific endpoint
   */
  private async loadEndpointData(endpointId: string): Promise<void> {
    const config = this.stateService.currentConfig();
    if (!config) return;

    const endpoint = config.endpoints.find(ep => ep.id === endpointId);
    if (!endpoint) return;

    this.stateService.setLoading(true);
    this.stateService.setConnectionStatus('connecting');

    try {
      const data = await this.loadDataFromEndpoint(endpoint);
      this.stateService.setCurrentData(data);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.stateService.setDataError(errorMessage);

    } finally {
      this.stateService.setLoading(false);
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
          // Also update account data in state service
          this.stateService.setAccountData(accountInfo);
          return [{ id: 'account', ...accountInfo }];

        case 'trades':
          const params = this.stateService.terminalState().requestParams || {};
          const symbol = params.symbol || 'BTCUSDT';
          const trades = await firstValueFrom(
            this.binanceService.getMyTrades(symbol, undefined, undefined, 100)
          );
          return Array.isArray(trades) ? trades.map((trade: any, index: number) => ({
            id: trade.id || index,
            ...trade
          })) : [];

        case 'ticker':
          const tickerParams = this.stateService.terminalState().requestParams || {};
          const tickerSymbol = tickerParams.symbol || 'BTCUSDT';
          const ticker = await firstValueFrom(this.binanceService.getTickerPrice(tickerSymbol));
          return [{ id: 'ticker', ...ticker }];

        case 'orders':
          const orderParams = this.stateService.terminalState().requestParams || {};
          const orderSymbol = orderParams.symbol || 'BTCUSDT';
          const orders = await firstValueFrom(
            this.binanceService.getAllOrders(orderSymbol, undefined, undefined, 100)
          );
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
   * Load account data for state service
   */
  private async loadAccountData(): Promise<void> {
    try {
      const account = await firstValueFrom(this.binanceService.getAccount());
      this.stateService.setAccountData(account);

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

  /**
   * Test connection to current endpoint
   */
  private async testConnection(): Promise<void> {
    const endpoint = this.stateService.currentEndpoint();
    if (!endpoint) return;

    this.stateService.setConnectionStatus('connecting');

    try {
      await this.loadEndpointData(endpoint);
      // Success state is set in loadEndpointData
    } catch (error) {
      this.stateService.setConnectionStatus('disconnected');
    }
  }
}
