import { Directive, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';

@Directive({
    selector: '[appDigitRender]',
    standalone: true,
})
export class DigitRenderDirective implements OnChanges {
    @Input('appDigitRender') data: number[] = [];

    constructor(private el: ElementRef<HTMLCanvasElement>) { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['data'] && this.data) {
            this.renderDigit();
        }
    }

    private renderDigit(): void {
        const canvas = this.el.nativeElement;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const size = 28;
        canvas.width = size;
        canvas.height = size;

        const imageData = ctx.createImageData(size, size);
        for (let i = 0; i < this.data.length; i++) {
            const value = Math.floor(this.data[i] * 255);
            imageData.data[i * 4] = value;
            imageData.data[i * 4 + 1] = value;
            imageData.data[i * 4 + 2] = value;
            imageData.data[i * 4 + 3] = 255;
        }

        ctx.putImageData(imageData, 0, 0);
    }
}
