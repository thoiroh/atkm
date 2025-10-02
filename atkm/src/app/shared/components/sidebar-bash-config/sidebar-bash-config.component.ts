// atk-sidebar-bash-config.component.ts
import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, OnInit, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AtkBashConfigFactory } from '@shared/components/atk-bash/atk-bash-config.factory';
import { IBashEndpointConfig, IBashSidebarField } from '@shared/components/atk-bash/atk-bash.interfaces';
import { AtkIconComponent } from '@shared/components/atk-icon/atk-icon.component';
import { ApiManagementStateService } from '@shared/services/atk-api-management-state.service';
import { ToolsService } from '@shared/services/tools.service';

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

interface IBashConfigEvent {
  type: 'endpoint-change' | 'parameter-change' | 'action-execute' | 'config-update';
  payload: any;
  timestamp: Date;
}

interface SidebarFieldDisplay {
  field: IBashSidebarField;
  value: any;
  formattedValue: string;
  visible: boolean;
}

@Component({
  selector: 'atk-sidebar-bash-config',
  standalone: true,
  imports: [CommonModule, AtkIconComponent],
  templateUrl: './sidebar-bash-config.component.html',
  styleUrls: ['./sidebar-bash-config.component.css'],
})
export class SidebarBashConfigComponent implements OnInit {

  // =========================================
  // INPUTS
  // =========================================

  configId = input<string>('binance-debug-v2');
  showDebugInfo = input<boolean>(false);
  isCollapsed = input<boolean>(true);
  togglePanel = output<void>();

  internalConfig = signal<IBashConfigSection[]>([]);
  searchQuery = signal<string>('');
  activeTab = signal<'endpoints' | 'parameters' | 'terminal' | 'actions' | 'account'>('endpoints');

  // =========================================
  // SERVICES
  // =========================================

  private apiManagementState = inject(ApiManagementStateService);
  private bashConfigFactory = inject(AtkBashConfigFactory);

  // =========================================
  // SIGNALS
  // =========================================

  private currentConfig = signal<any>(null);

  // =========================================
  // COMPUTED SIGNALS - Angular 20 Style
  // =========================================

  public readonly configTitle = computed(() => this.currentConfig()?.title);
  public readonly currentEndpoint = computed(() => this.apiManagementState.currentEndpoint());
  public readonly loading = computed(() => this.apiManagementState.loading());
  public readonly error = computed(() => this.apiManagementState.error());
  public readonly hasData = computed(() => this.apiManagementState.hasData());
  public readonly sidebarData = computed(() => this.apiManagementState.sidebarData());
  public readonly summary = computed(() => this.apiManagementState.summary());

  public readonly currentEndpointConfig = computed(() => {
    const config = this.currentConfig();
    const endpoint = this.currentEndpoint();

    if (!config || !endpoint) return null;

    return config.endpoints?.find((ep: IBashEndpointConfig) => ep.id === endpoint) || null;
  });

  public readonly sidebarFields = computed(() => {
    const endpointConfig = this.currentEndpointConfig();
    return endpointConfig?.sidebarFields || [];
  });

  public readonly displayFields = computed((): SidebarFieldDisplay[] => {
    const fields = this.sidebarFields();
    const data = this.sidebarData();

    return fields.map((field: IBashSidebarField) => ({
      field,
      value: data[field.key],
      formattedValue: this.formatFieldValue(data[field.key], field),
      visible: field.visible !== false && data[field.key] !== undefined
    }));
  });

  private tools = inject(ToolsService);

  // =========================================
  // CONSTRUCTOR & LIFECYCLE
  // =========================================

  constructor() {
    // Effect to load configuration when configId changes
    effect(() => {
      const configIdValue = this.configId();
      this.loadConfiguration(configIdValue);
    });

    // Subscribe to API management events
    this.apiManagementState.events$
      .pipe(takeUntilDestroyed())
      .subscribe(event => {
        // OFF: atk-sidebar-bash-config.102 ================ CONSOLE LOG IN PROGRESS
        // this.tools.consoleGroup({
        //   title: `atk-sidebar-bash-config 102 received event: ${event.type}`,
        //   tag: 'check',
        //   data: event.payload,
        //   palette: 'de',
        //   collapsed: true,
        //   fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        //   fontSizePx: 13
        // });
      });
  }

  ngOnInit(): void {
    // Set the config ID in the API management service
    this.apiManagementState.setConfigId(this.configId());
  }

  // =========================================
  // PUBLIC METHODS
  // =========================================

  public onToggle(): void {
    this.togglePanel.emit();
  }

  /**
  * Handle tab change
  */
  public setActiveTab(tab: 'endpoints' | 'parameters' | 'terminal' | 'actions' | 'account'): void {
    this.activeTab.set(tab);
  }

  public getEndpointName(): string {
    const endpointConfig = this.currentEndpointConfig();
    return endpointConfig?.name || 'Unknown Endpoint';
  }

  public formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  public getDebugInfo(): string {
    const debugData = {
      configId: this.configId(),
      currentEndpoint: this.currentEndpoint(),
      hasData: this.hasData(),
      sidebarFields: this.sidebarFields().length,
      sidebarData: Object.keys(this.sidebarData()).length,
      summary: this.summary()
    };

    return JSON.stringify(debugData, null, 2);
  }

  // =========================================
  // PRIVATE METHODS
  // =========================================

  private loadConfiguration(configId: string): void {
    let config = null;

    switch (configId) {
      case 'binance-debug-v2':
        config = this.bashConfigFactory.createBinanceDebugConfig();
        break;
      case 'ibkr-debug-v1':
        config = this.bashConfigFactory.createIbkrConfig();
        break;
      default:
        console.warn(`Unknown config ID: ${configId}`);
        return;
    }

    if (config) {
      this.currentConfig.set(config);
      this.tools.consoleGroup({       // TAG: atk-sidebar-bash-config.222 ================ CONSOLE LOG IN PROGRESS
        title: `SidebarBashConfigComponent 222  -> loadConfiguration() -> configTitle: ${config.title}`, tag: 'check', palette: 'su',
        data: {
          'Config endpoints': config.endpoints,
          'Default endpoint:': config.defaultEndpoint,
          'Current endpoint signal:': this.currentEndpoint()
        }
      });
    }
  }

  private formatFieldValue(value: any, field: IBashSidebarField): string {
    if (value === null || value === undefined) return 'N/A';

    // Use custom formatter if available
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
        return typeof value === 'number' ? value.toLocaleString() : value.toString();
      case 'status':
        return value.toString().toUpperCase();
      default:
        return value.toString();
    }
  }
}
