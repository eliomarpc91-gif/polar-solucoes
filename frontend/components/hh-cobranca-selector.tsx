import { ScrollView, Text, View, Pressable, TextInput, Alert } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import { useState, useEffect } from "react";
import { calcularHH } from "@/lib/hh-store";
import { CalculoHH } from "@/lib/hh-types";

export interface CobrancaConfig {
  tipo: "hh" | "avulso";
  hhIdeal: number;
  horas: number;
  valorManual: number;
  subtotalMaoDeObra: number;
  observacoes: string;
  analise: {
    status: "saudavel" | "margem_baixa" | "risco";
    recomendacao: string;
  };
}

interface HHCobrancaSelectorProps {
  onConfigChange: (config: CobrancaConfig) => void;
  initialConfig?: CobrancaConfig;
}

export function HHCobrancaSelector({ onConfigChange, initialConfig }: HHCobrancaSelectorProps) {
  const colors = useColors();
  const [tipo, setTipo] = useState<"hh" | "avulso">(initialConfig?.tipo || "hh");
  const [hhCalculo, setHhCalculo] = useState<CalculoHH | null>(null);
  const [horas, setHoras] = useState(initialConfig?.horas.toString() || "1");
  const [valorManual, setValorManual] = useState(initialConfig?.valorManual.toString() || "");
  const [observacoes, setObservacoes] = useState(initialConfig?.observacoes || "");

  useEffect(() => {
    carregarHH();
  }, []);

  useEffect(() => {
    atualizarConfig();
  }, [tipo, horas, valorManual, observacoes]);

  const carregarHH = async () => {
    const hh = await calcularHH();
    setHhCalculo(hh);
  };

  const atualizarConfig = () => {
    if (!hhCalculo) return;

    const horasNum = parseFloat(horas) || 0;
    const valorManualNum = parseFloat(valorManual) || 0;

    let subtotal = 0;
    let analise: { status: "saudavel" | "margem_baixa" | "risco"; recomendacao: string } = { status: "saudavel", recomendacao: "" };

    if (tipo === "hh") {
      subtotal = hhCalculo.hh_ideal * horasNum;
      analise = {
        status: "saudavel",
        recomendacao: `HH Ideal: R$ ${hhCalculo.hh_ideal.toFixed(2)}/h × ${horasNum}h = R$ ${subtotal.toFixed(2)}`,
      };
    } else {
      subtotal = valorManualNum;

      if (valorManualNum <= 0) {
        analise = {
          status: "risco",
          recomendacao: "Valor não informado",
        };
      } else if (valorManualNum < hhCalculo.hh_minimo * horasNum) {
        analise = {
          status: "risco",
          recomendacao: `⚠️ Valor abaixo do HH Mínimo (R$ ${(hhCalculo.hh_minimo * horasNum).toFixed(2)})`,
        };
      } else if (valorManualNum < hhCalculo.hh_ideal * horasNum) {
        analise = {
          status: "margem_baixa",
          recomendacao: `🟡 Valor abaixo do HH Ideal (R$ ${(hhCalculo.hh_ideal * horasNum).toFixed(2)})`,
        };
      } else {
        analise = {
          status: "saudavel",
          recomendacao: `✅ Valor acima do HH Ideal`,
        };
      }
    }

    onConfigChange({
      tipo,
      hhIdeal: hhCalculo.hh_ideal,
      horas: horasNum,
      valorManual: valorManualNum,
      subtotalMaoDeObra: subtotal,
      observacoes,
      analise,
    });
  };

  const getStatusColor = (status: string) => {
    if (status === "saudavel") return colors.success;
    if (status === "margem_baixa") return colors.warning;
    return colors.error;
  };

  const inputStyle = {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.foreground,
    fontSize: 14,
  };

  if (!hhCalculo) {
    return (
      <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border }}>
        <Text className="text-muted text-sm">Carregando HH...</Text>
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
      <Text className="text-foreground text-lg font-bold mb-4">Cobrança de Mão de Obra</Text>

      {/* SELETOR DE TIPO */}
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
        <Pressable
          onPress={() => setTipo("hh")}
          style={({ pressed }) => [
            {
              flex: 1,
              paddingVertical: 12,
              paddingHorizontal: 12,
              borderRadius: 10,
              backgroundColor: tipo === "hh" ? colors.primary : colors.border,
              alignItems: "center",
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Text style={{ color: tipo === "hh" ? colors.background : colors.foreground, fontWeight: "600", fontSize: 13 }}>
            HH Inteligente
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setTipo("avulso")}
          style={({ pressed }) => [
            {
              flex: 1,
              paddingVertical: 12,
              paddingHorizontal: 12,
              borderRadius: 10,
              backgroundColor: tipo === "avulso" ? colors.primary : colors.border,
              alignItems: "center",
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Text style={{ color: tipo === "avulso" ? colors.background : colors.foreground, fontWeight: "600", fontSize: 13 }}>
            Valor Avulso
          </Text>
        </Pressable>
      </View>

      {/* MODO HH INTELIGENTE */}
      {tipo === "hh" && (
        <View style={{ gap: 12, marginBottom: 16 }}>
          <View style={{ backgroundColor: colors.border, borderRadius: 10, padding: 12 }}>
            <Text className="text-muted text-xs font-semibold mb-1">HH Ideal Cadastrado</Text>
            <Text className="text-foreground text-2xl font-bold">R$ {hhCalculo.hh_ideal.toFixed(2)}/h</Text>
          </View>

          <View>
            <Text className="text-muted text-xs font-semibold mb-2">Quantidade de Horas</Text>
            <TextInput
              value={horas}
              onChangeText={setHoras}
              placeholder="Ex: 4"
              keyboardType="decimal-pad"
              style={inputStyle}
            />
          </View>

          <View style={{ backgroundColor: colors.primary + "15", borderRadius: 10, padding: 12, borderWidth: 2, borderColor: colors.primary }}>
            <Text className="text-muted text-xs font-semibold mb-1">Subtotal da Mão de Obra</Text>
            <Text className="text-foreground text-2xl font-bold" style={{ color: colors.primary }}>
              R$ {(hhCalculo.hh_ideal * parseFloat(horas || "0")).toFixed(2)}
            </Text>
            <Text className="text-muted text-xs mt-2">
              {hhCalculo.hh_ideal.toFixed(2)} × {parseFloat(horas || "0")} horas
            </Text>
          </View>
        </View>
      )}

      {/* MODO VALOR AVULSO */}
      {tipo === "avulso" && (
        <View style={{ gap: 12, marginBottom: 16 }}>
          <View>
            <Text className="text-muted text-xs font-semibold mb-2">Valor Manual (R$)</Text>
            <TextInput
              value={valorManual}
              onChangeText={setValorManual}
              placeholder="Ex: 500.00"
              keyboardType="decimal-pad"
              style={inputStyle}
            />
          </View>

          <View>
            <Text className="text-muted text-xs font-semibold mb-2">Quantidade de Horas (para referência)</Text>
            <TextInput
              value={horas}
              onChangeText={setHoras}
              placeholder="Ex: 4"
              keyboardType="decimal-pad"
              style={inputStyle}
            />
          </View>

          <View>
            <Text className="text-muted text-xs font-semibold mb-2">Observações Internas</Text>
            <TextInput
              value={observacoes}
              onChangeText={setObservacoes}
              placeholder="Ex: Valor negociado com cliente"
              style={[inputStyle, { minHeight: 80 }]}
              multiline
            />
          </View>
        </View>
      )}

      {/* ANÁLISE DE IA */}
      {hhCalculo && (
        <View
          style={{
            backgroundColor: getStatusColor(parseFloat(horas || "0") > 0 ? "saudavel" : "risco") + "15",
            borderRadius: 10,
            padding: 12,
            borderWidth: 2,
            borderColor: getStatusColor(parseFloat(horas || "0") > 0 ? "saudavel" : "risco"),
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
            <MaterialIcons
              name={tipo === "hh" ? "check-circle" : "info"}
              size={20}
              color={getStatusColor(hhCalculo.hh_ideal * parseFloat(horas || "0") > 0 ? "saudavel" : "risco")}
            />
            <View style={{ flex: 1 }}>
              <Text className="text-foreground text-sm font-semibold">Análise de IA</Text>
              <Text className="text-muted text-xs mt-1">
                {tipo === "hh"
                  ? `Cobrando R$ ${(hhCalculo.hh_ideal * parseFloat(horas || "0")).toFixed(2)} com margem saudável`
                  : valorManual
                    ? parseFloat(valorManual) < hhCalculo.hh_minimo * parseFloat(horas || "0")
                      ? `⚠️ Valor abaixo do mínimo recomendado (R$ ${(hhCalculo.hh_minimo * parseFloat(horas || "0")).toFixed(2)})`
                      : `✅ Valor dentro da faixa recomendada`
                    : "Informe um valor"}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* RESUMO */}
      <View style={{ backgroundColor: colors.border, borderRadius: 10, padding: 12, marginTop: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
          <Text className="text-muted text-xs">Tipo de Cobrança:</Text>
          <Text className="text-foreground font-semibold text-xs">{tipo === "hh" ? "HH Inteligente" : "Valor Avulso"}</Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text className="text-muted text-xs">Total Mão de Obra:</Text>
          <Text className="text-foreground font-bold text-sm">
            R$ {(tipo === "hh" ? hhCalculo.hh_ideal * parseFloat(horas || "0") : parseFloat(valorManual || "0")).toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  );
}
