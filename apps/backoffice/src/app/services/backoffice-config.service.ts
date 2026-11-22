import { Injectable, inject } from '@angular/core';
import { AuthRuntimeConfigService, AuthService } from '@marxa/auth-engine';
import {
  AppEnvironment,
  AppRegistryDocument,
  AppRegistryService,
  AppRegistryUpdateInput,
  AppRelease,
} from '@secret-santa/shared-data-access';

/**
 * Backoffice configuration service managing `apps/{appId}` documents and
 * `apps/{appId}/releases` history with live runtime synchronization.
 */
@Injectable({
  providedIn: 'root',
})
export class BackofficeConfigService {
  private readonly appRegistryService = inject(AppRegistryService);
  private readonly authService = inject(AuthService);
  private readonly authRuntimeConfig = inject(AuthRuntimeConfigService);

  /** Resolves injected default settings for `appId`. */
  getDefaultApp(appId: string): AppRegistryDocument {
    return this.appRegistryService.getDefaultApp(appId);
  }

  /** Loads `apps/{appId}` configuration from Firestore. */
  loadApp(appId: string): Promise<AppRegistryDocument> {
    return this.appRegistryService.getApp(appId);
  }

  /** Lists release history for `apps/{appId}/releases`. */
  listReleases(appId: string): Promise<AppRelease[]> {
    return this.appRegistryService.listReleases(appId);
  }

  /** Validates bounds, saves `apps/{appId}`, and syncs runtime auth config if applicable. */
  async saveApp(
    appId: string,
    input: AppRegistryUpdateInput
  ): Promise<AppRegistryDocument> {
    const updatedBy = this.requireActor();
    this.assertValidBounds(input);

    const normalizedInput: AppRegistryUpdateInput = {
      ...input,
      auth: {
        ...input.auth,
        brandName: input.auth.brandName.trim(),
        appName: input.auth.appName.trim(),
        postLoginRedirectUrl: input.auth.postLoginRedirectUrl.trim(),
        loginRoute: input.auth.loginRoute.trim(),
        requestAccessRoute: input.auth.requestAccessRoute.trim(),
        inviteBasePath: input.auth.inviteBasePath.trim(),
      },
    };

    const saved = await this.appRegistryService.saveApp(
      appId,
      normalizedInput,
      updatedBy
    );

    if (appId === this.authRuntimeConfig.config().appId) {
      this.authRuntimeConfig.applyRuntimeAuth(saved.auth);
    }

    return saved;
  }

  /** Creates a new release record under `apps/{appId}/releases`. */
  createRelease(
    appId: string,
    version: string,
    environment: AppEnvironment,
    notes: string
  ): Promise<AppRelease> {
    return this.appRegistryService.createRelease(
      appId,
      version,
      environment,
      notes,
      this.requireActor()
    );
  }

  private assertValidBounds(input: AppRegistryUpdateInput): void {
    if (input.auth.allowedAdminRoles.length === 0) {
      throw new Error('Debe haber al menos un rol de administrador permitido.');
    }
    if (!Number.isFinite(input.defaultMinAmount) || input.defaultMinAmount < 0) {
      throw new Error('El monto mínimo debe ser mayor o igual a 0.');
    }
    if (
      !Number.isInteger(input.maxParticipantsPerEvent) ||
      input.maxParticipantsPerEvent < 2 ||
      input.maxParticipantsPerEvent > 1000
    ) {
      throw new Error(
        'El máximo de participantes debe ser un entero entre 2 y 1000.'
      );
    }
    if (
      !Number.isInteger(input.auth.inviteExpirationHours) ||
      input.auth.inviteExpirationHours < 1 ||
      input.auth.inviteExpirationHours > 720
    ) {
      throw new Error(
        'La expiración de invitaciones debe ser un entero entre 1 y 720 horas.'
      );
    }
  }

  private requireActor(): string {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Se requiere una sesión de administrador activa.');
    }
    return currentUser.email ?? currentUser.uid;
  }
}
