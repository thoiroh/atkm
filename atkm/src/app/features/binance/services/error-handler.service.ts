// NOUVEAU FICHIER - Service de gestion d'erreurs centralisé
import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';

export interface ErrorDetails {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class BinanceErrorHandlerService {

  /**
   * Handle HTTP errors with Binance-specific logic
   */
  handleHttpError(error: HttpErrorResponse): Observable<never> {
    let errorDetails: ErrorDetails;

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorDetails = {
        code: 'CLIENT_ERROR',
        message: `Client error: ${error.error.message}`,
        timestamp: new Date()
      };
    } else {
      // Server-side error with PHP format
      if (error.error && typeof error.error === 'object') {
        if (!error.error.success && error.error.error) {
          // Binance API error format
          errorDetails = {
            code: `BINANCE_${error.error.error.code || error.status}`,
            message: error.error.error.message || 'Unknown Binance error',
            details: error.error,
            timestamp: new Date()
          };
        } else {
          // Standard server error
          errorDetails = {
            code: `SERVER_${error.status}`,
            message: error.error.message || `Server error: ${error.status}`,
            details: error.error,
            timestamp: new Date()
          };
        }
      } else {
        // Fallback for unknown error format
        errorDetails = {
          code: `HTTP_${error.status}`,
          message: `HTTP error: ${error.status} - ${error.message}`,
          timestamp: new Date()
        };
      }
    }

    console.error('Binance API Error:', errorDetails);
    return throwError(() => new Error(errorDetails.message));
  }

  /**
   * Handle data validation errors
   */
  handleDataValidationError(context: string, data: any): Error {
    const message = `Data validation failed in ${context}`;
    console.error(message, { data, context, timestamp: new Date() });
    return new Error(message);
  }
}
