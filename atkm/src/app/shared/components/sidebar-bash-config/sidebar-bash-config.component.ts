// src/app/shared/components/sidebar-bash-config/sidebar-bash-config.component.ts
// Updated component with direct ApiManagementStateService integration

import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AtkIconComponent } from '@shared/components/atk-icon/atk-icon.component';
import { ApiManagementStateService } from '@shared/services/atk-api-management-state.service';
import { AtkApiManagementConfigFactory } from '../atk-api-management/atk-api-management-config.factory';
import { IBashConfig, IBashEndpointConfig } from '../atk-bash/atk-bash.interfaces';

/**
 * Configuration sections for bash terminal control
 */
interface IBashConfigSection {
  id: string;
  title: string;
  icon: string;
  isExpanded: boolean;
  items: IBashConfigItem[];
}

interface IBashConfigItem {
  id: string;
  type: 'select' | 'input' | 'toggle' | 'button' | 'range' | 'color';
  label: string;
  value: any;
  options?: Array<{ value: any; label: string; disabled?: boolean }>;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  description?: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}

/**
 * Events emitted by the sidebar config
 */
interface IBashConfigEvent {
  type: 'endpoint-change' | 'parameter-change' | 'action-execute' | 'config-update' | 'account-refresh';
  payload: any;
  timestamp: Date;
}

@Component({
  selector: 'atk-sidebar-bash-config',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AtkIconComponent
  ],
  templateUrl: './sidebar-bash-config.component.html',
  styleUrls: ['./sidebar-bash-config.component.css']
})
export class SidebarBashConfigComponent {

  bashConfig = input<any>();          // IBashConfig | null
  terminalState = input<any>();       // état du terminal
  currentEndpoint = input<string>();  // id endpoint courant
  accountData = input<any>();         // infos compte
  // Component outputs (kept for backward compatibility if needed)
  configChange = output<IBashConfigEvent>();
  togglePanel = output<void>();
  // Services
  private configFactory = inject(AtkApiManagementConfigFactory);
  public stateService = inject(ApiManagementStateService);
  // Internal state signals
  internalConfig = signal<IBashConfigSection[]>([]);
  searchQuery = signal<string>('');
  activeTab = signal<'endpoints' | 'parameters' | 'terminal' | 'actions' | 'account'>('endpoints');
  // Computed properties using state service
  availableEndpoints = computed(() => {
    const config = this.stateService.currentConfig();
    return config?.endpoints || [];
  });

  filteredSections = computed(() => {
    const sections = this.internalConfig();
    const query = this.searchQuery().toLowerCase();
    if (!query) return sections;
    return sections.map(section => ({
      ...section,
      items: section.items.filter(item =>
        item.label.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      )
    })).filter(section => section.items.length > 0);
  });

  // State service computed properties
  isLoading = computed(() => this.stateService.isLoading());
  hasError = computed(() => this.stateService.hasError());
  connectionStatus = computed(() => this.stateService.terminalState().connectionStatus || 'disconnected');
  isCollapsed = computed(() => this.stateService.sidebarCollapsed());

  // Account computed properties
  accountInfo = computed(() => {
    const account = this.stateService.accountData();
    if (!account) return null;

    return {
      accountType: account.accountType || 'Unknown',
      updateTime: account.updateTime ? new Date(account.updateTime).toLocaleString('fr-FR') : 'Not available',
      permissions: account.permissions || [],
      canTrade: account.canTrade || false,
      canWithdraw: account.canWithdraw || false,
      canDeposit: account.canDeposit || false,
      balanceCount: account.balances?.length || 0,
      significantBalances: account.balances?.filter(b =>
        parseFloat(b.free?.toString() || '0') > 0 ||
        parseFloat(b.locked?.toString() || '0') > 0
      ).length || 0
    };
  });

  constructor() {
    // Watch for config changes from state service and rebuild internal config
    effect(() => {
      const config = this.stateService.currentConfig();
      if (config) {
        this.buildConfigSections(config);
      }
    });

    // Subscribe to state service events for logging
    this.stateService.events$.subscribe(event => {
      console.log(`🎛️ Sidebar received state event:`, event.type, event.payload);
    });
  }

  /**
   * Handle panel toggle via state service
   */
  onToggle(): void {
    // this.togglePanel.emit();
    this.stateService.toggleSidebar();
  }

  /**
   * Handle tab change
   */
  setActiveTab(tab: 'endpoints' | 'parameters' | 'terminal' | 'actions' | 'account'): void {
    this.activeTab.set(tab);
  }

  /**
   * Handle search input
   */
  onSearchChange(query: string): void {
    this.searchQuery.set(query);
  }

