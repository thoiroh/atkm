// app.routes.ts - Extended routes for transaction history

import { Routes } from '@angular/router';

export const routes: Routes = [
  // Default redirect to landing
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },

  // Main dashboard layout
  {
    path: 'dashboard',
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent),
    children: [
      // Default dashboard home
      {
        path: '',
        loadComponent: () => import('./shared/components/home-content/home-content.component').then(m => m.HomeContentComponent)
      },

      {
        path: 'debug',
        loadComponent: () => import('./features/binance/components/binance-debug.component').then(m => m.BinanceDebugComponent),
        title: 'Binance Account | Debug'
      },

      {
        path: 'bash',
        loadComponent: () => import('./shared/components/atk-bash/atk-bash.component').then(m => m.AtkBashComponent),
        title: 'atk bash | api tool'
      },

      // ===============================================================================================
      // BINANCE ROUTES
      // ===============================================================================================

      // Binance account info (existing)
      {
        path: 'binance/account',
        loadComponent: () => import('./features/binance/components/account-info/binance-account-info.component').then(m => m.AccountInfoComponent),
        title: 'Binance Account | ATK Dashboard'
      },

      // Binance transaction history - main route
      {
        path: 'binance/history',
        loadComponent: () => import('./features/binance/components/transaction-history/binance-transaction-history.component').then(m => m.BinanceTransactionHistoryComponent),
        title: 'Transaction History | ATK Dashboard'
      },

      // Binance transaction history with symbol parameter
      {
        path: 'binance/history/:symbol',
        loadComponent: () => import('./features/binance/components/transaction-history/binance-transaction-history.component').then(m => m.BinanceTransactionHistoryComponent),
        title: 'Transaction History | ATK Dashboard'
      },

      // Binance transaction history with symbol and tab
      {
        path: 'binance/history/:symbol/:tab',
        loadComponent: () => import('./features/binance/components/transaction-history/binance-transaction-history.component').then(m => m.BinanceTransactionHistoryComponent),
        title: 'Transaction History | ATK Dashboard'
      },

      // Binance market data (placeholder)
      {
        path: 'binance/market-data',
        loadComponent: () => import('./shared/components/home-content/home-content.component').then(m => m.HomeContentComponent), // Replace with actual component
        title: 'Market Data | ATK Dashboard'
      },

      // Binance snapshot (placeholder)
      {
        path: 'binance/snapshot',
        loadComponent: () => import('./shared/components/home-content/home-content.component').then(m => m.HomeContentComponent), // Replace with actual component
        title: 'Account Snapshot | ATK Dashboard'
      },

      // ===============================================================================================
      // IBKR ROUTES (Placeholders)
      // ===============================================================================================

      {
        path: 'ibkr/account',
        loadComponent: () => import('./shared/components/home-content/home-content.component').then(m => m.HomeContentComponent), // Replace with actual component
        title: 'IBKR Account | ATK Dashboard'
      },

      {
        path: 'ibkr/snapshot',
        loadComponent: () => import('./shared/components/home-content/home-content.component').then(m => m.HomeContentComponent), // Replace with actual component
        title: 'IBKR Snapshot | ATK Dashboard'
      },

      {
        path: 'ibkr/market-data',
        loadComponent: () => import('./shared/components/home-content/home-content.component').then(m => m.HomeContentComponent), // Replace with actual component
        title: 'IBKR Market Data | ATK Dashboard'
      },

      // ===============================================================================================
      // CONFIGURATION ROUTES
      // ===============================================================================================

      {
        path: 'config/display',
        loadComponent: () => import('./shared/components/home-content/home-content.component').then(m => m.HomeContentComponent), // Replace with actual component
        title: 'Display Settings | ATK Dashboard'
      },

      {
        path: 'config/preferences',
        loadComponent: () => import('./shared/components/home-content/home-content.component').then(m => m.HomeContentComponent), // Replace with actual component
        title: 'User Preferences | ATK Dashboard'
      },

      {
        path: 'config/shortcuts',
        loadComponent: () => import('./shared/components/home-content/home-content.component').then(m => m.HomeContentComponent), // Replace with actual component
        title: 'Keyboard Shortcuts | ATK Dashboard'
      },

      {
        path: 'config/layout',
        loadComponent: () => import('./shared/components/home-content/home-content.component').then(m => m.HomeContentComponent), // Replace with actual component
        title: 'Component Layout | ATK Dashboard'
      },

      // ===============================================================================================
      // TOOLS ROUTES
      // ===============================================================================================

      {
        path: 'tools/export',
        loadComponent: () => import('./shared/components/home-content/home-content.component').then(m => m.HomeContentComponent), // Replace with actual component
        title: 'Export Data | ATK Dashboard'
      },

      {
        path: 'tools/import',
        loadComponent: () => import('./shared/components/home-content/home-content.component').then(m => m.HomeContentComponent), // Replace with actual component
        title: 'Import Files | ATK Dashboard'
      },

      {
        path: 'tools/quick-actions',
        loadComponent: () => import('./shared/components/home-content/home-content.component').then(m => m.HomeContentComponent), // Replace with actual component
        title: 'Quick Actions | ATK Dashboard'
      }
    ]
  },

  // ===============================================================================================
  // STANDALONE PAGES (Outside dashboard layout)
  // ===============================================================================================

  // Login page (if needed)
  {
    path: 'login',
    loadComponent: () => import('./shared/components/home-content/home-content.component').then(m => m.HomeContentComponent), // Replace with actual component
    title: 'Login | ATK'
  },

  // Settings page (if needed outside dashboard)
  {
    path: 'settings',
    loadComponent: () => import('./shared/components/home-content/home-content.component').then(m => m.HomeContentComponent), // Replace with actual component
    title: 'Settings | ATK'
  },

  // Catch-all route - redirect to dashboard
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];

/**
 * Route Configuration Notes:
 *
 * BINANCE TRANSACTION HISTORY ROUTES:
 * - /dashboard/binance/history - Main transaction history page
 * - /dashboard/binance/history/BTCUSDT - History for specific symbol
 * - /dashboard/binance/history/BTCUSDT/trades - History with specific tab
 *
 * URL EXAMPLES:
 * - /dashboard/binance/history
 * - /dashboard/binance/history/BTCUSDT
 * - /dashboard/binance/history/ETHUSDT
 * - /dashboard/binance/history/ADAUSDT/orders
 * - /dashboard/binance/history/BNBUSDT/transfers
 *
 * NAVIGATION FROM SIDEBAR:
 * The sidebar configuration in landing-data.json should be updated with:
 * - "Transaction History" -> "/dashboard/binance/history"
 * - Individual coins can link to specific symbols
 *
 * BREADCRUMBS:
 * The breadcrumb service can show:
 * Dashboard > Binance > Transaction History > BTCUSDT
 */
