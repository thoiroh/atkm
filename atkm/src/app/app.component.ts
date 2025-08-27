import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  template: `
    <div class="">

      <main class="">
        <router-outlet></router-outlet>
      </main>

   </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .app-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
      text-align: center;
    }

    .app-header h1 {
      margin: 0;
      font-size: 2.5rem;
    }

    .app-header p {
      margin: 0.5rem 0 0 0;
      opacity: 0.9;
    }

    .app-main {
      flex: 1;
      padding: 2rem;
      background-color: #f8f9fa;
    }

    .status-card {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      max-width: 600px;
      margin: 0 auto;
    }

    .status-card h2 {
      color: #2c3e50;
      margin-top: 0;
    }

    .status-card ul {
      list-style: none;
      padding: 0;
    }

    .status-card li {
      padding: 0.5rem 0;
      border-bottom: 1px solid #eee;
    }

    .status-card li:last-child {
      border-bottom: none;
    }

    .app-footer {
      background-color: #2c3e50;
      color: white;
      text-align: center;
      padding: 1rem;
    }

    .app-footer p {
      margin: 0;
    }
  `]
})
export class AppComponent {
  title = 'atomeek-datamatrix';
}
