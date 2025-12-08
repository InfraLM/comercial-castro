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
    const { sdr, closer, nome, dia_reuniao } = await req.json();
    
    console.log('Deleting meeting:', { sdr, closer, nome, dia_reuniao });

    if (!sdr || !dia_reuniao || !nome) {
      throw new Error('sdr, nome, and dia_reuniao are required');
    }

    const dbHost = Deno.env.get('EXTERNAL_DB_HOST');
    const dbPort = Deno.env.get('EXTERNAL_DB_PORT');
    const dbName = Deno.env.get('EXTERNAL_DB_NAME');
    const dbUser = Deno.env.get('EXTERNAL_DB_USER');
    const dbPassword = Deno.env.get('EXTERNAL_DB_PASSWORD');

    if (!dbHost || !dbPort || !dbName || !dbUser || !dbPassword) {
      throw new Error('Missing database configuration in environment variables');
    }

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
      const errorMsg = tlsError instanceof Error ? tlsError.message : 'Unknown TLS error';
      console.error('TLS connection failed with message:', errorMsg);
      console.log('Defaulting to non-encrypted connection');
      client = new Client({
        user: dbUser,
        password: dbPassword,
        database: dbName,
        hostname: dbHost,
        port: parseInt(dbPort),
      });
      await client.connect();
    }

    const deleteQuery = `
      DELETE FROM comercial_reunioes 
      WHERE sdr = $1 
        AND nome = $2 
        AND dia_reuniao = $3
        AND (closer = $4 OR (closer IS NULL AND $4 IS NULL))
    `;
    
    const result = await client.queryObject(deleteQuery, [sdr, nome, dia_reuniao, closer || null]);
    
    await client.end();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Meeting deleted successfully',
        rowsAffected: result.rowCount || 0,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in delete-meeting function:', error);
    
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