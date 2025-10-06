// src/app/shared/components/navbar.main/navbar.main.component.ts
// Main navbar component using centralized ConfigStore
// Angular 20 - Signal-based approach

import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { ConfigStore } from '@core/store/config.store';
import { AtkIconComponent } from '@shared/components/atk-icon/atk-icon.component';

@Component({
  selector: 'atk-navbar-main',
  standalone: true,
  imports: [CommonModule, AtkIconComponent],
  templateUrl: './navbar-main.component.html',
})
export class NavbarMainComponent {

  // =========================================
  // DEPENDENCIES & COMPUTED SIGNALS
  // =========================================

  private readonly configStore = inject(ConfigStore);

  config = this.configStore.config;
  navbar = this.configStore.navbar;
}
