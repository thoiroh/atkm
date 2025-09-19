// sidebar-bash-config.component.ts
// Sidebar configuration component for bash terminal controls

import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, effect, inject, input, OnInit, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

// Services
import { AtkBashConfigFactory } from '@shared/components/atk-bash/atk-bash-config.factory';
import { IBashConfig } from '@shared/components/atk-bash/atk-bash.interfaces';
import { SidebarBashConfigService } from './sidebar-bash-config.service';

// UI Components
import { AtkIconComponent } from '@shared/components/atk-icon/atk-icon.component';
import { HoverDotDirective } from '@shared/directives/hover-dot.directive';

// import { IconPipe } from '@shared/pipes/icon.pipe';

@Component({
  selector: 'atk-sidebar-bash-config',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AtkIconComponent,
    HoverDotDirective
  ],
  templateUrl: './sidebar-bash-config.component.html',
  styleUrls: ['./sidebar-bash-config.component.css']
})
export class SidebarBashConfigComponent implements OnInit {

  // Component inputs
  configId = input<string>('binance-debug-v2');
  isCollapsed = input<boolean>(true);

  // Component outputs
  togglePanel = output<void>();
  endpointChanged = output<string>();
  parameterChanged = output<Record<string, any>>();

  // Services
  private bashConfigFactory = inject(AtkBashConfigFactory);
  private bashConfigService = inject(SidebarBashConfigService);
  private destroyRef = inject(DestroyRef);

  // State signals
  currentConfig = signal<IBashConfig | null>(null);
  symbolInput = signal<string>('BTCUSDT');

  // Computed properties from service
  configState = computed(() => this.bashConfigService.state());
  currentEndpoint = computed(() => this.configState().currentEndpoint);
  parameters = computed(() => this.configState().parameters);
  loading = computed(() => this.configState().loading);
  connectionStatus = computed(() => this.configState().connectionStatus);

  // Available endpoints computed
  availableEndpoints = computed(() => {
    const config = this.currentConfig();
    return config?.endpoints || [];
  });

  // Current endpoint details
  currentEndpointConfig = computed(() => {
    const config = this.currentConfig();
    const endpointId = this.currentEndpoint();
    return config?.endpoints.find(ep => ep.id === endpointId);
  });

  // Show symbol input for trades/orders
  showSymbolInput = computed(() => {
    const endpoint = this.currentEndpoint();
    return endpoint === 'trades' || endpoint === 'orders';
  });

  constructor() {
    // Load configuration on init
    effect(() => {
      const configIdValue = this.configId();
      if (configIdValue === 'binance-debug-v2') {
        const config = this.bashConfigFactory.createBinanceDebugConfig();
        this.currentConfig.set(config);
        console.log('📋 Bash config loaded:', config.title);
      }
    }, { allowSignalWrites: true });

    // Subscribe to service events
    this.bashConfigService.events$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(events => {
        const latestEvents = events.slice(-5); // Process last 5 events
        latestEvents.forEach(event => {
          console.log(`🔄 Service event: ${event.type}`, event.payload);
        });
      });
  }

  ngOnInit(): void {
    console.log('🚀 SidebarBashConfig initialized');
  }

  /**
   * Handle panel toggle
   */
  onToggle(): void {
    this.togglePanel.emit();
    console.log('🔄 Panel toggle requested');
  }

  /**
   * Handle endpoint selection change
   */
  onEndpointChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target?.value) {
      const endpointId = target.value;
      this.bashConfigService.updateEndpoint(endpointId);
      this.endpointChanged.emit(endpointId);
      console.log(`📡 Endpoint changed: ${endpointId}`);
    }
  }

  /**
   * Handle symbol input for trades/orders
   */
  onSymbolChange(symbol: string): void {
    const trimmedSymbol = symbol.trim().toUpperCase();
    if (trimmedSymbol) {
      this.symbolInput.set(trimmedSymbol);
      this.bashConfigService.updateParameters({ symbol: trimmedSymbol });
      this.parameterChanged.emit({ symbol: trimmedSymbol });
      console.log(`💰 Symbol updated: ${trimmedSymbol}`);
    }
  }

  /**
   * Handle symbol input on Enter key
   */
  onSymbolKeyup(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      const target = event.target as HTMLInputElement;
      this.onSymbolChange(target.value);
    }
  }

  /**
   * Trigger data loading
   */
  onLoadData(): void {
    const params = this.showSymbolInput() ? { symbol: this.symbolInput() } : {};
    this.bashConfigService.triggerDataLoad(params);
    console.log('🔄 Load data triggered');
  }

  /**
   * Load data with specific symbol
   */
  onLoadWithSymbol(): void {
    const symbol = this.symbolInput();
    if (symbol) {
      this.bashConfigService.triggerDataLoad({ symbol: symbol.toUpperCase() });
      console.log(`💰 Load data with symbol: ${symbol}`);
    }
  }

  /**
   * Test HTTP connection
   */
  onTestConnection(): void {
    this.bashConfigService.triggerConnectionTest();
    console.log('🌐 Connection test triggered');
  }

  /**
   * Test direct HTTP call
   */
  onTestDirectHttp(): void {
    this.bashConfigService.triggerAction('test-direct-http', {
      endpoint: this.currentEndpoint()
    });
    console.log('🔧 Direct HTTP test triggered');
  }

  /**
   * Test service call
   */
  onTestServiceCall(): void {
    this.bashConfigService.triggerAction('test-service-call', {
      endpoint: this.currentEndpoint()
    });
    console.log('⚙️ Service call test triggered');
  }

  /**
   * Clear cache
   */
  onClearCache(): void {
    this.bashConfigService.triggerAction('clear-cache');
    console.log('🗑️ Cache clear triggered');
  }

  /**
   * Export data
   */
  onExportData(): void {
    this.bashConfigService.triggerAction('export-data');
    console.log('📤 Export data triggered');
  }

  /**
   * Get connection status icon
   */
  getConnectionStatusIcon(): string {
    switch (this.connectionStatus()) {
      case 'connected': return 'check-circle';
      case 'connecting': return 'loader';
      case 'disconnected': return 'x-circle';
      default: return 'help-circle';
    }
  }

  /**
   * Get connection status color
   */
  getConnectionStatusColor(): string {
    switch (this.connectionStatus()) {
      case 'connected': return '#10b981';
      case 'connecting': return '#f59e0b';
      case 'disconnected': return '#ef4444';
      default: return '#6b7280';
    }
  }

  /**
   * Track by function for endpoints
   */
  trackByEndpointId(index: number, endpoint: any): string {
    return endpoint.id;
  }
}
