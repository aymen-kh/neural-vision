import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'percentage',
  standalone: true,
})
export class PercentagePipe implements PipeTransform {
  transform(value: number | undefined | null, decimals: number = 1): string {
    if (value === undefined || value === null || isNaN(value)) {
      return '-';
    }

    const percentage = value * 100;
    return `${percentage.toFixed(decimals)}%`;
  }
}
