// atk-bash-config.factory.ts
// EXTENDED - Factory with enhanced crypto formatters

import { Injectable, inject } from '@angular/core';
import { IBashConfig, IBashEndpointConfig, IBashSidebarField, IBashDataTransformResult } from '@shared/components/atk-bash/atk-bash.interfaces';
import { CryptoTradingFormatters } from '@shared/formatters/crypto-trading.formatters';

@Injectable({
  providedIn: 'root'
})
export class AtkBashConfigFactory {

  private cryptoFormatters = inject(CryptoTradingFormatters);

  /**
   * Create Binance debug configuration - ENHANCED with crypto formatters
   */
  createBinanceDebugConfig(): IBashConfig {
    return {
      id: 'binance-debug-v2',
      title: 'Binance API Enhanced Debug Terminal',
      subtitle: 'Enhanced debugging with ATK Bash component architecture',
      defaultEndpoint: 'account',
      terminal: {
        editable: true,
        height: '200px',
        showControls: true,
        customCommands: [
          {
            name: 'clear',
            description: 'Clear all terminal logs',
            handler: () => console.log('Clearing logs...')
          },
          {
            name: 'test',
            description: 'Test specific endpoint',
            handler: (args: string[]) => console.log(`Testing endpoint: ${args[0]}`)
          },
          {
            name: 'symbol',
            description: 'Set trading symbol for queries',
            handler: (args: string[]) => console.log(`Setting symbol: ${args[0]}`)
          },
          {
            name: 'balance',
            description: 'Show balance for specific asset',
            handler: (args: string[]) => console.log(`Checking balance for: ${args[0]}`)
          }
        ]
      },
      table: {
        showEmptyState: true,
        itemsPerPage: 100,
        searchEnabled: true
      },
      endpoints: [
        this.createAccountEndpoint(),
        this.createTradesEndpoint(),
        this.createOrdersEndpoint(),
        this.createTickerEndpoint()
      ],
      actions: []
    };
  }

  // =========================================
  // PRIVATE ENDPOINT CREATORS - ENHANCED
  // =========================================

