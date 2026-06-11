import { createContext, useContext } from "react";
import { Cobranca } from "./cobranca-types";

interface CobrancaContextType {
  cobrancaCriada: Cobranca | null;
  setCobrancaCriada: (cobranca: Cobranca | null) => void;
}

export const CobrancaContext = createContext<CobrancaContextType | undefined>(undefined);

export function useCobrancaContext() {
  const context = useContext(CobrancaContext);
  if (!context) {
    throw new Error("useCobrancaContext deve ser usado dentro de CobrancaProvider");
  }
  return context;
}
