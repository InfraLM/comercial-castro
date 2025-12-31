import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

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

  let client: Client | null = null;

  try {
    const { data_inicio, data_fim, data_inicio_anterior, data_fim_anterior } = await req.json();
    
    // Validate required dates
    if (!isValidDateFormat(data_inicio) || !isValidDateFormat(data_fim)) {
      return new Response(
        JSON.stringify({ error: 'Invalid date format. Use DD/MM/YYYY or YYYY-MM-DD' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate optional dates if provided
    if (data_inicio_anterior && !isValidDateFormat(data_inicio_anterior)) {
      return new Response(
        JSON.stringify({ error: 'Invalid date format for data_inicio_anterior. Use DD/MM/YYYY or YYYY-MM-DD' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (data_fim_anterior && !isValidDateFormat(data_fim_anterior)) {
      return new Response(
        JSON.stringify({ error: 'Invalid date format for data_fim_anterior. Use DD/MM/YYYY or YYYY-MM-DD' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log("Buscando vendas por produto:", { data_inicio, data_fim, data_inicio_anterior, data_fim_anterior });

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

    // Query para vendas por produto using parameterized queries
    const produtosResult = await client.queryObject(`
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

    // Query para financiamento (apenas Pós-Graduação) - semana atual
    const financiamentoResult = await client.queryObject(`
      SELECT 
        COALESCE(financiamento, 'Não informado') as financiamento,
        COUNT(*) as total
      FROM comercial_basemae
      WHERE TO_DATE(data_recebimento, 'DD/MM/YYYY') BETWEEN $1::date AND $2::date
        AND UPPER(produto_vendido) LIKE '%POS GRADUA%'
      GROUP BY financiamento
    `, [dataInicioConv, dataFimConv]);

    // Query para financiamento - semana anterior (se datas fornecidas)
    let financiamentoAnteriorResult: any = { rows: [] };
    if (data_inicio_anterior && data_fim_anterior) {
      const dataInicioAnteriorConv = convertDate(data_inicio_anterior);
      const dataFimAnteriorConv = convertDate(data_fim_anterior);
      
      financiamentoAnteriorResult = await client.queryObject(`
        SELECT 
          COALESCE(financiamento, 'Não informado') as financiamento,
          COUNT(*) as total
        FROM comercial_basemae
        WHERE TO_DATE(data_recebimento, 'DD/MM/YYYY') BETWEEN $1::date AND $2::date
          AND UPPER(produto_vendido) LIKE '%POS GRADUA%'
        GROUP BY financiamento
      `, [dataInicioAnteriorConv, dataFimAnteriorConv]);
    }

    const produtos = (produtosResult.rows as any[]).map((r: any) => ({
      produto: r.produto || 'Não especificado',
      total: Number(r.total) || 0,
      vendas_sdr: Number(r.vendas_sdr) || 0,
      vendas_closer: Number(r.vendas_closer) || 0
    }));

    // Processar dados de financiamento - semana atual
    let financiamentoSim = 0;
    let financiamentoNao = 0;
    for (const row of financiamentoResult.rows as any[]) {
      const valor = String(row.financiamento || '').toLowerCase().trim();
      const total = Number(row.total) || 0;
      if (valor === 'sim') {
        financiamentoSim += total;
      } else {
        financiamentoNao += total;
      }
    }

    // Processar dados de financiamento - semana anterior
    let financiamentoSimAnterior = 0;
    let financiamentoNaoAnterior = 0;
    for (const row of financiamentoAnteriorResult.rows as any[]) {
      const valor = String(row.financiamento || '').toLowerCase().trim();
      const total = Number(row.total) || 0;
      if (valor === 'sim') {
        financiamentoSimAnterior += total;
      } else {
        financiamentoNaoAnterior += total;
      }
    }

    const response = {
      produtos,
      financiamento: {
        com_financiamento: financiamentoSim,
        sem_financiamento: financiamentoNao
      },
      financiamento_anterior: {
        com_financiamento: financiamentoSimAnterior,
        sem_financiamento: financiamentoNaoAnterior
      }
    };

    console.log("Vendas por produto response:", response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error in fup-forecast-vendas-produto:", error);
    return new Response(JSON.stringify({ 
      produtos: [], 
      financiamento: { com_financiamento: 0, sem_financiamento: 0 },
      financiamento_anterior: { com_financiamento: 0, sem_financiamento: 0 }
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
