import { Directive, ElementRef, HostListener, Output, EventEmitter, Input } from '@angular/core';

export interface DragPosition {
  x: number;
  y: number;
}

@Directive({
  selector: '[appDraggable]',
  standalone: true,
})
export class DraggableDirective {
  @Input() dragData: any;
  @Output() dragStart = new EventEmitter<any>();
  @Output() dragEnd = new EventEmitter<DragPosition>();
  @Output() dragging = new EventEmitter<DragPosition>();

  private isDragging = false;
  private startX = 0;
  private startY = 0;
  private offsetX = 0;
  private offsetY = 0;

  constructor(private el: ElementRef) {
    this.el.nativeElement.style.cursor = 'grab';
    this.el.nativeElement.draggable = true;
  }

  @HostListener('dragstart', ['$event'])
  onDragStart(event: DragEvent) {
    this.isDragging = true;
    this.el.nativeElement.style.cursor = 'grabbing';
    this.el.nativeElement.style.opacity = '0.7';

    this.startX = event.clientX;
    this.startY = event.clientY;

    // Set drag data
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy';
      event.dataTransfer.setData('text/plain', JSON.stringify(this.dragData));
    }

    this.dragStart.emit(this.dragData);
  }

  @HostListener('drag', ['$event'])
  onDrag(event: DragEvent) {
    if (!this.isDragging) return;

    if (event.clientX !== 0 && event.clientY !== 0) {
      this.offsetX = event.clientX - this.startX;
      this.offsetY = event.clientY - this.startY;

      this.dragging.emit({
        x: event.clientX,
        y: event.clientY,
      });
    }
  }

  @HostListener('dragend', ['$event'])
  onDragEnd(event: DragEvent) {
    this.isDragging = false;
    this.el.nativeElement.style.cursor = 'grab';
    this.el.nativeElement.style.opacity = '1';

    this.dragEnd.emit({
      x: event.clientX,
      y: event.clientY,
    });
  }
}
