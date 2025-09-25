// src/app/features/binance/components/binance-api-management.component.ts
// Updated wrapper component that uses the refactored AtkApiManagementComponent

import { Component, inject, OnInit } from '@angular/core';
import { AtkApiManagementComponent } from '@shared/components/atk-api-management/atk-api-management.component';
import { BashData } from '@shared/components/atk-bash/atk-bash.interfaces';
import { ApiManagementStateService } from '@shared/services/atk-api-management-state.service';

@Component({
  selector: 'atk-binance-api-management',
  standalone: true,
  imports: [AtkApiManagementComponent],
  templateUrl: './binance-api-management.component.html',
  styleUrls: ['./binance-api-management.component.css'],
})
export class BinanceApiManagementComponent implements OnInit {

  // Services
  public stateService = inject(ApiManagementStateService);

  ngOnInit(): void {
    // Subscribe to state changes for component-level handling if needed
    this.stateService.events$.subscribe(event => {
      this.handleStateEvent(event);
    });

    // Log component initialization
    console.log('🚀 BinanceApiManagementComponent initialized');
  }

  /**
   * Handle data row selection from datatable
   * This is where you could navigate to detailed views (atk-datacard)
   */
  onDataRowSelected(row: BashData): void {
    console.log('🎯 Row selected for detailed view:', row);

    // Example: Navigate to coin detail if asset is selected
    if (row.asset) {
      console.log(`Navigate to coin detail for: ${row.asset}`);
      // router.navigate(['/coins', row.asset]);
    }

    // Example: Navigate to trade detail if trade is selected
    if (row.id && row.symbol) {
      console.log(`Navigate to trade detail: ${row.id}`);
      // router.navigate(['/trades', row.id]);
    }
  }

  /**
   * Handle endpoint changes
   */
  onEndpointChanged(endpointId: string): void {
    console.log('🔄 Endpoint changed to:', endpointId);

    // Example: Update page title or breadcrumbs
    // titleService.setTitle(`Binance API - ${endpointId}`);

    // Example: Track analytics
    // analytics.track('endpoint_changed', { endpoint: endpointId });
  }

  /**
   * Handle errors from the API management component
   */
  onErrorOccurred(error: string): void {
    console.error('⚠️ API Management error:', error);

    // Example: Show toast notification
    // notificationService.showError(error);

    // Example: Track error for debugging
    // errorService.logError('BinanceApiManagement', error);
  }

  /**
   * Handle state service events at component level
   */
  private handleStateEvent(event: any): void {
    switch (event.type) {
      case 'data-loaded':
        console.log('📊 Data loaded:', event.payload.count, 'records');
        break;

      case 'endpoint-change':
        console.log('🔗 Endpoint changed:', event.payload.endpointId);
        break;

      case 'error-occurred':
        console.log('❌ Error occurred:', event.payload.error);
        break;

      case 'action-execute':
        console.log('⚡ Action executed:', event.payload.actionId);
        break;
    }
  }

  /**
   * Trigger manual refresh of current data
   */
  refreshCurrentData(): void {
    this.stateService.executeAction('refresh-data');
  }

  /**
   * Export current configuration and state
   */
  exportState(): void {
    const state = this.stateService.getCompleteState();
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `binance-api-state-${Date.now()}.json`;
    a.click();

    URL.revokeObjectURL(url);
  }

  /**
   * Reset to default configuration
   */
  resetToDefaults(): void {
    this.stateService.resetState();
  }
}
