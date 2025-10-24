/**
 * ATK API Sidebar Component
 * Configuration and control panel for API debugging
 *
 * Responsibilities:
 * - Display available endpoints
 * - Show and edit request parameters
 * - Display sidebar fields (account-level data)
 * - Display row detail fields (selected row data)
 * - Trigger actions (load, test, clear cache, export)
 * - Manage pin/collapse state
 *
 * @file atk-api-sidebar.component.ts
 * @version 2.0.0
 * @architecture Dumb component - reads from state service
 */

import { CommonModule } from '@angular/common';
import { Component, computed, HostListener, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ToolsService } from '@core/services/tools.service';
import { AtkApiHttpService } from '@shared/components/atk-api/atk-api-http.service';
import { AtkApiStateService } from '@shared/components/atk-api/atk-api-state.service';
import { AtkIconComponent } from '@shared/components/atk-icon/atk-icon.component';

import type { IAtkApiSidebarField } from '@shared/components/atk-api/atk-api.interfaces';

@Component({
  selector: 'atk-api-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AtkIconComponent
  ],
  templateUrl: './atk-api-sidebar.component.html',
  styleUrls: ['./atk-api-sidebar.component.css']
})
export class AtkApiSidebarComponent {

  // ======================================================
  // DEPENDENCIES
  // ======================================================

  private readonly stateService = inject(AtkApiStateService);
  private readonly httpService = inject(AtkApiHttpService);
  private readonly tools = inject(ToolsService);

  // ======================================================
  // INPUTS / OUTPUTS
  // ======================================================

  /** Whether sidebar is collapsed */
  isCollapsed = input<boolean>(false);

  /** Emit when toggle button clicked */
  togglePanel = output<void>();

  // ======================================================
  // PUBLIC READONLY SIGNALS (from state service)
  // ======================================================

  readonly state = this.stateService.state;
  readonly config = this.stateService.config;

  // ======================================================
  // COMPUTED SIGNALS
  // ======================================================

  /**
   * Get visible endpoints from configuration
   */
  endpoints = computed(() => {
    const cfg = this.config();
    if (!cfg) return [];

    return cfg.endpoints
      .filter(ep => ep.visible !== false)
      .map(ep => ({
        id: ep.id,
        name: ep.name,
        icon: ep.icon || 'file',
        description: ep.description
      }));
  });

  /**
   * Get current endpoint configuration
   */
  currentEndpointConfig = computed(() => {
    return this.stateService.currentEndpointConfig();
  });

  /**
   * Get sidebar fields for current endpoint
   */
  sidebarFields = computed(() => {
    const endpoint = this.currentEndpointConfig();
    return endpoint?.sidebarFields || [];
  });

  /**
   * Get row detail fields for current endpoint
   */
  rowDetailFields = computed(() => {
    const endpoint = this.currentEndpointConfig();
    return endpoint?.rowDetailFields || [];
  });

  /**
   * Get sidebar data from state
   */
  sidebarData = computed(() => {
    return this.state().sidebarData;
  });

  /**
   * Get selected row data from state
   */
  selectedRowData = computed(() => {
    return this.state().selectedRowData;
  });

  /**
   * Check if we have sidebar data to display
   */
  hasSidebarData = computed(() => {
    const data = this.sidebarData();
    const fields = this.sidebarFields();
    return data !== null && Object.keys(data).length > 0 && fields.length > 0;
  });

  /**
   * Check if we have a selected row
   */
  hasSelectedRow = computed(() => {
    return this.selectedRowData() !== null;
  });

  /**
   * Get visible sidebar fields (filtered by visible flag)
   */
  visibleSidebarFields = computed(() => {
    return this.sidebarFields().filter(f => f.visible !== false);
  });

  /**
   * Get visible row detail fields (filtered by visible flag)
   */
  visibleRowDetailFields = computed(() => {
    return this.rowDetailFields().filter(f => f.visible !== false);
  });

