import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface MeetingsConfig {
  sdrOptions: string[];
  closersOptions: string[];
  tipoReuniaoOptions: string[];
  situacaoOptions: string[];
  formFields: {
    sdr: boolean;
    closer: boolean;
    tipoReuniao: boolean;
    nome: boolean;
    email: boolean;
    diaReuniao: boolean;
    situacao: boolean;
  };
}

const defaultConfig: MeetingsConfig = {
  sdrOptions: ["Gustavo", "Murilo", "Weber", "Luanda", "Ana Beatriz", "Luiz Gustavo"],
  closersOptions: ["Ana Karolina", "Gustavo", "Marcelo", "Matheus", "Ricardo"],
  tipoReuniaoOptions: ["Pós graduação", "IOT + VM"],
  situacaoOptions: ["Show", "No Show"],
  formFields: {
    sdr: true,
    closer: true,
    tipoReuniao: true,
    nome: true,
    email: true,
    diaReuniao: true,
    situacao: true,
  },
};

interface MeetingsConfigContextType {
  config: MeetingsConfig;
  updateConfig: (newConfig: Partial<MeetingsConfig>) => void;
  resetConfig: () => void;
}

const MeetingsConfigContext = createContext<MeetingsConfigContextType | undefined>(undefined);

export const MeetingsConfigProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState<MeetingsConfig>(() => {
    const saved = localStorage.getItem("meetingsConfig");
    return saved ? JSON.parse(saved) : defaultConfig;
  });

  useEffect(() => {
    localStorage.setItem("meetingsConfig", JSON.stringify(config));
  }, [config]);

  const updateConfig = (newConfig: Partial<MeetingsConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const resetConfig = () => {
    setConfig(defaultConfig);
  };

  return (
    <MeetingsConfigContext.Provider value={{ config, updateConfig, resetConfig }}>
      {children}
    </MeetingsConfigContext.Provider>
  );
};

export const useMeetingsConfig = () => {
  const context = useContext(MeetingsConfigContext);
  if (!context) {
    throw new Error("useMeetingsConfig must be used within MeetingsConfigProvider");
  }
  return context;
};
