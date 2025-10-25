/**
 * ATK API State Service
 * Unified state management service - Single Source of Truth for all ATK API components
 *
 * Responsibilities:
 * - Central state management with signals
 * - Event bus for component communication
 * - HTTP response caching
 * - LocalStorage persistence
 * - Log management
 *
 * @file atk-api-state.service.ts
 * @version 2.0.0
 * @architecture Signals-based with effects for reactive updates
 */

import { computed, inject, Injectable, signal } from '@angular/core';
import { ToolsService } from '@core/services/tools.service';

import type {
  AtkApiConnectionStatus,
  AtkApiEventPayload,
  AtkApiEventType,
  AtkApiLogLevel,
  BashData,
  IAtkApiCacheConfig,
  IAtkApiCacheEntry,
  IAtkApiColumn,
  IAtkApiConfig,
  IAtkApiEndpointConfig,
  IAtkApiEvent,
  IAtkApiLogEntry,
  IAtkApiResponseMetadata,
  IAtkApiSidebarField,
  IAtkApiUnifiedState
} from './atk-api.interfaces';

/**
 * Default state configuration
 */
const DEFAULT_STATE: IAtkApiUnifiedState = {
  configId: '',
  currentEndpoint: '',
  parameters: {},
  tableData: [],
  sidebarData: null,
  selectedRowData: null,
  loading: false,
  error: null,
  connectionStatus: 'disconnected',
  sidebarCollapsed: true,
  sidebarPinned: false,
  responseMetadata: null,
  lastUpdated: undefined
};

/**
 * Default cache configuration
 */
const DEFAULT_CACHE_CONFIG: IAtkApiCacheConfig = {
  enabled: true,
  defaultDuration: 300000, // 5 minutes
  maxEntries: 50,
  cacheErrors: false
};

/**
 * LocalStorage key prefix
 */
const STORAGE_KEY_PREFIX = 'atk-api-state-';

/**
 * Properties to persist in localStorage
 */
const PERSISTED_PROPERTIES = [
  'currentEndpoint',
  'parameters',
  'sidebarCollapsed',
  'sidebarPinned'
] as const;

@Injectable({ providedIn: 'root' })
export class AtkApiStateService {

  // ======================================================
  // DEPENDENCIES
  // ======================================================

  private readonly tools = inject(ToolsService);

  // ======================================================
  // PRIVATE SIGNALS (State)
  // ======================================================

  /** Main state - single source of truth */
  private readonly _state = signal<IAtkApiUnifiedState>(DEFAULT_STATE);
  /** Current configuration */
  private readonly _config = signal<IAtkApiConfig | null>(null);
  /** Dedicated signal for endpoint tracking (prevents effect loops) */
  private readonly _currentEndpoint = signal<string>('');
  /** Dedicated signal for parameters tracking (prevents effect loops) */
  private readonly _currentParameters = signal<Record<string, any>>({});
  /** Event history (last 100 events) */
  private readonly _events = signal<IAtkApiEvent[]>([]);
  /** Cache storage */
  private readonly _cache = signal<Map<string, IAtkApiCacheEntry>>(new Map());
  /** Cache configuration */
  private readonly _cacheConfig = signal<IAtkApiCacheConfig>(DEFAULT_CACHE_CONFIG);
  /** Persistence confirmation required */
  private readonly _persistenceConfirmed = signal<boolean>(false);

  // ======================================================
  // PUBLIC READONLY SIGNALS
  // ======================================================

  /** Public readonly state */
  readonly state = this._state.asReadonly();
  /** Public readonly configuration */
  readonly config = this._config.asReadonly();
  /** Public readonly events */
  readonly events = this._events.asReadonly();

  // ======================================================
  // COMPUTED SIGNALS - For effect tracking
  // ======================================================

  /**
   * Dedicated signal for endpoint tracking
   * Updated only when endpoint actually changes
   */
  readonly endpointSignal = this._currentEndpoint.asReadonly();

  /**
   * Dedicated signal for parameters tracking
   * Updated only when parameters actually change
   */
  readonly parametersSignal = this._currentParameters.asReadonly();

