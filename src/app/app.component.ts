import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { FooterComponent } from './components/footer/footer.component';
import { TopbarComponent } from './components/topbar/topbar.component';
import { MetaService } from './services/meta.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TopbarComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  title = 'secret-santa';
  showTopbar = true;

  constructor(private metaService: MetaService) {}

  ngOnInit(): void {
    // Set default meta tags on app initialization
    this.metaService.resetToDefault();
    this.updateTopbarVisibility(this.router.url);

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((event) => {
        this.updateTopbarVisibility(event.urlAfterRedirects);
      });
  }

  private updateTopbarVisibility(url: string): void {
    this.showTopbar = !url.startsWith('/event/');
  }
}
