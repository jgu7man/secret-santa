import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { CreateEventComponent } from './create-event.component';

describe('CreateEventComponent', () => {
  let component: CreateEventComponent;
  let fixture: ComponentFixture<CreateEventComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateEventComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateEventComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the Buy Me a Coffee support button on the landing page', () => {
    const link: HTMLAnchorElement | null =
      fixture.nativeElement.querySelector('a.create-bmc-link');
    const img: HTMLImageElement | null = link?.querySelector('img') ?? null;

    expect(link).toBeTruthy();
    expect(link?.getAttribute('href')).toBe(
      'https://www.buymeacoffee.com/jgu7man'
    );
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toBe('noopener noreferrer');

    expect(img).toBeTruthy();
    expect(img?.getAttribute('src')).toContain(
      'https://img.buymeacoffee.com/button-api/'
    );
    expect(img?.getAttribute('src')).toContain('slug=jgu7man');
    expect(img?.getAttribute('referrerpolicy')).toBe('no-referrer');
    expect(img?.getAttribute('loading')).toBe('lazy');
    expect(img?.getAttribute('width')).toBeTruthy();
    expect(img?.getAttribute('height')).toBe('50');
  });
});
