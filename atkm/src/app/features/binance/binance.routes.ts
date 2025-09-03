import { Routes } from '@angular/router';

export const binanceRoutes: Routes = [
  {
    path: '',
    redirectTo: 'account',
    pathMatch: 'full'
  },
  {
    path: 'account',
    loadComponent: () => import('./components/account-info/account-info.component').then(m => m.AccountInfoComponent)
  }
];