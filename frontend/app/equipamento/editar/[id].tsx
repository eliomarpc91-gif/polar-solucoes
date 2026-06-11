import { useEffect, useState } from "react";
import { ScrollView, Text, View, Pressable, TextInput, Alert, Image, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as ImagePicker from "expo-image-picker";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getEquipamentos, saveEquipamento, Equipamento, EquipamentoStatusOperacional } from "@/lib/store";

const STATUS_OPCOES: { k: EquipamentoStatusOperacional; label: string; color: string }[] = [
  { k: "ativo", label: "Ativo", color: "#10B981" },
  { k: "manutencao", label: "Em manutenção", color: "#F59E0B" },
  { k: "inativo", label: "Inativo", color: "#6B7280" },
];

const TIPOS = ["Freezer", "Câmara Fria", "Geladeira", "Balcão Refrigerado", "Ar Condicionado", "Expositor", "Outro"];

export default function EditarEquipamentoScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [equip, setEquip] = useState<Equipamento | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const equips = await getEquipamentos();
      const found = equips.find((e) => e.id === id);
      if (!found) {
        Alert.alert("Erro", "Equipamento não encontrado");
        router.back();
        return;
      }
      setEquip({ ...found, fotos: found.fotos || [], infoTecnica: found.infoTecnica || {} });
    })();
  }, [id]);

  const upd = (patch: Partial<Equipamento>) => {
    setEquip((prev) => (prev ? { ...prev, ...patch } : prev));
  };
  const updTec = (patch: any) => {
    setEquip((prev) => (prev ? { ...prev, infoTecnica: { ...(prev.infoTecnica || {}), ...patch } } : prev));
  };

  const adicionarFoto = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permissão negada", "Conceda acesso às fotos para anexar imagens.");
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.6,
        base64: true,
        allowsEditing: false,
      });
      if (res.canceled || !res.assets || res.assets.length === 0) return;
      const base64 = res.assets[0].base64;
      if (!base64) return;
      const dataUri = `data:image/jpeg;base64,${base64}`;
      upd({ fotos: [...(equip?.fotos || []), dataUri] });
    } catch (e: any) {
      Alert.alert("Erro", e?.message || "Falha ao anexar foto");
    }
  };

  const tirarFoto = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permissão negada", "Conceda acesso à câmera.");
        return;
      }
      const res = await ImagePicker.launchCameraAsync({ quality: 0.6, base64: true });
      if (res.canceled || !res.assets || res.assets.length === 0) return;
      const base64 = res.assets[0].base64;
      if (!base64) return;
      upd({ fotos: [...(equip?.fotos || []), `data:image/jpeg;base64,${base64}`] });
    } catch (e: any) {
      Alert.alert("Erro", e?.message || "Falha");
    }
  };

  const removerFoto = (idx: number) => {
    upd({ fotos: (equip?.fotos || []).filter((_, i) => i !== idx) });
  };

  const salvar = async () => {
    if (!equip) return;
    setLoading(true);
    try {
      await saveEquipamento(equip);
      Alert.alert("✓", "Equipamento atualizado", [{ text: "OK", onPress: () => router.back() }]);
    } catch (e: any) {
      Alert.alert("Erro", e?.message || "Falha ao salvar");
    } finally {
      setLoading(false);
    }
  };

  if (!equip) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: colors.muted }}>Carregando...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Editar Equipamento</Text>
        <Pressable
          onPress={salvar}
          disabled={loading}
          style={{ backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 }}
        >
          <Text style={{ color: "#fff", fontWeight: "800", fontSize: 12 }}>{loading ? "..." : "SALVAR"}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        {/* IDENTIFICAÇÃO */}
        <Card title="🆔 Identificação" colors={colors}>
          <Field label="Código interno" value={equip.codigoInterno || ""} onChangeText={(v) => upd({ codigoInterno: v })} placeholder="EQ-0001" />
          <Field label="Nome / Apelido" value={equip.nome || ""} onChangeText={(v) => upd({ nome: v })} placeholder="Ex: Câmara frigorífica do salão" />
          <Picker
            label="Tipo"
            value={equip.tipo}
            options={TIPOS}
            onChange={(v) => upd({ tipo: v })}
          />
          <Field label="Marca" value={equip.marca} onChangeText={(v) => upd({ marca: v })} />
          <Field label="Modelo" value={equip.modelo} onChangeText={(v) => upd({ modelo: v })} />
          <Field label="Nº Série" value={equip.serie} onChangeText={(v) => upd({ serie: v })} />
          <Field label="Local de instalação" value={equip.localInstalacao || ""} onChangeText={(v) => upd({ localInstalacao: v })} placeholder="Ex: Cozinha, Estoque 2..." />

          <Text style={[styles.label, { color: colors.muted }]}>Status Operacional</Text>
          <View style={{ flexDirection: "row", gap: 6, marginBottom: 10 }}>
            {STATUS_OPCOES.map((s) => {
              const active = equip.statusOperacional === s.k;
              return (
                <Pressable
                  key={s.k}
                  onPress={() => upd({ statusOperacional: s.k })}
                  style={[
                    styles.statusBtn,
                    { backgroundColor: active ? s.color : "transparent", borderColor: s.color },
                  ]}
                >
                  <Text style={{ color: active ? "#fff" : s.color, fontWeight: "800", fontSize: 11 }}>{s.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* INFO TÉCNICA */}
        <Card title="⚙️ Informações Técnicas" colors={colors}>
          <Field label="Tipo de gás" value={equip.infoTecnica?.tipoGas || ""} onChangeText={(v) => updTec({ tipoGas: v })} placeholder="R-410A, R-22, R-134a..." />
          <Field label="Quantidade de gás" value={equip.infoTecnica?.qtdGas || ""} onChangeText={(v) => updTec({ qtdGas: v })} placeholder="Ex: 1,2kg" />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Field label="Tensão" value={equip.infoTecnica?.tensao || ""} onChangeText={(v) => updTec({ tensao: v })} placeholder="220V" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Corrente" value={equip.infoTecnica?.corrente || ""} onChangeText={(v) => updTec({ corrente: v })} placeholder="5A" />
            </View>
          </View>
          <Field label="Potência" value={equip.infoTecnica?.potencia || ""} onChangeText={(v) => updTec({ potencia: v })} placeholder="1,5cv" />
          <Field label="Compressor instalado" value={equip.infoTecnica?.compressor || ""} onChangeText={(v) => updTec({ compressor: v })} placeholder="Embraco EMI60..." />
          <Field
            label="Observações técnicas"
            value={equip.infoTecnica?.obsTecnicas || ""}
            onChangeText={(v) => updTec({ obsTecnicas: v })}
            multiline
            placeholder="Particularidades do equipamento, recomendações..."
          />
        </Card>

        {/* FOTOS */}
        <Card title="📷 Fotos" colors={colors}>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
            <Pressable onPress={tirarFoto} style={[styles.fotoBtn, { backgroundColor: colors.primary }]}>
              <MaterialIcons name="photo-camera" size={18} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: 12, marginLeft: 4 }}>Câmera</Text>
            </Pressable>
            <Pressable onPress={adicionarFoto} style={[styles.fotoBtn, { backgroundColor: "#1E88E5" }]}>
              <MaterialIcons name="photo-library" size={18} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: 12, marginLeft: 4 }}>Galeria</Text>
            </Pressable>
          </View>
          {(equip.fotos || []).length === 0 ? (
            <Text style={{ color: colors.muted, fontSize: 12, textAlign: "center", paddingVertical: 12 }}>
              Nenhuma foto. Toque acima para adicionar.
            </Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {(equip.fotos || []).map((foto, idx) => (
                <View key={idx} style={{ position: "relative" }}>
                  <Image source={{ uri: foto }} style={{ width: 100, height: 100, borderRadius: 10, borderWidth: 1, borderColor: colors.border }} />
                  <Pressable
                    onPress={() => removerFoto(idx)}
                    style={styles.fotoRemoverBtn}
                    hitSlop={8}
                  >
                    <MaterialIcons name="close" size={14} color="#fff" />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          )}
        </Card>

        {/* OBSERVAÇÕES */}
        <Card title="📝 Observações gerais" colors={colors}>
          <TextInput
            value={equip.observacoes}
            onChangeText={(v) => upd({ observacoes: v })}
            multiline
            placeholder="Informações adicionais..."
            placeholderTextColor={colors.muted}
            style={[styles.input, { minHeight: 80, color: colors.foreground, borderColor: colors.border, textAlignVertical: "top" }]}
          />
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
}

// ─── COMPONENTES INTERNOS ─────────────────────────────────────────────
function Card({ title, colors, children }: any) {
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.cardTitle, { color: colors.foreground }]}>{title}</Text>
      {children}
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder, multiline }: any) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        multiline={multiline}
        style={[styles.input, multiline && { minHeight: 60, textAlignVertical: "top" }]}
      />
    </View>
  );
}

function Picker({ label, value, options, onChange }: any) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {options.map((opt: string) => {
          const active = value === opt;
          return (
            <Pressable
              key={opt}
              onPress={() => onChange(opt)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 16,
                backgroundColor: active ? "#0D3B66" : "#F1F5F9",
              }}
            >
              <Text style={{ color: active ? "#fff" : "#475569", fontWeight: "700", fontSize: 11 }}>{opt}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  headerTitle: { flex: 1, marginHorizontal: 12, fontSize: 16, fontWeight: "900" },
  card: { borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 12 },
  cardTitle: { fontSize: 13, fontWeight: "900", marginBottom: 12 },
  label: { fontSize: 11, fontWeight: "700", color: "#64748B", marginBottom: 4, marginTop: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: "#0F172A",
    backgroundColor: "#fff",
  },
  statusBtn: { flex: 1, borderWidth: 1, borderRadius: 8, paddingVertical: 8, alignItems: "center" },
  fotoBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 10 },
  fotoRemoverBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#EF4444",
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
});
