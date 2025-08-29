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
  imports: [
    NavbarMainComponent,
    NavbarBrandComponent,
    NavbarToolsComponent,
    SidebarNavComponent,
    ContentMainComponent,
    SidebarConfigComponent
  ],
  template: `
    @if (config) {
      <div class="main-container">
        <!-- GRILLE 1: MENU PRINCIPAL (gauche) -->
        <atk-navbar-main [config]="config.navbar" />

        <!-- GRILLE 2: ZONE CENTRALE TRANSPARENTE (centre) -->
        <atk-navbar-brand [config]="config.navbar" />

        <!-- GRILLE 3: OUTILS UTILISATEUR (droite) -->
        <atk-navbar-tools />

        <!-- GRILLE 4: NAVIGATION SIDEBAR (gauche) -->
        <atk-sidebar-nav [config]="config.sidebar" />

        <!-- GRILLE 5: CONTENU PRINCIPAL (centre) -->
        <atk-content-main [feeds]="config.feeds" />

        <!-- GRILLE 6: PANNEAU CONFIGURATION (droite) -->
        <atk-sidebar-config [sections]="config.configPanel" />
      </div>
    } @else {
      <!-- Loading state -->
      <div class="loading-container">
        <div class="loading-spinner">Chargement...</div>
      </div>
    }
  `,
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
}
