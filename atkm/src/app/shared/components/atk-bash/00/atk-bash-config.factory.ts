// atk-bash-config.factory.ts
// Factory for creating bash configurations with TypeScript objects

import { Injectable } from '@angular/core';
import { IBashConfig, IBashEndpointConfig } from './atk-bash.interfaces';

@Injectable({
  providedIn: 'root'
})
export class AtkBashConfigFactory {

  /**
   * Create Binance debug configuration
   */
  createBinanceAccountConfig(): IBashConfig {
    return {
      id: 'binance-debug-v1',
      title: 'Binance API Account Debug Terminal',
      subtitle: 'Enhanced debugging for Account EndPoints',
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
      actions: [
        // {
        //   id: 'refresh-all',
        //   label: 'Refresh All',
        //   icon: 'refresh-cw',
        //   variant: 'secondary',
        //   handler: async () => console.log('Refreshing all data...')
        // },
        // {
        //   id: 'export-csv',
        //   label: 'Export CSV',
        //   icon: 'download',
        //   variant: 'secondary',
        //   handler: async () => console.log('Exporting to CSV...')
        // },
        // {
        //   id: 'clear-cache',
        //   label: 'Clear Cache',
        //   icon: 'trash-2',
        //   variant: 'warning',
        //   handler: async () => console.log('Clearing cache...')
        // }
      ]
    };
  }

