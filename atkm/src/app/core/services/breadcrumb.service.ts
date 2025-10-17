import { computed, Injectable, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

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
  /**
 * Build breadcrumbs from current route
 */
  private buildBreadcrumbs(): void {
    const breadcrumbs: BreadcrumbItem[] = [];
    let route: ActivatedRoute | null = this.activatedRoute.root; // ✅ peut devenir null via firstChild
    let url = '';

    while (route) {
      const data = route.snapshot?.data;
      const hasLabel = !!data?.['breadcrumb'];

      // Concatène l'URL du segment courant si présent
      const segment = route.snapshot?.url?.map(s => s.path).join('/') ?? '';
      if (segment) {
        url += '/' + segment;
      }

      if (hasLabel) {
        breadcrumbs.push({
          label: data!['breadcrumb'],
          path: url || '/',         // évite une path vide
          isActive: false,
          isClickable: true
        });
      }

      route = route.firstChild ?? null; // ✅ peut être null
    }

    // Marque le dernier item comme actif/non cliquable
    if (breadcrumbs.length > 0) {
      const last = breadcrumbs[breadcrumbs.length - 1];
      last.isActive = true;
      last.isClickable = false;
    }

    // Ajoute toujours "Dashboard" en racine si absent
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
