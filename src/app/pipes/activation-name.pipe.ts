import { Pipe, PipeTransform } from '@angular/core';
import { ActivationFunction } from '../models/layer.model';

@Pipe({
  name: 'activationName',
  standalone: true,
})
export class ActivationNamePipe implements PipeTransform {
  private readonly nameMap: Record<string, string> = {
    relu: 'ReLU',
    sigmoid: 'Sigmoid',
    tanh: 'Tanh',
    softmax: 'Softmax',
    linear: 'Linear',
    elu: 'ELU',
    selu: 'SELU',
    leakyReLU: 'Leaky ReLU',
  };

  transform(value: ActivationFunction | string | undefined): string {
    if (!value) {
      return 'None';
    }
    return this.nameMap[value] || value.charAt(0).toUpperCase() + value.slice(1);
  }
}
