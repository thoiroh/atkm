import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ConfigStore } from '@core/store/config.store';
import { AtkIconComponent } from '@shared/components/atk-icon/atk-icon.component';
import { ToolsService } from '../../services/tools.service';

@Component({
  selector: 'atk-navbar-tools',
  standalone: true,
  imports: [CommonModule, AtkIconComponent],
  templateUrl: './navbar-tools.component.html',
})

export class NavbarToolsComponent implements OnInit {

  // =========================================
  // DEPENDENCIES & COMPUTED SIGNALS
  // =========================================

  private readonly configStore = inject(ConfigStore);
  private readonly tools = inject(ToolsService);

  navbar = this.configStore.navbar;
  configPanelCollapsed = this.configStore.configPanelCollapsed;

  // =========================================
  // LIFECYCLE
  // =========================================

  ngOnInit(): void {
    // this.tools.consoleGroup({ // OFF NavbarToolsComponent -> ngOnInit() ================ CONSOLE LOG IN PROGRESS
    //   title: `NavbarToolsComponent -> ngOnInit()`, tag: 'check', palette: 'in', collapsed: false,
    //   data: {
    //     navbar: this.navbar(),
    //     configPanelCollapsed: this.configPanelCollapsed()
    //   }
    // });
  }

  // =========================================
  // EVENT HANDLERS
  // =========================================

  handleSearchShortcut(event: KeyboardEvent): void {
    if (event.key === '/' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      const input = event.target as HTMLInputElement;
      input.focus();
    }
  }

  handleAction(action: string): void {
    console.log('Action clicked:', action);
  }

  toggleUserMenu(): void {
    console.log('Toggle user menu');
  }
}
