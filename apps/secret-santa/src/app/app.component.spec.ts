import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'secret-santa' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('secret-santa');
  });

  it('should render the site footer', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const footer = fixture.nativeElement.querySelector('app-footer footer');
    expect(footer).toBeTruthy();
    expect(footer.textContent).toContain('Marxa Digital');
  });
});
