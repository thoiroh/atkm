import { Component, Input, OnInit } from '@angular/core';
import { ConfigService } from '@core/services/config.service';
import { ILandingConfig } from '@core/models/config.models';
import { AtkIconComponent } from '@shared/components/atk-icon/atk-icon.component';

@Component({
  selector: 'atk-navbar-tools',
  standalone: true,
  imports: [AtkIconComponent],
  templateUrl: './navbar-tools.component.html',
})
export class NavbarToolsComponent implements OnInit {
  @Input() configPanelCollapsed: boolean = false;
  config: ILandingConfig | null = null;

  constructor(private configService: ConfigService) { }

  ngOnInit(): void {
    this.configService.loadLandingConfig().subscribe({
      next: (config) => {
        this.config = config;
      },
      error: (error) => {
        console.error('Erreur lors du chargement de la configuration:', error);
      }
    });
  }

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
