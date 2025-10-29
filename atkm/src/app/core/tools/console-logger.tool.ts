export type ColorConfig = Record<string, { hex: string; description: string; }>;
export type SymbolsConfig = Record<string, { char: string; description: string; }>;

export interface ConsoleLoggerOptions {
  /** Title displayed in the group header. Defaults to inferred call site. */
  title?: string;
  /** Symbol key from symbols config or a literal string to display before the title. */
  tag?: string;
  /** Any data to dump inside the group. */
  data: any;
  /** Predefined color palette. */
  palette?: 'de' | 'in' | 'wa' | 'er' | 'ac' | 'su' | 'se' | 'st' | 'ss' | 'ht' | 'hs' | 'he' | 'sb' | 'sbs' | 'sbe' | 'ma' | 'mae' | 'mas';
  /** Use console.groupCollapsed when true. */
  collapsed?: boolean;
  /** Optional CSS font-family for header text. */
  fontFamily?: string;
  /** Optional font size in px for header text. */
  fontSizePx?: number;
  /** Optional font weight for header text. */
  fontWeight?: 'normal' | 'bold' | 'lighter' | 'bolder' | number;
  /** Optional font style for header text. */
  fontStyle?: 'normal' | 'italic' | 'oblique';
  /** Font weight for keys/body in dump(). */
  contentFontWeight?: 'normal' | 'bold' | 'lighter' | 'bolder' | number;
  /** Font style for keys/body in dump(). */
  contentFontStyle?: 'normal' | 'italic' | 'oblique';
  /** Font weight for values in dump(). */
  valueFontWeight?: 'normal' | 'bold' | 'lighter' | 'bolder' | number;
  /** Font style for values in dump(). */
  valueFontStyle?: 'normal' | 'italic' | 'oblique';
  /** How objects are printed by dump(): 'tree' logs the real object (expandable), 'flat' walks properties. */
  objectRender?: 'tree' | 'flat';
  /** Render arrays as table: true | false | 'auto' (heuristic). */
  arrayAsTable?: boolean | 'auto';
  /** Auto-table kicks in if at least this many rows (default 3). */
  tableMinRows?: number;
  /** Auto-table requires at least this many common keys (default 2). */
  tableMinCommonKeys?: number;
  /** How many items to sample to decide common keys (default 10). */
  tableSampleSize?: number;

}

export class ConsoleLogger {
  constructor(
    private colors: ColorConfig,
    private symbols: SymbolsConfig
  ) { }

  public group(opts: ConsoleLoggerOptions): void {
    const {
      title,
      tag,
      data,
      palette = 'de',
      collapsed = false,
      fontFamily,
      fontSizePx,
      fontWeight,
      fontStyle,
      contentFontWeight,
      contentFontStyle,
      valueFontWeight,
      valueFontStyle,
      objectRender = 'tree',
      arrayAsTable = 'auto',
      tableMinRows = 3,
      tableMinCommonKeys = 2,
      tableSampleSize = 10
    } = opts;

    const tagChar = this.resolveTag(tag);
    const pal = this.getPalette(palette);
    const ttl = title ?? this.inferCaller();
    const headerFont: string[] = [];
    if (fontFamily) headerFont.push(`font-family:${fontFamily}`);
    if (fontSizePx) headerFont.push(`font-size:${fontSizePx}px`);
    if (fontWeight) headerFont.push(`font-weight:${fontWeight}`);
    else headerFont.push('font-weight:normal');
    if (fontStyle) headerFont.push(`font-style:${fontStyle}`);
    const keyFont: string[] = [];
    if (contentFontWeight) keyFont.push(`font-weight:${contentFontWeight}`);
    if (contentFontStyle) keyFont.push(`font-style:${contentFontStyle}`);
    const valFont: string[] = [];
    if (valueFontWeight) valFont.push(`font-weight:${valueFontWeight}`);
    if (valueFontStyle) valFont.push(`font-style:${valueFontStyle}`);
    const tagStyle = [`color:${pal.tag}`, ...headerFont].join(';');
    const titleStyle = [`color:${pal.title}`, ...headerFont].join(';');
    const valStyle = [`color:${pal.value}`, ...valFont].join(';');
    const metaStyle = [`color:${pal.meta}`].join(';');

    // Détection d’un scalaire (affichage inline dans le header)
    const isInlineScalar = (v: any) =>
      v === null || ['string', 'number', 'boolean', 'bigint', 'symbol', 'undefined'].includes(typeof v);
    let fmt = `%c${tagChar} %c${ttl}`;
    const args: any[] = [tagStyle, titleStyle];
    if (isInlineScalar(data)) {
      // valeur affichée à la suite du header : — value (type)
      fmt += ` %c— %c${String(data)} %c(${typeof data})`;
      args.push(metaStyle, valStyle, metaStyle);
    }
    const open = collapsed ? console.groupCollapsed : console.group;
    open(fmt, ...args);

    // si scalaire, déjà affiché dans le header → pas de dump duplicatif
    if (!isInlineScalar(data)) {
      this.dump(data, pal, undefined, {
        keyFont,
        valFont,
        objectRender,
        arrayAsTable,
        tableMinRows,
        tableMinCommonKeys,
        tableSampleSize
      });
    }
    console.groupEnd();
  }

