// src/app/shared/components/atk-datatable/atk-datatable.component.ts
// Standalone component for displaying tabular data with factory-defined columns

import { CommonModule } from '@angular/common';
import { Component, EventEmitter, input, Output } from '@angular/core';
import type { BashData } from '@shared/components/atk-bash/atk-bash.interfaces';
``

export interface IDatatableColumn {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'currency' | 'date' | 'badge' | 'boolean';
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  formatter?: (value: any) => string;
  cssClass?: string;
}

@Component({
  selector: 'atk-datatable',
  standalone: true,
  imports: [CommonModule],
  template: ``,
  styles: [``]
})
export class AtkDatatableComponent {
  // Component inputs using Angular 20 input() signal function
  columns = input<IDatatableColumn[]>([]);
  data = input<BashData[]>([]);
  loading = input<boolean>(false);
  error = input<string | null>(null);
  searchEnabled = input<boolean>(true);
  itemsPerPage = input<number>(50);
  rowClickable = input<boolean>(true);

  @Output() exportRequest = new EventEmitter<BashData[]>();


  /**
   * Format cell value based on column configuration
   */
  formatCellValue(value: any, column: IDatatableColumn): string {
    if (value === null || value === undefined) return '';

    // Use custom formatter if available
    if (column.formatter) {
      return column.formatter(value);
    }

    // Default formatting based on type
    switch (column.type) {
      case 'number':
        return typeof value === 'number' ? value.toLocaleString('fr-FR') : value.toString();
      case 'currency':
        return new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(Number(value));
      case 'date':
        if (value instanceof Date) {
          return value.toLocaleString('fr-FR');
        }
        if (typeof value === 'string' || typeof value === 'number') {
          return new Date(value).toLocaleString('fr-FR');
        }
        return value.toString();
      case 'boolean':
        return value ? 'Oui' : 'Non';
      case 'badge':
        return value.toString().toLowerCase();
      default:
        return value.toString();
    }
  }

  onDataExport(data: BashData[]): void {    // input() renvoie un signal ⇒ on lit la valeur avec this.data()
    this.exportRequest.emit(this.data() ?? []);
  }

}
