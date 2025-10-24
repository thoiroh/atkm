/**
 * ATK API HTTP Service
 * Handles all HTTP communication with API endpoints
 *
 * Responsibilities:
 * - Execute HTTP requests with retry logic
 * - Build URLs with parameter replacement
 * - Integrate with cache system
 * - Transform API responses
 * - Handle errors with user-friendly messages
 * - Measure response times
 *
 * @file atk-api-http.service.ts
 * @version 2.0.0
 * @architecture Pure HTTP logic - no state management
 */

import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ToolsService } from '@core/services/tools.service';
import { catchError, firstValueFrom, retry, throwError, timeout, timer } from 'rxjs';

import { AtkApiStateService } from './atk-api-state.service';
import type {
  BashData,
  IAtkApiEndpointConfig,
  IAtkApiRequestOptions,
  IAtkApiResponse
} from './atk-api.interfaces';

/**
 * Default timeout for HTTP requests (30 seconds)
 */
const DEFAULT_TIMEOUT = 30000;

/**
 * Retry configuration
 */
const RETRY_CONFIG = {
  maxRetries: 3,
  delays: [1000, 2000, 4000] // Exponential backoff: 1s, 2s, 4s
};

/**
 * HTTP error code mapping to user-friendly messages
 */
const ERROR_MESSAGES: Record<number, string> = {
  400: 'Bad request - Invalid parameters',
  401: 'Unauthorized - Authentication required',
  403: 'Forbidden - Access denied',
  404: 'Not found - Endpoint does not exist',
  408: 'Request timeout - Server took too long to respond',
  429: 'Too many requests - Rate limit exceeded',
  500: 'Internal server error - Something went wrong',
  502: 'Bad gateway - Server is temporarily unavailable',
  503: 'Service unavailable - Server is down',
  504: 'Gateway timeout - Server did not respond in time'
};

@Injectable({ providedIn: 'root' })
export class AtkApiHttpService {

  // ======================================================
  // DEPENDENCIES
  // ======================================================

  private readonly http = inject(HttpClient);
  private readonly stateService = inject(AtkApiStateService);
  private readonly tools = inject(ToolsService);

  // ======================================================
  // CONSTRUCTOR
  // ======================================================

  constructor() {
    this.tools.consoleGroup({
      title: 'AtkApiHttpService -> constructor()',
      tag: 'recycle',
      palette: 'in',
      collapsed: true,
      data: { service: 'AtkApiHttpService' }
    });
  }

  // ======================================================
  // PUBLIC METHODS - DATA LOADING
  // ======================================================

  /**
   * Load data from an API endpoint
   * Handles cache, HTTP request, transformation, and error handling
   *
   * @param endpointConfig - Endpoint configuration
   * @param params - Request parameters
   * @returns Promise with transformed data and metadata
   */
  async loadData(
    endpointConfig: IAtkApiEndpointConfig,
    params: Record<string, any> = {}
  ): Promise<IAtkApiResponse<BashData[]>> {
    const startTime = performance.now();

    try {
      // Build cache key
      const cacheKey = this.stateService.buildCacheKey(endpointConfig.id, params);

      // Check cache first
      if (endpointConfig.cacheable) {
        const cached = this.stateService.getCache<BashData[]>(cacheKey);
        if (cached) {
          const responseTime = Math.round(performance.now() - startTime);

          this.tools.consoleGroup({
            title: 'AtkApiHttpService -> loadData() FROM CACHE',
            tag: 'check',
            palette: 'su',
            collapsed: true,
            data: { endpointConfig, params, dataCount: cached.length, responseTime }
          });

          return {
            data: cached,
            statusCode: 200,
            responseTime,
            fromCache: true
          };
        }
      }

      // Execute HTTP request
      const rawData = await this.executeRequest(endpointConfig, params);

      // Transform data if transformer exists
      let transformedData: BashData[];

      if (endpointConfig.dataTransformer) {
        const result = endpointConfig.dataTransformer(rawData);
        transformedData = result.tableData;

        // Update sidebar data in state
        this.stateService.updateData([], result.sidebarData);
      } else {
        // No transformer - normalize data
        transformedData = this.normalizeData(rawData);
      }

      // Cache the transformed data
      if (endpointConfig.cacheable) {
        this.stateService.setCache(
          cacheKey,
          transformedData,
          endpointConfig.cacheDuration
        );
      }

      const responseTime = Math.round(performance.now() - startTime);

      this.tools.consoleGroup({
        title: 'AtkApiHttpService -> loadData() SUCCESS',
        tag: 'check',
        palette: 'su',
        collapsed: true,
        data: {
          endpointConfig,
          params,
          dataCount: transformedData.length,
          responseTime,
          cached: endpointConfig.cacheable
        }
      });

      return {
        data: transformedData,
        statusCode: 200,
        responseTime,
        fromCache: false
      };

    } catch (error: any) {
      const responseTime = Math.round(performance.now() - startTime);
      const errorMessage = this.extractErrorMessage(error);

      this.tools.consoleGroup({
        title: 'AtkApiHttpService -> loadData() ERROR',
        tag: 'cross',
        palette: 'er',
        collapsed: false,
        data: { endpointConfig, params, error, errorMessage, responseTime }
      });

      return {
        data: [],
        statusCode: error.status || 0,
        responseTime,
        fromCache: false,
        error: errorMessage
      };
    }
  }

