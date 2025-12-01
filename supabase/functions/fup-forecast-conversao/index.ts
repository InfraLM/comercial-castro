import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let client: Client | null = null;

  try {
    const { data_inicio, data_fim, tipo } = await req.json();
    
    console.log("Buscando conversão:", { data_inicio, data_fim, tipo });

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

    if (tipo === 'sdr') {
      // Query para conversão por SDR
      const reunioesResult = await client.queryObject(`
        SELECT 
          sdr,
          COUNT(CASE WHEN UPPER(situacao) = 'SHOW' THEN 1 END) as reunioes_realizadas
        FROM reunioes_comercial
        WHERE TO_DATE(dia_registro, 'DD/MM/YYYY') BETWEEN $1::date AND $2::date
        GROUP BY sdr
      `, [dataInicioConv, dataFimConv]);

      const vendasResult = await client.queryObject(`
        SELECT 
          sdr_da_venda as sdr,
          COUNT(*) as vendas
        FROM comercial_basemae
        WHERE TO_DATE(data_recebimento, 'DD/MM/YYYY') BETWEEN $1::date AND $2::date
          AND venda_realizada_sdr = 'Sim'
        GROUP BY sdr_da_venda
      `, [dataInicioConv, dataFimConv]);

      const reunioesData = reunioesResult.rows as any[];
      const vendasData = vendasResult.rows as any[];

      const vendasMap = new Map();
      vendasData.forEach((v: any) => {
        vendasMap.set(v.sdr, Number(v.vendas) || 0);
      });

      const response = reunioesData.map((r: any) => ({
        sdr: r.sdr,
        reunioes_realizadas: Number(r.reunioes_realizadas) || 0,
        vendas: vendasMap.get(r.sdr) || 0
      }));

      console.log("Conversão SDR response:", response);

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

    } else {
      // Query para conversão por Closer
      const reunioesResult = await client.queryObject(`
        SELECT 
          closer,
          COUNT(CASE WHEN UPPER(situacao) = 'SHOW' THEN 1 END) as reunioes_realizadas
        FROM reunioes_comercial
        WHERE TO_DATE(dia_registro, 'DD/MM/YYYY') BETWEEN $1::date AND $2::date
        GROUP BY closer
      `, [dataInicioConv, dataFimConv]);

      const vendasResult = await client.queryObject(`
        SELECT 
          usuario_preenchimento as closer,
          COUNT(*) as vendas
        FROM comercial_basemae
        WHERE TO_DATE(data_recebimento, 'DD/MM/YYYY') BETWEEN $1::date AND $2::date
          AND produto_vendido = 'Pos Graduação'
        GROUP BY usuario_preenchimento
      `, [dataInicioConv, dataFimConv]);

      const reunioesData = reunioesResult.rows as any[];
      const vendasData = vendasResult.rows as any[];

      const vendasMap = new Map();
      vendasData.forEach((v: any) => {
        vendasMap.set(v.closer, Number(v.vendas) || 0);
      });

      const response = reunioesData.map((r: any) => ({
        closer: r.closer,
        reunioes_realizadas: Number(r.reunioes_realizadas) || 0,
        vendas: vendasMap.get(r.closer) || 0
      }));

      console.log("Conversão Closer response:", response);

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

  } catch (error) {
    console.error("Error in fup-forecast-conversao:", error);
    return new Response(JSON.stringify([]), {
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
