import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppUser, UserRole, UserStatus } from '@marxa/auth-domain';
import { Timestamp } from 'firebase/firestore';
import {
  CrewDirectoryTabComponent,
  UserNotesSaveEvent,
} from './crew-directory-tab.component';

describe('CrewDirectoryTabComponent', () => {
  let fixture: ComponentFixture<CrewDirectoryTabComponent>;
  let component: CrewDirectoryTabComponent;

  const now = Timestamp.fromMillis(1_700_000_000_000);
  const sampleUser: AppUser = {
    uid: 'user-2',
    email: 'ana@example.com',
    displayName: 'Ana Pérez',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    notes: 'Nota previa',
    createdAt: now,
    lastLoginAt: now,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrewDirectoryTabComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CrewDirectoryTabComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('users', [sampleUser]);
    fixture.componentRef.setInput('totalUsersCount', 1);
    fixture.componentRef.setInput('adminCount', 0);
    fixture.componentRef.setInput('suspendedCount', 0);
    fixture.componentRef.setInput('isLoading', false);
    fixture.componentRef.setInput('savingId', null);
    fixture.componentRef.setInput('currentUid', 'admin-1');
    fixture.componentRef.setInput('searchQuery', '');
    fixture.componentRef.setInput('roleFilter', 'ALL');
    fixture.componentRef.setInput('statusFilter', 'ALL');
    fixture.componentRef.setInput('roles', [
      UserRole.USER,
      UserRole.HOST,
      UserRole.ADMIN,
    ]);
    fixture.componentRef.setInput('statuses', [
      UserStatus.ACTIVE,
      UserStatus.SUSPENDED,
    ]);
    fixture.detectChanges();
  });

  it('should preload existing notes when opening inline editor and emit trimmed notes on save', async () => {
    const saved: UserNotesSaveEvent[] = [];
    component.saveNotes.subscribe((event) => saved.push(event));

    component.startEditNotes(sampleUser);
    fixture.detectChanges();
    await fixture.whenStable();

    const input: HTMLInputElement | null =
      fixture.nativeElement.querySelector('input[type="text"]');
    expect(input?.value).toBe('Nota previa');

    if (input) {
      input.value = '  Actualizado por soporte  ';
      input.dispatchEvent(new Event('input'));
    }
    component.submitNotes(sampleUser);
    fixture.detectChanges();

    expect(saved).toEqual([
      { user: sampleUser, notes: 'Actualizado por soporte' },
    ]);
    expect(
      fixture.nativeElement.querySelector('input[type="text"]')
    ).toBeNull();
  });

  it('should discard unsaved draft changes when the admin cancels note editing', () => {
    const saved: UserNotesSaveEvent[] = [];
    component.saveNotes.subscribe((event) => saved.push(event));

    component.startEditNotes(sampleUser);
    fixture.detectChanges();
    component.cancelEditNotes();
    fixture.detectChanges();

    expect(saved.length).toBe(0);
    expect(
      fixture.nativeElement.querySelector('input[type="text"]')
    ).toBeNull();
  });
});
