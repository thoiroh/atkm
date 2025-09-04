import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'atk-ibkr-market-data',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="placeholder-content">
      <h1>IBKR Live Market Data</h1>
      <p>Interactive Brokers market data functionality will be implemented here.</p>
      <div class="feature-list">
        <h3>Planned Features:</h3>
        <ul>
          <li>Real-time quotes and market data</li>
          <li>Level II market depth</li>
          <li>Options chains</li>
          <li>Market scanners</li>
          <li>Historical data analysis</li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .placeholder-content {
      padding: 40px;
      max-width: 800px;
    }

    .feature-list {
      margin-top: 30px;
      background: var(--color-canvas-subtle);
      padding: 20px;
      border-radius: 8px;
      border: 1px solid var(--color-border-default);
    }

    .feature-list h3 {
      margin-top: 0;
      color: var(--color-fg-default);
    }

    .feature-list ul {
      list-style-type: disc;
      padding-left: 20px;
    }

    .feature-list li {
      margin-bottom: 8px;
      color: var(--color-fg-muted);
    }
  `]
})
export class IbkrMarketDataComponent { }
