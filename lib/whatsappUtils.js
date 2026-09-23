/**
 * WhatsApp Phone Number Normalization and URL Utilities
 * Strictly for client-side human-to-human communication via https://wa.me/
 */

/**
 * Normalizes any raw phone number string into clean digits with country code.
 * - Strips whitespace, hyphens, parentheses, dots, commas, leading +
 * - Handles Indian phone numbers: prepends 91 if exactly 10 digits
 * - Preserves existing country code if 11-15 digits
 * - Handles leading trunk '0' (e.g. 09876543210 -> 919876543210)
 *
 * @param {string|number} phone - Raw input phone number
 * @param {string} defaultCountryCode - Default country code if 10 digits (default '91')
 * @returns {string} Clean digits string or empty string if invalid
 */
export function normalizeWhatsAppNumber(phone, defaultCountryCode = '91') {
  if (!phone) return '';

  // 1. Convert to string and strip common formatting chars
  let cleaned = String(phone).trim().replace(/[\s\-\(\)\.\,\/]/g, '');

  // 2. Remove leading plus
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1);
  }

  // 3. Remove leading international double zero (e.g., 0091...)
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.slice(2);
  }

  // 4. Handle leading single zero for 11-digit domestic numbers (e.g., 09876543210)
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.slice(1);
  }

  // 5. Remove any remaining non-digit characters
  cleaned = cleaned.replace(/\D/g, '');

  // 6. Check length and country code assignment
  if (cleaned.length === 10) {
    // Standard 10-digit mobile number, prepend default country code (91)
    const cleanCC = defaultCountryCode.replace(/\D/g, '');
    return `${cleanCC}${cleaned}`;
  }

  // If already 11-15 digits (standard E.164 without plus)
  if (cleaned.length >= 11 && cleaned.length <= 15) {
    return cleaned;
  }

  // Return empty if outside valid international range
  return cleaned.length >= 7 ? cleaned : '';
}

/**
 * Validates whether a given phone number can produce a valid WhatsApp chat URL.
 * @param {string|number} phone
 * @returns {boolean}
 */
export function isValidWhatsAppNumber(phone) {
  const normalized = normalizeWhatsAppNumber(phone);
  return Boolean(normalized && normalized.length >= 10 && normalized.length <= 15);
}

/**
 * Formats a normalized phone number for user-friendly display (e.g. +91 98765 43210).
 * @param {string} phone
 * @returns {string}
 */
export function formatPhoneForDisplay(phone) {
  const norm = normalizeWhatsAppNumber(phone);
  if (!norm) return phone || '';

  if (norm.startsWith('91') && norm.length === 12) {
    return `+91 ${norm.slice(2, 7)} ${norm.slice(7)}`;
  }
  if (norm.startsWith('1') && norm.length === 11) {
    return `+1 (${norm.slice(1, 4)}) ${norm.slice(4, 7)}-${norm.slice(7)}`;
  }
  return `+${norm}`;
}

/**
 * Builds the standard https://wa.me/ URL for launching WhatsApp Web / App.
 * @param {string} phone
 * @param {string} message
 * @returns {string}
 */
export function buildWhatsAppUrl(phone, message = '') {
  const cleanPhone = normalizeWhatsAppNumber(phone);
  if (!cleanPhone) return '';

  const encodedText = message ? encodeURIComponent(message.trim()) : '';
  return encodedText
    ? `https://wa.me/${cleanPhone}?text=${encodedText}`
    : `https://wa.me/${cleanPhone}`;
}

/**
 * Opens WhatsApp chat in a new browser tab/app using standard wa.me link.
 * @param {string} phone
 * @param {string} message
 * @returns {{ success: boolean, url: string, blocked: boolean, error?: string }}
 */
export function openWhatsAppChat(phone, message = '') {
  const cleanPhone = normalizeWhatsAppNumber(phone);
  if (!cleanPhone) {
    return {
      success: false,
      url: '',
      blocked: false,
      error: 'Please enter or select a valid phone number.',
    };
  }

  const url = buildWhatsAppUrl(cleanPhone, message);
  try {
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win || win.closed || typeof win.closed === 'undefined') {
      return { success: true, url, blocked: true };
    }
    return { success: true, url, blocked: false };
  } catch (err) {
    return { success: false, url, blocked: true, error: err.message };
  }
}

/**
 * Predefined ERP CRM Message Templates
 */
export const MESSAGE_TEMPLATES = [
  {
    id: 'custom',
    label: 'Custom Message',
    category: 'General',
  },
  {
    id: 'quotation_followup',
    label: 'Quotation Follow-up',
    category: 'Sales',
  },
  {
    id: 'new_quotation',
    label: 'New Quotation',
    category: 'Sales',
  },
  {
    id: 'order_confirmation',
    label: 'Order Confirmation',
    category: 'Orders',
  },
  {
    id: 'payment_reminder',
    label: 'Payment Reminder',
    category: 'Accounts',
  },
  {
    id: 'order_update',
    label: 'Order Update',
    category: 'Production',
  },
  {
    id: 'delivery_update',
    label: 'Delivery Update',
    category: 'Logistics',
  },
  {
    id: 'general_followup',
    label: 'General Follow-up',
    category: 'General',
  },
];

/**
 * Generates populated message text based on template ID and customer parameters.
 */
export function generateTemplateMessage(templateId, params = {}) {
  const {
    customerName = 'Valued Client',
    repName = 'A2V Prints Team',
    quoteNo = '',
    orderNo = '',
    amount = '',
    customText = '',
  } = params;

  const firstName = customerName.split(' ')[0] || customerName;

  switch (templateId) {
    case 'custom':
      return customText || '';

    case 'quotation_followup':
      return `Hi ${firstName}, this is ${repName} from A2V Prints. I am following up regarding your quotation${quoteNo ? ` (${quoteNo})` : ''}. Please let me know if you have any questions or if you'd like to proceed with the order.`;

    case 'new_quotation':
      return `Dear ${firstName}, greetings from A2V Prints! Your quotation${quoteNo ? ` ${quoteNo}` : ''} has been generated and is ready for your review. Please check the specifications and commercial terms at your convenience.`;

    case 'order_confirmation':
      return `Hi ${firstName}, your order${orderNo ? ` #${orderNo}` : ''} has been confirmed with A2V Prints and sent to our production floor. Thank you for choosing us!`;

    case 'payment_reminder':
      return `Dear ${firstName}, this is a gentle reminder regarding the pending balance payment${amount ? ` of ₹${amount}` : ''} for your order with A2V Prints. Kindly share the transaction receipt or UTR once processed.`;

    case 'order_update':
      return `Hello ${firstName}, your print order${orderNo ? ` #${orderNo}` : ''} is currently in production and progressing on schedule. We will inform you as soon as final quality inspection is completed.`;

    case 'delivery_update':
      return `Great news ${firstName}! Your order${orderNo ? ` #${orderNo}` : ''} from A2V Prints has been dispatched and is on its way. Our delivery team will reach out to you shortly.`;

    case 'general_followup':
      return `Hi ${firstName}, this is ${repName} from A2V Prints. Checking in to see how we can assist you with your upcoming printing, signage, or packaging requirements. Have a great day!`;

    default:
      return customText || '';
  }
}
