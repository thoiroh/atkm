import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Observable, Subject } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, tap } from 'rxjs/operators';
import { webSocket, WebSocketSubject, WebSocketSubjectConfig } from 'rxjs/webSocket';

import { WebSocketState, SimplifiedTicker, WebSocketMessage } from '@shared/components/atk-api-socket/atk-api-socket.interfaces';

/**
 * Binance WebSocket Service
 * Manages real-time ticker data streams from Binance WebSocket API
 * Features:
 * - Multi-stream support (multiple trading pairs)
 * - Auto-reconnection with exponential backoff
 * - Debounced updates (500ms)
 * - Connection state management
 * - Error handling and recovery
 */
@Injectable({
  providedIn: 'root'
})
export class AtkApiSocketService {

  // Binance WebSocket URLs
  private readonly WS_BASE_URL = 'wss://stream.binance.com:9443/stream';
  private readonly DEBOUNCE_TIME = 500; // milliseconds
  private readonly MAX_RECONNECT_ATTEMPTS = 10;

  // WebSocket connection
  private wsConnection$: WebSocketSubject<any> | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: any = null;

  // Services
  private destroyRef = inject(DestroyRef);

  // State management with signals
  public connectionState = signal<WebSocketState>({
    status: 'disconnected'
  });

  // Ticker data storage (symbol -> ticker data)
  private tickerDataMap = new Map<string, SimplifiedTicker>();
  private tickerUpdates$ = new Subject<SimplifiedTicker>();

  // Observable for debounced ticker updates
  public tickerUpdates: Observable<SimplifiedTicker> = this.tickerUpdates$.pipe(
    debounceTime(this.DEBOUNCE_TIME),
    distinctUntilChanged((prev, curr) =>
      prev.symbol === curr.symbol &&
      prev.lastPrice === curr.lastPrice
    ),
    takeUntilDestroyed(this.destroyRef)
  );

  // Connected status computed from state
  public isConnected = computed(() =>
    this.connectionState().status === 'connected'
  );

  constructor() {
    // Auto-cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.disconnect();
    });
  }

  /**
   * Connect to Binance WebSocket with multiple streams
   * @param symbols Array of base asset symbols (e.g., ['BTC', 'ETH', 'BNB'])
   */
  public connect(symbols: string[]): void {
    if (this.wsConnection$ && !this.wsConnection$.closed) {
      console.log('WebSocket already connected');
      return;
    }

    if (symbols.length === 0) {
      console.warn('No symbols provided for WebSocket connection');
      return;
    }

    this.updateConnectionState('connecting');

    // Build stream names (e.g., "btcusdt@ticker")
    const streams = symbols.map(symbol =>
      `${symbol.toLowerCase()}usdt@ticker`
    );

    // Create WebSocket URL with streams
    const wsUrl = `${this.WS_BASE_URL}?streams=${streams.join('/')}`;

    console.log(`Connecting to Binance WebSocket: ${wsUrl}`);

    // WebSocket configuration
    const wsConfig: WebSocketSubjectConfig<any> = {
      url: wsUrl,
      openObserver: {
        next: () => {
          console.log('WebSocket connected successfully');
          this.reconnectAttempts = 0;
          this.updateConnectionState('connected');
        }
      },
      closeObserver: {
        next: () => {
          console.log('WebSocket connection closed');
          this.handleDisconnection();
        }
      }
    };

    // Create WebSocket connection
    this.wsConnection$ = webSocket(wsConfig);

    // Subscribe to messages
    this.wsConnection$
      .pipe(
        tap((message: WebSocketMessage) => {
          this.processTickerMessage(message);
        }),
        catchError((error) => {
          console.error('WebSocket error:', error);
          this.updateConnectionState('error', error.message);
          return this.handleError(error);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /**
   * Disconnect from WebSocket
   */
  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.wsConnection$) {
      this.wsConnection$.complete();
      this.wsConnection$ = null;
    }

    this.tickerDataMap.clear();
    this.updateConnectionState('disconnected');
    console.log('WebSocket disconnected');
  }

  /**
   * Get current ticker data for a symbol
   * @param symbol Base asset symbol (e.g., 'BTC')
   */
  public getTickerData(symbol: string): SimplifiedTicker | undefined {
    return this.tickerDataMap.get(symbol.toUpperCase());
  }

  /**
   * Get all ticker data
   */
  public getAllTickerData(): SimplifiedTicker[] {
    return Array.from(this.tickerDataMap.values());
  }

  /**
   * Process incoming ticker message from WebSocket
   */
  private processTickerMessage(message: WebSocketMessage): void {
    try {
      const tickerData = message.data;

      // Extract base asset from symbol (e.g., "BTC" from "BTCUSDT")
      const baseAsset = tickerData.s.replace('USDT', '');

      // Create simplified ticker object
      const ticker: SimplifiedTicker = {
        symbol: tickerData.s,
        baseAsset: baseAsset,
        lastPrice: parseFloat(tickerData.c),
        priceChange: parseFloat(tickerData.p),
        priceChangePercent: parseFloat(tickerData.P),
        high24h: parseFloat(tickerData.h),
        low24h: parseFloat(tickerData.l),
        volume24h: parseFloat(tickerData.v),
        timestamp: tickerData.E
      };

      // Store in map
      this.tickerDataMap.set(baseAsset, ticker);

      // Emit update (will be debounced)
      this.tickerUpdates$.next(ticker);

    } catch (error) {
      console.error('Error processing ticker message:', error);
    }
  }

  /**
   * Handle WebSocket disconnection
   */
  private handleDisconnection(): void {
    this.updateConnectionState('disconnected');

    // Attempt reconnection if within max attempts
    if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
      this.attemptReconnection();
    } else {
      console.error('Max reconnection attempts reached');
      this.updateConnectionState('error', 'Max reconnection attempts reached');
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnection(): void {
    this.reconnectAttempts++;

    // Calculate backoff delay: 0s, 1s, 2s, 5s, 10s, 10s...
    const delays = [0, 1000, 2000, 5000, 10000];
    const delayIndex = Math.min(this.reconnectAttempts - 1, delays.length - 1);
    const delay = delays[delayIndex];

    this.updateConnectionState('reconnecting', undefined, this.reconnectAttempts);

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})`);

    this.reconnectTimer = setTimeout(() => {
      const symbols = Array.from(this.tickerDataMap.keys());
      if (symbols.length > 0) {
        this.connect(symbols);
      }
    }, delay);
  }

  /**
   * Handle WebSocket errors
   */
  private handleError(error: any): Observable<never> {
    console.error('WebSocket error handler:', error);

    // Attempt to reconnect
    this.handleDisconnection();

    return EMPTY;
  }

  /**
   * Update connection state signal
   */
  private updateConnectionState(
    status: WebSocketState['status'],
    error?: string,
    reconnectAttempt?: number
  ): void {
    const newState: WebSocketState = {
      status,
      error,
      reconnectAttempt,
      lastConnected: status === 'connected' ? Date.now() : this.connectionState().lastConnected
    };

    this.connectionState.set(newState);
  }
}
