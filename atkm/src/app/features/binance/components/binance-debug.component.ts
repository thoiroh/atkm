import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, effect, ElementRef, inject, NgZone, OnInit, signal, ViewChild } from '@angular/core';
import { AtkIconComponent } from '@shared/components/atk-icon/atk-icon.component';
import { ToolsService } from '../../../shared/components/atk-tools/tools.service';
import { BinanceService } from '../services/binance.service';

@Component({
  selector: 'atk-binance-debug',
  standalone: true,
  imports: [CommonModule, AtkIconComponent],
  templateUrl: './binance-debug.component.html',
  styles: []
})
export class BinanceDebugComponent implements OnInit {
  // 1) Decorated properties
  @ViewChild('ta') private textareaRef!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('hl') private highlightRef!: ElementRef<HTMLDivElement>;

  public onTAScroll(): void {
    const ta = this.textareaRef?.nativeElement;
    const hl = this.highlightRef?.nativeElement;
    if (!ta || !hl) return;
    hl.scrollTop = ta.scrollTop;
    hl.scrollLeft = ta.scrollLeft;
  }

  private escapeHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  public highlightedHtml(): string {
    const raw = this.getTerminalText(); // déjà construit depuis tes signaux
    const esc = this.escapeHtml(raw);

    // 1) surligner la ligne courante
    const lines = esc.split('\n');
    const idx = Math.max(0, Math.min(this.line() - 1, lines.length - 1));
    lines[idx] = `<mark class="hl-line">${lines[idx]}</mark>`;
    let html = lines.join('\n');

    // 2) surligner le mot courant (dans la ligne courante)
    const word = this.currentWord();
    if (word) {
      const re = new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`);
      lines[idx] = lines[idx].replace(re, `<span class="hl-word">$1</span>`);
      html = lines.join('\n');
    }

    // 3) surligner la sélection (première occurrence simple)
    const sel = this.selectionText();
    if (sel) {
      const reSel = new RegExp(sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      html = html.replace(reSel, `<mark class="hl-sel">${sel}</mark>`);
    }

    // Préserver retours ligne
    return html.replace(/\n/g, '<br/>');
  }

  // 2) Public properties (used in the template)
  public typingActive = signal<boolean>(false);
  public cursorVisible = signal<boolean>(true);
  public inputHeight = '500px';

  public serviceInjected = signal<boolean>(false);
  public httpClientInjected = signal<boolean>(false);
  public directHttpLoading = signal<boolean>(false);
  public directHttpResult = signal<string>('');
  public serviceLoading = signal<boolean>(false);
  public serviceResult = signal<string>('');
  public lifecycleLog = signal<string[]>([]);
  public currentUrl = signal<string>('');
  public apiBaseUrl = signal<string>('');
  public browserInfo = signal<string>('');

  public caretIndex = signal<number>(0);
  public selStart = signal<number>(0);
  public selEnd = signal<number>(0);
  public line = signal<number>(1);
  public column = signal<number>(1);
  public selectionText = signal<string>('');
  public currentLineText = signal<string>('');
  public currentWord = signal<string>('');

  // 3) Private properties
  private http = inject(HttpClient);
  private binanceService = inject(BinanceService);
  private typingTimers: number[] = [];
  private destroyRef = inject(DestroyRef);
  private zone = inject(NgZone);

  // 4) Constructor
  constructor(private tools: ToolsService) {

    this.addLog('Constructor called');
    this.serviceInjected.set(!!this.binanceService);
    this.httpClientInjected.set(!!this.http);
    this.addLog(`Service injection: ${this.serviceInjected() ? 'OK' : 'FAILED'}`);
    this.addLog(`HttpClient injection: ${this.httpClientInjected() ? 'OK' : 'FAILED'}`);

    effect(() => {
      // Re-run when signals used by getTerminalText() change
      void this.getTerminalText();
      this.scheduleScroll();
    }, {});
  }

  // 5) Angular lifecycle hooks
  public ngOnInit(): void {
    this.startCursorBlink();
    // this.typeLog('Session start...', 0);
    // this.typeLog('API connection OK.', -1);
    this.log('ngOnInit called');
    this.currentUrl.set(window.location.href);
    this.apiBaseUrl.set('http://localhost:8000');
    this.browserInfo.set(navigator.userAgent.split(' ')[0]);
    this.addLog(`Environment loaded - URL: ${this.currentUrl()}`);
  }

  // 6) Public methods (used by template or UI)

  /** Full text injected into the <textarea> */
  public getTerminalText(): string {
    const header = `1) Service Injection Check:\n ${this.serviceInjected() ? '\n✅ BinanceService injected success' : '\n❌ BinanceService injected failed'} ${this.httpClientInjected() ? '\n✅ HttpClient injected success' : '\n❌ HttpClient injected failed'}`;
    const env = `\n\n2) Environment Check:\n\nCurrent URL: ${this.currentUrl()}\nAPI Base URL: ${this.apiBaseUrl()}\nBrowser: ${this.browserInfo()}`;
    const lifecycleBody = this.formatLifecycleLog();
    const cursor = this.typingActive() && this.cursorVisible() ? ' ▮' : '';
    const lifecycle = `\n\n3) Component Lifecycle Trace:\n\n${lifecycleBody}${cursor}`;
    return `${header}${env}${lifecycle}`;
  }

  /**
   * Unified logger.
   * Chooses between instant append and typewriter effect based on message length or an explicit override.
   * @param message The message to log
   * @param options Optional parameters
   *  - flag: formatting flag (-1 new line before, 0 timestamped on new paragraph, 1 trailing newline, 2 surrounding newlines)
   *  - min, max: typing delay bounds in ms
   *  - typeThreshold: min length to trigger typing effect automatically (default 60)
   *  - force: 'type' | 'instant' to override the automatic choice
   */
  public async log(
    message: string,
    options?: { flag?: number; min?: number; max?: number; typeThreshold?: number; force?: 'type' | 'instant' }
  ): Promise<void> {
    const threshold = options?.typeThreshold ?? 60;
    const shouldType = options?.force
      ? options.force === 'type'
      : message.length >= threshold;

    if (shouldType) {
      await this.typeLogInternal(message, options?.flag, { min: options?.min, max: options?.max });
    } else {
      this.addLogInternal(message, options?.flag);
    }
  }

  /** Backward-compat wrapper: always typewriter */
  public async typeLog(message: string, flag?: number, opts?: { min?: number; max?: number }): Promise<void> {
    await this.log(message, { flag, min: opts?.min, max: opts?.max, force: 'type' });
  }

  /** Backward-compat wrapper: always instant */
  public addLog(message: string, flag?: number): void {
    void this.log(message, { flag, force: 'instant' });
  }

  public writecode(): void {
    const message = "Starting test d'utilisation du terminal HTTP test...";
    void this.log(message, { flag: 0, force: 'type' });
  }

  public testDirectHttp(): void {
    this.addLog('🌐 Starting direct HTTP test...', 0);
    // this.directHttpLoading.set(true);
    // this.directHttpResult.set('');
    const url = 'http://localhost:8000/api/v3/account';

    this.http.get(url).subscribe({
      next: (response) => {
        this.addLog('✅ Direct HTTP SUCCESS');
        this.addLog(JSON.stringify(response, null, 2), -1);
        // BUG CONSOLE LOG in progress ==================================================
        this.tools.consoleGroup({
          title: 'HTTP Debug · /api/users',
          tag: 'check',           // clé du JSON ou texte libre
          data: JSON.stringify(response, null, 2),
          palette: 'info',        // 'default' | 'info' | 'warn' | 'error' | 'accent'
          collapsed: true,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSizePx: 13
        });
        // this.directHttpResult.set(JSON.stringify(response, null, 2));
        // this.directHttpLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.addLog(`❌ Direct HTTP ERROR: ${error.message}`);
        this.addLog(`ERROR: ${error.status} - ${error.message}\n${JSON.stringify(error.error, null, 2)}`, -1);
        // this.directHttpResult.set(`ERROR: ${error.status} - ${error.message}\n${JSON.stringify(error.error, null, 2)}`);
        // this.directHttpLoading.set(false);
      }
    });
  }

  public testServiceCall(): void {
    this.addLog('🅰️ Starting service call test...', 0);
    // this.serviceLoading.set(true);
    // this.serviceResult.set('');

    try {
      this.binanceService.getAccount().subscribe({
        next: (account) => {
          this.addLog('✅ Service call SUCCESS');
          this.addLog(JSON.stringify(account, null, 2), -1);
          // this.serviceResult.set(JSON.stringify(account, null, 2));
          // this.serviceLoading.set(false);
        },
        error: (error) => {
          this.addLog(`❌ Service call ERROR: ${error.message}`);
          this.addLog(`ERROR: ${error.message}\n${JSON.stringify(error, null, 2)}`, -1);
          // this.serviceResult.set(`ERROR: ${error.message}\n${JSON.stringify(error, null, 2)}`);
          // this.serviceLoading.set(false);
        }
      });
    } catch (error: any) {
      this.addLog(`❌ Service call EXCEPTION: ${error.message}`);
      // this.serviceResult.set(`EXCEPTION: ${error.message}`);
      // this.serviceLoading.set(false);
    }
  }

  public autoResize(textarea: HTMLTextAreaElement): void {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  public scrollToBottom(textarea: HTMLTextAreaElement): void {
    // Move the caret to the bottom
    textarea.scrollTop = textarea.scrollHeight;
  }

  public onTAEvent(): void {
    const ta = this.textareaRef?.nativeElement;
    if (!ta) return;

    const value = ta.value;
    const start = ta.selectionStart ?? 0;
    const end = ta.selectionEnd ?? start;

    this.selStart.set(start);
    this.selEnd.set(end);
    this.caretIndex.set(end);

    // Compute line and column (1-based)
    const upToCaret = value.slice(0, end);
    const lines = upToCaret.split('\n');
    const lineNumber = lines.length;
    const colNumber = lines[lines.length - 1].length + 1;
    this.line.set(lineNumber);
    this.column.set(colNumber);

    // Current line text
    const fullLines = value.split('\n');
    const currentLineText = fullLines[lineNumber - 1] ?? '';
    this.currentLineText.set(currentLineText);

    // Current word around caret (simple word chars heuristic)
    const left = currentLineText.slice(0, colNumber - 1);
    const right = currentLineText.slice(colNumber - 1);
    const leftWord = left.match(/[A-Za-z0-9_\-]+$/)?.[0] ?? '';
    const rightWord = right.match(/^[A-Za-z0-9_\-]+/)?.[0] ?? '';
    this.currentWord.set(leftWord + rightWord);

    // Selected text
    this.selectionText.set(start !== end ? value.slice(start, end) : '');
  }

  /** Optional: place caret explicitly at index (clamped). */
  public setCaret(index: number): void {
    const ta = this.textareaRef?.nativeElement;
    if (!ta) return;
    const len = ta.value.length;
    const i = Math.max(0, Math.min(index, len));
    ta.setSelectionRange(i, i);
    ta.focus();
    this.onTAEvent();
  }

  /** Optional: insert text at caret, keep scroll smooth. */
  public insertAtCaret(text: string): void {
    const ta = this.textareaRef?.nativeElement;
    if (!ta) return;
    const start = ta.selectionStart ?? 0;
    const end = ta.selectionEnd ?? start;
    const value = ta.value;
    ta.value = value.slice(0, start) + text + value.slice(end);
    const newPos = start + text.length;
    ta.setSelectionRange(newPos, newPos);
    this.onTAEvent();
    this.scheduleScroll();
  }

  /** Instant append into lifecycleLog */
  private addLogInternal(message: string, flag?: number): void {
    const timestamp = new Date().toLocaleTimeString();
    let logEntry: string;
    switch (flag) {
      case -1:
        logEntry = `\n${message}`;
        break;
      case 0:
        logEntry = `\n\n[${timestamp}] ${message}`;
        break;
      case 1:
        logEntry = `${message}\n`;
        break;
      case 2:
        logEntry = `\n${message}\n`;
        break;
      default:
        logEntry = `[${timestamp}] ${message}`;
    }
    this.lifecycleLog.update(logs => [...logs, logEntry]);
    // console.log(`>Debug: ${logEntry}`);
    this.typingActive.set(false);

  }

  /** Typewriter effect into lifecycleLog */
  private async typeLogInternal(message: string, flag?: number, opts?: { min?: number; max?: number }): Promise<void> {
    const min = opts?.min ?? 10;    // ms
    const max = opts?.max ?? 25;   // ms
    const ts = new Date().toLocaleTimeString();
    const prefix = (() => {
      switch (flag) {
        case -1: return '\n';
        case 0: return `\n\n[${ts}] `;
        case 1: return '';
        case 2: return `\n`;
        default: return `[${ts}] `;
      }
    })();

    this.typingActive.set(true);
    this.lifecycleLog.update(logs => [...logs, prefix]);  // Create the line
    const idx = this.lifecycleLog().length - 1;

    for (let i = 0; i < message.length; i++) {
      const ch = message[i];
      this.lifecycleLog.update(logs => {
        const copy = logs.slice();
        copy[idx] = copy[idx] + ch;
        return copy;
      });

      // Smooth scroll after paint
      this.scheduleScroll();

      // Random tempo
      const base = Math.random() * (max - min) + min;
      const extra =
        ch === ' ' ? 40 + Math.random() * 80 :
          /[.,;:!?)]/.test(ch) ? 80 + Math.random() * 140 :
            0;
      await new Promise(r => setTimeout(r, base + extra));
    }

    this.typingActive.set(false);
  }

  private scheduleScroll(): void {
    this.zone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const ta = this.textareaRef?.nativeElement;
          if (!ta) return;
          const end = ta.scrollHeight - ta.clientHeight;
          if (end <= 0) return;
          try { ta.scrollTo({ top: end, behavior: 'smooth' }); }
          catch { ta.scrollTop = end; } // Fallback for older browsers
        });
      });
    });
  }

  // 7) Private utility methods
  private startCursorBlink(): void {
    this.zone.runOutsideAngular(() => {
      const id = window.setInterval(() => this.cursorVisible.update(v => !v), 250);
      this.typingTimers.push(id);
    });
  }

  private stopAllTimers(): void {
    this.typingTimers.forEach(id => clearInterval(id));
    this.typingTimers.length = 0;
  }

  private formatLifecycleLog(): string {
    const logs = this.lifecycleLog();
    if (!logs.length) return '(no logs yet)';
    return logs.join('\n');
  }
}
