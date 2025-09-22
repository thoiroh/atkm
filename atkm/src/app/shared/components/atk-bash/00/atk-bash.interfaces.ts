// atk-bash.interfaces.ts
// Generic interfaces for the ATK Bash component

import { TemplateRef } from '@angular/core';
import { Observable } from 'rxjs';

/**
 * Generic data type that can be displayed in the bash terminal table
 */
export type BashData = Record<string, any>;

/**
 * Configuration for a data column in the bash table
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
  formatter?: (value: any, row: T) => string;
  /** Custom template for the cell */
  template?: TemplateRef<any>;
  /** CSS class for styling */
  cssClass?: string;
  /** Whether column is visible */
  visible?: boolean;
}

/**
 * Configuration for API endpoint and data source
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
  /** Default headers */
  headers?: Record<string, string>;
  /** Default query parameters */
  params?: Record<string, any>;
  /** Request body for POST/PUT requests */
  body?: any;
  /** Column configuration for this endpoint's data */
  columns: IBashColumn[];
  /** Whether to enable caching */
  cacheable?: boolean;
  /** Cache duration in milliseconds */
  cacheDuration?: number;
  /** Data transformer function */
  dataTransformer?: (data: any) => BashData[];
}

/**
 * Terminal log entry for the debug pad
 */
export interface IBashLogEntry {
  /** Timestamp of the log entry */
  timestamp: Date;
  /** Log message */
  message: string;
  /** Log level */
  level: 'info' | 'success' | 'warning' | 'error';
  /** Additional metadata */
  metadata?: Record<string, any>;
}

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
 * Event emitted by the bash component
 */
export interface IBashEvent<T = any> {
  /** Event type */
  type: 'data-loaded' | 'error' | 'endpoint-changed' | 'action-clicked' | 'log-added';
  /** Event payload */
  payload: T;
  /** Timestamp */
  timestamp: Date;
}

/**
 * Service method signature for data loading
 */
export type BashDataLoader<T = BashData> = (
  endpoint: IBashEndpointConfig,
  params?: Record<string, any>
) => Observable<T[]>;