  /**
   * Test endpoint connection and measure latency
   *
   * @param endpointConfig - Endpoint configuration
   * @param params - Request parameters
   * @returns Promise with test results
   */
  async testEndpoint(
    endpointConfig: IAtkApiEndpointConfig,
    params: Record<string, any> = {}
  ): Promise<{ success: boolean; responseTime: number; error?: string }> {
    const startTime = performance.now();

    try {
      await this.executeRequest(endpointConfig, params);
      const responseTime = Math.round(performance.now() - startTime);

      this.tools.consoleGroup({
        title: 'AtkApiHttpService -> testEndpoint() SUCCESS',
        tag: 'check',
        palette: 'su',
        collapsed: true,
        data: { endpointConfig, responseTime }
      });

      return {
        success: true,
        responseTime
      };
    } catch (error: any) {
      const responseTime = Math.round(performance.now() - startTime);
      const errorMessage = this.extractErrorMessage(error);

      this.tools.consoleGroup({
        title: 'AtkApiHttpService -> testEndpoint() ERROR',
        tag: 'cross',
        palette: 'er',
        collapsed: false,
        data: { endpointConfig, error, errorMessage, responseTime }
      });

      return {
        success: false,
        responseTime,
        error: errorMessage
      };
    }
  }

  // ======================================================
  // PRIVATE METHODS - HTTP EXECUTION
  // ======================================================

  /**
   * Execute HTTP request with retry logic and timeout
   *
   * @param endpointConfig - Endpoint configuration
   * @param params - Request parameters
   * @returns Promise with raw API response
   */
  private async executeRequest<T = any>(
    endpointConfig: IAtkApiEndpointConfig,
    params: Record<string, any>
  ): Promise<T> {
    const options = this.buildRequestOptions(endpointConfig, params);

    const observable = this.makeHttpCall<T>(options).pipe(
      // Timeout after 30 seconds
      timeout(DEFAULT_TIMEOUT),

      // Retry with exponential backoff
      retry({
        count: RETRY_CONFIG.maxRetries,
        delay: (error, retryCount) => {
          // Only retry on network errors or 5xx errors
          if (this.shouldRetry(error)) {
            const delay = RETRY_CONFIG.delays[retryCount - 1] || 4000;

            this.tools.consoleGroup({
              title: `AtkApiHttpService -> Retry ${retryCount}/${RETRY_CONFIG.maxRetries}`,
              tag: 'check',
              palette: 'wa',
              collapsed: true,
              data: { error, delay, retryCount }
            });

            return timer(delay);
          }

          // Don't retry - throw error immediately
          return throwError(() => error);
        }
      }),

      // Error handling
      catchError((error: HttpErrorResponse) => {
        return throwError(() => this.handleHttpError(error));
      })
    );

    return firstValueFrom(observable);
  }

