// src/app/features/landing/landing.component.ts
// Main landing component using centralized ConfigStore
// Angular 20 - Full signal-based approach

import { AfterViewInit, Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { NavbarBrandComponent } from '@shared/components/navbar-brand/navbar-brand.component';
import { NavbarMainComponent } from '@shared/components/navbar-main/navbar-main.component';
import { NavbarToolsComponent } from '@shared/components/navbar-tools/navbar-tools.component';
import { SidebarBashConfigComponent } from '@shared/components/sidebar-bash-config/sidebar-bash-config.component';
import { SidebarConfigComponent } from '@shared/components/sidebar-config/sidebar-config.component';
import { SidebarNavComponent } from '@shared/components/sidebar-nav/sidebar-nav.component';

import { BreadcrumbService } from '@core/services/breadcrumb.service';
import { NavigationStateService } from '@core/services/navigation-state.service';
import { ConfigStore } from '@core/store/config.store';
import { ApiManagementStateService } from '@shared/services/atk-api-management-state.service';
import { ToolsService } from '@shared/services/tools.service';

@Component({
  selector: 'atk-landing',
  standalone: true,
  imports: [
    RouterOutlet,
    NavbarMainComponent,
    NavbarBrandComponent,
    NavbarToolsComponent,
    SidebarNavComponent,
    SidebarBashConfigComponent,
    SidebarConfigComponent
  ],
  templateUrl: './landing.component.html',
  styles: []
})
export class LandingComponent implements OnInit, AfterViewInit {

  // =========================================
  // DEPENDENCIES
  // =========================================

  private readonly configStore = inject(ConfigStore);
  private readonly navigationService = inject(NavigationStateService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly apiStateService = inject(ApiManagementStateService);
  private readonly tools = inject(ToolsService);

  // =========================================
  // COMPUTED SIGNALS FROM STORE
  // =========================================

  config = this.configStore.config;
  loading = this.configStore.loading;
  error = this.configStore.error;
  configPanelCollapsed = this.configStore.configPanelCollapsed;

  // =========================================
  // LIFECYCLE HOOKS
  // =========================================

  ngOnInit(): void {
    // Load configuration on component initialization
    this.configStore.loadLandingConfig()
      .catch(err => {
        console.error('Error loading configuration in LandingComponent:', err);
      });

    this.tools.consoleGroup({ // TAG LandingComponent -> ngOnInit() ================ CONSOLE LOG IN PROGRESS
      title: `LandingComponent -> ngOnInit() -> configStore.loadLandingConfig()`, tag: 'check', palette: 'in', collapsed: false,
      data: {
        config: this.config(),
        loading: this.loading(),
        error: this.error(),
        configPanelCollapsed: this.configPanelCollapsed()
      }
    });
  }

  ngAfterViewInit(): void {
    // Additional initialization after view is ready
  }

  // =========================================
  // PUBLIC METHODS
  // =========================================

  /**
   * Toggle the configuration panel
   */
  toggleConfigPanel(): void {
    this.configStore.toggleConfigPanel();
  }

  /**
   * Toggle the bash configuration panel
   * Currently delegates to regular config panel
   */
  toggleBashConfigPanel(): void {
    this.toggleConfigPanel();
  }

  /**
   * Handle configuration changes from bash component
   * @param event - Configuration change event
   */
  onBashConfigChange(event: any): void {
    this.tools.consoleGroup({ // TAG LandingComponent -> onBashConfigChange() ================ CONSOLE LOG IN PROGRESS
      title: `LandingComponent -> onBashConfigChange()`, tag: 'check', palette: 'in', collapsed: false,
      data: { type: event.type, payload: event.payload },
    });

    // Handle specific event types
    switch (event.type) {
      case 'endpoint-change':
        this.apiStateService.setCurrentEndpoint(event.payload.endpointId);
        break;

      case 'parameter-change':
        console.log('Parameter change:', event.payload);
        break;

      case 'action-execute':
        console.log('Action execute:', event.payload);
        break;

      case 'account-refresh':
        console.log('Account refresh requested');
        break;

      case 'config-update':
        if (event.payload.reset) {
          console.log('Config reset requested');
        }
        break;
    }
  }

  /**
   * Get API state service instance
   * @returns ApiManagementStateService instance
   */
  getApiStateService(): ApiManagementStateService {
    return this.apiStateService;
  }

  /**
   * Handle navigation changes
   * @param route - Current route
   */
  onNavigationChange(route: string): void {
    if (!route.includes('binance') && !route.includes('ibkr')) {
      this.tools.consoleGroup({
        title: `LandingComponent -> Navigation away from API pages`,
        tag: 'check',
        palette: 'in',
        collapsed: false,
        data: { route }
      });
    }
  }
}
