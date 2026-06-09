import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Create admin client with service role
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify caller is admin
    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: { user: caller } } = await supabaseUser.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (!caller) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("auth_user_id", caller.id)
      .single();

    if (!callerProfile || callerProfile.role !== "admin") {
      return new Response(JSON.stringify({ error: "Solo administradores pueden gestionar usuarios" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const body = await req.json();
    const { action } = body;

    // ── CREATE USER ──
    if (action === "create") {
      const { email, password, fullName, role, allowedModules } = body;

      if (!email || !password || !fullName) {
        return new Response(JSON.stringify({ error: "email, password y fullName son requeridos" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Create auth user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });

      if (createError) {
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Get caller's tenant
      const { data: callerFull } = await supabaseAdmin
        .from("profiles")
        .select("tenant_id")
        .eq("auth_user_id", caller.id)
        .single();

      // Create profile
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .insert({
          auth_user_id: newUser.user.id,
          tenant_id: callerFull?.tenant_id || "a0000000-0000-0000-0000-000000000001",
          full_name: fullName,
          email,
          role: role || "operario",
          allowed_modules: allowedModules || [],
        });

      if (profileError) {
        return new Response(JSON.stringify({ error: profileError.message }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      return new Response(JSON.stringify({ success: true, user_id: newUser.user.id }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // ── UPDATE USER ROLE / MODULES ──
    if (action === "update") {
      const { profileId, role, allowedModules, fullName } = body;

      if (!profileId) {
        return new Response(JSON.stringify({ error: "profileId requerido" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const updates: Record<string, unknown> = {};
      if (role) updates.role = role;
      if (allowedModules) updates.allowed_modules = allowedModules;
      if (fullName) updates.full_name = fullName;

      const { error } = await supabaseAdmin
        .from("profiles")
        .update(updates)
        .eq("id", profileId);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // ── DELETE USER ──
    if (action === "delete") {
      const { profileId, authUserId } = body;

      if (!profileId || !authUserId) {
        return new Response(JSON.stringify({ error: "profileId y authUserId requeridos" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Don't allow deleting yourself
      if (authUserId === caller.id) {
        return new Response(JSON.stringify({ error: "No podés eliminar tu propia cuenta" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      await supabaseAdmin.from("profiles").delete().eq("id", profileId);
      await supabaseAdmin.auth.admin.deleteUser(authUserId);

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ error: "Acción no válida" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("manage-users error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
