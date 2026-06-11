import React, { useState } from "react";
import { ScrollView, Text, View, Pressable, TextInput, ActivityIndicator, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { simularExpansao } from "@/lib/financeiro-store";
import type { SimuladorExpansao } from "@/lib/financeiro-types";

// Componente isolado fora do principal para evitar perder foco do teclado
function CampoInput({ label, value, onChange, placeholder, keyboardType = "default", colors }: any) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
        {label}
      </Text>
      <TextInput
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 10,
          color: colors.foreground,
          fontSize: 14,
        }}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType}
        value={value}
        onChangeText={onChange}
      />
    </View>
  );
}

export default function SimuladorExpansaoNovoScreen() {
  const colors = useColors();
  const [resultado, setResultado] = useState<SimuladorExpansao | null>(null);
  const [carregando, setCarregando] = useState(false);
  
  const [formData, setFormData] = useState({
    cidade: "",
    estado: "",
    aluguel: "0",
    despesasFixas: "0",
    custosOperacionais: "0",
    servicosEstimados: "10",
    equipeSize: "1",
    deslocamentoMedio: "0",
    investimentoInicial: "0",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSimular = async () => {
    if (!formData.cidade || !formData.estado) {
      Alert.alert("Erro", "Preencha cidade e estado");
      return;
    }

    setCarregando(true);
    try {
      const res = await simularExpansao({
        cidade: formData.cidade,
        estado: formData.estado,
        aluguel: parseFloat(formData.aluguel) || 0,
        despesasFixas: parseFloat(formData.despesasFixas) || 0,
        custosOperacionais: parseFloat(formData.custosOperacionais) || 0,
        servicosEstimados: parseInt(formData.servicosEstimados) || 10,
        equipeSize: parseInt(formData.equipeSize) || 1,
        deslocamentoMedio: parseFloat(formData.deslocamentoMedio) || 0,
        investimentoInicial: parseFloat(formData.investimentoInicial) || 0,
      });
      setResultado(res);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível simular a expansão");
    } finally {
      setCarregando(false);
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const getRiscoColor = (risco: string) => {
    switch (risco) {
      case "baixo":
        return colors.success;
      case "moderado":
        return colors.warning;
      case "alto":
        return colors.error;
      default:
        return colors.muted;
    }
  };

  const getViabilidadeColor = (viabilidade: string) => {
    switch (viabilidade) {
      case "viavel":
        return colors.success;
      case "risco_moderado":
        return colors.warning;
      case "nao_recomendado":
        return colors.error;
      default:
        return colors.muted;
    }
  };

  if (resultado) {
    return (
      <ScreenContainer className="p-4">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20, gap: 12 }}>
            <Pressable onPress={() => setResultado(null)}>
              <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
            </Pressable>
            <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: "bold", flex: 1 }}>
              Resultado da Simulação
            </Text>
          </View>

          {/* Viabilidade Principal */}
          <View
            style={{
              backgroundColor: getViabilidadeColor(resultado.resultado.viabilidade) + "20",
              borderLeftWidth: 4,
              borderLeftColor: getViabilidadeColor(resultado.resultado.viabilidade),
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 8 }}>
              VIABILIDADE DA EXPANSÃO
            </Text>
            <Text
              style={{
                color: getViabilidadeColor(resultado.resultado.viabilidade),
                fontSize: 20,
                fontWeight: "bold",
                textTransform: "capitalize",
              }}
            >
              {resultado.resultado.viabilidade === "viavel"
                ? "✅ Expansão Viável"
                : resultado.resultado.viabilidade === "risco_moderado"
                ? "⚠️ Risco Moderado"
                : "❌ Não Recomendado"}
            </Text>
          </View>

          {/* Localização */}
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <Text style={{ color: colors.foreground, fontWeight: "bold", marginBottom: 12 }}>
              LOCALIZAÇÃO
            </Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: colors.muted, fontSize: 14 }}>
                {resultado.cidade}, {resultado.estado}
              </Text>
            </View>
          </View>

          {/* Métricas Principais */}
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <Text style={{ color: colors.foreground, fontWeight: "bold", marginBottom: 12 }}>
              MÉTRICAS FINANCEIRAS
            </Text>
            <View style={{ gap: 10 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: colors.muted, fontSize: 12 }}>Faturamento Mínimo:</Text>
                <Text style={{ color: colors.success, fontWeight: "bold" }}>
                  {formatarMoeda(resultado.resultado.faturamentoMinimo)}
                </Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: colors.muted, fontSize: 12 }}>Lucro Estimado:</Text>
                <Text
                  style={{
                    color: resultado.resultado.lucroEstimado > 0 ? colors.success : colors.error,
                    fontWeight: "bold",
                  }}
                >
                  {formatarMoeda(resultado.resultado.lucroEstimado)}
                </Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: colors.muted, fontSize: 12 }}>Clientes Ideais:</Text>
                <Text style={{ color: colors.primary, fontWeight: "bold" }}>
                  {resultado.resultado.clientesIdeais}
                </Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: colors.muted, fontSize: 12 }}>Tempo de Retorno:</Text>
                <Text style={{ color: colors.foreground, fontWeight: "bold" }}>
                  {resultado.resultado.tempoRetorno} meses
                </Text>
              </View>
            </View>
          </View>

          {/* Risco */}
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16 }}>
            <Text style={{ color: colors.foreground, fontWeight: "bold", marginBottom: 12 }}>
              ANÁLISE DE RISCO
            </Text>
            <View
              style={{
                backgroundColor: getRiscoColor(resultado.resultado.riscoFinanceiro) + "20",
                borderLeftWidth: 4,
                borderLeftColor: getRiscoColor(resultado.resultado.riscoFinanceiro),
                borderRadius: 8,
                padding: 12,
              }}
            >
              <Text
                style={{
                  color: getRiscoColor(resultado.resultado.riscoFinanceiro),
                  fontWeight: "bold",
                  textTransform: "capitalize",
                }}
              >
                Risco: {resultado.resultado.riscoFinanceiro}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => setResultado(null)}
            style={({ pressed }) => [{
              backgroundColor: colors.primary,
              borderRadius: 8,
              paddingVertical: 12,
              marginTop: 20,
              opacity: pressed ? 0.8 : 1,
            }]}
          >
            <Text style={{ color: "white", fontWeight: "bold", textAlign: "center" }}>
              Nova Simulação
            </Text>
          </Pressable>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
          Simulador de Expansão
        </Text>

        <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 16 }}>
          INFORMAÇÕES DA EXPANSÃO
        </Text>

        <CampoInput label="Cidade" value={formData.cidade} onChange={(v: string) => handleInputChange("cidade", v)} placeholder="Ex: São Paulo" colors={colors} />
        <CampoInput label="Estado" value={formData.estado} onChange={(v: string) => handleInputChange("estado", v)} placeholder="Ex: SP" colors={colors} />

        <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 16, marginTop: 16 }}>
          CUSTOS MENSAIS
        </Text>

        <CampoInput label="Aluguel" value={formData.aluguel} onChange={(v: string) => handleInputChange("aluguel", v)} placeholder="0" keyboardType="decimal-pad" colors={colors} />
        <CampoInput label="Despesas Fixas" value={formData.despesasFixas} onChange={(v: string) => handleInputChange("despesasFixas", v)} placeholder="0" keyboardType="decimal-pad" colors={colors} />
        <CampoInput label="Custos Operacionais" value={formData.custosOperacionais} onChange={(v: string) => handleInputChange("custosOperacionais", v)} placeholder="0" keyboardType="decimal-pad" colors={colors} />

        <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 16, marginTop: 16 }}>
          OPERAÇÃO
        </Text>

        <CampoInput label="Serviços Estimados/Mês" value={formData.servicosEstimados} onChange={(v: string) => handleInputChange("servicosEstimados", v)} placeholder="10" keyboardType="number-pad" colors={colors} />
        <CampoInput label="Tamanho da Equipe" value={formData.equipeSize} onChange={(v: string) => handleInputChange("equipeSize", v)} placeholder="1" keyboardType="number-pad" colors={colors} />
        <CampoInput label="Deslocamento Médio (R$)" value={formData.deslocamentoMedio} onChange={(v: string) => handleInputChange("deslocamentoMedio", v)} placeholder="0" keyboardType="decimal-pad" colors={colors} />
        <CampoInput label="Investimento Inicial" value={formData.investimentoInicial} onChange={(v: string) => handleInputChange("investimentoInicial", v)} placeholder="0" keyboardType="decimal-pad" colors={colors} />

        <Pressable
          onPress={handleSimular}
          disabled={carregando}
          style={({ pressed }) => [{
            backgroundColor: colors.primary,
            borderRadius: 8,
            paddingVertical: 14,
            marginTop: 24,
            opacity: pressed || carregando ? 0.8 : 1,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
          }]}
        >
          {carregando ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <MaterialIcons name="calculate" size={20} color="white" />
              <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
                Simular Expansão
              </Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
