import { useState, useCallback } from "react";
import { ScrollView, Text, View, Pressable, TextInput, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getOrdens, getFinanceiro, saveFinanceiroEntry, generateId, FinanceiroEntry, OrdemServico } from "@/lib/store";

export default function PagamentosScreen() {
  const colors = useColors();
  const router = useRouter();
  const [tab, setTab] = useState<"registrar" | "pendentes">("registrar");
  const [osPendentes, setOsPendentes] = useState<OrdemServico[]>([]);
  const [pagamentos, setPagamentos] = useState<FinanceiroEntry[]>([]);
  const [osSelecionada, setOsSelecionada] = useState<OrdemServico | null>(null);
  const [valor, setValor] = useState("");
  const [tipo, setTipo] = useState<"total" | "entrada" | "saldo">("total");

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const ordens = await getOrdens();
    const financeiro = await getFinanceiro();
    setOsPendentes(ordens.filter((o) => o.status === "concluido" || o.status === "em_andamento"));
    setPagamentos(financeiro.filter((f) => f.tipo === "receita").sort((a, b) => b.data.localeCompare(a.data)));
  };

  const registrarPagamento = async () => {
    if (!osSelecionada) {
      Alert.alert("Erro", "Selecione uma OS");
      return;
    }
    const valorNum = parseFloat(valor.replace(",", "."));
    if (!valorNum || valorNum <= 0) {
      Alert.alert("Erro", "Informe um valor válido");
      return;
    }

    const descMap = { total: "Pagamento total", entrada: "Entrada 50%", saldo: "Saldo restante" };
    const entry: FinanceiroEntry = {
      id: generateId(),
      tipo: "receita",
      descricao: `${descMap[tipo]} - OS #${osSelecionada.numero}`,
      valor: valorNum,
      data: new Date().toISOString(),
      osId: osSelecionada.id,
    };

    await saveFinanceiroEntry(entry);
    Alert.alert("Sucesso", `Pagamento de R$ ${valorNum.toFixed(2)} registrado!`);
    setValor("");
    setOsSelecionada(null);
    loadData();
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text className="text-foreground text-xl font-bold ml-4">Pagamentos</Text>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: "row", marginHorizontal: 20, marginBottom: 16, backgroundColor: colors.surface, borderRadius: 10, padding: 4 }}>
        {(["registrar", "pendentes"] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 8,
              backgroundColor: tab === t ? colors.primary : "transparent",
              alignItems: "center",
            }}
          >
            <Text style={{ color: tab === t ? "#FFF" : colors.muted, fontWeight: "600", fontSize: 13 }}>
              {t === "registrar" ? "Registrar" : "Histórico"}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {tab === "registrar" ? (
          <>
            {/* Selecionar OS */}
            <Text className="text-muted text-xs font-semibold mb-2 ml-1">SELECIONE A OS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {osPendentes.slice(0, 10).map((os) => (
                <Pressable
                  key={os.id}
                  onPress={() => {
                    setOsSelecionada(os);
                    if (tipo === "total") setValor(os.valorTotal.toString());
                    else if (tipo === "entrada") setValor((os.valorTotal * 0.5).toString());
                  }}
                  style={({ pressed }) => [
                    {
                      backgroundColor: osSelecionada?.id === os.id ? colors.primary : colors.surface,
                      borderRadius: 10,
                      padding: 14,
                      marginRight: 10,
                      borderWidth: 1,
                      borderColor: osSelecionada?.id === os.id ? colors.primary : colors.border,
                      minWidth: 120,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text style={{ color: osSelecionada?.id === os.id ? "#FFF" : colors.foreground, fontWeight: "700", fontSize: 13 }}>
                    OS #{os.numero}
                  </Text>
                  <Text style={{ color: osSelecionada?.id === os.id ? "#FFF" : colors.muted, fontSize: 11, marginTop: 2 }}>
                    {os.clienteNome}
                  </Text>
                  <Text style={{ color: osSelecionada?.id === os.id ? "#FFF" : colors.success, fontSize: 12, fontWeight: "600", marginTop: 4 }}>
                    R$ {os.valorTotal.toFixed(2)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Tipo de pagamento */}
            <Text className="text-muted text-xs font-semibold mb-2 ml-1">TIPO DE PAGAMENTO</Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
              {([
                { key: "total", label: "Total" },
                { key: "entrada", label: "Entrada 50%" },
                { key: "saldo", label: "Saldo" },
              ] as const).map((t) => (
                <Pressable
                  key={t.key}
                  onPress={() => {
                    setTipo(t.key);
                    if (osSelecionada) {
                      if (t.key === "total") setValor(osSelecionada.valorTotal.toString());
                      else if (t.key === "entrada") setValor((osSelecionada.valorTotal * 0.5).toString());
                      else setValor((osSelecionada.valorTotal * 0.5).toString());
                    }
                  }}
                  style={({ pressed }) => [
                    {
                      flex: 1,
                      paddingVertical: 14,
                      borderRadius: 10,
                      backgroundColor: tipo === t.key ? colors.primary + "15" : colors.surface,
                      borderWidth: 1.5,
                      borderColor: tipo === t.key ? colors.primary : colors.border,
                      alignItems: "center",
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text style={{ color: tipo === t.key ? colors.primary : colors.foreground, fontWeight: "600", fontSize: 13 }}>
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Valor */}
            <Text className="text-muted text-xs font-semibold mb-2 ml-1">VALOR (R$)</Text>
            <TextInput
              value={valor}
              onChangeText={setValor}
              placeholder="0,00"
              placeholderTextColor={colors.muted}
              keyboardType="decimal-pad"
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                padding: 18,
                color: colors.foreground,
                fontSize: 22,
                fontWeight: "700",
                textAlign: "center",
                marginBottom: 20,
              }}
            />

            {/* Botão Registrar */}
            <Pressable
              onPress={registrarPagamento}
              style={({ pressed }) => [
                {
                  backgroundColor: colors.success,
                  borderRadius: 14,
                  padding: 18,
                  alignItems: "center",
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text style={{ color: "#FFF", fontSize: 16, fontWeight: "800" }}>Registrar Pagamento</Text>
            </Pressable>
          </>
        ) : (
          <>
            {pagamentos.length === 0 ? (
              <View style={{ alignItems: "center", paddingTop: 40 }}>
                <MaterialIcons name="payment" size={48} color={colors.muted} />
                <Text className="text-muted text-sm mt-3">Nenhum pagamento registrado</Text>
              </View>
            ) : (
              pagamentos.map((p) => (
                <View
                  key={p.id}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: colors.border,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: colors.success + "15", alignItems: "center", justifyContent: "center" }}>
                    <MaterialIcons name="check-circle" size={20} color={colors.success} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text className="text-foreground text-sm font-medium">{p.descricao}</Text>
                    <Text className="text-muted text-xs mt-1">
                      {new Date(p.data).toLocaleDateString("pt-BR")}
                    </Text>
                  </View>
                  <Text style={{ color: colors.success, fontWeight: "700", fontSize: 14 }}>
                    R$ {p.valor.toFixed(2)}
                  </Text>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
