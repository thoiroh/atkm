import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

export interface IconCircle { cx: number; cy: number; r: number; }
export interface IconDef { viewBox?: string; paths?: string[]; circles?: IconCircle[]; }
export interface IconRegistry {
  defaults?: { viewBox?: string; color?: string; };
  icons: Record<string, IconDef>;
}

@Injectable({ providedIn: 'root' })
export class IconRegistryService {
  private http = inject(HttpClient);

  private registry$?: Observable<IconRegistry>;
  private url = '/assets/config/icons.json';

  getRegistry(): Observable<IconRegistry> {
    if (!this.registry$) {
      this.registry$ = this.http.get<IconRegistry>(this.url).pipe(
        // sanity defaults
        map(r => ({ defaults: { viewBox: '0 0 16 16', color: '#656d76', ...(r.defaults || {}) }, icons: r.icons || {} })),
        shareReplay(1)
      );
    }
    return this.registry$;
  }

  /** Renvoie une icône par clé, avec fallback */
  getIcon(key: string): Observable<{ def: IconDef; viewBox: string; }> {
    return this.getRegistry().pipe(
      map(reg => {
        const def = reg.icons[key] ?? reg.icons['repo'] ?? { paths: [] };
        const viewBox = def.viewBox ?? reg.defaults?.viewBox ?? '0 0 16 16';
        return { def, viewBox };
      })
    );
  }
}