  private dump(
    value: any,
    pal: any,
    key?: string,
    fmt?: {
      keyFont?: string[];
      valFont?: string[];
      objectRender: 'tree' | 'flat';
      arrayAsTable?: boolean | 'auto';
      tableMinRows?: number;
      tableMinCommonKeys?: number;
      tableSampleSize?: number;
    }
  ): void {

    const keyStyle = [`color:${pal.key};font-weight:bold`, ...(fmt?.keyFont ?? [])].join(';');
    const valStyle = [`color:${pal.value}`, ...(fmt?.valFont ?? [])].join(';');
    const metaStyle = [`color:${pal.meta}`].join(';');
    const logKeyWithObject = (label: string, obj: any) => {
      // le label n'est pas utile ici : on part du principe qu'on log toujours un objet plat
      if (obj && typeof obj === 'object') {
        for (const [k, v] of Object.entries(obj)) {
          const t = typeof v;
          console.log(
            `%c${k}: %c${v instanceof Object ? '' : String(v)} %c(${t})`,
            keyStyle,
            valStyle,
            metaStyle,
            v instanceof Object ? v : undefined
          );
        }
      } else {
        // fallback si jamais un non-objet était loggé par erreur
        console.log(
          `%c(value): %c${String(obj)} %c(${typeof obj})`,
          keyStyle,
          valStyle,
          metaStyle
        );
      }
    };

    switch (true) {
      case value instanceof Error: {
        // keep heading styled, then dump the real Error object for stack/expand
        console.log(`%c${key ?? 'Error'}:`, keyStyle, value);
        return;
      }

      case Array.isArray(value): {
        const keyLabel = `${key ?? 'Array'} [${value.length}]`;
        // decide if we should console.table
        const wantsTable =
          (fmt?.arrayAsTable === true) ||
          (
            fmt?.arrayAsTable === 'auto' &&
            value.length >= (fmt?.tableMinRows ?? 3) &&
            // heuristic: array of plain objects with enough common keys
            (() => {
              const sampleSize = Math.min(value.length, fmt?.tableSampleSize ?? 10);
              const objs = value
                .slice(0, sampleSize)
                .filter(v => v && typeof v === 'object' && !Array.isArray(v));
              if (objs.length < (fmt?.tableMinRows ?? 3)) return false;
              // intersection of keys across sampled objects
              const intersect = (a: Set<string>, b: Set<string>) => new Set([...a].filter(x => b.has(x)));
              const common = objs.reduce((acc, o, idx) => {
                const keys = new Set(Object.keys(o));
                return idx === 0 ? keys : intersect(acc, keys);
              }, new Set<string>());
              return (common.size >= (fmt?.tableMinCommonKeys ?? 2));
            })()
          );

        if (wantsTable) { // header + table for better inspection
          console.log(`%c${keyLabel}`, keyStyle);
          console.table(value);
          return;
        }

        if (fmt?.objectRender === 'tree') {
          logKeyWithObject(keyLabel, value);
          return;
        }

        console.log(`%c${keyLabel}`, keyStyle);
        value.forEach((v, i) => this.dump(v, pal, `[${i}]`, fmt));
        return;
      }

      case value instanceof Map: {
        if (fmt?.objectRender === 'tree') {
          logKeyWithObject(`${key ?? 'Map'}(${value.size})`, value);
          return;
        }
        console.log('map');
        console.log(`%c${key ?? 'Map'}(${value.size})`, keyStyle);
        value.forEach((v, k) => this.dump(v, pal, `→ ${String(k)}`, fmt));
        return;
      }

      case value instanceof Set: {
        if (fmt?.objectRender === 'tree') {
          logKeyWithObject(`${key ?? 'Set'}(${value.size})`, value);
          return;
        }
        console.log('set');
        console.log(`%c${key ?? 'Set'}(${value.size})`, keyStyle);
        Array.from(value.values()).forEach((v, i) => this.dump(v, pal, `#${i}`, fmt));
        return;
      }

      case value !== null && typeof value === 'object': {
        if (fmt?.objectRender === 'tree') {
          logKeyWithObject(`${key ?? 'Object'}`, value);
          return;
        }
        console.log('obj');
        console.log(`%c${key ?? 'Object'}`, keyStyle);
        Object.entries(value).forEach(([k, v]) => this.dump(v, pal, k, fmt));
        return;
      }

      default: {
        if (key !== undefined) {
          console.log(
            `%c${key}: %c${String(value)} %c(${typeof value})`,
            keyStyle,
            valStyle,
            metaStyle
          );
        } else {
          console.log(`%c${String(value)} %c(${typeof value})`, valStyle, metaStyle);
        }
      }
    }
  }

