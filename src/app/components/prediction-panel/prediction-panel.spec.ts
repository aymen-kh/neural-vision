import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PredictionPanel } from './prediction-panel';

describe('PredictionPanel', () => {
  let component: PredictionPanel;
  let fixture: ComponentFixture<PredictionPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PredictionPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PredictionPanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
