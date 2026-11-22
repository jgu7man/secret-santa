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
    const defaults = createDefaultAppRegistryDocument('backoffice', {
      name: 'Secret Santa Backoffice',
      auth: {
        appName: 'Secret Santa Backoffice',
        postLoginRedirectUrl: '/stats',
      },
    });
    configServiceSpy.getDefaultApp.and.returnValue(defaults);
    configServiceSpy.loadApp.and.resolveTo(defaults);
    configServiceSpy.listReleases.and.resolveTo([]);
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
    await component.ngOnInit();
    fixture.detectChanges();
  });

  it('should populate form with loaded app config and save updates', async () => {
    expect(component.settingsForm.controls.defaultMinAmount.value).toBe(100);
    expect(component.settingsForm.controls.postLoginRedirectUrl.value).toBe(
      '/stats'
    );

    component.settingsForm.patchValue({
      maintenanceMode: true,
      defaultMinAmount: 250,
      postLoginRedirectUrl: '/users',
      buyMeACoffee: {
        enabled: true,
        slug: 'marxa_digital',
      },
    });

    await component.save();

    expect(configServiceSpy.saveApp).toHaveBeenCalledWith(
      'backoffice',
      jasmine.objectContaining({
        maintenanceMode: true,
        defaultMinAmount: 250,
        auth: jasmine.objectContaining({
          postLoginRedirectUrl: '/users',
        }),
        buyMeACoffee: jasmine.objectContaining({
          enabled: true,
          slug: 'marxa_digital',
        }),
      })
    );
    expect(component.successMessage()).toContain('apps/backoffice');
  });
});
