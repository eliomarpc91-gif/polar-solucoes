import React, { useState } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

export default function Plantao24hScreen() {
  const colors = useColors();
  const [chamados, setChamados] = useState<any[]>([]);

  const dashboard = {
    chamadosCriticos: 0,
    atendimentosAndamento: 0,
    faturamentoPlantao: 0,
    tempoMedioResposta: 0,
  };

  const obterCorUrgencia = (nivel: string) => {
    switch (nivel) {
      case "critica":
        return colors.error;
      case "alta":
        return colors.warning;
      case "media":
        return colors.primary;
      default:
        return colors.success;
    }
  };

  const obterTextoUrgencia = (nivel: string) => {
    switch (nivel) {
      case "critica":
        return "EMERGÊNCIA CRÍTICA";
      case "alta":
        return "ALTA URGÊNCIA";
      case "media":
        return "MÉDIA URGÊNCIA";
      default:
        return "BAIXA URGÊNCIA";
    }
  };

  const CartaoChamado = ({ chamado }: any) => (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: obterCorUrgencia(chamado.nivelUrgencia),
        padding: 16,
        marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: obterCorUrgencia(chamado.nivelUrgencia), fontWeight: "bold", fontSize: 12, marginBottom: 4 }}>
            {obterTextoUrgencia(chamado.nivelUrgencia)}
          </Text>
          <Text style={{ color: colors.foreground, fontWeight: "bold", fontSize: 14 }}>
            {chamado.descricao}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: chamado.status === "em-atendimento" ? colors.primary + "20" : colors.success + "20",
            borderRadius: 6,
            paddingHorizontal: 8,
            paddingVertical: 4,
          }}
        >
          <Text style={{ color: chamado.status === "em-atendimento" ? colors.primary : colors.success, fontWeight: "bold", fontSize: 11 }}>
            {chamado.status === "em-atendimento" ? "EM ANDAMENTO" : "CONCLUÍDO"}
          </Text>
        </View>
      </View>

      <View style={{ gap: 8, marginBottom: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ color: colors.muted, fontSize: 12 }}>Tipo: {chamado.tipoAtendimento}</Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>Resposta: {chamado.tempoResposta}min</Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ color: colors.muted, fontSize: 12 }}>Risco: {chamado.riscoOperacional}%</Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>Impacto: R$ {chamado.impactoFinanceiro.toLocaleString("pt-BR")}</Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ color: colors.primary, fontWeight: "bold", fontSize: 12 }}>Taxa: +{chamado.taxaAplicada}%</Text>
          <Text style={{ color: colors.success, fontWeight: "bold", fontSize: 12 }}>R$ {chamado.margemRecalculada.toLocaleString("pt-BR")}</Text>
        </View>
      </View>

      {chamado.riscoPerdaMercadoria && (
        <View
          style={{
            backgroundColor: colors.error + "15",
            borderRadius: 6,
            paddingHorizontal: 8,
            paddingVertical: 6,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
          }}
        >
          <MaterialIcons name="warning" size={16} color={colors.error} />
          <Text style={{ color: colors.error, fontWeight: "bold", fontSize: 11 }}>
            RISCO DE PERDA DE MERCADORIA
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
          Plantão 24H Inteligente
        </Text>

        {/* Resumo */}
        <View style={{ gap: 8, marginBottom: 16 }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1, backgroundColor: colors.error + "15", borderRadius: 8, padding: 12 }}>
              <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 4 }}>Críticos</Text>
              <Text style={{ color: colors.error, fontWeight: "bold", fontSize: 18 }}>
                {dashboard.chamadosCriticos}
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.primary + "15", borderRadius: 8, padding: 12 }}>
              <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 4 }}>Em Andamento</Text>
              <Text style={{ color: colors.primary, fontWeight: "bold", fontSize: 18 }}>
                {dashboard.atendimentosAndamento}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1, backgroundColor: colors.success + "15", borderRadius: 8, padding: 12 }}>
              <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 4 }}>Faturamento</Text>
              <Text style={{ color: colors.success, fontWeight: "bold", fontSize: 14 }}>
                R$ {dashboard.faturamentoPlantao.toLocaleString("pt-BR")}
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.primary + "15", borderRadius: 8, padding: 12 }}>
              <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 4 }}>Tempo Médio</Text>
              <Text style={{ color: colors.primary, fontWeight: "bold", fontSize: 14 }}>
                {dashboard.tempoMedioResposta}min
              </Text>
            </View>
          </View>
        </View>

        {/* Chamados */}
        <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 12 }}>
          CHAMADOS RECENTES ({chamados.length})
        </Text>

        {chamados.length === 0 ? (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 24,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <MaterialIcons name="check-circle" size={32} color={colors.success} style={{ marginBottom: 8 }} />
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted, textAlign: "center" }}>
              Nenhum chamado urgente no momento
            </Text>
            <Text style={{ fontSize: 11, color: colors.muted, textAlign: "center", marginTop: 4 }}>
              Adicione chamados conforme surgirem
            </Text>
          </View>
        ) : (
          chamados.map((chamado) => (
            <CartaoChamado key={chamado.id} chamado={chamado} />
          ))
        )}

        {/* Configurações */}
        <View style={{ marginTop: 20 }}>
          <Text style={{ color: colors.foreground, fontWeight: "bold", marginBottom: 12 }}>
            Configurações de Plantão
          </Text>
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, gap: 12 }}>
            <View>
              <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
                Horário Comercial
              </Text>
              <Text style={{ color: colors.foreground, fontSize: 14 }}>
                08:00 - 18:00
              </Text>
            </View>
            <View>
              <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
                Acréscimo Noturno
              </Text>
              <Text style={{ color: colors.primary, fontWeight: "bold", fontSize: 14 }}>
                +30%
              </Text>
            </View>
            <View>
              <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
                Acréscimo Feriado
              </Text>
              <Text style={{ color: colors.primary, fontWeight: "bold", fontSize: 14 }}>
                +50%
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
