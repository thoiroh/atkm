import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

import { ConfigStore } from '@core/store/config.store';
import { AtkIconComponent } from '@shared/components/atk-icon/atk-icon.component';
import { ToolsService } from '@shared/services/tools.service';

import { AtkApiBashComponent } from '@shared/components/atk-api/atk-api-bash/atk-api-bash.component';
import { SidebarBashConfigComponent } from '@shared/components/atk-api/atk-api-sidebar-config/atk-api-sidebar-config.component';

import { IBashConfig } from '@shared/components/atk-api/atk-api-bash/atk-api-bash.interfaces';
import { AtkApiBashService } from '@shared/components/atk-api/atk-api-bash/atk-api-bash.service';
import { AtkApiSidebarConfigService } from '@shared/components/atk-api/atk-api-sidebar-config/atk-api-sidebar-config.service';

import { BinanceAccount, BinanceBalance } from '@features/binance/models/binance.model';
import { BinanceService } from '@features/binance/services/binance.service';

@Component({
  selector: 'atk-api',
  standalone: true,
  imports: [
    CommonModule,
    AtkIconComponent,
    AtkApiBashComponent,
    SidebarBashConfigComponent
  ],
  templateUrl: './atk-api.component.html',
  styles: []
})
export class AtkApiComponent implements OnInit {

  // =========================================
  // DEPENDENCIES & COMPUTED SIGNALS
  // =========================================

  private readonly configStore = inject(ConfigStore);
  private readonly bashService = inject(AtkApiBashService); // NEW
  private readonly binanceService = inject(BinanceService);
  private readonly sidebarConfigService = inject(AtkApiSidebarConfigService);
  private readonly tools = inject(ToolsService);

  config = this.configStore.config;
  sidebar = this.configStore.sidebar;
  configPanelCollapsed = this.configStore.configPanelCollapsed;
  bashConfig = computed(() => this.bashService.getConfig('atkpi-debug-v1'));


  // =========================================
  // LOCAL STATE
  // =========================================

  account = signal<BinanceAccount | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  private destroy$ = new Subject<void>();

  // ======================================================
  // CONSTRUCTOR
  // ======================================================

  constructor() {
    effect(() => {
      const events = this.sidebarConfigService.events();
      const latestEvent = events.at(-1);

      if (latestEvent?.type === 'request-sidebar-open') {
        // Open sidebar if it's collapsed
        if (this.configPanelCollapsed()) {
          this.toggleConfigPanel();
        }
      }
    });
  }

  // =========================================
  // LIFECYCLE
  // =========================================

  ngOnInit(): void {
    // this.tools.consoleGroup({ // OFF AtkApiComponent -> ngOnInit() ================ CONSOLE LOG IN PROGRESS
    //   title: `AtkApiComponent -> ngOnInit()`, tag: 'check', palette: 'in', collapsed: false,
    //   data: this.config()
    // });

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // =========================================
  // PUBLIC METHODS
  // =========================================

  /**
   * Toggle configuration panel
   */

  toggleConfigPanel(): void {
    this.configStore.toggleConfigPanel();
  }

  /**
   * Handle bash configuration requests
   */
  onBashConfigRequest(config: IBashConfig): void {
    console.log('Bash config requested in home content:', config);
  }

  /**
   * Handle configuration changes from sidebar
   */
  onBashConfigChange(event: any): void {
    console.log('Bash config change received:', event);
  }

  /**
   * Handle bash data loaded events
   */
  onBashDataLoaded(data: any[]): void {
    this.tools.consoleGroup({ // TAG AtkApiComponent -> onBashDataLoaded() ================ CONSOLE LOG IN PROGRESS
      title: `AtkApiComponent -> onBashDataLoaded()`, tag: 'check', palette: 'in', collapsed: false,
      data: { data: data }
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
          this.account.set(account);
          this.loading.set(false);
        },
        error: (error) => {
          this.tools.consoleGroup({
            title: `Error loading account`,
            tag: 'cross',
            data: error,
            palette: 'er',
            collapsed: true
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
    if (!timestamp) return 'Not available';
    return new Date(timestamp).toLocaleString('fr-FR');
  }

  /**
   * TrackBy function for balance list optimization
   */
  trackByAsset(index: number, balance: BinanceBalance): string {
    return balance.asset;
  }
}
