// src/app/shared/components/sidebar-bash-config/sidebar-bash-config.component.ts
// Complete control component for ATK Bash terminal configuration

import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AtkIconComponent } from '@shared/components/atk-icon/atk-icon.component';
import { AtkBashConfigFactory } from '../atk-bash/atk-bash-config.factory';
import { IBashConfig, IBashEndpointConfig, IBashTerminalState } from '../atk-bash/atk-bash.interfaces';

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
  type: 'endpoint-change' | 'parameter-change' | 'action-execute' | 'config-update';
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

  // Component inputs
  bashConfig = input<IBashConfig | null>(null);
  terminalState = input<IBashTerminalState | null>(null);
  isCollapsed = input<boolean>(true);
  currentEndpoint = input<string>('');

  // Component outputs
  configChange = output<IBashConfigEvent>();
  togglePanel = output<void>();

  // Services
  private bashConfigFactory = inject(AtkBashConfigFactory);

  // Internal state signals (made public for template access)
  internalConfig = signal<IBashConfigSection[]>([]);
  searchQuery = signal<string>('');
  activeTab = signal<'endpoints' | 'parameters' | 'terminal' | 'actions'>('endpoints');

  // Computed properties
  availableEndpoints = computed(() => {
    const config = this.bashConfig();
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

  isLoading = computed(() => this.terminalState()?.loading || false);
  hasError = computed(() => !!this.terminalState()?.error);
  connectionStatus = computed(() => this.terminalState()?.connectionStatus || 'disconnected');

  constructor() {
    // Watch for bash config changes and rebuild internal config
    effect(() => {
      const config = this.bashConfig();
      if (config) {
        this.buildConfigSections(config);
      }
    });
  }

  /**
   * Handle panel toggle
   */
  onToggle(): void {
    this.togglePanel.emit();
  }

  /**
   * Handle tab change
   */
  setActiveTab(tab: 'endpoints' | 'parameters' | 'terminal' | 'actions'): void {
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
   * Handle endpoint selection
   */
  onEndpointChange(endpointId: string): void {
    this.emitConfigEvent('endpoint-change', { endpointId });
  }

  /**
   * Handle parameter changes
   */
  onParameterChange(paramKey: string, value: any): void {
    this.emitConfigEvent('parameter-change', {
      parameter: paramKey,
      value,
      endpoint: this.currentEndpoint()
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
   * Execute terminal actions
   */
  executeAction(actionId: string): void {
    this.emitConfigEvent('action-execute', { actionId });
  }

  /**
   * Get current endpoint configuration
   */
  getCurrentEndpointConfig(): IBashEndpointConfig | null {
    const endpoints = this.availableEndpoints();
    const currentId = this.currentEndpoint();
    return endpoints.find(ep => ep.id === currentId) || null;
  }

  /**
   * Export current configuration
   */
  exportConfig(): void {
    const config = {
      bashConfig: this.bashConfig(),
      terminalState: this.terminalState(),
      internalConfig: this.internalConfig(),
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `bash-config-${Date.now()}.json`;
    a.click();

    URL.revokeObjectURL(url);
  }

  /**
   * Reset configuration to defaults
   */
  resetToDefaults(): void {
    const config = this.bashConfig();
    if (config) {
      this.buildConfigSections(config);
      this.emitConfigEvent('config-update', { reset: true });
    }
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
    const endpointItems: IBashConfigItem[] = [
      {
        id: 'current-endpoint',
        type: 'select' as const,
        label: 'Active Endpoint',
        value: this.currentEndpoint(),
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
    const params = currentEndpoint?.params || {};

    const paramItems: IBashConfigItem[] = Object.entries(params).map(([key, value]) => ({
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
        description: 'Reload bash configuration from factory'
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
    this.configChange.emit({
      type,
      payload,
      timestamp: new Date()
    });
  }
}
