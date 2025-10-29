import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, effect, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { BinanceService } from '@features/binance/services/binance.service';
import { BinanceUserAsset, SimplifiedTicker, WalletAsset } from '@shared/components/atk-api-socket/atk-api-socket.interfaces';
import { AtkApiSocketService } from '@shared/components/atk-api-socket/atk-api-socket.service';

/**
 * Binance Socket Component
 * Displays real-time cryptocurrency wallet balances with live price updates
 * Features:
 * - Fetches wallet assets from Binance API
 * - Connects to Binance WebSocket for real-time prices
 * - Displays each asset as a card with live price, balance, and total value
 * - Auto-reconnection and error handling
 * - Debounced updates for performance
 */
@Component({
  selector: 'atk-binance-socket',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './atk-api-socket.component.html',
  styleUrl: './atk-api-socket.component.css'
})
export class AtkApiSocketComponent implements OnInit {

  // Services
  private binanceService = inject(BinanceService);
  private websocketService = inject(AtkApiSocketService);
  private destroyRef = inject(DestroyRef);

  // Component state signals
  public loading = signal<boolean>(false);
  public error = signal<string | null>(null);
  public walletAssets = signal<WalletAsset[]>([]);

  // WebSocket state
  public wsState = this.websocketService.connectionState;
  public isConnected = this.websocketService.isConnected;

  // Convert WebSocket ticker updates to signal
  public tickerUpdate = toSignal(this.websocketService.tickerUpdates, {
    initialValue: null
  });

  // Computed values
  public totalPortfolioValue = computed(() => {
    return this.walletAssets().reduce((sum, asset) => sum + asset.totalValue, 0);
  });

  public assetCount = computed(() => this.walletAssets().length);

  // Sorted assets (alphabetically by symbol)
  public sortedAssets = computed(() => {
    return [...this.walletAssets()].sort((a, b) =>
      a.symbol.localeCompare(b.symbol)
    );
  });

  constructor() {
    // React to ticker updates and update wallet assets
    effect(() => {
      const ticker = this.tickerUpdate();
      if (ticker) {
        this.updateAssetPrice(ticker);
      }
    });
  }

  ngOnInit(): void {
    this.loadWalletAssets();
  }

  /**
   * Load wallet assets from Binance API
   */
  private async loadWalletAssets(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      // Fetch user assets from Binance API
      const response = await this.binanceService.getUserAssets().toPromise();

      if (!response || !response.success) {
        throw new Error('Failed to fetch wallet assets');
      }

      const assets: BinanceUserAsset[] = response.data.assets || [];

      // Filter assets with balance > 0
      const activeAssets = assets.filter(asset => {
        const totalBalance = parseFloat(asset.free) + parseFloat(asset.locked);
        return totalBalance > 0;
      });

      // Convert to WalletAsset format
      const walletAssets: WalletAsset[] = activeAssets.map(asset => ({
        symbol: asset.asset,
        balance: parseFloat(asset.free) + parseFloat(asset.locked),
        freeBalance: parseFloat(asset.free),
        lockedBalance: parseFloat(asset.locked),
        currentPrice: 0,  // Will be updated by WebSocket
        totalValue: 0,    // Will be calculated after price update
        priceChange24h: 0,
        priceDirection: 'neutral',
        lastUpdate: Date.now()
      }));

      this.walletAssets.set(walletAssets);

      // Connect to WebSocket for real-time prices
      if (walletAssets.length > 0) {
        const symbols = walletAssets.map(asset => asset.symbol);
        this.connectWebSocket(symbols);
      }

    } catch (err: any) {
      console.error('Error loading wallet assets:', err);
      this.error.set(err.message || 'Failed to load wallet assets');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Connect to WebSocket for real-time price updates
   */
  private connectWebSocket(symbols: string[]): void {
    try {
      this.websocketService.connect(symbols);
    } catch (err: any) {
      console.error('Error connecting to WebSocket:', err);
      this.error.set('Failed to connect to real-time price feed');
    }
  }

  /**
   * Update asset price from ticker data
   */
  private updateAssetPrice(ticker: SimplifiedTicker): void {
    const assets = this.walletAssets();
    const assetIndex = assets.findIndex(a => a.symbol === ticker.baseAsset);

    if (assetIndex === -1) {
      return;
    }

    // Create updated asset
    const updatedAsset: WalletAsset = {
      ...assets[assetIndex],
      currentPrice: ticker.lastPrice,
      totalValue: assets[assetIndex].balance * ticker.lastPrice,
      priceChange24h: ticker.priceChangePercent,
      priceDirection: this.getPriceDirection(ticker.priceChangePercent),
      lastUpdate: ticker.timestamp
    };

    // Update assets array
    const updatedAssets = [...assets];
    updatedAssets[assetIndex] = updatedAsset;
    this.walletAssets.set(updatedAssets);
  }

  /**
   * Determine price direction based on 24h change
   */
  private getPriceDirection(priceChange: number): 'up' | 'down' | 'neutral' {
    if (priceChange > 0) return 'up';
    if (priceChange < 0) return 'down';
    return 'neutral';
  }

  /**
   * Retry loading wallet assets
   */
  public retryLoad(): void {
    this.loadWalletAssets();
  }

  /**
   * Reconnect WebSocket manually
   */
  public reconnectWebSocket(): void {
    this.websocketService.disconnect();
    const symbols = this.walletAssets().map(asset => asset.symbol);
    if (symbols.length > 0) {
      this.connectWebSocket(symbols);
    }
  }

  /**
   * Format number with appropriate decimal places
   */
  public formatNumber(value: number, decimals: number = 2): string {
    return value.toFixed(decimals);
  }

  /**
   * Format large numbers with K/M/B suffixes
   */
  public formatLargeNumber(value: number): string {
    if (value >= 1_000_000_000) {
      return (value / 1_000_000_000).toFixed(2) + 'B';
    }
    if (value >= 1_000_000) {
      return (value / 1_000_000).toFixed(2) + 'M';
    }
    if (value >= 1_000) {
      return (value / 1_000).toFixed(2) + 'K';
    }
    return value.toFixed(2);
  }

  /**
   * Get WebSocket status display text
   */
  public getConnectionStatusText(): string {
    const state = this.wsState();
    switch (state.status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'reconnecting':
        return `Reconnecting (${state.reconnectAttempt || 0})...`;
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return 'Connection Error';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get WebSocket status CSS class
   */
  public getConnectionStatusClass(): string {
    const state = this.wsState();
    switch (state.status) {
      case 'connected':
        return 'status-connected';
      case 'connecting':
      case 'reconnecting':
        return 'status-connecting';
      case 'disconnected':
        return 'status-disconnected';
      case 'error':
        return 'status-error';
      default:
        return '';
    }
  }
}
