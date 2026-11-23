import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { UserRole } from '@marxa/auth-domain';
import { AuthSettingsFormGroup } from './settings-manager-ui.model';

@Component({
  selector: 'bo-auth-rbac-settings-card',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './auth-rbac-settings-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthRbacSettingsCardComponent {
  readonly appNameControl = input.required<FormControl<string>>();
  readonly form = input.required<AuthSettingsFormGroup>();
  readonly allowedAdminRoles = input.required<readonly UserRole[]>();
  readonly toggleRole = output<UserRole>();

  protected readonly roles: ReadonlyArray<UserRole> = [
    UserRole.USER,
    UserRole.HOST,
    UserRole.ADMIN,
  ];
}
