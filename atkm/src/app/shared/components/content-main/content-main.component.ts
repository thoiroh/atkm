import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IFeedItem } from '../../../core/services/config.service';

@Component({
  selector: 'atk-content-main',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="main-content">
      <div class="content-wrapper">
        <div class="main-header">
          <h1>Home</h1>
        </div>
      </div>
    </main>
  `,
  styles: [`
    /* Styles spécifiques si nécessaire */
  `]
})
export class ContentMainComponent {
  @Input() feeds: any[] = [];

  handleCopilotInput(event: any): void {
    console.log('Copilot input:', event.target.value);
    // Implémenter l'auto-resize du textarea
    const textarea = event.target;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  handleSuggestion(type: string): void {
    console.log('Suggestion clicked:', type);
    // Implémenter les suggestions
  }

  handleFilter(feedId: string): void {
    console.log('Filter feed:', feedId);
    // Implémenter le filtrage
  }
}

        <!-- Section Copilot -->
        <div class="copilot-section">
          <h2>Copilot</h2>
          <textarea class="copilot-input" 
                    placeholder="Ask Copilot" 
                    rows="1"
                    (input)="handleCopilotInput($event)"></textarea>

          <div class="copilot-suggestions">
            <button class="suggestion-btn" (click)="handleSuggestion('profile')">
              <div style="color: #ff79c6;">
                <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" fill="currentColor">
                  <path d="M14.064 0h.186C15.216 0 16 .784 16 1.75v.186a8.752 8.752 0 0 1-2.564 6.186l-.458.459c-.314.314-.641.616-.979.904v3.207c0 .608-.315 1.172-.833 1.49l-2.774 1.707a.749.749 0 0 1-1.11-.418l-.954-3.102a1.214 1.214 0 0 1-.145-.125L3.754 9.816a1.218 1.218 0 0 1-.124-.145L.528 8.717a.749.749 0 0 1-.418-1.11l1.71-2.774A1.748 1.748 0 0 1 3.31 4h3.204c.288-.338.59-.665.904-.979l.459-.458A8.749 8.749 0 0 1 14.064 0Z"></path>
                </svg>
              </div>
              Create a profile README for me
            </button>
            <button class="suggestion-btn" (click)="handleSuggestion('issue')">
              <div style="color: #50fa7b;">
                <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" fill="currentColor">
                  <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path>
                  <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"></path>
                </svg>
              </div>
              Create an issue for a bug
            </button>
            <button class="suggestion-btn" (click)="handleSuggestion('steps')">
              <div style="color: #50fa7b;">
                <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" fill="currentColor">
                  <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path>
                  <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"></path>
                </svg>
              </div>
              Suggest next steps for an issue