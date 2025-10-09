// src/app/shared/directives/terminal-input.directive.ts
// Unified directive: cursor tracking + auto-resize + auto-scroll (Angular 20 signals API)
//
// Public API (backward-compatible):
// Inputs:
//   - autoResize?: boolean = false
//   - autoScroll?: boolean = true
//   - smoothScroll?: boolean = true   // alias of autoScroll (kept for compatibility)
//   - maxHeight?: string = '800px'
// Outputs:
//   - stateChange: TerminalInputState
//   - contentChange: string
//   - scrollChange: TerminalScrollState
// Methods:
//   - insertAtCaret(text: string): void
//   - appendText(text: string): void
//   - setContent(content: string): void
//   - clearContent(): void
//   - getCurrentState(): TerminalInputState
//   - getScrollState(): TerminalScrollState | null
//   - performAutoResize(): void
//   - scrollToBottom(): void
//
// Host events handled:
//   input, scroll, keyup, click, select, focus
//
// Notes:
// - When content is modified programmatically (setContent/insertAtCaret/appendText/clearContent),
//   the directive emits contentChange and stateChange, triggers autoResize (if enabled) and
//   scrolls to bottom (if autoScroll/smoothScroll enabled).
// - This file merges features from the simplified auto-scroll version and the richer cursor-tracking version.

import { Directive, ElementRef, inject, input, OnInit, output } from '@angular/core';
// import { ToolsService } from '../services/tools.service';

// ----- State types -----
export interface TerminalInputState {
  caretIndex: number;
  selectionStart: number;
  selectionEnd: number;
  line: number;
  column: number;
  selectionText: string;
  currentLineText: string;
  currentWord: string;
  textValue: string;
}

export interface TerminalScrollState {
  scrollTop: number;
  scrollLeft: number;
  contentHeight: number;
  visibleHeight: number;
  textValue: string;
}

@Directive({
  selector: 'textarea[atkTerminalInput]',
  standalone: true,
  host: {
    '(input)': 'onContentChange()',
    '(scroll)': 'onScrollEvent()',
    '(keyup)': 'updateState()',
    '(click)': 'updateState()',
    '(select)': 'updateState()',
    '(focus)': 'onScrollToBottom()'
  }
})
export class TerminalInputDirective implements OnInit {

  // ======================================================
  // DEPENDENCIES & INPUTS / OUTPUTS
  // ======================================================

  private elementRef = inject(ElementRef<HTMLTextAreaElement>);
  // private readonly tools = inject(ToolsService);

  // ----- Inputs (signals API) -----
  autoResize = input<boolean>(false);
  autoScroll = input<boolean>(true);
  // Back-compat for existing templates using [smoothScroll]
  smoothScroll = input<boolean | null>(null);
  maxHeight = input<string>('200px');
  // ----- Outputs -----
  stateChange = output<TerminalInputState>();
  contentChange = output<string>();
  scrollChange = output<TerminalScrollState>();
  // ----- Element ref -----

  // ======================================================
  // LIFECYCLE
  // ======================================================

  ngOnInit(): void {
    const textarea = this.getTextarea();
    if (!textarea) {
      throw new Error('atkTerminalInput directive can only be applied to <textarea> elements');
    }

    // Initial resize/scroll
    if (this.autoResize()) { this.performAutoResize(); }
    // Defer to next frame to ensure layout is ready
    if (this.isAutoScrollEnabled()) { this.raf(() => this.scrollToBottom()); }
    // Emit initial state
    this.updateState();
    // this.tools.consoleGroup({ // OFF TerminalInputDirective -> ngOnInit() ================ CONSOLE LOG IN PROGRESS
    //   title: `TerminalInputDirective -> ngOnInit()`, tag: 'check', palette: 'wa', collapsed: true,
    //   data: textarea
    // });

  }

  // ======================================================
  // PUBLIC METHODS
  // ======================================================

  public onContentChange(): void {
    const textarea = this.getTextarea();

    if (!textarea) return;

    // Emit textual change
    this.contentChange.emit(textarea.value);
    // Maintain resize/state/scroll
    if (this.autoResize()) { this.performAutoResize(); }
    this.updateState();
    // Slight delay to let DOM heights settle
    if (this.isAutoScrollEnabled()) {
      setTimeout(() => this.scrollToBottom(), 10);
    }
  }

  public onScrollEvent(): void {
    const textarea = this.getTextarea();
    if (!textarea) return;

    const payload: TerminalScrollState = {
      scrollTop: textarea.scrollTop,
      scrollLeft: textarea.scrollLeft,
      contentHeight: textarea.scrollHeight,
      visibleHeight: textarea.clientHeight,
      textValue: textarea.value
    };
    this.scrollChange.emit(payload);
  }

  public onScrollToBottom(): void {
    if (this.isAutoScrollEnabled()) { this.scrollToBottom(); }
  }

  // ======================================================
  // PUBLIC API
  // ======================================================

