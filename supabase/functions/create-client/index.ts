import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CreateClientRequest {
  email: string;
  password: string;
  fullName: string;
  companyName?: string;
  phone?: string;
  address?: string;
  projectDescription?: string;
  assignedAgentName?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const requestData: CreateClientRequest = await req.json();
    const { email, password, fullName, companyName, phone, address, projectDescription, assignedAgentName } = requestData;

    if (!email || !password || !fullName) {
      return new Response(
        JSON.stringify({ error: "Email, password et nom complet sont requis" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users.find(u => u.email === email);

    let userId: string;
    let clientId: number;

    if (existingUser) {
      userId = existingUser.id;

      const { data: existingClient } = await supabase
        .from("clients")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (existingClient) {
        clientId = existingClient.id;
        const { error: updateError } = await supabase
          .from("clients")
          .update({
            full_name: fullName,
            company_name: companyName || null,
            phone: phone || null,
            address: address || null,
            project_description: projectDescription || null,
            assigned_agent_name: assignedAgentName || null,
            status: "active",
          })
          .eq("id", clientId);

        if (updateError) {
          console.error("Erreur mise à jour client:", updateError);
        }
      }
    } else {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (authError) {
        console.error("Erreur création utilisateur:", authError);
        return new Response(
          JSON.stringify({ error: authError.message }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      userId = authData.user.id;

      const { data: maxIdData } = await supabase
        .from("clients")
        .select("id")
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle();

      clientId = maxIdData ? maxIdData.id + 1 : 10000;

      const { error: clientError } = await supabase
        .from("clients")
        .insert({
          id: clientId,
          email,
          full_name: fullName,
          company_name: companyName || null,
          phone: phone || null,
          address: address || null,
          project_description: projectDescription || null,
          assigned_agent_name: assignedAgentName || null,
          status: "active",
        });

      if (clientError) {
        console.error("Erreur création client:", clientError);
        await supabase.auth.admin.deleteUser(userId);

        return new Response(
          JSON.stringify({ error: clientError.message }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { error: pinError } = await supabase
        .from("password_pins")
        .insert({
          user_id: userId,
          pin: password,
          updated_at: new Date().toISOString()
        });

      if (pinError) {
        console.error("Erreur stockage PIN:", pinError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        clientId: clientId,
        email
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erreur serveur:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});