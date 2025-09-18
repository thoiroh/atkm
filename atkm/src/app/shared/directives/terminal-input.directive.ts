// src/app/shared/directives/terminal-input.directive.ts
// Standalone directive for terminal textarea functionality with cursor tracking

import { Directive, ElementRef, inject, input, OnInit, output, signal } from '@angular/core';

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

@Directive({
  selector: 'textarea[atkTerminalInput]',
  standalone: true,
  host: {
    '(input)': 'onTextareaEvent()',
    '(keyup)': 'onTextareaEvent()',
    '(click)': 'onTextareaEvent()',
    '(select)': 'onTextareaEvent()',
    '(scroll)': 'onScrollEvent()'
  }
})
export class TerminalInputDirective implements OnInit {

  // Configuration inputs using modern Angular 20 signals
  autoResize = input<boolean>(false);
  smoothScroll = input<boolean>(true);
  maxHeight = input<string>('800px');

  // Output event for state changes
  stateChange = output<TerminalInputState>();
  scrollChange = output<{ scrollTop: number; scrollLeft: number }>();

  // Internal state management
  private currentState = signal<TerminalInputState>({
    caretIndex: 0,
    selectionStart: 0,
    selectionEnd: 0,
    line: 1,
    column: 1,
    selectionText: '',
    currentLineText: '',
    currentWord: '',
    textValue: ''
  });

  // Element reference injection
  private elementRef = inject(ElementRef<HTMLTextAreaElement>);

  ngOnInit(): void {
    const textarea = this.getTextarea();
    if (!textarea) {
      throw new Error('atkTerminalInput directive can only be applied to textarea elements');
    }

    // Initialize state with current textarea content
    this.updateState();
  }

  /**
   * Handle all textarea events that affect cursor position and content
   */
  public onTextareaEvent(): void {
    this.updateState();

    if (this.autoResize()) {
      this.performAutoResize();
    }
  }

  /**
   * Handle scroll events for synchronization
   */
  public onScrollEvent(): void {
    const textarea = this.getTextarea();
    if (!textarea) return;

    this.scrollChange.emit({
      scrollTop: textarea.scrollTop,
      scrollLeft: textarea.scrollLeft
    });
  }

  /**
   * Public API: Set caret position
   */
  public setCaret(position: number): void {
    const textarea = this.getTextarea();
    if (!textarea) return;

    const clampedPosition = Math.max(0, Math.min(position, textarea.value.length));
    textarea.setSelectionRange(clampedPosition, clampedPosition);
    textarea.focus();
    this.updateState();
  }

  /**
   * Public API: Insert text at current caret position
   */
  public insertAtCaret(text: string): void {
    const textarea = this.getTextarea();
    if (!textarea) return;

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? start;
    const currentValue = textarea.value;

    const newValue = currentValue.slice(0, start) + text + currentValue.slice(end);
    const newPosition = start + text.length;

    textarea.value = newValue;
    textarea.setSelectionRange(newPosition, newPosition);
    textarea.focus();

    this.updateState();

    if (this.smoothScroll()) {
      this.scrollToBottom();
    }
  }

  /**
   * Public API: Get current state
   */
  public getCurrentState(): TerminalInputState {
    return this.currentState();
  }

  /**
   * Public API: Clear textarea content
   */
  public clearContent(): void {
    const textarea = this.getTextarea();
    if (!textarea) return;

    textarea.value = '';
    textarea.focus();
    this.updateState();
  }

  /**
   * Public API: Scroll to bottom smoothly
   */
  public scrollToBottom(): void {
    const textarea = this.getTextarea();
    if (!textarea) return;

    const targetPosition = textarea.scrollHeight - textarea.clientHeight;
    if (targetPosition <= 0) return;

    if (this.smoothScroll()) {
      try {
        textarea.scrollTo({ top: targetPosition, behavior: 'smooth' });
      } catch {
        textarea.scrollTop = targetPosition;
      }
    } else {
      textarea.scrollTop = targetPosition;
    }
  }

  /**
   * Public API: Auto resize to fit content
   */
  public performAutoResize(): void {
    const textarea = this.getTextarea();
    if (!textarea) return;

    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, this.parseMaxHeight());
    textarea.style.height = `${newHeight}px`;

    if (textarea.scrollHeight > newHeight) {
      textarea.style.overflowY = 'auto';
    } else {
      textarea.style.overflowY = 'hidden';
    }
  }

  // Private methods

  private updateState(): void {
    const textarea = this.getTextarea();
    if (!textarea) return;

    const value = textarea.value;
    const selectionStart = textarea.selectionStart ?? 0;
    const selectionEnd = textarea.selectionEnd ?? selectionStart;

    // Calculate line and column (1-based indexing)
    const textUpToCaret = value.slice(0, selectionEnd);
    const lines = textUpToCaret.split('\n');
    const lineNumber = lines.length;
    const columnNumber = lines[lines.length - 1].length + 1;

    // Get current line text
    const allLines = value.split('\n');
    const currentLineText = allLines[lineNumber - 1] ?? '';

    // Extract current word around caret position
    const leftPart = currentLineText.slice(0, columnNumber - 1);
    const rightPart = currentLineText.slice(columnNumber - 1);
    const leftWord = leftPart.match(/[A-Za-z0-9_\-]+$/)?.[0] ?? '';
    const rightWord = rightPart.match(/^[A-Za-z0-9_\-]+/)?.[0] ?? '';
    const currentWord = leftWord + rightWord;

    // Create new state
    const newState: TerminalInputState = {
      caretIndex: selectionEnd,
      selectionStart,
      selectionEnd,
      line: lineNumber,
      column: columnNumber,
      selectionText: selectionStart !== selectionEnd ? value.slice(selectionStart, selectionEnd) : '',
      currentLineText,
      currentWord,
      textValue: value
    };

    this.currentState.set(newState);
    this.stateChange.emit(newState);
  }

  private getTextarea(): HTMLTextAreaElement | null {
    const element = this.elementRef.nativeElement;
    return element?.tagName?.toLowerCase() === 'textarea' ? element : null;
  }

  private parseMaxHeight(): number {
    const maxHeightStr = this.maxHeight();
    const match = maxHeightStr.match(/^(\d+)px?$/);
    return match ? parseInt(match[1], 10) : 800;
  }
}
