import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to convert BigInt to Number for JSON serialization
function convertBigInt(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let client: Client | null = null;

  try {
    const { tableName, data, webhookUrl } = await req.json();
    
    console.log('Inserting data into table:', { tableName, data, hasWebhook: !!webhookUrl });

    if (!tableName || !data) {
      throw new Error('tableName and data are required');
    }

    const dbHost = Deno.env.get('EXTERNAL_DB_HOST');
    const dbPort = Deno.env.get('EXTERNAL_DB_PORT');
    const dbName = Deno.env.get('EXTERNAL_DB_NAME');
    const dbUser = Deno.env.get('EXTERNAL_DB_USER');
    const dbPassword = Deno.env.get('EXTERNAL_DB_PASSWORD');
    const dbSchema = Deno.env.get('EXTERNAL_DB_SCHEMA') || 'public';

    if (!dbHost || !dbPort || !dbName || !dbUser || !dbPassword) {
      throw new Error('Database configuration is incomplete');
    }

    console.log('DB Config:', {
      dbHost,
      dbPort,
      dbName,
      dbUser,
      dbSchema
    });

    // Try to connect with TLS first
    try {
      client = new Client({
        user: dbUser,
        database: dbName,
        hostname: dbHost,
        port: parseInt(dbPort),
        password: dbPassword,
        tls: {
          enabled: true,
          enforce: false,
          caCertificates: [],
        },
      });
      await client.connect();
      console.log('Connected to database with TLS');
    } catch (tlsError) {
      console.error('TLS connection failed with message:', (tlsError as Error).message);
      console.log('Defaulting to non-encrypted connection');
      
      // Fallback to non-TLS connection
      client = new Client({
        user: dbUser,
        database: dbName,
        hostname: dbHost,
        port: parseInt(dbPort),
        password: dbPassword,
      });
      await client.connect();
    }

    console.log('Executing insert query');

    // Build the INSERT query
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    
    const query = `
      INSERT INTO ${dbSchema}.${tableName} (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;

    const result = await client.queryObject(query, values);
    const convertedResult = convertBigInt(result.rows);

    console.log('Insert successful, rows inserted:', convertedResult.length);

    // If webhook URL is provided, send the data there
    if (webhookUrl) {
      console.log('Sending data to webhook:', webhookUrl);
      try {
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tableName,
            data: convertedResult[0] || data,
            timestamp: new Date().toISOString(),
          }),
        });
        console.log('Webhook response status:', webhookResponse.status);
      } catch (webhookError) {
        console.error('Webhook error:', webhookError);
        // Don't fail the insert if webhook fails
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: convertedResult[0] || data,
        message: 'Data inserted successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    const err = error as Error;
    console.error('Error inserting data:', err.message);
    console.error('Error stack:', err.stack);
    
    return new Response(
      JSON.stringify({ 
        error: err.message,
        details: err.stack
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  } finally {
    if (client) {
      try {
        await client.end();
        console.log('Database connection closed');
      } catch (closeError) {
        console.error('Error closing connection:', closeError);
      }
    }
  }
});
