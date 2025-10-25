/**
 * ATK API Unified Interfaces
 * Central type definitions for the ATK API component architecture
 * Supports multiple API domains (Binance, IBKR, etc.) with a generic configuration system
 *
 * @file atk-api.interfaces.ts
 * @version 2.0.0
 * @architecture Unified State Management with Single Source of Truth
 */

import { TemplateRef } from '@angular/core';


// ============================================
// 1. CORE DATA TYPES
// ============================================

/**
 * Generic data type that can be displayed in tables and processed by the API system
 * Any object with string keys and any values
 */
export type BashData = Record<string, any>;

/**
 * Terminal state for debugging information
 */
export interface IBashTerminalState {
  /** Current endpoint being used */
  currentEndpoint?: string;
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error?: string;
  /** Connection status */
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  /** Request parameters */
  requestParams?: Record<string, any>;
  /** Response metadata */
  responseMetadata?: {
    statusCode?: number;
    responseTime?: number;
    dataCount?: number;
  };
}

/**
 * Configuration for a sidebar field display
 */
export interface IBashSidebarField {
  /** Unique identifier for the field */
  key: string;
  /** Display label for the field */
  label: string;
  /** Data type for formatting */
  type?: 'text' | 'number' | 'boolean' | 'date' | 'status' | 'custom';
  /** Custom formatter function */
  formatter?: (value: any) => string;
  /** CSS class for styling */
  cssClass?: string;
  /** Whether field is visible */
  visible?: boolean;
  /** Field group/category */
  group?: string;
  /** Field icon */
  icon?: string;
}

/**
 * Configuration for a data column in the bash table
 * UNIFIED with datatable column interface
 */
export interface IBashColumn<T = BashData> {
  /** Unique identifier for the column */
  key: string;
  /** Display label for the column header */
  label: string;
  /** Column width (CSS value) */
  width?: string;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  /** Data type for formatting */
  type?: 'text' | 'number' | 'currency' | 'percentage' | 'date' | 'boolean' | 'badge' | 'custom';
  /** Whether the column is sortable */
  sortable?: boolean;
  /** Custom formatter function */
  formatter?: (value: any, row?: T) => string;
  /** Custom template for the cell */
  template?: TemplateRef<any>;
  /** CSS class for styling */
  cssClass?: string;
  /** Whether column is visible */
  visible?: boolean;
}

/**
 * Data transformation result for endpoint responses
 */
export interface IBashDataTransformResult {
  /** Data for sidebar display */
  sidebarData: Record<string, any>;
  /** Data for table display */
  tableData: BashData[];
}

/**
 * Configuration for API endpoint and data source - EXTENDED
 */
export interface IBashEndpointConfig {
  /** Unique identifier for the endpoint */
  id: string;
  /** Display name for the endpoint */
  name: string;
  /** API endpoint URL */
  url: string;
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /** Icon name for the endpoint tab - ADD THIS */
  icon?: string;
  /** Whether the endpoint tab should be visible - ADD THIS */
  visible?: boolean;
  /** Default headers */
  headers?: Record<string, string>;
  /** Default query parameters */
  params?: Record<string, any>;
  /** Request body for POST/PUT requests */
  body?: any;
  /** Column configuration for table data */
  columns: IBashColumn[];
  /** Sidebar fields configuration */
  sidebarFields?: IBashSidebarField[];
  /** Row detail fields configuration - displayed when row is selected */ // NEW
  rowDetailFields?: IBashSidebarField[]; // NEW
  /** Whether to enable caching */
  cacheable?: boolean;
  /** Cache duration in milliseconds */
  cacheDuration?: number;
  /** Data transformer function - UPDATED */
  dataTransformer?: (data: any) => IBashDataTransformResult;
}


/**
 * Main configuration interface for the ATK Bash component
 */
