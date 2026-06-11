import { useCallback, useState, useMemo } from "react";
import { ScrollView, Text, View, Pressable, RefreshControl, Alert, StyleSheet } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getCarteiras, getMovimentacoesCarteira, deleteCarteira, saveCarteira, Carteira, MovimentacaoCarteira, generateId } from "@/lib/store";
import { analisarCarteiras, CarteirasStats } from "@/lib/carteiras-ai";

const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function CarteirasScreen() {
  const colors = useColors();
  const router = useRouter();
  const [carteiras, setCarteiras] = useState<Carteira[]>([]);
  const [movs, setMovs] = useState<MovimentacaoCarteira[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showIA, setShowIA] = useState(true);

  const load = async () => {
    const cs = await getCarteiras();
    const ms = await getMovimentacoesCarteira();
    setCarteiras(cs);
    setMovs(ms);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const stats: CarteirasStats = useMemo(() => analisarCarteiras(carteiras, movs), [carteiras, movs]);
  const somaPctAtivas = carteiras.filter((c) => c.ativa).reduce((s, c) => s + (c.percentual || 0), 0);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const toggleAtiva = async (c: Carteira) => {
    await saveCarteira({ ...c, ativa: !c.ativa, atualizadoEm: new Date().toISOString() });
    await load();
  };

  const confirmarExcluir = (c: Carteira) => {
    Alert.alert("Excluir carteira", `Deseja excluir "${c.nome}"? O histórico de movimentações será mantido.`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: async () => { await deleteCarteira(c.id); await load(); } },
    ]);
  };

  const criarPresets = async () => {
    Alert.alert("Criar presets", "Cria 4 carteiras padrão: Operacional 40%, Pró-labore 30%, Reserva 20%, Impostos 10%.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Criar",
        onPress: async () => {
          const presets: Carteira[] = [
            { id: generateId(), nome: "Operacional", percentual: 40, saldo: 0, cor: "#1E88E5", ativa: true, criadoEm: new Date().toISOString(), atualizadoEm: new Date().toISOString() },
            { id: generateId(), nome: "Pró-labore", percentual: 30, saldo: 0, cor: "#10B981", ativa: true, criadoEm: new Date().toISOString(), atualizadoEm: new Date().toISOString() },
            { id: generateId(), nome: "Reserva", percentual: 20, saldo: 0, cor: "#8B5CF6", ativa: true, criadoEm: new Date().toISOString(), atualizadoEm: new Date().toISOString() },
            { id: generateId(), nome: "Impostos", percentual: 10, saldo: 0, cor: "#F59E0B", ativa: true, criadoEm: new Date().toISOString(), atualizadoEm: new Date().toISOString() },
          ];
          for (const p of presets) await saveCarteira(p);
          await load();
        },
      },
    ]);
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}><MaterialIcons name="arrow-back" size={24} color={colors.foreground} /></Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>💼 Carteiras Financeiras</Text>
          <Text style={{ color: colors.muted, fontSize: 11 }}>{carteiras.length} carteira(s) • Soma ativa {somaPctAtivas.toFixed(0)}%</Text>
        </View>
        <Pressable onPress={() => router.push("/carteiras/transferencia" as any)} style={{ padding: 8 }} hitSlop={6}>
          <MaterialIcons name="swap-horiz" size={22} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {/* Dashboard de saldo total */}
        <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
          <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
            <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 11, fontWeight: "700" }}>SALDO TOTAL DAS CARTEIRAS</Text>
            <Text style={{ color: "#fff", fontSize: 32, fontWeight: "900", marginTop: 4 }}>{fmtBRL(stats.saldoTotal)}</Text>
            <View style={{ flexDirection: "row", marginTop: 14, gap: 14 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 9, fontWeight: "700" }}>ENTRADAS DO MÊS</Text>
                <Text style={{ color: "#A7F3D0", fontSize: 16, fontWeight: "900" }}>{fmtBRL(stats.totalEntradasMes)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 9, fontWeight: "700" }}>SAÍDAS DO MÊS</Text>
                <Text style={{ color: "#FCA5A5", fontSize: 16, fontWeight: "900" }}>{fmtBRL(stats.totalSaidasMes)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 9, fontWeight: "700" }}>FLUXO</Text>
                <Text style={{ color: stats.fluxoLiquidoMes >= 0 ? "#A7F3D0" : "#FCA5A5", fontSize: 16, fontWeight: "900" }}>{fmtBRL(stats.fluxoLiquidoMes)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* IA Insights */}
        {stats.insights.length > 0 && (
          <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
            <Pressable onPress={() => setShowIA((s) => !s)} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <Text style={{ color: colors.foreground, fontWeight: "900", fontSize: 13 }}>🤖 IA Financeira ({stats.insights.length})</Text>
              <MaterialIcons name={showIA ? "expand-less" : "expand-more"} size={20} color={colors.muted} />
            </Pressable>
            {showIA && stats.insights.map((ins, i) => {
              const cores: any = { critico: "#FEE2E2", atencao: "#FEF3C7", info: "#DBEAFE", sucesso: "#D1FAE5" }[ins.tipo];
              const txt: any = { critico: "#991B1B", atencao: "#92400E", info: "#1E40AF", sucesso: "#065F46" }[ins.tipo];
              return (
                <View key={i} style={{ backgroundColor: cores, borderRadius: 8, padding: 10, marginBottom: 8, flexDirection: "row" }}>
                  <MaterialIcons name={ins.icone as any} size={18} color={txt} />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={{ color: txt, fontWeight: "800", fontSize: 12 }}>{ins.titulo}</Text>
                    <Text style={{ color: txt, fontSize: 11, marginTop: 2 }}>{ins.mensagem}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Botão nova carteira */}
        <View style={{ paddingHorizontal: 16, marginTop: 14, flexDirection: "row", gap: 8 }}>
          <Pressable onPress={() => router.push("/carteiras/nova" as any)} style={[styles.fab, { backgroundColor: colors.primary }]}>
            <MaterialIcons name="add" size={20} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "900", fontSize: 13, marginLeft: 6 }}>NOVA CARTEIRA</Text>
          </Pressable>
          {carteiras.length === 0 && (
            <Pressable onPress={criarPresets} style={[styles.fab, { backgroundColor: "#10B981" }]}>
              <MaterialIcons name="auto-awesome" size={20} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "900", fontSize: 13, marginLeft: 6 }}>PRESETS</Text>
            </Pressable>
          )}
        </View>

        {/* Lista de carteiras */}
        <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
          {carteiras.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <MaterialIcons name="account-balance-wallet" size={48} color={colors.muted} />
              <Text style={{ color: colors.muted, fontSize: 13, textAlign: "center", marginTop: 12, paddingHorizontal: 30 }}>
                Você ainda não tem carteiras. Crie a primeira ou use os presets sugeridos acima.
              </Text>
            </View>
          ) : (
            carteiras.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => router.push(`/carteiras/${c.id}` as any)}
                style={[styles.cardCarteira, { backgroundColor: colors.surface, borderColor: colors.border, opacity: c.ativa ? 1 : 0.55 }]}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={[styles.colorDot, { backgroundColor: c.cor }]} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text style={{ color: colors.foreground, fontWeight: "900", fontSize: 15 }}>{c.nome}</Text>
                      {!c.ativa && (
                        <View style={{ backgroundColor: "#E2E8F0", paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, marginLeft: 6 }}>
                          <Text style={{ color: "#64748B", fontSize: 9, fontWeight: "800" }}>INATIVA</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ color: colors.muted, fontSize: 11 }}>Distribuição: {c.percentual}%</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ color: c.saldo >= 0 ? "#10B981" : "#EF4444", fontWeight: "900", fontSize: 16 }}>{fmtBRL(c.saldo)}</Text>
                    {c.saldoMinimo && c.saldo < c.saldoMinimo && (
                      <Text style={{ color: "#EF4444", fontSize: 9, fontWeight: "700" }}>SALDO BAIXO</Text>
                    )}
                  </View>
                </View>
                <View style={{ flexDirection: "row", marginTop: 10, gap: 6 }}>
                  <Pressable onPress={() => toggleAtiva(c)} style={[styles.actBtn, { backgroundColor: c.ativa ? "#FEF3C7" : "#D1FAE5" }]}>
                    <MaterialIcons name={c.ativa ? "toggle-on" : "toggle-off"} size={14} color={c.ativa ? "#92400E" : "#065F46"} />
                    <Text style={{ fontSize: 10, fontWeight: "800", marginLeft: 3, color: c.ativa ? "#92400E" : "#065F46" }}>{c.ativa ? "Desativar" : "Ativar"}</Text>
                  </Pressable>
                  <Pressable onPress={() => router.push(`/carteiras/nova?id=${c.id}` as any)} style={[styles.actBtn, { backgroundColor: "#DBEAFE" }]}>
                    <MaterialIcons name="edit" size={14} color="#1E40AF" />
                    <Text style={{ fontSize: 10, fontWeight: "800", marginLeft: 3, color: "#1E40AF" }}>Editar</Text>
                  </Pressable>
                  <Pressable onPress={() => confirmarExcluir(c)} style={[styles.actBtn, { backgroundColor: "#FEE2E2" }]}>
                    <MaterialIcons name="delete" size={14} color="#991B1B" />
                    <Text style={{ fontSize: 10, fontWeight: "800", marginLeft: 3, color: "#991B1B" }}>Excluir</Text>
                  </Pressable>
                </View>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 17, fontWeight: "900" },
  heroCard: { borderRadius: 16, padding: 18 },
  fab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 12 },
  cardCarteira: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 10 },
  colorDot: { width: 36, height: 36, borderRadius: 10 },
  actBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 8, borderRadius: 8 },
});
