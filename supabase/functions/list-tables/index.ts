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
    console.log('Starting list-tables function');
    
    const dbHost = Deno.env.get('EXTERNAL_DB_HOST');
    const dbPort = Deno.env.get('EXTERNAL_DB_PORT');
    const dbName = Deno.env.get('EXTERNAL_DB_NAME');
    const dbUser = Deno.env.get('EXTERNAL_DB_USER');
    const dbPassword = Deno.env.get('EXTERNAL_DB_PASSWORD');
    const dbSchema = Deno.env.get('EXTERNAL_DB_SCHEMA');

    console.log('DB Config:', { dbHost, dbPort, dbName, dbUser, dbSchema });

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

    // Query to list all tables in the specified schema
    const query = `
      SELECT 
        table_name,
        (
          SELECT COUNT(*) 
          FROM information_schema.columns 
          WHERE table_schema = $1 
          AND table_name = t.table_name
        ) as column_count
      FROM information_schema.tables t
      WHERE table_schema = $1
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    console.log('Executing query to list tables');
    const result = await client.queryObject(query, [dbSchema]);
    console.log(`Found ${result.rows.length} tables`);

    // Convert BigInt to Number
    const tables = result.rows.map((row: any) => ({
      tableName: row.table_name,
      columnCount: Number(row.column_count),
    }));

    await client.end();

    return new Response(
      JSON.stringify({
        success: true,
        schema: dbSchema,
        tables,
        totalTables: tables.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in list-tables function:', error);
    
    if (client) {
      try {
        await client.end();
      } catch (endError) {
        console.error('Error closing client:', endError);
      }
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorDetails = error instanceof Error ? error.toString() : String(error);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        details: errorDetails,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
