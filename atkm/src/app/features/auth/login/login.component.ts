import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ContentMainComponent } from '../../../shared/components/content-main/content-main.component';
import { NavbarBrandComponent } from '../../../shared/components/navbar-brand/navbar-brand.component';
import { NavbarMainComponent } from '../../../shared/components/navbar-main/navbar-main.component';
import { NavbarToolsComponent } from '../../../shared/components/navbar-tools/navbar-tools.component';
import { SidebarConfigComponent } from '../../../shared/components/sidebar-config/sidebar-config.component';
import { SidebarNavComponent } from '../../../shared/components/sidebar-nav/sidebar-nav.component';

@Component({
  selector: 'atk-login',
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
    <div class="main-container" *ngIf="config">login</div>

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

export class LoginComponent implements OnInit, AfterViewInit {

  constructor() { }

  ngOnInit() {
  }

  ngAfterViewInit(): void {
  }


}
