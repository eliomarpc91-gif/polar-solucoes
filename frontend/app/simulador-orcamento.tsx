import { ScrollView, Text, View, Pressable, TextInput, Alert } from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useState } from "react";
import { simularOrcamento } from "@/lib/hh-store";
import { ResultadoSimulador } from "@/lib/hh-types";

export default function SimuladorOrcamentoScreen() {
  const colors = useColors();
  const router = useRouter();
  const [resultado, setResultado] = useState<ResultadoSimulador | null>(null);
  const [tipoServico, setTipoServico] = useState("Manutenção");
  const [cidade, setCidade] = useState("São Paulo");
  const [tempoEstimado, setTempoEstimado] = useState("2");
  const [quantidade, setQuantidade] = useState("1");
  const [urgencia, setUrgencia] = useState(false);
  const [deslocamento, setDeslocamento] = useState("10");
  const [dificuldade, setDificuldade] = useState("3");
  const [risco, setRisco] = useState("2");
  const [garantia, setGarantia] = useState(false);
  const [horario, setHorario] = useState("comercial");
  const [diaSemana, setDiaSemana] = useState("segunda");

  const simular = async () => {
    if (!tipoServico.trim() || !tempoEstimado.trim()) {
      Alert.alert("Erro", "Preencha tipo de serviço e tempo estimado!");
      return;
    }

    try {
      const res = await simularOrcamento({
        tipo_servico: tipoServico,
        cidade,
        tempo_estimado: parseFloat(tempoEstimado),
        quantidade: parseInt(quantidade),
        urgencia,
        deslocamento: parseFloat(deslocamento),
        dificuldade_tecnica: parseInt(dificuldade),
        risco_servico: parseInt(risco),
        garantia,
        horario: horario as any,
        dia_semana: diaSemana as any,
      });
      setResultado(res);
    } catch (error) {
      Alert.alert("Erro", "Erro ao simular orçamento");
    }
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
    marginBottom: 12,
  };

  const getStatusColor = () => {
    if (!resultado) return colors.muted;
    if (resultado.analise.status === "saudavel") return colors.success;
    if (resultado.analise.status === "margem_baixa") return colors.warning;
    return colors.error;
  };

  return (
    <ScreenContainer className="px-5 pt-4">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
            <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
          </Pressable>
          <Text className="text-foreground text-2xl font-bold">Simulador</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* FORMULÁRIO */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.border }}>
          <Text className="text-foreground text-lg font-bold mb-4">Dados do Serviço</Text>

          <Text className="text-muted text-xs font-semibold mb-2">Tipo de Serviço</Text>
          <TextInput value={tipoServico} onChangeText={setTipoServico} placeholder="Ex: Manutenção" style={inputStyle} />

          <Text className="text-muted text-xs font-semibold mb-2">Cidade</Text>
          <TextInput value={cidade} onChangeText={setCidade} placeholder="Ex: São Paulo" style={inputStyle} />

          <Text className="text-muted text-xs font-semibold mb-2">Tempo Estimado (horas)</Text>
          <TextInput value={tempoEstimado} onChangeText={setTempoEstimado} placeholder="Ex: 2" keyboardType="decimal-pad" style={inputStyle} />

          <Text className="text-muted text-xs font-semibold mb-2">Quantidade</Text>
          <TextInput value={quantidade} onChangeText={setQuantidade} placeholder="Ex: 1" keyboardType="number-pad" style={inputStyle} />

          <Text className="text-muted text-xs font-semibold mb-2">Deslocamento (km)</Text>
          <TextInput value={deslocamento} onChangeText={setDeslocamento} placeholder="Ex: 10" keyboardType="decimal-pad" style={inputStyle} />

          <Text className="text-muted text-xs font-semibold mb-3">Horário</Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
            {["comercial", "noturno", "madrugada"].map((h) => (
              <Pressable
                key={h}
                onPress={() => setHorario(h)}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    paddingVertical: 10,
                    paddingHorizontal: 8,
                    borderRadius: 8,
                    backgroundColor: horario === h ? colors.primary : colors.border,
                    alignItems: "center",
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text style={{ color: horario === h ? colors.background : colors.foreground, fontSize: 12, fontWeight: "500" }}>
                  {h === "comercial" ? "Comercial" : h === "noturno" ? "Noturno" : "Madrugada"}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text className="text-muted text-xs font-semibold mb-3">Dia da Semana</Text>
          <View style={{ flexDirection: "row", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            {["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"].map((d) => (
              <Pressable
                key={d}
                onPress={() => setDiaSemana(d)}
                style={({ pressed }) => [
                  {
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    backgroundColor: diaSemana === d ? colors.primary : colors.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text style={{ color: diaSemana === d ? colors.background : colors.foreground, fontSize: 11, fontWeight: "500" }}>
                  {d === "segunda" ? "Seg" : d === "terca" ? "Ter" : d === "quarta" ? "Qua" : d === "quinta" ? "Qui" : d === "sexta" ? "Sex" : d === "sabado" ? "Sab" : "Dom"}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text className="text-muted text-xs font-semibold mb-3">Dificuldade Técnica (1-5)</Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable
                key={n}
                onPress={() => setDificuldade(n.toString())}
                style={({ pressed }) => [
                  {
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    backgroundColor: dificuldade === n.toString() ? colors.primary : colors.border,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text style={{ color: dificuldade === n.toString() ? colors.background : colors.foreground, fontWeight: "bold" }}>
                  {n}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text className="text-muted text-xs font-semibold mb-3">Risco do Serviço (1-5)</Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable
                key={n}
                onPress={() => setRisco(n.toString())}
                style={({ pressed }) => [
                  {
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    backgroundColor: risco === n.toString() ? colors.primary : colors.border,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text style={{ color: risco === n.toString() ? colors.background : colors.foreground, fontWeight: "bold" }}>
                  {n}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={{ flexDirection: "row", gap: 16, marginBottom: 16 }}>
            <Pressable
              onPress={() => setUrgencia(!urgencia)}
              style={({ pressed }) => [
                {
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: urgencia ? colors.primary + "20" : colors.border,
                  borderWidth: urgencia ? 2 : 1,
                  borderColor: urgencia ? colors.primary : colors.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <MaterialIcons name={urgencia ? "check-box" : "check-box-outline-blank"} size={20} color={urgencia ? colors.primary : colors.muted} />
              <Text style={{ color: colors.foreground, marginLeft: 8, fontWeight: "500", fontSize: 12 }}>Urgência</Text>
            </Pressable>

            <Pressable
              onPress={() => setGarantia(!garantia)}
              style={({ pressed }) => [
                {
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: garantia ? colors.primary + "20" : colors.border,
                  borderWidth: garantia ? 2 : 1,
                  borderColor: garantia ? colors.primary : colors.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <MaterialIcons name={garantia ? "check-box" : "check-box-outline-blank"} size={20} color={garantia ? colors.primary : colors.muted} />
              <Text style={{ color: colors.foreground, marginLeft: 8, fontWeight: "500", fontSize: 12 }}>Garantia</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={simular}
            style={({ pressed }) => [
              {
                backgroundColor: colors.primary,
                padding: 14,
                borderRadius: 10,
                alignItems: "center",
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text style={{ color: colors.background, fontWeight: "600" }}>Simular Orçamento</Text>
          </Pressable>
        </View>

        {/* RESULTADO */}
        {resultado && (
          <>
            <View style={{ backgroundColor: getStatusColor() + "15", borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 2, borderColor: getStatusColor() }}>
              <Text className="text-foreground text-lg font-bold mb-2">{resultado.analise.recomendacao}</Text>
              <Text className="text-muted text-xs">{resultado.analise.status === "saudavel" ? "✅ Preço está saudável" : resultado.analise.status === "margem_baixa" ? "🟡 Margem abaixo do ideal" : "🔴 Risco de prejuízo"}</Text>
            </View>

            <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.border }}>
              <Text className="text-foreground text-lg font-bold mb-4">Valores Sugeridos</Text>

              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text className="text-muted text-xs font-semibold mb-2">Valor Mínimo</Text>
                  <View style={{ backgroundColor: colors.border, borderRadius: 10, padding: 12, alignItems: "center" }}>
                    <Text className="text-foreground text-lg font-bold">R$ {resultado.valor_minimo.toFixed(2)}</Text>
                  </View>
                </View>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text className="text-muted text-xs font-semibold mb-2">Valor Recomendado</Text>
                  <View style={{ backgroundColor: colors.primary + "20", borderRadius: 10, padding: 12, alignItems: "center", borderWidth: 2, borderColor: colors.primary }}>
                    <Text className="text-foreground text-lg font-bold" style={{ color: colors.primary }}>
                      R$ {resultado.valor_recomendado.toFixed(2)}
                    </Text>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text className="text-muted text-xs font-semibold mb-2">Valor Premium</Text>
                  <View style={{ backgroundColor: colors.success + "20", borderRadius: 10, padding: 12, alignItems: "center" }}>
                    <Text className="text-foreground text-lg font-bold" style={{ color: colors.success }}>
                      R$ {resultado.valor_premium.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.border }}>
              <Text className="text-foreground text-lg font-bold mb-4">Análise Financeira</Text>

              <View style={{ gap: 10 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <Text className="text-muted text-sm">HH Ajustado:</Text>
                  <Text className="text-foreground font-semibold">R$ {resultado.hh_ideal.toFixed(2)}/h</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <Text className="text-muted text-sm">Margem Estimada:</Text>
                  <Text className="text-foreground font-semibold">{resultado.margem_estimada.toFixed(1)}%</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <Text className="text-muted text-sm">Lucro Estimado:</Text>
                  <Text className="text-foreground font-semibold">R$ {resultado.lucro_estimado.toFixed(2)}</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text className="text-muted text-sm">Custo Operacional:</Text>
                  <Text className="text-foreground font-semibold">R$ {resultado.custo_operacional.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