  /**
   * Combined computed for endpoint + parameters
   * Only recalculates when these specific signals change
   */
  readonly endpointContextSignal = computed(() => ({
    endpoint: this._currentEndpoint(),
    parameters: this._currentParameters()
  }));

  /**
   * Get current endpoint configuration
   */
  readonly currentEndpointConfig = computed<IAtkApiEndpointConfig | null>(() => {
    const config = this._config();
    const currentId = this._state().currentEndpoint;
    if (!config || !currentId) return null;
    return config.endpoints.find(ep => ep.id === currentId) || null;
  });

  /**
   * Get visible columns for current endpoint
   */
  readonly visibleColumns = computed<IAtkApiColumn[]>(() => {
    const endpointConfig = this.currentEndpointConfig();
    if (!endpointConfig) return [];
    return endpointConfig.columns.filter(col => col.visible !== false);
  });

  /**
   * Get sidebar fields for current endpoint
   */
  readonly sidebarFields = computed<IAtkApiSidebarField[]>(() => {
    const endpointConfig = this.currentEndpointConfig();
    if (!endpointConfig) return [];
    return endpointConfig.sidebarFields?.filter(field => field.visible !== false) || [];
  });

  /**
   * Get row detail fields for current endpoint
   */
  readonly rowDetailFields = computed<IAtkApiSidebarField[]>(() => {
    const endpointConfig = this.currentEndpointConfig();
    if (!endpointConfig) return [];
    return endpointConfig.rowDetailFields?.filter(field => field.visible !== false) || [];
  });

  /**
   * Check if current endpoint has sidebar data
   */
  readonly hasSidebarData = computed<boolean>(() => {
    const data = this._state().sidebarData;
    return data !== null && Object.keys(data).length > 0;
  });

  /**
   * Check if a row is selected
   */
  readonly hasSelectedRow = computed<boolean>(() => {
    return this._state().selectedRowData !== null;
  });

  /**
   * Get cache size
   */
  readonly cacheSize = computed<number>(() => {
    return this._cache().size;
  });

  // ======================================================
  // CONSTRUCTOR
  // ======================================================

  constructor() {
    // this.tools.consoleGroup({ // OFF AtkApiStateService -> constructor() ================ CONSOLE LOG IN PROGRESS
    //   title: 'AtkApiStateService -> constructor()', tag: 'recycle', palette: 'su', collapsed: true,
    //   data: { state: this._state() }
    // });

    // Setup cache cleanup effect
    this.setupCacheCleanup();
  }

  // ======================================================
  // INITIALIZATION
  // ======================================================

  /**
   * Initialize service with configuration
   * Must be called before using the service
   *
   * @param config - ATK API configuration
   * @param restoreFromStorage - Whether to attempt localStorage restoration
   */
  initialize(config: IAtkApiConfig, restoreFromStorage: boolean = true): void {
    this._config.set(config);
    let restored = false; // Try to restore from localStorage
    if (restoreFromStorage) { restored = this.loadFromLocalStorage(); }
    if (!restored) {
      const defaultEndpoint = config.defaultEndpoint || config.endpoints[0]?.id || '';
      this._state.update(s => ({
        ...s,
        configId: config.id,
        currentEndpoint: defaultEndpoint,
        parameters: {},
        connectionStatus: 'disconnected',
        lastUpdated: new Date()
      }));
      this._currentEndpoint.set(defaultEndpoint);      // Initialize dedicated tracking signals
      this._currentParameters.set({});
    } else {
      this._state.update(s => ({      // When restored, signals are already set by loadFromLocalStorage() / Just ensure config is set
        ...s,
        configId: config.id
      }));
    }
    this.emitEvent('state-initialized', {
      configId: config.id,
      defaultEndpoint: this._state().currentEndpoint
    });
    this.tools.consoleGroup({ // TAG AtkApiStateService -> initialize() ================ CONSOLE LOG IN PROGRESS
      title: `AtkApiStateService -> initialize(${config.id})`, tag: 'recycle', palette: 'in', collapsed: true,
      data: { config, state: this._state(), restored }
    });
  }

  // ======================================================
  // STATE MANAGEMENT - CONTEXT
  // ======================================================

