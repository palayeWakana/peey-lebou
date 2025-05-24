import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CathegorieCreateComponent } from './cathegorie-create.component';

describe('CathegorieCreateComponent', () => {
  let component: CathegorieCreateComponent;
  let fixture: ComponentFixture<CathegorieCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CathegorieCreateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CathegorieCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
