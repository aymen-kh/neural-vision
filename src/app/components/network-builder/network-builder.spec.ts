import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NetworkBuilder } from './network-builder';

describe('NetworkBuilder', () => {
  let component: NetworkBuilder;
  let fixture: ComponentFixture<NetworkBuilder>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NetworkBuilder]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NetworkBuilder);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
