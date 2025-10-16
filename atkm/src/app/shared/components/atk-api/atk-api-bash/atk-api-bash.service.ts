// atk-bash.service.v03.ts
// ======================================================
// FULL SIGNALS VERSION (Angular 20+)
// ------------------------------------------------------
// Service de gestion du terminal Bash ATK, version 3
// - Basé sur Signals Angular
// - Suppression complète de RxJS réactif (plus de Subject/Observable)
// - Utilisation ponctuelle de firstValueFrom() pour HttpClient
// ======================================================

import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { effect, inject, Injectable, signal } from '@angular/core';
import { BashData, IBashConfig, IBashEndpointConfig, IBashEvent } from '@shared/components/atk-bash/atk-bash.interfaces';
import { ToolsService } from '@shared/services/tools.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class AtkApiBashService {

  private readonly tools = inject(ToolsService);

  // ======================================================
  // SIGNALS PUBLICS
  // ======================================================

  /** Toutes les configurations enregistrées */
  configs = signal<Map<string, IBashConfig>>(new Map());
  /** Liste des événements récents (max 100) */
  events = signal<IBashEvent[]>([]);
  /** Dernières données chargées */
  lastData = signal<BashData[]>([]);
  /** Dernière erreur rencontrée */
  lastError = signal<string | null>(null);
  /** Indicateur global de chargement */
  loading = signal<boolean>(false);

  // ======================================================
  // CACHE LOCAL
  // ======================================================

  private cache = new Map<string, { data: any; timestamp: number; duration: number }>();

  constructor(private http: HttpClient) {
    this.tools.consoleGroup({ // TAG AtkApiBashService -> constructor() ================ CONSOLE LOG IN PROGRESS
      title: `AtkApiBashService -> constructor()`, tag: 'recycle', palette: 'su', collapsed: true,
      data: null
    });

    // Nettoyage automatique du cache via effect
    effect(() => {
      const now = Date.now();
      this.cache.forEach((value, key) => {
        if (now - value.timestamp > value.duration) {
          this.cache.delete(key);
        }
      });
    });
  }

  // ======================================================
  // MÉTHODES DE CONFIGURATION
  // ======================================================

  /** Enregistre une nouvelle configuration */
  registerConfig(config: IBashConfig): void {
    const updated = new Map(this.configs());
    updated.set(config.id, config);
    this.configs.set(updated);
    this.emitEvent('endpoint-changed', { configId: config.id, config });
  }

  /** Récupère une configuration */
  getConfig(configId: string): IBashConfig | undefined {
    return this.configs().get(configId);
  }

  /** Met à jour une configuration existante */
  updateConfig(configId: string, updates: Partial<IBashConfig>): void {
    const existing = this.configs().get(configId);
    if (existing) {
      const updated = { ...existing, ...updates };
      const configsCopy = new Map(this.configs());
      configsCopy.set(configId, updated);
      this.configs.set(configsCopy);
    }
  }

  // ======================================================
  // MÉTHODES DE DONNÉES
  // ======================================================

  /**
   * Charge les données depuis un endpoint spécifique.
   * Typage strict : T doit hériter de BashData.
   */
  async loadData<T extends BashData = BashData>(
    configId: string,
    endpointId: string,
    params: Record<string, any> = {}
  ): Promise<T[]> {
    const config = this.getConfig(configId);
    if (!config) {
      const errorMsg = `Configuration ${configId} not found`;
      this.lastError.set(errorMsg);
      this.emitEvent('error', { configId, error: errorMsg });
      return [];
    }

    const endpoint = config.endpoints.find(ep => ep.id === endpointId);
    if (!endpoint) {
      const errorMsg = `Endpoint ${endpointId} not found in config ${configId}`;
      this.lastError.set(errorMsg);
      this.emitEvent('error', { configId, error: errorMsg });
      return [];
    }

    const cacheKey = this.getCacheKey(endpoint, params);
    const cached = this.getFromCache<T>(cacheKey);

    if (cached) {
      this.emitEvent('data-loaded', {
        configId,
        endpointId,
        data: cached,
        fromCache: true
      });
      this.lastData.set(cached as BashData[]);
      return cached;
    }

    this.loading.set(true);

    try {
      const rawData = await this.makeRequest<T>(endpoint, params);

      // --- Normalisation du résultat ---
      let transformed: BashData[] = [];

      if (endpoint.dataTransformer) {
        // On suppose un IBashDataTransformResult
        const output = endpoint.dataTransformer(rawData);
        transformed = output.tableData || [];
      } else if (Array.isArray(rawData)) {
        transformed = rawData as BashData[];
      } else {
        transformed = [rawData as BashData];
      }

      // --- Caching ---
      if (endpoint.cacheable) {
        this.setCache(cacheKey, transformed, endpoint.cacheDuration || 300000);
      }

      // --- Mise à jour des signaux ---
      this.lastData.set(transformed);
      this.lastError.set(null);

      this.emitEvent('data-loaded', {
        configId,
        endpointId,
        data: transformed,
        fromCache: false
      });

      return transformed as T[];
    } catch (error: any) {
      const message = error.message || 'Unknown error while loading data';
      this.lastError.set(message);
      this.emitEvent('error', { configId, endpointId, error: message });
      return [];
    } finally {
      this.loading.set(false);
    }
  }

  /** Teste un endpoint (latence + succès) */
  async testEndpoint(
    configId: string,
    endpointId: string,
    params: Record<string, any> = {}
  ): Promise<{ success: boolean; responseTime: number; error?: string }> {
    const start = performance.now();
    try {
      await this.loadData(configId, endpointId, params);
      return {
        success: true,
        responseTime: Math.round(performance.now() - start)
      };
    } catch (error: any) {
      return {
        success: false,
        responseTime: Math.round(performance.now() - start),
        error: error.message
      };
    }
  }

  /** Retourne les endpoints disponibles */
  getEndpoints(configId: string): IBashEndpointConfig[] {
    return this.getConfig(configId)?.endpoints || [];
  }

  /** Vide le cache (global ou partiel) */
  clearCache(endpointId?: string): void {
    if (endpointId) {
      Array.from(this.cache.keys())
        .filter(key => key.includes(endpointId))
        .forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
  }

  // ======================================================
  // MÉTHODES PRIVÉES
  // ======================================================

  /** Requête HTTP utilisant firstValueFrom() */
  private async makeRequest<T>(
    endpoint: IBashEndpointConfig,
    params: Record<string, any>
  ): Promise<T> {
    const url = this.buildUrl(endpoint.url, params);
    const headers = new HttpHeaders(endpoint.headers || {});

    let httpParams = new HttpParams();
    const queryParams = { ...endpoint.params, ...params };

    Object.keys(queryParams).forEach(key => {
      if (queryParams[key] !== undefined && queryParams[key] !== null) {
        httpParams = httpParams.set(key, queryParams[key].toString());
      }
    });

    const options = { headers, params: httpParams };
    const method = endpoint.method.toUpperCase();

    // --- HttpClient toujours Observable => conversion par firstValueFrom() ---
    switch (method) {
      case 'GET':
        return await firstValueFrom(this.http.get<T>(url, options));
      case 'POST':
        return await firstValueFrom(this.http.post<T>(url, endpoint.body, options));
      case 'PUT':
        return await firstValueFrom(this.http.put<T>(url, endpoint.body, options));
      case 'DELETE':
        return await firstValueFrom(this.http.delete<T>(url, options));
      case 'PATCH':
        return await firstValueFrom(this.http.patch<T>(url, endpoint.body, options));
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
  }

  /** Construit l’URL avec remplacement de paramètres {id} */
  private buildUrl(baseUrl: string, params: Record<string, any>): string {
    let url = baseUrl;
    Object.keys(params).forEach(key => {
      const placeholder = `{${key}}`;
      if (url.includes(placeholder)) {
        url = url.replace(placeholder, params[key].toString());
        delete params[key];
      }
    });
    return url;
  }

  /** Clé de cache unique */
  private getCacheKey(endpoint: IBashEndpointConfig, params: Record<string, any>): string {
    const paramString = JSON.stringify(params, Object.keys(params).sort());
    return `${endpoint.id}_${endpoint.url}_${paramString}`;
  }

  /** Lecture du cache */
  private getFromCache<T>(key: string): T[] | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    const now = Date.now();
    if (now - cached.timestamp > cached.duration) {
      this.cache.delete(key);
      return null;
    }
    return cached.data as T[];
  }

  /** Écriture du cache */
  private setCache<T>(key: string, data: T[], duration: number): void {
    this.cache.set(key, { data, timestamp: Date.now(), duration });
  }

  /** Ajoute un événement dans le signal global */
  private emitEvent(type: IBashEvent['type'], payload: any): void {
    const event: IBashEvent = { type, payload, timestamp: new Date() };
    this.events.update(list => {
      const updated = [...list, event];
      return updated.length > 100 ? updated.slice(-100) : updated;
    });
  }
}
