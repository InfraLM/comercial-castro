import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { data_inicio, data_fim } = await req.json();

    const client = new Client({
      hostname: Deno.env.get("EXTERNAL_DB_HOST"),
      port: Number(Deno.env.get("EXTERNAL_DB_PORT")),
      database: Deno.env.get("EXTERNAL_DB_NAME"),
      user: Deno.env.get("EXTERNAL_DB_USER"),
      password: Deno.env.get("EXTERNAL_DB_PASSWORD"),
    });

    await client.connect();

    const schema = Deno.env.get("EXTERNAL_DB_SCHEMA") || "lovable";

    // Query para pegar qualidade de leads por SDR
    const query = `
      SELECT 
        sdr,
        qualidade_lead,
        COUNT(*) as quantidade
      FROM ${schema}.comercial_reunioes
      WHERE dia_reuniao >= $1 AND dia_reuniao <= $2
        AND qualidade_lead IS NOT NULL 
        AND qualidade_lead != ''
      GROUP BY sdr, qualidade_lead
      ORDER BY sdr, qualidade_lead
    `;

    const result = await client.queryObject(query, [data_inicio, data_fim]);

    await client.end();

    // Processar dados para o formato esperado
    const data = result.rows.map((row: any) => ({
      sdr: row.sdr,
      qualidade_lead: row.qualidade_lead,
      quantidade: Number(row.quantidade),
    }));

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
