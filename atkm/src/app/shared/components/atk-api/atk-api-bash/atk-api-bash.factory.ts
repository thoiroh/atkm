// atk-bash-config.factory.ts
// EXTENDED - Factory for creating bash configurations with sidebar/table separation

import { Injectable } from '@angular/core';
import { IBashConfig, IBashDataTransformResult, IBashEndpointConfig } from '@shared/components/atk-api/atk-api-bash/atk-api-bash.interfaces';

@Injectable({
  providedIn: 'root'
})
export class AtkApiBashFactory {

  /**
   * Create Binance debug configuration - EXTENDED
   */
  createBinanceDebugConfig(): IBashConfig {
    return {
      id: 'atkpi-debug-v1',
      title: 'atkpi API Enhanced Debug Terminal',
      subtitle: 'Enhanced debugging with atk-bash component architecture',
      defaultEndpoint: 'account',
      terminal: {
        editable: true,
        height: '100px',
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
        // this.createTradesEndpoint(),
        // this.createOrdersEndpoint(),
        // this.createTickerEndpoint()
      ],
      actions: []
    };
  }

  // =========================================
  // PRIVATE ENDPOINT CREATORS - EXTENDED
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

      // ROW DETAILS FIELDS CONFIGURATION
      rowDetailFields: [
        {
          key: 'asset',
          label: 'Asset Symbol',
          type: 'text',
          group: 'identity',
          icon: 'coins'
        },
        {
          key: 'free',
          label: 'Available Balance',
          type: 'custom',
          group: 'balances',
          icon: 'circle',
          formatter: (value: number) => this.formatBalance(value)
        },
        {
          key: 'locked',
          label: 'Locked Balance',
          type: 'custom',
          group: 'balances',
          icon: 'lock',
          formatter: (value: number) => this.formatBalance(value)
        },
        {
          key: 'total',
          label: 'Total Balance',
          type: 'custom',
          group: 'balances',
          icon: 'trending-up',
          formatter: (value: number) => this.formatBalance(value)
        },
        {
          key: 'usdValue',
          label: 'USD Value (est.)',
          type: 'custom',
          group: 'valuation',
          icon: 'dollar-sign',
          visible: true,
          formatter: (value: number) => this.formatPrice(value)

        }
      ],
      // SIDEBAR FIELDS CONFIGURATION
      sidebarFields: [
        {
          key: 'accountType',
          label: 'Account Type',
          type: 'status',
          group: 'info',
          icon: 'user',
          cssClass: 'account-type-badge'
        },
        {
          key: 'updateTime',
          label: 'Last Update',
          type: 'date',
          group: 'info',
          icon: 'clock',
          formatter: (value: number) => new Date(value).toLocaleString('fr-FR')
        },
        {
          key: 'canTrade',
          label: 'Can Trade',
          type: 'boolean',
          group: 'permissions',
          icon: 'trending-up'
        },
        {
          key: 'canWithdraw',
          label: 'Can Withdraw',
          type: 'boolean',
          group: 'permissions',
          icon: 'arrow-up-circle'
        },
        {
          key: 'canDeposit',
          label: 'Can Deposit',
          type: 'boolean',
          group: 'permissions',
          icon: 'arrow-down-circle'
        },
        {
          key: 'makerCommission',
          label: 'Maker Commission',
          type: 'number',
          group: 'commissions',
          icon: 'percent'
        },
        {
          key: 'takerCommission',
          label: 'Taker Commission',
          type: 'number',
          group: 'commissions',
          icon: 'percent'
        },
        {
          key: 'buyerCommission',
          label: 'Buyer Commission',
          type: 'number',
          group: 'commissions',
          icon: 'percent'
        },
        {
          key: 'sellerCommission',
          label: 'Seller Commission',
          type: 'number',
          group: 'commissions',
          icon: 'percent'
        }
      ],
      // TABLE COLUMNS CONFIGURATION (balances)
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
          formatter: (value: number) => this.formatBalance(value)
        },
        {
          key: 'locked',
          label: 'Locked',
          width: '25%',
          align: 'right',
          type: 'custom',
          sortable: false,
          formatter: (value: number) => this.formatBalance(value),
          cssClass: 'locked-balance'
        },
        {
          key: 'total',
          label: 'Total Balance',
          width: '25%',
          align: 'right',
          type: 'custom',
          sortable: true,
          formatter: (value: number) => this.formatBalance(value),
          cssClass: 'total-balance font-weight-bold'
        },
        {
          key: 'usdValue',
          label: 'USD',
          width: '10%',
          align: 'right',
          type: 'currency',
          sortable: true,
          visible: true // Hidden for now
        }
      ],
      // DATA TRANSFORMER - EXTENDED
      dataTransformer: (apiResponse: any): IBashDataTransformResult => {
        if (!apiResponse?.data) {
          return { sidebarData: {}, tableData: [] };
        }

        const accountData = apiResponse.data;

        // SIDEBAR DATA - Account info fields (UPDATED)
        const sidebarData = {
          canTrade: accountData.canTrade || false,
          canWithdraw: accountData.canWithdraw || false,
          canDeposit: accountData.canDeposit || false,
          accountType: accountData.accountType || 'SPOT',
          updateTime: accountData.updateTime || Date.now(),
          makerCommission: accountData.makerCommission || 0,
          takerCommission: accountData.takerCommission || 0,
          buyerCommission: accountData.buyerCommission || 0,
          sellerCommission: accountData.sellerCommission || 0,
          permissions: accountData.permissions || []
        };

        // TABLE DATA - Balances with significant amounts only
        const tableData = (accountData.balances || [])
          .filter((balance: any) =>
            parseFloat(balance.free || '0') > 0 ||
            parseFloat(balance.locked || '0') > 0
          )
          .map((balance: any) => ({
            id: balance.asset,
            asset: balance.asset,
            free: parseFloat(balance.free || '0'),
            locked: parseFloat(balance.locked || '0'),
            total: parseFloat(balance.free || '0') + parseFloat(balance.locked || '0'),
            usdValue: 0 // Would need price conversion
          }));

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

      // TABLE COLUMNS FOR TRADES
      columns: [
        {
          key: 'symbol',
          label: 'Symbol',
          width: '15%',
          align: 'left',
          type: 'text',
          sortable: true
        },
        {
          key: 'side',
          label: 'Side',
          width: '10%',
          align: 'center',
          type: 'badge',
          sortable: true
        },
        {
          key: 'quantity',
          label: 'Quantity',
          width: '20%',
          align: 'right',
          type: 'custom',
          sortable: true,
          formatter: (value: number) => this.formatQuantity(value)
        },
        {
          key: 'price',
          label: 'Price',
          width: '20%',
          align: 'right',
          type: 'custom',
          sortable: true,
          formatter: (value: number) => this.formatPrice(value)
        },
        {
          key: 'quoteQuantity',
          label: 'Total',
          width: '20%',
          align: 'right',
          type: 'custom',
          sortable: true,
          formatter: (value: number) => this.formatPrice(value)
        },
        {
          key: 'commission',
          label: 'Fee',
          width: '15%',
          align: 'right',
          type: 'custom',
          sortable: true,
          formatter: (value: number) => this.formatFee(value)
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
          time: trade.time
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

      columns: [
        {
          key: 'symbol',
          label: 'Symbol',
          width: '15%',
          align: 'left',
          type: 'text',
          sortable: true
        },
        {
          key: 'side',
          label: 'Side',
          width: '10%',
          align: 'center',
          type: 'badge',
          sortable: true
        },
        {
          key: 'type',
          label: 'Type',
          width: '10%',
          align: 'center',
          type: 'text',
          sortable: true
        },
        {
          key: 'quantity',
          label: 'Quantity',
          width: '20%',
          align: 'right',
          type: 'custom',
          sortable: true,
          formatter: (value: number) => this.formatQuantity(value)
        },
        {
          key: 'price',
          label: 'Price',
          width: '20%',
          align: 'right',
          type: 'custom',
          sortable: true,
          formatter: (value: number) => this.formatPrice(value)
        },
        {
          key: 'status',
          label: 'Status',
          width: '15%',
          align: 'center',
          type: 'badge',
          sortable: true
        },
        {
          key: 'executedQty',
          label: 'Filled',
          width: '10%',
          align: 'right',
          type: 'custom',
          sortable: true,
          formatter: (value: number) => this.formatQuantity(value)
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

      columns: [
        {
          key: 'symbol',
          label: 'Symbol',
          width: '40%',
          align: 'left',
          type: 'text',
          sortable: true
        },
        {
          key: 'price',
          label: 'Price',
          width: '30%',
          align: 'right',
          type: 'custom',
          sortable: true,
          formatter: (value: number) => this.formatPrice(value)
        },
        {
          key: 'priceChangePercent',
          label: '24h Change %',
          width: '30%',
          align: 'right',
          type: 'percentage',
          sortable: true,
          cssClass: 'price-change-cell'
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
          priceChange: Math.random() * 10 - 5,
          priceChangePercent: Math.random() * 20 - 10
        }));

        return { sidebarData: {}, tableData };
      }
    };
  }

  // =========================================
  // FORMATTERS - Existing logic maintained
  // =========================================

  private formatBalance(value: number): string {
    if (value === 0 || !value) return '0';
    if (value < 0.00001) return value.toExponential(2);
    if (value < 1) return value.toFixed(8);

    return value.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    });
  }

  private formatPrice(value: number): string {
    if (!value) return '0';

    if (value < 0.01) return value.toFixed(8);
    if (value < 1) return value.toFixed(6);
    if (value < 100) return value.toFixed(4);

    return value.toFixed(2);
  }

  private formatQuantity(value: number): string {
    if (!value) return '0';

    return value.toLocaleString('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 8
    });
  }

  private formatFee(value: number): string {
    if (!value) return '0';
    return value.toFixed(8);
  }

  // =========================================
  // FUTURE CONFIGURATIONS
  // =========================================

  /**
   * Create IBKR configuration (future use)
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
        showControls: true
      },
      table: {
        showEmptyState: true,
        itemsPerPage: 50,
        searchEnabled: true
      },
      endpoints: [
        // Will be implemented later with same structure
      ],
      actions: []
    };
  }

  /**
   * Generic API configuration creator
   */
  createGenericApiConfig(
    id: string,
    title: string,
    baseUrl: string
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
              type: 'text',
              sortable: true
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
