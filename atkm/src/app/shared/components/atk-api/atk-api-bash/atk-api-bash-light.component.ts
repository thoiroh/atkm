/**
 * ATK API Bash Component - LIGHT VERSION
 * Simplified bash terminal for API debugging
 *
 * Features:
 * - Read-only terminal with config info display
 * - Datatable for displaying API results
 * - Status bar with connection, endpoint, and performance info
 *
 * @file atk-api-bash.component.ts
 * @version 2.0.0 (Light)
 * @architecture Dumb component - reads from state service
 */

import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';

import { AtkApiDatatableComponent } from '@shared/components/atk-api/atk-api-datatable/atk-api-datatable.component';
import { AtkApiStateService } from '@shared/components/atk-api/atk-api-state.service';
import { AtkIconComponent } from '@shared/components/atk-icon/atk-icon.component';

@Component({
  selector: 'atk-api-bash',
  standalone: true,
  imports: [
    CommonModule,
    AtkIconComponent,
    AtkApiDatatableComponent
  ],
  templateUrl: './atk-api-bash.component.html',
  styleUrls: ['./atk-api-bash.component.css']
})
export class AtkApiBashComponent {

  // ======================================================
  // DEPENDENCIES
  // ======================================================

  private readonly stateService = inject(AtkApiStateService);

  // ======================================================
  // PUBLIC READONLY SIGNALS (for template)
  // ======================================================

  /** Full state from service */
  readonly state = this.stateService.state;

  /** Current configuration */
  readonly config = this.stateService.config;

  /** Current endpoint configuration */
  readonly currentEndpointConfig = this.stateService.currentEndpointConfig;

  /** Visible columns for datatable */
  readonly visibleColumns = this.stateService.visibleColumns;

  // ======================================================
  // COMPUTED SIGNALS
  // ======================================================

  /**
   * Terminal display text with configuration info
   * Shows: title, subtitle, current endpoint, parameters
   */
  readonly terminalText = computed(() => {
    const cfg = this.config();
    const state = this.state();
    const endpoint = this.currentEndpointConfig();

    if (!cfg) return 'Waiting for configuration...';

    let output = '';

    // Header
    output += `╔═══════════════════════════════════════════════════════════════╗\n`;
    output += `║  ${cfg.title.padEnd(59)}║\n`;
    output += `║  ${cfg.subtitle.padEnd(59)}║\n`;
    output += `╠═══════════════════════════════════════════════════════════════╣\n`;

    // Domain & Config ID
    output += `║  Domain: ${cfg.domain.toUpperCase().padEnd(52)}║\n`;
    output += `║  Config ID: ${cfg.id.padEnd(49)}║\n`;
    output += `╠═══════════════════════════════════════════════════════════════╣\n`;

    // Current Endpoint
    if (endpoint) {
      output += `║  Current Endpoint: ${endpoint.name.padEnd(42)}║\n`;
      output += `║  Method: ${endpoint.method.padEnd(52)}║\n`;
      output += `║  URL: ${endpoint.url.padEnd(56)}║\n`;

      // Parameters
      if (Object.keys(state.parameters).length > 0) {
        output += `╠═══════════════════════════════════════════════════════════════╣\n`;
        output += `║  Parameters:${' '.repeat(49)}║\n`;

        Object.entries(state.parameters).forEach(([key, value]) => {
          const paramLine = `    ${key}: ${value}`;
          output += `║  ${paramLine.padEnd(59)}║\n`;
        });
      }
    }

    output += `╚═══════════════════════════════════════════════════════════════╝\n`;

    // Connection Status
    const statusEmoji = state.connectionStatus === 'connected' ? '●' : '○';
    const statusText = state.connectionStatus.toUpperCase();
    output += `\n${statusEmoji} Connection Status: ${statusText}\n`;

    // Last Response Info
    if (state.responseMetadata) {
      const meta = state.responseMetadata;
      output += `\n`;
      output += `Response Time: ${meta.responseTime}ms\n`;
      output += `Data Count: ${meta.dataCount} items\n`;
      output += `Status Code: ${meta.statusCode}\n`;
      if (meta.fromCache) {
        output += `Source: Cache ⚡\n`;
      }
    }

    // Loading indicator
    if (state.loading) {
      output += `\n⏳ Loading data...\n`;
    }

    // Error display
    if (state.error) {
      output += `\n❌ ERROR: ${state.error}\n`;
    }

    output += `\nTerminal Ready.\n`;

    return output;
  });

  /**
   * Status bar text with key metrics
   */
  readonly statusBarText = computed(() => {
    const state = this.state();
    const endpoint = this.currentEndpointConfig();

    const parts: string[] = [];

    // Connection status
    const statusEmoji = state.connectionStatus === 'connected' ? '●' : '○';
    parts.push(`${statusEmoji} ${state.connectionStatus}`);

    // Current endpoint
    if (endpoint) {
      parts.push(`Endpoint: ${endpoint.id}`);
    }

    // Data count
    parts.push(`${state.tableData.length} items`);

    // Response time
    if (state.responseMetadata) {
      parts.push(`${state.responseMetadata.responseTime}ms`);

      if (state.responseMetadata.fromCache) {
        parts.push('⚡ cached');
      }
    }

    return parts.join(' | ');
  });

  /**
   * Get current endpoint name for section header
   */
  readonly endpointName = computed(() => {
    const endpoint = this.currentEndpointConfig();
    return endpoint?.name || 'Data Results';
  });

  // ======================================================
  // PUBLIC METHODS - UI ACTIONS
  // ======================================================

  /**
   * Handle row selection from datatable
   * Updates state service with selected row
   */
  onRowSelected(rowData: any): void {
    this.stateService.selectRow(rowData);
  }
}
