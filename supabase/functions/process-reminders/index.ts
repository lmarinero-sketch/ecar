import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * process-reminders — Edge Function
 * 
 * Called every 5 minutes by pg_cron.
 * Reads notification_reminders where next_run_at <= now() and is_active = true,
 * sends WhatsApp messages via BuilderBot, logs results, and updates next_run_at.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BUILDERBOT_API_KEY = 'bb-3c45fa69-2776-4275-82b6-2d6df9e08ec6';
const BUILDERBOT_PROJECT_ID = 'c3fd918b-b736-40dc-a841-cbb73d3b2a8d';
const BUILDERBOT_URL = `https://app.builderbot.cloud/api/v2/${BUILDERBOT_PROJECT_ID}/messages`;

/**
 * Send WhatsApp message via BuilderBot cloud API
 */
async function sendWhatsApp(phone: string, content: string): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanNumber = phone.replace(/\D/g, '');
    const res = await fetch(BUILDERBOT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-builderbot': BUILDERBOT_API_KEY,
      },
      body: JSON.stringify({
        messages: { content },
        number: cleanNumber,
        checkIfExists: false,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: `BuilderBot ${res.status}: ${errText}` };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error de conexión' };
  }
}

/**
 * Calculate the next run time based on recurrence, schedule_days, schedule_time, and date range
 */
function calculateNextRun(
  recurrence: string,
  scheduleDays: number[] | null,
  scheduleTime: string | null,
  dateUntil: string | null,
): string | null {
  const now = new Date();
  const [hours, minutes] = (scheduleTime || '09:00').split(':').map(Number);

  // If date_until has passed, don't schedule another run
  if (dateUntil) {
    const until = new Date(dateUntil + 'T23:59:59');
    if (now > until) return null;
  }

  switch (recurrence) {
    case 'daily': {
      const days = scheduleDays?.length ? scheduleDays : [0, 1, 2, 3, 4, 5, 6];
      // Find next matching day (start from tomorrow)
      for (let d = 1; d <= 8; d++) {
        const candidate = new Date(now.getTime() + d * 86400000);
        candidate.setHours(hours, minutes, 0, 0);
        if (days.includes(candidate.getDay())) {
          if (dateUntil && candidate > new Date(dateUntil + 'T23:59:59')) return null;
          return candidate.toISOString();
        }
      }
      return null;
    }

    case 'weekly': {
      const days = scheduleDays?.length ? scheduleDays : [1]; // Default Monday
      for (let d = 1; d <= 8; d++) {
        const candidate = new Date(now.getTime() + d * 86400000);
        candidate.setHours(hours, minutes, 0, 0);
        if (days.includes(candidate.getDay())) {
          if (dateUntil && candidate > new Date(dateUntil + 'T23:59:59')) return null;
          return candidate.toISOString();
        }
      }
      return null;
    }

    case 'monthly': {
      const daysOfMonth = scheduleDays?.length ? scheduleDays : [1];
      // Try current month first, then next month
      for (let monthOffset = 0; monthOffset <= 1; monthOffset++) {
        const baseMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
        for (const dayOfMonth of daysOfMonth) {
          const candidate = new Date(baseMonth.getFullYear(), baseMonth.getMonth(), dayOfMonth, hours, minutes, 0);
          if (candidate > now) {
            if (dateUntil && candidate > new Date(dateUntil + 'T23:59:59')) return null;
            return candidate.toISOString();
          }
        }
      }
      return null;
    }

    case 'once':
    default:
      return null; // One-time reminders don't reschedule
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log("=== PROCESS-REMINDERS: Inicio ===");
    const now = new Date().toISOString();

    // 1. Find all active reminders where next_run_at <= now
    const { data: dueReminders, error: fetchErr } = await supabase
      .from('notification_reminders')
      .select('*')
      .eq('is_active', true)
      .not('next_run_at', 'is', null)
      .lte('next_run_at', now);

    if (fetchErr) {
      console.error("Error fetching reminders:", fetchErr.message);
      return new Response(JSON.stringify({ error: fetchErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!dueReminders || dueReminders.length === 0) {
      console.log("No hay recordatorios pendientes.");
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Encontré ${dueReminders.length} recordatorio(s) pendiente(s).`);

    let totalSent = 0;
    let totalFailed = 0;

    for (const reminder of dueReminders) {
      console.log(`Procesando: "${reminder.title}" (${reminder.id})`);

      // Check date_from — skip if not yet active
      if (reminder.date_from) {
        const from = new Date(reminder.date_from);
        if (new Date() < from) {
          console.log(`  Omitido: date_from (${reminder.date_from}) aún no llegó.`);
          continue;
        }
      }

      // Check date_until — deactivate if expired
      if (reminder.date_until) {
        const until = new Date(reminder.date_until + 'T23:59:59');
        if (new Date() > until) {
          console.log(`  Desactivando: date_until (${reminder.date_until}) ya pasó.`);
          await supabase.from('notification_reminders').update({
            is_active: false,
            next_run_at: null,
          }).eq('id', reminder.id);
          continue;
        }
      }

      // 2. Get contacts for this reminder
      const contactIds: string[] = reminder.contact_ids || [];
      if (contactIds.length === 0) {
        console.log(`  Sin contactos, omitido.`);
        continue;
      }

      const { data: contacts } = await supabase
        .from('notification_contacts')
        .select('id, name, phone')
        .in('id', contactIds)
        .eq('is_active', true);

      if (!contacts || contacts.length === 0) {
        console.log(`  Contactos no encontrados o inactivos.`);
        continue;
      }

      // 3. Send WhatsApp to each contact
      for (const contact of contacts) {
        const content = (reminder.message_template || '')
          .replace('{nombre}', contact.name)
          .replace('{fecha}', new Date().toLocaleDateString('es-AR'));

        console.log(`  Enviando a ${contact.name} (${contact.phone})...`);
        const result = await sendWhatsApp(contact.phone, content);

        // 4. Log the result
        await supabase.from('notification_log').insert({
          tenant_id: reminder.tenant_id,
          reminder_id: reminder.id,
          contact_id: contact.id,
          contact_name: contact.name,
          contact_phone: contact.phone,
          message_content: content,
          status: result.success ? 'sent' : 'failed',
          error_message: result.error || null,
        });

        if (result.success) {
          totalSent++;
          console.log(`  ✅ Enviado a ${contact.name}`);
        } else {
          totalFailed++;
          console.log(`  ❌ Error: ${result.error}`);
        }

        // Small delay between messages to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // 5. Update last_triggered_at and calculate next_run_at
      const nextRun = calculateNextRun(
        reminder.recurrence,
        reminder.schedule_days,
        reminder.schedule_time,
        reminder.date_until,
      );

      await supabase.from('notification_reminders').update({
        last_triggered_at: now,
        next_run_at: nextRun,
        // If it's a one-time reminder, deactivate after sending
        ...(reminder.recurrence === 'once' ? { is_active: false } : {}),
      }).eq('id', reminder.id);

      console.log(`  next_run_at → ${nextRun || 'desactivado'}`);
    }

    console.log(`=== PROCESS-REMINDERS: Fin — ${totalSent} enviados, ${totalFailed} fallidos ===`);

    return new Response(JSON.stringify({
      processed: dueReminders.length,
      sent: totalSent,
      failed: totalFailed,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("ERROR FATAL:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
