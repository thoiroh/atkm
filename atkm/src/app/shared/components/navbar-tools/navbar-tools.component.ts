import { Component } from '@angular/core';

@Component({
  selector: 'atk-navbar-tools',
  imports: [],
  templateUrl: './navbar-tools.component.html',
})
export class NavbarToolsComponent {
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
