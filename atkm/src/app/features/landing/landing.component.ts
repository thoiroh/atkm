// src/app/features/landing/landing.component.ts
// CORRECTED - Updated to integrate ApiManagementStateService with SidebarBashConfigComponent

import { AfterViewInit, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { NavbarBrandComponent } from '@shared/components/navbar-brand/navbar-brand.component';
import { NavbarMainComponent } from '@shared/components/navbar-main/navbar-main.component';
import { NavbarToolsComponent } from '@shared/components/navbar-tools/navbar-tools.component';
import { SidebarBashConfigComponent } from '@shared/components/sidebar-bash-config/sidebar-bash-config.component';
import { SidebarConfigComponent } from '@shared/components/sidebar-config/sidebar-config.component';
import { SidebarNavComponent } from '@shared/components/sidebar-nav/sidebar-nav.component';

import { BreadcrumbService } from '@core/services/breadcrumb.service';
import { ConfigService } from '@core/services/config.service';
import { NavigationStateService } from '@core/services/navigation-state.service';
import { ApiManagementStateService } from '@shared/services/atk-api-management-state.service';
import { ToolsService } from '@shared/services/tools.service';

import { ConfigStore } from '@core/store/config.store';

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

  private readonly configStore = inject(ConfigStore);

  // config = signal<ILandingConfig | null>(null);
  configPanelCollapsed = signal<boolean>(true);
  config = computed(() => this.configStore.config())
  // =========================================
  // SERVICES - Angular 20 Style
  // =========================================

  private navigationService = inject(NavigationStateService);
  private breadcrumbService = inject(BreadcrumbService);
  private configService = inject(ConfigService);
  private apiStateService = inject(ApiManagementStateService);
  private tools = inject(ToolsService);

  // =========================================
  //  SIGNALS / COMPUTED
  // =========================================

  constructor() {


    // navbar = this.configStore.navbar;
    // configPanelCollapsed = signal<boolean>(true);

  }
  // bashConfig = computed<null>(() => null);
  // bashCurrentEndpoint = computed(() => this.apiStateService.currentEndpoint());
  // bashConfigPanelCollapsed = computed(() => this.config?.configPanel?.isCollapsed || true);
  // bashSummary = computed(() => this.apiStateService.summary());
  // bashHasData = computed(() => this.apiStateService.hasData());

  // =========================================
  // LIFECYCLE
  // =========================================

  ngOnInit(): void {
    this.configStore.loadLandingConfig()
      .catch(err => console.error('Erreur lors du chargement de la configuration:', err));
    this.config = computed(() => this.configStore.config())
    this.tools.consoleGroup({ // TAG LandingComponent -> ngOnInit()
      title: `LandingComponent -> ngOnInit() -> loadLandingConfig(): ${this.config} `, tag: 'check', palette: 'in', collapsed: true,
      data: { config: this.config(), configPanelCollapsed: this.configPanelCollapsed() }
      // title: `LandingComponent -> ngOnInit() -> loadLandingConfig(): ${this.config.atkapp.master} `, tag: 'check', palette: 'in', collapsed: true, data: { config: this.config },
    });

    // Subscribe to API Management state changes for debugging
    // this.apiStateService.events$.subscribe(event => { // FIX LandingComponent (i perqué cui ?)
    //   this.tools.consoleGroup({ // OFF: LandingComponent ngOnInit() ================ CONSOLE LOG IN PROGRESS
    //     title: `atk-landing received API Management event: ${event.type}`,
    //     tag: 'check', collapsed: true, palette: 'in',
    //     data: { type: event.type, payload: event.payload },
    //   });
    // });

  }

  ngAfterViewInit(): void {
    // Your existing logic can stay here
  }

  // =========================================
  // PUBLIC & PRIVATE METHODS
  // =========================================
  toggleConfigPanel(): void {

    this.configStore.toggleConfigPanel();
    // effect(() => {
    //   if (this.config()) {
    //     this.config.isCollapsed.update(current => ({
    //       ...current,
    //       configPanel.isCollapsed: 'New Title'
    //     }));
    //     this.config.configPanel.isCollapsed = !this.config.configPanel.isCollapsed;

    //   }
    // });
  }

  toggleBashConfigPanel(): void {
    // Toggle the traditional config panel for now
    this.toggleConfigPanel();
  }

  onBashConfigChange(event: any): void {
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
        // Handle parameter changes
        console.log('Parameter change:', event.payload);
        break;

      case 'action-execute':
        // Handle action execution
        console.log('Action execute:', event.payload);
        break;

      case 'account-refresh':
        // Handle account refresh
        console.log('Account refresh requested');
        break;

      case 'config-update':
        // Handle configuration updates
        if (event.payload.reset) {
          // Reset state if needed
          console.log('Config reset requested');
        }
        break;
    }
  }

  getApiStateService(): ApiManagementStateService {
    return this.apiStateService;
  }

  onNavigationChange(route: string): void {
    // If navigating away from API management pages, we might want to pause certain operations
    if (!route.includes('binance') && !route.includes('ibkr')) {
      this.tools.consoleGroup({ // TAG LandingComponent -> onNavigationChange()
        title: `LandingComponent -> onNavigationChange() -> Landing detected navigation away from API pages`, tag: 'check', palette: 'in', collapsed: false,
        data: { route },
      });
    }
  }

  private updateConfigForNavigation(): void {
    // if (!this.config) return;

    // // Update sidebar sections with proper navigation paths
    // this.config.sidebar.sections = this.config.sidebar.sections.map(section => {
    //   if (section.title === 'Binance Wallet') {
    //     section.items = section.items.map(item => ({
    //       ...item,
    //       link: item.label === 'Account History' ? '/dashboard/binance/account' :
    //         item.label === 'Account Snapshot' ? '/dashboard/binance/snapshot' :
    //           item.label === 'Live Market Data' ? '/dashboard/binance/market-data' :
    //             item.link
    //     }));
    //   } else if (section.title === 'IBKR Platform') {
    //     section.items = section.items.map(item => ({
    //       ...item,
    //       link: item.label === 'Account History' ? '/dashboard/ibkr/account' :
    //         item.label === 'Account Snapshot' ? '/dashboard/ibkr/snapshot' :
    //           item.label === 'Live Market Data' ? '/dashboard/ibkr/market-data' :
    //             item.link
    //     }));
    //   }
    //   return section;
    // });
  }
}
