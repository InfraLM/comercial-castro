import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper to convert BigInt to Number in objects
function convertBigIntToNumber(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return Number(obj);
  if (Array.isArray(obj)) return obj.map(convertBigIntToNumber);
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = convertBigIntToNumber(value);
    }
    return result;
  }
  return obj;
}

// SQL helper to safely convert any column to integer
// Uses CASE to handle both integer and text columns
const safeInt = (col: string) => `
  CASE 
    WHEN ${col} IS NULL THEN 0
    WHEN ${col}::text = '' THEN 0
    WHEN ${col}::text ~ '^[0-9]+$' THEN ${col}::text::integer
    ELSE 0
  END
`;

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
      const query = `
        SELECT 
          sdr,
          COALESCE(SUM(${safeInt('ligacoes')}), 0)::integer as total_ligacoes,
          COALESCE(SUM(${safeInt('whatsap')}), 0)::integer as total_whatsapp,
          COUNT(*)::integer as dias_trabalhados
        FROM clint_sdr
        ${dateFrom && dateTo ? `WHERE dia_registro BETWEEN '${dateFrom}' AND '${dateTo}'` : ''}
        GROUP BY sdr
        ORDER BY total_ligacoes DESC NULLS LAST
      `;
      result = await client.queryObject(query);
    } else if (type === "daily_metrics") {
      const query = `
        SELECT 
          dia_registro,
          ${safeInt('leads_recebidos')} as leads_recebidos,
          ${safeInt('prospeccao')} as prospeccao,
          ${safeInt('conexao')} as conexao
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
          ${safeInt('ligacoes')} as ligacoes,
          ${safeInt('whatsap')} as whatsap,
          tempo
        FROM clint_sdr
        ${dateFrom && dateTo ? `WHERE dia_registro BETWEEN '${dateFrom}' AND '${dateTo}'` : ''}
        ORDER BY dia_registro DESC, sdr
        LIMIT 100
      `;
      result = await client.queryObject(query);
    } else if (type === "totals") {
      const sdrQuery = `
        SELECT 
          COALESCE(SUM(${safeInt('ligacoes')}), 0)::integer as total_ligacoes,
          COALESCE(SUM(${safeInt('whatsap')}), 0)::integer as total_whatsapp
        FROM clint_sdr
        ${dateFrom && dateTo ? `WHERE dia_registro BETWEEN '${dateFrom}' AND '${dateTo}'` : ''}
      `;
      const basemaeQuery = `
        SELECT 
          COALESCE(SUM(${safeInt('leads_recebidos')}), 0)::integer as total_leads,
          COALESCE(SUM(${safeInt('prospeccao')}), 0)::integer as total_prospeccao,
          COALESCE(SUM(${safeInt('conexao')}), 0)::integer as total_conexao
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

    // Convert any BigInt values to Number before serializing
    const convertedRows = convertBigIntToNumber(result?.rows || []);

    return new Response(JSON.stringify({ data: convertedRows }), {
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
