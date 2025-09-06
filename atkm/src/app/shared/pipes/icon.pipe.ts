import { Pipe, PipeTransform } from '@angular/core';

export type IconSpec =
  | string
  | {
    name?: string;
    variant?: string | null;
    color?: string | null;
    size?: number | null; // px
  };

export interface IconDefaults {
  defaultName?: string;
  defaultVariant?: string | null;
  defaultColor?: string | null;
  size?: number; // px
}

export interface IconInputs {
  name: string;
  variant?: string | null;
  color?: string | null;
  size: number;
}

/**
 * Normalise n'importe quelle forme d'icon spec (string ou objet)
 * en inputs prêts pour <atk-icon>.
 *
 * Usage:
 *   @let ic = (item?.icon | icon: { defaultName:'repo', defaultColor:'#656d76', size:16 });
 *   <atk-icon [name]="ic.name" [variant]="ic.variant" [color]="ic.color" [size]="ic.size"></atk-icon>
 */
@Pipe({
  name: 'icon',
  standalone: true,
  pure: true
})
export class IconPipe implements PipeTransform {
  transform(value: IconSpec | null | undefined, defaults: IconDefaults = {}): IconInputs {
    const {
      defaultName = 'repo',
      defaultVariant = null,
      defaultColor = '#656d76',
      size = 16
    } = defaults;

    // Cas simple : une string => nom direct
    if (typeof value === 'string') {
      const name = value.trim() || defaultName;
      return { name, variant: defaultVariant, color: defaultColor, size };
    }

    // Objet (ou null/undefined)
    const v = (value ?? {}) as Exclude<IconSpec, string>;

    const name = (v.name && v.name.trim()) || defaultName;
    const variant = v.variant ?? defaultVariant ?? null;
    const color = (v.color && v.color.trim()) || defaultColor;
    const finalSize = (v.size ?? size) || size;

    return { name, variant, color, size: finalSize };
  }
}
