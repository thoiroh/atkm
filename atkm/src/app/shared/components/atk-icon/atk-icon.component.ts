import { Component, computed, inject, input } from '@angular/core';
import { IconService } from '@app/core/services/icon.service';

type PathDef = {
  d: string; fill?: string | null; stroke?: string | null; strokeWidth?: number; strokeLinecap?: string; strokeLinejoin?: string;
};
type CircleDef = {
  cx: number; cy: number; r: number; fill?: string | null; stroke?: string | null; strokeWidth?: number; strokeLinecap?: string; strokeLinejoin?: string;
};
type PolygonDef = {
  points: string; fill?: string | null; stroke?: string | null; strokeWidth?: number; strokeLinecap?: string; strokeLinejoin?: string;
};
type RectDef = {
  x: number; y: number; width: number; height: number; rx?: number;
  fill?: string | null; stroke?: string | null; strokeWidth?: number; strokeLinecap?: string; strokeLinejoin?: string;
};

@Component({
  selector: 'atk-icon',
  standalone: true,
  templateUrl: './atk-icon.component.html',
  styles: [`
    :host {
      display: inline-flex;
      line-height: 0;
    }
    svg {
      vertical-align: middle;
    }
  `]
})

export class AtkIconComponent {
  private iconRegistry = inject(IconService);

  name = input<string>('default');
  variant = input<string | null>(null);
  color = input<string>('#656d76');
  size = input<number>(16);
  fill = input<string>('currentColor');
  stroke = input<string | null>(null);
  strokeWidth = input<number | null>(null);
  strokeLinecap = input<string | null>(null);
  strokeLinejoin = input<string | null>(null);

  private key = computed(() => {
    const n = (this.name() || 'default').trim();
    const v = this.variant()?.trim();
    return v ? `${n}-${v}` : n;
  });

  private iconData = computed(() => {
    const registry = this.iconRegistry.registry();
    const iconName = this.key();

    // Chercher l'icône demandée, sinon fallback
    return registry.icons[iconName] ??
      registry.icons[this.name()] ??
      registry.icons['default-fallback'] ??
      {};
  });

  // Computed pour les éléments SVG
  paths = computed<PathDef[]>(() => {
    const pathsData = this.iconData()?.paths ?? [];
    return pathsData.map((x: any) => typeof x === 'string' ? { d: x } : x);
  });

  circles = computed<CircleDef[]>(() => this.iconData()?.circles ?? []);
  polygons = computed<PolygonDef[]>(() => this.iconData()?.polygons ?? []);
  rects = computed<RectDef[]>(() => this.iconData()?.rects ?? []);

  viewBox = computed(() => {
    const registry = this.iconRegistry.registry();
    return this.iconData()?.viewBox ?? registry.defaults.viewBox;
  });

  resolvedColor = computed(() => this.color());
}
