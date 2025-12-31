import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validate date format (DD/MM/YYYY or YYYY-MM-DD)
function isValidDateFormat(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const ddmmyyyyRegex = /^\d{2}\/\d{2}\/\d{4}$/;
  const yyyymmddRegex = /^\d{4}-\d{2}-\d{2}$/;
  return ddmmyyyyRegex.test(dateStr) || yyyymmddRegex.test(dateStr);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify authentication
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Missing authorization header' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  let client: Client | null = null;

  try {
    const { data_inicio, data_fim, data_inicio_anterior, data_fim_anterior } = await req.json();
    
    // Validate all date inputs
    const dates = [data_inicio, data_fim, data_inicio_anterior, data_fim_anterior];
    for (const date of dates) {
      if (date && !isValidDateFormat(date)) {
        return new Response(
          JSON.stringify({ error: 'Invalid date format. Use DD/MM/YYYY or YYYY-MM-DD' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    console.log("Buscando funil comercial:", { data_inicio, data_fim, data_inicio_anterior, data_fim_anterior, user_id: user.id });

    const dbHost = Deno.env.get("EXTERNAL_DB_HOST");
    const dbPort = Deno.env.get("EXTERNAL_DB_PORT");
    const dbName = Deno.env.get("EXTERNAL_DB_NAME");
    const dbUser = Deno.env.get("EXTERNAL_DB_USER");
    const dbPassword = Deno.env.get("EXTERNAL_DB_PASSWORD");
    const dbSchema = Deno.env.get("EXTERNAL_DB_SCHEMA") || "lovable";

    client = new Client({
      hostname: dbHost,
      port: parseInt(dbPort || "5432"),
      database: dbName,
      user: dbUser,
      password: dbPassword,
      tls: { enabled: false },
    });

    await client.connect();
    await client.queryObject(`SET search_path TO ${dbSchema}`);

    // Converter formato de data DD/MM/YYYY para YYYY-MM-DD se necessário
    const convertDate = (dateStr: string) => {
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      return dateStr;
    };

    const dataInicioConv = convertDate(data_inicio);
    const dataFimConv = convertDate(data_fim);
    const dataInicioAntConv = convertDate(data_inicio_anterior);
    const dataFimAntConv = convertDate(data_fim_anterior);

    // Query para semana atual - comercial_clint_basemae
    const basemaeAtualResult = await client.queryObject(`
      SELECT 
        COALESCE(SUM(leads_recebidos), 0) as leads_recebidos,
        COALESCE(SUM(prospeccao), 0) as prospeccao,
        COALESCE(SUM(conexao), 0) as conexao
      FROM comercial_clint_basemae
      WHERE TO_DATE(dia_registro, 'DD/MM/YYYY') BETWEEN $1::date AND $2::date
    `, [dataInicioConv, dataFimConv]);

    // Query para semana atual - reunioes
    const reunioesAtualResult = await client.queryObject(`
      SELECT 
        COUNT(*) as total_reunioes,
        COUNT(CASE WHEN UPPER(situacao) = 'SHOW' THEN 1 END) as shows
      FROM comercial_reunioes
      WHERE TO_DATE(dia_registro, 'DD/MM/YYYY') BETWEEN $1::date AND $2::date
    `, [dataInicioConv, dataFimConv]);

    // Query para semana atual - vendas (apenas Pós Graduação)
    const vendasAtualResult = await client.queryObject(`
      SELECT COUNT(*) as total_vendas
      FROM comercial_basemae
      WHERE TO_DATE(data_recebimento, 'DD/MM/YYYY') BETWEEN $1::date AND $2::date
        AND UPPER(produto_vendido) LIKE '%POS GRADUA%'
    `, [dataInicioConv, dataFimConv]);
    console.log("Vendas Pós Graduação atual:", vendasAtualResult.rows);

    // Query para semana anterior - comercial_clint_basemae
    const basemaeAnteriorResult = await client.queryObject(`
      SELECT 
        COALESCE(SUM(leads_recebidos), 0) as leads_recebidos,
        COALESCE(SUM(prospeccao), 0) as prospeccao,
        COALESCE(SUM(conexao), 0) as conexao
      FROM comercial_clint_basemae
      WHERE TO_DATE(dia_registro, 'DD/MM/YYYY') BETWEEN $1::date AND $2::date
    `, [dataInicioAntConv, dataFimAntConv]);

    // Query para semana anterior - reunioes
    const reunioesAnteriorResult = await client.queryObject(`
      SELECT 
        COUNT(*) as total_reunioes,
        COUNT(CASE WHEN UPPER(situacao) = 'SHOW' THEN 1 END) as shows
      FROM comercial_reunioes
      WHERE TO_DATE(dia_registro, 'DD/MM/YYYY') BETWEEN $1::date AND $2::date
    `, [dataInicioAntConv, dataFimAntConv]);

    // Query para semana anterior - vendas (apenas Pós Graduação)
    const vendasAnteriorResult = await client.queryObject(`
      SELECT COUNT(*) as total_vendas
      FROM comercial_basemae
      WHERE TO_DATE(data_recebimento, 'DD/MM/YYYY') BETWEEN $1::date AND $2::date
        AND UPPER(produto_vendido) LIKE '%POS GRADUA%'
    `, [dataInicioAntConv, dataFimAntConv]);

    const basemaeAtual = basemaeAtualResult.rows[0] as any || {};
    const reunioesAtual = reunioesAtualResult.rows[0] as any || {};
    const vendasAtual = vendasAtualResult.rows[0] as any || {};

    const basemaeAnterior = basemaeAnteriorResult.rows[0] as any || {};
    const reunioesAnterior = reunioesAnteriorResult.rows[0] as any || {};
    const vendasAnterior = vendasAnteriorResult.rows[0] as any || {};

    const response = {
      semana_atual: {
        leads_recebido: Number(basemaeAtual.leads_recebidos) || 0,
        prospeccao: Number(basemaeAtual.prospeccao) || 0,
        conexao: Number(basemaeAtual.conexao) || 0,
        reunioes_marcadas: Number(reunioesAtual.total_reunioes) || 0,
        reunioes_realizadas: Number(reunioesAtual.shows) || 0,
        vendas: Number(vendasAtual.total_vendas) || 0
      },
      semana_anterior: {
        leads_recebido: Number(basemaeAnterior.leads_recebidos) || 0,
        prospeccao: Number(basemaeAnterior.prospeccao) || 0,
        conexao: Number(basemaeAnterior.conexao) || 0,
        reunioes_marcadas: Number(reunioesAnterior.total_reunioes) || 0,
        reunioes_realizadas: Number(reunioesAnterior.shows) || 0,
        vendas: Number(vendasAnterior.total_vendas) || 0
      }
    };

    console.log("Funil response:", response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in fup-forecast-funil:", errorMessage);
    return new Response(JSON.stringify({ 
      error: errorMessage,
      semana_atual: { leads_recebido: 0, prospeccao: 0, conexao: 0, reunioes_marcadas: 0, reunioes_realizadas: 0, vendas: 0 },
      semana_anterior: { leads_recebido: 0, prospeccao: 0, conexao: 0, reunioes_marcadas: 0, reunioes_realizadas: 0, vendas: 0 }
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } finally {
    if (client) {
      try {
        await client.end();
      } catch (e) {
        console.error("Error closing connection:", e);
      }
    }
  }
});
