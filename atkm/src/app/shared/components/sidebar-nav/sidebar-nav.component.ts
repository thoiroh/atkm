import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ISidebarNavConfig } from '../../../core/services/config.service';

@Component({
  selector: 'atk-sidebar-nav',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside class="sidebar-nav" aria-label="Navigation">
      <div class="user-context" *ngIf="config?.userContext">
        <img [src]="config.userContext?.avatar || ''"
             [alt]="'@' + (config.userContext?.username || '')"
             class="avatar"
             width="20"
             height="20" />
        <button class="user-context-button">
          <span>{{config.userContext?.username || ''}}</span>
          <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" fill="currentColor">
            <path d="m4.427 7.427 3.396 3.396a.25.25 0 0 0 .354 0l3.396-3.396A.25.25 0 0 0 11.396 7H4.604a.25.25 0 0 0-.177.427Z"></path>
          </svg>
        </button>
      </div>

      <div class="sidebar-section" *ngFor="let section of config?.sections || []">
        <h3>
          {{section?.title || ''}}
          <button class="btn-action"
                  *ngIf="section?.action"
                  (click)="handleAction(section.action.action)">
            {{section.action?.label}}
          </button>
        </h3>

        <ul class="repo-list" *ngIf="section?.items && section.items.length > 0">
          <li *ngFor="let item of section.items">
            <a [href]="item?.link || '#'" (click)="navigateToRepo($event, item?.link || '#')">
              <svg class="repo-icon" aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16">
                <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"></path>
              </svg>
              {{item?.label || ''}}
            </a>
          </li>
        </ul>

        <p class="recent-activity" *ngIf="!section?.items || section.items.length === 0">
          When you take actions across GitHub, we'll provide links to that activity here.
        </p>
      </div>

      <a href="#" class="show-more-link">Show more</a>
    </aside>
  `,
  styles: [``]
})
export class SidebarNavComponent {
  @Input() config: ISidebarNavConfig | null = null;

  handleAction(action: string): void {
    console.log('Action:', action);
    // Implémenter l'action
  }

  navigateToRepo(event: Event, link: string): void {
    event.preventDefault();
    console.log('Navigate to:', link);
    // Implémenter la navigation
  }
}
