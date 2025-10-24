/**
 * ATK API Factory
 * Generic factory for creating API configurations for different domains
 *
 * Features:
 * - Domain-specific config creators (Binance, IBKR, etc.)
 * - Helper methods for creating standard columns and fields
 * - Automatic formatter integration
 * - Reusable column/field templates
 *
 * @file atk-api.factory.ts
 * @version 2.0.0
 * @architecture Injectable service with instance methods
 */

import { Injectable } from '@angular/core';
import { Formatters } from './atk-api.formatters';

import type {
  AtkApiAlign,
  AtkApiColumnType,
  AtkApiFieldType,
  BashData,
  IAtkApiColumn,
  IAtkApiConfig,
  IAtkApiDataTransformResult,
  IAtkApiEndpointConfig,
  IAtkApiSidebarField
} from './atk-api.interfaces';

@Injectable({ providedIn: 'root' })
export class AtkApiFactory {

  // ======================================================
  // PUBLIC API - DOMAIN CONFIGURATIONS
  // ======================================================

  /**
   * Create Binance API configuration
   * Complete configuration with account, assets, trades, orders, and ticker endpoints
   */
  createBinanceConfig(): IAtkApiConfig {
    return {
      id: 'atkpi-binance-v2',
      title: 'atkpi - Binance API Debug',
      subtitle: 'Enhanced Binance API debugging with data visualization',
      domain: 'binance',
      defaultEndpoint: 'account',
      baseUrl: 'http://localhost:8000',
      globalHeaders: {
        'Content-Type': 'application/json',
        'X-Debug': 'true'
      },
      enableCaching: true,
      ui: {
        terminalHeight: '100px',
        showTerminalControls: true,
        tableItemsPerPage: 100,
        enableSearch: true,
        showEmptyState: true
      },
      endpoints: [
        this.createBinanceAccountEndpoint(),
        this.createBinanceUserAssetsEndpoint(),
        this.createBinanceTradesEndpoint(),
        this.createBinanceOrdersEndpoint(),
        this.createBinanceTickerEndpoint()
      ]
    };
  }

  /**
   * Create IBKR API configuration (skeleton for future implementation)
   */
  createIBKRConfig(): IAtkApiConfig {
    return {
      id: 'atkpi-ibkr-v1',
      title: 'atkpi - IBKR API Debug',
      subtitle: 'Interactive Brokers API debugging and portfolio analysis',
      domain: 'ibkr',
      defaultEndpoint: 'account',
      baseUrl: 'http://localhost:8001', // Different port for IBKR
      globalHeaders: {
        'Content-Type': 'application/json'
      },
      enableCaching: true,
      ui: {
        terminalHeight: '100px',
        showTerminalControls: true,
        tableItemsPerPage: 50,
        enableSearch: true,
        showEmptyState: true
      },
      endpoints: [
        // TODO: Implement IBKR endpoints
        // this.createIBKRAccountEndpoint(),
        // this.createIBKRPositionsEndpoint(),
        // this.createIBKROrdersEndpoint(),
        // this.createIBKRMarketDataEndpoint()
      ]
    };
  }

  // ======================================================
  // BINANCE ENDPOINTS
  // ======================================================

