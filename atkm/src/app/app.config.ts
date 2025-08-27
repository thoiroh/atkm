import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withComponentInputBinding, withRouterConfig } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // Configuration de Zone.js optimisée pour Angular 20
    provideZoneChangeDetection({ eventCoalescing: true }),

    // Router avec binding automatique des @Input
    provideRouter(routes,
      withComponentInputBinding(),
      withRouterConfig({
        onSameUrlNavigation: 'reload',
        paramsInheritanceStrategy: 'always'
      })
    ),

    // HttpClient avec Fetch API (recommandé pour Angular 20)
    provideHttpClient(
      withFetch(),
      // Ajoutez vos intercepteurs ici si nécessaire
      // withInterceptors([authInterceptor, errorInterceptor])
    ),

    // Animations asynchrones pour performance optimale
    provideAnimationsAsync()
  ]
};
