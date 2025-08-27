import { CommonModule } from '@angular/common';
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
    CommonModule,
    NavbarMainComponent,
    NavbarBrandComponent,
    NavbarToolsComponent,
    SidebarNavComponent,
    ContentMainComponent,
    SidebarConfigComponent
  ],
  template: `
    <div class="main-container" *ngIf="config">
      <!-- GRILLE 1: MENU PRINCIPAL (gauche) -->
      <atk-navbar-main [config]="config.navbar"></atk-navbar-main>

      <!-- GRILLE 2: ZONE CENTRALE TRANSPARENTE (centre) -->
      <atk-navbar-brand [config]="config.navbar"></atk-navbar-brand>

      <!-- GRILLE 3: OUTILS UTILISATEUR (droite) -->
      <atk-navbar-tools></atk-navbar-tools>

      <!-- GRILLE 4: NAVIGATION SIDEBAR (gauche) -->
      <atk-sidebar-nav [config]="config.sidebar"></atk-sidebar-nav>

      <!-- GRILLE 5: CONTENU PRINCIPAL (centre) -->
      <atk-content-main [feeds]="config.feeds"></atk-content-main>

      <!-- GRILLE 6: PANNEAU CONFIGURATION (droite) -->
      <atk-sidebar-config [sections]="config.configPanel"></atk-sidebar-config>
    </div>

    <!-- Loading state -->
    <div class="loading-container" *ngIf="!config">
      <div class="loading-spinner">Chargement...</div>
    </div>
  `,
  styles: [`
    .loading-container {
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--color-canvas-default);
      color: var(--color-fg-default);
    }

    .loading-spinner {
      font-size: 18px;
      color: var(--color-accent-fg);
    }
  `]
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
