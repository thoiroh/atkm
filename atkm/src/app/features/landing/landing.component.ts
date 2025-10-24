/**
 * Landing Component
 * Main layout wrapper with navigation, sidebar, and router outlet
 *
 * Responsibilities:
 * - Load app configuration
 * - Initialize app state service
 * - Provide layout structure
 * - NO API management (delegated to child components)
 *
 * @file landing.component.ts
 * @version 2.0.0
 * @architecture Layout-only component with centralized state management
 */

import { AfterViewInit, Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { NavbarBrandComponent } from '@shared/components/navbar-brand/navbar-brand.component';
import { NavbarMainComponent } from '@shared/components/navbar-main/navbar-main.component';
import { NavbarToolsComponent } from '@shared/components/navbar-tools/navbar-tools.component';
import { SidebarNavComponent } from '@shared/components/sidebar-nav/sidebar-nav.component';

import { ToolsService } from '@core/services/tools.service';
import { AtkAppStateService } from '@core/state/atk-app-state.service';
import { ConfigStore } from '@core/store/config.store';

@Component({
  selector: 'atk-landing',
  standalone: true,
  imports: [
    RouterOutlet,
    NavbarMainComponent,
    NavbarBrandComponent,
    NavbarToolsComponent,
    SidebarNavComponent,
  ],
  templateUrl: './landing.component.html',
  styles: []
})
export class LandingComponent implements OnInit, AfterViewInit {

  // =========================================
  // DEPENDENCIES
  // =========================================

  private readonly configStore = inject(ConfigStore);
  private readonly appState = inject(AtkAppStateService);
  private readonly tools = inject(ToolsService);

  // =========================================
  // COMPUTED SIGNALS FROM STORE
  // =========================================

  config = this.configStore.config;
  loading = this.configStore.loading;
  error = this.configStore.error;

  // =========================================
  // LIFECYCLE HOOKS
  // =========================================

  async ngOnInit(): Promise<void> {
    // Load configuration on component initialization
    await this.configStore.loadLandingConfig()
      .catch(err => {
        console.error('Error loading configuration in LandingComponent:', err);
      });

    // Initialize app state service with navigation items from config
    const navigationItems = this.configStore.navigation();

    if (navigationItems && navigationItems.length > 0) {
      await this.appState.initialize(
        navigationItems.map(item => ({
          ...item,
          isActive: false // Will be set by router
        }))
      );

      this.tools.consoleGroup({
        title: 'LandingComponent -> ngOnInit() -> App initialized',
        tag: 'check',
        palette: 'su',
        collapsed: true,
        data: {
          config: this.config(),
          navigationItemsCount: navigationItems.length,
          appStateInitialized: this.appState.initialized()
        }
      });
    } else {
      console.warn('No navigation items found in configuration');
    }
  }

  ngAfterViewInit(): void {
    // Additional initialization after view is ready
  }
}
