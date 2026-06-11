import { useEffect, useState } from "react";
import { ScrollView, Text, View, Pressable, Alert, StyleSheet, TextInput } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getCarteiras, transferirEntreCarteiras, Carteira } from "@/lib/store";

const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function TransferenciaScreen() {
  const colors = useColors();
  const router = useRouter();
  const { origem: origemParam } = useLocalSearchParams<{ origem?: string }>();
  const [carteiras, setCarteiras] = useState<Carteira[]>([]);
  const [origemId, setOrigemId] = useState(origemParam || "");
  const [destinoId, setDestinoId] = useState("");
  const [valorStr, setValorStr] = useState("");
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { getCarteiras().then(setCarteiras); }, []);

  const origem = carteiras.find((c) => c.id === origemId);
  const destino = carteiras.find((c) => c.id === destinoId);
  const valor = parseFloat(valorStr.replace(",", ".")) || 0;
  const valido = !!origemId && !!destinoId && origemId !== destinoId && valor > 0 && origem && origem.saldo >= valor;

  const confirmar = async () => {
    if (!valido) return Alert.alert("Atenção", "Preencha origem, destino e valor válidos");
    setLoading(true);
    const r = await transferirEntreCarteiras(origemId, destinoId, valor, descricao);
    setLoading(false);
    if (!r.ok) Alert.alert("Erro", r.mensagem || "Falha");
    else { Alert.alert("✓", "Transferência concluída", [{ text: "OK", onPress: () => router.back() }]); }
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}><MaterialIcons name="arrow-back" size={24} color={colors.foreground} /></Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>🔄 Transferência entre Carteiras</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.label}>DE (origem)</Text>
        <Selector carteiras={carteiras} selectedId={origemId} onSelect={setOrigemId} excludeId={destinoId} colors={colors} />

        <View style={{ alignItems: "center", marginVertical: 14 }}>
          <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }}>
            <MaterialIcons name="swap-vert" size={28} color="#fff" />
          </View>
        </View>

        <Text style={styles.label}>PARA (destino)</Text>
        <Selector carteiras={carteiras} selectedId={destinoId} onSelect={setDestinoId} excludeId={origemId} colors={colors} />

        <Text style={styles.label}>Valor (R$)</Text>
        <TextInput value={valorStr} onChangeText={setValorStr} keyboardType="decimal-pad" placeholder="0,00" placeholderTextColor="#94A3B8" style={styles.input} />
        {origem && valor > origem.saldo && (
          <Text style={{ color: "#EF4444", fontSize: 11, marginTop: 4 }}>⚠ Saldo insuficiente em {origem.nome} ({fmtBRL(origem.saldo)})</Text>
        )}

        <Text style={styles.label}>Descrição (opcional)</Text>
        <TextInput value={descricao} onChangeText={setDescricao} placeholder="Motivo da transferência..." placeholderTextColor="#94A3B8" style={styles.input} />

        <Pressable
          onPress={confirmar}
          disabled={!valido || loading}
          style={{ backgroundColor: valido ? colors.primary : "#94A3B8", paddingVertical: 16, borderRadius: 12, alignItems: "center", marginTop: 20 }}
        >
          <Text style={{ color: "#fff", fontWeight: "900", fontSize: 14 }}>{loading ? "PROCESSANDO..." : "CONFIRMAR TRANSFERÊNCIA"}</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

function Selector({ carteiras, selectedId, onSelect, excludeId, colors }: any) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
      {carteiras.filter((c: Carteira) => c.id !== excludeId).map((c: Carteira) => {
        const active = selectedId === c.id;
        return (
          <Pressable
            key={c.id}
            onPress={() => onSelect(c.id)}
            style={{
              paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
              backgroundColor: active ? c.cor : "#F1F5F9",
              borderWidth: active ? 2 : 1, borderColor: active ? c.cor : "#E2E8F0",
              minWidth: 120,
            }}
          >
            <Text style={{ color: active ? "#fff" : colors.foreground, fontWeight: "800", fontSize: 12 }}>{c.nome}</Text>
            <Text style={{ color: active ? "rgba(255,255,255,0.9)" : "#64748B", fontSize: 10, marginTop: 2 }}>{fmtBRL(c.saldo)}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  title: { flex: 1, marginHorizontal: 12, fontSize: 16, fontWeight: "900" },
  label: { color: "#64748B", fontSize: 11, fontWeight: "800", marginTop: 14, marginBottom: 6, letterSpacing: 0.3 },
  input: { borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 14, color: "#0F172A", backgroundColor: "#fff" },
});
