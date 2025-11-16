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
    const saved = localStorage.getItem("sdrMapping");
    return saved ? JSON.parse(saved) : {};
  });

  const [closerMapping, setCloserMapping] = useState<UserMapping>(() => {
    const saved = localStorage.getItem("closerMapping");
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem("sdrMapping", JSON.stringify(sdrMapping));
  }, [sdrMapping]);

  useEffect(() => {
    localStorage.setItem("closerMapping", JSON.stringify(closerMapping));
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
    return sdrMapping[email] || email;
  };

  const getCloserName = (email: string) => {
    return closerMapping[email] || email;
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
