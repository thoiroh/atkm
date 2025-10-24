// sidebar-bash-config.component.ts
import { CommonModule } from '@angular/common';
import { Component, computed, HostListener, inject, input, output, signal } from '@angular/core';

import { AtkIconComponent } from '@shared/components/atk-icon/atk-icon.component';

import { ToolsService } from '@core/services/tools.service';
import { IBashSidebarField } from '@shared/components/atk-api/atk-api-bash/atk-api-bash.interfaces';
import { AtkApiBashService } from '@shared/components/atk-api/atk-api-bash/atk-api-bash.service';
import { AtkApiSidebarConfigService } from '@shared/components/atk-api/atk-api-sidebar-config/atk-api-sidebar-config.service';

@Component({
  selector: 'atk-api-sidebar-config',
  standalone: true,
  imports: [CommonModule, AtkIconComponent],
  templateUrl: './atk-api-sidebar-config.component.html',
  styleUrls: ['./atk-api-sidebar-config.component.css']
})
export class AtkApiSidebarConfigComponent {

  // ======================================================
  // DEPENDENCIES
  // ======================================================

  private readonly bashService = inject(AtkApiBashService);
  private readonly sidebarService = inject(AtkApiSidebarConfigService);
  private tools = inject(ToolsService);

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

  configId = input<string>('atkpi-debug-v2');

  endpoints = computed(() => {
    const config = this.bashService.getConfig(this.configId());
    if (!config) return [];
    return config.endpoints
      .filter(ep => ep.visible !== false)
      .map(ep => ({
        id: ep.id,
        name: ep.name,
        icon: ep.icon || 'file'
      }));
  });

  // ======================================================
  // HOST LISTENERS FOR AUTO-COLLAPSE
  // ======================================================

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const sidebar = target.closest('.bash-config-panel');
    const toggleBtn = target.closest('.bash-config-toggle');

    // Don't collapse if:
    // 1. Sidebar is collapsed
    // 2. Sidebar is pinned
    // 3. Click is inside sidebar or on toggle button
    if (this.isCollapsed() || this.state().isPinned || sidebar || toggleBtn) {
      return;
    }

    // Collapse sidebar on outside click
    this.togglePanel.emit();
  }

  // ======================================================
  // COMPUTED
  // ======================================================

  currentEndpointConfig = computed(() => {
    const currentId = this.state().currentEndpoint;
    const endpointsList = this.endpoints(); // Call the signal to get the value
    return endpointsList.find(ep => ep.id === currentId) || endpointsList[0];
  });

  /**
   * Get selected row data
   */
  selectedRowData = computed(() => {
    return this.state().selectedRowData;
  });

  /**
   * Get row detail fields configuration from bash config
   */
  rowDetailFields = computed(() => {
    const currentEndpoint = this.state().currentEndpoint;
    const config = this.bashService.getConfig(this.configId());
    const endpoint = config?.endpoints.find(ep => ep.id === currentEndpoint);
    return endpoint?.rowDetailFields || [];
  });

  /**
 * Get sidebar fields configuration from bash config
 */
  sidebarFields = computed(() => {
    const currentEndpoint = this.state().currentEndpoint;
    const config = this.bashService.getConfig(this.configId());
    const endpoint = config?.endpoints.find(ep => ep.id === currentEndpoint);
    return endpoint?.sidebarFields || [];
  });

  /**
   * Get sidebar data from state
   */
  sidebarData = computed(() => {
    return this.state().sidebarData;
  });

  /**
   * Check if we have sidebar data to display
   */
  hasSidebarData = computed(() => {
    const data = this.sidebarData();
    return data !== null && Object.keys(data).length > 0;
  });

  /**
   * Check if current endpoint is 'account' (only endpoint with sidebarFields)
   */
  isAccountEndpoint = computed(() => {
    return this.state().currentEndpoint === 'account';
  });

  /**
   * Check if we have a selected row
   */
  hasSelectedRow = computed(() => {
    return this.selectedRowData() !== null;
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
    this.tools.consoleGroup({ // TAG SidebarBashConfigComponent -> selectEndpoint()================ CONSOLE LOG IN PROGRESS
      title: `SidebarBashConfigComponent -> selectEndpoint() -> `, tag: 'check', palette: 'ac', collapsed: true,
      data: endpointId
    });
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

  /**
   * Format field value based on type
   */
  formatFieldValue(value: any, field: IBashSidebarField): string {
    if (value === null || value === undefined) return '-';

    if (field.formatter) {
      return field.formatter(value);
    }

    switch (field.type) {
      case 'boolean':
        return value ? 'Yes' : 'No';
      case 'date':
        return new Date(value).toLocaleString('us-EN');
      case 'number':
        return typeof value === 'number' ? value.toLocaleString('fr-FR') : value;
      default:
        return value.toString();
    }
  }

  /**
   * Clear selected row
   */
  clearSelection(): void {
    this.sidebarService.clearSelectedRow();
  }

  /**
   * Toggle pin state
   */
  togglePin(): void {
    this.sidebarService.togglePinned();
  }
}
