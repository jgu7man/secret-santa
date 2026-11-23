import { ComponentFixture, TestBed } from '@angular/core/testing';
import { createDefaultAppRegistryDocument } from '@secret-santa/shared-data-access';
import { BackofficeConfigService } from '../../services/backoffice-config.service';
import { SettingsManagerComponent } from './settings-manager.component';

describe('SettingsManagerComponent', () => {
  let fixture: ComponentFixture<SettingsManagerComponent>;
  let component: SettingsManagerComponent;

  const configServiceSpy = jasmine.createSpyObj<BackofficeConfigService>(
    'BackofficeConfigService',
    ['getDefaultApp', 'loadApp', 'saveApp', 'listReleases', 'createRelease']
  );

  beforeEach(async () => {
    const secretSantaDefaults = createDefaultAppRegistryDocument(
      'secret-santa',
      {
        name: 'Secret Santa',
        auth: {
          appName: 'Secret Santa',
          postLoginRedirectUrl: '/',
        },
      }
    );
    const backofficeDefaults = createDefaultAppRegistryDocument('backoffice', {
      name: 'Secret Santa Backoffice',
      auth: {
        appName: 'Secret Santa Backoffice',
        postLoginRedirectUrl: '/stats',
      },
    });
    configServiceSpy.getDefaultApp.and.callFake((appId) =>
      appId === 'backoffice' ? backofficeDefaults : secretSantaDefaults
    );
    configServiceSpy.loadApp.and.callFake(async (appId) =>
      appId === 'backoffice' ? backofficeDefaults : secretSantaDefaults
    );
    configServiceSpy.listReleases.and.resolveTo([]);
    configServiceSpy.saveApp.calls.reset();
    configServiceSpy.saveApp.and.callFake(async (appId, input) => ({
      id: appId,
      ...input,
      updatedBy: 'admin@example.com',
    }));

    await TestBed.configureTestingModule({
      imports: [SettingsManagerComponent],
      providers: [
        { provide: BackofficeConfigService, useValue: configServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should default to secret-santa, render only portal cards (Operations, BMC, Footer), and save updates', async () => {
    expect(component.selectedAppId()).toBe('secret-santa');
    expect(component.showAuthRbacCard()).toBeFalse();
    expect(component.showOperationsCard()).toBeTrue();
    expect(component.showBuyMeACoffeeCard()).toBeTrue();
    expect(component.showFooterCard()).toBeTrue();
    expect(
      fixture.nativeElement.querySelector('bo-auth-rbac-settings-card')
    ).toBeNull();
    expect(
      fixture.nativeElement.querySelector('bo-operations-settings-card')
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('bo-buy-me-a-coffee-settings-card')
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('bo-footer-settings-card')
    ).not.toBeNull();

    expect(
      component.settingsForm.controls.operations.controls.defaultMinAmount.value
    ).toBe(100);

    component.settingsForm.patchValue({
      operations: {
        maintenanceMode: true,
        defaultMinAmount: 250,
      },
      buyMeACoffee: {
        enabled: true,
        slug: 'marxa_digital',
      },
      footer: {
        brandName: 'Marxa Studio',
        email: 'hola@marxadigital.com',
      },
    });

    await component.save();

    expect(configServiceSpy.saveApp).toHaveBeenCalledWith(
      'secret-santa',
      jasmine.objectContaining({
        maintenanceMode: true,
        defaultMinAmount: 250,
        buyMeACoffee: jasmine.objectContaining({
          enabled: true,
          slug: 'marxa_digital',
        }),
        footer: jasmine.objectContaining({
          brandName: 'Marxa Studio',
          email: 'hola@marxadigital.com',
        }),
      })
    );
    expect(component.successMessage()).toContain('apps/secret-santa');
  });

  it('should render only Auth/RBAC card and omit BMC & Footer from payload when backoffice is selected', async () => {
    await component.selectApp('backoffice');
    fixture.detectChanges();

    expect(component.selectedAppId()).toBe('backoffice');
    expect(component.showAuthRbacCard()).toBeTrue();
    expect(component.showOperationsCard()).toBeFalse();
    expect(component.showBuyMeACoffeeCard()).toBeFalse();
    expect(component.showFooterCard()).toBeFalse();
    expect(
      fixture.nativeElement.querySelector('bo-auth-rbac-settings-card')
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('bo-operations-settings-card')
    ).toBeNull();
    expect(
      fixture.nativeElement.querySelector('bo-buy-me-a-coffee-settings-card')
    ).toBeNull();
    expect(
      fixture.nativeElement.querySelector('bo-footer-settings-card')
    ).toBeNull();

    component.settingsForm.patchValue({
      auth: {
        postLoginRedirectUrl: '/users',
      },
    });

    await component.save();

    expect(configServiceSpy.saveApp).toHaveBeenCalled();
    const [savedAppId, savedPayload] =
      configServiceSpy.saveApp.calls.mostRecent().args;
    expect(savedAppId).toBe('backoffice');
    expect(savedPayload.auth.postLoginRedirectUrl).toBe('/users');
    expect(savedPayload.buyMeACoffee).toBeUndefined();
    expect(savedPayload.footer).toBeUndefined();
  });
});
