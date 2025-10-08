import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ConfigStore } from '@core/store/config.store';
import { ToolsService } from '../../services/tools.service';

@Component({
  selector: 'atk-navbar-brand',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar-brand.component.html',
})

export class NavbarBrandComponent implements OnInit {

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
    // this.tools.consoleGroup({ // OFF NavbarBrandComponent -> ngOnInit() ================ CONSOLE LOG IN PROGRESS
    //   title: `NavbarBrandComponent -> ngOnInit()`, tag: 'check', palette: 'in', collapsed: false,
    //   data: { navbar: this.navbar() }
    // });
  }

}