  /**
   * Handle section toggle
   */
  toggleSection(sectionId: string): void {
    this.internalConfig.update(sections =>
      sections.map(section =>
        section.id === sectionId
          ? { ...section, isExpanded: !section.isExpanded }
          : section
      )
    );
  }

  /**
   * Handle endpoint selection - direct state service integration
   */
  onEndpointChange(endpointId: string): void {
    this.stateService.setCurrentEndpoint(endpointId);
    this.emitConfigEvent('endpoint-change', { endpointId });
  }

  /**
   * Handle parameter changes - direct state service integration
   */
  onParameterChange(paramKey: string, value: any): void {
    this.stateService.updateRequestParameter(paramKey, value);
    this.emitConfigEvent('parameter-change', {
      parameter: paramKey,
      value,
      endpoint: this.stateService.currentEndpoint()
    });
  }

  /**
   * Handle configuration item value changes
   */
  onConfigItemChange(sectionId: string, itemId: string, value: any): void {
    this.internalConfig.update(sections =>
      sections.map(section =>
        section.id === sectionId
          ? {
            ...section,
            items: section.items.map(item =>
              item.id === itemId ? { ...item, value } : item
            )
          }
          : section
      )
    );

    this.emitConfigEvent('config-update', {
      section: sectionId,
      item: itemId,
      value
    });
  }

  /**
   * Execute terminal actions - direct state service integration
   */
  executeAction(actionId: string): void {
    this.stateService.executeAction(actionId);
    this.emitConfigEvent('action-execute', { actionId });
  }

  /**
   * Execute account actions - direct state service integration
   */
  executeAccountAction(actionId: string): void {
    this.stateService.executeAction(actionId);
    this.emitConfigEvent('account-refresh', { actionId });
  }

  /**
   * Get current endpoint configuration from state service
   */
  getCurrentEndpointConfig(): IBashEndpointConfig | null {
    return this.stateService.currentEndpointConfig();
  }

