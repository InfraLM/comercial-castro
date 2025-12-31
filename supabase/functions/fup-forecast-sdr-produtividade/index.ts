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

async function fetchSDRData(client: Client, dataInicio: string, dataFim: string) {
  // Query para dados de produtividade por SDR
  const sdrResult = await client.queryObject(`
    SELECT 
      cs.sdr,
      COALESCE(SUM(cs.ligacoes), 0) as ligacoes,
      COALESCE(SUM(EXTRACT(EPOCH FROM cs.tempo::interval)), 0) as tempo_segundos,
      COALESCE(SUM(cs.whatsap), 0) as whatsapp
    FROM comercial_sdr cs
    WHERE TO_DATE(cs.dia_registro, 'DD/MM/YYYY') BETWEEN $1::date AND $2::date
    GROUP BY cs.sdr
  `, [dataInicio, dataFim]);

  // Query para reuniões por SDR
  const reunioesResult = await client.queryObject(`
    SELECT 
      sdr,
      COUNT(*) as reunioes_marcadas,
      COUNT(CASE WHEN UPPER(situacao) = 'SHOW' THEN 1 END) as reunioes_realizadas
    FROM comercial_reunioes
    WHERE TO_DATE(dia_registro, 'DD/MM/YYYY') BETWEEN $1::date AND $2::date
    GROUP BY sdr
  `, [dataInicio, dataFim]);

  const sdrData = sdrResult.rows as any[];
  const reunioesData = reunioesResult.rows as any[];

  // Combinar dados
  const reunioesMap = new Map();
  reunioesData.forEach((r: any) => {
    reunioesMap.set(r.sdr, {
      reunioes_marcadas: Number(r.reunioes_marcadas) || 0,
      reunioes_realizadas: Number(r.reunioes_realizadas) || 0
    });
  });

  const response = sdrData.map((sdr: any) => {
    const reunioesInfo = reunioesMap.get(sdr.sdr) || { reunioes_marcadas: 0, reunioes_realizadas: 0 };
    return {
      sdr: sdr.sdr,
      ligacoes: Number(sdr.ligacoes) || 0,
      tempo_segundos: Number(sdr.tempo_segundos) || 0,
      whatsapp: Number(sdr.whatsapp) || 0,
      reunioes_marcadas: reunioesInfo.reunioes_marcadas,
      reunioes_realizadas: reunioesInfo.reunioes_realizadas
    };
  });

  // Adicionar SDRs que têm reuniões mas não têm dados no comercial_sdr
  reunioesData.forEach((r: any) => {
    if (!response.find((s: any) => s.sdr === r.sdr)) {
      response.push({
        sdr: r.sdr,
        ligacoes: 0,
        tempo_segundos: 0,
        whatsapp: 0,
        reunioes_marcadas: Number(r.reunioes_marcadas) || 0,
        reunioes_realizadas: Number(r.reunioes_realizadas) || 0
      });
    }
  });

  return response;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify authentication
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Missing authorization header', semana_atual: [], semana_anterior: [] }),
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
      JSON.stringify({ error: 'Unauthorized', semana_atual: [], semana_anterior: [] }),
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
          JSON.stringify({ error: 'Invalid date format. Use DD/MM/YYYY or YYYY-MM-DD', semana_atual: [], semana_anterior: [] }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    console.log("Buscando produtividade SDR:", { data_inicio, data_fim, data_inicio_anterior, data_fim_anterior, user_id: user.id });

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

    const semanaAtual = await fetchSDRData(client, dataInicioConv, dataFimConv);
    const semanaAnterior = await fetchSDRData(client, dataInicioAntConv, dataFimAntConv);

    const response = {
      semana_atual: semanaAtual,
      semana_anterior: semanaAnterior
    };

    console.log("Produtividade SDR response:", response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error in fup-forecast-sdr-produtividade:", error);
    return new Response(JSON.stringify({ semana_atual: [], semana_anterior: [] }), {
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