export interface IBashConfig {
  /** Component instance ID */
  id: string;
  /** Component title */
  title: string;
  /** Component subtitle/description */
  subtitle: string;
  /** Available endpoints configuration */
  endpoints: IBashEndpointConfig[];
  /** Default endpoint ID to use */
  defaultEndpoint?: string;
  /** Terminal configuration */
  terminal: {
    /** Whether terminal is editable */
    editable: boolean;
    /** Initial height */
    height: string;
    /** Whether to show terminal controls */
    showControls: boolean;
    /** Custom terminal commands */
    customCommands?: IBashCommand[];
  };
  /** Table configuration */
  table: {
    /** Whether to show table when no data */
    showEmptyState: boolean;
    /** Items per page for pagination */
    itemsPerPage?: number;
    /** Whether to enable search/filter */
    searchEnabled?: boolean;
    /** Track by function for performance */
    trackByFn?: (index: number, item: BashData) => any;
  };
  /** Action buttons configuration */
  actions?: IBashAction[];
}
/**
 * Custom terminal command
 */
export interface IBashCommand {
  /** Command name */
  name: string;
  /** Command description */
  description: string;
  /** Command handler function */
  handler: (args: string[]) => Promise<void> | void;
}

/**
 * Action button configuration
 */
export interface IBashAction {
  /** Action ID */
  id: string;
  /** Display label */
  label: string;
  /** Icon name */
  icon?: string;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  /** Whether action is loading */
  loading?: boolean;
  /** Whether action is disabled */
  disabled?: boolean;
  /** Action handler */
  handler: () => Promise<void> | void;
}

/**
 * Connection status for API endpoints
 */
export type AtkApiConnectionStatus = 'connected' | 'disconnected' | 'connecting';

/**
 * Track by function type for table optimization
 */
export type AtkApiTrackByFn = (index: number, item: BashData) => any;

// ============================================
// 2. COLUMN & FIELD TYPES
// ============================================

/**
 * Available column data types for table display
 * Each type has specific formatting rules applied by formatters
 */
export type AtkApiColumnType =
  // Basic types
  | 'text'
  | 'number'
  | 'boolean'
  | 'date'

  // Financial types
  | 'currency'       // Fiat currencies (USD, EUR, etc.)
  | 'crypto'         // Cryptocurrency amounts with dynamic precision
  | 'price'          // Asset prices with smart decimals
  | 'percentage'     // Percentage values with % symbol

  // Trading types
  | 'quantity'       // Order quantities
  | 'fee'            // Transaction fees
  | 'volume'         // Trading volume

  // Stock market types
  | 'stock-price'    // Stock prices
  | 'market-cap'     // Market capitalization
  | 'shares'         // Number of shares

  // UI types
  | 'badge'          // Status badge with color
  | 'status'         // Status text with styling
  | 'icon'           // Icon display
  | 'custom';        // Custom formatter

/**
 * Available field types for sidebar display
 * Similar to column types but optimized for detail views
 */
export type AtkApiFieldType =
  // Basic types
  | 'text'
  | 'number'
  | 'boolean'
  | 'date'

  // Financial types
  | 'currency'
  | 'crypto'
  | 'price'
  | 'percentage'

  // Display types
  | 'badge'
  | 'status'
  | 'icon'
  | 'link'
  | 'email'
  | 'phone'
  | 'custom';

/**
 * Text alignment options for columns
 */
export type AtkApiAlign = 'left' | 'center' | 'right';

// ============================================
// 3. CONFIGURATION INTERFACES
// ============================================

/**
 * Column configuration for table display
 * Defines how data is displayed in the datatable component
 *
 * @template T - Data type (extends BashData)
 */
export interface IAtkApiColumn<T = BashData> {
  /** Unique identifier for the column (matches data property key) */
  key: string;

  /** Display label for the column header */
  label: string;

  /** Column width (CSS value: '120px', '20%', 'auto') */
  width?: string;

  /** Text alignment */
  align?: AtkApiAlign;

  /** Data type for automatic formatting */
  type?: AtkApiColumnType;

  /** Whether the column is sortable */
  sortable?: boolean;

  /** Custom formatter function (overrides type-based formatting) */
  formatter?: (value: any, row?: T) => string;

  /** CSS class for custom styling */
  cssClass?: string;

  /** Whether column is visible (default: true) */
  visible?: boolean;

  /** Column group/category for organization */
  group?: string;

  /** Icon to display in header */
  icon?: string;
}

/**
 * Sidebar field configuration for detail display
 * Used in both global sidebar (endpoint info) and row details
 */
export interface IAtkApiSidebarField {
  /** Unique identifier for the field (matches data property key) */
  key: string;