  /**
   * Create Binance account endpoint configuration
   */
  private createBinanceAccountEndpoint(): IAtkApiEndpointConfig {
    return {
      id: 'account',
      name: 'Account Information',
      description: 'Retrieve account information including permissions and balances',
      url: '/api/v3/account',
      method: 'GET',
      icon: 'users',
      visible: true,
      cacheable: true,
      cacheDuration: 30000, // 30 seconds

      // Sidebar fields for account-level information
      sidebarFields: [
        this.createTextField('accountType', 'Account Type', 'status', 'user'),
        this.createDateField('updateTime', 'Last Update', 'clock'),
        this.createBooleanField('canTrade', 'Can Trade', 'trending-up'),
        this.createBooleanField('canWithdraw', 'Can Withdraw', 'arrow-up-circle'),
        this.createBooleanField('canDeposit', 'Can Deposit', 'arrow-down-circle'),
        this.createNumberField('makerCommission', 'Maker Commission', 'percent'),
        this.createNumberField('takerCommission', 'Taker Commission', 'percent'),
        this.createNumberField('buyerCommission', 'Buyer Commission', 'percent'),
        this.createNumberField('sellerCommission', 'Seller Commission', 'percent')
      ],

      // Row detail fields for selected balance
      rowDetailFields: [
        this.createTextField('asset', 'Asset Symbol', 'text', 'coins'),
        this.createCryptoBalanceField('free', 'Available Balance', 'circle'),
        this.createCryptoBalanceField('locked', 'Locked Balance', 'lock'),
        this.createCryptoBalanceField('total', 'Total Balance', 'trending-up'),
        this.createPriceField('usdValue', 'USD Value (est.)', 'dollar-sign')
      ],

      // Table columns for balances list
      columns: [
        this.createTextColumn('asset', 'Asset', '15%', 'left', true),
        this.createCryptoBalanceColumn('free', 'Available', '25%', 'right', true),
        this.createCryptoBalanceColumn('locked', 'Locked', '25%', 'right', false),
        this.createCryptoBalanceColumn('total', 'Total Balance', '25%', 'right', true),
        this.createCurrencyColumn('usdValue', 'USD', '10%', 'right', true)
      ],

      // Data transformer
      dataTransformer: (apiResponse: any): IAtkApiDataTransformResult => {
        if (!apiResponse?.data) {
          return { sidebarData: {}, tableData: [] };
        }

        const accountData = apiResponse.data;

        // Sidebar data - account info
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

        // Table data - balances with significant amounts only
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

  /**
   * Create Binance user assets endpoint configuration
   */
  private createBinanceUserAssetsEndpoint(): IAtkApiEndpointConfig {
    return {
      id: 'userAssets',
      name: 'User Assets',
      description: 'Get detailed user asset information',
      url: '/sapi/v3/asset/getUserAsset',
      method: 'POST',
      icon: 'home',
      visible: true,
      cacheable: true,
      cacheDuration: 60000, // 1 minute

      sidebarFields: [],

      rowDetailFields: [
        this.createTextField('asset', 'Asset', 'text', 'coins'),
        this.createCryptoBalanceField('free', 'Free Balance', 'circle'),
        this.createCryptoBalanceField('locked', 'Locked Balance', 'lock'),
        this.createCryptoBalanceField('freeze', 'Frozen Amount', 'alert-circle'),
        this.createCryptoBalanceField('withdrawing', 'Withdrawing', 'arrow-up'),
        this.createCryptoBalanceField('ipoable', 'IPOable', 'trending-up'),
        this.createPriceField('btcValuation', 'BTC Valuation', 'bitcoin')
      ],

      columns: [
        this.createTextColumn('asset', 'Asset', '15%', 'left', true),
        this.createCryptoBalanceColumn('free', 'Free', '20%', 'right', true),
        this.createCryptoBalanceColumn('locked', 'Locked', '15%', 'right', true),
        this.createCryptoBalanceColumn('freeze', 'Frozen', '15%', 'right', false),
        this.createCryptoBalanceColumn('withdrawing', 'Withdrawing', '15%', 'right', false),
        this.createPriceColumn('btcValuation', 'BTC Value', '20%', 'right', true)
      ],

      dataTransformer: (apiResponse: any): IAtkApiDataTransformResult => {
        if (!Array.isArray(apiResponse?.data)) {
          return { sidebarData: {}, tableData: [] };
        }

        const tableData = apiResponse.data
          .filter((asset: any) => parseFloat(asset.free || '0') > 0)
          .map((asset: any) => ({
            id: asset.asset,
            asset: asset.asset,
            free: parseFloat(asset.free || '0'),
            locked: parseFloat(asset.locked || '0'),
            freeze: parseFloat(asset.freeze || '0'),
            withdrawing: parseFloat(asset.withdrawing || '0'),
            ipoable: parseFloat(asset.ipoable || '0'),
            btcValuation: parseFloat(asset.btcValuation || '0')
          }));

        return { sidebarData: {}, tableData };
      }
    };
  }

  /**
   * Create Binance trades endpoint configuration
   */
  private createBinanceTradesEndpoint(): IAtkApiEndpointConfig {
    return {
      id: 'trades',
      name: 'Trade History',
      description: 'Get account trade history for a symbol',
      url: '/api/v3/myTrades',
      method: 'GET',
      icon: 'activity',
      visible: true,
      params: {
        symbol: 'BTCUSDT',
        limit: 100
      },
      cacheable: true,
      cacheDuration: 60000,

      sidebarFields: [],

      rowDetailFields: [
        this.createTextField('symbol', 'Symbol', 'text', 'trending-up'),
        this.createTextField('side', 'Side', 'badge', 'arrow-right'),
        this.createQuantityField('quantity', 'Quantity', 'hash'),
        this.createPriceField('price', 'Price', 'dollar-sign'),
        this.createCurrencyField('quoteQuantity', 'Quote Quantity', 'credit-card'),
        this.createFeeField('commission', 'Commission', 'percent'),
        this.createDateField('time', 'Time', 'clock')
      ],

      columns: [
        this.createTextColumn('symbol', 'Symbol', '15%', 'left', true),
        this.createBadgeColumn('side', 'Side', '10%', 'center', true),
        this.createQuantityColumn('quantity', 'Quantity', '20%', 'right', true),
        this.createPriceColumn('price', 'Price', '20%', 'right', true),
        this.createCurrencyColumn('quoteQuantity', 'Quote Qty', '20%', 'right', true),
        this.createFeeColumn('commission', 'Fee', '15%', 'right', true)
      ],

      dataTransformer: (apiResponse: any): IAtkApiDataTransformResult => {
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

  /**
   * Create Binance orders endpoint configuration
   */
  private createBinanceOrdersEndpoint(): IAtkApiEndpointConfig {
    return {
      id: 'orders',
      name: 'Order History',
      description: 'Get all orders for a symbol',
      url: '/api/v3/allOrders',
      method: 'GET',
      icon: 'upload',
      visible: true,
      params: {
        symbol: 'BTCUSDT',
        limit: 100
      },
      cacheable: true,
      cacheDuration: 60000,

      sidebarFields: [],

      columns: [
        this.createTextColumn('symbol', 'Symbol', '15%', 'left', true),
        this.createBadgeColumn('side', 'Side', '10%', 'center', true),
        this.createTextColumn('type', 'Type', '10%', 'center', true),
        this.createQuantityColumn('quantity', 'Quantity', '20%', 'right', true),
        this.createPriceColumn('price', 'Price', '20%', 'right', true),
        this.createStatusBadgeColumn('status', 'Status', '15%', 'center', true),
        this.createQuantityColumn('executedQty', 'Filled', '10%', 'right', true)
      ],

      dataTransformer: (apiResponse: any): IAtkApiDataTransformResult => {
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

  /**
   * Create Binance ticker endpoint configuration
   */
  private createBinanceTickerEndpoint(): IAtkApiEndpointConfig {
    return {
      id: 'ticker',
      name: 'Price Ticker',
      description: 'Get current price for a symbol',
      url: '/api/v3/ticker/price',
      method: 'GET',
      icon: 'star',
      visible: true,
      params: {
        symbol: 'BTCUSDT'
      },
      cacheable: true,
      cacheDuration: 10000, // 10 seconds

      sidebarFields: [],

      columns: [
        this.createTextColumn('symbol', 'Symbol', '40%', 'left', true),
        this.createPriceColumn('price', 'Price', '30%', 'right', true),
        this.createPercentageColumn('priceChangePercent', '24h Change %', '30%', 'right', true)
      ],

      dataTransformer: (apiResponse: any): IAtkApiDataTransformResult => {
        const data = apiResponse?.data;
        const tickers = Array.isArray(data) ? data : [data];

        const tableData = tickers.map((ticker: any, index: number) => ({
          id: ticker.symbol || index,
          symbol: ticker.symbol,
          price: parseFloat(ticker.price || '0'),
          priceChange: Math.random() * 10 - 5,
          priceChangePercent: Math.random() * 20 - 10
        }));

        return { sidebarData: {}, tableData };
      }
    };
  }

  // ======================================================
  // HELPER METHODS - COLUMNS
  // ======================================================

  /**
   * Create a text column with standard configuration
   */
  createTextColumn(
    key: string,
    label: string,
    width: string = 'auto',
    align: AtkApiAlign = 'left',
    sortable: boolean = true,
    cssClass?: string
  ): IAtkApiColumn {
    return {
      key,
      label,
      width,
      align,
      type: 'text',
      sortable,
      cssClass,
      visible: true
    };
  }

  /**
   * Create a crypto balance column with automatic formatter
   */
  createCryptoBalanceColumn(
    key: string,
    label: string,
    width: string = 'auto',
    align: AtkApiAlign = 'right',
    sortable: boolean = true
  ): IAtkApiColumn {
    return {
      key,
      label,
      width,
      align,
      type: 'crypto',
      sortable,
      formatter: (value: any) => Formatters.balance(value),
      visible: true
    };
  }

  /**
   * Create a price column with automatic formatter
   */
  createPriceColumn(
    key: string,
    label: string,
    width: string = 'auto',
    align: AtkApiAlign = 'right',
    sortable: boolean = true
  ): IAtkApiColumn {
    return {
      key,
      label,
      width,
      align,
      type: 'price',
      sortable,
      formatter: (value: any) => Formatters.price(value),
      visible: true
    };
  }

  /**
   * Create a quantity column with automatic formatter
   */
  createQuantityColumn(
    key: string,
    label: string,
    width: string = 'auto',
    align: AtkApiAlign = 'right',
    sortable: boolean = true
  ): IAtkApiColumn {
    return {
      key,
      label,
      width,
      align,
      type: 'quantity',
      sortable,
      formatter: (value: any) => Formatters.quantity(value),
      visible: true
    };
  }

  /**
   * Create a currency column with automatic formatter
   */
  createCurrencyColumn(
    key: string,
    label: string,
    width: string = 'auto',
    align: AtkApiAlign = 'right',
    sortable: boolean = true,
    currency: string = 'USD'
  ): IAtkApiColumn {
    return {
      key,
      label,
      width,
      align,
      type: 'currency',
      sortable,
      formatter: (value: any) => Formatters.currency(value, currency),
      visible: true
    };
  }

  /**
   * Create a percentage column with automatic formatter
   */
  createPercentageColumn(
    key: string,
    label: string,
    width: string = 'auto',
    align: AtkApiAlign = 'right',
    sortable: boolean = true
  ): IAtkApiColumn {
    return {
      key,
      label,
      width,
      align,
      type: 'percentage',
      sortable,
      formatter: (value: any) => Formatters.percentage(value),
      visible: true
    };
  }

  /**
   * Create a fee column with automatic formatter
   */
  createFeeColumn(
    key: string,
    label: string,
    width: string = 'auto',
    align: AtkApiAlign = 'right',
    sortable: boolean = true
  ): IAtkApiColumn {
    return {
      key,
      label,
      width,
      align,
      type: 'fee',
      sortable,
      formatter: (value: any) => Formatters.fee(value),
      visible: true
    };
  }

  /**
   * Create a badge column (for status, side, etc.)
   */
  createBadgeColumn(
    key: string,
    label: string,
    width: string = 'auto',
    align: AtkApiAlign = 'center',
    sortable: boolean = true
  ): IAtkApiColumn {
    return {
      key,
      label,
      width,
      align,
      type: 'badge',
      sortable,
      visible: true
    };
  }

  /**
   * Create a status badge column with automatic formatter
   */
  createStatusBadgeColumn(
    key: string,
    label: string,
    width: string = 'auto',
    align: AtkApiAlign = 'center',
    sortable: boolean = true
  ): IAtkApiColumn {
    return {
      key,
      label,
      width,
      align,
      type: 'status',
      sortable,
      formatter: (value: any) => Formatters.status(value),
      visible: true
    };
  }

  // ======================================================
  // HELPER METHODS - FIELDS
  // ======================================================

  /**
   * Create a text field for sidebar display
   */
  createTextField(
    key: string,
    label: string,
    type: AtkApiFieldType = 'text',
    icon?: string,
    group?: string
  ): IAtkApiSidebarField {
    return {
      key,
      label,
      type,
      icon,
      group,
      visible: true
    };
  }

  /**
   * Create a number field for sidebar display
   */
  createNumberField(
    key: string,
    label: string,
    icon?: string,
    group?: string
  ): IAtkApiSidebarField {
    return {
      key,
      label,
      type: 'number',
      icon,
      group,
      visible: true
    };
  }

  /**
   * Create a boolean field for sidebar display
   */
  createBooleanField(
    key: string,
    label: string,
    icon?: string,
    group?: string
  ): IAtkApiSidebarField {
    return {
      key,
      label,
      type: 'boolean',
      icon,
      group,
      formatter: (value: any) => Formatters.boolean(value, 'yes-no'),
      visible: true
    };
  }

  /**
   * Create a date field for sidebar display with automatic formatter
   */
  createDateField(
    key: string,
    label: string,
    icon?: string,
    group?: string
  ): IAtkApiSidebarField {
    return {
      key,
      label,
      type: 'date',
      icon,
      group,
      formatter: (value: any) => Formatters.date(value, 'fr-FR'),
      visible: true
    };
  }

  /**
   * Create a crypto balance field with automatic formatter
   */
  createCryptoBalanceField(
    key: string,
    label: string,
    icon?: string,
    group?: string
  ): IAtkApiSidebarField {
    return {
      key,
      label,
      type: 'crypto',
      icon,
      group,
      formatter: (value: any) => Formatters.balance(value),
      visible: true
    };
  }

  /**
   * Create a price field with automatic formatter
   */
  createPriceField(
    key: string,
    label: string,
    icon?: string,
    group?: string
  ): IAtkApiSidebarField {
    return {
      key,
      label,
      type: 'price',
      icon,
      group,
      formatter: (value: any) => Formatters.price(value),
      visible: true
    };
  }

  /**
   * Create a quantity field with automatic formatter
   */
  createQuantityField(
    key: string,
    label: string,
    icon?: string,
    group?: string
  ): IAtkApiSidebarField {
    return {
      key,
      label,
      type: 'custom',
      icon,
      group,
      formatter: (value: any) => Formatters.quantity(value),
      visible: true
    };
  }

  /**
   * Create a currency field with automatic formatter
   */
  createCurrencyField(
    key: string,
    label: string,
    icon?: string,
    group?: string,
    currency: string = 'USD'
  ): IAtkApiSidebarField {
    return {
      key,
      label,
      type: 'currency',
      icon,
      group,
      formatter: (value: any) => Formatters.currency(value, currency),
      visible: true
    };
  }

  /**
   * Create a fee field with automatic formatter
   */
  createFeeField(
    key: string,
    label: string,
    icon?: string,
    group?: string
  ): IAtkApiSidebarField {
    return {
      key,
      label,
      type: 'custom',
      icon,
      group,
      formatter: (value: any) => Formatters.fee(value),
      visible: true
    };
  }
}
