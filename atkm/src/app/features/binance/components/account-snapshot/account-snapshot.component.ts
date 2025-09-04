import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'atk-account-snapshot',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="placeholder-content">
      <h1>Binance Account Snapshot</h1>
      <p>Account snapshot functionality will be implemented here.</p>
      <div class="feature-list">
        <h3>Planned Features:</h3>
        <ul>
          <li>Portfolio snapshots at specific times</li>
          <li>Historical balance tracking</li>
          <li>Asset allocation charts</li>
          <li>Performance comparisons</li>
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
export class AccountSnapshotComponent { }
