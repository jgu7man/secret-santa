import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ErrorHandler,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UserRole } from '@marxa/auth-domain';
import {
  ActiveClassPipe,
  MESSAGE_DISPLAY_DURATION,
} from '@secret-santa/shared-core';
import {
  AppRegistryDocument,
  AppRegistryUpdateInput,
  AppRelease,
  BuyMeACoffeeWidgetPosition,
  DEFAULT_BUY_ME_A_COFFEE_SETTINGS,
  DEFAULT_FOOTER_SETTINGS,
  formatFooterWhatsappLabel,
} from '@secret-santa/shared-data-access';
import { BackofficeConfigService } from '../../services/backoffice-config.service';
import { AppReleasesCardComponent } from './app-releases-card.component';
import { AuthRbacSettingsCardComponent } from './auth-rbac-settings-card.component';
import { BuyMeACoffeeSettingsCardComponent } from './buy-me-a-coffee-settings-card.component';
import { FooterSettingsCardComponent } from './footer-settings-card.component';
import { OperationsSettingsCardComponent } from './operations-settings-card.component';
import {
  CreateReleasePayload,
  ManagedAppOption,
} from './settings-manager-ui.model';

@Component({
  selector: 'bo-settings-manager',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ActiveClassPipe,
    AuthRbacSettingsCardComponent,
    OperationsSettingsCardComponent,
    BuyMeACoffeeSettingsCardComponent,
    FooterSettingsCardComponent,
    AppReleasesCardComponent,
  ],
  templateUrl: './settings-manager.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsManagerComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly configService = inject(BackofficeConfigService);
  private readonly errorHandler = inject(ErrorHandler);
  private readonly destroyRef = inject(DestroyRef);

  private successTimerId: ReturnType<typeof setTimeout> | null = null;

  protected readonly managedApps: ReadonlyArray<ManagedAppOption> = [
    {
      id: 'secret-santa',
      label: 'Secret Santa',
      supportsAuthRbac: false,
      supportsOperations: true,
      supportsBuyMeACoffee: true,
      supportsFooter: true,
    },
    {
      id: 'backoffice',
      label: 'Backoffice',
      supportsAuthRbac: true,
      supportsOperations: false,
      supportsBuyMeACoffee: false,
      supportsFooter: false,
    },
  ];

  readonly selectedAppId = signal('secret-santa');
  readonly selectedAppOption = computed(
    () =>
      this.managedApps.find((app) => app.id === this.selectedAppId()) ??
      this.managedApps[0]
  );
  readonly showAuthRbacCard = computed(
    () => this.selectedAppOption().supportsAuthRbac
  );
  readonly showOperationsCard = computed(
    () => this.selectedAppOption().supportsOperations
  );
  readonly showBuyMeACoffeeCard = computed(
    () => this.selectedAppOption().supportsBuyMeACoffee
  );
  readonly showFooterCard = computed(
    () => this.selectedAppOption().supportsFooter
  );
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly isCreatingRelease = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly releases = signal<AppRelease[]>([]);
  readonly allowedAdminRoles = signal<UserRole[]>([UserRole.ADMIN]);
  readonly lastMetadata = signal<Pick<
    AppRegistryDocument,
    'updatedAt' | 'updatedBy'
  > | null>(null);

  readonly settingsForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    auth: this.fb.group({
      brandName: ['', [Validators.required, Validators.maxLength(120)]],
      appName: ['', [Validators.required, Validators.maxLength(120)]],
      postLoginRedirectUrl: [
        '',
        [Validators.required, Validators.maxLength(200)],
      ],
      loginRoute: ['', [Validators.required, Validators.maxLength(200)]],
      requestAccessRoute: [
        '',
        [Validators.required, Validators.maxLength(200)],
      ],
      inviteBasePath: ['', [Validators.required, Validators.maxLength(200)]],
      requiresProfileCompletionByDefault: [false],
      defaultTargetRole: [UserRole.ADMIN as UserRole, [Validators.required]],
      inviteExpirationHours: [
        72,
        [Validators.required, Validators.min(1), Validators.max(720)],
      ],
    }),
    operations: this.fb.group({
      maintenanceMode: [false],
      maintenanceMessage: ['', [Validators.maxLength(1000)]],
      allowGuestEventCreation: [true],
      allowNewRegistrations: [true],
      defaultMinAmount: [100, [Validators.required, Validators.min(0)]],
      maxParticipantsPerEvent: [
        100,
        [Validators.required, Validators.min(2), Validators.max(1000)],
      ],
      announcementEnabled: [false],
      announcementText: ['', [Validators.maxLength(1000)]],
    }),
    buyMeACoffee: this.fb.group({
      enabled: [DEFAULT_BUY_ME_A_COFFEE_SETTINGS.enabled],
      slug: [
        DEFAULT_BUY_ME_A_COFFEE_SETTINGS.slug,
        [Validators.required, Validators.pattern(/^[a-zA-Z0-9._-]{1,64}$/)],
      ],
      color: [
        DEFAULT_BUY_ME_A_COFFEE_SETTINGS.color,
        [Validators.required, Validators.pattern(/^#[0-9A-Fa-f]{6}$/)],
      ],
      position: [
        DEFAULT_BUY_ME_A_COFFEE_SETTINGS.position as BuyMeACoffeeWidgetPosition,
        [Validators.required],
      ],
      xMargin: [
        DEFAULT_BUY_ME_A_COFFEE_SETTINGS.xMargin,
        [Validators.required, Validators.min(0), Validators.max(120)],
      ],
      yMargin: [
        DEFAULT_BUY_ME_A_COFFEE_SETTINGS.yMargin,
        [Validators.required, Validators.min(0), Validators.max(120)],
      ],
    }),
    footer: this.fb.group({
      brandName: [
        DEFAULT_FOOTER_SETTINGS.brandName,
        [Validators.required, Validators.maxLength(80)],
      ],
      whatsappNumber: [
        DEFAULT_FOOTER_SETTINGS.whatsappNumber,
        [Validators.pattern(/^(?:[0-9]{7,15})?$/)],
      ],
      whatsappDisplay: [
        DEFAULT_FOOTER_SETTINGS.whatsappDisplay,
        [Validators.maxLength(30)],
      ],
      email: [
        DEFAULT_FOOTER_SETTINGS.email,
        [Validators.pattern(/^(?:[^\s@]+@[^\s@]+\.[^\s@]+)?$/)],
      ],
      websiteUrl: [
        DEFAULT_FOOTER_SETTINGS.websiteUrl,
        [Validators.pattern(/^(?:https?:\/\/[^\s/$.?#].[^\s]*)?$/i)],
      ],
    }),
  });

  readonly lastUpdatedLabel = computed(() => {
    const meta = this.lastMetadata();
    if (!meta?.updatedAt || typeof meta.updatedAt.toDate !== 'function') {
      return 'Sin guardar aún en Firestore (usando valores por defecto)';
    }
    const formattedDate = new Intl.DateTimeFormat('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(meta.updatedAt.toDate());
    return meta.updatedBy
      ? `${formattedDate} por ${meta.updatedBy}`
      : formattedDate;
  });

  async ngOnInit(): Promise<void> {
    this.destroyRef.onDestroy(() => {
      if (this.successTimerId !== null) {
        clearTimeout(this.successTimerId);
      }
    });
    await this.loadSelectedApp();
  }

  async selectApp(appId: string): Promise<void> {
    if (appId === this.selectedAppId()) {
      return;
    }
    this.selectedAppId.set(appId);
    await this.loadSelectedApp();
  }

  async loadSelectedApp(): Promise<void> {
    const appId = this.selectedAppId();
    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      const [appDoc, releasesList] = await Promise.all([
        this.configService.loadApp(appId),
        this.configService.listReleases(appId),
      ]);
      this.patchForm(appDoc);
      this.releases.set(releasesList);
    } catch (error: unknown) {
      this.errorHandler.handleError(error);
      this.errorMessage.set(
        `No se pudo cargar la configuración de apps/${appId} desde Firestore.`
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  toggleAllowedRole(role: UserRole): void {
    const current = this.allowedAdminRoles();
    if (current.includes(role)) {
      if (current.length <= 1) {
        return;
      }
      this.allowedAdminRoles.set(current.filter((item) => item !== role));
      return;
    }
    this.allowedAdminRoles.set([...current, role]);
  }

  resetDefaults(): void {
    const defaults = this.configService.getDefaultApp(this.selectedAppId());
    this.patchForm(defaults);
    this.settingsForm.markAsDirty();
  }

  async save(): Promise<void> {
    if (this.settingsForm.invalid) {
      this.settingsForm.markAllAsTouched();
      this.errorMessage.set(
        'Revisa los campos con formato inválido antes de guardar.'
      );
      return;
    }

    const appId = this.selectedAppId();
    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      const raw = this.settingsForm.getRawValue();
      const payload: AppRegistryUpdateInput = {
        name: raw.name,
        ...raw.operations,
        auth: {
          ...raw.auth,
          allowedAdminRoles: this.allowedAdminRoles(),
        },
        ...(this.showBuyMeACoffeeCard()
          ? {
              buyMeACoffee: {
                ...raw.buyMeACoffee,
                slug: raw.buyMeACoffee.slug.trim(),
                color: raw.buyMeACoffee.color.trim(),
              },
            }
          : {}),
        ...(this.showFooterCard()
          ? {
              footer: {
                brandName: raw.footer.brandName.trim(),
                whatsappNumber: raw.footer.whatsappNumber.trim(),
                whatsappDisplay: formatFooterWhatsappLabel(
                  raw.footer.whatsappNumber,
                  raw.footer.whatsappDisplay
                ),
                email: raw.footer.email.trim(),
                websiteUrl: raw.footer.websiteUrl.trim(),
              },
            }
          : {}),
      };

      const saved = await this.configService.saveApp(appId, payload);
      this.patchForm(saved);
      this.settingsForm.markAsPristine();
      this.flashSuccess(`Configuración guardada en apps/${appId}.`);
    } catch (error: unknown) {
      this.errorHandler.handleError(error);
      this.errorMessage.set(
        `No se pudo guardar apps/${appId}. Verifica tus permisos de administrador.`
      );
    } finally {
      this.isSaving.set(false);
    }
  }

  async publishRelease(payload: CreateReleasePayload): Promise<void> {
    const appId = this.selectedAppId();
    this.isCreatingRelease.set(true);
    this.errorMessage.set('');
    try {
      const created = await this.configService.createRelease(
        appId,
        payload.version,
        payload.environment,
        payload.notes
      );
      this.releases.update((list) => [created, ...list]);
      this.flashSuccess(`Release ${created.version} registrado en ${appId}.`);
    } catch (error: unknown) {
      this.errorHandler.handleError(error);
      this.errorMessage.set('No se pudo registrar el release.');
    } finally {
      this.isCreatingRelease.set(false);
    }
  }

  private patchForm(appDoc: AppRegistryDocument): void {
    this.settingsForm.patchValue({
      name: appDoc.name,
      auth: {
        brandName: appDoc.auth.brandName,
        appName: appDoc.auth.appName,
        postLoginRedirectUrl: appDoc.auth.postLoginRedirectUrl,
        loginRoute: appDoc.auth.loginRoute,
        requestAccessRoute: appDoc.auth.requestAccessRoute,
        inviteBasePath: appDoc.auth.inviteBasePath,
        requiresProfileCompletionByDefault:
          appDoc.auth.requiresProfileCompletionByDefault,
        defaultTargetRole: appDoc.auth.defaultTargetRole,
        inviteExpirationHours: appDoc.auth.inviteExpirationHours,
      },
      operations: {
        maintenanceMode: appDoc.maintenanceMode,
        maintenanceMessage: appDoc.maintenanceMessage,
        allowGuestEventCreation: appDoc.allowGuestEventCreation,
        allowNewRegistrations: appDoc.allowNewRegistrations,
        defaultMinAmount: appDoc.defaultMinAmount,
        maxParticipantsPerEvent: appDoc.maxParticipantsPerEvent,
        announcementEnabled: appDoc.announcementEnabled,
        announcementText: appDoc.announcementText,
      },
      buyMeACoffee: {
        ...DEFAULT_BUY_ME_A_COFFEE_SETTINGS,
        ...appDoc.buyMeACoffee,
      },
      footer: {
        ...DEFAULT_FOOTER_SETTINGS,
        ...appDoc.footer,
      },
    });
    this.allowedAdminRoles.set([...appDoc.auth.allowedAdminRoles]);
    this.lastMetadata.set({
      updatedAt: appDoc.updatedAt,
      updatedBy: appDoc.updatedBy,
    });
    this.syncScopedControls();
  }

  private syncScopedControls(): void {
    if (this.showAuthRbacCard()) {
      this.settingsForm.controls.name.enable({ emitEvent: false });
      this.settingsForm.controls.auth.enable({ emitEvent: false });
    } else {
      this.settingsForm.controls.name.disable({ emitEvent: false });
      this.settingsForm.controls.auth.disable({ emitEvent: false });
    }

    if (this.showOperationsCard()) {
      this.settingsForm.controls.operations.enable({ emitEvent: false });
    } else {
      this.settingsForm.controls.operations.disable({ emitEvent: false });
    }

    if (this.showBuyMeACoffeeCard()) {
      this.settingsForm.controls.buyMeACoffee.enable({ emitEvent: false });
    } else {
      this.settingsForm.controls.buyMeACoffee.disable({ emitEvent: false });
    }

    if (this.showFooterCard()) {
      this.settingsForm.controls.footer.enable({ emitEvent: false });
    } else {
      this.settingsForm.controls.footer.disable({ emitEvent: false });
    }
  }

  dismissError(): void {
    this.errorMessage.set('');
  }

  dismissSuccess(): void {
    if (this.successTimerId !== null) {
      clearTimeout(this.successTimerId);
      this.successTimerId = null;
    }
    this.successMessage.set('');
  }

  private flashSuccess(message: string): void {
    if (this.successTimerId !== null) {
      clearTimeout(this.successTimerId);
    }
    this.successMessage.set(message);
    this.successTimerId = setTimeout(() => {
      this.successTimerId = null;
      if (this.successMessage() === message) {
        this.successMessage.set('');
      }
    }, MESSAGE_DISPLAY_DURATION);
  }
}
