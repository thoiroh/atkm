import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ConfigService } from '@core/services/config.service';
import { ISidebarNavConfig } from '@core/models/config.models';
import { HoverDotDirective } from '@directives/hover-dot.directive';
import { IconPipe } from '@pipes/icon.pipe';
import { AtkIconComponent } from '@shared/components/atk-icon/atk-icon.component';
import { ToolsService } from '@shared/services/tools.service';

@Component({
  selector: 'atk-sidebar-nav',
  standalone: true,
  imports: [CommonModule, RouterModule, AtkIconComponent, IconPipe, HoverDotDirective],
  templateUrl: './sidebar-nav.component.html',
})

export class SidebarNavComponent implements OnInit {
  @Input() config: ISidebarNavConfig | null = null;

  private configService = inject(ConfigService);
  private tools = inject(ToolsService);

  constructor() {
    // console.log('IconRegistry registry signal:', this.iconRegistry.registry());
  }

  ngOnInit(): void {
    this.configService.loadLandingConfig().subscribe({
      next: (config) => { this.config = config.sidebar; },
      error: (error) => { console.error('Erreur lors du chargement de la configuration:', error); }
    });
    // this.tools.consoleGroup({ // TAG SidebarNavComponent -> ngOnInit()
    //   title: `SidebarNavComponent initialized ngOnInit()`, tag: 'check', palette: 'in', collapsed: true,
    //   data: { config: this.config },
    // });
  }

  // Toggle pour les sections
  toggleSection(sectionIndex: number): void {
    if (this.config?.sections[sectionIndex]) {
      this.config.sections[sectionIndex].isExpanded =
        !this.config.sections[sectionIndex].isExpanded;
    }
  }

  // Toggle pour les items
  toggleItem(sectionIndex: number, itemIndex: number): void {
    if (this.config?.sections[sectionIndex]?.items[itemIndex]) {
      this.config.sections[sectionIndex].items[itemIndex].isExpanded =
        !this.config.sections[sectionIndex].items[itemIndex].isExpanded;
    }

  }
  // Toggle pour les sous-menus
  toggleSubMenu(sectionIndex: number, itemIndex: number, subMenuIndex: number): void {
    const subMenuItem = this.config?.sections[sectionIndex]?.items[itemIndex]?.subMenu?.[subMenuIndex];
    if (subMenuItem) {
      subMenuItem.isExpanded = !subMenuItem.isExpanded;
    }
  }

  handleAction(action: string): void {
    console.log('Action:', action);
  }

}
