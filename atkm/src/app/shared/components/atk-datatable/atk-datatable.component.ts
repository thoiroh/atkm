// src/app/shared/components/atk-datatable/atk-datatable.component.ts
// Standalone component for displaying tabular data with factory-defined columns

import { CommonModule } from '@angular/common';
import { Component, input, output, signal } from '@angular/core';
import type { BashData, IBashColumn } from '@shared/components/atk-bash/atk-bash.interfaces';


@Component({
  selector: 'atk-datatable',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './atk-datatable.component.html',
  styleUrls: ['./atk-datatable.component.css']
})
export class AtkDatatableComponent {

  // ======================================================
  // INPUTS
  // ======================================================

  columns = input<IBashColumn[]>([]);
  data = input<BashData[]>([]);
  loading = input<boolean>(false);
  error = input<string | null>(null);

  // ======================================================
  // OUTPUTS
  // ======================================================

  selectedRow = output<BashData>(); // NEW

  // ======================================================
  // LOCAL STATE
  // ======================================================

  selectedRowId = signal<string | number | null>(null); // NEW

  // ======================================================
  // PUBLIC METHODS
  // ======================================================

  /**
   * Format cell value based on column configuration
   * Migrated from atk-bash.component.ts
   */
  formatCellValue(value: any, column: IBashColumn, row?: BashData): string {
    if (value === null || value === undefined) return '';

    // Use custom formatter if available
    if (column.formatter) {
      return column.formatter(value, row);
    }

    // Default formatting based on type
    switch (column.type) {
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : value.toString();

      case 'currency':
        return new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR'
        }).format(value);

      case 'percentage':
        return `${(value * 100).toFixed(2)}%`;

      case 'date':
        return new Date(value).toLocaleString('fr-FR');

      case 'boolean':
        return value ? '✅' : '❌';

      case 'badge':
        return value.toString();

      default:
        return value.toString();
    }
  }

  /**
   * Track by function for table rows
   */
  trackByIndex(index: number, item: any): any {
    return item.id || item.symbol || index;
  }

  /**
   * Handle row double-click for selection
   */
  onRowDoubleClick(row: BashData): void {
    console.log('🔥🔥🔥 DATATABLE: Double click detected!', row);
    console.log('🔥🔥🔥 DATATABLE: Row data:', JSON.stringify(row, null, 2));

    const rowId = row.id || row.symbol || row.asset;
    console.log('🔥🔥🔥 DATATABLE: Row ID:', rowId);

    // Toggle selection
    if (this.selectedRowId() === rowId) {
      console.log('🔥🔥🔥 DATATABLE: Deselecting row');
      this.selectedRowId.set(null);
    } else {
      console.log('🔥🔥🔥 DATATABLE: Selecting row');
      this.selectedRowId.set(rowId);
      console.log('🔥🔥🔥 DATATABLE: Emitting selectedRow event');
      this.selectedRow.emit(row);
      console.log('🔥🔥🔥 DATATABLE: Event emitted!');
    }

    console.log('🔥🔥🔥 DATATABLE: Current selectedRowId:', this.selectedRowId());
  }

  /**
   * Check if row is selected
   */
  isRowSelected(row: BashData): boolean {
    const rowId = row.id || row.symbol || row.asset;
    return this.selectedRowId() === rowId;
  }
}
