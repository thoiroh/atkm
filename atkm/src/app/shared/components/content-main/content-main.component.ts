import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarConfigComponent } from '@shared/components/sidebar-config/sidebar-config.component';
import { ConfigService, ILandingConfig } from '../../../core/services/config.service';
import { BinanceAccount } from '../../../features/binance/models/binance.model';

@Component({
  selector: 'atk-content-main',
  standalone: true,
  imports: [RouterOutlet, SidebarConfigComponent],
  templateUrl: './content-main.component.html',
})
export class ContentMainComponent implements OnInit {

  @Input() feeds: any[] = [];
  @Input() configPanelCollapsed: boolean = false;

  config: ILandingConfig | null = null;
  account = signal<BinanceAccount | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  bashConfigPanelCollapsed = signal<boolean>(false);


  private configService = inject(ConfigService);


  ngOnInit(): void {
    this.configService.loadLandingConfig().subscribe({
      next: (config) => {
        this.config = config;
        // Initialize bash config panel as collapsed
        this.bashConfigPanelCollapsed.set(false);
      },
      error: (error) => {
        console.error('Erreur lors du chargement de la configuration:', error);
      }
    });
  }

  /**
  * Handle traditional config panel toggle (if still needed)
  */
  toggleConfigPanel(): void {
    if (this.config) {
      this.config.configPanel.isCollapsed = !this.config.configPanel.isCollapsed;
    }
  }

  handleCopilotInput(event: any): void {
    console.log('Copilot input:', event.target.value);
    const textarea = event.target;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  handleSuggestion(type: string): void {
    console.log('Suggestion clicked:', type);
  }

  handleFilter(feedId: string): void {
    console.log('Filter feed:', feedId);
  }
}
