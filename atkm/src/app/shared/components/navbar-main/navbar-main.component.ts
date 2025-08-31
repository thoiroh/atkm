import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { INavbarConfig } from '../../../core/services/config.service';

@Component({
  selector: 'atk-navbar-main',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar-main.component.html',
})
export class NavbarMainComponent {
  @Input() config: INavbarConfig | null = null;
}
