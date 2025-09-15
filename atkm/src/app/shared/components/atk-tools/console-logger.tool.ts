export type ColorConfig = Record<string, string>;
export type SymbolsConfig = Record<string, string>;

export interface GroupOptions {
  /** Title displayed in the group header. Defaults to inferred call site. */
  title?: string;
  /** Symbol key from symbols config or a literal string to display before the title. */
  tag?: string;
  /** Any data to dump inside the group. */
  data: any;
  /** Predefined color palette. */
  palette?: 'default' | 'info' | 'warn' | 'error' | 'accent';
  /** Use console.groupCollapsed when true. */
  collapsed?: boolean;
  /** Optional CSS font-family for header text. */
  fontFamily?: string;
  /** Optional font size in px for header text. */
  fontSizePx?: number;
}

export class ConsoleLogger {
  constructor(
    private colors: ColorConfig,
    private symbols: SymbolsConfig
  ) { }

  public group(opts: GroupOptions): void {
    const {
      title,
      tag,
      data,
      palette = 'default',
      collapsed = false,
      fontFamily,
      fontSizePx
    } = opts;

    const tagChar = this.symbols[tag as keyof SymbolsConfig] ?? (typeof tag === 'string' ? tag : '✔');
    const pal = this.getPalette(palette);
    const ttl = title ?? this.inferCaller();

    const headerFont = [];
    if (fontFamily) headerFont.push(`font-family:${fontFamily}`);
    if (fontSizePx) headerFont.push(`font-size:${fontSizePx}px`);
    headerFont.push('font-weight:bold');

    const tagStyle = [`color:${pal.tag}`, ...headerFont].join(';');
    const titleStyle = [`color:${pal.title}`, ...headerFont].join(';');

    const open = collapsed ? console.groupCollapsed : console.group;
    open(`%c${tagChar} %c${ttl}`, tagStyle, titleStyle);
    this.dump(data, pal);
    console.groupEnd();
  }

  // ─────────────────────────────── internals
  private dump(value: any, pal: any, key?: string): void {
    switch (true) {
      case value instanceof Error:
        console.log(`%c${key ?? 'Error'}:`, `color:${pal.key};font-weight:bold`, value.name, value.message);
        if (value.stack) console.log(value.stack);
        return;
      case Array.isArray(value):
        console.log(`%c${key ?? 'Array'} [${value.length}]`, `color:${pal.key};font-weight:bold`);
        value.forEach((v, i) => this.dump(v, pal, `[${i}]`));
        return;
      case value instanceof Map:
        console.log(`%c${key ?? 'Map'}(${value.size})`, `color:${pal.key};font-weight:bold`);
        value.forEach((v, k) => this.dump(v, pal, `→ ${String(k)}`));
        return;
      case value instanceof Set:
        console.log(`%c${key ?? 'Set'}(${value.size})`, `color:${pal.key};font-weight:bold`);
        Array.from(value.values()).forEach((v, i) => this.dump(v, pal, `#${i}`));
        return;
      case value !== null && typeof value === 'object':
        console.log(`%c${key ?? 'Object'}`, `color:${pal.key};font-weight:bold`);
        Object.entries(value).forEach(([k, v]) => this.dump(v, pal, k));
        return;
      default:
        if (key !== undefined) {
          console.log(`%c${key}: %c${String(value)} %c(${typeof value})`,
            `color:${pal.key};font-weight:bold`,
            `color:${pal.value}`,
            `color:${pal.meta}`
          );
        } else {
          console.log(`%c${String(value)} %c(${typeof value})`,
            `color:${pal.value}`,
            `color:${pal.meta}`
          );
        }
    }
  }

  private getPalette(name: GroupOptions['palette']) {
    const base = {
      tag: this.hex('#FFD700'),     // gold
      title: this.hex('#FFFFFF'),   // white
      key: this.hex('#87CEEB'),     // skyblue
      value: this.hex('#90EE90'),   // lightgreen
      meta: this.hex('#FFA500')     // orange
    };
    const named: Record<string, typeof base> = {
      default: base,
      info: { ...base, tag: this.hex('#1E90FF'), value: this.hex('#00BFFF') },
      warn: { ...base, tag: this.hex('#FFA500'), value: this.hex('#FFD700'), meta: this.hex('#FFA07A') },
      error: { ...base, tag: this.hex('#E81123'), value: this.hex('#FA8072'), meta: this.hex('#FF6347') },
      accent: { ...base, tag: this.hex('#BA55D3'), value: this.hex('#EE82EE') }
    };
    return named[name ?? 'default'];
  }

  private hex(code: string) {
    if (code in this.colors) return `#${this.colors[code]}`;
    if (/^#?[0-9A-Fa-f]{6}$/.test(code)) return code.startsWith('#') ? code : `#${code}`;
    return code;
  }

  private inferCaller(): string {
    const e = new Error();
    const stack = (e.stack || '').split('\n');
    const raw = stack[3] ?? stack[2] ?? '';
    return raw.replace(/\s*at\s*/, '').trim();
  }
}
