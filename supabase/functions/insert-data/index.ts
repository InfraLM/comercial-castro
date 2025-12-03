import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Maximum safe string length for PostgreSQL wire protocol
const MAX_STRING_LENGTH = 50000;

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

// Split large text columns and identify which need chunking
function processDataForInsert(data: Record<string, any>): {
  initialData: Record<string, any>;
  largeTextColumns: { column: string; chunks: string[] }[];
} {
  const initialData: Record<string, any> = {};
  const largeTextColumns: { column: string; chunks: string[] }[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string' && value.length > MAX_STRING_LENGTH) {
      // Store empty string initially, will update in chunks
      initialData[key] = '';
      
      // Split into chunks
      const chunks: string[] = [];
      for (let i = 0; i < value.length; i += MAX_STRING_LENGTH) {
        chunks.push(value.slice(i, i + MAX_STRING_LENGTH));
      }
      largeTextColumns.push({ column: key, chunks });
    } else {
      initialData[key] = value;
    }
  }

  return { initialData, largeTextColumns };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let client: Client | null = null;

  try {
    const { tableName, data, webhookUrl } = await req.json();
    
    console.log('Inserting data into table:', tableName, 'columns:', Object.keys(data));

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

    console.log('DB Config:', { dbHost, dbPort, dbName, dbUser, dbSchema });

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
      console.error('TLS connection failed:', (tlsError as Error).message);
      console.log('Defaulting to non-encrypted connection');
      
      client = new Client({
        user: dbUser,
        database: dbName,
        hostname: dbHost,
        port: parseInt(dbPort),
        password: dbPassword,
      });
      await client.connect();
    }

    // Process data to handle large text columns
    const { initialData, largeTextColumns } = processDataForInsert(data);
    
    console.log('Large text columns to chunk:', largeTextColumns.map(c => c.column));

    // Build the initial INSERT query with parameterized values
    const columns = Object.keys(initialData);
    const values = Object.values(initialData);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    
    const insertQuery = `
      INSERT INTO ${dbSchema}.${tableName} (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;

    console.log('Executing initial insert');
    const result = await client.queryObject(insertQuery, values);
    let insertedRow = result.rows[0] as Record<string, any>;
    
    console.log('Initial insert successful');

    // If there are large text columns, update them in chunks
    if (largeTextColumns.length > 0 && insertedRow) {
      // Get the primary key for updates (assuming 'id' or first column returned)
      const pkColumn = 'dia_registro'; // Use dia_registro as identifier for clint_text
      const pkValue = insertedRow[pkColumn] || data[pkColumn];
      
      for (const { column, chunks } of largeTextColumns) {
        console.log(`Updating ${column} in ${chunks.length} chunks`);
        
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const updateQuery = `
            UPDATE ${dbSchema}.${tableName}
            SET ${column} = ${column} || $1
            WHERE ${pkColumn} = $2
          `;
          await client.queryObject(updateQuery, [chunk, pkValue]);
        }
        
        console.log(`Finished updating ${column}`);
      }
      
      // Fetch the final row with complete data
      const selectQuery = `
        SELECT * FROM ${dbSchema}.${tableName}
        WHERE ${pkColumn} = $1
        LIMIT 1
      `;
      const finalResult = await client.queryObject(selectQuery, [pkValue]);
      if (finalResult.rows.length > 0) {
        insertedRow = finalResult.rows[0] as Record<string, any>;
      }
    }

    const convertedResult = convertBigInt(insertedRow);
    console.log('Insert completed successfully');

    // If webhook URL is provided, send the data there
    if (webhookUrl) {
      console.log('Sending data to webhook:', webhookUrl);
      try {
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tableName,
            data: convertedResult || data,
            timestamp: new Date().toISOString(),
          }),
        });
        console.log('Webhook response status:', webhookResponse.status);
      } catch (webhookError) {
        console.error('Webhook error:', webhookError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: convertedResult || data,
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