  /**
   * Group sidebar fields by group property
   */
  groupedSidebarFields = computed(() => {
    const fields = this.visibleSidebarFields();
    const data = this.sidebarData();

    if (!data) return [];

    // Group by 'group' property
    const groups = new Map<string, typeof fields>();

    fields.forEach(field => {
      const groupKey = field.group || 'default';
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(field);
    });

    // Convert to array of {group, fields}
    return Array.from(groups.entries()).map(([group, fields]) => ({
      group,
      fields
    }));
  });

  /**
   * Group row detail fields by group property
   */
  groupedRowDetailFields = computed(() => {
    const fields = this.visibleRowDetailFields();
    const data = this.selectedRowData();

    if (!data) return [];

    // Group by 'group' property
    const groups = new Map<string, typeof fields>();

    fields.forEach(field => {
      const groupKey = field.group || 'default';
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(field);
    });

    // Convert to array of {group, fields}
    return Array.from(groups.entries()).map(([group, fields]) => ({
      group,
      fields
    }));
  });

  /**
   * Get parameters from current state
   */
  parameters = computed(() => {
    return this.state().parameters;
  });

  /**
   * Get parameter keys for iteration
   */
  parameterKeys = computed(() => {
    return Object.keys(this.parameters());
  });

  // Expose Object.keys for template
  Object = Object;

  // ======================================================
  // HOST LISTENERS - AUTO-COLLAPSE
  // ======================================================

  /**
   * Close sidebar when clicking outside (if not pinned)
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const sidebar = target.closest('.bash-config-panel');
    const toggleBtn = target.closest('.bash-config-toggle');

    // Don't collapse if:
    // 1. Sidebar is collapsed
    // 2. Sidebar is pinned
    // 3. Click is inside sidebar or on toggle button
    if (this.isCollapsed() || this.state().sidebarPinned || sidebar || toggleBtn) {
      return;
    }

    // Collapse sidebar on outside click
    this.togglePanel.emit();
  }

  // ======================================================
  // PUBLIC METHODS - UI ACTIONS
  // ======================================================

  /**
   * Toggle sidebar collapsed state
   */
  onToggle(): void {
    this.togglePanel.emit();
  }

  /**
   * Toggle pin state
   */
  togglePin(): void {
    this.stateService.toggleSidebarPin();
  }

  /**
   * Select an endpoint
   */
  selectEndpoint(endpointId: string): void {
    this.tools.consoleGroup({
      title: 'AtkApiSidebarComponent -> selectEndpoint()',
      tag: 'check',
      palette: 'ac',
      collapsed: true,
      data: { endpointId }
    });

    this.stateService.updateEndpoint(endpointId);

    // Set default parameters based on endpoint
    // (This logic could be moved to factory or state service)
    if (endpointId !== 'account') {
      const defaultParams: Record<string, any> = { symbol: 'BTCUSDT' };

      if (endpointId === 'trades' || endpointId === 'orders') {
        defaultParams.limit = 100;
      }

      this.stateService.updateParameters(defaultParams);
    } else {
      // Clear parameters for account endpoint
      this.stateService.updateParameters(({ all: true }));
    }
  }

  /**
   * Update a parameter value
   */
  updateParameter(key: string, value: any): void {
    this.stateService.updateParameters({ [key]: value });
  }

  /**
   * Trigger data load action
   */
  async triggerLoadData(): Promise<void> {
    const endpoint = this.currentEndpointConfig();
    const params = this.parameters();

    if (!endpoint) return;

    this.tools.consoleGroup({
      title: 'AtkApiSidebarComponent -> triggerLoadData()',
      tag: 'check',
      palette: 'ac',
      collapsed: true,
      data: { endpoint: endpoint.id, params }
    });

    // Set loading state
    this.stateService.setLoading(true);

    try {
      const response = await this.httpService.loadData(endpoint, params);

      if (response.error) {
        this.stateService.setError(response.error);
        return;
      }

      this.stateService.updateData(response.data);
      this.stateService.setResponseMetadata({
        statusCode: response.statusCode,
        responseTime: response.responseTime,
        dataCount: response.data.length,
        fromCache: response.fromCache,
        timestamp: new Date()
      });

    } catch (error: any) {
      this.stateService.setError(error.message);
    } finally {
      this.stateService.setLoading(false);
    }
  }

