// src/app/shared/components/navbar.tools/navbar.tools.component.ts
// User tools navbar component using centralized ConfigStore
// Angular 20 - Signal-based approach

import { Component, computed, inject } from '@angular/core';
import { ConfigStore } from '@core/store/config.store';
import { AtkIconComponent } from '@shared/components/atk-icon/atk-icon.component';

@Component({
  selector: 'atk-navbar-tools',
  standalone: true,
  imports: [AtkIconComponent],
  templateUrl: './navbar-tools.component.html',
})
export class NavbarToolsComponent {

  // =========================================
  // DEPENDENCIES & COMPUTED SIGNALS
  // =========================================

  private readonly configStore = inject(ConfigStore);

  configPanelCollapsed = this.configStore.configPanelCollapsed;

  // =========================================
  // EVENT HANDLERS
  // =========================================

  handleSearchShortcut(event: KeyboardEvent): void {
    if (event.key === '/' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      const input = event.target as HTMLInputElement;
      input.focus();
    }
  }

  handleAction(action: string): void {
    console.log('Action clicked:', action);
  }

  toggleUserMenu(): void {
    console.log('Toggle user menu');
  }
}
