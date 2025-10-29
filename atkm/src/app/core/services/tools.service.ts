import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';

import colors from '@core/tools/console-logger.config.colors.json';
import symbols from '@core/tools/console-logger.config.symbols.json';
import { ConsoleLogger, ConsoleLoggerOptions } from '@core/tools/console-logger.tool';
import { filter, pairwise, take } from 'rxjs';

interface Timer { id: number; timer: any; };

let busy = false;
export function navigateSafely(commands: any[], extras?: any) {
  if (busy) return;
  busy = true;
  const router = inject(Router);
  router.navigate(commands, extras).finally(() => (busy = false));
}

export function chunk<T>(arr: T[], size = 500): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

export async function processBigList<T>(
  items: T[],
  heavyWork: (part: T[]) => void,
  size = 500
) {
  for (const part of chunk(items, size)) {
    heavyWork(part);
    await new Promise(r => setTimeout(r));
  }
}

@Injectable({ providedIn: 'root' })
export class ToolsService {
  private timers: Timer[] = [];
  private logger = new ConsoleLogger(colors, symbols);
  private router = inject(Router);

  constructor(private httpClient: HttpClient) { }

  private readonly ROUTE_BANNER_BG = '#656565ff';
  private readonly ROUTE_BANNER_PAD_Y = '10px';
  private readonly ROUTE_BANNER_PAD_L = '22px';
  private readonly ROUTE_BANNER_PAD_R = '22px';
  private readonly ROUTE_BANNER_WIDTH = 85;

  /**
   * Enable logging of route changes with unified banner
   * - Log d'init (first NavigationEnd)
   * - Logs "from → to" ensuite
   * @date 29/10/2025
   */
  public setupRouteChangeLogging(): void {
    // Première navigation terminée -> log d’init
    this.router.events
      .pipe(
        filter((e: any): e is NavigationEnd => e instanceof NavigationEnd),
        take(1)
      )
      .subscribe(first => {
        // Ton splash habituel, puis la bannière d’init
        this.logAtk?.();
        this.logRouteBanner('(init)', first.urlAfterRedirects);
      });

    // Navigations suivantes -> from → to
    this.router.events
      .pipe(
        filter((e: any): e is NavigationEnd => e instanceof NavigationEnd),
        pairwise()
      )
      .subscribe(([prev, curr]) => {
        const from = prev.urlAfterRedirects;
        const to = curr.urlAfterRedirects;
        if (from === to) return;
        this.logRouteBanner(from, to);
      });
  }

  /**
   * rendering of the banner with constant width
   *
   * @date 29/10/2025
   * @param from @param to
   */
  private logRouteBanner(from: string, to: string): void {
    const plain = ` ROUTE CHANGE from ${from} → ${to} `;
    const padCount = Math.max(0, this.ROUTE_BANNER_WIDTH - plain.length);
    const filler = ' '.repeat(padCount);

    const bg = this.ROUTE_BANNER_BG;
    const padY = this.ROUTE_BANNER_PAD_Y;
    const padLeft = this.ROUTE_BANNER_PAD_L;
    const padRight = this.ROUTE_BANNER_PAD_R;

    const styleLabel = `background:${bg}; color:#fff; font-weight:bold; text-decoration:underline; padding:${padY} 0 ${padY} ${padLeft}; border-radius:6px 0 0 6px;`;
    const styleSep = `background:${bg}; color:#bbb; padding:${padY} 0;`;
    const styleFrom = `background:${bg}; color:#4fc3f7; padding:${padY} 0;`;
    const styleTo = `background:${bg}; color:#4fc3f7; padding:${padY} ${padRight} ${padY} 0; border-radius:0 6px 6px 0;`;

    console.log(
      `\n%cROUTE CHANGE%c from%c ${from} %c→%c ${to}${filler}`,
      styleLabel, // "ROUTE CHANGE"
      styleSep,   // " from"
      styleFrom,  // route from
      styleSep,   // arrow
      styleTo     // route to + filler final
    );
  }

  /**
   * Start a one-shot timer and auto-clean it on completion.
   * @date 28/10/2025
   * @param id  @param durationMs
   */
  public startTimer(id: number, durationMs: number): void {
    const timer = setTimeout(() => {
      this.logger.group({ title: `Timer ${id} done`, data: { id, durationMs }, palette: 'in', collapsed: true });
      this.timers = this.timers.filter(t => t.id !== id);
    }, durationMs);
    this.timers.push({ id, timer });
  }

  /**
   * Stop and clear all known timers.
   * @date 28/10/2025
   */
  public stopAllTimers(): void {
    this.timers.forEach(t => clearTimeout(t.timer));
    this.timers = [];
  }

  /**
   * Fetch a file as Blob. Throws on invalid path.
   * @param filePath
   * @date 08/10/2025
   */
  public getFileObjectFromPath(filePath: string) {
    if (!filePath || typeof filePath !== 'string') {
      throw new Error('Invalid path: Path must be a non-empty string');
    }
    return this.httpClient.get(filePath, { responseType: 'blob' });
  }

