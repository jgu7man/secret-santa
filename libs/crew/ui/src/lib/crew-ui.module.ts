import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CREW_ROUTES } from './crew.routes';

/** Lazy-loadable routing module for Crew user/request/invite management. */
@NgModule({
  imports: [RouterModule.forChild(CREW_ROUTES)],
  exports: [RouterModule],
})
export class CrewUiModule {}
