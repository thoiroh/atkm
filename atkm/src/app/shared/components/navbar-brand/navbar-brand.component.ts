import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ILandingConfig } from '@core/models/config.models';

@Component({
  selector: 'atk-navbar-brand',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar-brand.component.html',
})
export class NavbarBrandComponent {
  @Input() configPanelCollapsed: boolean = false;
  @Input() config: ILandingConfig | null = null;
}