  public insertAtCaret(text: string): void {
    const textarea = this.getTextarea();
    if (!textarea) return;
    const { selectionStart = textarea.value.length, selectionEnd = textarea.value.length } = textarea;
    const before = textarea.value.slice(0, selectionStart);
    const after = textarea.value.slice(selectionEnd);
    textarea.value = before + text + after;
    // Place caret after inserted text
    const newCaret = before.length + text.length;
    textarea.selectionStart = textarea.selectionEnd = newCaret;
    // Synthesize full pipeline
    this.onContentChange();
    textarea.focus();
  }

  public appendText(text: string): void {
    const textarea = this.getTextarea();
    if (!textarea) return;
    textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
    this.insertAtCaret(text);
  }

  public setContent(content: string): void {
    const textarea = this.getTextarea();
    if (!textarea) return;
    textarea.value = content;
    // Place caret at end
    textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
    this.onContentChange();
  }

  public clearContent(): void {
    this.setContent('');
  }

  /**
   * Get current state of the terminal input.
   *
   * @date 09/10/2025
   * @return {*}
   */
  public getCurrentState(): TerminalInputState {
    const textarea = this.getTextarea();
    if (!textarea) {
      // Return a neutral state if called too early
      return {
        caretIndex: 0,
        selectionStart: 0,
        selectionEnd: 0,
        line: 1,
        column: 1,
        selectionText: '',
        currentLineText: '',
        currentWord: '',
        textValue: ''
      };
    }

    const value = textarea.value ?? '';
    const selectionStart = textarea.selectionStart ?? 0;
    const selectionEnd = textarea.selectionEnd ?? selectionStart;
    // Compute line/column
    const lines = value.split('\n');
    let acc = 0;
    let lineIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      const lineLen = lines[i].length + (i < lines.length - 1 ? 1 : 0);
      if (selectionStart <= acc + lineLen) {
        lineIndex = i;
        break;
      }
      acc += lineLen;
    }
    const lineStartPos = value.lastIndexOf('\n', selectionStart - 1) + 1;
    const column = selectionStart - lineStartPos + 1;
    const currentLineText = lines[lineIndex] ?? '';
    const currentWord = this.extractWordAt(currentLineText, column - 1);

    return {
      caretIndex: selectionStart,
      selectionStart,
      selectionEnd,
      line: lineIndex + 1,
      column,
      selectionText: value.slice(selectionStart, selectionEnd),
      currentLineText,
      currentWord,
      textValue: value
    };
  }

  public getScrollState(): TerminalScrollState | null {
    const textarea = this.getTextarea();
    if (!textarea) return null;
    return {
      scrollTop: textarea.scrollTop,
      scrollLeft: textarea.scrollLeft,
      contentHeight: textarea.scrollHeight,
      visibleHeight: textarea.clientHeight,
      textValue: textarea.value
    };
  }

  public performAutoResize(): void {
    const textarea = this.getTextarea();
    if (!textarea) return;
    // Reset height to compute scrollHeight precisely
    textarea.style.height = 'auto';
    const max = this.parseMaxHeight();
    const next = Math.min(textarea.scrollHeight, max);
    textarea.style.height = `${next}px`;
    // Overflow handling
    textarea.style.overflowY = textarea.scrollHeight > next ? 'auto' : 'hidden';
  }

  public scrollToBottom(): void {
    const textarea = this.getTextarea();
    if (!textarea) return;
    const target = textarea.scrollHeight - textarea.clientHeight;
    if (target <= 0) return;
    // Try smooth scroll, fallback to assignment
    try {
      textarea.scrollTo({ top: target, behavior: 'smooth' });
    } catch {
      textarea.scrollTop = target;
    }
  }

  // ----- Internal helpers -----
  private updateState(): void {
    this.stateChange.emit(this.getCurrentState());
  }

  private getTextarea(): HTMLTextAreaElement | null {
    const el = this.elementRef.nativeElement;
    return el?.tagName?.toLowerCase() === 'textarea' ? el : null;
  }

  private parseMaxHeight(): number {
    const str = this.maxHeight();
    const m = str?.match(/^(\d+)px?$/);
    return m ? parseInt(m[1], 10) : 800;
  }

  private isAutoScrollEnabled(): boolean {
    // smoothScroll is an alias/override if provided
    const smooth = this.smoothScroll();
    return smooth === null ? !!this.autoScroll() : !!smooth;
  }

  private extractWordAt(lineText: string, colZeroBased: number): string {
    if (colZeroBased < 0) return '';
    const isWord = (ch: string) => /[\w-]/.test(ch);
    let start = colZeroBased;
    let end = colZeroBased;
    while (start > 0 && isWord(lineText[start - 1])) start--;
    while (end < lineText.length && isWord(lineText[end])) end++;
    return lineText.slice(start, end);
  }

  private raf(cb: () => void): void {
    // Fallback in environments without RAF
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => requestAnimationFrame(cb));
    } else {
      setTimeout(cb, 16);
    }
  }
}
