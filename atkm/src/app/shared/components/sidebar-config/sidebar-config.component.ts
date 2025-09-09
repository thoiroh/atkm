import { Component, input, output } from '@angular/core';
import { IConfigPanelSection } from '../../../core/services/config.service';

// UI
import { AtkIconComponent } from '../../../shared/components/atk-icon/atk-icon.component';
import { IconPipe } from '../../../shared/pipes/icon.pipe';
import { HoverDotDirective } from '../../directives/hover-dot.directive';

@Component({
  selector: 'atk-sidebar-config',
  standalone: true,
  imports: [AtkIconComponent, IconPipe, HoverDotDirective],
  templateUrl: './sidebar-config.component.html',
})
export class SidebarConfigComponent {
  sections = input<IConfigPanelSection[]>([]);
  isCollapsed = input<boolean>(true);
  togglePanel = output<void>();

  navigateToConfig(event: Event, link: string): void {
    event.preventDefault();
    console.log('Navigate to config:', link);
  }

  onToggle(): void {
    this.togglePanel.emit();
  }
}
