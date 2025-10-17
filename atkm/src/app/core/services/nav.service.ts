import { computed, Injectable, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs/operators';

export interface NavigationItem {
  path: string;
  label: string;
  icon?: string;
  isActive: boolean;
  category: 'binance' | 'ibkr' | 'home' | 'other';
}

@Injectable({
  providedIn: 'root'
})
export class NavService {
  // Current active route
  private currentRoute = signal<string>('/landing/home');

  // Navigation items with active state
  private navigationItems = signal<NavigationItem[]>([
    {
      path: '/landing/home',
      label: 'Home',
      icon: 'home',
      isActive: true,
      category: 'home'
    },
    {
      path: '/landing/binance/account',
      label: 'Account History',
      icon: 'repo',
      isActive: false,
      category: 'binance'
    },
    {
      path: '/landing/binance/snapshot',
      label: 'Account Snapshot',
      icon: 'repo',
      isActive: false,
      category: 'binance'
    },
    {
      path: '/landing/binance/market-data',
      label: 'Live Market Data',
      icon: 'repo',
      isActive: false,
      category: 'binance'
    },
    {
      path: '/landing/ibkr/account',
      label: 'Account History',
      icon: 'repo',
      isActive: false,
      category: 'ibkr'
    },
    {
      path: '/landing/ibkr/snapshot',
      label: 'Account Snapshot',
      icon: 'repo',
      isActive: false,
      category: 'ibkr'
    },
    {
      path: '/landing/ibkr/market-data',
      label: 'Live Market Data',
      icon: 'repo',
      isActive: false,
      category: 'ibkr'
    }
  ]);

  // Computed properties
  public readonly currentRoute$ = this.currentRoute.asReadonly();
  public readonly navigationItems$ = this.navigationItems.asReadonly();

  public readonly binanceItems = computed(() =>
    this.navigationItems().filter(item => item.category === 'binance')
  );

  public readonly ibkrItems = computed(() =>
    this.navigationItems().filter(item => item.category === 'ibkr')
  );

  public readonly activeItem = computed(() =>
    this.navigationItems().find(item => item.isActive)
  );

  constructor(private router: Router) {
    // Listen to route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(event => (event as NavigationEnd).urlAfterRedirects)
    ).subscribe(url => {
      this.updateActiveRoute(url);
    });
  }

  /**
   * Navigate to a specific route
   */
  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  /**
   * Update active route and navigation items
   */
  private updateActiveRoute(url: string): void {
    this.currentRoute.set(url);

    // Update navigation items active state
    const items = this.navigationItems().map(item => ({
      ...item,
      isActive: item.path === url
    }));

    this.navigationItems.set(items);
  }

  /**
   * Get navigation items by category
   */
  getItemsByCategory(category: 'binance' | 'ibkr' | 'home'): NavigationItem[] {
    return this.navigationItems().filter(item => item.category === category);
  }

  /**
   * Check if a route is currently active
   */
  isRouteActive(path: string): boolean {
    return this.currentRoute() === path;
  }

  /**
   * Get current category based on active route
   */
  getCurrentCategory(): string {
    const activeItem = this.activeItem();
    return activeItem ? activeItem.category : 'home';
  }
}
