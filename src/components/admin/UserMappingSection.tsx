import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useUserMapping } from "@/contexts/UserMappingContext";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export const UserMappingSection = () => {
  const {
    sdrMapping,
    closerMapping,
    updateSdrMapping,
    updateCloserMapping,
    removeSdrMapping,
    removeCloserMapping,
  } = useUserMapping();

  const [newSdrEmail, setNewSdrEmail] = useState("");
  const [newSdrName, setNewSdrName] = useState("");
  const [newCloserEmail, setNewCloserEmail] = useState("");
  const [newCloserName, setNewCloserName] = useState("");

  const handleAddSdr = () => {
    if (!newSdrEmail.trim() || !newSdrName.trim()) {
      toast.error("Preencha email e nome do SDR");
      return;
    }
    updateSdrMapping(newSdrEmail.trim(), newSdrName.trim());
    setNewSdrEmail("");
    setNewSdrName("");
    toast.success("SDR adicionado com sucesso");
  };

  const handleAddCloser = () => {
    if (!newCloserEmail.trim() || !newCloserName.trim()) {
      toast.error("Preencha email e nome do Closer");
      return;
    }
    updateCloserMapping(newCloserEmail.trim(), newCloserName.trim());
    setNewCloserEmail("");
    setNewCloserName("");
    toast.success("Closer adicionado com sucesso");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mapeamento de SDRs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sdr-email">Email do SDR</Label>
              <Input
                id="sdr-email"
                value={newSdrEmail}
                onChange={(e) => setNewSdrEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sdr-name">Nome do SDR</Label>
              <Input
                id="sdr-name"
                value={newSdrName}
                onChange={(e) => setNewSdrName(e.target.value)}
                placeholder="Nome completo"
              />
            </div>
          </div>
          <Button onClick={handleAddSdr}>Adicionar SDR</Button>

          <div className="mt-6 space-y-2">
            <h4 className="font-medium">SDRs Cadastrados:</h4>
            {Object.entries(sdrMapping).length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum SDR cadastrado</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(sdrMapping).map(([email, name]) => (
                  <div
                    key={email}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{name}</p>
                      <p className="text-sm text-muted-foreground">{email}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        removeSdrMapping(email);
                        toast.success("SDR removido");
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mapeamento de Closers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="closer-email">Email do Closer</Label>
              <Input
                id="closer-email"
                value={newCloserEmail}
                onChange={(e) => setNewCloserEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="closer-name">Nome do Closer</Label>
              <Input
                id="closer-name"
                value={newCloserName}
                onChange={(e) => setNewCloserName(e.target.value)}
                placeholder="Nome completo"
              />
            </div>
          </div>
          <Button onClick={handleAddCloser}>Adicionar Closer</Button>

          <div className="mt-6 space-y-2">
            <h4 className="font-medium">Closers Cadastrados:</h4>
            {Object.entries(closerMapping).length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum Closer cadastrado</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(closerMapping).map(([email, name]) => (
                  <div
                    key={email}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{name}</p>
                      <p className="text-sm text-muted-foreground">{email}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        removeCloserMapping(email);
                        toast.success("Closer removido");
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
