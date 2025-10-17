import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ToolsService } from '@core/services/tools.service';
import { Observable, throwError } from 'rxjs';

export interface ErrorDetails {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  source: 'client' | 'server' | 'binance' | 'validation';
}

export interface BinanceErrorResponse {
  success: false;
  error: {
    code: number;
    message: string;
    details?: any;
    timestamp: string;
  };
  source?: string;
  endpoint?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BinanceErrorHandlerService {

  private tools = inject(ToolsService);

  /**
   * Handle HTTP errors with comprehensive Binance and PHP backend support
   */
  handleHttpError(error: HttpErrorResponse): Observable<never> {
    let errorDetails: ErrorDetails;

    // TAG BinanceErrorHandlerService.39 ================ CONSOLE LOG IN PROGRESS
    this.tools.consoleGroup({
      title: `BinanceErrorHandlerService 39 BinanceErrorHandler Processing HTTP Error -> handleHttpError init : ${error.error.message}`,
      tag: 'warning',
      data: {
        code: error.error.code,
        message: error.error.error.message,
        source: error.error.source,
        status: error.status,
        details: {
          endpoint: error.error.endpoint,
          binanceCode: error.error.error.code,
          serverResponse: error.error
        },
        timestamp: new Date()
      },
      palette: 'er',
    });

    if (error.error instanceof ErrorEvent) {
      // Client-side/network error
      errorDetails = {
        code: 'CLIENT_ERROR',
        message: `Network error: ${error.error.message}`,
        source: 'client',
        details: { originalError: error.error },
        timestamp: new Date()
      };
    } else {
      // Server-side error - handle PHP Response format
      if (error.error && typeof error.error === 'object') {
        // Check for PHP Response::error() format
        if (error.error.success === false && error.error.error) {
          errorDetails = {
            code: `BINANCE_${error.error.error.code || error.status}`,
            message: error.error.error.message || 'Binance API error',
            source: error.error.source === 'binance' ? 'binance' : 'server',
            details: {
              endpoint: error.error.endpoint,
              binanceCode: error.error.error.code,
              serverResponse: error.error
            },
            timestamp: new Date()
          };
        }
        // Check for PHP Response::success() format with validation error
        else if (error.error.success === false) {
          errorDetails = {
            code: `SERVER_${error.status}`,
            message: error.error.message || `Server error: ${error.status}`,
            source: 'server',
            details: {
              serverResponse: error.error,
              httpStatus: error.status
            },
            timestamp: new Date()
          };
        }
        // Standard error with message
        else if (error.error.message) {
          errorDetails = {
            code: `SERVER_${error.status}`,
            message: error.error.message,
            source: 'server',
            details: error.error,
            timestamp: new Date()
          };
          // console.log('Identified as: Standard server error');
        }
        // Fallback for unknown object format
        else {
          errorDetails = {
            code: `HTTP_${error.status}`,
            message: `HTTP error: ${error.status} - ${error.statusText}`,
            source: 'server',
            details: { originalError: error.error, httpStatus: error.status },
            timestamp: new Date()
          };
          // console.log('Identified as: Unknown object format');
        }
      } else {
        // Fallback for non-object or null error body
        errorDetails = {
          code: `HTTP_${error.status}`,
          message: `HTTP error: ${error.status} - ${error.statusText || 'Unknown error'}`,
          source: 'server',
          details: { httpStatus: error.status, originalError: error.error },
          timestamp: new Date()
        };
        // console.log('Identified as: Non-object error body');
      }
    }

    // TAG BinanceErrorHandlerService.39 ================ CONSOLE LOG IN PROGRESS
    this.tools.consoleGroup({
      title: `BinanceErrorHandlerService 39 BinanceErrorHandler Processing HTTP Error -> handleHttpError init : ${error.error.message}`,
      tag: 'warning',
      data: errorDetails,
      palette: 'er',
    });

    // console.log('Final error details:', errorDetails);
    // console.groupEnd();

    // Log to console with appropriate level
    if (errorDetails.source === 'client') {
      console.warn('🟡 Binance Client Error:', errorDetails);
    } else if (errorDetails.source === 'binance') {
      console.error('🔴 Binance API Error:', errorDetails);
    } else {
      console.error('🔶 Server Error:', errorDetails);
    }

    return throwError(() => new Error(errorDetails.message));
  }

  /**
   * Handle data validation errors during processing
   */
  handleDataValidationError(context: string, data: any): Error {
    const errorDetails: ErrorDetails = {
      code: 'VALIDATION_ERROR',
      message: `Data validation failed: ${context}`,
      source: 'validation',
      details: {
        context,
        receivedData: data,
        dataType: typeof data,
        isArray: Array.isArray(data)
      },
      timestamp: new Date()
    };

    console.group('🟠 BinanceErrorHandler: Validation Error');
    console.log('Context:', context);
    console.log('Data type:', typeof data);
    console.log('Is Array:', Array.isArray(data));
    console.log('Data sample:', data);
    console.log('Error details:', errorDetails);
    console.groupEnd();

    console.error('🟠 Binance Validation Error:', errorDetails);

    return new Error(errorDetails.message);
  }

  /**
   * Handle specific Binance API error codes
   */
  handleBinanceSpecificError(binanceCode: number, message: string): Error {
    const binanceErrorMap: { [key: number]: string } = {
      [-1000]: 'Unknown error occurred',
      [-1001]: 'Internal server error',
      [-1002]: 'Invalid API key format',
      [-1003]: 'Too many requests',
      [-1021]: 'Invalid timestamp',
      [-1022]: 'Invalid signature',
      [-2010]: 'NEW_ORDER_REJECTED',
      [-2011]: 'CANCEL_REJECTED',
      [-2013]: 'Order does not exist',
      [-2014]: 'Invalid API key',
      [-2015]: 'Invalid API key format'
    };

    const friendlyMessage = binanceErrorMap[binanceCode] || message;
    const errorDetails: ErrorDetails = {
      code: `BINANCE_${binanceCode}`,
      message: `Binance API Error: ${friendlyMessage}`,
      source: 'binance',
      details: {
        binanceCode,
        originalMessage: message,
        friendlyMessage
      },
      timestamp: new Date()
    };

    console.error('🔴 Binance Specific Error:', errorDetails);

    return new Error(errorDetails.message);
  }

  /**
   * Format error for user display
   */
  formatUserFriendlyError(error: Error): string {
    if (error.message.includes('Network error')) {
      return 'Connection problem. Please check your internet connection and try again.';
    }

    if (error.message.includes('Binance API Error')) {
      return 'Binance service is currently unavailable. Please try again in a few moments.';
    }

    if (error.message.includes('Data validation failed')) {
      return 'Data processing error. Please refresh the page and try again.';
    }

    if (error.message.includes('Server error')) {
      return 'Server error. Please try again in a few moments.';
    }

    // Return original message if no specific formatting applies
    return error.message;
  }
}
