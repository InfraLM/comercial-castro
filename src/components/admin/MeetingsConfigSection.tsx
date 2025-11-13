import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, X, RotateCcw } from "lucide-react";
import { useMeetingsConfig } from "@/contexts/MeetingsConfigContext";

export const MeetingsConfigSection = () => {
  const { config, updateConfig, resetConfig } = useMeetingsConfig();
  const [newOption, setNewOption] = useState("");
  const [activeSection, setActiveSection] = useState<"sdr" | "closers" | "tipo" | "situacao">("sdr");

  const handleAddOption = (section: "sdrOptions" | "closersOptions" | "tipoReuniaoOptions" | "situacaoOptions") => {
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
    toast.success("Opção adicionada com sucesso!");
  };

  const handleRemoveOption = (
    section: "sdrOptions" | "closersOptions" | "tipoReuniaoOptions" | "situacaoOptions",
    option: string
  ) => {
    const options = config[section].filter(o => o !== option);
    updateConfig({ [section]: options });
    toast.success("Opção removida com sucesso!");
  };

  const handleToggleField = (field: keyof typeof config.formFields) => {
    updateConfig({
      formFields: {
        ...config.formFields,
        [field]: !config.formFields[field],
      },
    });
  };

  const handleReset = () => {
    resetConfig();
    toast.success("Configurações restauradas para o padrão!");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Configuração de Reuniões</h2>
          <p className="text-muted-foreground">Gerencie os campos e opções do formulário de reuniões</p>
        </div>
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Restaurar Padrão
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campos do Formulário</CardTitle>
          <CardDescription>Ative ou desative campos do formulário de registro</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(config.formFields).map(([field, enabled]) => (
            <div key={field} className="flex items-center justify-between">
              <Label htmlFor={field} className="capitalize">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Opções dos Campos</CardTitle>
          <CardDescription>Adicione, edite ou remova opções dos campos de seleção</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex gap-2 border-b pb-4">
              {[
                { key: "sdr", label: "SDR" },
                { key: "closers", label: "Closers" },
                { key: "tipo", label: "Tipo de Reunião" },
                { key: "situacao", label: "Situação" },
              ].map((section) => (
                <Button
                  key={section.key}
                  variant={activeSection === section.key ? "default" : "ghost"}
                  onClick={() => setActiveSection(section.key as typeof activeSection)}
                >
                  {section.label}
                </Button>
              ))}
            </div>

            {activeSection === "sdr" && (
              <div className="space-y-4">
                <h3 className="font-semibold">Opções de SDR</h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nova opção de SDR"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddOption("sdrOptions")}
                  />
                  <Button onClick={() => handleAddOption("sdrOptions")}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {config.sdrOptions.map((option) => (
                    <Badge key={option} variant="secondary" className="gap-2">
                      {option}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                        onClick={() => handleRemoveOption("sdrOptions", option)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {activeSection === "closers" && (
              <div className="space-y-4">
                <h3 className="font-semibold">Opções de Closers</h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nova opção de Closer"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddOption("closersOptions")}
                  />
                  <Button onClick={() => handleAddOption("closersOptions")}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {config.closersOptions.map((option) => (
                    <Badge key={option} variant="secondary" className="gap-2">
                      {option}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                        onClick={() => handleRemoveOption("closersOptions", option)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {activeSection === "tipo" && (
              <div className="space-y-4">
                <h3 className="font-semibold">Opções de Tipo de Reunião</h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nova opção de tipo"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddOption("tipoReuniaoOptions")}
                  />
                  <Button onClick={() => handleAddOption("tipoReuniaoOptions")}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {config.tipoReuniaoOptions.map((option) => (
                    <Badge key={option} variant="secondary" className="gap-2">
                      {option}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                        onClick={() => handleRemoveOption("tipoReuniaoOptions", option)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {activeSection === "situacao" && (
              <div className="space-y-4">
                <h3 className="font-semibold">Opções de Situação</h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nova opção de situação"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddOption("situacaoOptions")}
                  />
                  <Button onClick={() => handleAddOption("situacaoOptions")}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {config.situacaoOptions.map((option) => (
                    <Badge key={option} variant="secondary" className="gap-2">
                      {option}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                        onClick={() => handleRemoveOption("situacaoOptions", option)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
