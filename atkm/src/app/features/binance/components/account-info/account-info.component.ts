import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { BinanceService } from '../../services/binance.service';
import { BinanceAccount, BinanceBalance } from '../../models/binance-account.model';

@Component({
  selector: 'atk-account-info',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './account-info.component.html',
  styleUrls: ['./account-info.component.css']
})
export class AccountInfoComponent implements OnInit, OnDestroy {
  account: BinanceAccount | null = null;
  loading = false;
  error: string | null = null;
  
  private destroy$ = new Subject<void>();

  constructor(private binanceService: BinanceService) {}

  ngOnInit(): void {
    this.loadAccountInfo();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charge les informations du compte Binance
   */
  loadAccountInfo(): void {
    this.loading = true;
    this.error = null;

    this.binanceService.getAccount()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (account) => {
          this.account = account;
          this.loading = false;
        },
        error: (error) => {
          this.error = error.message;
          this.loading = false;
          console.error('Erreur lors du chargement du compte:', error);
        }
      });
  }

  /**
   * Rafraîchit les données du compte
   */
  refreshAccount(): void {
    this.loadAccountInfo();
  }

  /**
   * Formate un nombre avec des décimales appropriées
   */
  formatBalance(value: number): string {
    if (value === 0) return '0';
    if (value < 0.00001) return value.toExponential(2);
    if (value < 1) return value.toFixed(8);
    return value.toLocaleString('fr-FR', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 8 
    });
  }

  /**
   * Formate la date de mise à jour
   */
  formatUpdateTime(timestamp: number | null): string {
    if (!timestamp) return 'Non disponible';
    return new Date(timestamp).toLocaleString('fr-FR');
  }

  /**
   * Obtient la classe CSS pour le statut des permissions
   */
  getPermissionClass(permission: string): string {
    const permissionClasses: { [key: string]: string } = {
      'SPOT': 'permission-spot',
      'MARGIN': 'permission-margin',
      'FUTURES': 'permission-futures'
    };
    return permissionClasses[permission] || 'permission-default';
  }

  /**
   * Fonction trackBy pour optimiser le rendu des listes
   */
  trackByAsset(index: number, balance: BinanceBalance): string {
    return balance.asset;
  }
}