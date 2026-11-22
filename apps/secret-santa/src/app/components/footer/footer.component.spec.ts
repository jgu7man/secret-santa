import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render a semantic footer with Marxa Digital credit', () => {
    const footerElement = fixture.nativeElement.querySelector('footer');
    expect(footerElement).toBeTruthy();
    expect(footerElement.textContent).toContain('Marxa Digital');
  });

  it('should render WhatsApp, email, and website contact links', () => {
    const links: HTMLAnchorElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('footer a')
    );

    const whatsappLink = links.find((link) =>
      link.getAttribute('href') === 'https://wa.me/523121805955'
    );
    expect(whatsappLink).toBeTruthy();
    expect(whatsappLink?.textContent).toContain('3121805955');
    expect(whatsappLink?.getAttribute('target')).toBe('_blank');
    expect(whatsappLink?.getAttribute('rel')).toBe('noopener noreferrer');

    const emailLink = links.find((link) =>
      link.getAttribute('href') === 'mailto:jgu7man@gmail.com'
    );
    expect(emailLink).toBeTruthy();
    expect(emailLink?.textContent).toContain('jgu7man@gmail.com');

    const websiteLink = links.find((link) =>
      link.getAttribute('href') === 'https://marxadigital.com'
    );
    expect(websiteLink).toBeTruthy();
    expect(websiteLink?.textContent).toContain('marxadigital.com');
    expect(websiteLink?.getAttribute('target')).toBe('_blank');
    expect(websiteLink?.getAttribute('rel')).toBe('noopener noreferrer');
  });
});

