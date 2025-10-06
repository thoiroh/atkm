// src/app/shared/components/sidebar.nav/sidebar.nav.component.ts
// Navigation sidebar component using centralized ConfigStore
// Angular 20 - Signal-based approach with modern patterns

import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ConfigStore } from '@core/store/config.store';
import { HoverDotDirective } from '@directives/hover-dot.directive';
import { IconPipe } from '@pipes/icon.pipe';
import { AtkIconComponent } from '@shared/components/atk-icon/atk-icon.component';
import { ToolsService } from '@shared/services/tools.service';

@Component({
  selector: 'atk-sidebar-nav',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AtkIconComponent,
    IconPipe,
    HoverDotDirective
  ],
  templateUrl: './sidebar-nav.component.html',
})
export class SidebarNavComponent {

  // =========================================
  // DEPENDENCIES & COMPUTED SIGNALS
  // =========================================

  private readonly configStore = inject(ConfigStore);
  private readonly tools = inject(ToolsService);

  config = computed(() => this.configStore.sidebar());

  // =========================================
  // EVENT HANDLERS
  // =========================================

  /**
   * Toggle a sidebar section's expanded state
   * @param sectionIndex - Index of the section to toggle
   */
  toggleSection(sectionIndex: number): void {
    const sidebarConfig = this.config();
    if (sidebarConfig?.sections[sectionIndex]) {
      sidebarConfig.sections[sectionIndex].isExpanded =
        !sidebarConfig.sections[sectionIndex].isExpanded;
    }
  }

  /**
   * Toggle a menu item's expanded state
   * @param sectionIndex - Index of the section
   * @param itemIndex - Index of the item within the section
   */
  toggleItem(sectionIndex: number, itemIndex: number): void {
    const sidebarConfig = this.config();
    if (sidebarConfig?.sections[sectionIndex]?.items[itemIndex]) {
      sidebarConfig.sections[sectionIndex].items[itemIndex].isExpanded =
        !sidebarConfig.sections[sectionIndex].items[itemIndex].isExpanded;
    }
  }

  /**
   * Toggle a submenu item's expanded state
   * @param sectionIndex - Index of the section
   * @param itemIndex - Index of the item
   * @param subMenuIndex - Index of the submenu item
   */
  toggleSubMenu(sectionIndex: number, itemIndex: number, subMenuIndex: number): void {
    const sidebarConfig = this.config();
    const subMenuItem = sidebarConfig?.sections[sectionIndex]?.items[itemIndex]?.subMenu?.[subMenuIndex];
    if (subMenuItem) {
      subMenuItem.isExpanded = !subMenuItem.isExpanded;
    }
  }

  /**
   * Handle action button clicks
   * @param action - Action identifier string
   */
  handleAction(action: string): void {
    console.log('Action:', action);
  }
}