  /**
   * Make the actual HTTP call based on method
   *
   * @param options - Request options
   * @returns Observable with response
   */
  private makeHttpCall<T>(options: IAtkApiRequestOptions) {
    const { url, method, headers, params, body } = options;

    const httpHeaders = new HttpHeaders(headers || {});
    let httpParams = new HttpParams();

    // Build query parameters
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }

    const httpOptions = { headers: httpHeaders, params: httpParams };

    switch (method) {
      case 'GET':
        return this.http.get<T>(url, httpOptions);

      case 'POST':
        return this.http.post<T>(url, body, httpOptions);

      case 'PUT':
        return this.http.put<T>(url, body, httpOptions);

      case 'PATCH':
        return this.http.patch<T>(url, body, httpOptions);

      case 'DELETE':
        return this.http.delete<T>(url, httpOptions);

      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
  }

  // ======================================================
  // PRIVATE METHODS - REQUEST BUILDING
  // ======================================================

  /**
   * Build complete request options from endpoint config and parameters
   *
   * @param endpointConfig - Endpoint configuration
   * @param params - Request parameters
   * @returns Request options
   */
  private buildRequestOptions(
    endpointConfig: IAtkApiEndpointConfig,
    params: Record<string, any>
  ): IAtkApiRequestOptions {
    const config = this.stateService.config();

    // Build URL with parameter replacement
    const url = this.buildUrl(
      endpointConfig.url,
      params,
      config?.baseUrl
    );

    // Merge headers (global + endpoint specific)
    const headers = {
      ...config?.globalHeaders,
      ...endpointConfig.headers
    };

    // Merge parameters (endpoint defaults + provided params)
    const mergedParams = {
      ...endpointConfig.params,
      ...params
    };

    return {
      url,
      method: endpointConfig.method,
      headers,
      params: mergedParams,
      body: endpointConfig.body,
      useCache: endpointConfig.cacheable,
      cacheDuration: endpointConfig.cacheDuration
    };
  }

