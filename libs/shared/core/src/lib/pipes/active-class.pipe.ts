import { InjectionToken, Pipe, PipeTransform, inject } from '@angular/core';

/** Design-token class strings for active/inactive interactive pills and tabs. */
export interface UiPillTokens {
  readonly active: string;
  readonly inactive: string;
}

/** Injection token providing configurable active/inactive pill CSS classes. */
export const UI_PILL_TOKENS = new InjectionToken<UiPillTokens>(
  'UI_PILL_TOKENS',
  {
    providedIn: 'root',
    factory: () => ({
      active: 'bg-white text-slate-900 shadow-sm',
      inactive: 'text-slate-600',
    }),
  }
);

/**
 * Pure pipe evaluating an active boolean condition once and returning
 * the configured design-token class string.
 */
@Pipe({
  name: 'activeClass',
  standalone: true,
})
export class ActiveClassPipe implements PipeTransform {
  private readonly tokens = inject(UI_PILL_TOKENS);

  transform(
    isActive: boolean,
    activeClasses?: string,
    inactiveClasses?: string
  ): string {
    if (isActive) {
      return activeClasses ?? this.tokens.active;
    }
    return inactiveClasses ?? this.tokens.inactive;
  }
}
