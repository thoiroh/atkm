/**
 * ATK App State Service
 * Centralized application state management
 *
 * Responsibilities:
 * - Global app state (theme, language, current domain)
 * - Navigation state and management (from NavService)
 * - Breadcrumb state and management (from BreadcrumbService)
 * - Icon registry management (from IconService)
 *
 * @file atk-app-state.service.ts
 * @version 1.0.0
 * @architecture Angular 20 - Signals-based with explicit initialization
 */

import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { ToolsService } from '@core/services/tools.service';
import { firstValueFrom } from 'rxjs';

// ============================================
// INTERFACES
// ============================================

/**
 * Navigation item structure
 */
export interface NavigationItem {
  path: string;
  label: string;
  icon?: string;
  isActive: boolean;
  category: 'home' | 'binance' | 'ibkr' | 'config' | 'tools' | 'other';
}

/**
 * Breadcrumb item structure
 */
export interface BreadcrumbItem {
  label: string;
  path: string;
  isActive: boolean;
  isClickable: boolean;
}

/**
 * Icon definition structure
 */
export interface IconCircle {
  cx: number;
  cy: number;
  r: number;
  fill?: string | null;
  stroke?: string | null;
  strokeWidth?: number;
}

export interface IconDef {
  viewBox?: string;
  paths?: string[];
  circles?: IconCircle[];
  polygons?: any[];
  rects?: any[];
}

export interface IconRegistry {
  defaults: { viewBox: string; color: string };
  icons: Record<string, IconDef>;
}

// ============================================
// SERVICE
// ============================================

@Injectable({ providedIn: 'root' })
export class AtkAppStateService {

  // =========================================
  // DEPENDENCIES
  // =========================================

  private readonly tools = inject(ToolsService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);

  // =========================================
  // SECTION 1: APP GLOBAL STATE
  // =========================================

  /** Current active exchange/domain */
  private _currentDomain = signal<'binance' | 'ibkr' | null>(null);
  readonly currentDomain = this._currentDomain.asReadonly();

  /** App theme */
  private _theme = signal<'light' | 'dark'>('dark');
  readonly theme = this._theme.asReadonly();

  /** App language */
  private _language = signal<'en' | 'fr'>('en');
  readonly language = this._language.asReadonly();

  /** Initialization status */
  private _initialized = signal<boolean>(false);
  readonly initialized = this._initialized.asReadonly();

  // =========================================
  // SECTION 2: NAVIGATION STATE
  // =========================================

  /** Current active route */
  private _currentRoute = signal<string>('/landing');
  readonly currentRoute = this._currentRoute.asReadonly();

  /** Navigation items with active state */
  private _navigationItems = signal<NavigationItem[]>([]);
  readonly navigationItems = this._navigationItems.asReadonly();

  /** Computed: Binance navigation items */
  readonly binanceItems = computed(() =>
    this._navigationItems().filter(item => item.category === 'binance')
  );

  /** Computed: IBKR navigation items */
  readonly ibkrItems = computed(() =>
    this._navigationItems().filter(item => item.category === 'ibkr')
  );

  /** Computed: Home navigation items */
  readonly homeItems = computed(() =>
    this._navigationItems().filter(item => item.category === 'home')
  );

  /** Computed: Active navigation item */
  readonly activeItem = computed(() =>
    this._navigationItems().find(item => item.isActive) || null
  );

  // =========================================
  // SECTION 3: BREADCRUMB STATE
  // =========================================

  /** Breadcrumb items */
  private _breadcrumbs = signal<BreadcrumbItem[]>([]);
  readonly breadcrumbs = this._breadcrumbs.asReadonly();

  /** Computed: Breadcrumb path as string */
  readonly breadcrumbString = computed(() =>
    this._breadcrumbs().map(item => item.label).join(' > ')
  );

  /** Computed: Breadcrumb path as array */
  readonly breadcrumbPath = computed(() =>
    this._breadcrumbs().map(item => item.label)
  );

  // =========================================
  // SECTION 4: ICON REGISTRY STATE
  // =========================================

  /** Icon registry */
  private _iconRegistry = signal<IconRegistry>(this.createEmptyRegistry());
  readonly iconRegistry = this._iconRegistry.asReadonly();

  /** Icons loaded status */
  private _iconsLoaded = signal<boolean>(false);
  readonly iconsLoaded = this._iconsLoaded.asReadonly();

  /** Icons error status */
  private _iconsError = signal<boolean>(false);
  readonly iconsError = this._iconsError.asReadonly();

  /** Icon debug mode */
  private _iconDebugMode = signal<boolean>(false);

  // =========================================
  // CONSTRUCTOR
  // =========================================

  constructor() {
    // this.tools.consoleGroup({ // OFF AtkAppStateService -> constructor() ================ CONSOLE LOG IN PROGRESS
    //   title: 'AtkAppStateService -> constructor()', tag: 'recycle', palette: 'su', collapsed: true,
    //   data: { service: 'AtkAppStateService' }
    // });

    // Setup router listener for navigation updates
    this.setupRouterListener();
  }

