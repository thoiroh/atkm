// sidebar-bash-config.component.ts
import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { AtkIconComponent } from '@shared/components/atk-icon/atk-icon.component';
import { SidebarBashConfigService } from './sidebar-bash-config.service';

interface EndpointConfig {
  id: string;
  name: string;
  icon: string;
}

@Component({
  selector: 'atk-sidebar-bash-config',
  standalone: true,
  imports: [CommonModule, AtkIconComponent],
  templateUrl: './sidebar-bash-config.component.html',
  styleUrls: ['./sidebar-bash-config.component.css']
})
export class SidebarBashConfigComponent {

  // ======================================================
  // DEPENDENCIES
  // ======================================================

  private readonly sidebarService = inject(SidebarBashConfigService);

  // ======================================================
  // INPUTS / OUTPUTS
  // ======================================================

  isCollapsed = input<boolean>(true);
  togglePanel = output<void>();

  // ======================================================
  // PUBLIC STATE
  // ======================================================

  state = this.sidebarService.state;

  lastResponse = signal<{
    responseTime: number;
    dataCount: number;
    statusCode: number;
  } | null>(null);

  endpoints: EndpointConfig[] = [
    { id: 'account', name: 'Account', icon: 'user' },
    { id: 'trades', name: 'Trades', icon: 'trending-up' },
    { id: 'orders', name: 'Orders', icon: 'list' },
    { id: 'ticker', name: 'Ticker', icon: 'activity' }
  ];

  // ======================================================
  // COMPUTED
  // ======================================================

  currentEndpointConfig = computed(() => {
    const currentId = this.state().currentEndpoint;
    return this.endpoints.find(ep => ep.id === currentId) || this.endpoints[0];
  });

  // Expose Object for template
  Object = Object;

  // ======================================================
  // PUBLIC METHODS
  // ======================================================

  onToggle(): void {
    this.togglePanel.emit();
  }

  selectEndpoint(endpointId: string): void {
    this.sidebarService.updateEndpoint(endpointId);

    // Set default parameters based on endpoint
    if (endpointId !== 'account') {
      this.sidebarService.updateParameters({
        symbol: 'BTCUSDT',
        ...(endpointId === 'trades' || endpointId === 'orders' ? { limit: 100 } : {})
      });
    }
  }

  updateParameter(key: string, value: any): void {
    this.sidebarService.updateParameters({ [key]: value });
  }

  triggerLoadData(): void {
    this.sidebarService.triggerDataLoad();
  }

  testConnection(): void {
    this.sidebarService.triggerConnectionTest();
  }

  clearCache(): void {
    this.sidebarService.triggerAction('clear-cache');
  }

  exportData(): void {
    this.sidebarService.triggerAction('export-data');
  }
}