  /**
   * Export current configuration
   */
  exportConfig(): void {
    const config = {
      bashConfig: this.stateService.currentConfig(),
      terminalState: this.stateService.terminalState(),
      internalConfig: this.internalConfig(),
      accountData: this.stateService.accountData(),
      completeState: this.stateService.getCompleteState(),
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `api-management-config-${Date.now()}.json`;
    a.click();

    URL.revokeObjectURL(url);
  }

  /**
   * Reset configuration to defaults - direct state service integration
   */
  resetToDefaults(): void {
    this.stateService.resetState();

    // Rebuild internal config
    const config = this.stateService.currentConfig();
    if (config) {
      this.buildConfigSections(config);
    }

    this.emitConfigEvent('config-update', { reset: true });
  }

  /**
   * Format account permissions for display
   */
  formatAccountPermissions(permissions: string[]): string {
    if (!permissions || permissions.length === 0) {
      return 'None';
    }
    return permissions.join(', ');
  }

  /**
   * Get account status icon
   */
  getAccountStatusIcon(canTrade: boolean, canWithdraw: boolean, canDeposit: boolean): string {
    if (canTrade && canWithdraw && canDeposit) return 'check-circle';
    if (canTrade || canWithdraw || canDeposit) return 'alert-circle';
    return 'x-circle';
  }

  /**
   * Get account status color
   */
  getAccountStatusColor(canTrade: boolean, canWithdraw: boolean, canDeposit: boolean): string {
    if (canTrade && canWithdraw && canDeposit) return 'var(--color-success-emphasis)';
    if (canTrade || canWithdraw || canDeposit) return 'var(--color-attention-emphasis)';
    return 'var(--color-danger-emphasis)';
  }

  // Private methods

  private buildConfigSections(config: IBashConfig): void {
    const sections: IBashConfigSection[] = [
      this.buildEndpointsSection(config),
      this.buildParametersSection(config),
      this.buildTerminalSection(config),
      this.buildActionsSection(config)
    ];

    this.internalConfig.set(sections);
  }

  private buildEndpointsSection(config: IBashConfig): IBashConfigSection {
    const currentEndpoint = this.stateService.currentEndpoint();

    const endpointItems: IBashConfigItem[] = [
      {
        id: 'current-endpoint',
        type: 'select' as const,
        label: 'Active Endpoint',
        value: currentEndpoint,
        options: config.endpoints.map(ep => ({
          value: ep.id,
          label: ep.name,
          disabled: false
        })),
        description: 'Select the API endpoint to use for data retrieval'
      },
      {
        id: 'auto-refresh',
        type: 'toggle' as const,
        label: 'Auto Refresh',
        value: false,
        description: 'Automatically refresh data at intervals'
      },
      {
        id: 'refresh-interval',
        type: 'range' as const,
        label: 'Refresh Interval (seconds)',
        value: 30,
        min: 5,
        max: 300,
        step: 5,
        description: 'How often to refresh the data'
      }
    ];

    return {
      id: 'endpoints',
      title: 'API Endpoints',
      icon: 'server',
      isExpanded: true,
      items: endpointItems
    };
  }

  private buildParametersSection(config: IBashConfig): IBashConfigSection {
    const currentEndpoint = this.getCurrentEndpointConfig();
    const requestParams = this.stateService.terminalState().requestParams || {};

    // Combine endpoint default params with current request params
    const allParams = { ...currentEndpoint?.params, ...requestParams };

    const paramItems: IBashConfigItem[] = Object.entries(allParams).map(([key, value]) => ({
      id: `param-${key}`,
      type: typeof value === 'boolean' ? 'toggle' as const : 'input' as const,
      label: this.formatParameterLabel(key),
      value: value,
      placeholder: `Enter ${key}...`,
      description: `Parameter: ${key}`
    }));

    const addParamItem: IBashConfigItem = {
      id: 'add-parameter',
      type: 'button' as const,
      label: 'Add Custom Parameter',
      value: null,
      variant: 'secondary' as const,
      description: 'Add a custom request parameter'
    };

    return {
      id: 'parameters',
      title: 'Request Parameters',
      icon: 'settings',
      isExpanded: false,
      items: [...paramItems, addParamItem]
    };
  }

  private buildTerminalSection(config: IBashConfig): IBashConfigSection {
    const terminalItems: IBashConfigItem[] = [
      {
        id: 'terminal-height',
        type: 'range' as const,
        label: 'Terminal Height (px)',
        value: parseInt(config.terminal.height) || 500,
        min: 200,
        max: 1000,
        step: 50,
        description: 'Height of the terminal window'
      },
      {
        id: 'auto-scroll',
        type: 'toggle' as const,
        label: 'Auto Scroll',
        value: true,
        description: 'Automatically scroll to bottom on new content'
      },
      {
        id: 'show-timestamps',
        type: 'toggle' as const,
        label: 'Show Timestamps',
        value: true,
        description: 'Display timestamps in terminal logs'
      },
      {
        id: 'max-log-entries',
        type: 'range' as const,
        label: 'Max Log Entries',
        value: 1000,
        min: 100,
        max: 5000,
        step: 100,
        description: 'Maximum number of log entries to keep'
      },
      {
        id: 'terminal-theme',
        type: 'select' as const,
        label: 'Terminal Theme',
        value: 'dark',
        options: [
          { value: 'dark', label: 'Dark Theme' },
          { value: 'light', label: 'Light Theme' },
          { value: 'high-contrast', label: 'High Contrast' }
        ],
        description: 'Visual theme for the terminal'
      }
    ];

    return {
      id: 'terminal',
      title: 'Terminal Settings',
      icon: 'terminal',
      isExpanded: false,
      items: terminalItems
    };
  }

  private buildActionsSection(config: IBashConfig): IBashConfigSection {
    const actionItems: IBashConfigItem[] = [
      {
        id: 'clear-terminal',
        type: 'button' as const,
        label: 'Clear Terminal',
        value: null,
        variant: 'secondary' as const,
        description: 'Clear all terminal content and logs'
      },
      {
        id: 'export-logs',
        type: 'button' as const,
        label: 'Export Logs',
        value: null,
        variant: 'secondary' as const,
        description: 'Export terminal logs to file'
      },
      {
        id: 'export-data',
        type: 'button' as const,
        label: 'Export Data',
        value: null,
        variant: 'secondary' as const,
        description: 'Export current data to CSV/JSON'
      },
      {
        id: 'test-connection',
        type: 'button' as const,
        label: 'Test Connection',
        value: null,
        variant: 'primary' as const,
        description: 'Test connection to current endpoint'
      },
      {
        id: 'reload-config',
        type: 'button' as const,
        label: 'Reload Config',
        value: null,
        variant: 'warning' as const,
        description: 'Reload configuration from factory'
      },
      {
        id: 'refresh-account',
        type: 'button' as const,
        label: 'Refresh Account',
        value: null,
        variant: 'success' as const,
        description: 'Refresh account data'
      }
    ];

    return {
      id: 'actions',
      title: 'Quick Actions',
      icon: 'zap',
      isExpanded: false,
      items: actionItems
    };
  }

  private formatParameterLabel(key: string): string {
    return key
      .split(/[_-]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private emitConfigEvent(type: IBashConfigEvent['type'], payload: any): void {
    const event: IBashConfigEvent = {
      type,
      payload,
      timestamp: new Date()
    };

    this.configChange.emit(event);
  }
}
