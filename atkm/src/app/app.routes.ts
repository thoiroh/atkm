import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/landing',
    pathMatch: 'full'
  },
  {
    path: 'landing',
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'binance',
    loadChildren: () => import('./features/binance/binance.routes').then(m => m.binanceRoutes)
  },
  // Route wildcard pour gérer les URLs non trouvées
  {
    path: '**',
    redirectTo: '/landing'
  }
];
