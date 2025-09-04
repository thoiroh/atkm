import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent),
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'home',
        loadComponent: () => import('./shared/components/home-content/home-content.component').then(m => m.HomeContentComponent),
        data: { breadcrumb: 'Home' }
      },
      {
        path: 'binance',
        data: { breadcrumb: 'Binance Wallet' },
        children: [
          {
            path: '',
            redirectTo: 'account',
            pathMatch: 'full'
          },
          {
            path: 'account',
            loadComponent: () => import('./features/binance/components/account-info/account-info.component').then(m => m.AccountInfoComponent),
            data: { breadcrumb: 'Account History' }
          },
          // {
          //   path: 'snapshot',
          //   loadComponent: () => import('./features/binance/components/account-snapshot/account-snapshot.component').then(m => m.AccountSnapshotComponent),
          //   data: { breadcrumb: 'Account Snapshot' }
          // },
          // {
          //   path: 'market-data',
          //   loadComponent: () => import('./features/binance/components/market-data/market-data.component').then(m => m.MarketDataComponent),
          //   data: { breadcrumb: 'Live Market Data' }
          // }
        ]
      },
      // {
      //   path: 'ibkr',
      //   data: { breadcrumb: 'IBKR Platform' },
      //   children: [
      //     {
      //       path: '',
      //       redirectTo: 'account',
      //       pathMatch: 'full'
      //     },
      //     {
      //       path: 'account',
      //       loadComponent: () => import('./features/ibkr/components/account-history/account-history.component').then(m => m.IbkrAccountHistoryComponent),
      //       data: { breadcrumb: 'Account History' }
      //     },
      //     {
      //       path: 'snapshot',
      //       loadComponent: () => import('./features/ibkr/components/account-snapshot/account-snapshot.component').then(m => m.IbkrAccountSnapshotComponent),
      //       data: { breadcrumb: 'Account Snapshot' }
      //     },
      //     {
      //       path: 'market-data',
      //       loadComponent: () => import('./features/ibkr/components/market-data/market-data.component').then(m => m.IbkrMarketDataComponent),
      //       data: { breadcrumb: 'Live Market Data' }
      //     }
      //   ]
      // }
    ]
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  // Route wildcard pour gérer les URLs non trouvées
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
