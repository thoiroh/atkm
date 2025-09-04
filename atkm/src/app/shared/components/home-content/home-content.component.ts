import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'atk-home-content',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home-content.component.html',
  styles: [`
    .home-content {
      padding: 0;
    }
  `]
})
export class HomeContentComponent implements OnInit {
  @Input() feeds: any[] = [];

  ngOnInit(): void {
    console.log('Home content component initialized');
  }

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
