import {
  ApplicationRef,
  ComponentRef, createComponent, Directive,
  effect,
  ElementRef, EnvironmentInjector,
  inject, Input, OnDestroy, OnInit, Renderer2
} from '@angular/core';
import { IconRegistryService } from '@core/services/icon-registry.service';
import { AtkIconComponent } from '@shared/components/atk-icon/atk-icon.component';

@Directive({
  selector: '[hoverDot]',
  standalone: true
})
export class HoverDotDirective implements OnInit, OnDestroy {
  private hostEl: HTMLElement;
  private ringIconRef: ComponentRef<AtkIconComponent> | null = null;
  private dotIconRef: ComponentRef<AtkIconComponent> | null = null;
  private env = inject(EnvironmentInjector);
  private appRef = inject(ApplicationRef);
  private iconRegistry = inject(IconRegistryService);

  private r = inject(Renderer2);
  private el = inject(ElementRef);

  @Input() hoverDot: '' | 'right' | boolean = '';

  private containerElements: {
    container: HTMLElement;
    ringWrap: HTMLElement;
    dotWrap: HTMLElement;
  } | null = null;

  constructor() {
    this.hostEl = this.el.nativeElement;
    // Effect dans le constructor (contexte d'injection valide)
    effect(() => {
      const isLoaded = this.iconRegistry.isLoaded();
      if (isLoaded && this.containerElements && !this.ringIconRef && !this.dotIconRef) {
        setTimeout(() => {
          if (this.containerElements) {
            this.createIcons(this.containerElements.ringWrap, this.containerElements.dotWrap);
          }
        }, 0);
      }
    });
  }

  ngOnInit(): void {
    this.r.addClass(this.hostEl, 'has-hover-dot');
    // Créer les containers immédiatement
    this.containerElements = this.createContainers();
  }

  private createContainers() {
    const container = this.r.createElement('span');
    this.r.addClass(container, '_hover-dot-container');
    this.r.setAttribute(container, 'aria-hidden', 'true');
    // this.r.setStyle(container, 'position', 'absolute'); // to add style not in css
    if (this.hoverDot === 'right' || this.hostEl.classList.contains('hover-dot-right')) { // right position if asked
      this.r.setStyle(container, 'left', 'auto');
      this.r.setStyle(container, 'right', '8px');
    }

    const first = this.hostEl.firstChild;
    if (first) { this.r.insertBefore(this.hostEl, container, first); } else {
      this.r.appendChild(this.hostEl, container);
    }

    const ringWrap = this.r.createElement('span');
    this.r.addClass(ringWrap, '_hover-ring');
    this.r.appendChild(container, ringWrap);
    const dotWrap = this.r.createElement('span');
    this.r.addClass(dotWrap, '_hover-dot');
    this.r.appendChild(container, dotWrap);
    return { container, ringWrap, dotWrap };
  }

  private createIcons(ringWrap: HTMLElement, dotWrap: HTMLElement): void {
    try {
      // Créer l'icône radio-ring (cercle externe)
      this.ringIconRef = createComponent(AtkIconComponent, {
        environmentInjector: this.env,
        hostElement: ringWrap,
      });

      this.ringIconRef.setInput('name', 'radio-ring');
      // this.ringIconRef.setInput('color', 'var(--color-fg-subtle)');
      // this.ringIconRef.setInput('size', 18);
      this.ringIconRef.changeDetectorRef.detectChanges();
      this.appRef.tick();

      // Créer l'icône radio-dot (point central)
      this.dotIconRef = createComponent(AtkIconComponent, {
        environmentInjector: this.env,
        hostElement: dotWrap,
      });

      this.dotIconRef.setInput('name', 'radio-dot');
      this.dotIconRef.setInput('color', 'currentColor');
      // this.dotIconRef.setInput('size', 12);
      this.dotIconRef.changeDetectorRef.detectChanges();
      this.appRef.tick();

      // Configurer les événements hover
      this.setupHoverEvents(dotWrap);

    } catch (error) {
      console.error('❌ Erreur création icônes hover-dot:', error);
    }
  }

  private setupHoverEvents(dotElement: HTMLElement): void {
    this.r.listen(this.hostEl, 'mouseenter', () => {
      this.r.setStyle(dotElement, 'opacity', '1');
    });

    this.r.listen(this.hostEl, 'mouseleave', () => {
      this.r.setStyle(dotElement, 'opacity', '0');
    });
  }

  ngOnDestroy(): void {
    this.ringIconRef?.destroy();
    this.dotIconRef?.destroy();
    this.ringIconRef = null;
    this.dotIconRef = null;
    this.containerElements = null;
  }
}
