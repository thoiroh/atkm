import { Component, computed, inject, input } from '@angular/core';
import { IconRegistryService } from '../../../core/services/icon-registry.service';

@Component({
  selector: 'atk-icon',
  standalone: true,
  template: `
    <svg
      [attr.viewBox]="viewBox()"
      [attr.width]="size()"
      [attr.height]="size()"
      [style.color]="resolvedColor()"
      fill="currentColor"
      aria-hidden="true">
      @for (d of (def().paths ?? []); track d) {
        <path [attr.d]="d"></path>
      }
      @for (c of (def().circles ?? []); track $index) {
        <circle [attr.cx]="c.cx" [attr.cy]="c.cy" [attr.r]="c.r"></circle>
      }
    </svg>
  `,
  styles: [`
    :host { display:inline-flex; line-height:0; }
    svg    { vertical-align:middle; }
  `]
})
export class AtkIconComponent {
  private reg = inject(IconRegistryService).registry;

  /** ex: "radio-ring", "repo"… */
  name = input<string>('repo');
  /** ex: "dot" -> "radio-dot" */
  variant = input<string | null>(null);
  /** couleur courante ; fallback registry.defaults.color */
  color = input<string | null>(null);
  /** taille px */
  size = input<number>(16);

  private key = computed(() => {
    const n = (this.name() || 'repo').trim();
    const v = this.variant()?.trim();
    return v ? `${n}-${v}` : n;
  });

  def = computed(() => {
    const r = this.reg();
    const n = (this.name() || 'repo').trim();
    return r.icons[this.key()] ?? r.icons[n] ?? r.icons['repo'] ?? { paths: [] };
  });

  viewBox = computed(() => this.def().viewBox ?? this.reg().defaults.viewBox);

  resolvedColor = computed(() => this.color() ?? this.reg().defaults.color);
}
