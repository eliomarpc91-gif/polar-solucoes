import { useEffect, useState } from "react";
import { ScrollView, Text, View, Pressable, TextInput, Alert, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getCarteiras, saveCarteira, generateId, Carteira } from "@/lib/store";

const CORES = ["#1E88E5", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#06B6D4", "#0D3B66", "#EC4899"];

export default function NovaCarteiraScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [carteira, setCarteira] = useState<Carteira>({
    id: generateId(), nome: "", percentual: 0, saldo: 0, cor: CORES[0], ativa: true,
    criadoEm: new Date().toISOString(), atualizadoEm: new Date().toISOString(),
  });
  const [outras, setOutras] = useState<Carteira[]>([]);
  const [saldoStr, setSaldoStr] = useState("0");
  const [pctStr, setPctStr] = useState("0");
  const [minStr, setMinStr] = useState("");

  useEffect(() => {
    (async () => {
      const todas = await getCarteiras();
      if (id) {
        const c = todas.find((x) => x.id === id);
        if (c) {
          setCarteira(c);
          setSaldoStr(String(c.saldo).replace(".", ","));
          setPctStr(String(c.percentual));
          setMinStr(c.saldoMinimo ? String(c.saldoMinimo).replace(".", ",") : "");
          setOutras(todas.filter((x) => x.id !== id));
        }
      } else {
        setOutras(todas);
      }
    })();
  }, [id]);

  const somaOutrasAtivas = outras.filter((c) => c.ativa).reduce((s, c) => s + (c.percentual || 0), 0);
  const novoTotal = somaOutrasAtivas + (carteira.ativa ? parseFloat(pctStr.replace(",", ".")) || 0 : 0);

  const salvar = async () => {
    const pct = parseFloat(pctStr.replace(",", ".")) || 0;
    const saldo = parseFloat(saldoStr.replace(",", ".")) || 0;
    const min = minStr.trim() ? parseFloat(minStr.replace(",", ".")) : undefined;
    if (!carteira.nome.trim()) return Alert.alert("Erro", "Informe o nome da carteira");
    if (pct < 0 || pct > 100) return Alert.alert("Erro", "Percentual deve estar entre 0 e 100");
    if (carteira.ativa && Math.abs(novoTotal - 100) > 0.5 && pct > 0) {
      Alert.alert(
        "Atenção: total ≠ 100%",
        `A soma dos percentuais das carteiras ativas ficará em ${novoTotal.toFixed(1)}%. Deseja salvar mesmo assim?`,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Salvar mesmo assim", onPress: () => persistir(pct, saldo, min) },
        ],
      );
      return;
    }
    await persistir(pct, saldo, min);
  };

  const persistir = async (pct: number, saldo: number, min?: number) => {
    await saveCarteira({
      ...carteira,
      nome: carteira.nome.trim(),
      percentual: pct,
      saldo,
      saldoMinimo: min,
      atualizadoEm: new Date().toISOString(),
    });
    router.back();
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}><MaterialIcons name="arrow-back" size={24} color={colors.foreground} /></Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>{id ? "Editar Carteira" : "Nova Carteira"}</Text>
        <Pressable onPress={salvar} style={{ backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 }}>
          <Text style={{ color: "#fff", fontWeight: "800", fontSize: 12 }}>SALVAR</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Nome da carteira</Text>
        <TextInput
          value={carteira.nome}
          onChangeText={(v) => setCarteira({ ...carteira, nome: v })}
          placeholder="Ex: Operacional, Reserva, Impostos"
          placeholderTextColor="#94A3B8"
          style={styles.input}
        />

        <Text style={styles.label}>Percentual de distribuição (%)</Text>
        <TextInput value={pctStr} onChangeText={setPctStr} keyboardType="decimal-pad" placeholder="40" placeholderTextColor="#94A3B8" style={styles.input} />
        <Text style={{ color: novoTotal === 100 ? "#10B981" : novoTotal > 100 ? "#EF4444" : "#F59E0B", fontSize: 11, marginTop: 4 }}>
          Total ativas ficará: {novoTotal.toFixed(1)}% (precisa ser 100%)
        </Text>

        <Text style={styles.label}>Saldo atual (R$)</Text>
        <TextInput value={saldoStr} onChangeText={setSaldoStr} keyboardType="decimal-pad" placeholder="0,00" placeholderTextColor="#94A3B8" style={styles.input} />

        <Text style={styles.label}>Alerta de saldo mínimo (R$) — opcional</Text>
        <TextInput value={minStr} onChangeText={setMinStr} keyboardType="decimal-pad" placeholder="Ex: 500,00" placeholderTextColor="#94A3B8" style={styles.input} />

        <Text style={styles.label}>Cor</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {CORES.map((c) => (
            <Pressable
              key={c}
              onPress={() => setCarteira((p) => ({ ...p, cor: c }))}
              style={[styles.colorBtn, { backgroundColor: c, borderWidth: carteira.cor === c ? 3 : 0 }]}
            />
          ))}
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 16 }}>
          <Pressable
            onPress={() => setCarteira((p) => ({ ...p, ativa: !p.ativa }))}
            style={{
              width: 50, height: 28, borderRadius: 14, backgroundColor: carteira.ativa ? "#10B981" : "#94A3B8",
              padding: 3,
            }}
          >
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "#fff", alignSelf: carteira.ativa ? "flex-end" : "flex-start" }} />
          </Pressable>
          <Text style={{ marginLeft: 10, color: colors.foreground, fontWeight: "700" }}>{carteira.ativa ? "Carteira ATIVA" : "Carteira INATIVA"}</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  headerTitle: { flex: 1, marginHorizontal: 12, fontSize: 16, fontWeight: "900" },
  label: { color: "#64748B", fontSize: 11, fontWeight: "800", marginTop: 12, marginBottom: 4, letterSpacing: 0.3 },
  input: { borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#0F172A", backgroundColor: "#fff" },
  colorBtn: { width: 36, height: 36, borderRadius: 18, borderColor: "#0F172A" },
});
