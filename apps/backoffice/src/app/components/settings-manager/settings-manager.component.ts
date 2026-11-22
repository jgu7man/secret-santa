import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ActiveClassPipe,
  FirestoreTimestampPipe,
  MESSAGE_DISPLAY_DURATION,
} from '@secret-santa/shared-core';
import {
  AppEnvironment,
  AppRegistryDocument,
  AppRegistryUpdateInput,
  AppRelease,
  UserRole,
  createDefaultAppRegistryDocument,
} from '@secret-santa/shared-models';
import { BackofficeConfigService } from '../../services/backoffice-config.service';

interface ManagedAppOption {
  readonly id: string;
  readonly label: string;
}

@Component({
  selector: 'bo-settings-manager',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FirestoreTimestampPipe,
    ActiveClassPipe,
  ],
  templateUrl: './settings-manager.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsManagerComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly configService = inject(BackofficeConfigService);

  protected readonly managedApps: ReadonlyArray<ManagedAppOption> = [
    { id: 'backoffice', label: 'Backoffice' },
    { id: 'secret-santa', label: 'Secret Santa' },
  ];
  protected readonly roles: ReadonlyArray<UserRole> = [
    UserRole.USER,
    UserRole.HOST,
    UserRole.ADMIN,
  ];
  protected readonly environments: ReadonlyArray<AppEnvironment> = [
    AppEnvironment.DEV,
    AppEnvironment.BETA,
    AppEnvironment.PROD,
  ];

  readonly selectedAppId = signal('backoffice');
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

  readonly settingsForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
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
    brandName: ['', [Validators.required, Validators.maxLength(120)]],
    appName: ['', [Validators.required, Validators.maxLength(120)]],
    postLoginRedirectUrl: ['', [Validators.required, Validators.maxLength(200)]],
    loginRoute: ['', [Validators.required, Validators.maxLength(200)]],
    requestAccessRoute: ['', [Validators.required, Validators.maxLength(200)]],
    inviteBasePath: ['', [Validators.required, Validators.maxLength(200)]],
    requiresProfileCompletionByDefault: [false],
    defaultTargetRole: [UserRole.ADMIN, [Validators.required]],
    inviteExpirationHours: [
      72,
      [Validators.required, Validators.min(1), Validators.max(720)],
    ],
  });

  readonly releaseForm = this.fb.nonNullable.group({
    version: ['', [Validators.required, Validators.maxLength(50)]],
    environment: [AppEnvironment.DEV, [Validators.required]],
    notes: ['', [Validators.maxLength(2000)]],
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
    } catch {
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
    const defaults = createDefaultAppRegistryDocument(this.selectedAppId());
    this.patchForm(defaults);
    this.settingsForm.markAsDirty();
  }

  async save(): Promise<void> {
    if (this.settingsForm.invalid) {
      this.settingsForm.markAllAsTouched();
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
        maintenanceMode: raw.maintenanceMode,
        maintenanceMessage: raw.maintenanceMessage,
        allowGuestEventCreation: raw.allowGuestEventCreation,
        allowNewRegistrations: raw.allowNewRegistrations,
        defaultMinAmount: raw.defaultMinAmount,
        maxParticipantsPerEvent: raw.maxParticipantsPerEvent,
        announcementEnabled: raw.announcementEnabled,
        announcementText: raw.announcementText,
        auth: {
          brandName: raw.brandName,
          appName: raw.appName,
          postLoginRedirectUrl: raw.postLoginRedirectUrl,
          loginRoute: raw.loginRoute,
          requestAccessRoute: raw.requestAccessRoute,
          inviteBasePath: raw.inviteBasePath,
          requiresProfileCompletionByDefault:
            raw.requiresProfileCompletionByDefault,
          defaultTargetRole: raw.defaultTargetRole,
          inviteExpirationHours: raw.inviteExpirationHours,
          allowedAdminRoles: this.allowedAdminRoles(),
        },
      };

      const saved = await this.configService.saveApp(appId, payload);
      this.patchForm(saved);
      this.settingsForm.markAsPristine();
      this.flashSuccess(`Configuración guardada en apps/${appId}.`);
    } catch {
      this.errorMessage.set(
        `No se pudo guardar apps/${appId}. Verifica tus permisos de administrador.`
      );
    } finally {
      this.isSaving.set(false);
    }
  }

  async publishRelease(): Promise<void> {
    if (this.releaseForm.invalid) {
      this.releaseForm.markAllAsTouched();
      return;
    }

    const appId = this.selectedAppId();
    const { version, environment, notes } = this.releaseForm.getRawValue();
    this.isCreatingRelease.set(true);
    this.errorMessage.set('');
    try {
      const created = await this.configService.createRelease(
        appId,
        version,
        environment,
        notes
      );
      this.releases.update((list) => [created, ...list]);
      this.releaseForm.reset({
        version: '',
        environment: AppEnvironment.DEV,
        notes: '',
      });
      this.flashSuccess(`Release ${created.version} registrado en ${appId}.`);
    } catch {
      this.errorMessage.set('No se pudo registrar el release.');
    } finally {
      this.isCreatingRelease.set(false);
    }
  }

  private patchForm(appDoc: AppRegistryDocument): void {
    this.settingsForm.patchValue({
      name: appDoc.name,
      maintenanceMode: appDoc.maintenanceMode,
      maintenanceMessage: appDoc.maintenanceMessage,
      allowGuestEventCreation: appDoc.allowGuestEventCreation,
      allowNewRegistrations: appDoc.allowNewRegistrations,
      defaultMinAmount: appDoc.defaultMinAmount,
      maxParticipantsPerEvent: appDoc.maxParticipantsPerEvent,
      announcementEnabled: appDoc.announcementEnabled,
      announcementText: appDoc.announcementText,
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
    });
    this.allowedAdminRoles.set([...appDoc.auth.allowedAdminRoles]);
    this.lastMetadata.set({
      updatedAt: appDoc.updatedAt,
      updatedBy: appDoc.updatedBy,
    });
  }

  private flashSuccess(message: string): void {
    this.successMessage.set(message);
    setTimeout(() => {
      if (this.successMessage() === message) {
        this.successMessage.set('');
      }
    }, MESSAGE_DISPLAY_DURATION);
  }
}
