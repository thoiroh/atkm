// src/app/shared/components/sidebar-config/sidebar-config.component.ts
// Configuration sidebar component using ConfigStore

import { Component, inject } from '@angular/core';
import { ConfigStore } from '@core/store/config.store';
import { AtkIconComponent } from '@shared/components/atk-icon/atk-icon.component';
import { HoverDotDirective } from '@shared/directives/hover-dot.directive';
import { IconPipe } from '@shared/pipes/icon.pipe';

@Component({
  selector: 'atk-sidebar-config',
  standalone: true,
  imports: [AtkIconComponent, IconPipe, HoverDotDirective],
  templateUrl: './sidebar-config.component.html',
})
export class SidebarConfigComponent {

  // =========================================
  // DEPENDENCIES
  // =========================================

  private readonly configStore = inject(ConfigStore);

  // =========================================
  // COMPUTED SIGNALS FROM STORE
  // =========================================

  sections = this.configStore.configPanelSections;
  isCollapsed = this.configStore.configPanelCollapsed;

  // =========================================
  // EVENT HANDLERS
  // =========================================

  /**
   * Navigate to configuration page
   * @param event - Click event
   * @param link - Configuration link
   */
  navigateToConfig(event: Event, link: string): void {
    event.preventDefault();
    console.log('Navigate to config:', link);
  }

  /**
   * Toggle configuration panel via store
   */
  onToggle(): void {
    this.configStore.toggleConfigPanel();
  }
}