  /**
   * Get random integer between min and max (inclusive).
   * @param min @param max
   * @date 08/10/2025
   */
  public getRandomInt(min: number, max: number): number {
    if (max < min) [min, max] = [max, min];
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Sort array of objects by "index" property (numeric asc). If "index" is missing, treat as 0.
   * @template T @param sourceArray
   * @date 08/10/2025
   */
  public sortArrayOfObjectsByIndex<T extends Record<string, any>>(sourceArray: T[]): T[] {
    return [...sourceArray].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  }

  /**
   * Convert date string to Unix timestamp in ms.
   * @param datestring
   * @date 08/10/2025
   */
  public convertDateStringToTimestamp(datestring: string): number {
    return new Date(datestring).getTime();
  }

  /**
   * Convert Unix timestamp (ms) to ISO string.
   * @param timestampMs
   * @date 08/10/2025
   */
  public convertTimestampToDateString(timestampMs: number): string {
    return new Date(timestampMs).toISOString();
  }

  /**
   * Generate contiguous 3-month ranges between start and end (true calendar months).
   * @param { startTime, endTime }
   * @date 08/10/2025
   */
  public generateThreeMonthRanges({ startTime, endTime }: { startTime: number; endTime: number }): Array<{ start: number; end: number }> {
    if (endTime < startTime) [startTime, endTime] = [endTime, startTime];
    const ranges: Array<{ start: number; end: number }> = [];
    const start = new Date(startTime);
    let s = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
    while (s.getTime() < endTime) {
      const e = new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth() + 3, 0, 23, 59, 59, 999));
      const rangeEnd = Math.min(e.getTime(), endTime);
      ranges.push({ start: s.getTime(), end: rangeEnd });
      s = new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth() + 3, 1));
    }
    return ranges;
  }

  /**
   * Convert CSS property value in "px" to number.
   * @param property
   * @date 08/10/2025
   */
  public convertPropertyValueToNum(property: string): number {
    const m = /^(-?\d+(\.\d+)?)px$/.exec(property);
    if (!m) throw new Error('Expected a px value like "16px"');
    return parseFloat(m[1]);
  }


  /**
   * Pad number to 3 digits with leading zeros.
   * @param n
   * @date 08/10/2025
   */
  public formatSourceToStringPad(n: number): string {
    return n.toString().padStart(3, '0');
  }


  /**
   * Log a console group with custom options.
   * @param opts
   * @date 08/10/2025
   */
  public consoleGroup(opts: ConsoleLoggerOptions): void {
    this.logger.group(opts);
  }

  /**
   * @description Logs atk
   */
  public logAtk(): void {
    const tsms = Math.floor(Date.now() / 1000);
    const tss = tsms * 1000;
    const date = new Date(tss);
    // const event = new Date(Date.UTC(2012, 11, 20, 3, 0, 0));
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      year: 'numeric',
      month: '2-digit',   // Assure que le mois est sur deux chiffres
      day: '2-digit',     // Assure que le jour est sur deux chiffres
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    };
    const dateFormated = date.toLocaleDateString('en-US', options)

    console.log("  ");
    console.log("%c/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\", "color: #FFFF00;");
    console.log("%c\\/                                                                                      \\/", "color: #FFFF00;");
    console.log("%c/\\%c                              ###     #########     ##                              %c  /\\", "color: #FFFF00;", "color: #FF00FF;", "color: #FFFF00;");
    console.log("%c\\/%c                             ## ##           ##     ##                              %c  \\/", "color: #FFFF00;", "color: #FF00FF;", "color: #FFFF00;");
    console.log("%c/\\%c                            ##   ##          ##     ##                              %c  /\\", "color: #FFFF00;", "color: #FF00FF;", "color: #FFFF00;");
    console.log("%c\\/%c                           ##     ##         ##     ###                             %c  \\/", "color: #FFFF00;", "color: #FF00FF;", "color: #FFFF00;");
    console.log("%c/\\%c                          ##       ##        ##     ## ##                           %c  /\\", "color: #FFFF00;", "color: #FF00FF;", "color: #FFFF00;");
    console.log("%c\\/%c                         ##         ##       ##     ##   ##                         %c  \\/", "color: #FFFF00;", "color: #FF00FF;", "color: #FFFF00;");
    console.log("%c/\\%c                        ##    #########      ##     ##     ##                       %c  /\\", "color: #FFFF00;", "color: #FF00FF;", "color: #FFFF00;");
    console.log("%c\\/                                                                                      \\/", "color: #FFFF00;");
    console.log(`%c/\\              {  atomeek_matrix }   =>   { [ ${tsms}, ${tsms} ] }               /\\`, "color: #FFFF00;");
    console.log(`%c\\/              {  \u{1F496}  iasct  \u{1F496} }   =>   { [ ${dateFormated} ] }         \\/`, "color: #FFFF00;");
    console.log("%c/\\                                                                                      /\\", "color: #FFFF00;");
    console.log("%c\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/", "color: #FFFF00;");
    // console.log("  ");
  }
}
