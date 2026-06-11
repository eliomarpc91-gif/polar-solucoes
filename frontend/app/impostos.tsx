import React, { useState, useCallback } from "react";
import { ScrollView, Text, View, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useFocusEffect } from "@react-navigation/native";
import { gerarRelatorioImposto, obterRelatorioimpostos } from "@/lib/financeiro-store";
import type { RelatorioImposto } from "@/lib/financeiro-types";

export default function ImpostosScreen() {
  const colors = useColors();
  const [relatorios, setRelatorios] = useState<RelatorioImposto[]>([]);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [carregando, setCarregando] = useState(false);
  const [atualizando, setAtualizando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      carregarRelatorios();
    }, [])
  );

  const carregarRelatorios = async () => {
    setCarregando(true);
    try {
      let dados = await obterRelatorioimpostos();
      if (dados.length === 0) {
        const novo = await gerarRelatorioImposto(mes, ano);
        dados = [novo];
      }
      setRelatorios(dados.sort((a, b) => b.ano - a.ano || b.mes - a.mes));
    } catch (error) {
      console.error("Erro ao carregar relatórios:", error);
    } finally {
      setCarregando(false);
    }
  };

  const aoAtualizar = async () => {
    setAtualizando(true);
    try {
      const novo = await gerarRelatorioImposto(mes, ano);
      const dados = await obterRelatorioimpostos();
      setRelatorios(dados.sort((a, b) => b.ano - a.ano || b.mes - a.mes));
    } catch (error) {
      console.error("Erro ao atualizar:", error);
    } finally {
      setAtualizando(false);
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const CartaoRelatorio = ({ relatorio }: { relatorio: RelatorioImposto }) => (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: colors.primary,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <Text style={{ color: colors.foreground, fontWeight: "bold" }}>
          {new Date(relatorio.ano, relatorio.mes - 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 12 }}>
          {relatorio.criado_em}
        </Text>
      </View>

      <View style={{ backgroundColor: colors.border + "20", borderRadius: 8, padding: 12, gap: 8 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ color: colors.muted, fontSize: 12 }}>Previsão Mensal:</Text>
          <Text style={{ color: colors.warning, fontWeight: "bold" }}>
            {formatarMoeda(relatorio.previsaoMensal)}
          </Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ color: colors.muted, fontSize: 12 }}>Previsão Anual:</Text>
          <Text style={{ color: colors.warning, fontWeight: "bold" }}>
            {formatarMoeda(relatorio.previsaoAnual)}
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingTop: 8,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "bold" }}>Separação Automática:</Text>
          <Text style={{ color: colors.success, fontWeight: "bold" }}>
            {formatarMoeda(relatorio.separacaoAutomatica)}
          </Text>
        </View>
      </View>

      <View style={{ marginTop: 12 }}>
        <Text style={{ color: colors.muted, fontSize: 11, lineHeight: 16 }}>
          {relatorio.resumoTributario}
        </Text>
      </View>

      <View style={{ marginTop: 12, gap: 6 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ color: colors.muted, fontSize: 11 }}>ISS Peças:</Text>
          <Text style={{ color: colors.foreground, fontWeight: "bold", fontSize: 11 }}>
            {formatarMoeda(relatorio.impostoSobrePecas)}
          </Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ color: colors.muted, fontSize: 11 }}>ISS Serviço:</Text>
          <Text style={{ color: colors.foreground, fontWeight: "bold", fontSize: 11 }}>
            {formatarMoeda(relatorio.impostoSobreServico)}
          </Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ color: colors.muted, fontSize: 11 }}>Total de Impostos:</Text>
          <Text style={{ color: colors.error, fontWeight: "bold", fontSize: 11 }}>
            {formatarMoeda(relatorio.impostoTotal)}
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingTop: 6,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "bold" }}>Lucro Líquido:</Text>
          <Text style={{ color: colors.success, fontWeight: "bold", fontSize: 11 }}>
            {formatarMoeda(relatorio.lucroLiquidoAposImposto)}
          </Text>
        </View>
      </View>
    </View>
  );

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
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} />}
      >
        <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
          Cálculo de Impostos
        </Text>

        {/* Info Box */}
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
            💡 <Text style={{ fontWeight: "bold" }}>Dica:</Text> Os impostos são calculados automaticamente com base em suas receitas. A separação automática ajuda você a ter sempre o valor disponível para pagamento.
          </Text>
        </View>

        {relatorios.length === 0 ? (
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
            <MaterialIcons name="receipt" size={48} color={colors.muted} />
            <Text style={{ color: colors.foreground, fontWeight: "bold", marginTop: 12 }}>
              Nenhum relatório disponível
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4, textAlign: "center" }}>
              Os relatórios serão gerados conforme você realizar serviços
            </Text>
          </View>
        ) : (
          <>
            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600" }}>
                {relatorios.length} RELATÓRIO{relatorios.length !== 1 ? "S" : ""}
              </Text>
            </View>
            {relatorios.map((relatorio) => (
              <CartaoRelatorio key={relatorio.id} relatorio={relatorio} />
            ))}
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
