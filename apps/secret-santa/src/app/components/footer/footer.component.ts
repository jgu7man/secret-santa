import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import {
  formatFooterWebsiteLabel,
  formatFooterWhatsappLabel,
} from '@secret-santa/shared-data-access';
import { FooterConfigService } from '../../core';

@Component({
  selector: 'app-footer',
  standalone: true,
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  private readonly footerConfig = inject(FooterConfigService);

  protected readonly settings = this.footerConfig.settings;

  protected readonly whatsappHref = computed(() => {
    const digits = this.settings().whatsappNumber;
    return digits ? `https://wa.me/${digits}` : '';
  });

  protected readonly whatsappLabel = computed(() => {
    const current = this.settings();
    return formatFooterWhatsappLabel(
      current.whatsappNumber,
      current.whatsappDisplay
    );
  });

  protected readonly emailHref = computed(() => {
    const email = this.settings().email;
    return email ? `mailto:${email}` : '';
  });

  protected readonly websiteLabel = computed(() =>
    formatFooterWebsiteLabel(this.settings().websiteUrl)
  );
}
