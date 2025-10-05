import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

import { BinanceAccount, BinanceBalance } from '@features/binance/models/binance.model';
import { AtkBashComponent } from '@shared/components/atk-bash/atk-bash.component';
import { IBashConfig } from '@shared/components/atk-bash/atk-bash.interfaces';
import { SidebarConfigComponent } from '@shared/components/sidebar-config/sidebar-config.component';
import { AtkIconComponent } from '../atk-icon/atk-icon.component';

import { BreadcrumbService } from '@core/services/breadcrumb.service';
import { ConfigService, ILandingConfig } from '@core/services/config.service';
import { NavigationStateService } from '@core/services/navigation-state.service';
import { BinanceService } from '@features/binance/services/binance.service';
import { ToolsService } from '@shared/services/tools.service';

@Component({
  selector: 'atk-home-content',
  standalone: true,
  imports: [CommonModule, AtkIconComponent, AtkBashComponent, SidebarConfigComponent],
  templateUrl: './home-content.component.html',
  styles: []
})
export class HomeContentComponent implements OnInit {

  @Input() configPanelCollapsed: boolean = false;
  @Input() config: ILandingConfig | null = null;

  // config: ILandingConfig | null = null;
  account = signal<BinanceAccount | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  // bashConfig = signal<IBashConfig | null>(null);
  // bashTerminalState = signal<IBashTerminalState | null>(null);
  // bashCurrentEndpoint = signal<string>('');
  // bashConfigPanelCollapsed = signal<boolean>(false);

  private destroy$ = new Subject<void>();
  private binanceService = inject(BinanceService);
  private configService = inject(ConfigService);
  private navigationService = inject(NavigationStateService);
  private breadcrumbService = inject(BreadcrumbService);
  private tools = inject(ToolsService);

  // =========================================
  // CONSTRUCTOR & LIFECYCLE
  // =========================================

  constructor() { }

  ngOnInit(): void {
    // this.configService.loadLandingConfig().subscribe({
    //   next: (config) => {
    //     this.config = config;
    //     // Initialize bash config panel as collapsed
    //     // this.bashConfigPanelCollapsed.set(true);
    //   },
    //   error: (error) => {
    //     console.error('Erreur lors du chargement de la configuration:', error);
    //   }
    // });
    this.config = this.configService.getConfig();

    this.tools.consoleGroup({ // TAG HomeContentComponent -> ngOnInit()
      title: `HomeContentComponent initialized`, tag: 'check', palette: 'in', collapsed: true,
      data: {
        config: this.config
      },
    });
  }

  /**
 * Handle config panel toggle
 */
  toggleConfigPanel(): void {
    if (this.config) {
      this.config.configPanel.isCollapsed = !this.config.configPanel.isCollapsed;
    }
  }

  /**
 * Handle bash config panel toggle
 */
  toggleBashConfigPanel(): void {
    // this.bashConfigPanelCollapsed.update(collapsed => !collapsed);
  }

  /**
   * Handle bash configuration requests from AtkBashComponent
   * Event handler with correct signature
   */
  onBashConfigRequest(config: IBashConfig): void {
    console.log('Bash config requested in home content:', config);
  }

  /**
   * Handle configuration changes from SidebarBashConfigComponent
   */
  onBashConfigChange(event: any): void {
    // Forward the configuration change to the AtkBashComponent
    // This will be handled by the component reference or service communication
    console.log('Bash config change received:', event);

    // Here you could emit events to child components or use a service
    // For now, we'll just log the event
  }

  /**
   * Handle bash data loaded events
   */
  onBashDataLoaded(data: any[]): void {
    this.tools.consoleGroup({ // TAG HomeContentComponent -> onBashDataLoaded()
      title: `HomeContentComponent -> onBashDataLoaded() -> bash data loaded: ${data.length} records`, tag: 'check', palette: 'in', collapsed: true,
      data: {
        data: data
      },
    });
  }

  /**
   * Handle bash error events
   */
  onBashError(error: string): void {
    console.error('Bash error occurred:', error);
  }

  /**
   * Load Binance account information
   */
  loadAccountInfo(): void {
    this.loading.set(true);
    this.error.set(null);

    this.binanceService.getAccount()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (account) => {
          if (account.balances && account.balances.length > 0) {
          }
          this.account.set(account);
          this.loading.set(false);
        },
        error: (error) => {
          // TAG HomeContentComponent -> loadAccountInfo() ================ CONSOLE LOG IN PROGRESS
          this.tools.consoleGroup({
            title: `AccountInfoComponent.187: binanceService.getAccount() AccountInfo: Error loading account:`,
            tag: 'cross',
            data: error,
            palette: 'er',
            collapsed: true,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSizePx: 13
          });
          this.error.set(error.message);
          this.loading.set(false);
        }
      });
  }

  /**
   * Refresh account data
   */
  refreshAccount(): void {
    this.loadAccountInfo();
  }

  /**
   * Format balance number with appropriate decimals
   */
  formatBalance(value: number | string): string {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (numValue === 0 || isNaN(numValue)) return '0';
    if (numValue < 0.00001) return numValue.toExponential(2);
    if (numValue < 1) return numValue.toFixed(8);

    return numValue.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    });
  }

  /**
   * Format update time
   */
  formatUpdateTime(timestamp: number | null | undefined): string {
    if (!timestamp) return 'Non disponible';
    return new Date(timestamp).toLocaleString('fr-FR');
  }

  /**
   * Get CSS class for permission status
   */
  getPermissionClass(permission: string): string {
    const permissionClasses: { [key: string]: string } = {
      'SPOT': 'permission-spot',
      'MARGIN': 'permission-margin',
      'FUTURES': 'permission-futures'
    };
    return permissionClasses[permission] || 'permission-default';
  }

  /**
   * TrackBy function for balance list optimization
   */
  trackByAsset(index: number, balance: BinanceBalance): string {
    return balance.asset;
  }
}
