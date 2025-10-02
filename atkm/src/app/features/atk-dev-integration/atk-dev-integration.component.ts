// src/app/features/binance/pages/binance-dashboard/binance-dashboard.component.ts
// COMPLETE EXAMPLE - Using the new unified system

import { CommonModule } from '@angular/common';
import { Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AtkApiManagementComponent } from '@shared/components/atk-api-management/atk-api-management.component';
import { BashData } from '@shared/components/atk-bash/atk-bash.interfaces';
import { AtkIconComponent } from '@shared/components/atk-icon/atk-icon.component';
import { ApiManagementStateService } from '@shared/services/atk-api-management-state.service';
import { ToolsService } from '@shared/services/tools.service';
import { ILandingConfig } from '../../core/services/config.service';

@Component({
  selector: 'atk-dev-integration',
  standalone: true,
  imports: [
    CommonModule,
    AtkIconComponent,
    AtkApiManagementComponent
  ],
  templateUrl: './atk-dev-integration.component.html',
  // styleUrls: ['./atk-dev-integration.component.css']
})
export class AtkDevIntegrationComponent implements OnInit {

  // =========================================
  // INPUTS
  // =========================================

  @Input() title: string = 'atk dashboard';
  @Input() configPanelCollapsed: boolean = false;
  config: ILandingConfig | null = null;
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  // =========================================
  // SERVICES
  // =========================================

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tools = inject(ToolsService);
  public apiState = inject(ApiManagementStateService);

  // =========================================
  // COMPONENT STATE
  // =========================================

  public selectedBalance = signal<BashData | null>(null);
  public alertMessage = signal<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
  public showSidebar = signal<boolean>(true);
  public debugMode = signal<boolean>(false);
  public autoRefresh = signal<boolean>(false);
  public showSettings = signal<boolean>(false);

  // =========================================
  // COMPUTED SIGNALS
  // =========================================

  public readonly accountSummary = computed(() => {
    const summary = this.apiState.summary();
    const tableData = this.apiState.tableData();
    const lastUpdate = this.apiState.lastUpdated();
    return {
      totalAssets: tableData.length,
      activeBalances: tableData.filter(item => (item.total || 0) > 0).length,
      lastUpdateText: lastUpdate ? this.formatRelativeTime(lastUpdate) : 'Never',
      hasData: summary.hasData
    };
  });

  // =========================================
  // CONSTRUCTOR & LIFECYCLE
  // =========================================

  constructor() {
    // Subscribe to API state events for notifications
    // this.apiState.events$
    //   .pipe(takeUntilDestroyed())
    //   .subscribe(event => {
    //     this.handleApiStateEvent(event);
    //   });

    // Auto-dismiss alerts after 5 seconds
    // setInterval(() => {
    //   if (this.alertMessage()) {
    //     this.dismissAlert();
    //   }
    // }, 5000);
  }

  ngOnInit(): void {
    // Parse route parameters if any
    // this.route.queryParams
    //   .pipe(takeUntilDestroyed())
    //   .subscribe(params => {
    //     if (params['sidebar'] === 'false') {
    //       this.showSidebar.set(false);
    //     }
    //     if (params['debug'] === 'true') {
    //       this.debugMode.set(true);
    //     }
    //   });

    this.tools.consoleGroup({ // TAG AtkDevIntegrationComponent 101 ngOnInit()
      title: `AtkDevIntegrationComponent initialized`, tag: 'check', palette: 'su',
      data: {
        showSidebar: this.showSidebar(),
        debugMode: this.debugMode(),
        autoRefresh: this.autoRefresh()
      },
    });
  }

  // =========================================
  // EVENT HANDLERS
  // =========================================

  onBalanceSelected(balance: BashData): void {
    this.selectedBalance.set(balance);

    this.tools.consoleGroup({
      title: `BinanceDashboard balance selected`,
      tag: 'check',
      data: { asset: balance.asset, total: balance.total },
      palette: 'de',
      collapsed: true,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSizePx: 13
    });
  }

  onEndpointChanged(endpoint: string): void {
    this.showAlert('success', `Switched to ${endpoint} endpoint`);

    this.tools.consoleGroup({
      title: `BinanceDashboard endpoint changed`,
      tag: 'check',
      data: { endpoint },
      palette: 'de',
      collapsed: true,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSizePx: 13
    });
  }