  // =========================================
  // INITIALIZATION
  // =========================================

  /**
   * Initialize the service with navigation items and icons
   * Must be called explicitly after ConfigStore loads
   *
   * @param navigationItems - Navigation items from config
   */
  async initialize(navigationItems: NavigationItem[]): Promise<void> {
    if (this._initialized()) {
      // this.tools.consoleGroup({ // OFF AtkAppStateService -> ngOnInit() ================ CONSOLE LOG IN PROGRESS
      //   title: 'AtkAppStateService -> initialize(SKIP) ', tag: 'check', palette: 'wa', collapsed: true,
      //   data: { initialized: true }
      // });
      return;
    }

    try {
      // Set navigation items
      this._navigationItems.set(navigationItems);

      // Load icons
      await this.loadIcons();

      // Update active route based on current URL
      this.updateActiveRoute(this.router.url);

      // Build initial breadcrumbs
      this.buildBreadcrumbs();

      // Mark as initialized
      this._initialized.set(true);

      this.tools.consoleGroup({ // TAG AtkAppStateService -> initialize(SUCCESS) ================ CONSOLE LOG IN PROGRESS
        title: 'AtkAppStateService -> initialize(SUCCESS)', tag: 'check', palette: 'su', collapsed: true,
        data: { navigationItemsCount: navigationItems.length, iconsLoaded: this._iconsLoaded(), currentRoute: this._currentRoute() }
      });

    } catch (error: any) {
      this.tools.consoleGroup({ // TAG AtkAppStateService -> initialize(ERROR) ================ CONSOLE LOG IN PROGRESS
        title: 'AtkAppStateService -> initialize(ERROR)', tag: 'cross', palette: 'er', collapsed: false,
        data: { error: error.message }
      });
      throw error;
    }
  }

  // =========================================
  // SECTION 1 METHODS: APP GLOBAL STATE
  // =========================================

  /**
   * Set current domain (binance or ibkr)
   */
  setCurrentDomain(domain: 'binance' | 'ibkr'): void {
    this._currentDomain.set(domain);

    this.tools.consoleGroup({
      title: 'AtkAppStateService -> setCurrentDomain()',
      tag: 'check',
      palette: 'in',
      collapsed: true,
      data: { domain }
    });
  }

  /**
   * Set app theme
   */
  setTheme(theme: 'light' | 'dark'): void {
    this._theme.set(theme);
  }

  /**
   * Set app language
   */
  setLanguage(language: 'en' | 'fr'): void {
    this._language.set(language);
  }

  // =========================================
  // SECTION 2 METHODS: NAVIGATION
  // =========================================

  /**
   * Navigate to a specific route
   */
  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  /**
   * Check if a route is currently active
   */
  isRouteActive(path: string): boolean {
    return this._currentRoute() === path;
  }

  /**
   * Get navigation items by category
   */
  getItemsByCategory(category: NavigationItem['category']): NavigationItem[] {
    return this._navigationItems().filter(item => item.category === category);
  }

  /**
   * Get current category based on active route
   */
  getCurrentCategory(): string {
    const activeItem = this.activeItem();
    return activeItem ? activeItem.category : 'home';
  }

  /**
   * Update active route and navigation items (internal)
   */
  private updateActiveRoute(url: string): void {
    this._currentRoute.set(url);

    // Update navigation items active state
    const items = this._navigationItems().map(item => ({
      ...item,
      isActive: item.path === url
    }));

    this._navigationItems.set(items);

    // Auto-detect domain from URL
    if (url.includes('/binance/')) {
      this._currentDomain.set('binance');
    } else if (url.includes('/ibkr/')) {
      this._currentDomain.set('ibkr');
    }
  }

