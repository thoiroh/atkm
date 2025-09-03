import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { BinanceAccount, BinanceApiResponse } from '../models/binance.model';

@Injectable({
  providedIn: 'root'
})
export class BinanceService {
  private readonly apiBaseUrl = 'http://localhost:8080'; // Ajustez selon votre configuration
  private http = inject(HttpClient);

  /**
   * Récupère les informations du compte Binance
   */
  getAccount(): Observable<BinanceAccount> {
    return this.http.get<BinanceApiResponse>(`${this.apiBaseUrl}/api/v3/account`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          } else {
            throw new Error(response.message || 'Erreur lors de la récupération du compte');
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Gestion centralisée des erreurs HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur inconnue s\'est produite';

    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur client: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else {
        errorMessage = `Erreur serveur: ${error.status} - ${error.message}`;
      }
    }

    console.error('Erreur Binance Service:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
