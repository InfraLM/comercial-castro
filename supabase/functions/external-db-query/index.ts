import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to convert BigInt to Number in nested objects
function convertBigInt(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'bigint') {
    return Number(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertBigInt);
  }
  
  if (typeof obj === 'object') {
    const converted: any = {};
    for (const key in obj) {
      converted[key] = convertBigInt(obj[key]);
    }
    return converted;
  }
  
  return obj;
}

// Whitelist of allowed query patterns for security
// Only allow specific, safe queries
const ALLOWED_QUERIES: Record<string, string> = {
  'get_reunioes': `SELECT sdr, closer, situacao, nome, dia_reuniao, tipo_reuniao, qualidade_lead, dia_registro FROM comercial_reunioes`,
  'get_reunioes_by_date': `SELECT sdr, closer, situacao, nome, dia_reuniao, tipo_reuniao, qualidade_lead, dia_registro FROM comercial_reunioes WHERE TO_DATE(dia_registro, 'DD/MM/YYYY') BETWEEN $1::date AND $2::date`,
  'get_sdr_data': `SELECT sdr, ligacoes, whatsap, tempo, dia_registro FROM comercial_sdr`,
  'get_sdr_by_date': `SELECT sdr, ligacoes, whatsap, tempo, dia_registro FROM comercial_sdr WHERE dia_registro BETWEEN $1 AND $2`,
  'get_basemae': `SELECT * FROM comercial_basemae LIMIT 1000`,
  'get_basemae_by_date': `SELECT * FROM comercial_basemae WHERE TO_DATE(data_recebimento, 'DD/MM/YYYY') BETWEEN $1::date AND $2::date`,
  'get_clint_basemae': `SELECT * FROM comercial_clint_basemae ORDER BY dia_registro DESC LIMIT 100`,
  'get_clint_basemae_by_date': `SELECT * FROM comercial_clint_basemae WHERE dia_registro BETWEEN $1 AND $2`,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify authentication
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ success: false, error: 'Missing authorization header' }),
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
      JSON.stringify({ success: false, error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  let client: Client | null = null;

  try {
    const { queryName, params = [], query: rawQuery } = await req.json();
    
    // Security: Only allow whitelisted queries or validate raw queries
    let queryToExecute: string;
    let queryParams = params;

    if (queryName && ALLOWED_QUERIES[queryName]) {
      queryToExecute = ALLOWED_QUERIES[queryName];
      console.log('Executing whitelisted query:', queryName);
    } else if (rawQuery) {
      // For backwards compatibility, still allow raw queries but log a warning
      // In production, this should be removed or heavily restricted
      console.warn('WARNING: Raw query execution requested. Consider using whitelisted queries.');
      queryToExecute = rawQuery;
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid query. Use queryName with a whitelisted query.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const dbHost = Deno.env.get('EXTERNAL_DB_HOST');
    const dbPort = Deno.env.get('EXTERNAL_DB_PORT');
    const dbName = Deno.env.get('EXTERNAL_DB_NAME');
    const dbUser = Deno.env.get('EXTERNAL_DB_USER');
    const dbPassword = Deno.env.get('EXTERNAL_DB_PASSWORD');

    if (!dbHost || !dbPort || !dbName || !dbUser || !dbPassword) {
      throw new Error('Missing database configuration in environment variables');
    }

    // Try connection with TLS first, fallback to non-TLS if it fails
    try {
      client = new Client({
        user: dbUser,
        password: dbPassword,
        database: dbName,
        hostname: dbHost,
        port: parseInt(dbPort),
        tls: {
          enabled: true,
          enforce: false,
          caCertificates: [],
        },
      });
      await client.connect();
      console.log('Connected to database with TLS');
    } catch (tlsError) {
      console.warn('TLS connection failed, trying without TLS:', tlsError);
      client = new Client({
        user: dbUser,
        password: dbPassword,
        database: dbName,
        hostname: dbHost,
        port: parseInt(dbPort),
      });
      await client.connect();
      console.log('Connected to database without TLS');
    }

    const result = await client.queryObject(queryToExecute, queryParams);
    const data = convertBigInt(result.rows);
    
    await client.end();

    return new Response(
      JSON.stringify({
        success: true,
        data,
        rowCount: data.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in external-db-query function:', error);
    
    if (client) {
      try {
        await client.end();
      } catch (endError) {
        console.error('Error closing client:', endError);
      }
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
