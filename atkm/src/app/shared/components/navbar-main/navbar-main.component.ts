import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { ConfigService, ILandingConfig } from '@core/services/config.service';
import { AtkIconComponent } from '@shared/components/atk-icon/atk-icon.component';
import { ToolsService } from '@shared/services/tools.service';

@Component({
  selector: 'atk-navbar-main',
  standalone: true,
  imports: [CommonModule, AtkIconComponent],
  templateUrl: './navbar-main.component.html',
})
export class NavbarMainComponent implements OnInit {
  @Input() config: ILandingConfig | null = null;

  private configService = inject(ConfigService);
  private tools = inject(ToolsService);

  constructor() { }

  ngOnInit(): void {
    this.configService.loadLandingConfig().subscribe({
      next: (config) => { this.config = config; },
      error: (error) => { console.error('Erreur lors du chargement de la configuration:', error); }
    });
    this.tools.consoleGroup({ // TAG NavbarMainComponent -> ngOnInit()
      title: `NavbarMainComponent initialized ngOnInit()`, tag: 'check', palette: 'in', collapsed: true,
      data: { config: this.config },
    });
  }
}
