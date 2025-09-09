import {
  ApplicationRef,
  ComponentRef, createComponent, Directive, ElementRef, EnvironmentInjector,
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

  @Input() hoverDot: '' | 'right' | boolean = '';

  constructor(el: ElementRef<HTMLElement>, private r: Renderer2) {
    this.hostEl = el.nativeElement;
  }

  ngOnInit(): void {
    console.log('🔧 HoverDotDirective - Initialisation avec attente registry');

    this.r.addClass(this.hostEl, 'has-hover-dot');

    // Container principal
    const container = this.r.createElement('span');
    this.r.addClass(container, '_hover-dot-container');
    this.r.setAttribute(container, 'aria-hidden', 'true');

    // this.r.setStyle(container, 'position', 'absolute');
    // this.r.setStyle(container, 'left', '8px');
    // this.r.setStyle(container, 'top', '50%');
    // this.r.setStyle(container, 'transform', 'translateY(-50%)');
    // this.r.setStyle(container, 'width', '18px');
    // this.r.setStyle(container, 'height', '18px');
    // this.r.setStyle(container, 'display', 'flex');
    // this.r.setStyle(container, 'align-items', 'center');
    // this.r.setStyle(container, 'justify-content', 'center');
    // this.r.setStyle(container, 'pointer-events', 'none');
    this.r.setStyle(container, 'z-index', '2');

    // Position droite si demandé
    if (this.hoverDot === 'right' || this.hostEl.classList.contains('hover-dot-right')) {
      this.r.setStyle(container, 'left', 'auto');
      this.r.setStyle(container, 'right', '-10px');
    }

    this.r.appendChild(this.hostEl, container);

    // Wrapper pour radio-ring (cercle externe)
    const ringWrap = this.r.createElement('span');
    this.r.setStyle(ringWrap, 'width', '18px');
    this.r.setStyle(ringWrap, 'height', '18px');
    this.r.setStyle(ringWrap, 'display', 'flex');
    this.r.appendChild(container, ringWrap);

    // Wrapper pour radio-dot (point central)
    const dotWrap = this.r.createElement('span');
    this.r.setStyle(dotWrap, 'transform', 'translate(-50%, -50%)');
    this.r.setStyle(dotWrap, 'width', '12px');
    this.r.setStyle(dotWrap, 'height', '12px');
    this.r.setStyle(dotWrap, 'display', 'flex');
    this.r.setStyle(dotWrap, 'opacity', '0');
    this.r.setStyle(dotWrap, 'transition', 'opacity 0.2s ease');
    this.r.appendChild(container, dotWrap);

    // 🔧 SOLUTION: Attendre que le registry soit chargé
    this.waitForRegistryAndCreateIcons(ringWrap, dotWrap);
  }

  private waitForRegistryAndCreateIcons(ringWrap: HTMLElement, dotWrap: HTMLElement): void {
    const checkRegistry = () => {
      const registry = this.iconRegistry.registry();
      console.log('📊 Registry check:', registry);
      console.log('📊 Icons disponibles:', Object.keys(registry.icons));

      // Vérifier si les icônes nécessaires sont chargées
      if (registry.icons['radio-ring'] && registry.icons['radio-dot']) {
        console.log('✅ Registry chargé, création des icônes...');
        this.createIcons(ringWrap, dotWrap);
      } else {
        console.log('⏳ Registry pas encore chargé, retry dans 50ms...');
        setTimeout(checkRegistry, 50);
      }
    };

    checkRegistry();
  }

  private createIcons(ringWrap: HTMLElement, dotWrap: HTMLElement): void {
    try {
      // Vérifier une dernière fois avant création
      const registry = this.iconRegistry.registry();
      console.log('📋 Final check - radio-ring:', registry.icons['radio-ring']);
      console.log('📋 Final check - radio-dot:', registry.icons['radio-dot']);

      // Créer l'icône radio-ring (cercle externe)
      this.ringIconRef = createComponent(AtkIconComponent, {
        environmentInjector: this.env,
        hostElement: ringWrap,
      });

      this.ringIconRef.setInput('name', 'radio-ring');
      this.ringIconRef.setInput('color', 'var(--color-fg-subtle)');
      this.ringIconRef.setInput('size', 18);
      this.ringIconRef.changeDetectorRef.detectChanges();
      this.appRef.tick();

      console.log('🎯 Ring créé, HTML:', ringWrap.innerHTML);

      // Créer l'icône radio-dot (point central)
      this.dotIconRef = createComponent(AtkIconComponent, {
        environmentInjector: this.env,
        hostElement: dotWrap,
      });

      this.dotIconRef.setInput('name', 'radio-dot');
      this.dotIconRef.setInput('color', 'var(--color-fg-default)');
      this.dotIconRef.setInput('size', 12);
      this.dotIconRef.changeDetectorRef.detectChanges();
      this.appRef.tick();

      console.log('🎯 Dot créé, HTML:', dotWrap.innerHTML);
      console.log('✅ Icônes créées avec succès');

      // Événements hover
      this.setupHoverEvents(dotWrap);

    } catch (error) {
      console.error('❌ Erreur création icônes:', error);
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
  }
}
