import { TestBed } from '@angular/core/testing';

import { OpportinuteService } from './opportinute.service';

describe('OpportinuteService', () => {
  let service: OpportinuteService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OpportinuteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
