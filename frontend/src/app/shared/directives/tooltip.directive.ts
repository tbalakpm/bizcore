import { Directive, ElementRef, HostListener, Input, Renderer2, OnDestroy } from '@angular/core';

@Directive({
  selector: '[appTooltip]',
  standalone: true
})
export class TooltipDirective implements OnDestroy {
  @Input('appTooltip') tooltipText = '';
  private tooltipElement: HTMLElement | null = null;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  @HostListener('mouseenter')
  onMouseEnter() {
    if (!this.tooltipText) return;
    this.show();
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.hide();
  }

  private show() {
    this.tooltipElement = this.renderer.createElement('span');
    this.renderer.appendChild(this.tooltipElement, this.renderer.createText(this.tooltipText));

    // Tailwind classes for styling - using design tokens
    const classes = [
      'fixed',
      'z-[9999]',
      'px-2',
      'py-1',
      'text-[10px]',
      'uppercase',
      'tracking-wider',
      'font-bold',
      'text-[#f1f5f9]', // --color-chrome-text-bright
      'bg-[#1e293b]', // --color-chrome
      'rounded',
      'shadow-xl',
      'pointer-events-none',
      'whitespace-nowrap',
      'border',
      'border-[#334155]' // --color-chrome-border
    ];

    classes.forEach(cls => this.renderer.addClass(this.tooltipElement, cls));

    // Initial positioning to get height/width
    this.renderer.setStyle(this.tooltipElement, 'top', '0px');
    this.renderer.setStyle(this.tooltipElement, 'left', '0px');
    this.renderer.setStyle(this.tooltipElement, 'opacity', '0');

    this.renderer.appendChild(document.body, this.tooltipElement);

    // Fade in and position accurately in next tick
    setTimeout(() => {
      this.setPosition();
      this.renderer.setStyle(this.tooltipElement, 'opacity', '1');
    }, 0);
  }

  private setPosition() {
    if (!this.tooltipElement) return;

    const hostRect = this.el.nativeElement.getBoundingClientRect();
    const tooltipRect = this.tooltipElement.getBoundingClientRect();

    let top = hostRect.top - tooltipRect.height - 8;
    let left = hostRect.left + (hostRect.width - tooltipRect.width) / 2;

    // Boundary checks
    if (top < 8) {
      top = hostRect.bottom + 8;
    }
    if (left < 8) {
      left = 8;
    } else if (left + tooltipRect.width > window.innerWidth - 8) {
      left = window.innerWidth - tooltipRect.width - 8;
    }

    this.renderer.setStyle(this.tooltipElement, 'top', `${top}px`);
    this.renderer.setStyle(this.tooltipElement, 'left', `${left}px`);
  }

  private hide() {
    if (this.tooltipElement) {
      this.renderer.removeChild(document.body, this.tooltipElement);
      this.tooltipElement = null;
    }
  }

  ngOnDestroy() {
    this.hide();
  }
}
