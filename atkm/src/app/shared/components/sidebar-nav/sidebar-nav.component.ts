import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ISidebarNavConfig } from '../../../core/services/config.service';
import { IconPipe } from '../../pipes';
import { AtkIconComponent } from '../atk-icon/atk-icon.component';

@Component({
  selector: 'atk-sidebar-nav',
  standalone: true,
  imports: [CommonModule, RouterModule, AtkIconComponent, IconPipe],
  templateUrl: './sidebar-nav.component.html',
})
export class SidebarNavComponent {
  @Input() config: ISidebarNavConfig | null = null;


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
