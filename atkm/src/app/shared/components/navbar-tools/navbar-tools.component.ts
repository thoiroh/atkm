import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'atk-navbar-tools',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="user-tools">
      <div class="search-container">
        <div class="search-wrapper">
          <svg class="search-icon" aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" fill="currentColor">
            <path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z"></path>
          </svg>
          <input type="text" 
                 class="search-input" 
                 placeholder="Type / to search"
                 (keydown)="handleSearchShortcut($event)" />
        </div>
      </div>

      <div class="user-actions">
        <button class="action-btn" 
                aria-label="Créer quelque chose de nouveau"
                (click)="handleAction('create')">
          <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" fill="currentColor">
            <path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z"></path>
          </svg>
        </button>

        <button class="action-btn" 
                aria-label="Vos issues"
                (click)="handleAction('issues')">
          <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" fill="currentColor">
            <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path>
            <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"></path>
          </svg>
        </button>

        <button class="action-btn" 
                aria-label="Vos pull requests"
                (click)="handleAction('pulls')">
          <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" fill="currentColor">
            <path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z"></path>
          </svg>
        </button>

        <button class="action-btn" 
                aria-label="Notifications"
                (click)="handleAction('notifications')">
          <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" fill="currentColor">
            <path d="M2.8 2.06A1.75 1.75 0 0 1 4.41 1h7.18c.7 0 1.333.417 1.61 1.06l2.74 6.395c.04.093.06.194.06.295v4.5A1.75 1.75 0 0 1 14.25 15H1.75A1.75 1.75 0 0 1 0 13.25v-4.5c0-.101.02-.202.06-.295Zm1.61.44a.25.25 0 0 0-.23.152L1.887 8H4.75a.75.75 0 0 1 .6.3L6.625 10h2.75l1.275-1.7a.75.75 0 0 1 .6-.3h2.863L11.82 2.652a.25.25 0 0 0-.23-.152Zm10.09 7h-2.875l-1.275 1.7a.75.75 0 0 1-.6.3h-3.5a.75.75 0 0 1-.6-.3L4.375 9.5H1.5v3.75c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25Z"></path>
          </svg>
        </button>

        <button class="action-btn user-avatar" 
                aria-label="Menu utilisateur"
                (click)="handleAction('profile')">
          <img src="https://avatars.githubusercontent.com/u/32144309?v=4" 
               alt="@ThomBarth" 
               class="avatar" 
               width="24" 
               height="24" />
        </button>
      </div>
    </div>
  `,
  styles: [`
    /* Styles spécifiques si nécessaire */
  `]
})
export class NavbarToolsComponent {
  handleSearchShortcut(event: KeyboardEvent): void {
    if (event.key === '/' && event.ctrlKey) {
      event.preventDefault();
      // Focus sur la recherche
    }
  }

  handleAction(action: string): void {
    console.log('Action:', action);
    // Implémenter les actions plus tard
  }
}