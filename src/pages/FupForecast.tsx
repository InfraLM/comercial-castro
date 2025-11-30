import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { FunilComercialCard } from "@/components/fup-forecast/FunilComercialCard";
import { ProdutividadeSDRTable } from "@/components/fup-forecast/ProdutividadeSDRTable";
import { LigacoesReunioesTable } from "@/components/fup-forecast/LigacoesReunioesTable";
import { TaxaConversaoSDRTable } from "@/components/fup-forecast/TaxaConversaoSDRTable";
import { TaxaConversaoCloserTable } from "@/components/fup-forecast/TaxaConversaoCloserTable";
import { VendasProdutoCard } from "@/components/fup-forecast/VendasProdutoCard";
import { HighsLowsCard } from "@/components/fup-forecast/HighsLowsCard";
import { getWeekNumber, getWeekDateRange } from "@/lib/dateUtils";

export default function FupForecast() {
  const [currentWeek, setCurrentWeek] = useState(getWeekNumber(new Date()));
  const [currentYear] = useState(new Date().getFullYear());

  const weekRange = useMemo(() => {
    return getWeekDateRange(currentWeek, currentYear);
  }, [currentWeek, currentYear]);

  const previousWeekRange = useMemo(() => {
    return getWeekDateRange(currentWeek - 1, currentYear);
  }, [currentWeek, currentYear]);

  const maxWeek = getWeekNumber(new Date());

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="h-7 w-7 text-primary" />
            FUP/Forecast
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Análise semanal de performance comercial
          </p>
        </div>
        
        {/* Seletor de Semana */}
        <Card className="p-4 flex items-center gap-4 bg-card border shadow-sm">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentWeek(prev => prev - 1)}
            disabled={currentWeek <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="text-center min-w-[140px]">
            <div className="font-bold text-lg text-primary">W{currentWeek}</div>
            <div className="text-xs text-muted-foreground">
              {weekRange.inicioFormatado} - {weekRange.fimFormatado}/{currentYear}
            </div>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentWeek(prev => prev + 1)}
            disabled={currentWeek >= maxWeek}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Card>
      </div>

      {/* Funil Comercial */}
      <FunilComercialCard 
        weekRange={weekRange}
        previousWeekRange={previousWeekRange}
        currentWeek={currentWeek}
      />

      {/* Produtividade SDR */}
      <ProdutividadeSDRTable 
        data_inicio={weekRange.inicio}
        data_fim={weekRange.fim}
        currentWeek={currentWeek}
      />

      {/* Ligações x Reuniões */}
      <LigacoesReunioesTable 
        data_inicio={weekRange.inicio}
        data_fim={weekRange.fim}
        currentWeek={currentWeek}
      />

      {/* Grid de Conversão */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TaxaConversaoSDRTable 
          data_inicio={weekRange.inicio}
          data_fim={weekRange.fim}
          currentWeek={currentWeek}
        />
        <TaxaConversaoCloserTable 
          data_inicio={weekRange.inicio}
          data_fim={weekRange.fim}
          currentWeek={currentWeek}
        />
      </div>

      {/* Vendas por Produto */}
      <VendasProdutoCard 
        data_inicio={weekRange.inicio}
        data_fim={weekRange.fim}
        currentWeek={currentWeek}
      />

      {/* Highs & Lows */}
      <HighsLowsCard 
        weekRange={weekRange}
        previousWeekRange={previousWeekRange}
        currentWeek={currentWeek}
      />
    </div>
  );
}
