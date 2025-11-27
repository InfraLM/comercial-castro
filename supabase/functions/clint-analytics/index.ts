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

  const client = new Client({
    hostname: Deno.env.get("EXTERNAL_DB_HOST"),
    port: Number(Deno.env.get("EXTERNAL_DB_PORT")),
    database: Deno.env.get("EXTERNAL_DB_NAME"),
    user: Deno.env.get("EXTERNAL_DB_USER"),
    password: Deno.env.get("EXTERNAL_DB_PASSWORD"),
  });

  try {
    await client.connect();

    const { type, dateFrom, dateTo } = await req.json();

    let result: { rows: unknown[] } = { rows: [] };

    if (type === "sdr_performance") {
      // Cast varchar columns to integer for SUM
      const query = `
        SELECT 
          sdr,
          SUM(CAST(NULLIF(ligacoes, '') AS INTEGER)) as total_ligacoes,
          SUM(CAST(NULLIF(whatsap, '') AS INTEGER)) as total_whatsapp,
          COUNT(*) as dias_trabalhados
        FROM clint_sdr
        ${dateFrom && dateTo ? `WHERE dia_registro BETWEEN '${dateFrom}' AND '${dateTo}'` : ''}
        GROUP BY sdr
        ORDER BY total_ligacoes DESC NULLS LAST
      `;
      result = await client.queryObject(query);
    } else if (type === "daily_metrics") {
      // Cast varchar columns to integer
      const query = `
        SELECT 
          dia_registro,
          CAST(NULLIF(leads_recebidos, '') AS INTEGER) as leads_recebidos,
          CAST(NULLIF(prospeccao, '') AS INTEGER) as prospeccao,
          CAST(NULLIF(conexao, '') AS INTEGER) as conexao
        FROM clint_basemae
        ${dateFrom && dateTo ? `WHERE dia_registro BETWEEN '${dateFrom}' AND '${dateTo}'` : ''}
        ORDER BY dia_registro DESC
        LIMIT 30
      `;
      result = await client.queryObject(query);
    } else if (type === "sdr_daily") {
      const query = `
        SELECT 
          dia_registro,
          sdr,
          CAST(NULLIF(ligacoes, '') AS INTEGER) as ligacoes,
          CAST(NULLIF(whatsap, '') AS INTEGER) as whatsap,
          tempo
        FROM clint_sdr
        ${dateFrom && dateTo ? `WHERE dia_registro BETWEEN '${dateFrom}' AND '${dateTo}'` : ''}
        ORDER BY dia_registro DESC, sdr
        LIMIT 100
      `;
      result = await client.queryObject(query);
    } else if (type === "totals") {
      // Cast varchar columns to integer for SUM
      const sdrQuery = `
        SELECT 
          COALESCE(SUM(CAST(NULLIF(ligacoes, '') AS INTEGER)), 0) as total_ligacoes,
          COALESCE(SUM(CAST(NULLIF(whatsap, '') AS INTEGER)), 0) as total_whatsapp
        FROM clint_sdr
        ${dateFrom && dateTo ? `WHERE dia_registro BETWEEN '${dateFrom}' AND '${dateTo}'` : ''}
      `;
      const basemaeQuery = `
        SELECT 
          COALESCE(SUM(CAST(NULLIF(leads_recebidos, '') AS INTEGER)), 0) as total_leads,
          COALESCE(SUM(CAST(NULLIF(prospeccao, '') AS INTEGER)), 0) as total_prospeccao,
          COALESCE(SUM(CAST(NULLIF(conexao, '') AS INTEGER)), 0) as total_conexao
        FROM clint_basemae
        ${dateFrom && dateTo ? `WHERE dia_registro BETWEEN '${dateFrom}' AND '${dateTo}'` : ''}
      `;
      
      const sdrResult = await client.queryObject(sdrQuery);
      const basemaeResult = await client.queryObject(basemaeQuery);
      
      const sdrData = sdrResult.rows[0] as Record<string, unknown> || {};
      const basemaeData = basemaeResult.rows[0] as Record<string, unknown> || {};
      
      result = {
        rows: [{
          total_ligacoes: sdrData.total_ligacoes || 0,
          total_whatsapp: sdrData.total_whatsapp || 0,
          total_leads: basemaeData.total_leads || 0,
          total_prospeccao: basemaeData.total_prospeccao || 0,
          total_conexao: basemaeData.total_conexao || 0
        }]
      };
    }

    await client.end();

    return new Response(JSON.stringify({ data: result?.rows || [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error:", error);
    await client.end();
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
