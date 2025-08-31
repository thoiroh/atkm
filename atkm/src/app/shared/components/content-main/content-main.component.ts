import { Component, Input } from '@angular/core';

@Component({
  selector: 'atk-content-main',
  imports: [],
  templateUrl: './content-main.component.html',
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
