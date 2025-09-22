// src/app/shared/directives/terminal-input.directive.ts
// Simplified directive for terminal textarea functionality with auto-scroll

import { Directive, ElementRef, inject, input, OnInit, output } from '@angular/core';

/**
 * Simplified state interface - only scroll and content information
 */
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
    '(focus)': 'onScrollToBottom()',
  }
})
export class TerminalInputDirective implements OnInit {

  // Configuration inputs using modern Angular 20 signals
  autoResize = input<boolean>(false);
  autoScroll = input<boolean>(true);
  maxHeight = input<string>('800px');

  // Output events
  contentChange = output<string>();
  scrollChange = output<TerminalScrollState>();

  // Element reference injection
  private elementRef = inject(ElementRef<HTMLTextAreaElement>);

  ngOnInit(): void {
    const textarea = this.getTextarea();
    if (!textarea) {
      throw new Error('atkTerminalInput directive can only be applied to textarea elements');
    }

    // Initialize auto-scroll behavior
    if (this.autoScroll()) {
      this.scrollToBottom();
    }

    // Initialize auto-resize if needed
    if (this.autoResize()) {
      this.performAutoResize();
    }
  }

  /**
   * Handle content changes in textarea
   */
  public onContentChange(): void {
    const textarea = this.getTextarea();
    if (!textarea) return;

    // Emit content change
    this.contentChange.emit(textarea.value);

    // Auto-resize if enabled
    if (this.autoResize()) {
      this.performAutoResize();
    }

    // Auto-scroll to bottom after content change
    if (this.autoScroll()) {
      // Small delay to ensure DOM is updated
      setTimeout(() => this.scrollToBottom(), 10);
    }
  }

  /**
   * Handle scroll events
   */
  public onScrollEvent(): void {
    const textarea = this.getTextarea();
    if (!textarea) return;

    const scrollState: TerminalScrollState = {
      scrollTop: textarea.scrollTop,
      scrollLeft: textarea.scrollLeft,
      contentHeight: textarea.scrollHeight,
      visibleHeight: textarea.clientHeight,
      textValue: textarea.value
    };

    this.scrollChange.emit(scrollState);
  }

  /**
   * Trigger scroll to bottom on focus
   */
  public onScrollToBottom(): void {
    if (this.autoScroll()) {
      this.scrollToBottom();
    }
  }

  /**
   * Public API: Scroll to bottom smoothly
   */
  public scrollToBottom(): void {
    const textarea = this.getTextarea();
    if (!textarea) return;

    const targetPosition = textarea.scrollHeight - textarea.clientHeight;
    if (targetPosition <= 0) return;

    try {
      textarea.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    } catch {
      // Fallback for browsers that don't support smooth scrolling
      textarea.scrollTop = targetPosition;
    }
  }

  /**
   * Public API: Insert text at current position and auto-scroll
   */
  public appendText(text: string): void {
    const textarea = this.getTextarea();
    if (!textarea) return;

    const currentValue = textarea.value;
    const newValue = currentValue + text;

    textarea.value = newValue;

    // Trigger content change event
    this.onContentChange();

    // Focus and scroll to bottom
    textarea.focus();
  }

  /**
   * Public API: Set complete textarea content
   */
  public setContent(content: string): void {
    const textarea = this.getTextarea();
    if (!textarea) return;

    textarea.value = content;
    this.onContentChange();
  }

  /**
   * Public API: Clear textarea content
   */
  public clearContent(): void {
    const textarea = this.getTextarea();
    if (!textarea) return;

    textarea.value = '';
    this.onContentChange();
    textarea.focus();
  }

  /**
   * Public API: Auto resize to fit content
   */
  public performAutoResize(): void {
    const textarea = this.getTextarea();
    if (!textarea) return;

    // Reset height to auto to get correct scrollHeight
    textarea.style.height = 'auto';

    // Calculate new height within limits
    const newHeight = Math.min(textarea.scrollHeight, this.parseMaxHeight());
    textarea.style.height = `${newHeight}px`;

    // Handle overflow
    if (textarea.scrollHeight > newHeight) {
      textarea.style.overflowY = 'auto';
    } else {
      textarea.style.overflowY = 'hidden';
    }
  }

  /**
   * Public API: Get current scroll state
   */
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

  // Private helper methods

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
