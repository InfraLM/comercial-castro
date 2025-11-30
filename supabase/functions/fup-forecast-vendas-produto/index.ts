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
    const { data_inicio, data_fim } = await req.json();
    
    console.log("Buscando vendas por produto:", { data_inicio, data_fim });

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

    const result = await client.queryObject(`
      SELECT 
        produto_vendido as produto,
        COUNT(*) as total,
        COUNT(CASE WHEN venda_realizada_sdr = 'Sim' THEN 1 END) as vendas_sdr,
        COUNT(CASE WHEN venda_realizada_sdr = 'Não' OR venda_realizada_sdr IS NULL THEN 1 END) as vendas_closer
      FROM comercial_basemae
      WHERE TO_DATE(data_recebimento, 'DD/MM/YYYY') BETWEEN $1::date AND $2::date
      GROUP BY produto_vendido
      ORDER BY COUNT(*) DESC
    `, [dataInicioConv, dataFimConv]);

    const response = (result.rows as any[]).map((r: any) => ({
      produto: r.produto || 'Não especificado',
      total: Number(r.total) || 0,
      vendas_sdr: Number(r.vendas_sdr) || 0,
      vendas_closer: Number(r.vendas_closer) || 0
    }));

    console.log("Vendas por produto response:", response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error in fup-forecast-vendas-produto:", error);
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
