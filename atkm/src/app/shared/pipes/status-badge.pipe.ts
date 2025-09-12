
// ========================================
// status-badge.pipe.ts
// ========================================

import { Pipe, PipeTransform } from '@angular/core';

export interface StatusBadgeConfig {
  text: string;
  cssClass: string;
  icon?: string;
}

@Pipe({
  name: 'statusBadge',
  standalone: true
})
export class StatusBadgePipe implements PipeTransform {

  /**
   * Transform status values into badge configurations
   * Returns object with text, cssClass, and optional icon
   */
  transform(value: string | boolean, type: 'trade-side' | 'order-status' | 'connection' | 'permission' = 'trade-side'): StatusBadgeConfig {

    switch (type) {
      case 'trade-side':
        return this.getTradeSideBadge(value as string);
      case 'order-status':
        return this.getOrderStatusBadge(value as string);
      case 'connection':
        return this.getConnectionBadge(value as string);
      case 'permission':
        return this.getPermissionBadge(value as boolean);
      default:
        return { text: value?.toString() || '', cssClass: 'badge-default' };
    }
  }

  private getTradeSideBadge(side: string): StatusBadgeConfig {
    const upperSide = side?.toUpperCase();

    switch (upperSide) {
      case 'BUY':
        return {
          text: 'BUY',
          cssClass: 'badge badge-success side-buy',
          icon: 'trending-up'
        };
      case 'SELL':
        return {
          text: 'SELL',
          cssClass: 'badge badge-danger side-sell',
          icon: 'trending-down'
        };
      default:
        return {
          text: upperSide || 'UNKNOWN',
          cssClass: 'badge badge-secondary'
        };
    }
  }

  private getOrderStatusBadge(status: string): StatusBadgeConfig {
    const upperStatus = status?.toUpperCase();

    const statusMap: Record<string, StatusBadgeConfig> = {
      'FILLED': {
        text: 'FILLED',
        cssClass: 'badge badge-success',
        icon: 'check-circle'
      },
      'PARTIALLY_FILLED': {
        text: 'PARTIAL',
        cssClass: 'badge badge-warning',
        icon: 'clock'
      },
      'NEW': {
        text: 'ACTIVE',
        cssClass: 'badge badge-info',
        icon: 'activity'
      },
      'CANCELED': {
        text: 'CANCELED',
        cssClass: 'badge badge-secondary',
        icon: 'x-circle'
      },
      'REJECTED': {
        text: 'REJECTED',
        cssClass: 'badge badge-danger',
        icon: 'alert-circle'
      },
      'EXPIRED': {
        text: 'EXPIRED',
        cssClass: 'badge badge-dark',
        icon: 'clock'
      }
    };

    return statusMap[upperStatus] || {
      text: upperStatus || 'UNKNOWN',
      cssClass: 'badge badge-secondary'
    };
  }

  private getConnectionBadge(status: string): StatusBadgeConfig {
    switch (status?.toLowerCase()) {
      case 'connected':
        return {
          text: 'Connected',
          cssClass: 'badge badge-success connection-ok',
          icon: 'wifi'
        };
      case 'connecting':
        return {
          text: 'Connecting...',
          cssClass: 'badge badge-warning connection-pending',
          icon: 'loader'
        };
      case 'disconnected':
        return {
          text: 'Disconnected',
          cssClass: 'badge badge-danger connection-error',
          icon: 'wifi-off'
        };
      default:
        return {
          text: 'Unknown',
          cssClass: 'badge badge-secondary',
          icon: 'help-circle'
        };
    }
  }

  private getPermissionBadge(enabled: boolean): StatusBadgeConfig {
    return {
      text: enabled ? 'Enabled' : 'Disabled',
      cssClass: enabled ? 'badge badge-success' : 'badge badge-secondary',
      icon: enabled ? 'check' : 'x'
    };
  }
}