  /** Display label for the field */
  label: string;

  /** Data type for automatic formatting */
  type?: AtkApiFieldType;

  /** Custom formatter function (overrides type-based formatting) */
  formatter?: (value: any) => string;

  /** CSS class for custom styling */
  cssClass?: string;

  /** Whether field is visible (default: true) */
  visible?: boolean;

  /** Field group/category for organization */
  group?: string;

  /** Icon to display before label */
  icon?: string;

  /** Tooltip text for additional info */
  tooltip?: string;
}

/**
 * Data transformation result for endpoint responses
 * Separates global endpoint data from tabular data
 */
export interface IAtkApiDataTransformResult {
  /** Global endpoint information (displayed in sidebar when endpoint is selected) */
  sidebarData: Record<string, any>;

  /** Tabular data (displayed in datatable) */
  tableData: BashData[];
}

/**
 * HTTP method types supported by the API
 */
export type AtkApiHttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * Configuration for a single API endpoint
 * Defines how to fetch, display, and interact with endpoint data
 */
export interface IAtkApiEndpointConfig {
  /** Unique identifier for the endpoint */
  id: string;

  /** Display name for the endpoint */
  name: string;

  /** API endpoint URL (supports parameter placeholders like {symbol}) */
  url: string;

  /** HTTP method */
  method: AtkApiHttpMethod;

  /** Icon name for the endpoint tab/button */
  icon?: string;

  /** Whether the endpoint tab should be visible in UI */
  visible?: boolean;

  /** Default HTTP headers */
  headers?: Record<string, string>;

  /** Default query parameters */
  params?: Record<string, any>;

  /** Request body for POST/PUT/PATCH requests */
  body?: any;

  /** Column configuration for table data */
  columns: IAtkApiColumn[];

  /** Sidebar fields configuration (global endpoint info) */
  sidebarFields?: IAtkApiSidebarField[];

  /** Row detail fields configuration (displayed when row is selected) */
  rowDetailFields?: IAtkApiSidebarField[];

  /** Whether to enable caching for this endpoint */
  cacheable?: boolean;

  /** Cache duration in milliseconds (default: 300000 = 5 minutes) */
  cacheDuration?: number;

  /**
   * Data transformer function
   * Converts raw API response into separated sidebar and table data
   * @param data - Raw API response (any format)
   * @returns Transformed data split into sidebar and table
   */
  dataTransformer?: (data: any) => IAtkApiDataTransformResult;

  /** Optional description for documentation */
  description?: string;
}

/**
 * UI configuration for the ATK API component
 * Controls visual aspects and user interactions
 */
export interface IAtkApiUiConfig {
  /** Terminal textarea initial height */
  terminalHeight: string;

  /** Whether to show terminal controls (clear, copy, etc.) */
  showTerminalControls: boolean;

  /** Items per page for table pagination (0 = no pagination) */
  tableItemsPerPage?: number;

  /** Whether to enable search/filter in table */
  enableSearch?: boolean;

  /** Whether to show empty state when no data */
  showEmptyState?: boolean;

  /** Track by function for table performance */
  trackByFn?: AtkApiTrackByFn;
}

/**
 * Main configuration interface for the ATK API component
 * This is what factories must produce for each API domain
 */
export interface IAtkApiConfig {
  /** Component instance ID (unique across app) */
  id: string;

  /** Component title (displayed in header) */
  title: string;

  /** Component subtitle/description */
  subtitle: string;

  /** API domain/provider (binance, ibkr, etc.) */
  domain: string;

  /** Available endpoints configuration */
  endpoints: IAtkApiEndpointConfig[];

  /** Default endpoint ID to use on initialization */
  defaultEndpoint?: string;

  /** UI configuration */
  ui: IAtkApiUiConfig;

  /** Base URL for all endpoints (prepended to endpoint.url) */
  baseUrl?: string;

  /** Global headers applied to all requests */
  globalHeaders?: Record<string, string>;

  /** Whether to enable global caching (can be overridden per endpoint) */
  enableCaching?: boolean;

  /** Optional metadata */
  metadata?: Record<string, any>;
}

// ============================================
// 4. STATE MANAGEMENT
// ============================================

