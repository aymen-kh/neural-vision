import { TestBed } from '@angular/core/testing';

import { NeuralNetwork } from './neural-network';

describe('NeuralNetwork', () => {
  let service: NeuralNetwork;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NeuralNetwork);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