  private createAccountEndpoint(): IBashEndpointConfig {
    return {
      id: 'account',
      name: 'Account Information',
      url: 'http://localhost:8000/api/v3/account',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug': 'true'
      },
      cacheable: true,
      cacheDuration: 30000,

      // ENHANCED SIDEBAR FIELDS with formatters
      sidebarFields: [
        {
          key: 'canTrade',
          label: 'Trading Permission',
          type: 'boolean',
          group: 'permissions',
          icon: 'trending-up',
          formatter: (value: boolean) => this.cryptoFormatters.formatSidebarBoolean(value).text
        },
        {
          key: 'canWithdraw',
          label: 'Withdrawal Permission',
          type: 'boolean',
          group: 'permissions',
          icon: 'arrow-up-circle',
          formatter: (value: boolean) => this.cryptoFormatters.formatSidebarBoolean(value).text
        },
        {
          key: 'canDeposit',
          label: 'Deposit Permission',
          type: 'boolean',
          group: 'permissions',
          icon: 'arrow-down-circle',
          formatter: (value: boolean) => this.cryptoFormatters.formatSidebarBoolean(value).text
        },
        {
          key: 'brokered',
          label: 'Brokered Account',
          type: 'boolean',
          group: 'account',
          icon: 'briefcase',
          formatter: (value: boolean) => this.cryptoFormatters.formatSidebarBoolean(value).text
        },
        {
          key: 'requireSelfTradePrevention',
          label: 'Self Trade Prevention',
          type: 'boolean',
          group: 'settings',
          icon: 'shield-check',
          formatter: (value: boolean) => this.cryptoFormatters.formatSidebarBoolean(value).text
        },
        {
          key: 'preventSor',
          label: 'Prevent SOR',
          type: 'boolean',
          group: 'settings',
          icon: 'shield-x',
          formatter: (value: boolean) => this.cryptoFormatters.formatSidebarBoolean(value).text
        },
        {
          key: 'updateTime',
          label: 'Last Update',
          type: 'date',
          group: 'info',
          icon: 'clock',
          formatter: (value: number) => this.cryptoFormatters.formatUpdateTime(value)
        },
        {
          key: 'accountType',
          label: 'Account Type',
          type: 'status',
          group: 'info',
          icon: 'user',
          cssClass: 'account-type-badge',
          formatter: (value: string) => this.cryptoFormatters.formatAccountType(value).text
        },
        // NEW: Commission info
        {
          key: 'makerCommission',
          label: 'Maker Commission',
          type: 'custom',
          group: 'fees',
          icon: 'percent',
          formatter: (value: number) => `${(value / 100).toFixed(4)}%`
        },
        {
          key: 'takerCommission',
          label: 'Taker Commission',
          type: 'custom',
          group: 'fees',
          icon: 'percent',
          formatter: (value: number) => `${(value / 100).toFixed(4)}%`
        }
      ],

      // ENHANCED TABLE COLUMNS with crypto formatters
      columns: [
        {
          key: 'asset',
          label: 'Asset',
          width: '15%',
          align: 'left',
          type: 'text',
          sortable: true,
          cssClass: 'font-weight-bold asset-cell'
        },
        {
          key: 'free',
          label: 'Available',
          width: '25%',
          align: 'right',
          type: 'custom',
          sortable: true,
          formatter: (value: number, row: any) => this.cryptoFormatters.formatBalance(value, row.asset)
        },
        {
          key: 'locked',
          label: 'In Orders',
          width: '25%',
          align: 'right',
          type: 'custom',
          sortable: true,
          formatter: (value: number, row: any) => this.cryptoFormatters.formatBalance(value, row.asset),
          cssClass: 'locked-balance'
        },
        {
          key: 'total',
          label: 'Total Balance',
          width: '25%',
          align: 'right',
          type: 'custom',
          sortable: true,
          formatter: (value: number, row: any) => this.cryptoFormatters.formatBalance(value, row.asset),
          cssClass: 'total-balance font-weight-bold'
        },
        {
          key: 'usdValue',
          label: 'USD Value',
          width: '10%',
          align: 'right',
          type: 'custom',
          sortable: true,
          visible: false, // Hidden for now
          formatter: (value: number) => this.cryptoFormatters.formatPrice(value, 'USDT')
        }
      ],

      // ENHANCED DATA TRANSFORMER
      dataTransformer: (apiResponse: any): IBashDataTransformResult => {
        if (!apiResponse?.data) {
          return { sidebarData: {}, tableData: [] };
        }

        const accountData = apiResponse.data;

        // SIDEBAR DATA - Account info fields
        const sidebarData = {
          canTrade: accountData.canTrade || false,
          canWithdraw: accountData.canWithdraw || false,
          canDeposit: accountData.canDeposit || false,
          brokered: accountData.brokered || false,
          requireSelfTradePrevention: accountData.requireSelfTradePrevention || false,
          preventSor: accountData.preventSor || false,
          updateTime: accountData.updateTime || Date.now(),
          accountType: accountData.accountType || 'UNKNOWN',
          makerCommission: accountData.makerCommission || 0,
          takerCommission: accountData.takerCommission || 0
        };

        // ENHANCED TABLE DATA - Balances with improved filtering
        const tableData = (accountData.balances || [])
          .filter((balance: any) => {
            const free = parseFloat(balance.free || '0');
            const locked = parseFloat(balance.locked || '0');
            // Only show balances with meaningful amounts (> 0.00000001)
            return (free + locked) > 0.00000001;
          })
          .map((balance: any) => {
            const free = parseFloat(balance.free || '0');
            const locked = parseFloat(balance.locked || '0');
            const total = free + locked;

            return {
              id: balance.asset,
              asset: balance.asset,
              free,
              locked,
              total,
              usdValue: 0 // Would need price conversion API
            };
          })
          .sort((a: any, b: any) => b.total - a.total); // Sort by total balance descending

        return { sidebarData, tableData };
      }
    };
  }

  private createTradesEndpoint(): IBashEndpointConfig {
    return {
      id: 'trades',
      name: 'My Trade History',
      url: 'http://localhost:8000/api/v3/myTrades',
      method: 'GET',
      params: {
        symbol: 'BTCUSDT',
        limit: 100
      },
      cacheable: true,
      cacheDuration: 60000,

      // NO SIDEBAR DATA FOR TRADES
      sidebarFields: [],

      // ENHANCED TABLE COLUMNS FOR TRADES
      columns: [
        {
          key: 'symbol',
          label: 'Symbol',
          width: '12%',
          align: 'left',
          type: 'text',
          sortable: true,
          cssClass: 'symbol-cell'
        },
        {
          key: 'side',
          label: 'Side',
          width: '8%',
          align: 'center',
          type: 'custom',
          sortable: true,
          formatter: (value: string) => this.cryptoFormatters.formatTradeSide(value).text,
          cssClass: 'side-cell'
        },
        {
          key: 'quantity',
          label: 'Quantity',
          width: '15%',
          align: 'right',
          type: 'custom',
          sortable: true,
          formatter: (value: number, row: any) => {
            const baseAsset = row.symbol?.replace(/USDT|BTC|ETH|BNB$/, '') || 'Unknown';
            return this.cryptoFormatters.formatQuantity(value, baseAsset);
          }
        },
        {
          key: 'price',
          label: 'Price',
          width: '15%',
          align: 'right',
          type: 'custom',
          sortable: true,
          formatter: (value: number, row: any) => this.cryptoFormatters.formatPrice(value, row.symbol)
        },
        {
          key: 'quoteQuantity',
          label: 'Total',
          width: '15%',
          align: 'right',
          type: 'custom',
          sortable: true,
          formatter: (value: number, row: any) => {
            const quoteAsset = this.extractQuoteAsset(row.symbol);
            return this.cryptoFormatters.formatPrice(value, quoteAsset);
          }
        },
        {
          key: 'commission',
          label: 'Fee',
          width: '12%',
          align: 'right',
          type: 'custom',
          sortable: true,
          formatter: (value: number, row: any) => this.cryptoFormatters.formatFee(value, row.commissionAsset || 'BNB')
        },
        {
          key: 'time',
          label: 'Time',
          width: '13%',
          align: 'right',
          type: 'custom',
          sortable: true,
          formatter: (value: number) => this.cryptoFormatters.formatTradingTimestamp(value, { showDate: false })
        },
        {
          key: 'isMaker',
          label: 'Type',
          width: '10%',
          align: 'center',
          type: 'custom',
          sortable: true,
          formatter: (value: boolean) => value ? 'Maker' : 'Taker',
          cssClass: 'maker-taker-cell'
        }
      ],

      dataTransformer: (apiResponse: any): IBashDataTransformResult => {
        if (!Array.isArray(apiResponse?.data?.trades)) {
          return { sidebarData: {}, tableData: [] };
        }

        const tableData = apiResponse.data.trades.map((trade: any) => ({
          id: trade.id || `${trade.symbol}-${trade.time}`,
          symbol: trade.symbol,
          side: trade.isBuyer ? 'BUY' : 'SELL',
          quantity: parseFloat(trade.qty || '0'),
          price: parseFloat(trade.price || '0'),
          quoteQuantity: parseFloat(trade.quoteQty || '0'),
          commission: parseFloat(trade.commission || '0'),
          commissionAsset: trade.commissionAsset,
          time: trade.time,
          isMaker: trade.isMaker || false
        }));

        return { sidebarData: {}, tableData };
      }
    };
  }

  private createOrdersEndpoint(): IBashEndpointConfig {
    return {
      id: 'orders',
      name: 'Order History',
      url: 'http://localhost:8000/api/v3/allOrders',
      method: 'GET',
      params: {
        symbol: 'BTCUSDT',
        limit: 100
      },
      cacheable: true,
      cacheDuration: 60000,

      // NO SIDEBAR DATA FOR ORDERS
      sidebarFields: [],

      // ENHANCED COLUMNS FOR ORDERS
      columns: [
        {
          key: 'symbol',
          label: 'Symbol',
          width: '12%',
          align: 'left',
          type: 'text',
          sortable: true
        },
        {
          key: 'side',
          label: 'Side',
          width: '8%',
          align: 'center',
          type: 'custom',
          sortable: true,
          formatter: (value: string) => this.cryptoFormatters.formatTradeSide(value).text
        },
        {
          key: 'type',
          label: 'Type',
          width: '10%',
          align: 'center',
          type: 'text',
          sortable: true,
          cssClass: 'order-type-cell'
        },
        {
          key: 'quantity',
          label: 'Quantity',
          width: '15%',
          align: 'right',
          type: 'custom',
          sortable: true,
          formatter: (value: number, row: any) => {
            const baseAsset = row.symbol?.replace(/USDT|BTC|ETH|BNB$/, '') || 'Unknown';
            return this.cryptoFormatters.formatQuantity(value, baseAsset);
          }
        },
        {
          key: 'price',
          label: 'Price',
          width: '15%',
          align: 'right',
          type: 'custom',
          sortable: true,
          formatter: (value: number, row: any) => {
            if (value === 0 && row.type === 'MARKET') return 'Market';
            return this.cryptoFormatters.formatPrice(value, row.symbol);
          }
        },
        {
          key: 'status',
          label: 'Status',
          width: '10%',
          align: 'center',
          type: 'custom',
          sortable: true,
          formatter: (value: string) => this.cryptoFormatters.formatOrderStatus(value).text
        },
        {
          key: 'executedQty',
          label: 'Filled',
          width: '15%',
          align: 'right',
          type: 'custom',
          sortable: true,
          formatter: (value: number, row: any) => {
            const baseAsset = row.symbol?.replace(/USDT|BTC|ETH|BNB$/, '') || 'Unknown';
            return this.cryptoFormatters.formatQuantity(value, baseAsset);
          }
        },
        {
          key: 'time',
          label: 'Time',
          width: '15%',
          align: 'right',
          type: 'custom',
          sortable: true,
          formatter: (value: number) => this.cryptoFormatters.formatTradingTimestamp(value)
        }
      ],

      dataTransformer: (apiResponse: any): IBashDataTransformResult => {
        if (!Array.isArray(apiResponse?.data?.orders)) {
          return { sidebarData: {}, tableData: [] };
        }

        const tableData = apiResponse.data.orders.map((order: any) => ({
          id: order.orderId || `${order.symbol}-${order.time}`,
          symbol: order.symbol,
          side: order.side,
          type: order.type,
          quantity: parseFloat(order.origQty || '0'),
          price: parseFloat(order.price || '0'),
          status: order.status,
          executedQty: parseFloat(order.executedQty || '0'),
          time: order.time
        }));

        return { sidebarData: {}, tableData };
      }
    };
  }

  private createTickerEndpoint(): IBashEndpointConfig {
    return {
      id: 'ticker',
      name: 'Price Ticker',
      url: 'http://localhost:8000/api/v3/ticker/price',
      method: 'GET',
      params: {
        symbol: 'BTCUSDT'
      },
      cacheable: true,
      cacheDuration: 10000,

      // NO SIDEBAR DATA FOR TICKER
      sidebarFields: [],

      // ENHANCED TICKER COLUMNS
      columns: [
        {
          key: 'symbol',
          label: 'Symbol',
          width: '25%',
          align: 'left',
          type: 'text',
          sortable: true,
          cssClass: 'symbol-cell'
        },
        {
          key: 'price',
          label: 'Price',
          width: '25%',
          align: 'right',
          type: 'custom',
          sortable: true,
          formatter: (value: number, row: any) => this.cryptoFormatters.formatPrice(value, row.symbol),
          cssClass: 'price-cell'
        },
        {
          key: 'priceChange',
          label: '24h Change',
          width: '20%',
          align: 'right',
          type: 'custom',
          sortable: true,
          formatter: (value: number, row: any) => {
            const change = this.cryptoFormatters.formatPriceChange(value, this.extractQuoteAsset(row.symbol));
            return change.text;
          }
        },
        {
          key: 'priceChangePercent',
          label: '24h Change %',
          width: '20%',
          align: 'right',
          type: 'custom',
          sortable: true,
          formatter: (value: number) => this.cryptoFormatters.formatPercentageChange(value).text,
          cssClass: 'price-change-cell'
        },
        {
          key: 'volume',
          label: '24h Volume',
          width: '10%',
          align: 'right',
          type: 'custom',
          sortable: true,
          visible: false,
          formatter: (value: number) => this.cryptoFormatters.formatVolume(value)
        }
      ],

      dataTransformer: (apiResponse: any): IBashDataTransformResult => {
        // Handle both single ticker and array of tickers
        const data = apiResponse?.data;
        const tickers = Array.isArray(data) ? data : [data];

        const tableData = tickers.map((ticker: any, index: number) => ({
          id: ticker.symbol || index,
          symbol: ticker.symbol,
          price: parseFloat(ticker.price || '0'),
          // Add fake change data (would come from 24hr ticker in real implementation)
          priceChange: Math.random() * 100 - 50,
          priceChangePercent: Math.random() * 20 - 10,
          volume: Math.random() * 1000000
        }));

        return { sidebarData: {}, tableData };
      }
    };
  }

  // =========================================
  // UTILITY METHODS
  // =========================================

  /**
   * Extract quote asset from trading pair symbol
   */
  private extractQuoteAsset(symbol: string): string {
    if (!symbol) return 'USDT';

    const upperSymbol = symbol.toUpperCase();

    if (upperSymbol.endsWith('USDT')) return 'USDT';
    if (upperSymbol.endsWith('USDC')) return 'USDC';
    if (upperSymbol.endsWith('BTC')) return 'BTC';
    if (upperSymbol.endsWith('ETH')) return 'ETH';
    if (upperSymbol.endsWith('BNB')) return 'BNB';
    if (upperSymbol.endsWith('BUSD')) return 'BUSD';

    return 'USDT'; // Default fallback
  }

  // =========================================
  // LEGACY FORMATTERS (kept for compatibility)
  // =========================================

  private formatBalance(value: number): string {
    return this.cryptoFormatters.formatBalance(value);
  }

  private formatPrice(value: number): string {
    return this.cryptoFormatters.formatPrice(value);
  }

  private formatQuantity(value: number): string {
    return this.cryptoFormatters.formatQuantity(value);
  }

  private formatFee(value: number): string {
    return this.cryptoFormatters.formatFee(value);
  }

  // =========================================
  // FUTURE CONFIGURATIONS
  // =========================================

  /**
   * Create IBKR configuration (future use) - ENHANCED
   */
  createIbkrConfig(): IBashConfig {
    return {
      id: 'ibkr-debug-v1',
      title: 'Interactive Brokers Debug Terminal',
      subtitle: 'IBKR API debugging and data analysis',
      defaultEndpoint: 'account',
      terminal: {
        editable: true,
        height: '450px',
        showControls: true,
        customCommands: [
          {
            name: 'portfolio',
            description: 'Show portfolio summary',
            handler: () => console.log('Portfolio summary...')
          },
          {
            name: 'positions',
            description: 'Show current positions',
            handler: () => console.log('Current positions...')
          }
        ]
      },
      table: {
        showEmptyState: true,
        itemsPerPage: 50,
        searchEnabled: true
      },
      endpoints: [
        // Will be implemented later with same enhanced structure
      ],
      actions: []
    };
  }

  /**
   * Enhanced generic API configuration creator
   */
  createGenericApiConfig(
    id: string,
    title: string,
    baseUrl: string,
    customFormatters?: Record<string, (value: any, row?: any) => string>
  ): IBashConfig {
    return {
      id,
      title,
      subtitle: `${title} API debugging terminal`,
      defaultEndpoint: 'default',
      terminal: {
        editable: true,
        height: '400px',
        showControls: true
      },
      table: {
        showEmptyState: true,
        itemsPerPage: 100,
        searchEnabled: true
      },
      endpoints: [
        {
          id: 'default',
          name: 'Default Endpoint',
          url: `${baseUrl}/api/default`,
          method: 'GET',
          columns: [
            {
              key: 'id',
              label: 'ID',
              width: '20%',
              type: 'text',
              sortable: true
            },
            {
              key: 'name',
              label: 'Name',
              width: '40%',
              type: 'text',
              sortable: true
            },
            {
              key: 'value',
              label: 'Value',
              width: '40%',
              type: 'custom',
              sortable: true,
              formatter: customFormatters?.value || ((v: any) => v.toString())
            }
          ],
          sidebarFields: [],
          dataTransformer: (data: any): IBashDataTransformResult => ({
            sidebarData: {},
            tableData: Array.isArray(data) ? data : [data]
          })
        }
      ],
      actions: []
    };
  }
}
