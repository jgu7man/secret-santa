import { Injectable, inject } from '@angular/core';
import { FIRESTORE_DB } from '@secret-santa/shared-firebase';
import {
  AppEnvironment,
  AppRegistryDocument,
  AppRegistryUpdateInput,
  AppRelease,
  appRegistryDocumentSchema,
  appReleaseSchema,
  createDefaultAppRegistryDocument,
} from './app-registry.model';
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore';
import { APP_REGISTRY_DEFAULTS } from './app-registry.tokens';

const APPS_COLLECTION = 'apps';
const RELEASES_SUBCOLLECTION = 'releases';

/**
 * Shared Firestore service managing per-app configuration documents (`apps/{appId}`)
 * and release history (`apps/{appId}/releases/{releaseId}`).
 */
@Injectable({
  providedIn: 'root',
})
export class AppRegistryService {
  private readonly db = inject(FIRESTORE_DB);
  private readonly appDefaults = inject(APP_REGISTRY_DEFAULTS);

  /** Resolves injected app-specific defaults, falling back to an agnostic base document. */
  getDefaultApp(appId: string): AppRegistryDocument {
    return this.appDefaults[appId] ?? createDefaultAppRegistryDocument(appId);
  }

  /** Loads `apps/{appId}` from Firestore, returning defaults if not yet persisted. */
  async getApp(appId: string): Promise<AppRegistryDocument> {
    const defaults = this.getDefaultApp(appId);
    const appRef = doc(this.db, APPS_COLLECTION, appId);
    const snapshot = await getDoc(appRef);
    if (!snapshot.exists()) {
      return defaults;
    }
    return appRegistryDocumentSchema.parse({
      ...defaults,
      ...snapshot.data(),
      id: snapshot.id,
    });
  }

  /** Persists configuration for `apps/{appId}` with audit metadata. */
  async saveApp(
    appId: string,
    input: AppRegistryUpdateInput,
    updatedBy: string,
  ): Promise<AppRegistryDocument> {
    const appRef = doc(this.db, APPS_COLLECTION, appId);
    const payload: AppRegistryDocument = {
      id: appId,
      ...input,
      name: input.name.trim(),
      maintenanceMessage: input.maintenanceMessage.trim(),
      announcementText: input.announcementText.trim(),
      updatedAt: Timestamp.now(),
      updatedBy,
    };
    await setDoc(appRef, payload);
    return payload;
  }

  /** Lists release entries under `apps/{appId}/releases` ordered newest first. */
  async listReleases(appId: string): Promise<AppRelease[]> {
    const releasesRef = collection(
      this.db,
      APPS_COLLECTION,
      appId,
      RELEASES_SUBCOLLECTION,
    );
    const q = query(releasesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((releaseDoc) =>
      appReleaseSchema.parse({
        ...releaseDoc.data(),
        id: releaseDoc.id,
      }),
    );
  }

  /** Creates a new release entry under `apps/{appId}/releases/{releaseId}`. */
  async createRelease(
    appId: string,
    version: string,
    environment: AppEnvironment,
    notes: string,
    createdBy: string,
  ): Promise<AppRelease> {
    const releasesRef = collection(
      this.db,
      APPS_COLLECTION,
      appId,
      RELEASES_SUBCOLLECTION,
    );
    const releaseRef = doc(releasesRef);
    const payload: AppRelease = {
      id: releaseRef.id,
      version: version.trim(),
      environment,
      notes: notes.trim(),
      createdAt: Timestamp.now(),
      createdBy,
    };
    await setDoc(releaseRef, payload);
    return payload;
  }
}
