import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpportuniteDetailsComponent } from './opportunite-details.component';

describe('OpportuniteDetailsComponent', () => {
  let component: OpportuniteDetailsComponent;
  let fixture: ComponentFixture<OpportuniteDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpportuniteDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OpportuniteDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
