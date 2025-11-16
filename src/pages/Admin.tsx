import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Database, CheckCircle2, XCircle, Info, Send } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { MeetingsConfigSection } from "@/components/admin/MeetingsConfigSection";
import { UserMappingSection } from "@/components/admin/UserMappingSection";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const Admin = () => {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [webhookUrl, setWebhookUrl] = useState<string>("");
  const queryClient = useQueryClient();

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
        body: JSON.stringify({ tableName: selectedTable }),
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
    setFormData({});
  };

  const insertMutation = useMutation({
    mutationFn: async (data: { tableName: string; data: Record<string, string>; webhookUrl?: string }) => {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/insert-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to insert data');
      }
      
      return result;
    },
    onSuccess: () => {
      toast.success('Dados inseridos com sucesso!');
      setFormData({});
      queryClient.invalidateQueries({ queryKey: ['table-data', selectedTable] });
    },
    onError: (error: Error) => {
      toast.error('Erro ao inserir dados', {
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable) return;
    
    insertMutation.mutate({
      tableName: selectedTable,
      data: formData,
      webhookUrl: webhookUrl || undefined,
    });
  };

  const handleInputChange = (columnName: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [columnName]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Database className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Administrador</h1>
              <p className="text-muted-foreground">Gerencie banco de dados e configurações</p>
            </div>
          </div>
          <NavLink to="/">
            <Button variant="outline">Reuniões</Button>
          </NavLink>
        </div>

        <Tabs defaultValue="database" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="database">Banco de Dados</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="meetings">Configuração de Reuniões</TabsTrigger>
          </TabsList>

          <TabsContent value="database" className="space-y-6 mt-6">
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

              {/* Insert Data Form */}
              {tableData && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Send className="h-5 w-5" />
                      Inserir Dados
                    </CardTitle>
                    <CardDescription>
                      Preencha os campos para inserir dados na tabela. Opcionalmente adicione um webhook URL.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tableData.columns
                          .filter((col: any) => col.name !== 'id' && col.name !== 'created_at' && col.name !== 'updated_at')
                          .map((col: any) => (
                          <div key={col.name} className="space-y-2">
                            <Label htmlFor={col.name}>
                              {col.name} {!col.nullable && <span className="text-destructive">*</span>}
                              <span className="text-xs text-muted-foreground ml-2">({col.type})</span>
                            </Label>
                            <Input
                              id={col.name}
                              value={formData[col.name] || ''}
                              onChange={(e) => handleInputChange(col.name, e.target.value)}
                              required={!col.nullable}
                              placeholder={`Digite ${col.name}`}
                            />
                          </div>
                        ))}
                      </div>
                      
                      <div className="space-y-2 pt-4 border-t">
                        <Label htmlFor="webhook">
                          Webhook URL (opcional)
                          <span className="text-xs text-muted-foreground ml-2">Os dados serão enviados para esta URL após inserção</span>
                        </Label>
                        <Input
                          id="webhook"
                          type="url"
                          value={webhookUrl}
                          onChange={(e) => setWebhookUrl(e.target.value)}
                          placeholder="https://seu-webhook.com/endpoint"
                        />
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={insertMutation.isPending}
                      >
                        {insertMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Inserindo...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Inserir Dados
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
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
          </TabsContent>

          <TabsContent value="users" className="space-y-6 mt-6">
            <UserMappingSection />
          </TabsContent>

          <TabsContent value="meetings" className="space-y-6 mt-6">
            <MeetingsConfigSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
