// atk-sidebar-bash-config.component.ts
// CORRECTED - Component for displaying API data in sidebar with Angular 20 signals

import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AtkBashConfigFactory } from '@shared/components/atk-bash/atk-bash-config.factory';
import { IBashEndpointConfig, IBashSidebarField } from '@shared/components/atk-bash/atk-bash.interfaces';
import { AtkIconComponent } from '@shared/components/atk-icon/atk-icon.component';
import { ApiManagementStateService } from '@shared/services/atk-api-management-state.service';

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
  template: `
    <div class="sidebar-bash-config">

      <!-- Header Section -->
      <div class="sidebar-header">
        <div class="sidebar-title">
          <atk-icon name="settings" [size]="16" color="var(--color-accent-fg)" />
          <h3>{{ configTitle() || 'API Configuration' }}</h3>
        </div>

        @if (loading()) {
          <div class="sidebar-status loading">
            <atk-icon name="loader" [size]="14" color="var(--color-accent-fg)" />
            <span>Loading...</span>
          </div>
        } @else if (error()) {
          <div class="sidebar-status error">
            <atk-icon name="alert-circle" [size]="14" color="var(--color-danger)" />
            <span>{{ error() }}</span>
          </div>
        } @else if (hasData()) {
          <div class="sidebar-status success">
            <atk-icon name="check-circle" [size]="14" color="var(--color-success-emphasis)" />
            <span>Connected</span>
          </div>
        }
      </div>

      <!-- Current Endpoint Info -->
      @if (currentEndpoint()) {
        <div class="sidebar-section">
          <div class="section-header">
            <atk-icon name="globe" [size]="14" color="var(--color-fg-muted)" />
            <span class="section-title">Endpoint</span>
          </div>
          <div class="section-content">
            <div class="endpoint-name">{{ getEndpointName() }}</div>
            <div class="endpoint-id">{{ currentEndpoint() }}</div>
          </div>
        </div>
      }

      <!-- Data Summary -->
      @if (summary(); as summaryData) {
        <div class="sidebar-section">
          <div class="section-header">
            <atk-icon name="bar-chart" [size]="14" color="var(--color-fg-muted)" />
            <span class="section-title">Data Summary</span>
          </div>
          <div class="section-content">
            <div class="data-metric">
              <span class="metric-label">Sidebar Fields:</span>
              <span class="metric-value">{{ summaryData.sidebarFields }}</span>
            </div>
            <div class="data-metric">
              <span class="metric-label">Table Rows:</span>
              <span class="metric-value">{{ summaryData.tableRows }}</span>
            </div>
            @if (summaryData.lastUpdate) {
              <div class="data-metric">
                <span class="metric-label">Last Update:</span>
                <span class="metric-value timestamp">{{ formatTimestamp(summaryData.lastUpdate) }}</span>
              </div>
            }
          </div>
        </div>
      }

      <!-- Sidebar Fields Data -->
      @if (displayFields().length > 0) {
        <div class="sidebar-section">
          <div class="section-header">
            <atk-icon name="list" [size]="14" color="var(--color-fg-muted)" />
            <span class="section-title">Account Info</span>
          </div>
          <div class="section-content">
            @for (fieldDisplay of displayFields(); track fieldDisplay.field.key) {
              @if (fieldDisplay.visible) {
                <div class="field-row" [ngClass]="'field-' + fieldDisplay.field.type">
                  <div class="field-label">
                    @if (fieldDisplay.field.icon) {
                      <atk-icon [name]="fieldDisplay.field.icon" [size]="12" color="var(--color-fg-muted)" />
                    }
                    <span>{{ fieldDisplay.field.label }}:</span>
                  </div>
                  <div class="field-value" [ngClass]="fieldDisplay.field.cssClass">
                    @switch (fieldDisplay.field.type) {
                      @case ('boolean') {
                        <span class="boolean-badge" [ngClass]="fieldDisplay.value ? 'true' : 'false'">
                          <atk-icon [name]="fieldDisplay.value ? 'check' : 'x'" [size]="10" />
                          {{ fieldDisplay.value ? 'Yes' : 'No' }}
                        </span>
                      }
                      @case ('status') {
                        <span class="status-badge" [ngClass]="'status-' + (fieldDisplay.value || '').toLowerCase()">
                          {{ fieldDisplay.formattedValue }}
                        </span>
                      }
                      @case ('date') {
                        <span class="date-value">{{ fieldDisplay.formattedValue }}</span>
                      }
                      @default {
                        <span class="text-value">{{ fieldDisplay.formattedValue }}</span>
                      }
                    }
                  </div>
                </div>
              }
            }
          </div>
        </div>
      }

      <!-- Debug Info (Development Only) -->
      @if (showDebugInfo()) {
        <div class="sidebar-section debug-section">
          <div class="section-header">
            <atk-icon name="bug" [size]="14" color="var(--color-warning)" />
            <span class="section-title">Debug Info</span>
          </div>
          <div class="section-content">
            <pre class="debug-data">{{ getDebugInfo() }}</pre>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .sidebar-bash-config {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
      background: var(--color-canvas-subtle);
      border-radius: 6px;
      border: 1px solid var(--color-border-default);
    }

    /* Header */
    .sidebar-header {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .sidebar-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .sidebar-title h3 {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-fg-default);
    }

    .sidebar-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
    }

    .sidebar-status.loading {
      background: var(--color-canvas-default);
      color: var(--color-accent-fg);
    }

    .sidebar-status.error {
      background: rgba(248, 81, 73, 0.1);
      color: var(--color-danger);
    }

    .sidebar-status.success {
      background: rgba(35, 134, 54, 0.1);
      color: var(--color-success-emphasis);
    }

    /* Sections */
    .sidebar-section {
      background: var(--color-canvas-default);
      border-radius: 4px;
      border: 1px solid var(--color-border-muted);
      overflow: hidden;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      background: var(--color-canvas-subtle);
      border-bottom: 1px solid var(--color-border-muted);
    }

    .section-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-fg-default);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .section-content {
      padding: 0.75rem;
    }

    /* Endpoint Info */
    .endpoint-name {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-fg-default);
    }

    .endpoint-id {
      font-size: 0.75rem;
      color: var(--color-fg-muted);
      font-family: var(--fontStack-monospace);
    }

    /* Data Metrics */
    .data-metric {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.25rem 0;
      font-size: 0.75rem;
    }

    .metric-label {
      color: var(--color-fg-muted);
    }

    .metric-value {
      font-weight: 500;
      color: var(--color-fg-default);
    }

    .metric-value.timestamp {
      font-family: var(--fontStack-monospace);
      font-size: 0.6875rem;
    }

    /* Field Rows */
    .field-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--color-border-muted);
    }

    .field-row:last-child {
      border-bottom: none;
    }

    .field-label {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.75rem;
      color: var(--color-fg-muted);
      min-width: 0;
      flex: 1;
    }

    .field-value {
      font-size: 0.75rem;
      font-weight: 500;
      text-align: right;
    }

    /* Boolean badges */
    .boolean-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.125rem 0.5rem;
      border-radius: 12px;
      font-size: 0.6875rem;
      font-weight: 500;
    }

    .boolean-badge.true {
      background: rgba(35, 134, 54, 0.1);
      color: var(--color-success-emphasis);
    }

    .boolean-badge.false {
      background: rgba(248, 81, 73, 0.1);
      color: var(--color-danger);
    }

    /* Status badges */
    .status-badge {
      padding: 0.125rem 0.5rem;
      border-radius: 12px;
      font-size: 0.6875rem;
      font-weight: 500;
      text-transform: uppercase;
    }

    .status-badge.status-spot {
      background: rgba(31, 111, 235, 0.1);
      color: var(--color-accent-fg);
    }

    .status-badge.status-margin {
      background: rgba(255, 140, 0, 0.1);
      color: #ff8c00;
    }

    /* Date values */
    .date-value {
      font-family: var(--fontStack-monospace);
      font-size: 0.6875rem;
      color: var(--color-fg-default);
    }

    /* Text values */
    .text-value {
      color: var(--color-fg-default);
    }

    /* Debug section */
    .debug-section {
      border-color: var(--color-warning);
    }

    .debug-data {
      font-family: var(--fontStack-monospace);
      font-size: 0.6875rem;
      color: var(--color-fg-muted);
      background: var(--color-canvas-subtle);
      padding: 0.5rem;
      border-radius: 4px;
      max-height: 200px;
      overflow-y: auto;
      margin: 0;
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      .field-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.25rem;
      }

      .field-value {
        text-align: left;
      }
    }
  `]
})
export class SidebarBashConfigComponent implements OnInit {

  // =========================================
  // INPUTS
  // =========================================

  configId = input<string>('binance-debug-v2');
  showDebugInfo = input<boolean>(false);

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
        console.log('📡 Sidebar received event:', event.type, event.payload);
      });
  }

  ngOnInit(): void {
    // Set the config ID in the API management service
    this.apiManagementState.setConfigId(this.configId());
  }

  // =========================================
  // PUBLIC METHODS
  // =========================================

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
      console.log('🔧 Sidebar loaded configuration:', config.title);
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
