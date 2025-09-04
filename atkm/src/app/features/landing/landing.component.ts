import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfigService, ILandingConfig } from '../../core/services/config.service';
import { NavigationStateService } from '../../core/services/navigation-state.service';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
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

  styles: [`
    .landing-container {
      height: 100vh;
      width: 100vw;
      display: grid;
      grid-template-areas:
        "menu-main menu-brand menu-tools"
        "sidebar-nav main-content main-content";
      grid-template-columns: minmax(200px, 25%) 1fr minmax(200px, 25%);
      grid-template-rows: 80px 1fr;
      position: relative;
      background-color: var(--color-canvas-default);
      transition: grid-template-columns 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
    }

    .main-container {
      grid-area: main-content;
      display: flex;
      height: auto;
      border-top: 2px solid var(--color-border-default);
      border-right: 2px solid var(--color-border-default);
      border-left: 2px solid var(--color-border-default);
      border-radius: 6px 0px 0px 0px;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .loading-container {
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--color-canvas-default);
    }

    .loading-spinner {
      color: var(--color-fg-default);
      font-size: 18px;
    }

    /* Data staleness warning */
    :host ::ng-deep .data-staleness-warning {
      background: rgba(255, 166, 0, 0.1);
      border: 1px solid #ffa600;
      border-radius: 6px;
      padding: 12px 16px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      color: #ffa600;
      font-size: 14px;
    }

    :host ::ng-deep .data-staleness-warning svg {
      flex-shrink: 0;
    }

    /* Balances summary */
    :host ::ng-deep .balances-summary {
      background: var(--color-canvas-default);
      border: 1px solid var(--color-border-default);
      border-radius: 6px;
      padding: 16px;
      margin-bottom: 20px;
    }

    :host ::ng-deep .balances-summary p {
      margin: 0 0 8px 0;
      color: var(--color-fg-default);
    }

    :host ::ng-deep .balances-summary p:last-child {
      margin-bottom: 0;
    }
  `]
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
