import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CreateSellerRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  commissionRate?: number;
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

    const requestData: CreateSellerRequest = await req.json();
    const { email, password, fullName, phone, commissionRate } = requestData;

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

    if (existingUser) {
      userId = existingUser.id;

      await supabase.auth.admin.updateUserById(userId, {
        password,
      });

      const { error: updateError } = await supabase
        .from("sellers")
        .update({
          full_name: fullName,
          phone: phone || null,
          commission_rate: commissionRate || 0,
          status: "active",
        })
        .eq("id", userId);

      if (updateError) {
        console.error("Erreur mise à jour seller:", updateError);
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

      const { error: sellerError } = await supabase
        .from("sellers")
        .insert({
          id: userId,
          email,
          full_name: fullName,
          phone: phone || null,
          commission_rate: commissionRate || 0,
          status: "active",
        });

      if (sellerError) {
        console.error("Erreur création seller:", sellerError);
        await supabase.auth.admin.deleteUser(userId);

        return new Response(
          JSON.stringify({ error: sellerError.message }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sellerId: userId,
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