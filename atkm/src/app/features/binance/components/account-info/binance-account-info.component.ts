import { CommonModule } from '@angular/common';
import { Component, computed, OnDestroy, OnInit, signal } from '@angular/core';
import { AtkIconComponent } from '@shared/components/atk-icon/atk-icon.component';
import { Subject, takeUntil } from 'rxjs';
import { BinanceAccount, BinanceBalance } from '../../models/binance.model';
import { BinanceService } from '../../services/binance.service';

@Component({
  selector: 'atk-account-info',
  standalone: true,
  imports: [CommonModule, AtkIconComponent],
  templateUrl: './binance-account-info.component.html',
  styleUrls: ['./../binance.component.css']
})
export class AccountInfoComponent implements OnInit, OnDestroy {
  // Using Angular signals
  account = signal<BinanceAccount | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  private destroy$ = new Subject<void>();

  // Computed property for significant balances
  significantBalances = computed(() => {
    const currentAccount = this.account();

    // AJOUT - Vérifications multiples pour éviter les erreurs
    if (!currentAccount) {
      console.warn('AccountInfo: No account data available');
      return [];
    }
    if (!currentAccount.balances) {
      console.warn('AccountInfo: No balances property in account data');
      return [];
    }
    // AJOUT - Vérification explicite du type Array
    if (!Array.isArray(currentAccount.balances)) {
      console.error('AccountInfo: balances is not an array:', typeof currentAccount.balances, currentAccount.balances);
      return [];
    }
    // MODIFICATION - Filtrage sécurisé avec vérifications supplémentaires
    return currentAccount.balances.filter(balance => {
      // Vérifier que balance est un objet valide
      if (!balance || typeof balance !== 'object') {
        console.warn('AccountInfo: Invalid balance object:', balance);
        return false;
      }
      // Convertir en nombre pour éviter les erreurs de type
      const free = Number(balance.free) || 0;
      const locked = Number(balance.locked) || 0;
      const total = Number(balance.total) || 0;

      return free > 0 || locked > 0 || total > 0;
    });
  });

  constructor(
    private binanceService: BinanceService
  ) { }

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
    this.loading.set(true);
    this.error.set(null);

    this.binanceService.getAccount()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (account) => {
          console.log(account)
          this.account.set(account);
          this.loading.set(false);
        },
        error: (error) => {
          this.error.set(error.message);
          this.loading.set(false);
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
