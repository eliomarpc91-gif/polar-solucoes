import React, { useCallback, useState } from "react";
import { ScrollView, Text, View, Pressable, TextInput, ActivityIndicator, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { api } from "@/lib/api-client";

type IAResponse = {
  analise: string;
  resumo: {
    kpis: Record<string, number>;
    topClientes: { cliente: string; totalGasto: number }[];
    topInadimplentes: { cliente: string; valor: number }[];
    topCategorias: { categoria: string; qtd: number }[];
  };
  modelo: string;
  ts: string;
};

const SUGESTOES = [
  "Quem é meu maior cliente?",
  "Quais clientes devem mais?",
  "Qual serviço dá mais lucro?",
  "Como aumentar o ticket médio?",
  "Que despesas posso cortar?",
  "Estou perdendo dinheiro este mês?",
];

function brl(v: number) {
  return (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function AnaliseIAScreen() {
  const colors = useColors();
  const [resposta, setResposta] = useState<string>("");
  const [resumo, setResumo] = useState<IAResponse["resumo"] | null>(null);
  const [pergunta, setPergunta] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const gerar = async (perg?: string) => {
    setCarregando(true);
    setErro(null);
    try {
      const data = await api.post<IAResponse>("/ia/analise", { pergunta: perg || null });
      setResposta(data.analise);
      setResumo(data.resumo);
      if (perg) setPergunta("");
    } catch (e: any) {
      setErro(e?.message || "Erro ao consultar IA");
      Alert.alert("Erro na análise", e?.message || "Não foi possível consultar a IA agora. Verifique sua conexão.");
    } finally {
      setCarregando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!resposta && !carregando) {
        gerar();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  // Render markdown super simples
  const renderMarkdown = (md: string) => {
    const linhas = md.split("\n");
    return linhas.map((linha, i) => {
      if (!linha.trim()) return <View key={i} style={{ height: 6 }} />;
      if (linha.startsWith("## ")) {
        return (
          <Text key={i} style={{ color: colors.foreground, fontSize: 16, fontWeight: "800", marginTop: 12, marginBottom: 4 }}>
            {linha.replace(/^##\s+/, "").replace(/\*\*/g, "")}
          </Text>
        );
      }
      if (linha.startsWith("# ")) {
        return (
          <Text key={i} style={{ color: colors.foreground, fontSize: 18, fontWeight: "900", marginTop: 12, marginBottom: 6 }}>
            {linha.replace(/^#\s+/, "").replace(/\*\*/g, "")}
          </Text>
        );
      }
      // Lista
      if (linha.match(/^[-*]\s/)) {
        const txt = linha.replace(/^[-*]\s+/, "");
        return (
          <View key={i} style={{ flexDirection: "row", marginBottom: 4, paddingLeft: 6 }}>
            <Text style={{ color: colors.primary, marginRight: 6 }}>•</Text>
            <Text style={{ color: colors.foreground, flex: 1, fontSize: 13, lineHeight: 19 }}>{renderInline(txt)}</Text>
          </View>
        );
      }
      // Numerada
      const num = linha.match(/^(\d+)\.\s+(.*)/);
      if (num) {
        return (
          <View key={i} style={{ flexDirection: "row", marginBottom: 4, paddingLeft: 6 }}>
            <Text style={{ color: colors.primary, fontWeight: "700", marginRight: 6 }}>{num[1]}.</Text>
            <Text style={{ color: colors.foreground, flex: 1, fontSize: 13, lineHeight: 19 }}>{renderInline(num[2])}</Text>
          </View>
        );
      }
      return (
        <Text key={i} style={{ color: colors.foreground, fontSize: 13, lineHeight: 19, marginBottom: 4 }}>
          {renderInline(linha)}
        </Text>
      );
    });
  };

  const renderInline = (txt: string) => {
    // **bold**
    const parts = txt.split(/(\*\*[^*]+\*\*)/);
    return parts.map((p, i) => {
      if (p.startsWith("**") && p.endsWith("**")) {
        return (
          <Text key={i} style={{ fontWeight: "700", color: colors.primary }}>
            {p.slice(2, -2)}
          </Text>
        );
      }
      return <Text key={i}>{p}</Text>;
    });
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 4, paddingBottom: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }}>
            <MaterialIcons name="auto-awesome" size={20} color="#fff" />
          </View>
          <View>
            <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "800" }}>Análise IA</Text>
            <Text style={{ color: colors.muted, fontSize: 10 }}>Consultor com Claude Sonnet 4.5</Text>
          </View>
        </View>
        <Pressable
          onPress={() => gerar()}
          disabled={carregando}
          style={{ backgroundColor: colors.surface, borderRadius: 10, padding: 10, opacity: carregando ? 0.5 : 1 }}
          hitSlop={6}
        >
          <MaterialIcons name="refresh" size={20} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
        {/* Sugestões */}
        <Text style={{ color: colors.muted, fontSize: 10, fontWeight: "700", letterSpacing: 0.4, marginBottom: 8 }}>SUGESTÕES RÁPIDAS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
          {SUGESTOES.map((s) => (
            <Pressable
              key={s}
              onPress={() => gerar(s)}
              disabled={carregando}
              style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, marginRight: 8 }}
            >
              <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "600" }}>💡 {s}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Pergunta livre */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
          <TextInput
            value={pergunta}
            onChangeText={setPergunta}
            placeholder="Faça uma pergunta sobre seu negócio..."
            placeholderTextColor={colors.muted}
            style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12, color: colors.foreground, fontSize: 13 }}
            onSubmitEditing={() => pergunta.trim() && gerar(pergunta.trim())}
            returnKeyType="send"
          />
          <Pressable
            onPress={() => pergunta.trim() && gerar(pergunta.trim())}
            disabled={!pergunta.trim() || carregando}
            style={{ backgroundColor: pergunta.trim() ? colors.primary : colors.surface, borderRadius: 12, paddingHorizontal: 14, justifyContent: "center", opacity: !pergunta.trim() || carregando ? 0.5 : 1 }}
          >
            <MaterialIcons name="send" size={18} color={pergunta.trim() ? "#fff" : colors.muted} />
          </Pressable>
        </View>

        {/* KPIs Sidebar (resumo) */}
        {resumo && !carregando && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            <KPI label="Faturamento mês" value={brl(resumo.kpis.faturamentoMes || 0)} color={colors.success} colors={colors} />
            <KPI label="Lucro mês" value={brl(resumo.kpis.lucroMes || 0)} color={(resumo.kpis.lucroMes || 0) >= 0 ? colors.success : colors.error} colors={colors} />
            <KPI label="A receber" value={brl(resumo.kpis.aReceber || 0)} color={colors.warning} colors={colors} />
            <KPI label="Vencidas" value={brl(resumo.kpis.vencidas || 0)} color={colors.error} colors={colors} />
            <KPI label="OS abertas" value={String(resumo.kpis.qtdOSAbertas || 0)} color={colors.primary} colors={colors} />
            <KPI label="Ticket médio" value={brl(resumo.kpis.ticketMedio || 0)} color={colors.primary} colors={colors} />
          </View>
        )}

        {/* Análise */}
        {carregando && (
          <View style={{ alignItems: "center", padding: 40 }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ color: colors.foreground, marginTop: 16, fontWeight: "700", fontSize: 14 }}>Consultando IA...</Text>
            <Text style={{ color: colors.muted, marginTop: 4, fontSize: 11 }}>Claude Sonnet 4.5 analisando seu negócio</Text>
          </View>
        )}

        {!carregando && erro && !resposta && (
          <View style={{ backgroundColor: colors.error + "15", borderLeftWidth: 4, borderLeftColor: colors.error, borderRadius: 8, padding: 14 }}>
            <Text style={{ color: colors.error, fontWeight: "700", marginBottom: 4 }}>Erro ao consultar IA</Text>
            <Text style={{ color: colors.foreground, fontSize: 12 }}>{erro}</Text>
            <Pressable onPress={() => gerar()} style={{ marginTop: 10, backgroundColor: colors.primary, padding: 10, borderRadius: 8, alignItems: "center" }}>
              <Text style={{ color: "#fff", fontWeight: "700" }}>Tentar novamente</Text>
            </Pressable>
          </View>
        )}

        {!carregando && resposta && (
          <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 8 }}>
              <MaterialIcons name="auto-awesome" size={16} color={colors.primary} />
              <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "700" }}>RESPOSTA DA IA</Text>
            </View>
            {renderMarkdown(resposta)}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

function KPI({ label, value, color, colors }: any) {
  return (
    <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, minWidth: "30%", flexGrow: 1 }}>
      <Text style={{ color: colors.muted, fontSize: 9, fontWeight: "700" }}>{label.toUpperCase()}</Text>
      <Text style={{ color, fontSize: 14, fontWeight: "800", marginTop: 2 }}>{value}</Text>
    </View>
  );
}
