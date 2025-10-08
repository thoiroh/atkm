// src/app/shared/components/sidebar.nav/sidebar.nav.component.ts
// Navigation sidebar component using centralized ConfigStore
// Angular 20 - Signal-based approach with modern patterns

import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
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

export class SidebarNavComponent implements OnInit {

  // =========================================
  // DEPENDENCIES & COMPUTED SIGNALS
  // =========================================

  private readonly configStore = inject(ConfigStore);
  private readonly tools = inject(ToolsService);

  // config = this.configStore.config;
  sidebar = this.configStore.sidebar;


  // =========================================
  // LIFECYCLE
  // =========================================

  ngOnInit(): void {
    // this.tools.consoleGroup({ // OFF SidebarNavComponent -> ngOnInit() ================ CONSOLE LOG IN PROGRESS
    //   title: `SidebarNavComponent -> ngOnInit()`, tag: 'check', palette: 'in', collapsed: false,
    //   data: { sidebar: this.sidebar() }
    // });
  }

  // =========================================
  // EVENT HANDLERS
  // =========================================

  /**
   * Toggle a sidebar section's expanded state
   * @param sectionIndex - Index of the section to toggle
   */
  toggleSection(sectionIndex: number): void {
    if (this.sidebar()?.sections[sectionIndex]) {
      this.sidebar().sections[sectionIndex].isExpanded =
        !this.sidebar().sections[sectionIndex].isExpanded;
    }
  }

  /**
   * Toggle a menu item's expanded state
   * @param sectionIndex - Index of the section
   * @param itemIndex - Index of the item within the section
   */
  toggleItem(sectionIndex: number, itemIndex: number): void {
    if (this.sidebar()?.sections[sectionIndex]?.items[itemIndex]) {
      this.sidebar().sections[sectionIndex].items[itemIndex].isExpanded =
        !this.sidebar().sections[sectionIndex].items[itemIndex].isExpanded;
    }
  }

  /**
   * Toggle a submenu item's expanded state
   * @param sectionIndex - Index of the section
   * @param itemIndex - Index of the item
   * @param subMenuIndex - Index of the submenu item
   */
  toggleSubMenu(sectionIndex: number, itemIndex: number, subMenuIndex: number): void {
    const subMenuItem = this.sidebar()?.sections[sectionIndex]?.items[itemIndex]?.subMenu?.[subMenuIndex];
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
