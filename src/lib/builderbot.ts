// BuilderBot WhatsApp via Supabase Edge Function
// The API key stays server-side in the Edge Function

import { supabase } from './supabase';

export interface WhatsAppMessage {
  number: string;
  content: string;
  mediaUrl?: string;
}

export interface WhatsAppSendResult {
  success: boolean;
  error?: string;
  number: string;
}

/**
 * Send a WhatsApp message via the send-whatsapp Edge Function
 */
export async function sendWhatsAppMessage(msg: WhatsAppMessage): Promise<WhatsAppSendResult> {
  try {
    const { data, error } = await supabase.functions.invoke('send-whatsapp', {
      body: {
        number: msg.number,
        content: msg.content,
        ...(msg.mediaUrl ? { mediaUrl: msg.mediaUrl } : {}),
      },
    });

    if (error) {
      return { success: false, error: error.message, number: msg.number };
    }

    return data as WhatsAppSendResult;
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error de conexión', number: msg.number };
  }
}

/**
 * Format Argentine phone number for WhatsApp
 * Accepts: "1112345678", "011-1234-5678", "+54 9 11 1234 5678", etc.
 * Returns: "5491112345678"
 */
export function formatArgPhone(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (digits.startsWith('15')) digits = digits.slice(2);
  if (!digits.startsWith('54')) digits = '549' + digits;
  if (digits.startsWith('54') && !digits.startsWith('549')) {
    digits = '549' + digits.slice(2);
  }
  return digits;
}