  /**
   * Update current endpoint
   * Resets parameters, selection, and data
   *
   * @param endpointId - New endpoint ID
   */
  updateEndpoint(endpointId: string): void {
    const oldEndpoint = this._state().currentEndpoint;

    this._state.update(s => ({
      ...s,
      currentEndpoint: endpointId,
      parameters: {},
      selectedRowData: null,
      sidebarData: null,
      tableData: [],
      error: null,
      lastUpdated: new Date()
    }));

    // Update dedicated tracking signals
    this._currentEndpoint.set(endpointId);
    this._currentParameters.set({});

    this.emitEvent('endpoint-changed', {
      oldEndpoint,
      newEndpoint: endpointId
    });

    this.saveToLocalStorage();
    // this.tools.consoleGroup({ // OFF AtkApiStateService -> saveToLocalStorage() ================ CONSOLE LOG IN PROGRESS
    //   title: 'AtkApiStateService -> saveToLocalStorage()', tag: 'recycle', palette: 'in', collapsed: false,
    //   data: { oldEndpoint, newEndpoint: endpointId }
    // });
  }

  /**
   * Update endpoint parameters
   * Merges with existing parameters
   *
   * @param params - Parameters to update/add
   */
  updateParameters(params: Record<string, any>): void {
    const changedKeys = Object.keys(params);
    const newParams = { ...this._state().parameters, ...params };

    this._state.update(s => ({
      ...s,
      parameters: newParams,
      lastUpdated: new Date()
    }));

    // Update dedicated tracking signal
    this._currentParameters.set(newParams);

    this.emitEvent('parameters-updated', {
      parameters: params,
      changedKeys
    });

    this.saveToLocalStorage();
  }

  // ======================================================
  // STATE MANAGEMENT - DATA
  // ======================================================

  /**
   * Update table and sidebar data after API call
   *
   * @param tableData - Array of data rows
   * @param sidebarData - Global endpoint data (optional)
   */
  updateData(tableData: BashData[], sidebarData: Record<string, any> | null = null): void {
    this._state.update(s => ({
      ...s,
      tableData,
      sidebarData,
      error: null,
      lastUpdated: new Date()
    }));

    this.emitEvent('data-loaded', {
      endpoint: this._state().currentEndpoint,
      dataCount: tableData.length,
      responseTime: this._state().responseMetadata?.responseTime || 0,
      fromCache: this._state().responseMetadata?.fromCache || false
    });
  }

  /**
   * Update selected row data
   *
   * @param rowData - Selected row data (null to clear selection)
   */
  selectRow(rowData: BashData | null): void {
    const previousRowData = this._state().selectedRowData;

    this._state.update(s => ({
      ...s,
      selectedRowData: rowData,
      sidebarCollapsed: rowData ? false : s.sidebarCollapsed,
      lastUpdated: new Date()
    }));

    if (rowData) {
      const rowId = rowData.id || rowData.symbol || rowData.asset || 'unknown';
      this.emitEvent('row-selected', { rowData, rowId });
    } else {
      this.emitEvent('row-cleared', { previousRowData });
    }
  }

  /**
   * Clear selected row
   */
  clearSelectedRow(): void {
    this.selectRow(null);
  }

  // ======================================================
  // STATE MANAGEMENT - UI STATE
  // ======================================================

  /**
   * Set loading state
   *
   * @param loading - Loading indicator
   */
  setLoading(loading: boolean): void {
    this._state.update(s => ({ ...s, loading }));

    if (loading) {
      this.emitEvent('data-loading', {
        endpoint: this._state().currentEndpoint,
        parameters: this._state().parameters
      });
    }
  }

  /**
   * Set error message
   *
   * @param error - Error message (null to clear)
   */
  setError(error: string | null): void {
    this._state.update(s => ({
      ...s,
      error,
      loading: false,
      lastUpdated: new Date()
    }));

    if (error) {
      this.emitEvent('data-error', {
        endpoint: this._state().currentEndpoint,
        error
      });

      this.addLog(error, 'error', {
        endpoint: this._state().currentEndpoint,
        parameters: this._state().parameters
      });
    }
  }

  /**
   * Set connection status
   *
   * @param status - Connection status
   */
  setConnectionStatus(status: AtkApiConnectionStatus): void {
    this._state.update(s => ({ ...s, connectionStatus: status }));
  }

