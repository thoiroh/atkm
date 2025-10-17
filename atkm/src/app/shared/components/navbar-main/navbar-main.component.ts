import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ToolsService } from '@core/services/tools.service';
import { ConfigStore } from '@core/store/config.store';
import { AtkIconComponent } from '@shared/components/atk-icon/atk-icon.component';

@Component({
  selector: 'atk-navbar-main',
  standalone: true,
  imports: [CommonModule, AtkIconComponent],
  templateUrl: './navbar-main.component.html',
})

export class NavbarMainComponent implements OnInit {

  // =========================================
  // DEPENDENCIES & COMPUTED SIGNALS
  // =========================================

  private readonly configStore = inject(ConfigStore);
  private readonly tools = inject(ToolsService);

  atkapp = this.configStore.atkapp;
  navbar = this.configStore.navbar;

  // =========================================
  // LIFECYCLE
  // =========================================

  ngOnInit(): void {
    // this.tools.consoleGroup({ // OFF NavbarMainComponent -> ngOnInit() ================ CONSOLE LOG IN PROGRESS
    //   title: `NavbarMainComponent -> ngOnInit()`, tag: 'check', palette: 'in', collapsed: false,
    //   data: { navbar: this.navbar() }
    // });
  }

  switchProfile(): void {
    let currentProfile = this.configStore.profile(); // Retourne 'default' ou 'atkcash'
    this.tools.consoleGroup({ // TAG NavbarMainComponent -> switchProfile() ================ CONSOLE LOG IN PROGRESS
      title: `NavbarMainComponent -> switchProfile()`, tag: 'check', palette: 'ac', collapsed: false,
      data: { atkapp: this.atkapp(), currentProfile: currentProfile }
    });
    this.configStore.switchProfile('');
  }

}
