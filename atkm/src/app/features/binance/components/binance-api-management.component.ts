// src/app/features/binance/components/binance-unified.component.ts
// Example usage of the AtkApiManagementComponent

import { Component } from '@angular/core';
import { AtkApiManagementComponent } from '@shared/components/atk-api-management/atk-api-management.component';
import { BashData } from '@shared/components/atk-bash/atk-bash.interfaces';

@Component({
  selector: 'atk-binance-unified',
  standalone: true,
  imports: [AtkApiManagementComponent],
  templateUrl: './binance-api-management.component.html',
  styleUrls: ['./binance-api-management.component.css'],
})
export class BinanceUnifiedComponent {

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
  }

  /**
   * Handle errors from the API management component
   */
  onErrorOccurred(error: string): void {
    console.error('❌ API Management error:', error);

    // Example: Show toast notification
    // notificationService.showError(error);
  }
}
