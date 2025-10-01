// src/app/features/binance/components/binance-api-management/binance-api-management.component.ts
// NEW SYSTEM - Wrapper component using unified AtkApiManagement with Binance specifics

import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, OnInit, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BinanceService } from '@features/binance/services/binance.service';
import { AtkApiManagementComponent } from '@shared/components/atk-api-management/atk-api-management.component';
import { BashData } from '@shared/components/atk-bash/atk-bash.interfaces';
import { AtkIconComponent } from '@shared/components/atk-icon/atk-icon.component';
import { ApiManagementStateService } from '@shared/services/atk-api-management-state.service';
import { ToolsService } from '@shared/services/tools.service';

/**
 * Binance-specific wrapper for AtkApiManagement
 * Provides Binance-specific configuration and sidebar integration
 */
@Component({
  selector: 'atk-binance-api-management',
  standalone: true,
  imports: [
    CommonModule,
    AtkIconComponent,
    AtkApiManagementComponent
  ],
  templateUrl: './binance-api-management.component.html',
  styleUrls: ['./binance-api-management.component.css']
})
export class BinanceApiManagementComponent implements OnInit {

  // =========================================
  // INPUTS & OUTPUTS
  // =========================================

  configId = input<string>('binance-debug-v2');
  autoLoad = input<boolean>(true);
  showSidebar = input<boolean>(true);
  debugMode = input<boolean>(false);
  title = input<string>('Binance API Management');

  // Outputs
  balanceSelected = output<BashData>();
  endpointChanged = output<string>();
  errorOccurred = output<string>();

  // =========================================
  // SERVICES
  // =========================================

  private binanceService = inject(BinanceService);
  private apiStateService = inject(ApiManagementStateService);
  private tools = inject(ToolsService);

  // =========================================
  // COMPONENT STATE
  // =========================================

  protected debugExpanded = signal<boolean>(false);

  // =========================================
  // COMPUTED SIGNALS
  // =========================================

  public readonly loading = computed(() => this.apiStateService.loading());
  public readonly error = computed(() => this.apiStateService.error());
  public readonly hasData = computed(() => this.apiStateService.hasData());
  public readonly summary = computed(() => this.apiStateService.summary());

  public readonly connectionStatusClass = computed(() => {
    if (this.loading()) return 'loading';
    if (this.error()) return 'error';
    if (this.hasData()) return 'connected';
    return 'disconnected';
  });

  public readonly connectionStatusIcon = computed(() => {
    if (this.loading()) return 'loader';
    if (this.error()) return 'alert-circle';
    if (this.hasData()) return 'check-circle';
    return 'circle';
  });

  public readonly connectionStatusText = computed(() => {
    if (this.loading()) return 'Loading...';
    if (this.error()) return 'Error';
    if (this.hasData()) return 'Connected';
    return 'Disconnected';
  });

  // =========================================
  // CONSTRUCTOR & LIFECYCLE
  // =========================================

  constructor() {
    // Subscribe to API state events
    this.apiStateService.events$
      .pipe(takeUntilDestroyed())
      .subscribe(event => {
        // OFF: atk-binance-api-management.101 ================ CONSOLE LOG IN PROGRESS
        // this.tools.consoleGroup({
        //   title: `atk-binance-api-management received event: ${event.type}`,
        //   tag: 'check',
        //   data: event.payload,
        //   palette: 'de',
        //   collapsed: true,
        //   fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        //   fontSizePx: 13
        // });
      });

    // Effect to initialize config
    effect(() => {
      const configId = this.configId();
      this.apiStateService.setConfigId(configId);
    });
  }

  ngOnInit(): void {
    // OFF: atk-binance-api-management.121 ================ CONSOLE LOG IN PROGRESS
    // this.tools.consoleGroup({
    //   title: `atk-binance-api-management initialized with config: ${this.configId()}`,
    //   tag: 'check',
    //   data: {
    //     configId: this.configId(),
    //     autoLoad: this.autoLoad(),
    //     showSidebar: this.showSidebar(),
    //     debugMode: this.debugMode()
    //   },
    //   palette: 'su',
    //   collapsed: true,
    //   fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    //   fontSizePx: 13
    // });
  }

  // =========================================
  // EVENT HANDLERS
  // =========================================

  onDataRowSelected(row: BashData): void {
    this.balanceSelected.emit(row);

    this.tools.consoleGroup({
      title: `BinanceApiManagement balance selected`,
      tag: 'check',
      data: { asset: row.asset, total: row.total },
      palette: 'de',
      collapsed: true,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSizePx: 13
    });
  }

  onEndpointChanged(endpoint: string): void {
    this.endpointChanged.emit(endpoint);

    this.tools.consoleGroup({
      title: `BinanceApiManagement endpoint changed`,
      tag: 'check',
      data: { endpoint },
      palette: 'de',
      collapsed: true,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSizePx: 13
    });
  }

  onErrorOccurred(error: string): void {
    this.errorOccurred.emit(error);

    this.tools.consoleGroup({
      title: `BinanceApiManagement error occurred`,
      tag: 'cross',
      data: error,
      palette: 'er',
      collapsed: true,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSizePx: 13
    });
  }

  // =========================================
  // UI METHODS
  // =========================================

  toggleDebugExpanded(): void {
    this.debugExpanded.update(expanded => !expanded);
  }

  formatLastUpdate(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString('fr-FR');
  }

  getDebugInfo(): string {
    const debugData = {
      configId: this.configId(),
      autoLoad: this.autoLoad(),
      showSidebar: this.showSidebar(),
      apiState: this.apiStateService.summary(),
      connectionStatus: {
        class: this.connectionStatusClass(),
        icon: this.connectionStatusIcon(),
        text: this.connectionStatusText()
      },
      timestamp: new Date().toISOString()
    };

    return JSON.stringify(debugData, null, 2);
  }
}
