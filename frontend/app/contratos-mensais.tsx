import React, { useState, useCallback } from "react";
import { ScrollView, Text, View, Pressable, ActivityIndicator } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useFocusEffect } from "@react-navigation/native";

interface Contrato {
  id: string;
  clienteId: string;
  clienteNome: string;
  valor: number;
  frequencia: "mensal" | "trimestral" | "anual";
  servicos: string[];
  dataInicio: string;
  dataProxima: string;
  ativo: boolean;
  alertas: string[];
}

export default function ContratosMensaisScreen() {
  const colors = useColors();
  const [contratos, setContratos] = useState<Contrato[]>([
    {
      id: "1",
      clienteId: "c1",
      clienteNome: "Empresa ABC",
      valor: 1500,
      frequencia: "mensal",
      servicos: ["Manutenção preventiva", "Limpeza de equipamentos"],
      dataInicio: "2026-01-15",
      dataProxima: "2026-06-15",
      ativo: true,
      alertas: [],
    },
    {
      id: "2",
      clienteId: "c2",
      clienteNome: "Loja XYZ",
      valor: 800,
      frequencia: "mensal",
      servicos: ["Inspeção técnica"],
      dataInicio: "2026-02-01",
      dataProxima: "2026-06-01",
      ativo: true,
      alertas: ["Vencimento próximo"],
    },
  ]);
  const [carregando, setCarregando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      carregarContratos();
    }, [])
  );

  const carregarContratos = async () => {
    setCarregando(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error("Erro ao carregar contratos:", error);
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

  const formatarData = (data: string) => {
    return new Date(data + "T00:00:00").toLocaleDateString("pt-BR");
  };

  const obterFrequenciaTexto = (freq: string) => {
    const map: any = {
      mensal: "Mensal",
      trimestral: "Trimestral",
      anual: "Anual",
    };
    return map[freq] || freq;
  };

  const CartaoContrato = ({ contrato }: { contrato: Contrato }) => {
    const diasRestantes = Math.ceil(
      (new Date(contrato.dataProxima).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    return (
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          borderLeftWidth: 4,
          borderLeftColor: contrato.ativo ? colors.success : colors.muted,
          padding: 16,
          marginBottom: 12,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <View>
            <Text style={{ color: colors.foreground, fontWeight: "bold", marginBottom: 4 }}>
              {contrato.clienteNome}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>
              {obterFrequenciaTexto(contrato.frequencia)}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: contrato.ativo ? colors.success + "20" : colors.muted + "20",
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}
          >
            <Text
              style={{
                color: contrato.ativo ? colors.success : colors.muted,
                fontWeight: "bold",
                fontSize: 12,
              }}
            >
              {contrato.ativo ? "Ativo" : "Inativo"}
            </Text>
          </View>
        </View>

        <View
          style={{
            backgroundColor: colors.primary + "10",
            borderRadius: 8,
            padding: 12,
            marginBottom: 12,
          }}
        >
          <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 4 }}>
            Valor do Contrato
          </Text>
          <Text style={{ color: colors.primary, fontWeight: "bold", fontSize: 18 }}>
            {formatarMoeda(contrato.valor)}
          </Text>
        </View>

        <View style={{ marginBottom: 12 }}>
          <Text style={{ color: colors.foreground, fontWeight: "bold", marginBottom: 8, fontSize: 12 }}>
            SERVIÇOS INCLUSOS
          </Text>
          {contrato.servicos.map((servico, idx) => (
            <View key={idx} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <MaterialIcons name="check-circle" size={14} color={colors.success} />
              <Text style={{ color: colors.foreground, fontSize: 12 }}>
                {servico}
              </Text>
            </View>
          ))}
        </View>

        <View
          style={{
            backgroundColor: diasRestantes < 7 ? colors.warning + "20" : colors.border + "20",
            borderRadius: 8,
            padding: 12,
            marginBottom: 12,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View>
              <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 4 }}>
                Próxima Manutenção
              </Text>
              <Text style={{ color: colors.foreground, fontWeight: "bold" }}>
                {formatarData(contrato.dataProxima)}
              </Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text
                style={{
                  color: diasRestantes < 7 ? colors.warning : colors.foreground,
                  fontWeight: "bold",
                  fontSize: 14,
                }}
              >
                {diasRestantes}d
              </Text>
              <Text style={{ color: colors.muted, fontSize: 11 }}>
                restantes
              </Text>
            </View>
          </View>
        </View>

        {contrato.alertas.length > 0 && (
          <View style={{ gap: 6 }}>
            {contrato.alertas.map((alerta, idx) => (
              <View
                key={idx}
                style={{
                  backgroundColor: colors.warning + "20",
                  borderLeftWidth: 3,
                  borderLeftColor: colors.warning,
                  borderRadius: 4,
                  padding: 8,
                }}
              >
                <Text style={{ color: colors.foreground, fontSize: 12 }}>
                  ⚠️ {alerta}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (carregando) {
    return (
      <ScreenContainer className="p-4">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
          Contratos Mensais
        </Text>

        <View
          style={{
            backgroundColor: colors.primary + "10",
            borderLeftWidth: 3,
            borderLeftColor: colors.primary,
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
          }}
        >
          <Text style={{ color: colors.foreground, fontSize: 12, lineHeight: 16 }}>
            💡 <Text style={{ fontWeight: "bold" }}>Dica:</Text> Contratos mensais garantem receita previsível.
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
          <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 8, padding: 12 }}>
            <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 4 }}>
              Contratos Ativos
            </Text>
            <Text style={{ color: colors.primary, fontWeight: "bold", fontSize: 18 }}>
              {contratos.filter((c) => c.ativo).length}
            </Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 8, padding: 12 }}>
            <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 4 }}>
              Receita Mensal
            </Text>
            <Text style={{ color: colors.success, fontWeight: "bold", fontSize: 18 }}>
              {formatarMoeda(contratos.filter((c) => c.ativo).reduce((sum, c) => sum + c.valor, 0))}
            </Text>
          </View>
        </View>

        {contratos.length === 0 ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 20,
            }}
          >
            <MaterialIcons name="description" size={48} color={colors.muted} />
            <Text style={{ color: colors.foreground, fontWeight: "bold", marginTop: 12 }}>
              Nenhum contrato
            </Text>
          </View>
        ) : (
          <>
            <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 12 }}>
              {contratos.length} CONTRATO{contratos.length !== 1 ? "S" : ""}
            </Text>
            {contratos.map((contrato) => (
              <CartaoContrato key={contrato.id} contrato={contrato} />
            ))}
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
