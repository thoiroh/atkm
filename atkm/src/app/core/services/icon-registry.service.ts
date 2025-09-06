import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, shareReplay } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

export interface IconCircle { cx: number; cy: number; r: number; }
export interface IconDef { viewBox?: string; paths?: string[]; circles?: IconCircle[]; }
export interface IconRegistry {
  defaults: { viewBox: string; color: string };
  icons: Record<string, IconDef>;
}

const EMPTY: IconRegistry = {
  defaults: { viewBox: '0 0 16 16', color: '#656d76' },
  icons: {}
};

@Injectable({ providedIn: 'root' })
export class IconRegistryService {
  private http = inject(HttpClient);
  private url = '/assets/config/icons.json';

  private registry$ = this.http.get<Partial<IconRegistry>>(this.url).pipe(
    map(r => ({
      defaults: { viewBox: '0 0 16 16', color: '#656d76', ...(r.defaults ?? {}) },
      icons: r.icons ?? {}
    })),
    shareReplay(1)
  );

  /** Signal lisible directement dans les composants */
  registry = toSignal(this.registry$, { initialValue: EMPTY });
}
