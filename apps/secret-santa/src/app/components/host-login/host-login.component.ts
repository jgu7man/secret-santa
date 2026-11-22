import {
  ChangeDetectionStrategy,
  Component,
  ErrorHandler,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@marxa/auth-engine';

@Component({
  selector: 'app-host-login',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './host-login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HostLoginComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly errorHandler = inject(ErrorHandler);

  protected readonly isLoggingIn = signal(false);
  protected readonly errorMessage = signal('');

  async ngOnInit(): Promise<void> {
    const user = await this.authService.waitForAuthReady();
    if (user) {
      await this.router.navigate(['/dashboard']);
    }
  }

  protected async login(): Promise<void> {
    this.isLoggingIn.set(true);
    this.errorMessage.set('');
    try {
      await this.authService.loginWithGoogle();
      await this.router.navigate(['/dashboard']);
    } catch (error: unknown) {
      this.errorHandler.handleError(error);
      this.errorMessage.set(
        $localize`:@@hostLoginError:Could not sign in with Google. Please try again.`
      );
      this.isLoggingIn.set(false);
    }
  }
}
