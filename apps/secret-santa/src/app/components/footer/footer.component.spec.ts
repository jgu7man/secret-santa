import { ComponentFixture, TestBed } from '@angular/core/testing';
import { footerSettingsSchema } from '@secret-santa/shared-data-access';
import { FooterConfigService } from '../../core';
import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;
  let footerConfig: FooterConfigService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent],
    }).compileComponents();

    footerConfig = TestBed.inject(FooterConfigService);
    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render a semantic footer with Marxa Digital credit by default', () => {
    const footerElement = fixture.nativeElement.querySelector('footer');
    expect(footerElement).toBeTruthy();
    expect(footerElement.textContent).toContain('Marxa Digital');
  });

  it('should render WhatsApp, email, and website contact links from defaults', () => {
    const links: HTMLAnchorElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('footer a')
    );

    const whatsappLink = links.find(
      (link) => link.getAttribute('href') === 'https://wa.me/523121805955'
    );
    expect(whatsappLink).toBeTruthy();
    expect(whatsappLink?.textContent).toContain('3121805955');
    expect(whatsappLink?.getAttribute('target')).toBe('_blank');
    expect(whatsappLink?.getAttribute('rel')).toBe('noopener noreferrer');

    const emailLink = links.find(
      (link) => link.getAttribute('href') === 'mailto:jgu7man@gmail.com'
    );
    expect(emailLink).toBeTruthy();
    expect(emailLink?.textContent).toContain('jgu7man@gmail.com');

    const websiteLink = links.find(
      (link) => link.getAttribute('href') === 'https://marxadigital.com'
    );
    expect(websiteLink).toBeTruthy();
    expect(websiteLink?.textContent).toContain('marxadigital.com');
    expect(websiteLink?.getAttribute('target')).toBe('_blank');
    expect(websiteLink?.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('should update branding and hide empty contact channels when remote settings arrive', () => {
    footerConfig.applyRemoteSettings({
      brandName: 'Estudio Demo',
      whatsappNumber: '',
      whatsappDisplay: '',
      email: 'hola@estudiodemo.com',
      websiteUrl: 'https://estudiodemo.com/',
    });
    fixture.detectChanges();

    const footerElement: HTMLElement =
      fixture.nativeElement.querySelector('footer');
    expect(footerElement.textContent).toContain('Estudio Demo');
    expect(footerElement.querySelector('a[href^="https://wa.me/"]')).toBeNull();
    expect(
      footerElement.querySelector('a[href="mailto:hola@estudiodemo.com"]')
    ).toBeTruthy();
    expect(footerElement.textContent).toContain('estudiodemo.com');
  });

  it('should allow masking the WhatsApp number with a custom visible label', () => {
    footerConfig.applyRemoteSettings({
      brandName: 'Marxa Digital',
      whatsappNumber: '523121805955',
      whatsappDisplay: 'Mi WhatsApp',
      email: 'jgu7man@gmail.com',
      websiteUrl: 'https://marxadigital.com',
    });
    fixture.detectChanges();

    const whatsappLink: HTMLAnchorElement | null =
      fixture.nativeElement.querySelector('a[href="https://wa.me/523121805955"]');
    expect(whatsappLink).toBeTruthy();
    expect(whatsappLink?.textContent).toContain('Mi WhatsApp');
    expect(whatsappLink?.textContent).not.toContain('3121805955');
  });

  it('should reject unsafe website protocols or invalid WhatsApp numbers via footerSettingsSchema', () => {
    expect(() =>
      footerSettingsSchema.parse({
        brandName: 'Marxa Digital',
        whatsappNumber: '523121805955',
        whatsappDisplay: '3121805955',
        email: 'hola@marxadigital.com',
        websiteUrl: 'javascript:alert(1)',
      })
    ).toThrow();

    expect(() =>
      footerSettingsSchema.parse({
        brandName: 'Marxa Digital',
        whatsappNumber: 'not-a-phone',
        whatsappDisplay: '3121805955',
        email: 'hola@marxadigital.com',
        websiteUrl: 'https://marxadigital.com',
      })
    ).toThrow();
  });
});
