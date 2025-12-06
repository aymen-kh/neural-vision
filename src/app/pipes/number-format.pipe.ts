import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'numberFormat',
  standalone: true,
})
export class NumberFormatPipe implements PipeTransform {
  transform(
    value: number | undefined | null,
    decimals: number = 2,
    notation: 'standard' | 'scientific' | 'engineering' | 'compact' = 'standard'
  ): string {
    if (value === undefined || value === null || isNaN(value)) {
      return '-';
    }

    try {
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        notation: notation,
      }).format(value);
    } catch {
      return value.toFixed(decimals);
    }
  }
}
