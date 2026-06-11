import React, { useEffect, useState } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { obterLucratividade } from "@/lib/financeiro-store";
import { LucratividadeServico } from "@/lib/financeiro-types";

export default function LucratividadeServicosScreen() {
  const colors = useColors();
  const [servicos, setServicos] = useState<LucratividadeServico[]>([]);
  const [filtro, setFiltro] = useState<"margem" | "lucro" | "volume">("margem");

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    const dados = await obterLucratividade();
    setServicos(dados);
  }

  const servicosOrdenados = [...servicos].sort((a, b) => {
    switch (filtro) {
      case "margem":
        return b.margemLucro - a.margemLucro;
      case "lucro":
        return b.lucroLiquido - a.lucroLiquido;
      case "volume":
        return b.valorCobrado - a.valorCobrado;
      default:
        return 0;
    }
  });

  const totalFaturamento = servicos.reduce((sum, s) => sum + s.valorCobrado, 0);
  const totalCusto = servicos.reduce((sum, s) => sum + (s.custoMaterial + s.deslocamento + s.hh + s.ajudante + s.imposto), 0);
  const totalLucro = servicos.reduce((sum, s) => sum + s.lucroLiquido, 0);
  const margemMedia = totalFaturamento > 0 ? (totalLucro / totalFaturamento) * 100 : 0;

  const getMargemColor = (margem: number) => {
    if (margem >= 40) return colors.success;
    if (margem >= 20) return colors.warning;
    return colors.error;
  };

  const FiltroButton = ({ label, value }: any) => (
    <Pressable
      onPress={() => setFiltro(value)}
      style={({ pressed }) => [{
        flex: 1,
        backgroundColor: filtro === value ? colors.primary : colors.surface,
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        alignItems: "center",
        borderWidth: 1,
        borderColor: filtro === value ? colors.primary : colors.border,
        opacity: pressed ? 0.7 : 1,
      }]}
    >
      <Text style={{ color: filtro === value ? "#FFFFFF" : colors.foreground, fontSize: 12, fontWeight: "600" }}>
        {label}
      </Text>
    </Pressable>
  );

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
          Lucratividade de Serviços
        </Text>

        {/* Resumo Geral */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
            <View>
              <Text style={{ color: colors.muted, fontSize: 12 }}>FATURAMENTO</Text>
              <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "bold", marginTop: 4 }}>
                R$ {totalFaturamento.toFixed(2)}
              </Text>
            </View>
            <View>
              <Text style={{ color: colors.muted, fontSize: 12 }}>CUSTO</Text>
              <Text style={{ color: colors.error, fontSize: 18, fontWeight: "bold", marginTop: 4 }}>
                R$ {totalCusto.toFixed(2)}
              </Text>
            </View>
            <View>
              <Text style={{ color: colors.muted, fontSize: 12 }}>LUCRO</Text>
              <Text style={{ color: colors.success, fontSize: 18, fontWeight: "bold", marginTop: 4 }}>
                R$ {totalLucro.toFixed(2)}
              </Text>
            </View>
          </View>
          <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 }}>
            <Text style={{ color: colors.muted, fontSize: 12 }}>MARGEM MÉDIA</Text>
            <Text style={{ color: getMargemColor(margemMedia), fontSize: 20, fontWeight: "bold", marginTop: 4 }}>
              {margemMedia.toFixed(1)}%
            </Text>
          </View>
        </View>

        {/* Filtros */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
          <FiltroButton label="Por Margem" value="margem" />
          <FiltroButton label="Por Lucro" value="lucro" />
          <FiltroButton label="Por Volume" value="volume" />
        </View>

        {/* Lista de Serviços */}
        <Text style={{ color: colors.foreground, fontWeight: "bold", marginBottom: 12 }}>
          Serviços ({servicosOrdenados.length})
        </Text>

        {servicosOrdenados.length === 0 ? (
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, alignItems: "center" }}>
            <Text style={{ color: colors.muted }}>Nenhum serviço registrado</Text>
          </View>
        ) : (
          servicosOrdenados.map((servico) => (
            <View
              key={servico.id}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 12,
                marginBottom: 8,
                borderLeftWidth: 4,
                borderLeftColor: getMargemColor(servico.margemLucro),
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.foreground, fontWeight: "bold" }}>{servico.descricao}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>OS: {servico.osId}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ color: getMargemColor(servico.margemLucro), fontWeight: "bold", fontSize: 14 }}>
                    {servico.margemLucro.toFixed(1)}%
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 10, marginTop: 2 }}>margem</Text>
                </View>
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.muted, fontSize: 10 }}>Faturamento</Text>
                  <Text style={{ color: colors.foreground, fontWeight: "bold", marginTop: 2 }}>
                    R$ {servico.valorCobrado.toFixed(2)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.muted, fontSize: 10 }}>Custo</Text>
                  <Text style={{ color: colors.error, fontWeight: "bold", marginTop: 2 }}>
                    R$ {(servico.custoMaterial + servico.deslocamento + servico.hh + servico.ajudante + servico.imposto).toFixed(2)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.muted, fontSize: 10 }}>Lucro</Text>
                  <Text style={{ color: colors.success, fontWeight: "bold", marginTop: 2 }}>
                    R$ {servico.lucroLiquido.toFixed(2)}
                  </Text>
                </View>
              </View>

              {servico.analiseIA && (
                <View style={{ backgroundColor: colors.background, borderRadius: 8, padding: 8, marginTop: 8 }}>
                  <Text style={{ color: colors.muted, fontSize: 10, fontStyle: "italic" }}>
                    💡 {servico.analiseIA}
                  </Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