/**
 * Response metadata from API calls
 * Provides information about the last request/response
 */
export interface IAtkApiResponseMetadata {
  /** HTTP status code */
  statusCode: number;

  /** Response time in milliseconds */
  responseTime: number;

  /** Number of data items returned */
  dataCount: number;

  /** Timestamp of the response */
  timestamp?: Date;

  /** Cached response indicator */
  fromCache?: boolean;
}

/**
 * Unified state interface for ATK API
 * Single source of truth for all component state
 * Managed by AtkApiStateService
 */
export interface IAtkApiUnifiedState {
  // =====================================
  // CONTEXT
  // =====================================

  /** Current configuration ID being used */
  configId: string;

  /** Current active endpoint ID */
  currentEndpoint: string;

  /** Current endpoint parameters (symbol, limit, etc.) */
  parameters: Record<string, any>;

  // =====================================
  // DATA (TRIPLE LOGIC)
  // =====================================

  /** Table data - array of rows for datatable display */
  tableData: BashData[];

  /** Sidebar data - global endpoint information (e.g., account info) */
  sidebarData: Record<string, any> | null;

  /** Selected row data - detail of a single selected row */
  selectedRowData: BashData | null;

  // =====================================
  // UI STATE
  // =====================================

  /** Loading indicator for async operations */
  loading: boolean;

  /** Error message if any */
  error: string | null;

  /** API connection status */
  connectionStatus: AtkApiConnectionStatus;

  /** Sidebar collapsed state */
  sidebarCollapsed: boolean;

  /** Sidebar pinned state (prevents auto-collapse) */
  sidebarPinned: boolean;

  // =====================================
  // METADATA
  // =====================================

  /** Response metadata from last API call */
  responseMetadata: IAtkApiResponseMetadata | null;

  /** Last update timestamp */
  lastUpdated?: Date;
}

// ============================================
// 5. EVENT BUS
// ============================================

/**
 * Event types for the ATK API event bus
 * Used for component communication and state tracking
 */
export type AtkApiEventType =
  // Data lifecycle events
  | 'data-loading'
  | 'data-loaded'
  | 'data-error'
  | 'log-added'

  // Navigation events
  | 'endpoint-changed'
  | 'parameters-updated'

  // Selection events
  | 'row-selected'
  | 'row-cleared'

  // Action events
  | 'cache-cleared'
  | 'data-exported'
  | 'connection-tested'

  // State events
  | 'state-initialized'
  | 'state-reset'

  // UI events
  | 'sidebar-toggled'
  | 'sidebar-pinned';

/**
 * Event payload interface for typed events
 * Generic type allows for specific payload types per event
 */
export interface IAtkApiEvent<T = any> {
  /** Event type */
  type: AtkApiEventType;

  /** Event payload (type varies by event) */
  payload: T;

  /** Event timestamp */
  timestamp: Date;

  /** Optional event source for debugging */
  source?: string;
}

/**
 * Event payload types for specific events
 * Provides type safety when emitting/consuming events
 */
export interface IAtkApiEventPayloads {
  'data-loading': {
    endpoint: string;
    parameters: Record<string, any>;
  };

  'data-loaded': {
    endpoint: string;
    dataCount: number;
    responseTime: number;
    fromCache: boolean;
  };

  'data-error': {
    endpoint: string;
    error: string;
    statusCode?: number;
  };

  'endpoint-changed': {
    oldEndpoint: string;
    newEndpoint: string;
  };

  'parameters-updated': {
    parameters: Record<string, any>;
    changedKeys: string[];
  };

  'row-selected': {
    rowData: BashData;
    rowId: string | number;
  };

  'row-cleared': {
    previousRowData: BashData | null;
  };

  'cache-cleared': {
    endpoint?: string;
    clearedCount: number;
  };

  'data-exported': {
    format: 'json' | 'csv';
    itemCount: number;
    filename: string;
  };

  'connection-tested': {
    success: boolean;
    responseTime: number;
    error?: string;
  };

  'state-initialized': {
    configId: string;
    defaultEndpoint: string;
  };

  'state-reset': {
    reason?: string;
  };

  'sidebar-toggled': {
    isCollapsed: boolean;
  };

  'sidebar-pinned': {
    isPinned: boolean;
  };
}