  /**
   * Build complete URL with parameter replacement and base URL
   * Replaces placeholders like {symbol} with actual values
   *
   * @param endpointUrl - Endpoint URL template
   * @param params - Parameters for replacement
   * @param baseUrl - Optional base URL to prepend
   * @returns Complete URL
   */
  private buildUrl(
    endpointUrl: string,
    params: Record<string, any>,
    baseUrl?: string
  ): string {
    let url = endpointUrl;

    // Replace URL placeholders {param} with actual values
    Object.keys(params).forEach(key => {
      const placeholder = `{${key}}`;
      if (url.includes(placeholder)) {
        url = url.replace(placeholder, params[key].toString());
        // Remove param from query params (it's in the URL now)
        delete params[key];
      }
    });

    // Prepend base URL if provided
    if (baseUrl) {
      // Remove trailing slash from baseUrl and leading slash from url
      const cleanBaseUrl = baseUrl.replace(/\/$/, '');
      const cleanUrl = url.replace(/^\//, '');
      url = `${cleanBaseUrl}/${cleanUrl}`;
    }

    return url;
  }

  // ======================================================
  // PRIVATE METHODS - ERROR HANDLING
  // ======================================================

  /**
   * Determine if request should be retried based on error
   *
   * @param error - HTTP error
   * @returns True if should retry
   */
  private shouldRetry(error: any): boolean {
    if (!(error instanceof HttpErrorResponse)) {
      return false;
    }

    // Retry on network errors (status 0)
    if (error.status === 0) {
      return true;
    }

    // Retry on 5xx server errors
    if (error.status >= 500 && error.status < 600) {
      return true;
    }

    // Retry on 408 (Request Timeout)
    if (error.status === 408) {
      return true;
    }

    // Retry on 429 (Too Many Requests) - with backoff
    if (error.status === 429) {
      return true;
    }

    // Don't retry on other errors
    return false;
  }

  /**
   * Handle HTTP error and return enhanced error object
   *
   * @param error - HTTP error response
   * @returns Enhanced error object
   */
  private handleHttpError(error: HttpErrorResponse): Error {
    let message = 'Unknown error occurred';

    if (error.status === 0) {
      // Network error
      message = 'Network error - Unable to connect to server';
    } else if (error.status in ERROR_MESSAGES) {
      // Known HTTP error code
      message = ERROR_MESSAGES[error.status];
    } else if (error.error?.message) {
      // API error message
      message = error.error.message;
    } else if (error.message) {
      // Generic error message
      message = error.message;
    }

    // Add status code to message if available
    if (error.status > 0) {
      message = `[${error.status}] ${message}`;
    }

    const enhancedError = new Error(message);
    (enhancedError as any).status = error.status;
    (enhancedError as any).originalError = error;

    return enhancedError;
  }

  /**
   * Extract user-friendly error message from error object
   *
   * @param error - Error object
   * @returns User-friendly error message
   */
  private extractErrorMessage(error: any): string {
    if (error.message) {
      return error.message;
    }

    if (error instanceof HttpErrorResponse) {
      return this.handleHttpError(error).message;
    }

    return 'Unknown error occurred';
  }

  // ======================================================
  // PRIVATE METHODS - DATA NORMALIZATION
  // ======================================================

  /**
   * Normalize API response data to BashData[]
   * Handles various response formats
   *
   * @param data - Raw API response
   * @returns Normalized data array
   */
  private normalizeData(data: any): BashData[] {
    // Already an array
    if (Array.isArray(data)) {
      return data as BashData[];
    }

    // Object with data property
    if (data && typeof data === 'object' && 'data' in data) {
      return this.normalizeData(data.data);
    }

    // Object with items property
    if (data && typeof data === 'object' && 'items' in data) {
      return this.normalizeData(data.items);
    }

    // Object with results property
    if (data && typeof data === 'object' && 'results' in data) {
      return this.normalizeData(data.results);
    }

    // Single object - wrap in array
    if (data && typeof data === 'object') {
      return [data as BashData];
    }

    // Primitive or null - return empty array
    return [];
  }

  // ======================================================
  // PUBLIC METHODS - UTILITIES
  // ======================================================

  /**
   * Export data to JSON file
   *
   * @param data - Data to export
   * @param filename - Output filename
   */
  exportToJson(data: BashData[], filename?: string): void {
    const name = filename || `atk-api-export-${Date.now()}.json`;

    try {
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      link.click();

      URL.revokeObjectURL(url);

      this.stateService.emitEvent('data-exported', {
        format: 'json',
        itemCount: data.length,
        filename: name
      });

      this.stateService.addLog(
        `Data exported successfully: ${data.length} items`,
        'success',
        { filename: name }
      );

    } catch (error: any) {
      this.stateService.addLog(
        `Export failed: ${error.message}`,
        'error',
        { error }
      );

      throw error;
    }
  }

  /**
   * Export data to CSV file
   *
   * @param data - Data to export
   * @param columns - Column definitions for headers
   * @param filename - Output filename
   */
  exportToCsv(
    data: BashData[],
    columns: { key: string; label: string }[],
    filename?: string
  ): void {
    const name = filename || `atk-api-export-${Date.now()}.csv`;

    try {
      // Build CSV header
      const header = columns.map(col => col.label).join(',');

      // Build CSV rows
      const rows = data.map(row => {
        return columns.map(col => {
          const value = row[col.key];
          // Escape quotes and wrap in quotes if contains comma
          const escaped = String(value || '')
            .replace(/"/g, '""');
          return escaped.includes(',') ? `"${escaped}"` : escaped;
        }).join(',');
      });

      const csvContent = [header, ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      link.click();

      URL.revokeObjectURL(url);

      this.stateService.emitEvent('data-exported', {
        format: 'csv',
        itemCount: data.length,
        filename: name
      });

      this.stateService.addLog(
        `Data exported successfully: ${data.length} items`,
        'success',
        { filename: name, format: 'csv' }
      );

    } catch (error: any) {
      this.stateService.addLog(
        `Export failed: ${error.message}`,
        'error',
        { error }
      );

      throw error;
    }
  }
}
