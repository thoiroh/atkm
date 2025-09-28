// src/app/features/binance/components/binance-api-management/binance-api-management.component.ts
// NEW SYSTEM - Wrapper component using unified AtkApiManagement with Binance specifics

import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, OnInit, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BinanceService } from '@features/binance/services/binance.service';
import { AtkIconComponent } from '@shared/components/atk-icon/atk-icon.component';
import { ToolsService } from '@shared/components/atk-tools/tools.service';
import { ApiManagementStateService } from '@shared/services/atk-api-management-state.service';
import { AtkApiManagementComponent } from '@shared/components/atk-api-management/atk-api-management.component';
import { SidebarBashConfigComponent } from '@shared/components/sidebar-bash-config/sidebar-bash-config.component';
import { BashData } from '@shared/components/atk-bash/atk-bash.interfaces';

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
    AtkApiManagementComponent,
    SidebarBashConfigComponent
  ],
  template: `
    <div class="binance-api-management">

      <!-- Header Section -->
      <div class="binance-header">
        <div class="header-title">
          <atk-icon name="trending-up" [size]="24" color="var(--color-accent-fg)" />
          <h1>{{ title() }}</h1>
        </div>
        <div class="header-meta">
          <div class="connection-status" [ngClass]="connectionStatusClass()">
            <atk-icon [name]="connectionStatusIcon()" [size]="16" />
            <span>{{ connectionStatusText() }}</span>
          </div>
          @if (summary(); as summaryData) {
            <div class="data-summary">
              <span class="summary-item">
                <atk-icon name="database" [size]="14" color="var(--color-fg-muted)" />
                {{ summaryData.tableRows }} items
              </span>
              @if (summaryData.lastUpdate) {
                <span class="summary-item">
                  <atk-icon name="clock" [size]="14" color="var(--color-fg-muted)" />
                  {{ formatLastUpdate(summaryData.lastUpdate) }}
                </span>
              }
            </div>
          }
        </div>
      </div>

      <!-- Main Content Layout -->
      <div class="binance-layout">

        <!-- Sidebar Configuration Panel -->
        @if (showSidebar()) {
          <div class="binance-sidebar">
            <atk-sidebar-bash-config
              [configId]="configId()"
              [showDebugInfo]="debugMode()"
              />
          </div>
        }

        <!-- Main API Management Component -->
        <div class="binance-main" [class.full-width]="!showSidebar()">
          <atk-api-management
            [configId]="configId()"
            [autoLoad]="autoLoad()"
            (dataRowSelected)="onDataRowSelected($event)"
            (endpointChanged)="onEndpointChanged($event)"
            (errorOccurred)="onErrorOccurred($event)"
            />
        </div>

      </div>

      <!-- Debug Panel (Development Only) -->
      @if (debugMode()) {
        <div class="debug-panel">
          <div class="debug-header">
            <atk-icon name="bug" [size]="16" color="var(--color-warning)" />
            <span>Debug Information</span>
            <button class="debug-toggle" (click)="toggleDebugExpanded()">
              <atk-icon [name]="debugExpanded() ? 'chevron-up' : 'chevron-down'" [size]="14" />
            </button>
          </div>
          @if (debugExpanded()) {
            <div class="debug-content">
              <pre>{{ getDebugInfo() }}</pre>
            </div>
          }
        </div>
      }

    </div>
  `,
  styles: [`
    .binance-api-management {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--color-canvas-default);
      color: var(--color-fg-default);
    }

    /* Header */
    .binance-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--color-border-default);
      background: var(--color-canvas-subtle);
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .header-title h1 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-fg-default);
    }

    .header-meta {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    /* Connection Status */
    .connection-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.375rem 0.75rem;
      border-radius: 16px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .connection-status.connected {
      background: rgba(35, 134, 54, 0.1);
      color: var(--color-success-emphasis);
    }

    .connection-status.loading {
      background: rgba(31, 111, 235, 0.1);
      color: var(--color-accent-fg);
    }

    .connection-status.error {
      background: rgba(248, 81, 73, 0.1);
      color: #f85149;
    }

    .connection-status.disconnected {
      background: rgba(101, 109, 118, 0.1);
      color: var(--color-fg-muted);
    }

    /* Data Summary */
    .data-summary {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .summary-item {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      color: var(--color-fg-muted);
    }

    /* Main Layout */
    .binance-layout {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .binance-sidebar {
      width: 320px;
      min-width: 280px;
      max-width: 400px;
      border-right: 1px solid var(--color-border-default);
      background: var(--color-canvas-subtle);
      overflow-y: auto;
    }

    .binance-main {
      flex: 1;
      overflow: hidden;
    }

    .binance-main.full-width {
      width: 100%;
    }

    /* Debug Panel */
    .debug-panel {
      border-top: 2px solid var(--color-warning);
      background: var(--color-canvas-subtle);
    }

    .debug-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--color-border-muted);
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-warning);
    }

    .debug-toggle {
      margin-left: auto;
      background: none;
      border: none;
      color: inherit;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 4px;
    }

    .debug-toggle:hover {
      background: var(--color-btn-hover-bg);
    }

    .debug-content {
      padding: 1rem;
      max-height: 300px;
      overflow-y: auto;
    }

    .debug-content pre {
      font-family: var(--fontStack-monospace);
      font-size: 0.75rem;
      color: var(--color-fg-muted);
      background: var(--color-canvas-default);
      padding: 1rem;
      border-radius: 6px;
      margin: 0;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    /* Responsive Design */
    @media (max-width: 1024px) {
      .binance-sidebar {
        width: 280px;
        min-width: 280px;
      }
    }

    @media (max-width: 768px) {
      .binance-header {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
        padding: 1rem;
      }

      .header-meta {
        justify-content: space-between;
      }

      .binance-layout {
        flex-direction: column;
      }

      .binance-sidebar {
        width: 100%;
        max-height: 300px;
        border-right: none;
        border-bottom: 1px solid var(--color-border-default);
      }
    }
  `]
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

  private debugExpanded = signal<boolean>(false);

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
        this.tools.consoleGroup({
          title: `BinanceApiManagement received event: ${event.type}`,
          tag: 'check',
          data: event.payload,
          palette: 'de',
          collapsed: true,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSizePx: 13
        });
      });

    // Effect to initialize config
    effect(() => {
      const configId = this.configId();
      this.apiStateService.setConfigId(configId);
    });
  }

  ngOnInit(): void {
    this.tools.consoleGroup({
      title: `BinanceApiManagement initialized with config: ${this.configId()}`,
      tag: 'check',
      data: {
        configId: this.configId(),
        autoLoad: this.autoLoad(),
        showSidebar: this.showSidebar(),
        debugMode: this.debugMode()
      },
      palette: 'su',
      collapsed: true,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSizePx: 13
    });
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
