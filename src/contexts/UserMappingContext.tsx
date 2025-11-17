import { createContext, useContext, useState, useEffect, ReactNode } from "react";

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
}

const UserMappingContext = createContext<UserMappingContextType | undefined>(undefined);

export const UserMappingProvider = ({ children }: { children: ReactNode }) => {
  const [sdrMapping, setSdrMapping] = useState<UserMapping>(() => {
    try {
      const saved = localStorage.getItem("sdrMapping");
      console.log("📦 Loading SDR mapping from localStorage:", saved);
      const parsed = saved ? JSON.parse(saved) : {};
      console.log("✅ SDR mapping loaded:", parsed);
      return parsed;
    } catch (error) {
      console.error("❌ Error loading SDR mapping:", error);
      return {};
    }
  });

  const [closerMapping, setCloserMapping] = useState<UserMapping>(() => {
    try {
      const saved = localStorage.getItem("closerMapping");
      console.log("📦 Loading Closer mapping from localStorage:", saved);
      const parsed = saved ? JSON.parse(saved) : {};
      console.log("✅ Closer mapping loaded:", parsed);
      return parsed;
    } catch (error) {
      console.error("❌ Error loading Closer mapping:", error);
      return {};
    }
  });

  useEffect(() => {
    try {
      const stringified = JSON.stringify(sdrMapping);
      localStorage.setItem("sdrMapping", stringified);
      console.log("💾 SDR mapping saved to localStorage:", stringified);
    } catch (error) {
      console.error("❌ Error saving SDR mapping:", error);
    }
  }, [sdrMapping]);

  useEffect(() => {
    try {
      const stringified = JSON.stringify(closerMapping);
      localStorage.setItem("closerMapping", stringified);
      console.log("💾 Closer mapping saved to localStorage:", stringified);
    } catch (error) {
      console.error("❌ Error saving Closer mapping:", error);
    }
  }, [closerMapping]);

  const updateSdrMapping = (email: string, name: string) => {
    setSdrMapping(prev => ({ ...prev, [email]: name }));
  };

  const updateCloserMapping = (email: string, name: string) => {
    setCloserMapping(prev => ({ ...prev, [email]: name }));
  };

  const removeSdrMapping = (email: string) => {
    setSdrMapping(prev => {
      const newMapping = { ...prev };
      delete newMapping[email];
      return newMapping;
    });
  };

  const removeCloserMapping = (email: string) => {
    setCloserMapping(prev => {
      const newMapping = { ...prev };
      delete newMapping[email];
      return newMapping;
    });
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
