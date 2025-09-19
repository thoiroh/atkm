// landing.component.ts (Updated)
// Enhanced landing component with bash sidebar integration

import { AfterViewInit, Component, OnInit, inject } from '@angular/core';
import { BreadcrumbService } from '@core/services/breadcrumb.service';
import { ConfigService, ILandingConfig } from '@core/services/config.service';
import { NavigationStateService } from '@core/services/navigation-state.service';
import { ToolsService } from '@shared/components/atk-tools/tools.service';

// Components
import { ContentMainComponent } from '@shared/components/content-main/content-main.component';
import { NavbarBrandComponent } from '@shared/components/navbar-brand/navbar-brand.component';
import { NavbarMainComponent } from '@shared/components/navbar-main/navbar-main.component';
import { NavbarToolsComponent } from '@shared/components/navbar-tools/navbar-tools.component';
import { SidebarConfigComponent } from '@shared/components/sidebar-config/sidebar-config.component';
import { SidebarNavComponent } from '@shared/components/sidebar-nav/sidebar-nav.component';

// NEW: Bash components
import { AtkBashComponent } from '@shared/components/atk-bash/atk-bash.component';
import { SidebarBashConfigComponent } from '@shared/components/sidebar-bash-config/sidebar-bash-config.component';

@Component({
  selector: 'atk-landing',
  standalone: true,
  imports: [
    NavbarMainComponent,
    NavbarBrandComponent,
    NavbarToolsComponent,
    SidebarNavComponent,
    ContentMainComponent,
    SidebarConfigComponent,
    // NEW: Bash components
    AtkBashComponent,
    SidebarBashConfigComponent
  ],
  templateUrl: './landing.component.html',
  styles: []
})
export class LandingComponent implements OnInit, AfterViewInit {
  config: ILandingConfig | null = null;

  // NEW: Bash terminal state
  showBashTerminal: boolean = false;
  bashConfigCollapsed: boolean = true;

  private configService = inject(ConfigService);
  private navigationService = inject(NavigationStateService);
  private breadcrumbService = inject(BreadcrumbService);
  private tools = inject(ToolsService);

  ngOnInit(): void {
    this.configService.loadLandingConfig().subscribe({
      next: (config) => {
        this.config = config;
        console.log('📋 Landing configuration loaded');
      },
      error: (error) => {
        console.error('❌ Error loading configuration:', error);
      }
    });

    // Initialize bash terminal for debug routes
    this.checkRouteForBashTerminal();
  }

  ngAfterViewInit(): void {
    // Optional: Console debug information
    // setTimeout(() => {
    //   this.tools.consoleGroup({
    //     title: 'Landing Configuration Loaded',
    //     tag: 'info',
    //     data: this.config,
    //     palette: 'in',
    //     collapsed: false,
    //     fontFamily: 'Inter, ui-sans-serif',
    //     fontSizePx: 14
    //   });
    // }, 500);
  }

  /**
   * Toggle main config panel
   */
  toggleConfigPanel(): void {
    if (this.config) {
      this.config.configPanel.isCollapsed = !this.config.configPanel.isCollapsed;
      console.log('🔄 Config panel toggled:', this.config.configPanel.isCollapsed);
    }
  }

  /**
   * NEW: Toggle bash config panel
   */
  toggleBashConfigPanel(): void {
    this.bashConfigCollapsed = !this.bashConfigCollapsed;
    console.log('🔧 Bash config panel toggled:', this.bashConfigCollapsed);
  }

  /**
   * Handle bash data loaded event
   */
  onBashDataLoaded(data: any[]): void {
    console.log('✅ Bash data loaded:', data.length, 'items');
  }

  /**
   * Handle bash error event
   */
  onBashErrorOccurred(error: string): void {
    console.error('❌ Bash error occurred:', error);
  }

  /**
   * NEW: Handle bash endpoint changes from sidebar
   */
  onBashEndpointChange(endpointId: string): void {
    console.log('📡 Bash endpoint changed:', endpointId);
  }

  /**
   * NEW: Handle bash parameter changes from sidebar
   */
  onBashParameterChange(parameters: Record<string, any>): void {
    console.log('📝 Bash parameters changed:', parameters);
  }

  /**
   * NEW: Toggle bash terminal visibility
   */
  toggleBashTerminal(): void {
    this.showBashTerminal = !this.showBashTerminal;
    if (this.showBashTerminal) {
      this.bashConfigCollapsed = false; // Auto-expand sidebar when terminal shows
    }
    console.log('💻 Bash terminal toggled:', this.showBashTerminal);
  }

  /**
   * NEW: Check if current route should show bash terminal
   */
  private checkRouteForBashTerminal(): void {
    // Auto-show bash terminal for specific routes
    const currentUrl = window.location.href;
    const bashRoutes = [
      '/dashboard/binance/debug',
      '/dashboard/binance/terminal',
      '/dashboard/ibkr/debug',
      '/dashboard/debug',
      '/terminal'
    ];

    this.showBashTerminal = bashRoutes.some(route => currentUrl.includes(route));

    if (this.showBashTerminal) {
      this.bashConfigCollapsed = false;
      console.log('🔧 Auto-enabled bash terminal for route:', currentUrl);
    }
  }

  /**
   * Update config items with proper navigation links
   */
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
                item.label === 'Debug Terminal' ? '/dashboard/binance/debug' :
                  item.link
        }));
      } else if (section.title === 'IBKR Platform') {
        section.items = section.items.map(item => ({
          ...item,
          link: item.label === 'Account History' ? '/dashboard/ibkr/account' :
            item.label === 'Account Snapshot' ? '/dashboard/ibkr/snapshot' :
              item.label === 'Live Market Data' ? '/dashboard/ibkr/market-data' :
                item.label === 'Debug Terminal' ? '/dashboard/ibkr/debug' :
                  item.link
        }));
      }
      return section;
    });

    console.log('🔗 Navigation links updated for bash terminal routes');
  }
}
