import { Directive, ElementRef, HostListener, Input, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appNeuronHighlight]',
  standalone: true,
})
export class NeuronHighlightDirective {
  @Input() highlightColor: string = '#00f5ff';
  @Input() defaultColor: string = '#2a3150';

  constructor(private el: ElementRef, private renderer: Renderer2) {
    this.setColor(this.defaultColor);
  }

  @HostListener('mouseenter') onMouseEnter() {
    this.highlight(this.highlightColor);
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.highlight(this.defaultColor);
  }

  @HostListener('click') onClick() {
    this.pulse();
  }

  private highlight(color: string) {
    this.setColor(color);
  }

  private setColor(color: string) {
    this.renderer.setStyle(this.el.nativeElement, 'borderColor', color);
    this.renderer.setStyle(this.el.nativeElement, 'boxShadow', `0 0 10px ${color}`);
  }

  private pulse() {
    this.renderer.addClass(this.el.nativeElement, 'animate-pulse');
    setTimeout(() => {
      this.renderer.removeClass(this.el.nativeElement, 'animate-pulse');
    }, 500);
  }
}
