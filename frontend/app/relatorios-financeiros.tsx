import React, { useState } from "react";
import { ScrollView, Text, View, Pressable, ActivityIndicator, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  gerarRelatorioFluxoCaixa,
  gerarRelatorioContasReceber,
  gerarRelatorioContasPagar,
  gerarRelatorioLucratividade,
  gerarRelatorioAnaliseIA,
} from "@/lib/financeiro-store";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

export default function RelatoriosFinanceirosScreen() {
  const colors = useColors();
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [gerando, setGerando] = useState(false);
  const [relatorioSelecionado, setRelatorioSelecionado] = useState<string | null>(null);

  const relatorios = [
    {
      id: "fluxo-caixa",
      nome: "Fluxo de Caixa",
      descricao: "Movimentações diárias de entrada e saída",
      icone: "trending-up",
      funcao: gerarRelatorioFluxoCaixa,
    },
    {
      id: "contas-receber",
      nome: "Contas a Receber",
      descricao: "Valores a receber de clientes",
      icone: "attach-money",
      funcao: gerarRelatorioContasReceber,
    },
    {
      id: "contas-pagar",
      nome: "Contas a Pagar",
      descricao: "Despesas e pagamentos pendentes",
      icone: "credit-card",
      funcao: gerarRelatorioContasPagar,
    },
    {
      id: "lucratividade",
      nome: "Lucratividade por Serviço",
      descricao: "Análise de lucro por serviço prestado",
      icone: "bar-chart",
      funcao: gerarRelatorioLucratividade,
    },
    {
      id: "analise-ia",
      nome: "Análise Financeira IA",
      descricao: "Análise inteligente com recomendações",
      icone: "smart-toy",
      funcao: gerarRelatorioAnaliseIA,
    },
  ];

  async function gerarRelatorio(relatorio: any) {
    setGerando(true);
    setRelatorioSelecionado(relatorio.id);
    try {
      const html = await relatorio.funcao(mes, ano);
      
      // Salvar arquivo HTML
      const fileName = `relatorio-${relatorio.id}-${ano}-${String(mes).padStart(2, "0")}.html`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(filePath, html);
      
      // Compartilhar arquivo
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: "text/html",
          dialogTitle: `Compartilhar ${relatorio.nome}`,
        });
      } else {
        Alert.alert("Sucesso", `Relatório salvo em: ${filePath}`);
      }
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      Alert.alert("Erro", "Não foi possível gerar o relatório. Tente novamente.");
    } finally {
      setGerando(false);
      setRelatorioSelecionado(null);
    }
  }

  const MesAnoPicker = () => (
    <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16 }}>
      <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 12 }}>
        PERÍODO DO RELATÓRIO
      </Text>
      <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
        <Pressable
          onPress={() => setMes(mes === 1 ? 12 : mes - 1)}
          style={({ pressed }) => [{
            padding: 8,
            opacity: pressed ? 0.7 : 1,
          }]}
        >
          <MaterialIcons name="chevron-left" size={24} color={colors.primary} />
        </Pressable>
        
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "bold" }}>
            {new Date(ano, mes - 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
          </Text>
        </View>
        
        <Pressable
          onPress={() => setMes(mes === 12 ? 1 : mes + 1)}
          style={({ pressed }) => [{
            padding: 8,
            opacity: pressed ? 0.7 : 1,
          }]}
        >
          <MaterialIcons name="chevron-right" size={24} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
          Relatórios Financeiros
        </Text>

        <MesAnoPicker />

        <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 12 }}>
          SELECIONE UM RELATÓRIO
        </Text>

        {relatorios.map((relatorio) => (
          <Pressable
            key={relatorio.id}
            onPress={() => gerarRelatorio(relatorio)}
            disabled={gerando}
            style={({ pressed }) => [{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              borderLeftWidth: 4,
              borderLeftColor: colors.primary,
              opacity: pressed && !gerando ? 0.8 : 1,
            }]}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ 
                backgroundColor: colors.primary + "20", 
                borderRadius: 8, 
                padding: 10,
                justifyContent: "center",
                alignItems: "center",
              }}>
                <MaterialIcons name={relatorio.icone as any} size={24} color={colors.primary} />
              </View>
              
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontWeight: "bold", marginBottom: 4 }}>
                  {relatorio.nome}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 12 }}>
                  {relatorio.descricao}
                </Text>
              </View>

              {gerando && relatorioSelecionado === relatorio.id ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <MaterialIcons name="arrow-forward" size={20} color={colors.muted} />
              )}
            </View>
          </Pressable>
        ))}

        {/* Informações */}
        <View style={{ 
          backgroundColor: colors.primary + "20", 
          borderRadius: 12, 
          padding: 12, 
          marginTop: 20,
          borderLeftWidth: 4,
          borderLeftColor: colors.primary,
        }}>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
            <MaterialIcons name="info" size={20} color={colors.primary} />
            <Text style={{ color: colors.foreground, fontWeight: "bold", flex: 1 }}>
              Sobre os Relatórios
            </Text>
          </View>
          <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18 }}>
            Os relatórios são gerados em formato HTML e podem ser visualizados em qualquer navegador. Use a opção de compartilhamento para enviar por email ou salvar em seu dispositivo.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
