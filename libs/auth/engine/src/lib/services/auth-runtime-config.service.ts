import { Injectable, inject, signal } from '@angular/core';
import { FIRESTORE_DB } from '@secret-santa/shared-firebase';
import { AppAuthSettings } from '@secret-santa/shared-models';
import { doc, getDoc } from 'firebase/firestore';
import { AUTH_ENGINE_CONFIG, AuthEngineConfig } from '../config/auth-engine.tokens';
import { appAuthSettingsSchema } from '../schemas/access-onboarding.schemas';

/**
 * Holds the reactive runtime `AuthEngineConfig`, hydrating from Firestore
 * `apps/{appId}.auth` on boot while keeping compile-time defaults as fallback.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthRuntimeConfigService {
  private readonly db = inject(FIRESTORE_DB);
  private readonly initialConfig = inject(AUTH_ENGINE_CONFIG);

  readonly config = signal<AuthEngineConfig>(this.initialConfig);

  /** Loads `apps/{appId}.auth` from Firestore and validates it with Zod Mini. */
  async loadFromFirestore(): Promise<void> {
    const appRef = doc(this.db, 'apps', this.initialConfig.appId);
    const snapshot = await getDoc(appRef);
    if (!snapshot.exists()) {
      return;
    }

    const snapshotData = snapshot.data();
    if (
      !snapshotData ||
      !('auth' in snapshotData) ||
      snapshotData['auth'] === undefined
    ) {
      return;
    }

    const parsedAuth = appAuthSettingsSchema.parse(snapshotData['auth']);
    this.applyRuntimeAuth(parsedAuth);
  }

  /** Applies updated `AppAuthSettings` to the active runtime signal immediately. */
  applyRuntimeAuth(authSettings: AppAuthSettings): void {
    this.config.update((current) => ({
      ...current,
      ...authSettings,
    }));
  }
}
