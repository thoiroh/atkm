import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, effect, inject, NgZone, OnInit, signal, viewChild } from '@angular/core';
import { AtkIconComponent } from '@shared/components/atk-icon/atk-icon.component';
import { TerminalInputDirective } from '@shared/directives/terminal-input.directive';
import { ToolsService } from '@shared/services/tools.service';
import { BinanceService } from '../services/binance.service';

@Component({
  selector: 'atk-binance-debug',
  standalone: true,
  imports: [CommonModule, AtkIconComponent, TerminalInputDirective],
  templateUrl: './binance-debug.component.html',
  styles: []
})
export class BinanceDebugComponent implements OnInit {

  // Modern Angular 20 ViewChild syntax for directive reference
  private terminalDirective = viewChild(TerminalInputDirective);

  // Terminal state management (now managed by directive)

  // Component-specific signals
  public typingActive = signal<boolean>(false);
  public cursorVisible = signal<boolean>(true);
  public inputHeight = '500px';

  // Service integration status
  public serviceInjected = signal<boolean>(false);
  public httpClientInjected = signal<boolean>(false);
  public directHttpLoading = signal<boolean>(false);
  public serviceLoading = signal<boolean>(false);
  public lifecycleLog = signal<string[]>([]);
  public currentUrl = signal<string>('');
  public apiBaseUrl = signal<string>('');
  public browserInfo = signal<string>('');

  // Services
  private http = inject(HttpClient);
  private binanceService = inject(BinanceService);
  private destroyRef = inject(DestroyRef);
  private zone = inject(NgZone);
  private tools = inject(ToolsService);

  constructor() {
    this.addLog('Constructor called');
    this.serviceInjected.set(!!this.binanceService);
    this.httpClientInjected.set(!!this.http);
    this.addLog(`Service injection: ${this.serviceInjected() ? 'OK' : 'FAILED'}`);
    this.addLog(`HttpClient injection: ${this.httpClientInjected() ? 'OK' : 'FAILED'}`);

    // Auto-update terminal content when logs change
    effect(() => {
      this.updateTerminalContent();
    }, {});
  }

  public ngOnInit(): void {
    this.startCursorBlink();
    this.addLog('ngOnInit called');
    this.currentUrl.set(window.location.href);
    this.apiBaseUrl.set('http://localhost:8000');
    this.browserInfo.set(navigator.userAgent.split(' ')[0]);
    this.addLog(`Environment loaded - URL: ${this.currentUrl()}`);
  }

  /**
   * Get formatted terminal text for display
   */
  public getTerminalText(): string {
    const header = `1) Service Injection Check:\n${this.serviceInjected() ? '\n✅ BinanceService injected successfully' : '\n❌ BinanceService injection failed'} ${this.httpClientInjected() ? '\n✅ HttpClient injected successfully' : '\n❌ HttpClient injection failed'}`;

    const env = `\n\n2) Environment Check:\n\nCurrent URL: ${this.currentUrl()}\nAPI Base URL: ${this.apiBaseUrl()}\nBrowser: ${this.browserInfo()}`;

    const lifecycleBody = this.formatLifecycleLog();
    const cursor = this.typingActive() && this.cursorVisible() ? ' ▮' : '';
    const lifecycle = `\n\n3) Component Lifecycle Trace:\n\n${lifecycleBody}${cursor}`;

    return `${header}${env}${lifecycle}`;
  }

  /**
   * Update terminal content via directive
   */
  private updateTerminalContent(): void {
    const directive = this.terminalDirective();
    if (!directive) return;

    const newContent = this.getTerminalText();
    // Use directive's insertAtCaret to update content
    directive.clearContent();
  }

  /**
   * Test direct HTTP call using existing logic
   */
  public testDirectHttp(): void {
    this.addLog('🌐 Starting direct HTTP test...', 0);
    const url = 'http://localhost:8000/api/v3/account';

    this.http.get(url).subscribe({
      next: (response) => {
        this.addLog('✅ Direct HTTP SUCCESS');
        this.addLog(JSON.stringify(response, null, 2), -1);

        this.tools.consoleGroup({
          title: 'HTTP Debug · /api/account',
          tag: 'check',
          data: JSON.stringify(response, null, 2),
          palette: 'su',
          collapsed: true,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSizePx: 13
        });
      },
      error: (error: HttpErrorResponse) => {
        this.addLog(`❌ Direct HTTP ERROR: ${error.message}`);
        this.addLog(`ERROR: ${error.status} - ${error.message}\n${JSON.stringify(error.error, null, 2)}`, -1);
      }
    });
  }

  /**
   * Test service call using existing logic
   */
  public testServiceCall(): void {
    this.addLog('🅰️ Starting service call test...', 0);

    try {
      this.binanceService.getAccount().subscribe({
        next: (account) => {
          this.addLog('✅ Service call SUCCESS');
          this.addLog(JSON.stringify(account, null, 2), -1);
        },
        error: (error) => {
          this.addLog(`❌ Service call ERROR: ${error.message}`);
          this.addLog(`ERROR: ${error.message}\n${JSON.stringify(error, null, 2)}`, -1);
        }
      });
    } catch (error: any) {
      this.addLog(`❌ Service call EXCEPTION: ${error.message}`);
    }
  }

  /**
   * Write test code to terminal
   */
  public writecode(): void {
    const message = "Starting test d'utilisation du terminal HTTP test...";
    this.typeLog(message, 0);
  }

  /**
   * Add log entry with formatting
   */
  public addLog(message: string, flag?: number): void {
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
    this.typingActive.set(false);
  }

  /**
   * Add log with typewriter effect
   */
  public async typeLog(message: string, flag?: number): Promise<void> {
    const min = 10;
    const max = 25;
    const timestamp = new Date().toLocaleTimeString();

    const prefix = (() => {
      switch (flag) {
        case -1: return '\n';
        case 0: return `\n\n[${timestamp}] `;
        case 1: return '';
        case 2: return '\n';
        default: return `[${timestamp}] `;
      }
    })();

    this.typingActive.set(true);
    this.lifecycleLog.update(logs => [...logs, prefix]);
    const logIndex = this.lifecycleLog().length - 1;

    for (let i = 0; i < message.length; i++) {
      const char = message[i];
      this.lifecycleLog.update(logs => {
        const copy = logs.slice();
        copy[logIndex] = copy[logIndex] + char;
        return copy;
      });

      // Scroll to bottom using directive
      this.scheduleScroll();

      // Typing delay calculation
      const baseDelay = Math.random() * (max - min) + min;
      const extraDelay =
        char === ' ' ? 40 + Math.random() * 80 :
          /[.,;:!?)]/.test(char) ? 80 + Math.random() * 140 :
            0;

      await new Promise(resolve => setTimeout(resolve, baseDelay + extraDelay));
    }

    this.typingActive.set(false);
  }

  // Helper methods

  private scheduleScroll(): void {
    const directive = this.terminalDirective();
    if (!directive) return;

    this.zone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          directive.scrollToBottom();
        });
      });
    });
  }

  private startCursorBlink(): void {
    this.zone.runOutsideAngular(() => {
      setInterval(() => this.cursorVisible.update(v => !v), 250);
    });
  }

  private formatLifecycleLog(): string {
    const logs = this.lifecycleLog();
    if (!logs.length) return '(no logs yet)';
    return logs.join('\n');
  }

}
