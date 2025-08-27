import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IConfigPanelSection } from '../../../core/services/config.service';

@Component({
  selector: 'atk-sidebar-config',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside class="config-panel" aria-label="Configuration">
      <div class="config-section" *ngFor="let section of sections">
        <h3>
          <span *ngIf="section.icon">↪</span>
          {{section.title}}
        </h3>

        <div class="config-item" *ngFor="let item of section.items">
          <svg class="config-item-icon" 
               aria-hidden="true" 
               height="16" 
               viewBox="0 0 16 16" 
               version="1.1" 
               width="16">
            <ng-container [ngSwitch]="item.icon">
              <path *ngSwitchCase="'display'"
                    d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.016 1.299l.497 1.138 1.017.215c.653.138 1.153.675 1.245 1.33l.089.649.906.664c.536.389.839 1.034.723 1.687l-.165.93.818.752c.399.365.415.998.04 1.382l-.577.597.213.838c.134.659-.295 1.279-.1007 1.338l-.496.059-.815.644c-.553.43-1.275.43-1.829 0l-.815-.644-.496-.059c-.754-.059-1.339-.679-1.007-1.338l.213-.838-.577-.597c-.375-.384-.359-1.017.04-1.382l.818-.752-.165-.93c-.116-.653.187-1.298.723-1.687l.906-.664.089-.649c.092-.655.592-1.192 1.245-1.33l1.017-.215.497-1.138C6.01.645 6.556.095 7.299.031A8.2 8.2 0 0 1 8 0ZM5.78 8.75a9.64 9.64 0 0 0 1.363 4.177c.255.426.542.832.857 1.215.245-.296.551-.705.857-1.215A9.64 9.64 0 0 0 10.22 8.75Zm4.44-1.5a9.64 9.64 0 0 0-1.363-4.177c-.307-.51-.612-.919-.857-1.215a9.927 9.927 0 0 0-.857 1.215A9.64 9.64 0 0 0 5.78 7.25Z"></path>
              <path *ngSwitchCase="'user'"
                    d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16ZM5.78 8.75a9.64 9.64 0 0 0 1.363 4.177c.255.426.542.832.857 1.215.245-.296.551-.705.857-1.215A9.64 9.64 0 0 0 10.22 8.75h-4.44ZM5.78 7.25h4.44a9.64 9.64 0 0 0-1.363-4.177c-.307-.51-.612-.919-.857-1.215a9.927 9.927 0 0 0-.857 1.215A9.64 9.64 0 0 0 5.78 7.25Z"></path>
              <path *ngSwitchCase="'keyboard'"
                    d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Z"></path>
              <path *ngSwitchCase="'layout'"
                    d="M1.75 0h12.5C15.216 0 16 .784 16 1.75v12.5A1.75 1.75 0 0 1 14.25 16H1.75A1.75 1.75 0 0 1 0 14.25V1.75C0 .784.784 0 1.75 0ZM1.5 1.75v12.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25H1.75a.25.25 0 0 0-.25.25ZM11.75 3a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-1.5 0v-7.5a.75.75 0 0 1 .75-.75Zm-8.25.75a.75.75 0 0 1 1.5 0v5.5a.75.75 0 0 1-1.5 0ZM8 3a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 3Z"></path>
              <path *ngSwitchCase="'download'"
                    d="M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14ZM7.25 7.689V2a.75.75 0 0 1 1.5 0v5.689l1.97-1.969a.749.749 0 1 1 1.06 1.06l-3.25 3.25a.749.749 0 0 1-1.06 0L4.22 6.78a.749.749 0 1 1 1.06-1.06l1.97 1.969Z"></path>
              <path *ngSwitchCase="'upload'"
                    d="M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14ZM8.75 7.689V2a.75.75 0 0 0-1.5 0v5.689L5.28 5.72a.749.749 0 0 0-1.06 1.06l3.25 3.25a.749.749 0 0 0 1.06 0l3.25-3.25a.749.749 0 1 0-1.06-1.06L8.75 7.689Z"></path>
              <path *ngSwitchCase="'action'"
                    d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v12.5A1.75 1.75 0 0 1 14.25 16H1.75A1.75 1.75 0 0 1 0 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25Zm7.47 3.97a.75.75 0 0 1 1.06 0l2 2a.75.75 0 0 1 0 1.06l-2 2a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734L10.69 8.5H4.25a.75.75 0 0 1 0-1.5h6.44L9.22 5.53a.749.749 0 0 1 .215-.734.749.749 0 0 1 .785-.057Z"></path>
              <!-- Default path si l'icône n'est pas reconnue -->
              <path *ngSwitchDefault
                    d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"></path>
            </ng-container>
          </svg>
          
          <div class="config-item-content">
            <a [href]="item.link" 
               class="config-item-title"
               (click)="navigateToConfig($event, item.link)">
              {{item.title}}
            </a>
            <div class="config-item-desc">{{item.description}}</div>
          </div>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    /* Styles spécifiques si nécessaire */
  `]
})
export class SidebarConfigComponent {
  @Input() sections: IConfigPanelSection[] = [];

  navigateToConfig(event: Event, link: string): void {
    event.preventDefault();
    console.log('Navigate to config:', link);
    // Implémenter la navigation
  }
}