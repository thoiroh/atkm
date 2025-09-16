import { AfterViewInit, Component, OnInit, inject } from '@angular/core';
import { ToolsService } from '@shared/components/atk-tools/tools.service';
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
export class LandingComponent implements OnInit, AfterViewInit {
  config: ILandingConfig | null = null;

  private configService = inject(ConfigService);
  private navigationService = inject(NavigationStateService);
  private breadcrumbService = inject(BreadcrumbService);
  private tools = inject(ToolsService);

  ngOnInit(): void {
    this.configService.loadLandingConfig().subscribe({
      next: (config) => {
        this.config = config;
        // this.updateConfigForNavigation();
      },
      error: (error) => {
        console.error('Erreur lors du chargement de la configuration:', error);
      }
    });

  }

  ngAfterViewInit(): void {
    // setTimeout(() => {
    //   this.tools.consoleGroup({
    //     // ── header & identity
    //     title: 'Account Sync · Full Options Demo',
    //     tag: 'info',                 // symbol key or literal text
    //     // ── content
    //     data: this.config,
    //     // ── palette & grouping
    //     palette: 'in',             // 'default' | 'info' | 'warn' | 'error' | 'accent' | 'success'
    //     collapsed: false,            // groupCollapsed when true
    //     // ── header typography
    //     fontFamily: 'Inter, ui-sans-serif',
    //     fontSizePx: 14,
    //     fontWeight: 'bold',          // 'normal' | 'bold' | 'lighter' | 'bolder' | number
    //     fontStyle: 'normal',         // 'normal' | 'italic' | 'oblique'
    //     // ── body (keys) typography in dump()
    //     contentFontWeight: 500,
    //     contentFontStyle: 'normal',
    //     // ── values typography in dump()
    //     valueFontWeight: 'normal',
    //     valueFontStyle: 'italic',
    //     // ── object rendering
    //     objectRender: 'flat',        // 'tree' = real object (expandable), 'flat' = walk properties
    //     // ── arrays as table (heuristic)
    //     arrayAsTable: 'auto',        // true | false | 'auto'
    //     tableMinRows: 3,             // min rows to consider table
    //     tableMinCommonKeys: 2,       // min common keys across sampled objects
    //     tableSampleSize: 10          // sampling window for key intersection
    //   });
    // }, 500);
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
