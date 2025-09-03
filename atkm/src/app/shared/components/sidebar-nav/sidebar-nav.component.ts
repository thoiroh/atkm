import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ISidebarNavConfig } from '../../../core/services/config.service';

@Component({
  selector: 'atk-sidebar-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar-nav.component.html',
})
export class SidebarNavComponent {
  @Input() config: ISidebarNavConfig | null = null;

  handleAction(action: string): void {
    console.log('Action:', action);
  }

}
