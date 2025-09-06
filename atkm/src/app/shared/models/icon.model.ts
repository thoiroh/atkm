export interface IconObject {
  name?: string;
  variant?: string | null;
  color?: string | null;
  size?: number | null; // px
}

export type IconSpec = string | IconObject;
