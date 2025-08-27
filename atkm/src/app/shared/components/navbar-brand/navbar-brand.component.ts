import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { INavbarConfig } from '../../../core/services/config.service';

@Component({
  selector: 'atk-navbar-brand',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="menu-center">
      <div class="menu-center-content">
        <h1 class="menu-center-title">{{config?.centerTitle}}</h1>
        <p class="menu-center-subtitle">
          {{config?.centerSubtitle}}
          <span class="menu-center-badge" *ngIf="config?.centerBadge">
            {{config.centerBadge}}
          </span>
        </p>
      </div>
    </div>
  `,
  styles: [`
    /* Styles spécifiques si nécessaire - sinon ils sont dans atk.styles.css */
  `]
})
export class NavbarBrandComponent {
  @Input() config: INavbarConfig | null = null;
}