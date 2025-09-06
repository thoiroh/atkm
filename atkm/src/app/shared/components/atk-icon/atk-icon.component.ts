import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnChanges, signal } from '@angular/core';
import { IconDef, IconRegistryService } from './icon-registry.service';

@Component({
  selector: 'atk-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg *ngIf="def()" [attr.viewBox]="viewBox()" [attr.width]="size" [attr.height]="size"
         [style.color]="color" fill="currentColor" aria-hidden="true">
      <ng-container *ngFor="let d of def()?.paths || []">
        <path [attr.d]="d"></path>
      </ng-container>
      <ng-container *ngFor="let c of def()?.circles || []">
        <circle [attr.cx]="c.cx" [attr.cy]="c.cy" [attr.r]="c.r"></circle>
      </ng-container>
    </svg>
  `,
  styles: [`
    :host{ display:inline-flex; line-height:0; }
    svg { vertical-align:middle; }
  `]
})
export class AtkIconComponent implements OnChanges {
  private registry = inject(IconRegistryService);

  /** ex: "radio-ring" | "display" | "repo" */
  @Input() name: string = 'repo';
  /** ex: "dot" -> combiné à name: "radio-dot" */
  @Input() variant?: string | null;
  /** couleur pilotable ; défaut registry = #656d76 */
  @Input() color?: string | null;
  /** taille en px (width/height) */
  @Input() size = 16;

  def = signal<IconDef | null>(null);
  viewBox = signal<string>('0 0 16 16');

  ngOnChanges() {
    const key = (this.variant?.trim())
      ? `${this.name}-${this.variant}` : this.name;

    this.registry.getRegistry().subscribe(reg => {
      const d = reg.icons[key] ?? reg.icons[this.name] ?? reg.icons['repo'] ?? { paths: [] };
      this.def.set(d);
      this.viewBox.set(d.viewBox ?? reg.defaults?.viewBox ?? '0 0 16 16');
      // fallback couleur si non fournie
      if (!this.color) this.color = reg.defaults?.color ?? '#656d76';
    });
  }
}
