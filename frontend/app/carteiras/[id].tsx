import { useCallback, useState } from "react";
import { ScrollView, Text, View, Pressable, Alert, StyleSheet, TextInput, Modal } from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  getCarteiraById,
  getMovimentacoesCarteira,
  deleteMovimentacaoCarteira,
  lancarMovimentacaoCarteira,
  Carteira,
  MovimentacaoCarteira,
} from "@/lib/store";

const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDt = (iso: string) => { try { return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return iso; } };

export default function ExtratoCarteiraScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [carteira, setCarteira] = useState<Carteira | null>(null);
  const [movs, setMovs] = useState<MovimentacaoCarteira[]>([]);
  const [modal, setModal] = useState<{ tipo: "entrada" | "saida" | "ajuste"; valor: string; descricao: string } | null>(null);

  const load = async () => {
    const c = await getCarteiraById(id as string);
    setCarteira(c);
    const m = await getMovimentacoesCarteira(id as string);
    setMovs(m.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()));
  };

  useFocusEffect(useCallback(() => { load(); }, [id]));

  const submitMov = async () => {
    if (!modal) return;
    const v = parseFloat(modal.valor.replace(",", ".")) || 0;
    const r = await lancarMovimentacaoCarteira(id as string, modal.tipo, v, modal.descricao || `${modal.tipo} manual`);
    if (!r.ok) Alert.alert("Erro", r.mensagem || "Falha");
    else { setModal(null); await load(); }
  };

  const remover = (m: MovimentacaoCarteira) => {
    Alert.alert("Excluir movimentação", `Deseja excluir esta movimentação? O saldo será revertido.`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: async () => { await deleteMovimentacaoCarteira(m.id); await load(); } },
    ]);
  };

  if (!carteira) return <ScreenContainer><View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><Text style={{ color: colors.muted }}>Carregando...</Text></View></ScreenContainer>;

  const totalEntradas = movs.filter((m) => m.tipo === "entrada" || m.tipo === "transferencia_entrada").reduce((s, m) => s + m.valor, 0);
  const totalSaidas = movs.filter((m) => m.tipo === "saida" || m.tipo === "transferencia_saida").reduce((s, m) => s + m.valor, 0);

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}><MaterialIcons name="arrow-back" size={24} color={colors.foreground} /></Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>{carteira.nome}</Text>
        <Pressable onPress={() => router.push(`/carteiras/nova?id=${carteira.id}` as any)} hitSlop={10}><MaterialIcons name="edit" size={22} color={colors.primary} /></Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
          <View style={[styles.heroCard, { backgroundColor: carteira.cor }]}>
            <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 11, fontWeight: "800" }}>SALDO ATUAL</Text>
            <Text style={{ color: "#fff", fontSize: 36, fontWeight: "900" }}>{fmtBRL(carteira.saldo)}</Text>
            <View style={{ flexDirection: "row", marginTop: 10, gap: 10 }}>
              <Badge label={`${carteira.percentual}% distribuição`} />
              <Badge label={carteira.ativa ? "ATIVA" : "INATIVA"} />
            </View>
            <View style={{ flexDirection: "row", marginTop: 14, gap: 14 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 9 }}>ENTRADAS</Text>
                <Text style={{ color: "#A7F3D0", fontSize: 14, fontWeight: "800" }}>{fmtBRL(totalEntradas)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 9 }}>SAÍDAS</Text>
                <Text style={{ color: "#FCA5A5", fontSize: 14, fontWeight: "800" }}>{fmtBRL(totalSaidas)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 9 }}>MOVIMENTAÇÕES</Text>
                <Text style={{ color: "#fff", fontSize: 14, fontWeight: "800" }}>{movs.length}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Ações */}
        <View style={{ flexDirection: "row", paddingHorizontal: 16, marginTop: 12, gap: 8 }}>
          <Pressable onPress={() => setModal({ tipo: "entrada", valor: "", descricao: "" })} style={[styles.actBtn, { backgroundColor: "#10B981" }]}>
            <MaterialIcons name="add" size={16} color="#fff" /><Text style={styles.actTxt}>Entrada</Text>
          </Pressable>
          <Pressable onPress={() => setModal({ tipo: "saida", valor: "", descricao: "" })} style={[styles.actBtn, { backgroundColor: "#EF4444" }]}>
            <MaterialIcons name="remove" size={16} color="#fff" /><Text style={styles.actTxt}>Saída</Text>
          </Pressable>
          <Pressable onPress={() => router.push(`/carteiras/transferencia?origem=${carteira.id}` as any)} style={[styles.actBtn, { backgroundColor: "#1E88E5" }]}>
            <MaterialIcons name="swap-horiz" size={16} color="#fff" /><Text style={styles.actTxt}>Transferir</Text>
          </Pressable>
        </View>

        {/* Extrato */}
        <View style={{ paddingHorizontal: 16, marginTop: 18 }}>
          <Text style={{ color: colors.foreground, fontWeight: "900", fontSize: 13, marginBottom: 8 }}>📜 EXTRATO ({movs.length})</Text>
          {movs.length === 0 ? (
            <Text style={{ color: colors.muted, textAlign: "center", paddingVertical: 30, fontSize: 12 }}>Nenhuma movimentação ainda.</Text>
          ) : (
            movs.map((m) => {
              const isEntrada = m.tipo === "entrada" || m.tipo === "transferencia_entrada";
              return (
                <View key={m.id} style={[styles.movCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: isEntrada ? "#D1FAE5" : "#FEE2E2", alignItems: "center", justifyContent: "center" }}>
                    <MaterialIcons name={isEntrada ? "arrow-downward" : "arrow-upward"} size={16} color={isEntrada ? "#065F46" : "#991B1B"} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 12 }} numberOfLines={1}>{m.descricao}</Text>
                    <Text style={{ color: colors.muted, fontSize: 10 }}>{fmtDt(m.data)}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ color: isEntrada ? "#10B981" : "#EF4444", fontWeight: "900", fontSize: 13 }}>
                      {isEntrada ? "+" : "-"}{fmtBRL(m.valor)}
                    </Text>
                    <Text style={{ color: colors.muted, fontSize: 9 }}>Saldo: {fmtBRL(m.saldoApos)}</Text>
                  </View>
                  <Pressable onPress={() => remover(m)} hitSlop={6} style={{ marginLeft: 6, padding: 4 }}>
                    <MaterialIcons name="close" size={14} color={colors.muted} />
                  </Pressable>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Modal de lançamento */}
      <Modal visible={!!modal} animationType="slide" transparent onRequestClose={() => setModal(null)}>
        <Pressable onPress={() => setModal(null)} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <Pressable onPress={(e) => e.stopPropagation()} style={{ backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
            <Text style={{ color: colors.foreground, fontWeight: "900", fontSize: 16, marginBottom: 14 }}>
              {modal?.tipo === "entrada" ? "➕ Lançar Entrada" : modal?.tipo === "saida" ? "➖ Lançar Saída" : "Ajustar Saldo"}
            </Text>
            <TextInput value={modal?.valor || ""} onChangeText={(v) => setModal((p) => p && ({ ...p, valor: v }))} keyboardType="decimal-pad" placeholder="Valor (R$)" placeholderTextColor="#94A3B8" style={styles.input} />
            <TextInput value={modal?.descricao || ""} onChangeText={(v) => setModal((p) => p && ({ ...p, descricao: v }))} placeholder="Descrição" placeholderTextColor="#94A3B8" style={[styles.input, { marginTop: 10 }]} />
            <Pressable onPress={submitMov} style={{ backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 10, alignItems: "center", marginTop: 14 }}>
              <Text style={{ color: "#fff", fontWeight: "900" }}>CONFIRMAR</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

function Badge({ label }: { label: string }) {
  return <View style={{ backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}><Text style={{ color: "#fff", fontSize: 10, fontWeight: "800" }}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  title: { flex: 1, marginHorizontal: 12, fontSize: 16, fontWeight: "900" },
  heroCard: { borderRadius: 16, padding: 18 },
  actBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: 10 },
  actTxt: { color: "#fff", fontWeight: "800", marginLeft: 4, fontSize: 12 },
  movCard: { flexDirection: "row", alignItems: "center", padding: 10, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 14, color: "#0F172A", backgroundColor: "#fff" },
});
