// src/app/features/landing/landing.component.ts
// Updated to integrate SidebarBashConfigComponent

import { AfterViewInit, Component, OnInit, inject, signal } from '@angular/core';
import { ToolsService } from '@shared/components/atk-tools/tools.service';
import { BreadcrumbService } from '@core/services/breadcrumb.service';
import { ConfigService, ILandingConfig } from '@core/services/config.service';
import { NavigationStateService } from '@core/services/navigation-state.service';
import { ContentMainComponent } from '@shared/components/content-main/content-main.component';
import { NavbarBrandComponent } from '@shared/components/navbar-brand/navbar-brand.component';
import { NavbarMainComponent } from '@shared/components/navbar-main/navbar-main.component';
import { NavbarToolsComponent } from '@shared/components/navbar-tools/navbar-tools.component';
import { SidebarNavComponent } from '@shared/components/sidebar-nav/sidebar-nav.component';
// NEW: Import the new SidebarBashConfigComponent
import { AtkBashComponent } from '@shared/components/atk-bash/atk-bash.component';
import { SidebarBashConfigComponent } from '@shared/components/sidebar-bash-config/sidebar-bash-config.component';
import { SidebarConfigComponent } from '@shared/components/sidebar-config/sidebar-config.component';
// Import bash interfaces for typing
import { IBashConfig, IBashTerminalState } from '@shared/components/atk-bash/atk-bash.interfaces';

@Component({
  selector: 'atk-landing',
  standalone: true,
  imports: [
    NavbarMainComponent,
    NavbarBrandComponent,
    NavbarToolsComponent,
    SidebarNavComponent,
    ContentMainComponent,
    // REPLACED: SidebarConfigComponent with SidebarBashConfigComponent
    SidebarBashConfigComponent,
    SidebarConfigComponent,
    AtkBashComponent
  ],
  templateUrl: './landing.component.html',
  styles: []
})
export class LandingComponent implements OnInit, AfterViewInit {
  config: ILandingConfig | null = null;

  // NEW: Bash configuration state management
  bashConfig = signal<IBashConfig | null>(null);
  bashTerminalState = signal<IBashTerminalState | null>(null);
  bashCurrentEndpoint = signal<string>('');
  bashConfigPanelCollapsed = signal<boolean>(true);

  private configService = inject(ConfigService);
  private navigationService = inject(NavigationStateService);
  private breadcrumbService = inject(BreadcrumbService);
  private tools = inject(ToolsService);

  ngOnInit(): void {
    this.configService.loadLandingConfig().subscribe({
      next: (config) => {
        this.config = config;
        // Initialize bash config panel as collapsed
        this.bashConfigPanelCollapsed.set(true);
      },
      error: (error) => {
        console.error('Erreur lors du chargement de la configuration:', error);
      }
    });
  }

  ngAfterViewInit(): void {
    // Your existing logic can stay here
  }

  /**
   * Handle traditional config panel toggle (if still needed)
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
    this.bashConfigPanelCollapsed.update(collapsed => !collapsed);
  }

  /**
   * Handle bash configuration requests from AtkBashComponent
   */
  onBashConfigRequest(configData: {
    config: IBashConfig | null;
    terminalState: IBashTerminalState;
    currentEndpoint: string
  }): void {
    this.bashConfig.set(configData.config);
    this.bashTerminalState.set(configData.terminalState);
    this.bashCurrentEndpoint.set(configData.currentEndpoint);
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
    console.log('Bash data loaded:', data.length, 'records');
  }

  /**
   * Handle bash error events
   */
  onBashError(error: string): void {
    console.error('Bash error occurred:', error);
  }


  private updateConfigForNavigation(): void {
    if (!this.config) return;

    // Update sidebar sections with proper navigation paths
    this.config.sidebar.sections = this.config.sidebar.sections.map(section => {
      if (section.title === 'Binance Wallet') {
        section.items = section.items.map(item => ({
          ...item,
          link: item.label === 'Account History' ? '/dashboard/binance/account' :
            item.label === 'Account Snapshot' ? '/dashboard/binance/snapshot' :
              item.label === 'Live Market Data' ? '/dashboard/binance/market-data' :
                item.link
        }));
      } else if (section.title === 'IBKR Platform') {
        section.items = section.items.map(item => ({
          ...item,
          link: item.label === 'Account History' ? '/dashboard/ibkr/account' :
            item.label === 'Account Snapshot' ? '/dashboard/ibkr/snapshot' :
              item.label === 'Live Market Data' ? '/dashboard/ibkr/market-data' :
                item.link
        }));
      }
      return section;
    });
  }
}
