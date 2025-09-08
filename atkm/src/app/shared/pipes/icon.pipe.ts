import { Pipe, PipeTransform } from '@angular/core';

export type IconSpec =
  | string
  | { name?: string; variant?: string | null; color?: string | null; size?: number | null };

export interface IconDefaults {
  defaultName?: string;
  defaultVariant?: string | null;
  defaultColor?: string | null;
  size?: number;
}

export interface IconInputs {
  name: string;
  variant?: string | null;
  color?: string | null;
  size: number;
}

@Pipe({ name: 'icon', standalone: true, pure: true })
export class IconPipe implements PipeTransform {
  transform(value: IconSpec | null | undefined, defaults: IconDefaults = {}): IconInputs {
    const {
      defaultName = 'repo',
      defaultVariant = null,
      defaultColor = '#656d76',
      size = 16
    } = defaults;

    if (typeof value === 'string') {
      return { name: value.trim() || defaultName, variant: defaultVariant, color: defaultColor, size: Number(size) };
    }
    const v = value ?? {};
    return {
      name: (v.name && v.name.trim()) || defaultName,
      variant: v.variant ?? defaultVariant ?? null,
      color: (v.color && v.color.trim()) || defaultColor,
      size: Number(v.size ?? size) || Number(size)
    };
  }
}
