import {
  Directive,
  ElementRef,
  HostListener,
  Output,
  EventEmitter,
  Renderer2,
} from '@angular/core';

@Directive({
  selector: '[appDropZone]',
  standalone: true,
})
export class DropZoneDirective {
  @Output() fileDrop = new EventEmitter<any>();
  @Output() itemDrop = new EventEmitter<any>();

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();

    this.renderer.addClass(this.el.nativeElement, 'drag-over');

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();

    this.renderer.removeClass(this.el.nativeElement, 'drag-over');
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();

    this.renderer.removeClass(this.el.nativeElement, 'drag-over');

    if (event.dataTransfer) {
      // Handle file drops
      if (event.dataTransfer.files.length > 0) {
        this.fileDrop.emit(event.dataTransfer.files);
      }

      // Handle data drops
      const data = event.dataTransfer.getData('text/plain');
      if (data) {
        try {
          const parsedData = JSON.parse(data);
          this.itemDrop.emit(parsedData);
        } catch {
          this.itemDrop.emit(data);
        }
      }
    }
  }
}
