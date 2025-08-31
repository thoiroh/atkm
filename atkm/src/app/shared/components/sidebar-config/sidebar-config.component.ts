import { Component, Input } from '@angular/core';
import { IConfigPanelSection } from '../../../core/services/config.service';

@Component({
  selector: 'atk-sidebar-config',
  imports: [],
  templateUrl: './sidebar-config.component.html',
})
export class SidebarConfigComponent {
  @Input() sections: IConfigPanelSection[] = [];

  navigateToConfig(event: Event, link: string): void {
    event.preventDefault();
    console.log('Navigate to config:', link);
  }
}
