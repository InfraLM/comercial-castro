import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Database, CheckCircle2, XCircle, Info } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const Index = () => {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  // Query to list all tables
  const { data: tablesData, isLoading: isLoadingTables, error: tablesError } = useQuery({
    queryKey: ['tables'],
    queryFn: async () => {
      console.log('Fetching tables list...');
      const response = await fetch(`${SUPABASE_URL}/functions/v1/list-tables`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      console.log('Tables response:', data);
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch tables');
      }
      
      return data;
    },
  });

  // Query to get data from selected table
  const { data: tableData, isLoading: isLoadingTableData } = useQuery({
    queryKey: ['table-data', selectedTable],
    queryFn: async () => {
      if (!selectedTable) return null;
      
      console.log('Fetching data for table:', selectedTable);
      const response = await fetch(`${SUPABASE_URL}/functions/v1/get-table-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tableName: selectedTable, limit: 100 }),
      });
      
      const data = await response.json();
      console.log('Table data response:', data);
      
      if (!data.success) {
        if (data.suggestion) {
          toast.error('Permission Error', {
            description: data.suggestion,
          });
        }
        throw new Error(data.error || 'Failed to fetch table data');
      }
      
      return data;
    },
    enabled: !!selectedTable,
  });

  const handleTableClick = (tableName: string) => {
    setSelectedTable(tableName);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Database className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">External Database Connection</h1>
            <p className="text-muted-foreground">Monitor and explore your PostgreSQL tables</p>
          </div>
        </div>

        {/* Connection Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isLoadingTables ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : tablesError ? (
                <XCircle className="h-5 w-5 text-destructive" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )}
              Connection Status
            </CardTitle>
            <CardDescription>
              {isLoadingTables && "Connecting to external database..."}
              {tablesError && "Failed to connect to database"}
              {tablesData && `Connected to schema: ${tablesData.schema}`}
            </CardDescription>
          </CardHeader>
          {tablesError && (
            <CardContent>
              <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
                <p className="font-semibold">Error:</p>
                <p>{(tablesError as Error).message}</p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Tables List */}
        {tablesData && (
          <Card>
            <CardHeader>
              <CardTitle>Available Tables ({tablesData.totalTables})</CardTitle>
              <CardDescription>Click on a table to view its data and columns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {tablesData.tables.map((table: any) => (
                  <Button
                    key={table.tableName}
                    variant={selectedTable === table.tableName ? "default" : "outline"}
                    className="h-auto py-4 px-4 justify-start"
                    onClick={() => handleTableClick(table.tableName)}
                  >
                    <div className="flex flex-col items-start gap-1 w-full">
                      <span className="font-semibold">{table.tableName}</span>
                      <span className="text-xs text-muted-foreground">
                        {table.columnCount} columns
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Selected Table Data */}
        {selectedTable && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Table: {selectedTable}
                {isLoadingTableData && <Loader2 className="h-4 w-4 animate-spin" />}
              </CardTitle>
              <CardDescription>
                {tableData && `${tableData.rowCount} rows • ${tableData.columns.length} columns`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Columns Info */}
              {tableData && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Columns
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {tableData.columns.map((col: any) => (
                      <Badge key={col.name} variant="secondary">
                        {col.name}: {col.type}
                        {!col.nullable && " *"}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Table Data */}
              {tableData && tableData.data.length > 0 ? (
                <div className="border rounded-lg overflow-auto max-h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {tableData.columns.map((col: any) => (
                          <TableHead key={col.name} className="whitespace-nowrap">
                            {col.name}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableData.data.map((row: any, idx: number) => (
                        <TableRow key={idx}>
                          {tableData.columns.map((col: any) => (
                            <TableCell key={col.name} className="whitespace-nowrap">
                              {row[col.name] !== null && row[col.name] !== undefined
                                ? String(row[col.name])
                                : <span className="text-muted-foreground italic">null</span>
                              }
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : tableData && tableData.data.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No data found in this table
                </div>
              ) : null}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;
