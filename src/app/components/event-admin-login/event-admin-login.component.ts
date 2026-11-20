import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core';
import { EventService } from '../../services/event.service';

@Component({
  selector: 'app-event-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div
      class="ss-theme ss-backdrop--dark min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center"
    >
      <div
        class="ss-card max-w-md w-full space-y-8"
      >
        <div class="text-center">
          <h2 class="ss-heading" i18n="@@adminLoginTitle">
            Admin Access 👑
          </h2>
          <p class="mt-2 text-gray-600" i18n="@@adminLoginSubtitle">
            Login to manage your event
          </p>
        </div>

        <div
          *ngIf="errorMessage"
          class="bg-red-100 text-red-700 p-4 rounded-lg text-sm"
        >
          {{ errorMessage }}
        </div>

        <div class="space-y-6">
          <!-- Google Login -->
          <button
            (click)="loginWithGoogle()"
            class="ss-button-secondary w-full flex justify-center items-center gap-3"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              class="w-5 h-5"
            />
            <span i18n="@@loginWithGoogle">Login with Google</span>
          </button>

          <div class="ss-separator text-sm" i18n="@@orSeparator">Or</div>

          <!-- Token Login -->
          <form [formGroup]="tokenForm" (ngSubmit)="loginWithToken()">
            <div class="space-y-4">
              <div>
                <label
                  for="token"
                  class="block text-sm font-medium text-gray-700"
                  i18n="@@adminTokenLabel"
                  >Admin Token</label
                >
                <input
                  type="text"
                  id="token"
                  formControlName="token"
                  class="ss-field mt-1 block w-full"
                  placeholder="Enter your admin token"
                  i18n-placeholder="@@adminTokenPlaceholder"
                />
              </div>
              <button
                type="submit"
                [disabled]="tokenForm.invalid || isLoading"
                class="ss-button-primary w-full"
              >
                <span i18n="@@accessWithToken">Access with Token</span>
              </button>
            </div>
          </form>
        </div>

        <div class="text-center mt-4">
          <a
            [routerLink]="['/event', eventId]"
            class="text-sm text-christmas-red hover:text-red-700 font-medium"
            i18n="@@backToEvent"
          >
            ← Back to Event
          </a>
        </div>
      </div>
    </div>
  `,
})
export class EventAdminLoginComponent implements OnInit {
  eventId: string = '';
  tokenForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private authService: AuthService,
    private eventService: EventService
  ) {
    this.tokenForm = this.fb.group({
      token: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.eventId) {
      this.router.navigate(['/']);
    }
  }

  async loginWithGoogle() {
    this.isLoading = true;
    this.errorMessage = '';
    try {
      await this.authService.loginWithGoogle();
      // After login, check if they are the owner
      const user = this.authService.getCurrentUser();
      if (user) {
        const event = await this.eventService.getEvent(this.eventId);
        if (event && event.ownerId === user.uid) {
          this.router.navigate(['/admin', this.eventId]);
        } else {
          this.errorMessage = 'You are not the owner of this event.';
        }
      }
    } catch (error) {
      console.error('Login failed', error);
      this.errorMessage = 'Login failed. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  async loginWithToken() {
    if (this.tokenForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';
    const token = this.tokenForm.get('token')?.value;

    try {
      const isValid = await this.eventService.verifyAdminToken(
        this.eventId,
        token
      );
      if (isValid) {
        // Store token and redirect
        localStorage.setItem(`event_${this.eventId}_token`, token);
        this.router.navigate(['/admin', this.eventId]);
      } else {
        this.errorMessage = 'Invalid admin token.';
      }
    } catch (error) {
      console.error('Token verification failed', error);
      this.errorMessage = 'Verification failed. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }
}
