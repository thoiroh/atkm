import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { ConfigService, ILandingConfig } from '../../core/services/config.service';
import { NavigationStateService } from '../../core/services/navigation-state.service';
import { ContentMainComponent } from '../../shared/components/content-main/content-main.component';
import { NavbarBrandComponent } from '../../shared/components/navbar-brand/navbar-brand.component';
import { NavbarMainComponent } from '../../shared/components/navbar-main/navbar-main.component';
import { NavbarToolsComponent } from '../../shared/components/navbar-tools/navbar-tools.component';
import { SidebarConfigComponent } from '../../shared/components/sidebar-config/sidebar-config.component';
import { SidebarNavComponent } from '../../shared/components/sidebar-nav/sidebar-nav.component';

@Component({
  selector: 'atk-landing',
  standalone: true,
  imports: [
    RouterOutlet,
    NavbarMainComponent,
    NavbarBrandComponent,
    NavbarToolsComponent,
    SidebarNavComponent,
    ContentMainComponent,
    SidebarConfigComponent
  ],
  templateUrl: './landing.component.html',

  styles: []
})
export class LandingComponent implements OnInit {
  config: ILandingConfig | null = null;

  private configService = inject(ConfigService);
  private navigationService = inject(NavigationStateService);
  private breadcrumbService = inject(BreadcrumbService);

  ngOnInit(): void {
    this.configService.loadLandingConfig().subscribe({
      next: (config) => {
        this.config = config;
        this.updateConfigForNavigation();
      },
      error: (error) => {
        console.error('Erreur lors du chargement de la configuration:', error);
      }
    });
  }

  toggleConfigPanel(): void {
    if (this.config) {
      this.config.configPanel.isCollapsed = !this.config.configPanel.isCollapsed;
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
