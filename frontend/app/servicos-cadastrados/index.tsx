import { useCallback, useState } from "react";
import { ScrollView, Text, View, Pressable, Alert, StyleSheet, TextInput, Modal } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { generateId, ServicoCadastrado } from "@/lib/store";
import { schedulePush, pushDelete } from "@/lib/sync";

const KEY = "@polar/servicos_cadastrados";
const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

async function getServicos(): Promise<ServicoCadastrado[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
async function setServicos(lst: ServicoCadastrado[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(lst));
}
async function saveServico(s: ServicoCadastrado) {
  const lst = await getServicos();
  const i = lst.findIndex((x) => x.id === s.id);
  if (i >= 0) lst[i] = s;
  else lst.push(s);
  await setServicos(lst);
  try { schedulePush("servicos_cadastrados", s); } catch {}
}
async function deleteServico(id: string) {
  const lst = await getServicos();
  await setServicos(lst.filter((s) => s.id !== id));
  try { pushDelete("servicos_cadastrados", id); } catch {}
}

export default function ServicosCadastradosScreen() {
  const colors = useColors();
  const router = useRouter();
  const [lista, setLista] = useState<ServicoCadastrado[]>([]);
  const [modal, setModal] = useState<Partial<ServicoCadastrado> | null>(null);

  const load = async () => setLista(await getServicos());
  useFocusEffect(useCallback(() => { load(); }, []));

  const abrirNovo = () => setModal({ id: generateId(), nome: "", descricao: "", categoria: "", tempoEstimado: "", valorBase: 0, ativo: true });
  const abrirEditar = (s: ServicoCadastrado) => setModal({ ...s });

  const salvar = async () => {
    if (!modal?.nome?.trim()) return Alert.alert("Erro", "Nome obrigatório");
    const agora = new Date().toISOString();
    const s: ServicoCadastrado = {
      id: modal.id!,
      nome: modal.nome.trim(),
      descricao: modal.descricao?.trim() || undefined,
      categoria: modal.categoria?.trim() || undefined,
      tempoEstimado: modal.tempoEstimado?.trim() || undefined,
      valorBase: Number(modal.valorBase) || 0,
      ativo: modal.ativo !== false,
      criadoEm: (modal as any).criadoEm || agora,
      atualizadoEm: agora,
    };
    await saveServico(s);
    setModal(null);
    await load();
  };

  const excluir = (s: ServicoCadastrado) =>
    Alert.alert("Excluir serviço", `Excluir "${s.nome}"?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: async () => { await deleteServico(s.id); await load(); } },
    ]);

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}><MaterialIcons name="arrow-back" size={24} color={colors.foreground} /></Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>🛠 Serviços Cadastrados</Text>
        <Pressable onPress={abrirNovo} hitSlop={6} style={{ backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, flexDirection: "row", alignItems: "center" }}>
          <MaterialIcons name="add" size={16} color="#fff" /><Text style={{ color: "#fff", fontWeight: "800", fontSize: 12, marginLeft: 4 }}>NOVO</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {lista.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 60 }}>
            <MaterialIcons name="build-circle" size={56} color={colors.muted} />
            <Text style={{ color: colors.muted, marginTop: 12, fontSize: 13, textAlign: "center", paddingHorizontal: 30 }}>
              Nenhum serviço cadastrado ainda. Toque em "NOVO" para criar serviços reutilizáveis nos orçamentos.
            </Text>
          </View>
        ) : (
          lista.map((s) => (
            <View key={s.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, opacity: s.ativo ? 1 : 0.6 }]}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.foreground, fontWeight: "900", fontSize: 14 }}>{s.nome}</Text>
                  {s.categoria ? <Text style={{ color: colors.muted, fontSize: 10, marginTop: 2 }}>{s.categoria}{s.tempoEstimado ? ` • ${s.tempoEstimado}` : ""}</Text> : null}
                  {s.descricao ? <Text style={{ color: colors.muted, fontSize: 11, marginTop: 4 }} numberOfLines={2}>{s.descricao}</Text> : null}
                </View>
                <Text style={{ color: "#10B981", fontWeight: "900", fontSize: 15 }}>{fmtBRL(s.valorBase)}</Text>
              </View>
              <View style={{ flexDirection: "row", gap: 6, marginTop: 10 }}>
                <Pressable onPress={() => abrirEditar(s)} style={{ flex: 1, backgroundColor: "#DBEAFE", padding: 8, borderRadius: 8, alignItems: "center", flexDirection: "row", justifyContent: "center" }}>
                  <MaterialIcons name="edit" size={14} color="#1E40AF" /><Text style={{ color: "#1E40AF", fontWeight: "800", marginLeft: 4, fontSize: 11 }}>Editar</Text>
                </Pressable>
                <Pressable onPress={() => excluir(s)} style={{ flex: 1, backgroundColor: "#FEE2E2", padding: 8, borderRadius: 8, alignItems: "center", flexDirection: "row", justifyContent: "center" }}>
                  <MaterialIcons name="delete" size={14} color="#991B1B" /><Text style={{ color: "#991B1B", fontWeight: "800", marginLeft: 4, fontSize: 11 }}>Excluir</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={!!modal} animationType="slide" transparent onRequestClose={() => setModal(null)}>
        <Pressable onPress={() => setModal(null)} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <Pressable onPress={(e) => e.stopPropagation()} style={{ backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, maxHeight: "90%" }}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={{ color: colors.foreground, fontWeight: "900", fontSize: 16, marginBottom: 14 }}>{(modal as any)?.criadoEm ? "Editar Serviço" : "Novo Serviço"}</Text>
              <Text style={styles.lbl}>Nome do serviço *</Text>
              <TextInput value={modal?.nome || ""} onChangeText={(v) => setModal((p: any) => ({ ...p, nome: v }))} placeholder="Ex: Manutenção Preventiva" placeholderTextColor="#94A3B8" style={styles.input} />
              <Text style={styles.lbl}>Descrição (opcional)</Text>
              <TextInput value={modal?.descricao || ""} onChangeText={(v) => setModal((p: any) => ({ ...p, descricao: v }))} placeholder="Etapas, procedimentos..." placeholderTextColor="#94A3B8" multiline style={[styles.input, { minHeight: 70, textAlignVertical: "top" }]} />
              <View style={{ flexDirection: "row", gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lbl}>Categoria</Text>
                  <TextInput value={modal?.categoria || ""} onChangeText={(v) => setModal((p: any) => ({ ...p, categoria: v }))} placeholder="Refrigeração" placeholderTextColor="#94A3B8" style={styles.input} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lbl}>Tempo estimado</Text>
                  <TextInput value={modal?.tempoEstimado || ""} onChangeText={(v) => setModal((p: any) => ({ ...p, tempoEstimado: v }))} placeholder="2h" placeholderTextColor="#94A3B8" style={styles.input} />
                </View>
              </View>
              <Text style={styles.lbl}>Valor base (R$) *</Text>
              <TextInput value={String(modal?.valorBase ?? "")} onChangeText={(v) => setModal((p: any) => ({ ...p, valorBase: Number(v.replace(",", ".")) || 0 }))} keyboardType="decimal-pad" placeholder="0,00" placeholderTextColor="#94A3B8" style={styles.input} />
              <Pressable onPress={salvar} style={{ backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 10, alignItems: "center", marginTop: 14 }}>
                <Text style={{ color: "#fff", fontWeight: "900" }}>SALVAR</Text>
              </Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  title: { flex: 1, marginHorizontal: 12, fontSize: 16, fontWeight: "900" },
  card: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 10 },
  lbl: { color: "#64748B", fontSize: 11, fontWeight: "800", marginTop: 10, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#0F172A", backgroundColor: "#fff" },
});
