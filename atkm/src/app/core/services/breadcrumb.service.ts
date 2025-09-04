import { Injectable, signal, computed } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter, map } from 'rxjs/operators';

export interface BreadcrumbItem {
  label: string;
  path: string;
  isActive: boolean;
  isClickable: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class BreadcrumbService {
  private breadcrumbs = signal<BreadcrumbItem[]>([]);

  public readonly breadcrumbs$ = this.breadcrumbs.asReadonly();
  
  public readonly breadcrumbString = computed(() => 
    this.breadcrumbs().map(item => item.label).join(' > ')
  );

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    // Listen to route changes and build breadcrumbs
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.buildBreadcrumbs();
    });
  }

  /**
   * Build breadcrumbs from current route
   */
  private buildBreadcrumbs(): void {
    const breadcrumbs: BreadcrumbItem[] = [];
    let route = this.activatedRoute.root;
    let url = '';

    while (route) {
      if (route.snapshot.data['breadcrumb']) {
        url += '/' + route.snapshot.url.map(segment => segment.path).join('/');
        
        breadcrumbs.push({
          label: route.snapshot.data['breadcrumb'],
          path: url,
          isActive: false,
          isClickable: true
        });
      }
      
      route = route.firstChild;
    }

    // Mark the last item as active and not clickable
    if (breadcrumbs.length > 0) {
      const lastItem = breadcrumbs[breadcrumbs.length - 1];
      lastItem.isActive = true;
      lastItem.isClickable = false;
    }

    // Always add Dashboard as root if not present
    if (breadcrumbs.length === 0 || breadcrumbs[0].label !== 'Dashboard') {
      breadcrumbs.unshift({
        label: 'Dashboard',
        path: '/dashboard',
        isActive: breadcrumbs.length === 0,
        isClickable: breadcrumbs.length > 0
      });
    }

    this.breadcrumbs.set(breadcrumbs);
  }

  /**
   * Navigate to a breadcrumb item
   */
  navigateTo(breadcrumb: BreadcrumbItem): void {
    if (breadcrumb.isClickable) {
      this.router.navigate([breadcrumb.path]);
    }
  }

  /**
   * Get breadcrumb path for navbar display
   */
  getBreadcrumbPath(): string[] {
    return this.breadcrumbs().map(item => item.label);
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
    
    this.breadcrumbs.set(items);
  }

  /**
   * Add a breadcrumb item
   */
  addBreadcrumb(label: string, path: string): void {
    const current = this.breadcrumbs();
    
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

    this.breadcrumbs.set(updated);
  }

  /**
   * Remove breadcrumbs after a specific index
   */
  trimBreadcrumbs(afterIndex: number): void {
    const current = this.breadcrumbs();
    if (afterIndex < current.length) {
      const trimmed = current.slice(0, afterIndex + 1);
      
      // Mark the last item as active
      if (trimmed.length > 0) {
        trimmed[trimmed.length - 1].isActive = true;
        trimmed[trimmed.length - 1].isClickable = false;
      }
      
      this.breadcrumbs.set(trimmed);
    }
  }

  /**
   * Clear all breadcrumbs
   */
  clearBreadcrumbs(): void {
    this.breadcrumbs.set([]);
  }
}