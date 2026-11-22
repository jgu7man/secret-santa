import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  LOCALE_ID,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { SeoLocale, resolveLocaleFromId } from '../../core';
import { resolveTargetLocaleUrl } from '../../utils/locale-switch';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopbarComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  private readonly activeLocale = resolveLocaleFromId(inject(LOCALE_ID));
  protected readonly isSpanish = this.activeLocale === SeoLocale.ES_MX;
  private readonly targetLocale = this.isSpanish
    ? SeoLocale.EN_US
    : SeoLocale.ES_MX;
  protected readonly targetLanguageShort = this.isSpanish ? 'EN' : 'ES';
  protected readonly targetLanguageName = this.isSpanish
    ? 'English'
    : 'Español';
  protected readonly targetLanguageAriaLabel = $localize`:@@switchLanguageAria:Switch language to ${this.targetLanguageName}:LANGUAGE:`;

  private readonly currentUrl = signal(this.router.url);

  protected readonly showHostDashboardLink = computed(
    () => !this.currentUrl().startsWith('/dashboard')
  );

  protected readonly targetLocaleHref = computed(() => {
    this.currentUrl();
    return resolveTargetLocaleUrl(this.document.location, this.targetLocale);
  });

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((event) => {
        this.currentUrl.set(event.urlAfterRedirects);
      });
  }
}
