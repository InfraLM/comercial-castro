import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Whitelist of allowed tables for reading
const ALLOWED_TABLES = [
  'comercial_reunioes',
  'comercial_sdr',
  'comercial_clint_basemae',
  'comercial_basemae',
  'comercial_clint_text'
];

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
    const { tableName, limit = 1000 } = await req.json();
    
    console.log('Getting table data:', { tableName, limit, user_id: user.id });

    if (!tableName) {
      throw new Error('tableName is required');
    }

    // Validate table name against whitelist
    if (!ALLOWED_TABLES.includes(tableName)) {
      return new Response(
        JSON.stringify({ success: false, error: `Table "${tableName}" is not allowed` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate limit
    const safeLimit = Math.min(Math.max(1, parseInt(String(limit)) || 1000), 10000);

    const dbHost = Deno.env.get('EXTERNAL_DB_HOST');
    const dbPort = Deno.env.get('EXTERNAL_DB_PORT');
    const dbName = Deno.env.get('EXTERNAL_DB_NAME');
    const dbUser = Deno.env.get('EXTERNAL_DB_USER');
    const dbPassword = Deno.env.get('EXTERNAL_DB_PASSWORD');
    const dbSchema = Deno.env.get('EXTERNAL_DB_SCHEMA');

    if (!dbHost || !dbPort || !dbName || !dbUser || !dbPassword || !dbSchema) {
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

    // Get column information
    const columnsQuery = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = $1 
      AND table_name = $2
      ORDER BY ordinal_position;
    `;

    console.log('Fetching column information');
    const columnsResult = await client.queryObject(columnsQuery, [dbSchema, tableName]);
    
    if (columnsResult.rows.length === 0) {
      await client.end();
      return new Response(
        JSON.stringify({
          success: false,
          error: `Table "${tableName}" not found in schema "${dbSchema}"`,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const columns = columnsResult.rows.map((row: any) => ({
      name: row.column_name,
      type: row.data_type,
      nullable: row.is_nullable === 'YES',
      default: row.column_default,
    }));

    // Get table data with validated limit
    const dataQuery = `SELECT * FROM "${dbSchema}"."${tableName}" LIMIT $1;`;
    
    console.log(`Fetching data from table (limit: ${safeLimit})`);
    
    try {
      const dataResult = await client.queryObject(dataQuery, [safeLimit]);
      const data = convertBigInt(dataResult.rows);
      
      await client.end();

      return new Response(
        JSON.stringify({
          success: true,
          tableName,
          schema: dbSchema,
          columns,
          data,
          rowCount: data.length,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (dataError: any) {
      // Handle permission errors
      if (dataError.message.includes('permission denied')) {
        await client.end();
        
        return new Response(
          JSON.stringify({
            success: false,
            error: `Permission denied to access table "${tableName}"`,
            columns,
          }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      throw dataError;
    }
  } catch (error) {
    console.error('Error in get-table-data function:', error);
    
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