/**
 * Helper type to get event payload type from event type
 * Usage: AtkApiEventPayload<'data-loaded'> -> IAtkApiEventPayloads['data-loaded']
 */
export type AtkApiEventPayload<T extends AtkApiEventType> =
  T extends keyof IAtkApiEventPayloads
  ? IAtkApiEventPayloads[T]
  : any;

// ============================================
// 6. LOGGING & DEBUGGING
// ============================================

/**
 * Log entry levels for debugging and monitoring
 */
export type AtkApiLogLevel = 'info' | 'success' | 'warning' | 'error' | 'debug';

/**
 * Terminal log entry for debug console
 * Used to track API calls and state changes
 */
export interface IAtkApiLogEntry {
  /** Timestamp of the log entry */
  timestamp: Date;

  /** Log message */
  message: string;

  /** Log level */
  level: AtkApiLogLevel;

  /** Additional metadata (API response, error details, etc.) */
  metadata?: Record<string, any>;

  /** Source component/service that created the log */
  source?: string;
}

// ============================================
// 7. CACHE MANAGEMENT
// ============================================

/**
 * Cache entry structure for HTTP responses
 */
export interface IAtkApiCacheEntry<T = any> {
  /** Cached data */
  data: T;

  /** Timestamp when data was cached */
  timestamp: number;

  /** Cache duration in milliseconds */
  duration: number;

  /** Cache key for identification */
  key: string;

  /** Endpoint ID that generated this cache */
  endpointId: string;
}

/**
 * Cache configuration options
 */
export interface IAtkApiCacheConfig {
  /** Whether caching is enabled globally */
  enabled: boolean;

  /** Default cache duration in milliseconds */
  defaultDuration: number;

  /** Maximum cache entries before cleanup */
  maxEntries: number;

  /** Whether to cache on error responses */
  cacheErrors: boolean;
}

// ============================================
// 8. HTTP REQUEST BUILDING
// ============================================

/**
 * HTTP request options for endpoint calls
 * Used internally by AtkApiHttpService
 */
export interface IAtkApiRequestOptions {
  /** Request URL */
  url: string;

  /** HTTP method */
  method: AtkApiHttpMethod;

  /** Request headers */
  headers?: Record<string, string>;

  /** Query parameters */
  params?: Record<string, any>;

  /** Request body */
  body?: any;

  /** Whether to use cache */
  useCache?: boolean;

  /** Custom cache duration */
  cacheDuration?: number;

  /** Timeout in milliseconds */
  timeout?: number;
}

/**
 * HTTP response structure
 */
export interface IAtkApiResponse<T = any> {
  /** Response data */
  data: T;
  /** sidebarData data */
  sidebarData?: Record<string, any> | null;  // ✅ AJOUT

  /** HTTP status code */
  statusCode: number;

  /** Response time in milliseconds */
  responseTime: number;

  /** Whether response came from cache */
  fromCache: boolean;

  /** Response headers */
  headers?: Record<string, string>;

  /** Error message if request failed */
  error?: string;
}

// ============================================
// 9. FACTORY TYPES
// ============================================

/**
 * Factory method signature for creating API configurations
 * Each domain (Binance, IBKR, etc.) should implement this
 */
export type AtkApiConfigFactory = () => IAtkApiConfig;

/**
 * Factory registry for multiple domains
 * Allows dynamic configuration loading
 */
export interface IAtkApiFactoryRegistry {
  /** Registered factories by domain name */
  factories: Map<string, AtkApiConfigFactory>;

  /** Register a new factory */
  register(domain: string, factory: AtkApiConfigFactory): void;

  /** Get factory for a domain */
  get(domain: string): AtkApiConfigFactory | undefined;

  /** Check if domain is registered */
  has(domain: string): boolean;

  /** Get all registered domain names */
  getDomains(): string[];
}

// ============================================
// 10. UTILITY TYPES
// ============================================

/**
 * Partial deep type helper
 * Makes all nested properties optional
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Config update type - allows partial updates to configuration
 */
export type AtkApiConfigUpdate = DeepPartial<IAtkApiConfig>;

/**
 * State update type - allows partial updates to state
 */
export type AtkApiStateUpdate = Partial<IAtkApiUnifiedState>;
