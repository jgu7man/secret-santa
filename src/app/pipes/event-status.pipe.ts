import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'eventStatus',
  standalone: true,
})
export class EventStatusPipe implements PipeTransform {
  transform(status: string): string {
    switch (status) {
      case 'CREATED':
        return $localize`:@@statusCreated:Open`;
      case 'DRAWN':
        return $localize`:@@statusDrawn:Drawn`;
      default:
        return status;
    }
  }
}
