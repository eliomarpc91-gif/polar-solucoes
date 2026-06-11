import { useCallback, useState } from "react";
import { ScrollView, Text, View, Pressable, TextInput, RefreshControl, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getEquipamentos, getClientes, Equipamento, Cliente, deleteEquipamento } from "@/lib/store";

export default function EquipamentosScreen() {
  const colors = useColors();
  const router = useRouter();
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [es, cs] = await Promise.all([getEquipamentos(), getClientes()]);
    setEquipamentos(es);
    setClientes(cs);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const clientesMap = new Map(clientes.map((c) => [c.id, c]));

  const filtrados = equipamentos.filter((e) => {
    if (!busca) return true;
    const cliente = clientesMap.get(e.clienteId);
    const blob = `${e.tipo} ${e.marca} ${e.modelo} ${e.serie} ${cliente?.nome || ""}`.toLowerCase();
    return blob.includes(busca.toLowerCase());
  });

  const confirmDelete = (e: Equipamento) => {
    Alert.alert(
      "Excluir equipamento?",
      `${e.tipo} ${e.marca} ${e.modelo}`.trim(),
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            await deleteEquipamento(e.id);
            await load();
          },
        },
      ],
    );
  };

  const iconForTipo = (tipo: string): keyof typeof MaterialIcons.glyphMap => {
    const t = (tipo || "").toLowerCase();
    if (t.includes("ar")) return "ac-unit";
    if (t.includes("gela") || t.includes("freezer")) return "kitchen";
    if (t.includes("lava")) return "local-laundry-service";
    if (t.includes("micro")) return "microwave";
    if (t.includes("câmara") || t.includes("camara")) return "warehouse";
    return "settings";
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
          </Pressable>
          <View>
            <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: "800" }}>Equipamentos</Text>
            <Text style={{ color: colors.muted, fontSize: 11 }}>{equipamentos.length} cadastrados</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable
            onPress={() => router.push("/equipamento/scanner")}
            style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 10 }}
            hitSlop={4}
          >
            <MaterialIcons name="qr-code-scanner" size={20} color={colors.foreground} />
          </Pressable>
          <Pressable
            onPress={() => router.push("/equipamento/novo")}
            style={{ backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 4 }}
          >
            <MaterialIcons name="add" size={18} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>Novo</Text>
          </Pressable>
        </View>
      </View>

      {/* Busca */}
      <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12 }}>
          <MaterialIcons name="search" size={18} color={colors.muted} />
          <TextInput
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar por cliente, tipo, marca..."
            placeholderTextColor={colors.muted}
            style={{ flex: 1, padding: 12, color: colors.foreground, fontSize: 14 }}
          />
          {!!busca && (
            <Pressable onPress={() => setBusca("")} hitSlop={8}>
              <MaterialIcons name="close" size={18} color={colors.muted} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {filtrados.length === 0 ? (
          <View style={{ alignItems: "center", padding: 32, marginTop: 40 }}>
            <MaterialIcons name="memory" size={64} color={colors.muted} />
            <Text style={{ color: colors.foreground, fontWeight: "700", marginTop: 12, fontSize: 16 }}>
              {busca ? "Nenhum equipamento encontrado" : "Nenhum equipamento cadastrado"}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4, textAlign: "center" }}>
              {busca ? "Tente outra busca" : "Cadastre os equipamentos dos seus clientes para acompanhar manutenções"}
            </Text>
            {!busca && (
              <Pressable
                onPress={() => router.push("/equipamento/novo")}
                style={{ marginTop: 20, backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 }}
              >
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>+ Cadastrar primeiro equipamento</Text>
              </Pressable>
            )}
          </View>
        ) : (
          filtrados.map((e) => {
            const cli = clientesMap.get(e.clienteId);
            return (
              <Pressable
                key={e.id}
                onPress={() => router.push(`/equipamento/${e.id}` as any)}
                onLongPress={() => confirmDelete(e)}
                style={({ pressed }) => [{
                  backgroundColor: colors.surface,
                  borderRadius: 14,
                  padding: 14,
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  opacity: pressed ? 0.7 : 1,
                }]}
              >
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary + "20", alignItems: "center", justifyContent: "center" }}>
                  <MaterialIcons name={iconForTipo(e.tipo)} size={22} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 14 }}>
                    {e.tipo || "Equipamento"}
                    {e.marca ? ` · ${e.marca}` : ""}
                    {e.modelo ? ` ${e.modelo}` : ""}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                    {cli?.nome || "Sem cliente"}
                    {e.serie ? ` · S/N ${e.serie}` : ""}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={colors.muted} />
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