  onErrorOccurred(error: string): void {
    this.showAlert('error', `Error: ${error}`);

    this.tools.consoleGroup({
      title: `BinanceDashboard error occurred`,
      tag: 'cross',
      data: error,
      palette: 'er',
      collapsed: true,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSizePx: 13
    });
  }

  // =========================================
  // UI ACTIONS
  // =========================================

  refreshData(): void {
    const currentEndpoint = this.apiState.currentEndpoint();
    if (currentEndpoint) {
      this.apiState.sendCommand({
        type: 'REFRESH_DATA',
        payload: { endpoint: currentEndpoint }
      });
      this.showAlert('success', 'Data refresh initiated');
    }
  }

  exportData(): void {
    const tableData = this.apiState.tableData();
    if (tableData.length === 0) {
      this.showAlert('warning', 'No data to export');
      return;
    }

    // Create CSV content
    const headers = ['Asset', 'Available', 'Locked', 'Total'];
    const csvContent = [
      headers.join(','),
      ...tableData.map(row => [
        row.asset,
        row.free || 0,
        row.locked || 0,
        row.total || 0
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `binance-balances-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    this.showAlert('success', 'Data exported successfully');
  }

  closeBalanceDetails(): void {
    this.selectedBalance.set(null);
  }

  tradeAsset(asset: string): void {
    // Navigate to trading interface (example)
    this.router.navigate(['/dashboard/binance/trade'], {
      queryParams: { symbol: `${asset}USDT` }
    });
  }

  viewAssetHistory(asset: string): void {
    // Navigate to asset history (example)
    this.router.navigate(['/dashboard/binance/history'], {
      queryParams: { asset }
    });
  }

  toggleSettings(): void {
    this.showSettings.update(show => !show);
  }

  toggleSidebar(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.showSidebar.set(target.checked);

    // Update URL parameters
    this.updateRouteParams();
  }

  toggleDebugMode(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.debugMode.set(target.checked);

    // Update URL parameters
    this.updateRouteParams();
  }

  toggleAutoRefresh(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.autoRefresh.set(target.checked);

    if (target.checked) {
      this.startAutoRefresh();
      this.showAlert('success', 'Auto refresh enabled (30s interval)');
    } else {
      this.stopAutoRefresh();
      this.showAlert('success', 'Auto refresh disabled');
    }
  }

  dismissAlert(): void {
    this.alertMessage.set(null);
  }

  // =========================================
  // UTILITY METHODS
  // =========================================

  formatBalance(value: number | string, asset: string): string {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (!numValue || isNaN(numValue)) return 'N/A';

    // Use the same logic as the crypto formatters
    if (numValue === 0) return '0';
    if (numValue < 0.00001) return numValue.toExponential(2);
    if (numValue < 1) return numValue.toFixed(8);

    return numValue.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    });
  }

  formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString('fr-FR');
  }

  getAlertIcon(type: string): string {
    switch (type) {
      case 'success': return 'check-circle';
      case 'error': return 'alert-circle';
      case 'warning': return 'alert-triangle';
      default: return 'info';
    }
  }

  // =========================================
  // PRIVATE METHODS
  // =========================================

  private showAlert(type: 'success' | 'error' | 'warning', message: string): void {
    this.alertMessage.set({ type, message });
  }

  private handleApiStateEvent(event: any): void {
    switch (event.type) {
      case 'data-loaded':
        this.showAlert('success', `Data loaded: ${event.payload.tableCount} items`);
        break;
      case 'error':
        this.showAlert('error', event.payload.error);
        break;
      case 'endpoint-changed':
        // Handle endpoint change if needed
        break;
    }
  }

  private updateRouteParams(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        sidebar: this.showSidebar() ? undefined : 'false',
        debug: this.debugMode() ? 'true' : undefined
      },
      queryParamsHandling: 'merge'
    });
  }

  private autoRefreshInterval: any;

  private startAutoRefresh(): void {
    this.stopAutoRefresh(); // Clear any existing interval

    this.autoRefreshInterval = setInterval(() => {
      if (this.apiState.hasData() && !this.apiState.loading()) {
        this.refreshData();
      }
    }, 30000); // 30 seconds
  }

  private stopAutoRefresh(): void {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
    }
  }

  // Cleanup on destroy
  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }
}