  private getPalette(name: ConsoleLoggerOptions['palette']) {
    const base = {
      tag: this.hex('#FFFF30'),
      title: this.hex('#FFFFFF'),
      key: this.hex('#FF00FF'),
      value: this.hex('#00CED1'),
      meta: this.hex('#646464ff')
    };
    // HACK ConsoleLogger -> getPalette() ====================================================
    const named: Record<string, typeof base> = {
      de: base,
      ma: { ...base, title: this.hex('#ffffffff'), key: this.hex('#FAEBD7'), tag: this.hex('#ffffffff'), value: this.hex('#FAEBD7'), meta: this.hex('#ffffffff') },
      mas: { ...base, title: this.hex('#ffffffff'), key: this.hex('#FAEBD7'), tag: this.hex('#2cf72c'), value: this.hex('#2cf72c'), meta: this.hex('#ffffffff') },
      mae: { ...base, title: this.hex('#ffffffff'), key: this.hex('#FAEBD7'), tag: this.hex('#E81123'), value: this.hex('#E81123'), meta: this.hex('#ffffffff') },
      su: { ...base, title: this.hex('#ebebebff'), key: this.hex('#64ff64'), tag: this.hex('#64ff64'), value: this.hex('#2cf72c'), meta: this.hex('#abababff') },
      in: { ...base, title: this.hex('#ebebebff'), key: this.hex('#64b1feff'), tag: this.hex('#1E90FF'), value: this.hex('#1E90FF'), meta: this.hex('#abababff') },
      wa: { ...base, title: this.hex('#ebebebff'), key: this.hex('#FFD700'), tag: this.hex('#FFA500'), value: this.hex('#FFA500'), meta: this.hex('#abababff') },
      er: { ...base, title: this.hex('#ebebebff'), key: this.hex('#FA8072'), tag: this.hex('#E81123'), value: this.hex('#E81123'), meta: this.hex('#abababff') },
      ac: { ...base, title: this.hex('#ebebebff'), key: this.hex('#EE82EE'), tag: this.hex('#FF00FF'), value: this.hex('#FF00FF'), meta: this.hex('#abababff') },
      st: { ...base, title: this.hex('#00FFFF'), key: this.hex('#abababff'), tag: this.hex('#00FFFF'), value: this.hex('#abababff'), meta: this.hex('#abababff') },
      ss: { ...base, title: this.hex('#00FFFF'), key: this.hex('#abababff'), tag: this.hex('#00FFFF'), value: this.hex('#2cf72c'), meta: this.hex('#abababff') },
      se: { ...base, title: this.hex('#00FFFF'), key: this.hex('#abababff'), tag: this.hex('#E81123'), value: this.hex('#E81123'), meta: this.hex('#abababff') },
      ht: { ...base, title: this.hex('#90EE90'), key: this.hex('#abababff'), tag: this.hex('#90EE90'), value: this.hex('#abababff'), meta: this.hex('#abababff') },
      hs: { ...base, title: this.hex('#90EE90'), key: this.hex('#abababff'), tag: this.hex('#90EE90'), value: this.hex('#2cf72c'), meta: this.hex('#abababff') },
      he: { ...base, title: this.hex('#90EE90'), key: this.hex('#abababff'), tag: this.hex('#E81123'), value: this.hex('#E81123'), meta: this.hex('#abababff') },
      sb: { ...base, title: this.hex('#fd7949ff'), key: this.hex('#abababff'), tag: this.hex('#fd7949ff'), value: this.hex('#abababff'), meta: this.hex('#abababff') },
      sbs: { ...base, title: this.hex('#fd7949ff'), key: this.hex('#abababff'), tag: this.hex('#fd7949ff'), value: this.hex('#2cf72c'), meta: this.hex('#abababff') },
      sbe: { ...base, title: this.hex('#fd7949ff'), key: this.hex('#abababff'), tag: this.hex('#E81123'), value: this.hex('#E81123'), meta: this.hex('#abababff') },
    };
    return named[name ?? 'default'];
  }

  private hex(code: string): string {
    if (code in this.colors) {
      const raw = this.colors[code].hex;
      return raw.startsWith('#') ? raw : `#${raw}`;
    }
    if (/^#?[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(code)) {
      return code.startsWith('#') ? code : `#${code}`;
    }
    return code;
  }

  private inferCaller(): string {
    const e = new Error();
    const stack = (e.stack || '').split('\n');
    const raw = stack[3] ?? stack[2] ?? '';
    return raw.replace(/\s*at\s*/, '').trim();
  }

  private resolveTag(tag?: string): string {
    if (!tag) return this.symbols['check']?.char ?? '✔';
    const entry = this.symbols[tag];
    return entry?.char ?? tag;
  }

}
