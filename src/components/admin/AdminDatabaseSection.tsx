import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, CheckCircle2, XCircle, Database, Eye, EyeOff } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function AdminDatabaseSection() {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState<Record<string, boolean>>({});

  const { data: tablesData, isLoading: isLoadingTables, error: tablesError } = useQuery({
    queryKey: ['tables'],
    queryFn: async () => {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/list-tables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to fetch tables');
      return data;
    },
  });

  const { data: tableData, isLoading: isLoadingTableData } = useQuery({
    queryKey: ['table-data', selectedTable],
    queryFn: async () => {
      if (!selectedTable) return null;
      const response = await fetch(`${SUPABASE_URL}/functions/v1/get-table-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableName: selectedTable }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to fetch table data');
      return data;
    },
    enabled: !!selectedTable,
  });

  const togglePreview = (tableName: string) => {
    if (showPreview[tableName]) {
      setShowPreview(prev => ({ ...prev, [tableName]: false }));
      if (selectedTable === tableName) setSelectedTable(null);
    } else {
      setShowPreview(prev => ({ ...prev, [tableName]: true }));
      setSelectedTable(tableName);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Banco de Dados</h2>
        <p className="text-muted-foreground">Visualize as tabelas disponíveis</p>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            {isLoadingTables ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : tablesError ? (
              <XCircle className="h-4 w-4 text-destructive" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
            Status da Conexão
          </CardTitle>
          <CardDescription>
            {isLoadingTables && "Conectando ao banco de dados..."}
            {tablesError && "Falha na conexão"}
            {tablesData && `Conectado ao schema: ${tablesData.schema}`}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Tables Grid */}
      {tablesData && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tablesData.tables.map((table: any) => (
            <Card key={table.tableName} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base">{table.tableName}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePreview(table.tableName)}
                    className="h-8 w-8 p-0"
                  >
                    {showPreview[table.tableName] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <CardDescription>{table.columnCount} colunas</CardDescription>
              </CardHeader>

              {showPreview[table.tableName] && selectedTable === table.tableName && (
                <CardContent className="pt-0">
                  {isLoadingTableData ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : tableData ? (
                    <div className="space-y-3">
                      {/* Columns */}
                      <div className="flex flex-wrap gap-1">
                        {tableData.columns.slice(0, 5).map((col: any) => (
                          <Badge key={col.name} variant="secondary" className="text-xs">
                            {col.name}
                          </Badge>
                        ))}
                        {tableData.columns.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{tableData.columns.length - 5}
                          </Badge>
                        )}
                      </div>

                      {/* Preview Data */}
                      {tableData.data.length > 0 ? (
                        <ScrollArea className="h-40 rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                {tableData.columns.slice(0, 4).map((col: any) => (
                                  <TableHead key={col.name} className="text-xs whitespace-nowrap">
                                    {col.name}
                                  </TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {tableData.data.slice(0, 5).map((row: any, idx: number) => (
                                <TableRow key={idx}>
                                  {tableData.columns.slice(0, 4).map((col: any) => (
                                    <TableCell key={col.name} className="text-xs py-2">
                                      {row[col.name] !== null && row[col.name] !== undefined
                                        ? String(row[col.name]).substring(0, 20)
                                        : <span className="text-muted-foreground">-</span>
                                      }
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Nenhum dado encontrado
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {tableData.rowCount} registros totais
                      </p>
                    </div>
                  ) : null}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