  /**
   * Create Binance debug configuration
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
      actions: [
        // {
        //   id: 'refresh-all',
        //   label: 'Refresh All',
        //   icon: 'refresh-cw',
        //   variant: 'secondary',
        //   handler: async () => console.log('Refreshing all data...')
        // },
        // {
        //   id: 'export-csv',
        //   label: 'Export CSV',
        //   icon: 'download',
        //   variant: 'secondary',
        //   handler: async () => console.log('Exporting to CSV...')
        // },
        // {
        //   id: 'clear-cache',
        //   label: 'Clear Cache',
        //   icon: 'trash-2',
        //   variant: 'warning',
        //   handler: async () => console.log('Clearing cache...')
        // }
      ]
    };
  }

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
        // Will be implemented later
      ],
      actions: []
    };
  }

  // Private endpoint creators for Binance
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
      dataTransformer: (apiResponse: any) => {
        if (!apiResponse?.data?.balances) return [];

        return apiResponse.data.balances
          .filter((balance: any) =>
            parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0
          )
          .map((balance: any) => ({
            id: balance.asset,
            asset: balance.asset,
            free: parseFloat(balance.free),
            locked: parseFloat(balance.locked),
            total: parseFloat(balance.free) + parseFloat(balance.locked),
            usdValue: 0 // Would need price conversion
          }));
      },
      columns: [
        {
          key: 'asset',
          label: 'Asset',
          width: '20%',
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
          sortable: true,
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
          label: 'USD Value',
          width: '5%',
          align: 'right',
          type: 'currency',
          sortable: true,
          visible: false // Hidden for now
        }
      ]
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
      dataTransformer: (apiResponse: any) => {
        if (!Array.isArray(apiResponse?.data?.trades)) return [];

        return apiResponse.data.trades.map((trade: any) => ({
          id: trade.id || `${trade.symbol}-${trade.time}`,
          symbol: trade.symbol,
          side: trade.isBuyer ? 'BUY' : 'SELL',
          price: parseFloat(trade.price),
          qty: parseFloat(trade.qty),
          quoteQty: parseFloat(trade.quoteQty),
          commission: parseFloat(trade.commission),
          commissionAsset: trade.commissionAsset,
          time: trade.time,
          isBuyer: trade.isBuyer,
          isMaker: trade.isMaker
        }));
      },
      columns: [
        {
          key: 'symbol',
          label: 'Symbol',
          width: '12%',
          align: 'left',
          type: 'badge',
          sortable: true,
          formatter: (value: string) => value?.toUpperCase()
        },
        {
          key: 'side',
          label: 'Side',
          width: '8%',
          align: 'center',
          type: 'badge',
          formatter: (value: string) => value?.toUpperCase(),
          cssClass: 'trade-side'
        },
        {
          key: 'price',
          label: 'Price',
          width: '16%',
          align: 'right',
          type: 'custom',
          sortable: true,
          formatter: (value: number) => this.formatPrice(value)
        },
        {
          key: 'qty',
          label: 'Quantity',
          width: '16%',
          align: 'right',
          type: 'custom',
          sortable: true,
          formatter: (value: number) => this.formatQuantity(value)
        },
        {
          key: 'quoteQty',
          label: 'Quote Qty',
          width: '16%',
          align: 'right',
          type: 'custom',
          sortable: true,
          formatter: (value: number) => this.formatPrice(value)
        },
        {
          key: 'commission',
          label: 'Fee',
          width: '10%',
          align: 'right',
          type: 'custom',
          formatter: (value: number) => this.formatFee(value)
        },
        {
          key: 'time',
          label: 'Date',
          width: '16%',
          align: 'center',
          type: 'date',
          sortable: true
        },
        {
          key: 'isMaker',
          label: 'Maker',
          width: '6%',
          align: 'center',
          type: 'boolean',
          visible: false
        }
      ]
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
      cacheDuration: 45000,
      dataTransformer: (apiResponse: any) => {
        if (!Array.isArray(apiResponse?.data?.orders)) return [];

        return apiResponse.data.orders.map((order: any) => ({
          id: order.orderId,
          symbol: order.symbol,
          side: order.side,
          type: order.type,
          origQty: parseFloat(order.origQty),
          executedQty: parseFloat(order.executedQty),
          cummulativeQuoteQty: parseFloat(order.cummulativeQuoteQty),
          price: parseFloat(order.price),
          status: order.status,
          timeInForce: order.timeInForce,
          time: order.time,
          updateTime: order.updateTime
        }));
      },
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
          type: 'badge',
          cssClass: 'order-side'
        },
        {
          key: 'type',
          label: 'Type',
          width: '10%',
          align: 'center',
          type: 'text'
        },
        {
          key: 'origQty',
          label: 'Quantity',
          width: '14%',
          align: 'right',
          type: 'custom',
          formatter: (value: number) => this.formatQuantity(value)
        },
        {
          key: 'executedQty',
          label: 'Executed',
          width: '14%',
          align: 'right',
          type: 'custom',
          formatter: (value: number) => this.formatQuantity(value)
        },
        {
          key: 'price',
          label: 'Price',
          width: '14%',
          align: 'right',
          type: 'custom',
          formatter: (value: number) => this.formatPrice(value)
        },
        {
          key: 'status',
          label: 'Status',
          width: '10%',
          align: 'center',
          type: 'badge',
          cssClass: 'order-status'
        },
        {
          key: 'time',
          label: 'Created',
          width: '18%',
          align: 'center',
          type: 'date',
          sortable: true
        }
      ]
    };
  }

  private createTickerEndpoint(): IBashEndpointConfig {
    return {
      id: 'ticker',
      name: 'Ticker Prices',
      url: 'http://localhost:8000/api/v3/ticker/price',
      method: 'GET',
      cacheable: true,
      cacheDuration: 10000,
      dataTransformer: (apiResponse: any) => {
        const data = apiResponse?.data;
        if (!data) return [];

        // Handle both single ticker and array of tickers
        const tickers = Array.isArray(data) ? data : [data];

        return tickers.map((ticker: any, index: number) => ({
          id: ticker.symbol || index,
          symbol: ticker.symbol,
          price: parseFloat(ticker.price),
          // Add fake change data (would come from 24hr ticker in real implementation)
          priceChange: Math.random() * 10 - 5,
          priceChangePercent: Math.random() * 20 - 10
        }));
      },
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
      ]
    };
  }

  // Formatters - Using your existing logic
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
}
