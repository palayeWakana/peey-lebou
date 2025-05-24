import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpporComponent } from './oppor.component';

describe('OpporComponent', () => {
  let component: OpporComponent;
  let fixture: ComponentFixture<OpporComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpporComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OpporComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
