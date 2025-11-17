import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserMapping {
  [email: string]: string; // email -> nome
}

interface UserMappingContextType {
  sdrMapping: UserMapping;
  closerMapping: UserMapping;
  updateSdrMapping: (email: string, name: string) => void;
  updateCloserMapping: (email: string, name: string) => void;
  removeSdrMapping: (email: string) => void;
  removeCloserMapping: (email: string) => void;
  getSdrName: (email: string) => string;
  getCloserName: (email: string) => string;
  isLoading: boolean;
}

const UserMappingContext = createContext<UserMappingContextType | undefined>(undefined);

export const UserMappingProvider = ({ children }: { children: ReactNode }) => {
  const [sdrMapping, setSdrMapping] = useState<UserMapping>({});
  const [closerMapping, setCloserMapping] = useState<UserMapping>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load mappings from database on mount
  useEffect(() => {
    loadMappingsFromDB();
  }, []);

  const loadMappingsFromDB = async () => {
    try {
      console.log("📦 Loading mappings from database...");
      
      const { data, error } = await supabase
        .from("user_mappings")
        .select("*");

      if (error) {
        console.error("❌ Error loading mappings from database:", error);
        toast.error("Erro ao carregar mapeamentos do banco");
        return;
      }

      const sdrMap: UserMapping = {};
      const closerMap: UserMapping = {};

      data?.forEach((mapping) => {
        if (mapping.role === "sdr") {
          sdrMap[mapping.email] = mapping.name;
        } else if (mapping.role === "closer") {
          closerMap[mapping.email] = mapping.name;
        }
      });

      setSdrMapping(sdrMap);
      setCloserMapping(closerMap);
      console.log("✅ Mappings loaded from database:", { sdrMap, closerMap });
      
    } catch (error) {
      console.error("❌ Error loading mappings:", error);
      toast.error("Erro ao carregar mapeamentos");
    } finally {
      setIsLoading(false);
    }
  };

  const updateSdrMapping = async (email: string, name: string) => {
    try {
      console.log("💾 Saving SDR mapping to database:", { email, name });
      
      const { error } = await supabase
        .from("user_mappings")
        .upsert(
          { email, name, role: "sdr" },
          { onConflict: "email,role" }
        );

      if (error) {
        console.error("❌ Error saving SDR mapping:", error);
        toast.error("Erro ao salvar mapeamento SDR");
        return;
      }

      setSdrMapping(prev => ({ ...prev, [email]: name }));
      console.log("✅ SDR mapping saved successfully");
      toast.success("Mapeamento SDR salvo com sucesso");
    } catch (error) {
      console.error("❌ Error updating SDR mapping:", error);
      toast.error("Erro ao salvar mapeamento SDR");
    }
  };

  const updateCloserMapping = async (email: string, name: string) => {
    try {
      console.log("💾 Saving Closer mapping to database:", { email, name });
      
      const { error } = await supabase
        .from("user_mappings")
        .upsert(
          { email, name, role: "closer" },
          { onConflict: "email,role" }
        );

      if (error) {
        console.error("❌ Error saving Closer mapping:", error);
        toast.error("Erro ao salvar mapeamento Closer");
        return;
      }

      setCloserMapping(prev => ({ ...prev, [email]: name }));
      console.log("✅ Closer mapping saved successfully");
      toast.success("Mapeamento Closer salvo com sucesso");
    } catch (error) {
      console.error("❌ Error updating Closer mapping:", error);
      toast.error("Erro ao salvar mapeamento Closer");
    }
  };

  const removeSdrMapping = async (email: string) => {
    try {
      console.log("🗑️ Removing SDR mapping from database:", email);
      
      const { error } = await supabase
        .from("user_mappings")
        .delete()
        .eq("email", email)
        .eq("role", "sdr");

      if (error) {
        console.error("❌ Error removing SDR mapping:", error);
        toast.error("Erro ao remover mapeamento SDR");
        return;
      }

      setSdrMapping(prev => {
        const newMapping = { ...prev };
        delete newMapping[email];
        return newMapping;
      });
      console.log("✅ SDR mapping removed successfully");
      toast.success("Mapeamento SDR removido com sucesso");
    } catch (error) {
      console.error("❌ Error removing SDR mapping:", error);
      toast.error("Erro ao remover mapeamento SDR");
    }
  };

  const removeCloserMapping = async (email: string) => {
    try {
      console.log("🗑️ Removing Closer mapping from database:", email);
      
      const { error } = await supabase
        .from("user_mappings")
        .delete()
        .eq("email", email)
        .eq("role", "closer");

      if (error) {
        console.error("❌ Error removing Closer mapping:", error);
        toast.error("Erro ao remover mapeamento Closer");
        return;
      }

      setCloserMapping(prev => {
        const newMapping = { ...prev };
        delete newMapping[email];
        return newMapping;
      });
      console.log("✅ Closer mapping removed successfully");
      toast.success("Mapeamento Closer removido com sucesso");
    } catch (error) {
      console.error("❌ Error removing Closer mapping:", error);
      toast.error("Erro ao remover mapeamento Closer");
    }
  };

  const getSdrName = (email: string) => {
    const name = sdrMapping[email] || email;
    console.log(`🔍 getSdrName("${email}") ->`, name, "| Current mapping:", sdrMapping);
    return name;
  };

  const getCloserName = (email: string) => {
    const name = closerMapping[email] || email;
    console.log(`🔍 getCloserName("${email}") ->`, name, "| Current mapping:", closerMapping);
    return name;
  };

  return (
    <UserMappingContext.Provider
      value={{
        sdrMapping,
        closerMapping,
        updateSdrMapping,
        updateCloserMapping,
        removeSdrMapping,
        removeCloserMapping,
        getSdrName,
        getCloserName,
        isLoading,
      }}
    >
      {children}
    </UserMappingContext.Provider>
  );
};

export const useUserMapping = () => {
  const context = useContext(UserMappingContext);
  if (!context) {
    throw new Error("useUserMapping must be used within UserMappingProvider");
  }
  return context;
};
