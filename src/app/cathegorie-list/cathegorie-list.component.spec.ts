import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CathegorieListComponent } from './cathegorie-list.component';

describe('CathegorieListComponent', () => {
  let component: CathegorieListComponent;
  let fixture: ComponentFixture<CathegorieListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CathegorieListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CathegorieListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
