import { inject } from '@angular/core';
import { IconService } from '@app/core/services/icon.service';

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

let iconService: IconService | null = null;

export function enableIconDebug(): void {
  if (!iconService) {
    iconService = inject(IconService);
  }
  iconService.enableDebug();
  console.log('🐛 Debug mode activé pour IconService');
}

export function disableIconDebug(): void {
  if (!iconService) {
    iconService = inject(IconService);
  }
  iconService.disableDebug();
  console.log('🔇 Debug mode désactivé pour IconService');
}

export function reloadIcons(): Promise<void> {
  if (!iconService) {
    iconService = inject(IconService);
  }
  console.log('🔄 Rechargement forcé des icônes...');
  return iconService.reload();
}
