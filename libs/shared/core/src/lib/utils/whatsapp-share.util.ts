const WHATSAPP_SHARE_BASE_URL = 'https://wa.me/';

/**
 * Builds a recipient-free WhatsApp share URL (`https://wa.me/?text=...`)
 * so the user can choose which contact or group receives the prefilled message.
 */
export function buildWhatsappShareUrl(message: string): string {
  const normalized = message.trim();
  if (!normalized) {
    return WHATSAPP_SHARE_BASE_URL;
  }
  return `${WHATSAPP_SHARE_BASE_URL}?text=${encodeURIComponent(normalized)}`;
}
