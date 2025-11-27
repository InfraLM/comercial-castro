import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, X, RotateCcw, Settings2, ListChecks, Users2 } from "lucide-react";
import { useMeetingsConfig } from "@/contexts/MeetingsConfigContext";
import { useUserMapping } from "@/contexts/UserMappingContext";

export const MeetingsConfigSection = () => {
  const { config, updateConfig, resetConfig } = useMeetingsConfig();
  const { sdrMapping, closerMapping } = useUserMapping();
  const [newOption, setNewOption] = useState("");

  const sdrUsers = Object.entries(sdrMapping).map(([email, name]) => ({ email, name }));
  const closerUsers = Object.entries(closerMapping).map(([email, name]) => ({ email, name }));

  const handleAddOption = (section: "tipoReuniaoOptions" | "situacaoOptions") => {
    if (!newOption.trim()) {
      toast.error("Digite uma opção válida");
      return;
    }

    const options = [...config[section]];
    if (options.includes(newOption.trim())) {
      toast.error("Opção já existe");
      return;
    }

    options.push(newOption.trim());
    updateConfig({ [section]: options });
    setNewOption("");
    toast.success("Opção adicionada!");
  };

  const handleRemoveOption = (
    section: "tipoReuniaoOptions" | "situacaoOptions",
    option: string
  ) => {
    const options = config[section].filter(o => o !== option);
    updateConfig({ [section]: options });
    toast.success("Opção removida!");
  };

  const handleToggleField = (field: keyof typeof config.formFields) => {
    updateConfig({
      formFields: {
        ...config.formFields,
        [field]: !config.formFields[field],
      },
    });
  };

  const handleAddSDRFromUser = (email: string, name: string) => {
    if (config.sdrOptions.includes(name)) {
      toast.error("SDR já está na lista");
      return;
    }
    updateConfig({ sdrOptions: [...config.sdrOptions, name] });
    toast.success(`${name} adicionado aos SDRs`);
  };

  const handleAddCloserFromUser = (email: string, name: string) => {
    if (config.closersOptions.includes(name)) {
      toast.error("Closer já está na lista");
      return;
    }
    updateConfig({ closersOptions: [...config.closersOptions, name] });
    toast.success(`${name} adicionado aos Closers`);
  };

  const handleReset = () => {
    resetConfig();
    toast.success("Configurações restauradas!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Configuração de Reuniões</h2>
          <p className="text-muted-foreground">Personalize o formulário de reuniões</p>
        </div>
        <Button variant="outline" onClick={handleReset} size="sm">
          <RotateCcw className="mr-2 h-4 w-4" />
          Restaurar
        </Button>
      </div>

      <Tabs defaultValue="fields" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="fields" className="gap-2">
            <Settings2 className="h-4 w-4" />
            Campos
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users2 className="h-4 w-4" />
            SDR & Closers
          </TabsTrigger>
          <TabsTrigger value="options" className="gap-2">
            <ListChecks className="h-4 w-4" />
            Opções
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fields" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Campos do Formulário</CardTitle>
              <CardDescription>Ative ou desative campos no formulário de registro</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(config.formFields).map(([field, enabled]) => (
                  <div key={field} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <Label htmlFor={field} className="font-medium">
                      {field === "sdr" ? "SDR" : 
                       field === "closer" ? "Closer" :
                       field === "tipoReuniao" ? "Tipo de Reunião" :
                       field === "diaReuniao" ? "Data da Reunião" :
                       field.charAt(0).toUpperCase() + field.slice(1)}
                    </Label>
                    <Switch
                      id={field}
                      checked={enabled}
                      onCheckedChange={() => handleToggleField(field as keyof typeof config.formFields)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SDR Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">SDRs</CardTitle>
                <CardDescription>Selecione SDRs dos usuários cadastrados</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {sdrUsers.length > 0 ? (
                  <Select onValueChange={(value) => {
                    const user = sdrUsers.find(u => u.email === value);
                    if (user) handleAddSDRFromUser(user.email, user.name);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Adicionar SDR da lista de usuários" />
                    </SelectTrigger>
                    <SelectContent>
                      {sdrUsers.map((user) => (
                        <SelectItem key={user.email} value={user.email}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhum SDR cadastrado em Usuários
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  {config.sdrOptions.map((option) => (
                    <Badge key={option} variant="secondary" className="gap-1 px-3 py-1.5">
                      {option}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-destructive ml-1"
                        onClick={() => {
                          updateConfig({ sdrOptions: config.sdrOptions.filter(o => o !== option) });
                        }}
                      />
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Closers Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Closers</CardTitle>
                <CardDescription>Selecione Closers dos usuários cadastrados</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {closerUsers.length > 0 ? (
                  <Select onValueChange={(value) => {
                    const user = closerUsers.find(u => u.email === value);
                    if (user) handleAddCloserFromUser(user.email, user.name);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Adicionar Closer da lista de usuários" />
                    </SelectTrigger>
                    <SelectContent>
                      {closerUsers.map((user) => (
                        <SelectItem key={user.email} value={user.email}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhum Closer cadastrado em Usuários
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  {config.closersOptions.map((option) => (
                    <Badge key={option} variant="secondary" className="gap-1 px-3 py-1.5">
                      {option}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-destructive ml-1"
                        onClick={() => {
                          updateConfig({ closersOptions: config.closersOptions.filter(o => o !== option) });
                        }}
                      />
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="options" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tipo de Reunião */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tipos de Reunião</CardTitle>
                <CardDescription>Gerencie os tipos de reunião disponíveis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Novo tipo de reunião"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddOption("tipoReuniaoOptions")}
                  />
                  <Button onClick={() => handleAddOption("tipoReuniaoOptions")} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {config.tipoReuniaoOptions.map((option) => (
                    <Badge key={option} variant="secondary" className="gap-1 px-3 py-1.5">
                      {option}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-destructive ml-1"
                        onClick={() => handleRemoveOption("tipoReuniaoOptions", option)}
                      />
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Situação */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Situações</CardTitle>
                <CardDescription>Gerencie as situações de reunião</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Nova situação"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddOption("situacaoOptions")}
                  />
                  <Button onClick={() => handleAddOption("situacaoOptions")} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {config.situacaoOptions.map((option) => (
                    <Badge key={option} variant="secondary" className="gap-1 px-3 py-1.5">
                      {option}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-destructive ml-1"
                        onClick={() => handleRemoveOption("situacaoOptions", option)}
                      />
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
