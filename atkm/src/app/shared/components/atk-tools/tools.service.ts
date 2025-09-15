import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

// NOTE: enable in tsconfig.json:  "resolveJsonModule": true, "esModuleInterop": true
import colors from '@assets/config/tools-configs/console-logger.config.colors.json';
import symbols from '@assets/config/tools-configs/console-logger.config.symbols.json';
import { ConsoleLogger, GroupOptions } from '@shared/components/atk-tools/console-logger.tool';

/**
 * ToolsService — lean, reusable utilities.
 * All comments are in English as requested.
 */
interface Timer { id: number; timer: any; }

@Injectable({ providedIn: 'root' })
export class ToolsService {
  private timers: Timer[] = [];
  private logger = new ConsoleLogger(colors, symbols);

  constructor(private httpClient: HttpClient) { }

  // ─────────────────────────────── Timers
  /** Start a one-shot timer and auto-clean it on completion. */
  public startTimer(id: number, durationMs: number): void {
    const timer = setTimeout(() => {
      this.logger.group({ title: `Timer ${id} done`, data: { id, durationMs }, palette: 'info', collapsed: true });
      this.timers = this.timers.filter(t => t.id !== id);
    }, durationMs);
    this.timers.push({ id, timer });
  }

  /** Stop and clear all known timers. */
  public stopAllTimers(): void {
    this.timers.forEach(t => clearTimeout(t.timer));
    this.timers = [];
  }

  // ─────────────────────────────── HTTP / Files
  /** Fetch a file as Blob. Throws on invalid path. */
  public getFileObjectFromPath(filePath: string) {
    if (!filePath || typeof filePath !== 'string') {
      throw new Error('Invalid path: Path must be a non-empty string');
    }
    return this.httpClient.get(filePath, { responseType: 'blob' });
  }

  // ─────────────────────────────── Numbers / Random
  /** Inclusive random integer between min and max. */
  public getRandomInt(min: number, max: number): number {
    if (max < min) [min, max] = [max, min];
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // ─────────────────────────────── Arrays / Sorting
  /** Sort array of objects by "index" property (numeric asc). */
  public sortArrayOfObjectsByIndex<T extends Record<string, any>>(sourceArray: T[]): T[] {
    return [...sourceArray].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  }

  // ─────────────────────────────── Dates
  /** Convert date string to Unix timestamp in ms. */
  public convertDateStringToTimestamp(datestring: string): number {
    return new Date(datestring).getTime();
  }

  /** Convert Unix timestamp (ms) to ISO string. */
  public convertTimestampToDateString(timestampMs: number): string {
    return new Date(timestampMs).toISOString();
  }

  /** Generate contiguous 3-month ranges between start and end (true calendar months). */
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

  // ─────────────────────────────── Strings / Units
  /** Parse "<number>px" into number. Example: "16px" -> 16 */
  public convertPropertyValueToNum(property: string): number {
    const m = /^(-?\d+(\.\d+)?)px$/.exec(property);
    if (!m) throw new Error('Expected a px value like "16px"');
    return parseFloat(m[1]);
  }

  /** Pad number to 3 characters with leading zeros. */
  public formatSourceToStringPad(n: number): string {
    return n.toString().padStart(3, '0');
  }

  // ─────────────────────────────── Logging
  /**
   * General-purpose console group with custom header font and collapsed control.
   */
  public consoleGroup(opts: GroupOptions): void {
    this.logger.group(opts);
  }
}
