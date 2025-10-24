/**
 * Hover Dot Directive
 * Creates animated hover indicators using dynamic icon components
 *
 * Usage: <button hoverDot>Label</button>
 * Usage with right position: <button hoverDot="right">Label</button>
 *
 * @file hover-dot.directive.ts
 * @version 2.0.0
 * @architecture Uses AtkAppStateService for icon registry
 */

import {
  ApplicationRef,
  ComponentRef,
  createComponent,
  Directive,
  effect,
  ElementRef,
  EnvironmentInjector,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Renderer2
} from '@angular/core';
import { AtkAppStateService } from '@core/state/atk-app-state.service';
import { AtkIconComponent } from '@shared/components/atk-icon/atk-icon.component';

@Directive({
  selector: '[hoverDot]',
  standalone: true
})
export class HoverDotDirective implements OnInit, OnDestroy {

  // =========================================
  // DEPENDENCIES
  // =========================================

  private readonly renderer = inject(Renderer2);
  private readonly elementRef = inject(ElementRef);
  private readonly environmentInjector = inject(EnvironmentInjector);
  private readonly applicationRef = inject(ApplicationRef);
  private readonly appState = inject(AtkAppStateService);

  // =========================================
  // PROPERTIES
  // =========================================

  private hostElement: HTMLElement;
  private ringIconRef: ComponentRef<AtkIconComponent> | null = null;
  private dotIconRef: ComponentRef<AtkIconComponent> | null = null;

  private containerElements: {
    container: HTMLElement;
    ringWrap: HTMLElement;
    dotWrap: HTMLElement;
  } | null = null;

  /**
   * Position of the hover dot
   * '' or false = left (default)
   * 'right' or true = right
   */
  @Input() hoverDot: '' | 'right' | boolean = '';

  // =========================================
  // CONSTRUCTOR
  // =========================================

  constructor() {
    this.hostElement = this.elementRef.nativeElement;

    // Effect to create icons when registry is loaded
    effect(() => {
      const isLoaded = this.appState.iconsLoaded();

      if (isLoaded && this.containerElements && !this.ringIconRef && !this.dotIconRef) {
        // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => {
          if (this.containerElements) {
            this.createIcons(
              this.containerElements.ringWrap,
              this.containerElements.dotWrap
            );
          }
        }, 0);
      }
    });
  }

  // =========================================
  // LIFECYCLE
  // =========================================

  ngOnInit(): void {
    // Add CSS class to host element
    this.renderer.addClass(this.hostElement, 'has-hover-dot');

    // Create containers immediately
    this.containerElements = this.createContainers();
  }

  ngOnDestroy(): void {
    // Cleanup component references
    this.ringIconRef?.destroy();
    this.dotIconRef?.destroy();
    this.ringIconRef = null;
    this.dotIconRef = null;
    this.containerElements = null;
  }

  // =========================================
  // PRIVATE METHODS
  // =========================================

  /**
   * Create container elements for hover dot animation
   */
  private createContainers(): {
    container: HTMLElement;
    ringWrap: HTMLElement;
    dotWrap: HTMLElement;
  } {
    // Create main container
    const container = this.renderer.createElement('span');
    this.renderer.addClass(container, '_hover-dot-container');
    this.renderer.setAttribute(container, 'aria-hidden', 'true');

    // Position container on right if requested
    if (
      this.hoverDot === 'right' ||
      this.hoverDot === true ||
      this.hostElement.classList.contains('hover-dot-right')
    ) {
      this.renderer.setStyle(container, 'left', 'auto');
      this.renderer.setStyle(container, 'right', '8px');
    }

    // Insert container at the beginning of host element
    const firstChild = this.hostElement.firstChild;
    if (firstChild) {
      this.renderer.insertBefore(this.hostElement, container, firstChild);
    } else {
      this.renderer.appendChild(this.hostElement, container);
    }

    // Create ring wrapper
    const ringWrap = this.renderer.createElement('span');
    this.renderer.addClass(ringWrap, '_hover-ring');
    this.renderer.appendChild(container, ringWrap);

    // Create dot wrapper
    const dotWrap = this.renderer.createElement('span');
    this.renderer.addClass(dotWrap, '_hover-dot');
    this.renderer.appendChild(container, dotWrap);

    return { container, ringWrap, dotWrap };
  }

  /**
   * Create icon components for ring and dot
   */
  private createIcons(ringWrap: HTMLElement, dotWrap: HTMLElement): void {
    try {
      // Create ring icon component (outer circle)
      this.ringIconRef = createComponent(AtkIconComponent, {
        environmentInjector: this.environmentInjector,
        hostElement: ringWrap,
      });

      this.ringIconRef.setInput('name', 'radio-ring');
      this.ringIconRef.changeDetectorRef.detectChanges();
      this.applicationRef.tick();

      // Create dot icon component (center point)
      this.dotIconRef = createComponent(AtkIconComponent, {
        environmentInjector: this.environmentInjector,
        hostElement: dotWrap,
      });

      this.dotIconRef.setInput('name', 'radio-dot');
      this.dotIconRef.setInput('color', 'currentColor');
      this.dotIconRef.changeDetectorRef.detectChanges();
      this.applicationRef.tick();

      // Setup hover events
      this.setupHoverEvents(dotWrap);

    } catch (error) {
      console.error('❌ Error creating hover-dot icons:', error);
    }
  }

  /**
   * Setup hover event listeners
   */
  private setupHoverEvents(dotElement: HTMLElement): void {
    // Show dot on mouse enter
    this.renderer.listen(this.hostElement, 'mouseenter', () => {
      this.renderer.setStyle(dotElement, 'opacity', '1');
    });

    // Hide dot on mouse leave
    this.renderer.listen(this.hostElement, 'mouseleave', () => {
      this.renderer.setStyle(dotElement, 'opacity', '0');
    });
  }
}