  /**
   * Setup router event listener
   */
  private setupRouterListener(): void {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.updateActiveRoute(event.urlAfterRedirects);
        this.buildBreadcrumbs();
      }
    });
  }

  // =========================================
  // SECTION 3 METHODS: BREADCRUMB
  // =========================================

  /**
   * Build breadcrumbs from current route
   */
  buildBreadcrumbs(): void {
    const breadcrumbs: BreadcrumbItem[] = [];
    let route: ActivatedRoute | null = this.activatedRoute.root;
    let url = '';

    while (route) {
      const data = route.snapshot?.data;
      const hasLabel = !!data?.['breadcrumb'];

      // Concatenate URL segment if present
      const segment = route.snapshot?.url?.map(s => s.path).join('/') ?? '';
      if (segment) {
        url += '/' + segment;
      }

      if (hasLabel) {
        breadcrumbs.push({
          label: data!['breadcrumb'],
          path: url || '/',
          isActive: false,
          isClickable: true
        });
      }

      route = route.firstChild ?? null;
    }

    // Mark last item as active/non-clickable
    if (breadcrumbs.length > 0) {
      const last = breadcrumbs[breadcrumbs.length - 1];
      last.isActive = true;
      last.isClickable = false;
    }

    // Always add "Dashboard" at root if absent
    if (breadcrumbs.length === 0 || breadcrumbs[0].label !== 'Dashboard') {
      breadcrumbs.unshift({
        label: 'Dashboard',
        path: '/landing',
        isActive: breadcrumbs.length === 0,
        isClickable: breadcrumbs.length > 0
      });
    }

    this._breadcrumbs.set(breadcrumbs);
  }

  /**
   * Navigate to a breadcrumb item
   */
  navigateToBreadcrumb(breadcrumb: BreadcrumbItem): void {
    if (breadcrumb.isClickable) {
      this.router.navigate([breadcrumb.path]);
    }
  }

  /**
   * Manually set breadcrumbs (for special cases)
   */
  setBreadcrumbs(breadcrumbs: Omit<BreadcrumbItem, 'isActive'>[]): void {
    const items = breadcrumbs.map((item, index) => ({
      ...item,
      isActive: index === breadcrumbs.length - 1,
      isClickable: index !== breadcrumbs.length - 1
    }));

    this._breadcrumbs.set(items);
  }

  /**
   * Add a breadcrumb item
   */
  addBreadcrumb(label: string, path: string): void {
    const current = this._breadcrumbs();

    // Mark previous items as not active and clickable
    const updated = current.map(item => ({
      ...item,
      isActive: false,
      isClickable: true
    }));

    // Add new item as active
    updated.push({
      label,
      path,
      isActive: true,
      isClickable: false
    });

    this._breadcrumbs.set(updated);
  }

  /**
   * Remove breadcrumbs after a specific index
   */
  trimBreadcrumbs(afterIndex: number): void {
    const current = this._breadcrumbs();
    if (afterIndex < current.length) {
      const trimmed = current.slice(0, afterIndex + 1);

      // Mark the last item as active
      if (trimmed.length > 0) {
        trimmed[trimmed.length - 1].isActive = true;
        trimmed[trimmed.length - 1].isClickable = false;
      }

      this._breadcrumbs.set(trimmed);
    }
  }

  /**
   * Clear all breadcrumbs
   */
  clearBreadcrumbs(): void {
    this._breadcrumbs.set([]);
  }

  // =========================================
  // SECTION 4 METHODS: ICON REGISTRY
  // =========================================

  /**
   * Load icons from JSON file
   */
  private async loadIcons(): Promise<void> {
    const url = '/assets/config/icons.json';

    try {
      if (this._iconDebugMode()) {
        console.log('📄 IconRegistry: start of loading...');
      }

      const data = await firstValueFrom(
        this.http.get<Partial<IconRegistry>>(url)
      );

      if (!data) {
        throw new Error('Empty data received');
      }

      const registry: IconRegistry = {
        defaults: {
          viewBox: '0 0 16 16',
          color: '#656d76',
          ...(data.defaults ?? {})
        },
        icons: {
          ...this.createEmptyRegistry().icons, // Keep fallback
          ...(data.icons ?? {})
        }
      };

      this._iconRegistry.set(registry);
      this._iconsLoaded.set(true);

      if (this._iconDebugMode()) {
        console.log('✅ IconRegistry: successful upload');
        console.log('📊 available icons:', Object.keys(registry.icons));
      }

    } catch (error) {
      console.error('❌ IconRegistry: loading error:', error);
      this._iconsError.set(true);

      // On error, use only fallback icon
      this._iconRegistry.set(this.createEmptyRegistry());
      this._iconsLoaded.set(true); // Mark as loaded even on error
    }
  }

  /**
   * Create empty icon registry with fallback
   */
  private createEmptyRegistry(): IconRegistry {
    return {
      defaults: { viewBox: '0 0 16 16', color: '#656d76' },
      icons: {
        'default-fallback': {
          viewBox: '0 0 16 16',
          circles: [{
            cx: 8,
            cy: 8,
            r: 6,
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: 1.5
          }]
        }
      }
    };
  }

  /**
   * Check if icon exists in registry
   */
  hasIcon(name: string): boolean {
    return this._iconRegistry().icons[name] !== undefined;
  }

  /**
   * Get icon definition by name
   */
  getIcon(name: string): IconDef | null {
    const registry = this._iconRegistry();
    return registry.icons[name] ?? registry.icons['default-fallback'] ?? null;
  }

  /**
   * Enable icon debug mode
   */
  enableIconDebug(): void {
    this._iconDebugMode.set(true);
  }

  /**
   * Disable icon debug mode
   */
  disableIconDebug(): void {
    this._iconDebugMode.set(false);
  }

  /**
   * Force reload icons (useful for development)
   */
  async reloadIcons(): Promise<void> {
    this._iconsLoaded.set(false);
    this._iconsError.set(false);
    await this.loadIcons();
  }
}
