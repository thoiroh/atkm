import { inject } from '@angular/core';
import { IconRegistryService } from '@core/services/icon-registry.service';

/**
 * Utilitaire pour activer/désactiver le debug des icônes
 * Usage dans un composant :
 *
 * constructor() {
 *   if (environment.production === false) {
 *     enableIconDebug();
 *   }
 * }
 */

let iconService: IconRegistryService | null = null;

export function enableIconDebug(): void {
  if (!iconService) {
    iconService = inject(IconRegistryService);
  }
  iconService.enableDebug();
  console.log('🐛 Debug mode activé pour IconRegistryService');
}

export function disableIconDebug(): void {
  if (!iconService) {
    iconService = inject(IconRegistryService);
  }
  iconService.disableDebug();
  console.log('🔇 Debug mode désactivé pour IconRegistryService');
}

export function reloadIcons(): Promise<void> {
  if (!iconService) {
    iconService = inject(IconRegistryService);
  }
  console.log('🔄 Rechargement forcé des icônes...');
  return iconService.reload();
}
