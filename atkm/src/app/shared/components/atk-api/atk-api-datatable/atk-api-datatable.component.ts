/**
 * ATK API Datatable Component
 * Pure presentation component for displaying tabular data
 *
 * Responsibilities:
 * - Display data in table format with configured columns
 * - Handle row selection
 * - Format cell values based on column configuration
 * - Emit selection events to parent
 *
 * @file atk-api-datatable.component.ts
 * @version 2.0.0
 * @architecture Dumb component - no business logic
 */

import { CommonModule } from '@angular/common';
import { Component, input, output, signal } from '@angular/core';

import type {
  BashData,
  IAtkApiColumn
} from '@shared/components/atk-api/atk-api.interfaces';

@Component({
  selector: 'atk-api-datatable',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './atk-api-datatable.component.html',
  styleUrls: ['./atk-api-datatable.component.css']
})
export class AtkApiDatatableComponent {

  // ======================================================
  // INPUTS
  // ======================================================

  /** Column definitions for table headers and cells */
  columns = input<IAtkApiColumn[]>([]);

  /** Data rows to display */
  data = input<BashData[]>([]);

  /** Loading indicator (optional - not used currently) */
  loading = input<boolean>(false);

  /** Error message (optional - not used currently) */
  error = input<string | null>(null);

  // ======================================================
  // OUTPUTS
  // ======================================================

  /** Emitted when a row is selected (double-click) */
  selectedRow = output<BashData>();

  // ======================================================
  // LOCAL STATE
  // ======================================================

  /** Currently selected row ID for UI highlighting */
  selectedRowId = signal<string | number | null>(null);

  // ======================================================
  // PUBLIC METHODS
  // ======================================================

  /**
   * Format cell value based on column configuration
   *
   * Priority:
   * 1. Use custom formatter if provided
   * 2. Use default formatting based on column type
   * 3. Fallback to toString()
   *
   * @param value - Cell value to format
   * @param column - Column configuration
   * @param row - Complete row data (for context-aware formatting)
   * @returns Formatted string value
   */
  formatCellValue(value: any, column: IAtkApiColumn, row?: BashData): string {
    if (value === null || value === undefined) return '';

    // Priority 1: Custom formatter
    if (column.formatter) {
      return column.formatter(value, row);
    }

    // Priority 2: Default formatting based on type
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
      case 'status':
        return value.toString();

      // Crypto and price types should have formatters from factory
      case 'crypto':
      case 'price':
      case 'quantity':
      case 'fee':
        // Fallback if formatter not provided (shouldn't happen with factory)
        return typeof value === 'number'
          ? value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 8 })
          : value.toString();

      default:
        return value.toString();
    }
  }

  /**
   * Track by function for Angular *ngFor optimization
   * Uses id, symbol, or asset as unique identifier, falls back to index
   *
   * @param index - Row index
   * @param item - Row data
   * @returns Unique identifier for tracking
   */
  trackByIndex(index: number, item: any): any {
    return item.id || item.symbol || item.asset || index;
  }

  /**
   * Handle row double-click for selection
   * Toggles selection if same row clicked twice
   *
   * @param row - Row data that was clicked
   */
  onRowDoubleClick(row: BashData): void {
    const rowId = row.id || row.symbol || row.asset;

    // Toggle selection - if already selected, deselect
    if (this.selectedRowId() === rowId) {
      this.selectedRowId.set(null);
      // Don't emit event when deselecting
    } else {
      // Select new row
      this.selectedRowId.set(rowId);
      this.selectedRow.emit(row);
    }
  }

  /**
   * Check if a row is currently selected
   * Used for applying CSS class
   *
   * @param row - Row to check
   * @returns True if row is selected
   */
  isRowSelected(row: BashData): boolean {
    const rowId = row.id || row.symbol || row.asset;
    return this.selectedRowId() === rowId;
  }

  /**
   * Clear row selection programmatically
   * Can be called from parent component if needed
   */
  clearSelection(): void {
    this.selectedRowId.set(null);
  }
}
