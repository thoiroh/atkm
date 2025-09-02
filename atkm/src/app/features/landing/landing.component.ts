import { Component, OnInit } from '@angular/core';
import { ConfigService, ILandingConfig } from '../../core/services/config.service';
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
  styles: [``]
})
export class LandingComponent implements OnInit {
  config: ILandingConfig | null = null;

  constructor(private configService: ConfigService) { }

  ngOnInit(): void {
    this.configService.loadLandingConfig().subscribe({
      next: (config) => {
        this.config = config;
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
}
