import { Component, computed, inject, input } from '@angular/core';
import { IconRegistryService } from '@core/services/icon-registry.service';

type PathDef = { d: string; fill?: string | null; stroke?: string | null; strokeWidth?: number; strokeLinecap?: string; strokeLinejoin?: string; };
type CircleDef = { cx: number; cy: number; r: number; fill?: string | null; stroke?: string | null; strokeWidth?: number; strokeLinecap?: string; strokeLinejoin?: string; };
type PolygonDef = { points: string; fill?: string | null; stroke?: string | null; strokeWidth?: number; strokeLinecap?: string; strokeLinejoin?: string; };
type RectDef = {
  x: number; y: number; width: number; height: number; rx?: number;
  fill?: string | null; stroke?: string | null; strokeWidth?: number; strokeLinecap?: string; strokeLinejoin?: string;
};


@Component({
  selector: 'atk-icon',
  standalone: true,
  templateUrl: './atk-icon.component.html',
  styles: [`
    :host { display:inline-flex; line-height:0; }
    svg    { vertical-align:middle; }
  `]
})
export class AtkIconComponent {
  private reg = inject(IconRegistryService).registry;

  // CORRECTION: Signals avec valeurs par défaut plus robustes
  name = input<string>('default');
  variant = input<string | null>(null);
  color = input<string>('#656d76'); // Valeur par défaut non-null
  size = input<number>(16);
  fill = input<string>('currentColor'); // Valeur par défaut non-null
  stroke = input<string | null>(null);
  strokeWidth = input<number | null>(null);
  strokeLinecap = input<string | null>(null);
  strokeLinejoin = input<string | null>(null);

  private key = computed(() => {
    const n = (this.name() || 'default').trim();
    const v = this.variant()?.trim();
    return v ? `${n}-${v}` : n;
  });

  private raw = computed<any>(() => {
    const r = this.reg();
    const n = (this.name() || 'default').trim();
    const iconData = r.icons[this.key()] ?? r.icons[n] ?? r.icons['default'] ?? {};

    // DEBUG: Log pour vérifier les données
    console.log(`Icon "${this.key()}" data:`, iconData);

    return iconData;
  });

  // Sélecteurs typés utilisés par le template
  paths = computed<PathDef[]>(() => {
    const pathsData = this.raw()?.paths ?? [];
    const result = pathsData.map((x: any) => typeof x === 'string' ? { d: x } : x);
    // console.log(`Paths for "${this.key()}":`, result);
    return result;
  });

  circles = computed<CircleDef[]>(() => {
    const circlesData = this.raw()?.circles ?? [];
    // console.log(`⭕ Circles for "${this.key()}":`, circlesData);
    return circlesData;
  });

  polygons = computed<PolygonDef[]>(() => this.raw()?.polygons ?? []);
  rects = computed<RectDef[]>(() => this.raw()?.rects ?? []);

  viewBox = computed(() => {
    const vb = this.raw()?.viewBox ?? this.reg().defaults.viewBox;
    // console.log(`📐 ViewBox for "${this.key()}":`, vb);
    return vb;
  });

  resolvedColor = computed(() => {
    const color = this.color();
    // console.log(`🎨 Color for "${this.key()}":`, color);
    return color;
  });
}
