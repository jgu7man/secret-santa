import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AUTH_ROUTES } from './auth.routes';

/**
 * Lazy-loadable routing module orchestrating `login`, `request-access`, and `invite/:token`.
 */
@NgModule({
  imports: [RouterModule.forChild(AUTH_ROUTES)],
  exports: [RouterModule],
})
export class AuthUiModule {}
