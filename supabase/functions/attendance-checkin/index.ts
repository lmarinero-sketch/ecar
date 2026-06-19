import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  try {
    const { action, employee_id, metadata } = await req.json()

    // GET EMPLOYEES — returns list of active employees for check-in selection
    if (action === 'get_employees') {
      const { data, error } = await sb
        .from('employees')
        .select('id, full_name, cuil, dni, category_id, union_categories(name)')
        .eq('employment_status', 'active')
        .order('full_name')

      if (error) throw error
      return new Response(JSON.stringify({ employees: data || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // CHECK STATUS — check if employee already clocked in/out today
    if (action === 'check_status') {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await sb
        .from('attendance_records')
        .select('id, clock_in, clock_out, status')
        .eq('employee_id', employee_id)
        .eq('record_date', today)
        .maybeSingle()

      if (error) throw error
      return new Response(JSON.stringify({ record: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // CLOCK IN — register attendance entry
    if (action === 'clock_in') {
      const now = new Date()
      const today = now.toISOString().split('T')[0]
      const isoNow = now.toISOString()
      const displayTime = now.toTimeString().slice(0, 8)

      const { error } = await sb.from('attendance_records').insert({
        employee_id,
        record_date: today,
        clock_in: isoNow,
        status: 'present',
        source: 'mobile',
        worked_hours: 0,
        overtime_hours: 0,
        approved: false,
        metadata: metadata ? { device_in: metadata } : null,
      })

      if (error) throw error
      return new Response(JSON.stringify({ success: true, time: displayTime }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // CLOCK OUT — register attendance exit
    if (action === 'clock_out') {
      const now = new Date()
      const today = now.toISOString().split('T')[0]
      const isoNow = now.toISOString()
      const displayTime = now.toTimeString().slice(0, 8)

      const { error } = await sb
        .from('attendance_records')
        .update({
          clock_out: isoNow,
          status: 'present',
          metadata: metadata ? { device_out: metadata } : null,
        })
        .eq('employee_id', employee_id)
        .eq('record_date', today)
        .is('clock_out', null)

      if (error) throw error
      return new Response(JSON.stringify({ success: true, time: displayTime }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Acción no válida' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
