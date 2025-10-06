// src/app/shared/components/sidebar.config/sidebar.config.component.ts
// Configuration sidebar component using input signals
// Angular 20 - Modern signal-based inputs and outputs

import { Component, computed, inject, input, output } from '@angular/core';
import { IConfigPanelSection } from '@core/models/config.models';
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
  // INPUTS & OUTPUTS (Angular 20 style)
  // =========================================

  sections = input<IConfigPanelSection[]>([]);
  isCollapsed = input<boolean>(true);
  togglePanel = output<void>();

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
   * Emit toggle event
   */
  onToggle(): void {
    this.togglePanel.emit();
  }
}
