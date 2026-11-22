import { Pipe, PipeTransform } from '@angular/core';
import { Timestamp } from 'firebase/firestore';

/** Pure pipe formatting a Firestore `Timestamp` into a localized date-time string. */
@Pipe({
  name: 'firestoreTimestamp',
  standalone: true,
})
export class FirestoreTimestampPipe implements PipeTransform {
  private readonly formatter = new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  transform(timestamp: Timestamp | undefined | null): string {
    if (!timestamp || typeof timestamp.toDate !== 'function') {
      return '—';
    }
    return this.formatter.format(timestamp.toDate());
  }
}
