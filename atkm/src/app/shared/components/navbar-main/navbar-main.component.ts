import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ConfigService, ILandingConfig } from '../../../core/services/config.service';

@Component({
  selector: 'atk-navbar-main',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar-main.component.html',
})
export class NavbarMainComponent implements OnInit {
  @Input() config: ILandingConfig | null = null;

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
}
