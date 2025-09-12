import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { BinanceAccount, BinanceApiResponse } from '../models/binance.model';

@Injectable({
  providedIn: 'root'
})
export class BinanceService {
  private readonly apiBaseUrl = 'http://localhost:8000'; // Ajustez selon votre configuration
  private http = inject(HttpClient);

  /**
   * Récupère les informations du compte Binance
   */
  getAccount(): Observable<BinanceAccount> {
    return this.http.get<BinanceApiResponse<BinanceAccount>>(`${this.apiBaseUrl}/api/v3/account`)
      .pipe(
        map(response => {
          // MODIFICATION - Vérifier la structure de la réponse PHP
          if (!response.success) {
            throw new Error(response.error?.message || 'Failed to get account data');
          }

          console.log(response);

          // AJOUT - Validation des données avant retour
          const accountData = response.data;
          if (!accountData) {
            throw new Error('No account data received from API');
          }


          // AJOUT - S'assurer que balances est un array
          if (!Array.isArray(accountData.balances)) {
            accountData.balances = [];
          }

          return accountData;
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
