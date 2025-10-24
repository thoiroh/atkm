import { Injectable } from '@angular/core';
import { IBashConfig, IBashDataTransformResult, IBashEndpointConfig } from '@shared/components/atk-api/atk-api-bash/atk-api-bash.interfaces';
import { Formatters } from '@shared/components/atk-api/atk-api.formatters';

@Injectable({
  providedIn: 'root'
})
export class AtkApiBashFactory {

  /**
   * Create Binance debug configuration - EXTENDED
   */
  createBinanceDebugConfig(): IBashConfig {
    return {
      id: 'atkpi-debug-v2',
      title: 'atkpi - enhanced data debug bash',
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
        this.createUserAssetsEndpoint(),
        this.createTradesEndpoint(),
        this.createOrdersEndpoint(),
        this.createTickerEndpoint()
        // this.createNewEndpoint(),
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
      icon: 'users',
      visible: true,
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
          formatter: (value: number) => Formatters.balance(value)
        },
        {
          key: 'locked',
          label: 'Locked Balance',
          type: 'custom',
          group: 'balances',
          icon: 'lock',
          formatter: (value: number) => Formatters.balance(value)
        },
        {
          key: 'total',
          label: 'Total Balance',
          type: 'custom',
          group: 'balances',
          icon: 'trending-up',
          formatter: (value: number) => Formatters.balance(value)
        },
        {
          key: 'usdValue',
          label: 'USD Value (est.)',
          type: 'custom',
          group: 'valuation',
          icon: 'dollar-sign',
          visible: true,
          formatter: (value: number) => Formatters.price(value)
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
          formatter: (value: number) => Formatters.date(value, 'fr-FR')
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
          formatter: (value: number) => Formatters.balance(value)
        },
        {
          key: 'locked',
          label: 'Locked',
          width: '25%',
          align: 'right',
          type: 'custom',
          sortable: false,
          formatter: (value: number) => Formatters.balance(value),
          cssClass: 'locked-balance'
        },
        {
          key: 'total',
          label: 'Total Balance',
          width: '25%',
          align: 'right',
          type: 'custom',
          sortable: true,
          formatter: (value: number) => Formatters.balance(value),
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

  private createUserAssetsEndpoint(): IBashEndpointConfig {
    return {
      id: 'userAssets',
      name: 'User Assets (SAPI)',
      url: 'http://localhost:8000/sapi/v3/asset/getUserAsset',
      icon: 'wallet',
      visible: true,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug': 'true'
      },
      params: {
        // Optional parameters - uncomment to use
        // asset: 'BTC',
        // needBtcValuation: 'true'
      },
      cacheable: true,
      cacheDuration: 60000, // 60 seconds

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
          formatter: (value: string) => Formatters.balance(parseFloat(value))
        },
        {
          key: 'locked',
          label: 'Locked Balance',
          type: 'custom',
          group: 'balances',
          icon: 'lock',
          formatter: (value: string) => Formatters.balance(parseFloat(value))
        },
        {
          key: 'freeze',
          label: 'Frozen Balance',
          type: 'custom',
          group: 'balances',
          icon: 'snowflake',
          formatter: (value: string) => Formatters.balance(parseFloat(value))
        },
        {
          key: 'withdrawing',
          label: 'Withdrawing',
          type: 'custom',
          group: 'balances',
          icon: 'arrow-up',
          formatter: (value: string) => Formatters.balance(parseFloat(value))
        },
        {
          key: 'ipoable',
          label: 'IPO Available',
          type: 'custom',
          group: 'balances',
          icon: 'gift',
          formatter: (value: string) => Formatters.balance(parseFloat(value))
        },
        {
          key: 'btcValuation',
          label: 'BTC Valuation',
          type: 'custom',
          group: 'valuation',
          icon: 'bitcoin',
          visible: true,
          formatter: (value: string) => value ? Formatters.balance(parseFloat(value)) + ' BTC' : 'N/A'
        },
        {
          key: 'totalBalance',
          label: 'Total Balance',
          type: 'custom',
          group: 'calculated',
          icon: 'trending-up',
          formatter: (value: number) => Formatters.balance(value)
        }
      ],

      // SIDEBAR FIELDS CONFIGURATION
      sidebarFields: [
        {
          key: 'totalAssets',
          label: 'Total Assets',
          type: 'number',
          group: 'summary',
          icon: 'layers',
          cssClass: 'total-assets-badge'
        },
        {
          key: 'assetsWithBalance',
          label: 'Assets with Balance',
          type: 'number',
          group: 'summary',
          icon: 'check-circle'
        },
        {
          key: 'totalFree',
          label: 'Total Available',
          type: 'custom',
          group: 'summary',
          icon: 'circle',
          formatter: (value: number) => `${value.toFixed(2)} assets`
        },
        {
          key: 'totalLocked',
          label: 'Total Locked',
          type: 'custom',
          group: 'summary',
          icon: 'lock',
          formatter: (value: number) => `${value.toFixed(2)} assets`
        },
        {
          key: 'totalFrozen',
          label: 'Total Frozen',
          type: 'custom',
          group: 'summary',
          icon: 'snowflake',
          formatter: (value: number) => `${value.toFixed(2)} assets`
        },
        {
          key: 'btcValuationEnabled',
          label: 'BTC Valuation',
          type: 'boolean',
          group: 'options',
          icon: 'bitcoin'
        }
      ],

      // TABLE COLUMNS CONFIGURATION
      columns: [
        {
          key: 'asset',
          label: 'Asset',
          width: '12%',
          align: 'left',
          type: 'text',
          sortable: true,
          cssClass: 'font-weight-bold asset-cell'
        },
        {
          key: 'free',
          label: 'Available',
          width: '18%',
          align: 'right',
          type: 'custom',
          sortable: true,
          formatter: (value: string) => Formatters.balance(parseFloat(value))
        },
        {
          key: 'locked',
          label: 'Locked',
          width: '15%',
          align: 'right',
          type: 'custom',
          sortable: true,
          formatter: (value: string) => Formatters.balance(parseFloat(value)),
          cssClass: 'locked-balance'
        },
        {
          key: 'freeze',
          label: 'Frozen',
          width: '15%',
          align: 'right',
          type: 'custom',
          sortable: true,
          formatter: (value: string) => Formatters.balance(parseFloat(value)),
          cssClass: 'frozen-balance'
        },
        {
          key: 'withdrawing',
          label: 'Withdrawing',
          width: '15%',
          align: 'right',
          type: 'custom',
          sortable: true,
          formatter: (value: string) => Formatters.balance(parseFloat(value))
        },
        {
          key: 'totalBalance',
          label: 'Total',
          width: '15%',
          align: 'right',
          type: 'custom',
          sortable: true,
          formatter: (value: number) => Formatters.balance(value),
          cssClass: 'total-balance font-weight-bold'
        },
        {
          key: 'btcValuation',
          label: 'BTC Value',
          width: '10%',
          align: 'right',
          type: 'custom',
          sortable: true,
          visible: false, // Hidden by default
          formatter: (value: string) => value ? Formatters.balance(parseFloat(value)) : 'N/A'
        }
      ],

      // DATA TRANSFORMER
      dataTransformer: (apiResponse: any): IBashDataTransformResult => {
        if (!apiResponse?.data) {
          return { sidebarData: {}, tableData: [] };
        }

        const responseData = apiResponse.data;

        // Handle both direct array response or wrapped response
        const assetsArray = responseData.assets || responseData;

        if (!Array.isArray(assetsArray)) {
          console.error('getUserAssets: Expected array of assets, got:', assetsArray);
          return { sidebarData: {}, tableData: [] };
        }

        // Filter assets with any balance > 0
        const filteredAssets = assetsArray.filter((asset: any) =>
          parseFloat(asset.free || '0') > 0 ||
          parseFloat(asset.locked || '0') > 0 ||
          parseFloat(asset.freeze || '0') > 0 ||
          parseFloat(asset.withdrawing || '0') > 0
        );

        // Calculate summary statistics
        let totalFree = 0;
        let totalLocked = 0;
        let totalFrozen = 0;
        let btcValuationEnabled = false;

        // TABLE DATA - Transform assets
        const tableData = filteredAssets.map((asset: any) => {
          const free = parseFloat(asset.free || '0');
          const locked = parseFloat(asset.locked || '0');
          const freeze = parseFloat(asset.freeze || '0');
          const withdrawing = parseFloat(asset.withdrawing || '0');
          const totalBalance = free + locked + freeze + withdrawing;

          // Accumulate totals
          totalFree += free;
          totalLocked += locked;
          totalFrozen += freeze;

          // Check if BTC valuation is present
          if (asset.btcValuation) {
            btcValuationEnabled = true;
          }

          return {
            id: asset.asset,
            asset: asset.asset,
            free: asset.free,
            locked: asset.locked,
            freeze: asset.freeze,
            withdrawing: asset.withdrawing,
            ipoable: asset.ipoable || '0',
            btcValuation: asset.btcValuation || null,
            totalBalance: totalBalance
          };
        });

        // SIDEBAR DATA - Summary statistics
        const sidebarData = {
          totalAssets: assetsArray.length,
          assetsWithBalance: filteredAssets.length,
          totalFree: totalFree,
          totalLocked: totalLocked,
          totalFrozen: totalFrozen,
          btcValuationEnabled: btcValuationEnabled
        };

        return { sidebarData, tableData };
      }
    };
  }

  private createTradesEndpoint(): IBashEndpointConfig {
    return {
      id: 'trades',
      name: 'My Trade History',
      url: 'http://localhost:8000/api/v3/myTrades',
      icon: 'insights',
      visible: true,
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
          formatter: (value: number) => Formatters.quantity(value)
        },
        {
          key: 'price',
          label: 'Price',
          width: '20%',
          align: 'right',
          type: 'custom',
          sortable: true,
          formatter: (value: number) => Formatters.price(value)
        },
        {
          key: 'quoteQuantity',
          label: 'Total',
          width: '20%',
          align: 'right',
          type: 'custom',
          sortable: true,
          formatter: (value: number) => Formatters.price(value)
        },
        {
          key: 'commission',
          label: 'Fee',
          width: '15%',
          align: 'right',
          type: 'custom',
          sortable: true,
          formatter: (value: number) => Formatters.fee(value)
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
      icon: 'upload',
      visible: true,
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
          formatter: (value: number) => Formatters.quantity(value)
        },
        {
          key: 'price',
          label: 'Price',
          width: '20%',
          align: 'right',
          type: 'custom',
          sortable: true,
          formatter: (value: number) => Formatters.price(value)
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
          formatter: (value: number) => Formatters.quantity(value)
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
      icon: 'star',
      visible: true,
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
          formatter: (value: number) => Formatters.price(value)
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
