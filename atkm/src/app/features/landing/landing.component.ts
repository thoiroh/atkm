// src/app/features/landing/landing.component.ts
// Updated to integrate ApiManagementStateService with SidebarBashConfigComponent

import { AfterViewInit, Component, OnInit, computed, inject } from '@angular/core';
import { BreadcrumbService } from '@core/services/breadcrumb.service';
import { ConfigService, ILandingConfig } from '@core/services/config.service';
import { NavigationStateService } from '@core/services/navigation-state.service';
import { ToolsService } from '@shared/components/atk-tools/tools.service';
import { ContentMainComponent } from '@shared/components/content-main/content-main.component';
import { NavbarBrandComponent } from '@shared/components/navbar-brand/navbar-brand.component';
import { NavbarMainComponent } from '@shared/components/navbar-main/navbar-main.component';
import { NavbarToolsComponent } from '@shared/components/navbar-tools/navbar-tools.component';
import { SidebarBashConfigComponent } from '@shared/components/sidebar-bash-config/sidebar-bash-config.component';
import { SidebarNavComponent } from '@shared/components/sidebar-nav/sidebar-nav.component';
import { ApiManagementStateService } from '@shared/services/atk-api-management-state.service';

@Component({
  selector: 'atk-landing',
  standalone: true,
  imports: [
    NavbarMainComponent,
    NavbarBrandComponent,
    NavbarToolsComponent,
    SidebarNavComponent,
    ContentMainComponent,
    SidebarBashConfigComponent
  ],
  templateUrl: './landing.component.html',
  styles: []
})
export class LandingComponent implements OnInit, AfterViewInit {
  config: ILandingConfig | null = null;

  // Services
  private configService = inject(ConfigService);
  private navigationService = inject(NavigationStateService);
  private breadcrumbService = inject(BreadcrumbService);
  private tools = inject(ToolsService);

  // NEW: API Management State Service
  private apiStateService = inject(ApiManagementStateService);

  // Computed properties for sidebar bash config
  bashConfig = computed(() => this.apiStateService.currentConfig());
  bashTerminalState = computed(() => this.apiStateService.terminalState());
  bashCurrentEndpoint = computed(() => this.apiStateService.currentEndpoint());
  bashConfigPanelCollapsed = computed(() => this.apiStateService.sidebarCollapsed());
  bashAccountData = computed(() => this.apiStateService.accountData());

  ngOnInit(): void {
    this.configService.loadLandingConfig().subscribe({
      next: (config) => {
        this.config = config;
        // Initialize bash config panel as collapsed
        this.apiStateService.setSidebarCollapsed(true);
      },
      error: (error) => {
        console.error('Erreur lors du chargement de la configuration:', error);
      }
    });

    // Subscribe to API Management state changes for debugging
    this.apiStateService.events$.subscribe(event => {
      this.tools.consoleGroup({
        title: `Landing received API Management event`,
        tag: 'check',
        data: { type: event.type, source: event.source, payload: event.payload },
        palette: 'de',
        collapsed: true,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSizePx: 13
      });
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
   * Handle bash config panel toggle via state service
   */
  toggleBashConfigPanel(): void {
    this.apiStateService.toggleSidebar();

    this.tools.consoleGroup({
      title: `Landing toggled bash config panel`,
      tag: 'check',
      data: { collapsed: this.apiStateService.sidebarCollapsed() },
      palette: 'de',
      collapsed: true,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSizePx: 13
    });
  }

  /**
   * Handle configuration changes from SidebarBashConfigComponent
   * These are now handled by the state service directly
   */
  onBashConfigChange(event: any): void {
    // The SidebarBashConfigComponent will interact directly with ApiManagementStateService
    // This method is kept for potential custom handling at the Landing level

    this.tools.consoleGroup({
      title: `Landing received bash config change`,
      tag: 'check',
      data: { type: event.type, payload: event.payload },
      palette: 'de',
      collapsed: true,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSizePx: 13
    });

    // Forward specific events if needed
    switch (event.type) {
      case 'endpoint-change':
        this.apiStateService.setCurrentEndpoint(event.payload.endpointId);
        break;

      case 'parameter-change':
        this.apiStateService.updateRequestParameter(
          event.payload.parameter,
          event.payload.value
        );
        break;

      case 'action-execute':
        this.apiStateService.executeAction(event.payload.actionId, event.payload);
        break;

      case 'account-refresh':
        // This will trigger a refresh of account data in components that listen to the state service
        this.apiStateService.executeAction('refresh-account');
        break;

      case 'config-update':
        // Handle configuration updates
        if (event.payload.reset) {
          this.apiStateService.resetState();
        }
        break;
    }
  }

  /**
   * Provide API state service to child components via dependency injection
   * This allows child components to access the state service
   */
  getApiStateService(): ApiManagementStateService {
    return this.apiStateService;
  }

  /**
   * Handle routing or navigation events that might affect the API management
   */
  onNavigationChange(route: string): void {
    // If navigating away from API management pages, we might want to pause certain operations
    if (!route.includes('binance') && !route.includes('ibkr')) {
      // Optional: pause API polling, clear sensitive data, etc.
      this.tools.consoleGroup({
        title: `Landing detected navigation away from API pages`,
        tag: 'check',
        data: { route },
        palette: 'wa',
        collapsed: true,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSizePx: 13
      });
    }
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
