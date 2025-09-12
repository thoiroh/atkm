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

  // Computed property for significant balances - UPDATED with better filtering
  significantBalances = computed(() => {
    const currentAccount = this.account();

    console.log('🔍 AccountInfo: Computing significant balances...');

    if (!currentAccount) {
      console.warn('❌ AccountInfo: No account data available');
      return [];
    }

    if (!currentAccount.balances) {
      console.warn('❌ AccountInfo: No balances property in account data');
      return [];
    }

    if (!Array.isArray(currentAccount.balances)) {
      console.error('❌ AccountInfo: balances is not an array:', typeof currentAccount.balances, currentAccount.balances);
      return [];
    }

    console.log('📊 AccountInfo: Raw balances count:', currentAccount.balances.length);
    console.log('📊 AccountInfo: Sample balance:', currentAccount.balances[0]);

    // UPDATED - Improved filtering logic with detailed logging
    const significantBalances = currentAccount.balances.filter(balance => {
      if (!balance || typeof balance !== 'object') {
        console.warn('⚠️ AccountInfo: Invalid balance object:', balance);
        return false;
      }

      // Convert to numbers - handle both string and number formats
      const free = parseFloat(balance.free?.toString() || '0');
      const locked = parseFloat(balance.locked?.toString() || '0');

      // Calculate total if not provided by service
      const total = balance.total !== undefined
        ? parseFloat(balance.total.toString())
        : free + locked;

      const hasBalance = free > 0 || locked > 0 || total > 0;

      // Log detailed info for each asset with balance
      if (hasBalance) {
        console.log(`✅ ${balance.asset}: free=${free}, locked=${locked}, total=${total}`);
      }

      return hasBalance;
    });

    console.log('🎯 AccountInfo: Significant balances found:', significantBalances.length);
    console.log('🎯 AccountInfo: Assets with balances:', significantBalances.map(b => b.asset));

    return significantBalances;
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
   * Load Binance account information
   */
  loadAccountInfo(): void {
    console.log('🔄 AccountInfo: Loading account data...');
    this.loading.set(true);
    this.error.set(null);

    this.binanceService.getAccount()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (account) => {
          console.log('✅ AccountInfo: Account data received:', account);
          console.log('📊 AccountInfo: Balances in account:', account.balances?.length || 0);

          // Log first few balances for debugging
          if (account.balances && account.balances.length > 0) {
            console.log('📊 AccountInfo: First 3 balances:', account.balances.slice(0, 3));
          }

          this.account.set(account);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('❌ AccountInfo: Error loading account:', error);
          this.error.set(error.message);
          this.loading.set(false);
        }
      });
  }

  /**
   * Refresh account data
   */
  refreshAccount(): void {
    this.loadAccountInfo();
  }

  /**
   * Format balance number with appropriate decimals
   */
  formatBalance(value: number | string): string {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (numValue === 0 || isNaN(numValue)) return '0';
    if (numValue < 0.00001) return numValue.toExponential(2);
    if (numValue < 1) return numValue.toFixed(8);

    return numValue.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    });
  }

  /**
   * Format update time
   */
  formatUpdateTime(timestamp: number | null | undefined): string {
    if (!timestamp) return 'Non disponible';
    return new Date(timestamp).toLocaleString('fr-FR');
  }

  /**
   * Get CSS class for permission status
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
   * TrackBy function for balance list optimization
   */
  trackByAsset(index: number, balance: BinanceBalance): string {
    return balance.asset;
  }
}
