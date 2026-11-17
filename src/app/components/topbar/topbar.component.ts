import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, inject, LOCALE_ID } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AppLocale, resolveTargetLocaleUrl } from '../../utils/locale-switch';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss',
})
export class TopbarComponent {
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  readonly isSpanish = /^es(?:-|$)/i.test(inject(LOCALE_ID));
  readonly targetLocale = this.isSpanish ? AppLocale.EN_US : AppLocale.ES_MX;
  readonly targetLanguageShort = this.isSpanish ? 'EN' : 'ES';
  readonly targetLanguageName = this.isSpanish ? 'English' : 'Español';

  get targetLocaleHref(): string {
    return resolveTargetLocaleUrl(this.document.location, this.targetLocale);
  }

  get showHostDashboardLink(): boolean {
    return !this.router.url.startsWith('/dashboard');
  }
}

