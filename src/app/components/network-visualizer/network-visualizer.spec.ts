import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NetworkVisualizer } from './network-visualizer';

describe('NetworkVisualizer', () => {
  let component: NetworkVisualizer;
  let fixture: ComponentFixture<NetworkVisualizer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NetworkVisualizer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NetworkVisualizer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