  /**
   * Test connection to endpoint
   */
  async testConnection(): Promise<void> {
    const endpoint = this.currentEndpointConfig();
    const params = this.parameters();

    if (!endpoint) return;

    this.tools.consoleGroup({
      title: 'AtkApiSidebarComponent -> testConnection()',
      tag: 'check',
      palette: 'ac',
      collapsed: true,
      data: { endpoint: endpoint.id }
    });

    const result = await this.httpService.testEndpoint(endpoint, params);

    // Construire un payload conforme au type attendu
    const payload: {
      success: boolean;
      responseTime: number;
      error?: string;
    } = {
      success: result.success === true,
      responseTime: result.responseTime ?? 0, // valeur par défaut si undefined
      ...(result.success ? {} : { error: result.error ?? 'Connection test failed' })
    };

    if (payload.success) {
      this.stateService.setConnectionStatus('connected');
    } else {
      this.stateService.setConnectionStatus('disconnected');
      this.stateService.setError(payload.error!);
    }

    this.stateService.emitEvent('connection-tested', payload);
  }


  /**
   * Clear cache
   */
  clearCache(): void {
    this.tools.consoleGroup({
      title: 'AtkApiSidebarComponent -> clearCache()',
      data: {},
      tag: 'check',
      palette: 'ac',
      collapsed: true
    });

    this.stateService.clearCache();
  }

  /**
   * Export data to JSON
   */
  exportData(): void {
    const data = this.state().tableData;
    const endpoint = this.currentEndpointConfig();

    if (data.length === 0) {
      this.stateService.addLog('No data to export', 'warning');
      return;
    }

    const filename = `${endpoint?.id || 'data'}-${Date.now()}.json`;

    this.tools.consoleGroup({
      title: 'AtkApiSidebarComponent -> exportData()',
      tag: 'check',
      palette: 'ac',
      collapsed: true,
      data: { filename, itemCount: data.length }
    });

    this.httpService.exportToJson(data, filename);
  }

  /**
   * Export data to CSV
   */
  exportToCsv(): void {
    const data = this.state().tableData;
    const columns = this.stateService.visibleColumns();
    const endpoint = this.currentEndpointConfig();

    if (data.length === 0) {
      this.stateService.addLog('No data to export', 'warning');
      return;
    }

    const filename = `${endpoint?.id || 'data'}-${Date.now()}.csv`;

    this.tools.consoleGroup({
      title: 'AtkApiSidebarComponent -> exportToCsv()',
      tag: 'check',
      palette: 'ac',
      collapsed: true,
      data: { filename, itemCount: data.length }
    });

    this.httpService.exportToCsv(data, columns, filename);
  }

  /**
   * Clear selected row
   */
  clearSelection(): void {
    this.stateService.clearSelectedRow();
  }

  // ======================================================
  // PUBLIC METHODS - FORMATTING
  // ======================================================

  /**
   * Format field value based on type and formatter
   */
  formatFieldValue(value: any, field: IAtkApiSidebarField): string {
    if (value === null || value === undefined) return '-';

    // Use custom formatter if provided
    if (field.formatter) {
      return field.formatter(value);
    }

    // Default formatting based on type
    switch (field.type) {
      case 'boolean':
        return value ? 'Yes' : 'No';

      case 'date':
        return new Date(value).toLocaleString('fr-FR');

      case 'number':
        return typeof value === 'number' ? value.toLocaleString('fr-FR') : value;

      default:
        return value.toString();
    }
  }

  /**
   * Get badge CSS class based on field type
   */
  getFieldBadgeClass(field: IAtkApiSidebarField): string {
    if (field.type === 'status') {
      return 'badge-status';
    }
    if (field.type === 'boolean') {
      return 'badge-boolean';
    }
    return 'badge-default';
  }
}
