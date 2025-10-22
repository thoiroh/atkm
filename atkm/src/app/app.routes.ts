import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/landing',
    pathMatch: 'full'
  },
  {
    path: 'landing',
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/shuttle/shuttle.component').then(m => m.AtkShuttleComponent),
        title: 'atk-shuttle | entry point to your data'
      },
      {
        path: 'shuttle',
        loadComponent: () => import('./features/shuttle/shuttle.component').then(m => m.AtkShuttleComponent),
        title: 'atk-shuttle | entry point to your data'
      },
      {
        path: 'atkpi',
        loadComponent: () => import('./shared/components/atk-api/atk-api.component').then(m => m.AtkApiComponent),
        title: 'atk-api | Debug'
      },

      // ===============================================================================================
      // BINANCE ROUTES
      // ===============================================================================================

      // Binance account info (existing)
      {
        path: 'binance/account',
        loadComponent: () => import('./features/binance/components/account-info/binance-account-info.component').then(m => m.AccountInfoComponent),
        title: 'Binance Account'
      },

      // Binance transaction history - main route
      {
        path: 'binance/history',
        loadComponent: () => import('./features/binance/components/transaction-history/binance-transaction-history.component').then(m => m.BinanceTransactionHistoryComponent),
        title: 'Transaction History'
      },

      // Binance transaction history with symbol parameter
      {
        path: 'binance/history/:symbol',
        loadComponent: () => import('./features/binance/components/transaction-history/binance-transaction-history.component').then(m => m.BinanceTransactionHistoryComponent),
        title: 'Transaction History'
      },

      // Binance transaction history with symbol and tab
      {
        path: 'binance/history/:symbol/:tab',
        loadComponent: () => import('./features/binance/components/transaction-history/binance-transaction-history.component').then(m => m.BinanceTransactionHistoryComponent),
        title: 'Transaction History'
      },

      // Binance market data (placeholder)
      {
        path: 'binance/market-data',
        loadComponent: () => import('./features/shuttle/shuttle.component').then(m => m.AtkShuttleComponent), // Replace with actual component
        title: 'Market Data'
      },

      // Binance snapshot (placeholder)
      {
        path: 'binance/snapshot',
        loadComponent: () => import('./features/shuttle/shuttle.component').then(m => m.AtkShuttleComponent), // Replace with actual component
        title: 'Account Snapshot'
      },

      // ===============================================================================================
      // IBKR ROUTES (Placeholders)
      // ===============================================================================================

      {
        path: 'ibkr/account',
        loadComponent: () => import('./features/shuttle/shuttle.component').then(m => m.AtkShuttleComponent), // Replace with actual component
        title: 'IBKR Account'
      },

      {
        path: 'ibkr/snapshot',
        loadComponent: () => import('./features/shuttle/shuttle.component').then(m => m.AtkShuttleComponent), // Replace with actual component
        title: 'IBKR Snapshot'
      },

      {
        path: 'ibkr/market-data',
        loadComponent: () => import('./features/shuttle/shuttle.component').then(m => m.AtkShuttleComponent), // Replace with actual component
        title: 'IBKR Market Data'
      },

      // ===============================================================================================
      // CONFIGURATION ROUTES
      // ===============================================================================================

      {
        path: 'config/display',
        loadComponent: () => import('./features/shuttle/shuttle.component').then(m => m.AtkShuttleComponent), // Replace with actual component
        title: 'Display Settings'
      },

      {
        path: 'config/preferences',
        loadComponent: () => import('./features/shuttle/shuttle.component').then(m => m.AtkShuttleComponent), // Replace with actual component
        title: 'User Preferences'
      },

      {
        path: 'config/shortcuts',
        loadComponent: () => import('./features/shuttle/shuttle.component').then(m => m.AtkShuttleComponent), // Replace with actual component
        title: 'Keyboard Shortcuts'
      },

      {
        path: 'config/layout',
        loadComponent: () => import('./features/shuttle/shuttle.component').then(m => m.AtkShuttleComponent), // Replace with actual component
        title: 'Component Layout'
      },

      // ===============================================================================================
      // TOOLS ROUTES
      // ===============================================================================================

      {
        path: 'tools/export',
        loadComponent: () => import('./features/shuttle/shuttle.component').then(m => m.AtkShuttleComponent), // Replace with actual component
        title: 'Export Data'
      },

      {
        path: 'tools/import',
        loadComponent: () => import('./features/shuttle/shuttle.component').then(m => m.AtkShuttleComponent), // Replace with actual component
        title: 'Import Files'
      },

      {
        path: 'tools/quick-actions',
        loadComponent: () => import('./features/shuttle/shuttle.component').then(m => m.AtkShuttleComponent), // Replace with actual component
        title: 'Quick Actions'
      }
    ]
  },

  // ===============================================================================================
  // STANDALONE PAGES (Outside landing layout)
  // ===============================================================================================

  // Login page (if needed)
  {
    path: 'login',
    loadComponent: () => import('./features/shuttle/shuttle.component').then(m => m.AtkShuttleComponent), // Replace with actual component
    title: 'Login | ATK'
  },

  // Settings page (if needed outside landing)
  {
    path: 'settings',
    loadComponent: () => import('./features/shuttle/shuttle.component').then(m => m.AtkShuttleComponent), // Replace with actual component
    title: 'Settings | ATK'
  },

  // Catch-all route - redirect to landing
  {
    path: '**',
    redirectTo: '/landing'
  }
];


