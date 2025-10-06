import { Component, input, output } from '@angular/core';
import { IConfigPanelSection } from '@core/models/config.models';
import { AtkIconComponent } from '@shared/components/atk-icon/atk-icon.component';
import { IconPipe } from '@shared/pipes/icon.pipe';
import { HoverDotDirective } from '@shared/directives/hover-dot.directive';

@Component({
  selector: 'atk-sidebar-bash-config',
  standalone: true,
  imports: [AtkIconComponent, IconPipe, HoverDotDirective],
  templateUrl: './sidebar-bash-config.component.html',
  styleUrls: ['./sidebar-bash-config.component.css']
})
export class SidebarBashConfigComponent {
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
