import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

// Validate date format (YYYY-MM-DD)
function isValidDateFormat(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

// Validate request type
const VALID_TYPES = ['sdr_performance', 'daily_metrics', 'sdr_daily', 'totals'];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify authentication
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Missing authorization header' }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  );

  const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
    authHeader.replace('Bearer ', '')
  );

  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
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

    // Validate type
    if (!type || !VALID_TYPES.includes(type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid type parameter' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate dates if provided
    if (dateFrom && !isValidDateFormat(dateFrom)) {
      return new Response(
        JSON.stringify({ error: 'Invalid dateFrom format. Use YYYY-MM-DD' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (dateTo && !isValidDateFormat(dateTo)) {
      return new Response(
        JSON.stringify({ error: 'Invalid dateTo format. Use YYYY-MM-DD' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result: { rows: unknown[] } = { rows: [] };

    if (type === "sdr_performance") {
      let query = `
        SELECT 
          sdr,
          COALESCE(SUM(${safeInt('ligacoes')}), 0)::integer as total_ligacoes,
          COALESCE(SUM(${safeInt('whatsap')}), 0)::integer as total_whatsapp,
          COUNT(*)::integer as dias_trabalhados
        FROM comercial_sdr
      `;
      const params: string[] = [];
      
      if (dateFrom && dateTo) {
        query += ` WHERE dia_registro BETWEEN $1 AND $2`;
        params.push(dateFrom, dateTo);
      }
      
      query += ` GROUP BY sdr ORDER BY total_ligacoes DESC NULLS LAST`;
      result = await client.queryObject(query, params);
    } else if (type === "daily_metrics") {
      let query = `
        SELECT 
          dia_registro,
          ${safeInt('leads_recebidos')} as leads_recebidos,
          ${safeInt('prospeccao')} as prospeccao,
          ${safeInt('conexao')} as conexao
        FROM comercial_clint_basemae
      `;
      const params: string[] = [];
      
      if (dateFrom && dateTo) {
        query += ` WHERE dia_registro BETWEEN $1 AND $2`;
        params.push(dateFrom, dateTo);
      }
      
      query += ` ORDER BY dia_registro DESC LIMIT 30`;
      result = await client.queryObject(query, params);
    } else if (type === "sdr_daily") {
      let query = `
        SELECT 
          dia_registro,
          sdr,
          ${safeInt('ligacoes')} as ligacoes,
          ${safeInt('whatsap')} as whatsap,
          tempo
        FROM comercial_sdr
      `;
      const params: string[] = [];
      
      if (dateFrom && dateTo) {
        query += ` WHERE dia_registro BETWEEN $1 AND $2`;
        params.push(dateFrom, dateTo);
      }
      
      query += ` ORDER BY dia_registro DESC, sdr LIMIT 100`;
      result = await client.queryObject(query, params);
    } else if (type === "totals") {
      let sdrQuery = `
        SELECT 
          COALESCE(SUM(${safeInt('ligacoes')}), 0)::integer as total_ligacoes,
          COALESCE(SUM(${safeInt('whatsap')}), 0)::integer as total_whatsapp
        FROM comercial_sdr
      `;
      let basemaeQuery = `
        SELECT 
          COALESCE(SUM(${safeInt('leads_recebidos')}), 0)::integer as total_leads,
          COALESCE(SUM(${safeInt('prospeccao')}), 0)::integer as total_prospeccao,
          COALESCE(SUM(${safeInt('conexao')}), 0)::integer as total_conexao
        FROM comercial_clint_basemae
      `;
      const params: string[] = [];
      
      if (dateFrom && dateTo) {
        sdrQuery += ` WHERE dia_registro BETWEEN $1 AND $2`;
        basemaeQuery += ` WHERE dia_registro BETWEEN $1 AND $2`;
        params.push(dateFrom, dateTo);
      }
      
      const sdrResult = await client.queryObject(sdrQuery, params);
      const basemaeResult = await client.queryObject(basemaeQuery, params);
      
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
