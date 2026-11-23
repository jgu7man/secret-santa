export const ADMIN_DASHBOARD_COPYS = {
  deleteParticipantTitle: $localize`:@@removeButton:🗑️ Remove`,
  deleteParticipantMessage: $localize`:@@deleteParticipantConfirm:Are you sure you want to remove this participant? This action cannot be undone.`,
  closeRegistrationTitle: $localize`:@@closeRegistrationModalTitle:🔒 Close registration?`,
  closeRegistrationMessage: $localize`:@@closeRegistrationModalMessage:If you close registration, no one else will be able to join and the button to run the raffle (assigning who gifts whom) will be enabled. You can reopen it later if someone is missing.`,
  closeRegistrationConfirmLabel: $localize`:@@closeRegistrationConfirmLabel:Yes, close registration`,
  deleteEventTitle: $localize`:@@deleteEventAction:Delete`,
  eventNotFound: $localize`:@@eventNotFound:Event not found`,
  loadEventDataError: $localize`:@@loadEventDataError:Failed to load event data`,
  registrationOpened: $localize`:@@registrationOpened:opened`,
  registrationClosed: $localize`:@@registrationClosed:closed`,
  toggleRegistrationError: $localize`:@@toggleRegistrationError:Failed to toggle registration`,
  deleteEventError: $localize`:@@deleteEventError:Failed to delete event. Please try again.`,
  eventUpdatedSuccess: $localize`:@@eventUpdatedSuccess:Event updated successfully!`,
  eventUpdateError: $localize`:@@eventUpdateError:Failed to update event`,
  minParticipantsError: $localize`:@@minParticipantsError:Need at least 2 participants to run the raffle`,
  raffleSuccess: $localize`:@@raffleSuccess:Raffle completed successfully! 🎉`,
  raffleError: $localize`:@@raffleError:Failed to run raffle`,
  copyLinkSuccess: $localize`:@@copyLinkSuccess:Participant link copied to clipboard!`,
  copyResetLinkSuccess: $localize`:@@copyResetLinkSuccess:Reset link copied to clipboard!`,
  copyLinkError: $localize`:@@copyLinkError:Could not copy link to clipboard.`,
  deleteParticipantSuccess: $localize`:@@deleteParticipantSuccess:Participant removed successfully`,
  deleteParticipantError: $localize`:@@deleteParticipantError:Failed to remove participant`,
  claimEventSuccess: $localize`:@@claimEventSuccess:Event successfully linked to your account!`,
  claimEventError: $localize`:@@claimEventError:Failed to claim event`,
} as const;

export function formatRegistrationToggleSuccess(isOpen: boolean): string {
  const statusText = isOpen
    ? ADMIN_DASHBOARD_COPYS.registrationOpened
    : ADMIN_DASHBOARD_COPYS.registrationClosed;
  return $localize`:@@registrationToggleSuccess:Registration ${statusText} successfully`;
}

export function formatDeleteEventConfirm(eventName: string): string {
  return $localize`:@@deleteEventConfirm:Are you sure you want to delete "${eventName}:EVENT_NAME:"? This action cannot be undone.`;
}

export function formatWhatsappInviteMessage(
  eventName: string,
  link: string,
): string {
  return $localize`:@@whatsappInviteMessage:🎁 You're invited to the "${eventName}:EVENT_NAME:" Secret Santa! Join here: ${link}:INVITE_LINK:`;
}
