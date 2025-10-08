// atk-bash.service.ts
// Service for managing bash configurations and data loading

import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BashData, BashDataLoader, IBashConfig, IBashEndpointConfig, IBashEvent } from '@shared/components/atk-bash/atk-bash.interfaces';
import { BehaviorSubject, Observable, catchError, map, of, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class AtkBashService {

  // Configuration storage
  private configs = new Map<string, IBashConfig>();
  private configsSubject = new BehaviorSubject<Map<string, IBashConfig>>(new Map());

  public configs$ = this.configsSubject.asObservable();

  // Global events stream
  private eventsSubject = new BehaviorSubject<IBashEvent[]>([]);

  public events$ = this.eventsSubject.asObservable();

  // Cache for API responses
  private cache = new Map<string, { data: any; timestamp: number; duration: number }>();

  constructor(private http: HttpClient) { }

  /**
   * Register a new bash configuration
   */
  registerConfig(config: IBashConfig): void {
    this.configs.set(config.id, config);
    this.configsSubject.next(new Map(this.configs));
    this.emitEvent('endpoint-changed', { configId: config.id, config });
  }

  /**
   * Get configuration by ID
   */
  getConfig(configId: string): IBashConfig | undefined {
    return this.configs.get(configId);
  }

  /**
   * Update configuration
   */
  updateConfig(configId: string, updates: Partial<IBashConfig>): void {
    const existing = this.configs.get(configId);
    if (existing) {
      const updated = { ...existing, ...updates };
      this.configs.set(configId, updated);
      this.configsSubject.next(new Map(this.configs));
    }
  }

  /**
   * Load configurations from JSON file
   */
  loadConfigsFromFile(filePath: string): Observable<IBashConfig[]> {
    return this.http.get<IBashConfig[]>(filePath).pipe(
      tap(configs => {
        configs.forEach(config => this.registerConfig(config));
      }),
      catchError(error => {
        console.error('Error loading bash configs:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Generic data loader method
   */
  loadData<T = BashData>(
    configId: string,
    endpointId: string,
    params: Record<string, any> = {}
  ): Observable<T[]> {
    const config = this.getConfig(configId);
    if (!config) {
      return throwError(() => new Error(`Configuration ${configId} not found`));
    }

    const endpoint = config.endpoints.find(ep => ep.id === endpointId);
    if (!endpoint) {
      return throwError(() => new Error(`Endpoint ${endpointId} not found in config ${configId}`));
    }

    // Check cache first
    const cacheKey = this.getCacheKey(endpoint, params);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.emitEvent('data-loaded', {
        configId,
        endpointId,
        data: cached,
        fromCache: true
      });
      // return of(cached as T[]);
      return of(cached) as Observable<T[]>;
    }

    // Make HTTP request
    return this.makeRequest<T>(endpoint, params).pipe(
      map(responseData => {
        // Apply data transformer if available
        const transformedData = endpoint.dataTransformer
          ? endpoint.dataTransformer(responseData)
          : Array.isArray(responseData) ? responseData : [responseData];

        // Cache the result if cacheable
        if (endpoint.cacheable) {
          this.setCache(cacheKey, Array.isArray(transformedData) ? transformedData : [transformedData], endpoint.cacheDuration || 300000);
        }

        return transformedData as T[];
      }),
      tap(data => {
        this.emitEvent('data-loaded', {
          configId,
          endpointId,
          data,
          fromCache: false
        });
      }),
      catchError(error => {
        this.emitEvent('error', {
          configId,
          endpointId,
          error: error.message
        });
        return throwError(() => error);
      })
    );
  }

  /**
   * Test endpoint connection
   */
  testEndpoint(
    configId: string,
    endpointId: string,
    params: Record<string, any> = {}
  ): Observable<{ success: boolean; responseTime: number; statusCode?: number; error?: string }> {
    const startTime = performance.now();

    return this.loadData(configId, endpointId, params).pipe(
      map(data => ({
        success: true,
        responseTime: Math.round(performance.now() - startTime),
        dataCount: data.length
      })),
      catchError((error: HttpErrorResponse) => {
        return of({
          success: false,
          responseTime: Math.round(performance.now() - startTime),
          statusCode: error.status,
          error: error.message
        });
      })
    );
  }

  /**
   * Get available endpoints for a configuration
   */
  getEndpoints(configId: string): IBashEndpointConfig[] {
    const config = this.getConfig(configId);
    return config?.endpoints || [];
  }

  /**
   * Clear cache for specific endpoint or all
   */
  clearCache(endpointId?: string): void {
    if (endpointId) {
      // Clear cache for specific endpoint
      const keysToDelete = Array.from(this.cache.keys()).filter(key =>
        key.includes(endpointId)
      );
      keysToDelete.forEach(key => this.cache.delete(key));
    } else {
      // Clear all cache
      this.cache.clear();
    }
  }

  /**
   * Create a custom data loader for specific use cases
   */
  createDataLoader<T = BashData>(
    customLoader: (endpoint: IBashEndpointConfig, params?: Record<string, any>) => Observable<T[]>
  ): BashDataLoader<T> {
    return customLoader;
  }

  // Private helper methods

  private makeRequest<T>(
    endpoint: IBashEndpointConfig,
    params: Record<string, any>
  ): Observable<T> {
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

    switch (endpoint.method) {
      case 'GET':
        return this.http.get<T>(url, options);
      case 'POST':
        return this.http.post<T>(url, endpoint.body, options);
      case 'PUT':
        return this.http.put<T>(url, endpoint.body, options);
      case 'DELETE':
        return this.http.delete<T>(url, options);
      case 'PATCH':
        return this.http.patch<T>(url, endpoint.body, options);
      default:
        throw new Error(`Unsupported HTTP method: ${endpoint.method}`);
    }
  }

  private buildUrl(baseUrl: string, params: Record<string, any>): string {
    let url = baseUrl;

    // Replace path parameters (e.g., /users/{userId} -> /users/123)
    Object.keys(params).forEach(key => {
      const placeholder = `{${key}}`;
      if (url.includes(placeholder)) {
        url = url.replace(placeholder, params[key].toString());
        delete params[key]; // Remove from query params
      }
    });

    return url;
  }

  private getCacheKey(endpoint: IBashEndpointConfig, params: Record<string, any>): string {
    const paramString = JSON.stringify(params, Object.keys(params).sort());
    return `${endpoint.id}_${endpoint.url}_${paramString}`;
  }

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

  private setCache<T>(key: string, data: T[], duration: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      duration
    });
  }

  private emitEvent(type: IBashEvent['type'], payload: any): void {
    const event: IBashEvent = {
      type,
      payload,
      timestamp: new Date()
    };

    const currentEvents = this.eventsSubject.value;
    const updatedEvents = [...currentEvents, event];

    // Keep only last 100 events to prevent memory issues
    if (updatedEvents.length > 100) {
      updatedEvents.splice(0, updatedEvents.length - 100);
    }

    this.eventsSubject.next(updatedEvents);
  }
}