  /**
   * Set response metadata
   *
   * @param metadata - Response metadata from API call
   */
  setResponseMetadata(metadata: IAtkApiResponseMetadata): void {
    this._state.update(s => ({
      ...s,
      responseMetadata: metadata,
      lastUpdated: new Date()
    }));
  }

  /**
   * Toggle sidebar collapsed state
   */
  toggleSidebar(): void {
    const newState = !this._state().sidebarCollapsed;

    this._state.update(s => ({
      ...s,
      sidebarCollapsed: newState
    }));

    this.emitEvent('sidebar-toggled', {
      isCollapsed: newState
    });

    this.saveToLocalStorage();
  }

  /**
   * Toggle sidebar pinned state
   */
  toggleSidebarPin(): void {
    const newState = !this._state().sidebarPinned;

    this._state.update(s => ({
      ...s,
      sidebarPinned: newState
    }));

    this.emitEvent('sidebar-pinned', {
      isPinned: newState
    });

    this.saveToLocalStorage();
  }

  // ======================================================
  // CACHE MANAGEMENT
  // ======================================================

  /**
   * Get cached data by key
   * Returns null if not found or expired
   *
   * @param key - Cache key
   * @returns Cached data or null
   */
  getCache<T = any>(key: string): T | null {
    if (!this._cacheConfig().enabled) return null;

    const entry = this._cache().get(key);
    if (!entry) return null;

    const now = Date.now();
    const isExpired = now - entry.timestamp > entry.duration;

    if (isExpired) {
      this.deleteCacheEntry(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cache data
   *
   * @param key - Cache key
   * @param data - Data to cache
   * @param duration - Cache duration in ms (optional)
   */
  setCache<T = any>(key: string, data: T, duration?: number): void {
    if (!this._cacheConfig().enabled) return;

    const config = this._cacheConfig();
    const cacheDuration = duration || config.defaultDuration;

    const entry: IAtkApiCacheEntry<T> = {
      data,
      timestamp: Date.now(),
      duration: cacheDuration,
      key,
      endpointId: this._state().currentEndpoint
    };

    this._cache.update(cache => {
      const newCache = new Map(cache);
      newCache.set(key, entry);

      // Cleanup if max entries exceeded
      if (newCache.size > config.maxEntries) {
        this.cleanupOldestCacheEntries(newCache, 10);
      }

      return newCache;
    });
  }

  /**
   * Clear cache entries
   *
   * @param endpointId - Optional endpoint ID to clear specific endpoint cache
   */
  clearCache(endpointId?: string): void {
    let clearedCount = 0;

    if (endpointId) {
      // Clear specific endpoint cache
      this._cache.update(cache => {
        const newCache = new Map(cache);
        for (const [key, entry] of newCache.entries()) {
          if (entry.endpointId === endpointId) {
            newCache.delete(key);
            clearedCount++;
          }
        }
        return newCache;
      });
    } else {
      // Clear all cache
      clearedCount = this._cache().size;
      this._cache.set(new Map());
    }

    this.emitEvent('cache-cleared', {
      endpoint: endpointId,
      clearedCount
    });

    this.addLog(
      `Cache cleared: ${clearedCount} entries${endpointId ? ` for endpoint ${endpointId}` : ''}`,
      'info'
    );
  }

  /**
   * Build cache key from endpoint and parameters
   *
   * @param endpointId - Endpoint ID
   * @param params - Request parameters
   * @returns Cache key string
   */
  buildCacheKey(endpointId: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');

    return `${this._state().configId}:${endpointId}:${sortedParams}`;
  }

  /**
   * Setup automatic cache cleanup effect
   * Runs every minute to remove expired entries
   */
  private setupCacheCleanup(): void {
    // Run cleanup every minute
    setInterval(() => {
      if (!this._cacheConfig().enabled) return;
      const now = Date.now();
      let cleanedCount = 0;
      this._cache.update(cache => {
        const newCache = new Map(cache);
        for (const [key, entry] of newCache.entries()) {
          if (now - entry.timestamp > entry.duration) {
            newCache.delete(key);
            cleanedCount++;
          }
        }
        return newCache;
      });
      if (cleanedCount > 0) {
        // this.tools.consoleGroup({ // OFF AtkApiStateService -> setupCacheCleanup() ================ CONSOLE LOG IN PROGRESS
        //   title: 'AtkApiStateService -> setupCacheCleanup()', tag: 'recycle', palette: 'su', collapsed: true,
        //   data: { cleanedCount, remainingEntries: this._cache().size }
        // });
      }
    }, 60000); // 1 minute
  }

  /**
   * Delete single cache entry
   */
  private deleteCacheEntry(key: string): void {
    this._cache.update(cache => {
      const newCache = new Map(cache);
      newCache.delete(key);
      return newCache;
    });
  }

  /**
   * Cleanup oldest cache entries
   */
  private cleanupOldestCacheEntries(cache: Map<string, IAtkApiCacheEntry>, count: number): void {
    const entries = Array.from(cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, count);

    entries.forEach(([key]) => cache.delete(key));
  }

  // ======================================================
  // LOG MANAGEMENT
  // ======================================================

  /**
   * Add log entry
   * Emits 'log-added' event for bash component to display
   *
   * @param message - Log message
   * @param level - Log level
   * @param metadata - Additional metadata
   */
  addLog(message: string, level: AtkApiLogLevel = 'info', metadata?: any): void {
    const log: IAtkApiLogEntry = {
      timestamp: new Date(),
      message,
      level,
      metadata,
      source: 'AtkApiStateService'
    };
    // Emit as event (not stored in state)
    this.emitEvent('log-added' as AtkApiEventType, { log });
    // Also log to ToolsService for debugging
    if (level === 'error') {
      // this.tools.consoleGroup({ // TAG AtkApiStateService -> addLog(error) ================ CONSOLE LOG IN PROGRESS
      //   title: `AtkApiStateService -> addLog( ${message})`, tag: 'cross', palette: 'er', collapsed: true,
      //   data: { log }
      // });
    }
  }

  // ======================================================
  // EVENT BUS
  // ======================================================

  /**
   * Emit event to event bus
   * Events are limited to last 100
   *
   * @param type - Event type
   * @param payload - Event payload
   */
  emitEvent<T extends AtkApiEventType>(type: T, payload: AtkApiEventPayload<T>): void {
    const event: IAtkApiEvent = {
      type,
      payload,
      timestamp: new Date(),
      source: 'AtkApiStateService'
    };

    this._events.update(list => {
      const updated = [...list, event];
      // Keep only last 100 events
      return updated.length > 100 ? updated.slice(-100) : updated;
    });

    // Debug log for important events
    if (this.shouldLogEvent(type)) {
      // this.tools.consoleGroup({ // OFF AtkApiStateService -> emitEvent() ================ CONSOLE LOG IN PROGRESS
      //   title: `AtkApiStateService -> emitEvent(${type})`, tag: 'recycle', palette: 'ac', collapsed: true,
      //   data: { event, currentState: this._state() }
      // });
    }
  }

  /**
   * Determine if event should be logged to console
   */
  private shouldLogEvent(type: AtkApiEventType): boolean {
    const importantEvents: AtkApiEventType[] = [
      'data-loaded',
      'data-error',
      'endpoint-changed',
      'row-selected',
      'connection-tested',
      'state-initialized'
    ];

    return importantEvents.includes(type);
  }

  // ======================================================
  // LOCALSTORAGE PERSISTENCE
  // ======================================================

  /**
   * Save current state to localStorage
   * Only saves specific properties defined in PERSISTED_PROPERTIES
   */
  saveToLocalStorage(): void {
    if (!this._persistenceConfirmed()) return;

    const state = this._state();
    const configId = state.configId;

    if (!configId) return;

    const persistedState: any = {};
    PERSISTED_PROPERTIES.forEach(prop => {
      persistedState[prop] = state[prop];
    });

    const key = this.getStorageKey(configId);

    try {
      localStorage.setItem(key, JSON.stringify(persistedState));
    } catch (error: any) {
      this.tools.consoleGroup({ // TAG AtkApiStateService -> saveToLocalStorage(error) ================ CONSOLE LOG IN PROGRESS
        title: 'AtkApiStateService -> saveToLocalStorage(ERROR)', tag: 'cross', palette: 'er', collapsed: false,
        data: { error, configId }
      });
    }
  }

  /**
   * Load state from localStorage
   * Asks user confirmation before restoring
   *
   * @returns True if state was restored, false otherwise
   */
  loadFromLocalStorage(): boolean {
    const config = this._config();
    if (!config) return false;

    const key = this.getStorageKey(config.id);
    const stored = localStorage.getItem(key);

    if (!stored) return false;

    // Ask user confirmation
    const confirmed = confirm(
      `Restore previous session for ${config.title}?\n\n` +
      `This will restore your last endpoint, parameters, and sidebar preferences.`
    );

    if (!confirmed) {
      // User declined, clear storage
      this.clearLocalStorage();
      return false;
    }

    // User confirmed, enable persistence
    this._persistenceConfirmed.set(true);

    try {
      const persistedState = JSON.parse(stored);

      // After state update from localStorage
      this._state.update(s => ({
        ...s,
        ...persistedState,
        lastUpdated: new Date()
      }));

      // Synchronize dedicated tracking signals
      if (persistedState.currentEndpoint) {
        this._currentEndpoint.set(persistedState.currentEndpoint);
      }
      if (persistedState.parameters) {
        this._currentParameters.set(persistedState.parameters);
      }

      this.tools.consoleGroup({ // TAG AtkApiStateService -> loadFromLocalStorage(SUCCESS) ================ CONSOLE LOG IN PROGRESS
        title: 'AtkApiStateService -> loadFromLocalStorage(SUCCESS) ', tag: 'recycle', palette: 'su', collapsed: true,
        data: { persistedState: persistedState }
      });

      return true;
    } catch (error: any) {
      this.tools.consoleGroup({ // TAG AtkApiStateService -> loadFromLocalStorage(ERROR) ================ CONSOLE LOG IN PROGRESS
        title: 'AtkApiStateService -> loadFromLocalStorage(ERROR) ', tag: 'cross', palette: 'er', collapsed: false,
        data: { error, key }
      });

      return false;
    }
  }

  /**
   * Clear localStorage for current config
   */
  clearLocalStorage(): void {
    const configId = this._state().configId;
    if (!configId) return;

    const key = this.getStorageKey(configId);
    localStorage.removeItem(key);
    this._persistenceConfirmed.set(false);

    this.tools.consoleGroup({ // TAG AtkApiStateService -> clearLocalStorage() ================ CONSOLE LOG IN PROGRESS
      title: 'AtkApiStateService -> clearLocalStorage()', tag: 'recycle', palette: 'in', collapsed: true,
      data: { configId, key }
    });
  }

  /**
   * Get localStorage key for config
   */
  private getStorageKey(configId: string): string {
    return `${STORAGE_KEY_PREFIX}${configId}`;
  }

  // ======================================================
  // UTILITIES
  // ======================================================

  /**
   * Get current state snapshot (immutable copy)
   */
  getStateSnapshot(): Readonly<IAtkApiUnifiedState> {
    return { ...this._state() };
  }

  /**
   * Reset state to initial values
   * Clears cache and localStorage
   */
  resetState(reason?: string): void {
    this._state.set(DEFAULT_STATE);
    this._config.set(null);
    this._events.set([]);
    // Reset dedicated tracking signals
    this._currentEndpoint.set('');
    this._currentParameters.set({});
    this.clearCache();
    this.clearLocalStorage();
    this.emitEvent('state-reset', { reason });
    this.tools.consoleGroup({ // TAG AtkApiStateService -> resetState() ================ CONSOLE LOG IN PROGRESS
      title: 'AtkApiStateService -> resetState()', tag: 'cross', palette: 'wa', collapsed: true,
      data: { reason, state: this._state() }
    });
  }

  /**
   * Clear all data (keep context and UI state)
   */
  clearData(): void {
    this._state.update(s => ({
      ...s,
      tableData: [],
      sidebarData: null,
      selectedRowData: null,
      error: null,
      responseMetadata: null,
      lastUpdated: new Date()
    }));
  }

  /**
   * Update cache configuration
   */
  updateCacheConfig(config: Partial<IAtkApiCacheConfig>): void {
    this._cacheConfig.update(current => ({
      ...current,
      ...config
    }));
  }
}
