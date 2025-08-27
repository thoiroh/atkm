import { Component, Input } from '@angular/core';

@Component({
  selector: 'atk-content-main',
  imports: [],
  template: `
    <main class="main-content">
      <div class="content-wrapper">
        <div class="main-header">
          <h1>Home</h1>
        </div>

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
              Create a profile README
            </button>

            <button class="suggestion-btn" (click)="handleSuggestion('explain')">
              <div style="color: #8b5cf6;">
                <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" fill="currentColor">
                  <path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.92 6.085h.001a.749.749 0 1 1-1.342-.67c.169-.339.436-.701.849-.977C6.845 4.16 7.369 4 8 4a2.756 2.756 0 0 1 1.637.525c.503.377.863.965.863 1.725 0 .448-.115.83-.329 1.15-.205.307-.47.513-.692.662-.22.149-.41.242-.522.3a.727.727 0 0 0-.076.039l-.002.001h-.001a.75.75 0 0 1-.592-1.378c.074-.029.18-.07.281-.119.099-.048.177-.094.232-.143.059-.051.088-.09.106-.113.024-.029.057-.09.057-.188 0-.24-.086-.49-.287-.64C8.471 5.67 8.256 5.5 8 5.5c-.369 0-.597.09-.74.187a1.028 1.028 0 0 0-.34.398ZM8 11a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path>
                </svg>
              </div>
              Explain a repository
            </button>

            <button class="suggestion-btn" (click)="handleSuggestion('code')">
              <div style="color: #10b981;">
                <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" fill="currentColor">
                  <path d="m11.28 3.22 4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734L13.94 8 10.22 4.28a.749.749 0 0 1 .326-1.275.749.749 0 0 1 .734.215Zm-6.56 0a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L2.06 8l3.72 3.72a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L.47 8.53a.75.75 0 0 1 0-1.06Z"></path>
                </svg>
              </div>
              Write code
            </button>
          </div>
        </div>

        <!-- Feeds Section -->
        @if (feeds && feeds.length > 0) {
          <div class="feeds-section">
            @for (feed of feeds; track feed.id) {
              <div class="feed-container">
                <div class="feed-header">
                  <h2>{{feed.title}}</h2>
                  <button class="feed-filter" (click)="handleFilter(feed.id)">
                    <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" fill="currentColor">
                      <path d="M7.75 8a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 0-1.5h-4.5ZM5 12.75a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Zm-1.5-4a.75.75 0 0 0 0-1.5h-.75a.75.75 0 0 0 0 1.5h.75ZM3 11.25a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1-.75-.75Z"></path>
                    </svg>
                  </button>
                </div>

                <div class="feed-items">
                  @for (item of feed.items; track item.id) {
                    <div class="feed-item">
                      <img [src]="item.avatar"
                           alt="Avatar"
                           class="feed-avatar"
                           width="32"
                           height="32" />

                      <div class="feed-content">
                        <div class="feed-action">
                          <span [innerHTML]="item.action"></span>
                          <span class="feed-time">{{item.time}}</span>
                        </div>

                        <div class="feed-repo">
                          <a [href]="item.repo.link" class="repo-name">
                            {{item.repo.name}}
                          </a>
                          <p class="repo-description">{{item.repo.description}}</p>

                          <div class="repo-stats">
                            @if (item.stats.language) {
                              <span class="repo-language">
                                <span class="language-color"
                                      [style.background-color]="item.stats.language.color"></span>
                                {{item.stats.language.name}}
                              </span>
                            }
                            @if (item.stats.stars) {
                              <span class="repo-stars">
                                <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" fill="currentColor">
                                  <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"></path>
                                </svg>
                                {{item.stats.stars}}
                              </span>
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>
    </main>
  `,
  styles: [`
    .main-content {
      grid-area: main-content;
      background-color: var(--color-canvas-default);
      padding: 24px;
      overflow-y: auto;
    }

    .copilot-section {
      background: var(--color-canvas-subtle);
      border: 1px solid var(--color-border-default);
      border-radius: 6px;
      padding: 16px;
      margin-bottom: 24px;
    }

    .copilot-input {
      width: 100%;
      background: var(--color-canvas-default);
      border: 1px solid var(--color-border-default);
      border-radius: 6px;
      color: var(--color-fg-default);
      padding: 8px 12px;
      resize: none;
      font-family: inherit;
      margin: 12px 0;
    }

    .copilot-suggestions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .suggestion-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: var(--color-btn-bg);
      border: 1px solid var(--color-btn-border);
      border-radius: 6px;
      color: var(--color-fg-default);
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s;
    }

    .suggestion-btn:hover {
      background: var(--color-btn-hover-bg);
      border-color: var(--color-btn-hover-border);
    }

    .feed-container {
      margin-bottom: 32px;
    }

    .feed-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .feed-item {
      display: flex;
      gap: 12px;
      padding: 16px;
      background: var(--color-canvas-subtle);
      border: 1px solid var(--color-border-default);
      border-radius: 6px;
      margin-bottom: 8px;
    }

    .feed-avatar {
      border-radius: 50%;
    }

    .feed-content {
      flex: 1;
    }

    .feed-action {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      color: var(--color-fg-muted);
      font-size: 14px;
    }

    .repo-name {
      color: var(--color-accent-fg);
      text-decoration: none;
      font-weight: 600;
    }

    .repo-name:hover {
      text-decoration: underline;
    }

    .repo-description {
      color: var(--color-fg-default);
      margin: 8px 0;
    }

    .repo-stats {
      display: flex;
      gap: 16px;
      align-items: center;
      font-size: 12px;
      color: var(--color-fg-muted);
    }

    .repo-language {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .language-color {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    .repo-stars {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  `]
})
export class ContentMainComponent {
  @Input() feeds: any[] = [];

  handleCopilotInput(event: any): void {
    console.log('Copilot input:', event.target.value);
    const textarea = event.target;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  handleSuggestion(type: string): void {
    console.log('Suggestion clicked:', type);
  }

  handleFilter(feedId: string): void {
    console.log('Filter feed:', feedId);
  }
}
