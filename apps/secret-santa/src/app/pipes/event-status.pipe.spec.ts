import { EventStatus } from '@secret-santa/domain';
import { EventStatusPipe } from './event-status.pipe';

describe('EventStatusPipe', () => {
  const pipe = new EventStatusPipe();

  it('should display the localized Open label for events awaiting the draw', () => {
    expect(pipe.transform(EventStatus.CREATED)).toBe('Open');
  });

  it('should display the localized Drawn label for events that already completed the draw', () => {
    expect(pipe.transform(EventStatus.DRAWN)).toBe('Drawn');
  });
});
