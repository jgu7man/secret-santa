import { CommonModule, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  AccessOnboardingService,
  AccessRequest,
  AccessRequestStatus,
  AdminInvite,
  AdminInviteStatus,
  AuthRuntimeConfigService,
} from '@marxa/auth-engine';
import {
  ActiveClassPipe,
  AuthService,
  MESSAGE_DISPLAY_DURATION,
} from '@secret-santa/shared-core';
import { UserProfileService } from '@secret-santa/shared-firebase';
import {
  AppUser,
  UserRole,
  UserStatus,
  isUserRole,
  isUserStatus,
} from '@secret-santa/shared-models';
import { CrewFilterAll, CrewTab } from '../../models/crew-ui.model';
import {
  CrewDirectoryTabComponent,
  UserNotesSaveEvent,
  UserRoleChangeEvent,
} from '../crew-directory-tab/crew-directory-tab.component';
import {
  CrewOnboardingTabComponent,
  DirectInviteSubmitEvent,
} from '../crew-onboarding-tab/crew-onboarding-tab.component';

/**
 * White-label Crew management orchestrator combining user directory RBAC,
 * pending access request moderation, and direct email invite generation.
 */
@Component({
  selector: 'marxa-crew-manager',
  standalone: true,
  imports: [
    CommonModule,
    ActiveClassPipe,
    CrewDirectoryTabComponent,
    CrewOnboardingTabComponent,
  ],
  templateUrl: './crew-manager.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrewManagerComponent implements OnInit {
  private readonly document = inject(DOCUMENT);
  private readonly authService = inject(AuthService);
  private readonly userProfileService = inject(UserProfileService);
  private readonly onboardingService = inject(AccessOnboardingService);
  protected readonly config = inject(AuthRuntimeConfigService).config;

  protected readonly CrewTab = CrewTab;
  readonly roles: ReadonlyArray<UserRole> = [
    UserRole.USER,
    UserRole.HOST,
    UserRole.ADMIN,
  ];
  readonly statuses: ReadonlyArray<UserStatus> = [
    UserStatus.ACTIVE,
    UserStatus.SUSPENDED,
  ];

  readonly activeTab = signal<CrewTab>(CrewTab.DIRECTORY);
  readonly users = signal<AppUser[]>([]);
  readonly accessRequests = signal<AccessRequest[]>([]);
  readonly invites = signal<AdminInvite[]>([]);
  readonly isLoading = signal(true);
  readonly savingId = signal<string | null>(null);
  readonly searchQuery = signal('');
  readonly roleFilter = signal<UserRole | CrewFilterAll>(CrewFilterAll.ALL);
  readonly statusFilter = signal<UserStatus | CrewFilterAll>(
    CrewFilterAll.ALL
  );
  readonly currentUid = signal<string | null>(null);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly lastGeneratedInviteUrl = signal('');

  readonly filteredUsers = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const role = this.roleFilter();
    const status = this.statusFilter();

    return this.users().filter((user) => {
      if (role !== CrewFilterAll.ALL && user.role !== role) {
        return false;
      }
      if (status !== CrewFilterAll.ALL && user.status !== status) {
        return false;
      }
      if (!query) {
        return true;
      }
      return (
        user.displayName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.uid.toLowerCase().includes(query)
      );
    });
  });

  readonly adminCount = computed(
    () => this.users().filter((user) => user.role === UserRole.ADMIN).length
  );

  readonly suspendedCount = computed(
    () =>
      this.users().filter((user) => user.status === UserStatus.SUSPENDED).length
  );

  readonly pendingRequestsCount = computed(
    () =>
      this.accessRequests().filter(
        (req) => req.status === AccessRequestStatus.PENDING
      ).length
  );

  async ngOnInit(): Promise<void> {
    const current = await this.authService.waitForAuthReady();
    this.currentUid.set(current ? current.uid : null);
    await this.loadAll();
  }

  selectTab(tab: CrewTab): void {
    this.activeTab.set(tab);
  }

  async loadAll(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      const [usersList, requestsList, invitesList] = await Promise.all([
        this.userProfileService.getAllUsers(),
        this.onboardingService.listAccessRequests(),
        this.onboardingService.listInvites(),
      ]);
      this.users.set(usersList);
      this.accessRequests.set(requestsList);
      this.invites.set(invitesList);
    } catch {
      this.errorMessage.set(
        'No se pudo cargar la información del equipo desde Firestore.'
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  onRoleFilterChange(value: string): void {
    this.roleFilter.set(isUserRole(value) ? value : CrewFilterAll.ALL);
  }

  onStatusFilterChange(value: string): void {
    this.statusFilter.set(isUserStatus(value) ? value : CrewFilterAll.ALL);
  }

  async onRoleChange(event: UserRoleChangeEvent): Promise<void> {
    const { user, rawRole } = event;
    if (!isUserRole(rawRole) || rawRole === user.role) {
      return;
    }
    if (this.currentUid() === user.uid && rawRole !== UserRole.ADMIN) {
      this.errorMessage.set(
        'No puedes quitarte el rol de administrador a tu propia cuenta.'
      );
      return;
    }

    this.savingId.set(user.uid);
    this.errorMessage.set('');
    try {
      await this.userProfileService.updateUserAdmin(user.uid, {
        role: rawRole,
      });
      this.users.update((list) =>
        list.map((entry) =>
          entry.uid === user.uid ? { ...entry, role: rawRole } : entry
        )
      );
      this.flashSuccess(`Rol actualizado para ${user.displayName}.`);
    } catch {
      this.errorMessage.set('No se pudo actualizar el rol del usuario.');
    } finally {
      this.savingId.set(null);
    }
  }

  async toggleStatus(user: AppUser): Promise<void> {
    const nextStatus =
      user.status === UserStatus.ACTIVE
        ? UserStatus.SUSPENDED
        : UserStatus.ACTIVE;

    if (this.currentUid() === user.uid && nextStatus === UserStatus.SUSPENDED) {
      this.errorMessage.set('No puedes suspender tu propia cuenta activa.');
      return;
    }

    this.savingId.set(user.uid);
    this.errorMessage.set('');
    try {
      await this.userProfileService.updateUserAdmin(user.uid, {
        status: nextStatus,
      });
      this.users.update((list) =>
        list.map((entry) =>
          entry.uid === user.uid ? { ...entry, status: nextStatus } : entry
        )
      );
      this.flashSuccess(
        nextStatus === UserStatus.SUSPENDED
          ? `${user.displayName} fue suspendido.`
          : `${user.displayName} fue reactivado.`
      );
    } catch {
      this.errorMessage.set('No se pudo actualizar el estado del usuario.');
    } finally {
      this.savingId.set(null);
    }
  }

  async saveNotes(event: UserNotesSaveEvent): Promise<void> {
    const { user, notes } = event;
    this.savingId.set(user.uid);
    this.errorMessage.set('');
    try {
      await this.userProfileService.updateUserAdmin(user.uid, { notes });
      this.users.update((list) =>
        list.map((entry) =>
          entry.uid === user.uid
            ? { ...entry, notes: notes.length > 0 ? notes : undefined }
            : entry
        )
      );
      this.flashSuccess(`Notas guardadas para ${user.displayName}.`);
    } catch {
      this.errorMessage.set('No se pudieron guardar las notas del usuario.');
    } finally {
      this.savingId.set(null);
    }
  }

  async createDirectInvite(event: DirectInviteSubmitEvent): Promise<void> {
    this.savingId.set('direct-invite');
    this.errorMessage.set('');
    try {
      const result = await this.onboardingService.createDirectInvite(
        event.email,
        event.targetRole,
        event.requiresProfileCompletion
      );
      this.invites.update((list) => [result.invite, ...list]);
      const fullUrl = this.buildAbsoluteInviteUrl(result.invitePath);
      this.lastGeneratedInviteUrl.set(fullUrl);
      this.copyToClipboard(fullUrl);
      this.flashSuccess(
        `Invitación generada y copiada para ${result.invite.email}.`
      );
    } catch {
      this.errorMessage.set('No se pudo crear la invitación.');
    } finally {
      this.savingId.set(null);
    }
  }

  async approveRequest(request: AccessRequest): Promise<void> {
    this.savingId.set(request.id);
    this.errorMessage.set('');
    try {
      const activeConfig = this.config();
      const result = await this.onboardingService.approveAccessRequest(
        request,
        activeConfig.defaultTargetRole,
        activeConfig.requiresProfileCompletionByDefault
      );
      this.accessRequests.update((list) =>
        list.map((entry) =>
          entry.id === request.id
            ? {
                ...entry,
                status: AccessRequestStatus.APPROVED,
                inviteId: result.invite.id,
              }
            : entry
        )
      );
      this.invites.update((list) => [result.invite, ...list]);
      const fullUrl = this.buildAbsoluteInviteUrl(result.invitePath);
      this.lastGeneratedInviteUrl.set(fullUrl);
      this.copyToClipboard(fullUrl);
      this.flashSuccess(
        `Solicitud aprobada. Enlace de invitación copiado para ${request.email}.`
      );
    } catch {
      this.errorMessage.set('No se pudo aprobar la solicitud.');
    } finally {
      this.savingId.set(null);
    }
  }

  async rejectRequest(request: AccessRequest): Promise<void> {
    this.savingId.set(request.id);
    this.errorMessage.set('');
    try {
      await this.onboardingService.rejectAccessRequest(request.id);
      this.accessRequests.update((list) =>
        list.map((entry) =>
          entry.id === request.id
            ? { ...entry, status: AccessRequestStatus.REJECTED }
            : entry
        )
      );
      this.flashSuccess(`Solicitud rechazada para ${request.email}.`);
    } catch {
      this.errorMessage.set('No se pudo rechazar la solicitud.');
    } finally {
      this.savingId.set(null);
    }
  }

  async revokeInvite(invite: AdminInvite): Promise<void> {
    this.savingId.set(invite.id);
    this.errorMessage.set('');
    try {
      await this.onboardingService.revokeInvite(invite.id);
      this.invites.update((list) =>
        list.map((entry) =>
          entry.id === invite.id
            ? { ...entry, status: AdminInviteStatus.REVOKED }
            : entry
        )
      );
      this.flashSuccess(`Invitación revocada para ${invite.email}.`);
    } catch {
      this.errorMessage.set('No se pudo revocar la invitación.');
    } finally {
      this.savingId.set(null);
    }
  }

  copyInviteLink(inviteId: string): void {
    const base = this.config().inviteBasePath.replace(/\/+$/, '');
    const fullUrl = this.buildAbsoluteInviteUrl(`${base}/${inviteId}`);
    this.copyToClipboard(fullUrl);
    this.flashSuccess('Enlace de invitación copiado al portapapeles.');
  }

  private buildAbsoluteInviteUrl(invitePath: string): string {
    const normalizedPath = invitePath.replace(/^\/+/, '');
    return new URL(normalizedPath, this.document.baseURI).href;
  }

  private copyToClipboard(text: string): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(text);
    }
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
