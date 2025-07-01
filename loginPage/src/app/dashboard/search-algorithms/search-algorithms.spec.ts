import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchAlgorithms } from './search-algorithms';

describe('SearchAlgorithms', () => {
  let component: SearchAlgorithms;
  let fixture: ComponentFixture<SearchAlgorithms>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchAlgorithms]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchAlgorithms);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
