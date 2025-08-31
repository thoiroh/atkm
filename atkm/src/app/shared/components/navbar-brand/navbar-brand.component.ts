import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { INavbarConfig } from '../../../core/services/config.service';

@Component({
  selector: 'atk-navbar-brand',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar-brand.component.html',
})
export class NavbarBrandComponent {
  @Input() config: INavbarConfig | null = null;
}
