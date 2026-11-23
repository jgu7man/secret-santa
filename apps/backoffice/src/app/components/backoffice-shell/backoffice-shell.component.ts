import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { AuthSessionService, MxdUser } from '@marxa/auth-engine';
import { NavItem } from '../../models/backoffice-ui.model';

@Component({
  selector: 'bo-backoffice-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './backoffice-shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackofficeShellComponent implements OnInit {
  private readonly authSession = inject(AuthSessionService);
  private readonly router = inject(Router);

  readonly currentUser = signal<MxdUser | null>(null);
  readonly avatarLoadFailed = signal(false);
  readonly navItems: ReadonlyArray<NavItem> = [
    {
      label: 'Estadísticas',
      route: '/stats',
      description: 'Métricas de eventos y actividad',
    },
    {
      label: 'Usuarios',
      route: '/users',
      description: 'Roles, estados y directorio',
    },
    {
      label: 'Configuraciones',
      route: '/settings',
      description: 'Banderas y reglas globales',
    },
  ];

  async ngOnInit(): Promise<void> {
    const user = await this.authSession.waitForMxdUser();
    this.avatarLoadFailed.set(false);
    this.currentUser.set(user);
  }

  onAvatarError(): void {
    this.avatarLoadFailed.set(true);
  }

  async logout(): Promise<void> {
    await this.authSession.logout();
    await this.router.navigate(['/login']);
  }
}
