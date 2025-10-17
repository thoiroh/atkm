import { HttpClient } from '@angular/common/http';
import { Injectable, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface IconCircle {
  cx: number; cy: number; r: number;
  fill?: string | null; stroke?: string | null; strokeWidth?: number;
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

@Injectable({ providedIn: 'root' })

export class IconService {
  private http = inject(HttpClient);
  private url = '/assets/config/icons.json';
  // HACK IconService -> Signals for service status ====================================================
  private _registry = signal<IconRegistry>(this.createEmptyRegistry());
  private _isLoaded = signal<boolean>(false);
  private _hasError = signal<boolean>(false);
  private _debugMode = signal<boolean>(false);

  // Signaux publics en lecture seule
  readonly registry = this._registry.asReadonly();
  readonly isLoaded = this._isLoaded.asReadonly();
  readonly hasError = this._hasError.asReadonly();

  constructor() {
    // HACK IconService -> Effect to load icons at first injection =======================================
    effect(() => {
      if (!this._isLoaded() && !this._hasError()) {
        this.loadIcons();
      }
    });
  }

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

  private async loadIcons(): Promise<void> {
    try {
      if (this._debugMode()) {
        console.log('🔄 IconRegistry: start of loading...');
      }
      const data = await firstValueFrom(this.http.get<Partial<IconRegistry>>(this.url));
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
          ...this.createEmptyRegistry().icons, // Garde le fallback
          ...(data.icons ?? {})
        }
      };
      this._registry.set(registry);
      this._isLoaded.set(true);
      if (this._debugMode()) {
        console.log('✅ IconRegistry: successful upload');
        console.log('📊 available icons:', Object.keys(registry.icons));
      }

    } catch (error) {
      console.error('❌ IconRegistry: loading error:', error);
      this._hasError.set(true);

      // En cas d'erreur, utiliser seulement l'icône de fallback
      this._registry.set(this.createEmptyRegistry());
      this._isLoaded.set(true); // Marquer comme chargé même en erreur
    }
  }

  // ============================ TOOLS  ==============================================================================

  hasIcon(name: string): boolean {
    return this._registry().icons[name] !== undefined;
  }

  getIcon(name: string): IconDef | null {
    const registry = this._registry();
    return registry.icons[name] ?? registry.icons['default-fallback'] ?? null;
  }

  enableDebug(): void {
    this._debugMode.set(true);
  }

  disableDebug(): void {
    this._debugMode.set(false);
  }

  // Force reload (useful for development)
  async reload(): Promise<void> {
    this._isLoaded.set(false);
    this._hasError.set(false);
    await this.loadIcons();
  }
}
