import { CommonModule } from '@angular/common';
import { Component, NgZone, OnInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core';

@Component({
  selector: 'app-host-login',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './host-login.component.html',
})
export class HostLoginComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);

  isLoggingIn = false;
  errorMessage = '';

  async ngOnInit(): Promise<void> {
    const user = await this.authService.waitForAuthReady();
    if (user) {
      this.ngZone.run(() => {
        void this.router.navigate(['/dashboard']);
      });
    }
  }

  async login(): Promise<void> {
    this.isLoggingIn = true;
    this.errorMessage = '';
    try {
      await this.authService.loginWithGoogle();
      this.ngZone.run(() => {
        void this.router.navigate(['/dashboard']);
      });
    } catch (error) {
      console.error('Login failed', error);
      this.ngZone.run(() => {
        this.errorMessage = $localize`:@@hostLoginError:Could not sign in with Google. Please try again.`;
        this.isLoggingIn = false;
      });
    }
  }
}

