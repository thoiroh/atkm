import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, effect, ElementRef, inject, NgZone, OnInit, signal, ViewChild } from '@angular/core';
import { AtkIconComponent } from '@shared/components/atk-icon/atk-icon.component';
import { BinanceService } from '../services/binance.service';

@Component({
  selector: 'atk-binance-debug',
  standalone: true,
  imports: [CommonModule, AtkIconComponent],
  templateUrl: './binance-debug.component.html',
  styles: []
})
export class BinanceDebugComponent implements OnInit {
  private http = inject(HttpClient);
  private binanceService = inject(BinanceService);
  typingActive = signal<boolean>(false);
  cursorVisible = signal<boolean>(true);
  private typingTimers: number[] = [];

  @ViewChild('ta') textareaRef!: ElementRef<HTMLTextAreaElement>;
  private destroyRef = inject(DestroyRef);
  private zone = inject(NgZone);

  serviceInjected = signal<boolean>(false);
  httpClientInjected = signal<boolean>(false);
  directHttpLoading = signal<boolean>(false);
  directHttpResult = signal<string>('');
  serviceLoading = signal<boolean>(false);
  serviceResult = signal<string>('');
  lifecycleLog = signal<string[]>([]);
  currentUrl = signal<string>('');
  apiBaseUrl = signal<string>('');
  browserInfo = signal<string>('');

  constructor() {
    this.addLog('Constructor called');
    this.serviceInjected.set(!!this.binanceService);
    this.httpClientInjected.set(!!this.http);
    this.addLog(`Service injection: ${this.serviceInjected() ? 'OK' : 'FAILED'}`);
    this.addLog(`HttpClient injection: ${this.httpClientInjected() ? 'OK' : 'FAILED'}`);
    effect(() => {
      // lire les signals utilisés par getTerminalText() pour re-réagir
      void this.getTerminalText();
      this.scheduleScroll();
    }, { allowSignalWrites: true });
  }

  private startCursorBlink(): void {
    this.zone.runOutsideAngular(() => {
      const id = window.setInterval(() => this.cursorVisible.update(v => !v), 500);
      this.typingTimers.push(id);
    });
  }
  private stopAllTimers(): void {
    this.typingTimers.forEach(id => clearInterval(id));
    this.typingTimers.length = 0;
  }

  // machine à écrire dans le log
  async typeLog(message: string, flag?: number, opts?: { min?: number; max?: number }): Promise<void> {
    const min = opts?.min ?? 25;    // ms
    const max = opts?.max ?? 120;   // ms
    // point d’ancrage dans lifecycleLog
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
    this.lifecycleLog.update(logs => [...logs, prefix]);  // crée la ligne
    const idx = this.lifecycleLog().length - 1;

    // saisie caractère par caractère, pauses humaines sur espaces/punctuations
    for (let i = 0; i < message.length; i++) {
      const ch = message[i];
      this.lifecycleLog.update(logs => {
        const copy = logs.slice();
        copy[idx] = copy[idx] + ch;
        return copy;
      });

      // défilement smooth après peinture
      this.scheduleScroll();

      // tempo aléatoire
      const base = Math.random() * (max - min) + min;
      const extra =
        ch === ' ' ? 40 + Math.random() * 80 :
          /[.,;:!?)]/.test(ch) ? 80 + Math.random() * 140 :
            0;
      await new Promise(r => setTimeout(r, base + extra));
    }

    this.typingActive.set(false);
  }

  ngOnInit(): void {
    this.startCursorBlink();
    // this.typeLog('Démarrage de la session...', 0);
    // this.typeLog('Connexion à l’API OK.', -1);
    this.addLog('ngOnInit called');
    this.currentUrl.set(window.location.href);
    this.apiBaseUrl.set('http://localhost:8000');
    this.browserInfo.set(navigator.userAgent.split(' ')[0]);
    this.addLog(`Environment loaded - URL: ${this.currentUrl()}`);
  }

  /** Texte complet injecté dans le <textarea> */
  getTerminalText(): string {
    const header = `1) Service Injection Check:\n ${this.serviceInjected() ? '\n✅ BinanceService injected success' : '\n❌ BinanceService injected failed'} ${this.httpClientInjected() ? '\n✅ HttpClient injected success' : '\n❌ HttpClient injected failed'}`;
    const env = `\n\n2) Environment Check:\n\nCurrent URL: ${this.currentUrl()}\nAPI Base URL: ${this.apiBaseUrl()}\nBrowser: ${this.browserInfo()}`;
    const lifecycleBody = this.formatLifecycleLog();
    const cursor = this.typingActive() && this.cursorVisible() ? ' ▌' : '';
    const lifecycle = `\n\n3) Component Lifecycle Trace:\n\n${lifecycleBody}${cursor}`;
    return `${header}${env}${lifecycle}`;
  }

  private formatLifecycleLog(): string {
    const logs = this.lifecycleLog();
    if (!logs.length) return '(no logs yet)';
    return logs.join('\n');
  }

  testDirectHttp(): void {
    this.addLog('🌐 Starting direct HTTP test...', 0);
    // this.directHttpLoading.set(true);
    // this.directHttpResult.set('');
    const url = 'http://localhost:8000/api/v3/account';

    this.http.get(url).subscribe({
      next: (response) => {
        this.addLog('✅ Direct HTTP SUCCESS');
        this.addLog(JSON.stringify(response, null, 2), -1);
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

  testServiceCall(): void {

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

  autoResize(textarea: HTMLTextAreaElement): void {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  scrollToBottom(textarea: HTMLTextAreaElement): void {
    // remet la position du curseur tout en bas
    textarea.scrollTop = textarea.scrollHeight;
  }

  private addLog(message: string, flag?: number): void {
    const timestamp = new Date().toLocaleTimeString();
    let logEntry;
    switch (flag) {
      case -1:
        logEntry = `\n${message}`;
        break
      case 0:
        logEntry = `\n\n[${timestamp}] ${message}`;
        break
      case 1:
        logEntry = `${message}\n`;
        break
      case 2:
        logEntry = `\n${message}\n`;
        break
      default:
        logEntry = `[${timestamp}] ${message}`;
    }
    this.lifecycleLog.update(logs => [...logs, logEntry]);
    console.log(`>Debug: ${logEntry}`);
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
          catch { ta.scrollTop = end; } // fallback vieux navigateurs
        });
      });
    });
  }


}
