// src/app/shared/components/atk-datatable/atk-datatable.component.ts
// Standalone component for displaying tabular data with factory-defined columns

import { CommonModule } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import { AtkIconComponent } from '@shared/components/atk-icon/atk-icon.component';
import {
  BalanceFormatPipe,
  CryptoPrecisionPipe,
  StatusBadgePipe,
  TimestampToDatePipe
} from '@shared/pipes/pipes';
import { BashData, IBashColumn, IBashEndpointConfig } from '../atk-bash/atk-bash.interfaces';

@Component({
  selector: 'atk-datatable',
  standalone: true,
  imports: [
    CommonModule,
    AtkIconComponent,
    BalanceFormatPipe,
    CryptoPrecisionPipe,
    StatusBadgePipe,
    TimestampToDatePipe
  ],
  templateUrl: './atk-datatable.component.html',
  styleUrls: ['./atk-datatable.component.css']
})
export class AtkDatatableComponent {

  // Component inputs
  data = input<BashData[]>([]);
  currentEndpoint = input<IBashEndpointConfig | null>(null);
  loading = input<boolean>(false);
  error = input<string | null>(null);
  searchEnabled = input<boolean>(true);
  itemsPerPage = input<number>(50);
  rowClickable = input<boolean>(true);

  // Component outputs
  rowClick = output<BashData>();
  retryLoad = output<void>();
  exportRequest = output<BashData[]>();

  // Internal state
  searchQuery = signal<string>('');
  sortColumn = signal<string | null>(null);
  sortDirection = signal<'asc' | 'desc'>('asc');
  currentPage = signal<number>(0);

  // Computed properties
  visibleColumns = computed(() => {
    const endpoint = this.currentEndpoint();
    if (!endpoint) return [];

    return endpoint.columns.filter(col => col.visible !== false);
  });

  filteredData = computed(() => {
    const data = this.data();
    const query = this.searchQuery().toLowerCase().trim();

    if (!query) return data;

    return data.filter(row => {
      return this.visibleColumns().some(column => {
        const value = this.getCellValue(row, column);
        return value?.toString().toLowerCase().includes(query);
      });
    });
  });

  sortedData = computed(() => {
    const data = this.filteredData();
    const column = this.sortColumn();
    const direction = this.sortDirection();

    if (!column) return data;

    return [...data].sort((a, b) => {
      const aValue = a[column];
      const bValue = b[column];

      // Handle different data types
      let comparison = 0;
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        comparison = String(aValue || '').localeCompare(String(bValue || ''));
      }

      return direction === 'asc' ? comparison : -comparison;
    });
  });

  paginatedData = computed(() => {
    const data = this.sortedData();
    const itemsPerPage = this.itemsPerPage();
    const currentPage = this.currentPage();

    const start = currentPage * itemsPerPage;
    const end = start + itemsPerPage;

    return data.slice(start, end);
  });

  totalPages = computed(() => {
    const total = this.filteredData().length;
    const itemsPerPage = this.itemsPerPage();
    return Math.ceil(total / itemsPerPage);
  });

  showPagination = computed(() => {
    return this.filteredData().length > this.itemsPerPage();
  });

  paginationStart = computed(() => {
    return this.currentPage() * this.itemsPerPage() + 1;
  });

  paginationEnd = computed(() => {
    const start = this.paginationStart();
    const remaining = this.filteredData().length - (start - 1);
    return Math.min(start + this.itemsPerPage() - 1, start + remaining - 1);
  });

  /**
   * Handle search input changes
   */
  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(0); // Reset to first page
  }

  /**
   * Clear search query
   */
  clearSearch(): void {
    this.searchQuery.set('');
  }

  /**
   * Toggle column sorting
   */
  toggleSort(columnKey: string): void {
    if (this.sortColumn() === columnKey) {
      // Toggle direction for same column
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column with ascending direction
      this.sortColumn.set(columnKey);
      this.sortDirection.set('asc');
    }
    this.currentPage.set(0); // Reset to first page
  }

  /**
   * Navigate to specific page
   */
  goToPage(page: number): void {
    const totalPages = this.totalPages();
    if (page >= 0 && page < totalPages) {
      this.currentPage.set(page);
    }
  }

  /**
   * Handle row click events
   */
  onRowClick(row: BashData): void {
    if (this.rowClickable()) {
      this.rowClick.emit(row);
    }
  }

  /**
   * Export data to CSV
   */
  exportData(): void {
    const dataToExport = this.filteredData();
    this.exportRequest.emit(dataToExport);

    // Also create and download CSV file
    this.downloadCSV(dataToExport);
  }

  /**
   * Get cell value for a specific column
   */
  getCellValue(row: BashData, column: IBashColumn): any {
    return row[column.key];
  }

  /**
   * Format cell value according to column configuration
   */
  formatCellValue(row: BashData, column: IBashColumn): string {
    const value = this.getCellValue(row, column);

    if (value === null || value === undefined) {
      return '';
    }

    // Use custom formatter if available
    if (column.formatter) {
      return column.formatter(value, row);
    }

    // Apply default formatting based on column type
    switch (column.type) {
      case 'currency':
        return new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR'
        }).format(value);

      case 'percentage':
        return new Intl.NumberFormat('fr-FR', {
          style: 'percent',
          minimumFractionDigits: 2
        }).format(value / 100);

      case 'date':
        if (value instanceof Date) {
          return value.toLocaleDateString('fr-FR');
        } else if (typeof value === 'number') {
          return new Date(value).toLocaleDateString('fr-FR');
        }
        return value.toString();

      case 'boolean':
        return value ? 'Yes' : 'No';

      case 'number':
        return new Intl.NumberFormat('fr-FR').format(value);

      default:
        return value.toString();
    }
  }

  /**
   * Track by function for performance optimization
   */
  trackByFn(index: number, item: BashData): any {
    return item.id || item.asset || index;
  }

  /**
   * Download data as CSV file
   */
  private downloadCSV(data: BashData[]): void {
    if (data.length === 0) return;

    const columns = this.visibleColumns();
    const headers = columns.map(col => col.label);

    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        columns.map(col => {
          const value = this.getCellValue(row, col);
          const formattedValue = this.formatCellValue(row, col);
          // Escape commas and quotes in CSV
          return `"${String(formattedValue || '').replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `data-export-${Date.now()}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
