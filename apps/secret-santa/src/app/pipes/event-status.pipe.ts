import { Pipe, PipeTransform } from '@angular/core';
import { EventStatus } from '@secret-santa/domain';

const EVENT_STATUS_LABELS: Readonly<Record<EventStatus, () => string>> = {
  [EventStatus.CREATED]: () => $localize`:@@statusCreated:Open`,
  [EventStatus.DRAWN]: () => $localize`:@@statusDrawn:Drawn`,
};

@Pipe({
  name: 'eventStatus',
  standalone: true,
})
export class EventStatusPipe implements PipeTransform {
  transform(status: EventStatus): string {
    return EVENT_STATUS_LABELS[status]();
  }
}
