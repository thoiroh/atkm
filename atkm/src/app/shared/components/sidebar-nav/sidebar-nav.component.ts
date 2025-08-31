import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ISidebarNavConfig } from '../../../core/services/config.service';

@Component({
  selector: 'atk-sidebar-nav',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar-nav.component.html',
})
export class SidebarNavComponent {
  @Input() config: ISidebarNavConfig | null = null;

  handleAction(action: string): void {
    console.log('Action:', action);
  }

  navigateToRepo(event: Event, link: string): void {
    event.preventDefault();
    console.log('Navigate to:', link);
  }
}
