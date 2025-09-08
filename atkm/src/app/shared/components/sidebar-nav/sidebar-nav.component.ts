import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ISidebarNavConfig } from '@core/services/config.service';
import { IconRegistryService } from '@core/services/icon-registry.service';
import { HoverDotDirective } from '@directives/hover-dot.directive';
import { IconPipe } from '@pipes/icon.pipe';
import { AtkIconComponent } from '@shared/components/atk-icon/atk-icon.component';

@Component({
  selector: 'atk-sidebar-nav',
  standalone: true,
  imports: [CommonModule, RouterModule, AtkIconComponent, IconPipe, HoverDotDirective],
  templateUrl: './sidebar-nav.component.html',
})

export class SidebarNavComponent {
  @Input() config: ISidebarNavConfig | null = null;

  private iconRegistry = inject(IconRegistryService);

  constructor() {
    // DIAGNOSTIC: Vérifier que le service fonctionne
    console.log('IconRegistry registry signal:', this.iconRegistry.registry());

    // Vérifier les icônes spécifiques
    // const registry = this.iconRegistry.registry();
    // console.log('radio-ring icon:', registry.icons['radio-ring']);
    // console.log('radio-dot icon:', registry.icons['radio-dot']);
    // console.log('default icon:', registry.icons['default']);
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
