import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { AtkIconComponent } from '@shared/components/atk-icon/atk-icon.component';
import { ToolsService } from '@shared/components/atk-tools/tools.service';
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
  account = signal<BinanceAccount | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  private destroy$ = new Subject<void>();
  private tools = inject(ToolsService);

  // Computed property for significant balances - UPDATED with better filtering
  significantBalances = computed(() => {
    const currentAccount = this.account();
    // TAG: binance-account-info.component.27 ================ CONSOLE LOG IN PROGRESS
    this.tools.consoleGroup({
      title: `AccountInfoComponent.29: AccountInfo Computing significant balances...`,
      tag: 'rook',
      data: null,
      palette: 'su',
      collapsed: true,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSizePx: 13
    });

    if (!currentAccount) {
      // TAG: binance-account-info.component.39 ================ CONSOLE LOG IN PROGRESS
      this.tools.consoleGroup({
        title: `AccountInfoComponent.39: AccountInfo No account data available`,
        tag: 'cross',
        data: null,
        palette: 'wa',
        collapsed: true,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSizePx: 13
      });
      return [];
    }

    if (!currentAccount.balances) {
      // TAG: binance-account-info.component.53 ================ CONSOLE LOG IN PROGRESS
      this.tools.consoleGroup({
        title: `AccountInfoComponent.53: AccountInfo No balances property in account data`,
        tag: 'cross',
        data: null,
        palette: 'wa',
        collapsed: true,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSizePx: 13
      });
      return [];
    }

    if (!Array.isArray(currentAccount.balances)) {
      // TAG: binance-account-info.component.67 ================ CONSOLE LOG IN PROGRESS
      this.tools.consoleGroup({
        title: `AccountInfoComponent.67: AccountInfo balances is not an array:`,
        tag: 'cross',
        data: [(typeof currentAccount.balances), currentAccount.balances],
        palette: 'wa',
        collapsed: true,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSizePx: 13
      });
      return [];
    }

    // TAG: binance-account-info.component.80 ================ CONSOLE LOG IN PROGRESS
    this.tools.consoleGroup({
      title: `AccountInfoComponent.80: AccountInfo Raw balances count:`,
      tag: 'check',
      data: currentAccount.balances.length,
      palette: 'su',
      collapsed: true,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSizePx: 13
    });
    // TAG: binance-account-info.component.90 ================ CONSOLE LOG IN PROGRESS
    this.tools.consoleGroup({
      title: `AccountInfoComponent.90: AccountInfo Sample balance:`,
      tag: 'check',
      data: currentAccount.balances,
      palette: 'su',
      collapsed: true,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSizePx: 13,
      arrayAsTable: true,        // true | false | 'auto'

    });

    // UPDATED - Improved filtering logic with detailed logging
    const significantBalances = currentAccount.balances.filter(balance => {
      if (!balance || typeof balance !== 'object') {
        // TAG: binance-account-info.component.104 ================ CONSOLE LOG IN PROGRESS
        this.tools.consoleGroup({
          title: `AccountInfoComponent.104: AccountInfo Invalid balance object:`,
          tag: 'cross',
          data: balance,
          palette: 'wa',
          collapsed: true,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSizePx: 13
        });
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

        // console.log(`✅ ${balance.asset}: free=${free}, locked=${locked}, total=${total}`);
      }

      return hasBalance;
    });

    // TAG: binance-account-info.component.137 ================ CONSOLE LOG IN PROGRESS
    this.tools.consoleGroup({
      title: `AccountInfoComponent.139: AccountInfo Significant balances found:`,
      tag: 'cross',
      data: { significantBalances: significantBalances.length, assets: [significantBalances.map(b => b.asset)] },
      palette: 'wa',
      collapsed: false,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSizePx: 13
    });

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
    // TAG: binance-account-info.component.168 ================ CONSOLE LOG IN PROGRESS
    this.tools.consoleGroup({
      title: `AccountInfoComponent.160: loadAccountInfo() AccountInfo: Loading account data ...`,
      tag: 'check',
      data: null,
      palette: 'de',
      collapsed: true,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSizePx: 13
    });
    this.loading.set(true);
    this.error.set(null);

    this.binanceService.getAccount()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (account) => {
          if (account.balances && account.balances.length > 0) {
            // TAG: binance-account-info.component.187 ================ CONSOLE LOG IN PROGRESS
            this.tools.consoleGroup({
              title: `AccountInfoComponent.187: loadAccountInfo() AccountInfo: Account data received:`,
              tag: 'check',
              data: [account.balances],
              palette: 'su',
              collapsed: false,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSizePx: 13,
              arrayAsTable: 'auto',         // 'true' pour forcer, 'false' pour désactiver
              tableMinRows: 3,
              tableMinCommonKeys: 2,
              tableSampleSize: 8
            });
          }
          // data: { account: account, count: account.balances?.length || 0, balances: account.balances },

          this.account.set(account);
          this.loading.set(false);
        },
        error: (error) => {
          // TAG: binance-account-info.component.187 ================ CONSOLE LOG IN PROGRESS
          this.tools.consoleGroup({
            title: `AccountInfoComponent.187: binanceService.getAccount() AccountInfo: Error loading account:`,
            tag: 'cross',
            data: error,
            palette: 'er',
            collapsed: true,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSizePx: 13
          });
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
