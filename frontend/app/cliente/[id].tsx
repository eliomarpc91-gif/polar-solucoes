import { useState, useEffect } from "react";
import { ScrollView, Text, View, Pressable, Alert, Linking } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getClientes, getOrdens, deleteCliente, getEquipamentos, Cliente, OrdemServico, Equipamento } from "@/lib/store";
import { EquipamentoQR } from "@/components/equipamento-qr";

export default function ClienteDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [osCliente, setOsCliente] = useState<OrdemServico[]>([]);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    const clientes = await getClientes();
    const found = clientes.find((c) => c.id === id);
    setCliente(found || null);

    const ordens = await getOrdens();
    setOsCliente(ordens.filter((o) => o.clienteId === id));

    const equips = await getEquipamentos();
    setEquipamentos(equips.filter((e) => e.clienteId === id));
  };

  const handleDelete = () => {
    Alert.alert("Excluir Cliente", "Tem certeza que deseja excluir este cliente?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          if (cliente) {
            await deleteCliente(cliente.id);
            router.back();
          }
        },
      },
    ]);
  };

  if (!cliente) {
    return (
      <ScreenContainer edges={["top", "left", "right", "bottom"]}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text className="text-muted">Carregando...</Text>
        </View>
      </ScreenContainer>
    );
  }

  const InfoRow = ({ icon, label, value, onPress }: { icon: string; label: string; value: string; onPress?: () => void }) => {
    if (!value) return null;
    const content = (
      <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <MaterialIcons name={icon as any} size={18} color={colors.muted} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text className="text-muted text-xs">{label}</Text>
          <Text className="text-foreground text-sm mt-0.5">{value}</Text>
        </View>
        {onPress && <MaterialIcons name="chevron-right" size={18} color={colors.muted} />}
      </View>
    );
    if (onPress) {
      return <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>{content}</Pressable>;
    }
    return content;
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
            <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
          </Pressable>
          <Text className="text-foreground text-xl font-bold ml-4">Cliente</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable onPress={() => router.push(`/cliente/editar/${cliente.id}` as any)} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
            <MaterialIcons name="edit" size={22} color={colors.primary} />
          </Pressable>
          <Pressable onPress={handleDelete} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
            <MaterialIcons name="delete" size={22} color={colors.error} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {/* Avatar & Name */}
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: colors.primary + "20",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: colors.primary, fontSize: 28, fontWeight: "bold" }}>
              {cliente.nome.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text className="text-foreground text-xl font-bold mt-3">{cliente.nome}</Text>
          {cliente.telefone && <Text className="text-muted text-sm mt-1">{cliente.telefone}</Text>}
        </View>

        {/* Quick Actions */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
          {cliente.telefone && (
            <Pressable
              onPress={() => Linking.openURL(`tel:${cliente.telefone}`)}
              style={({ pressed }) => [
                {
                  flex: 1,
                  backgroundColor: colors.success + "15",
                  borderRadius: 12,
                  padding: 14,
                  alignItems: "center",
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <MaterialIcons name="phone" size={22} color={colors.success} />
              <Text style={{ color: colors.success, fontSize: 11, fontWeight: "600", marginTop: 4 }}>Ligar</Text>
            </Pressable>
          )}
          {cliente.telefone && (
            <Pressable
              onPress={() => Linking.openURL(`https://wa.me/55${cliente.telefone.replace(/\D/g, "")}`)}
              style={({ pressed }) => [
                {
                  flex: 1,
                  backgroundColor: "#25D366" + "15",
                  borderRadius: 12,
                  padding: 14,
                  alignItems: "center",
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <MaterialIcons name="chat" size={22} color="#25D366" />
              <Text style={{ color: "#25D366", fontSize: 11, fontWeight: "600", marginTop: 4 }}>WhatsApp</Text>
            </Pressable>
          )}
          {cliente.endereco && (
            <Pressable
              onPress={() => {
                const endereco = [cliente.endereco, cliente.numero, cliente.bairro, cliente.cidade, cliente.estado]
                  .filter(Boolean)
                  .join(", ");
                Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`);
              }}
              style={({ pressed }) => [
                {
                  flex: 1,
                  backgroundColor: colors.primary + "15",
                  borderRadius: 12,
                  padding: 14,
                  alignItems: "center",
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <MaterialIcons name="navigation" size={22} color={colors.primary} />
              <Text style={{ color: colors.primary, fontSize: 11, fontWeight: "600", marginTop: 4 }}>Mapa</Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => router.push("/os/nova" as any)}
            style={({ pressed }) => [
              {
                flex: 1,
                backgroundColor: colors.warning + "15",
                borderRadius: 12,
                padding: 14,
                alignItems: "center",
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <MaterialIcons name="add-circle" size={22} color={colors.warning} />
            <Text style={{ color: colors.warning, fontSize: 11, fontWeight: "600", marginTop: 4 }}>Nova OS</Text>
          </Pressable>
        </View>

        {/* Info */}
        <View className="bg-surface rounded-xl p-4 border border-border mb-4">
          <Text className="text-muted text-xs font-semibold mb-2">INFORMAÇÕES</Text>
          <InfoRow icon="phone" label="Telefone" value={cliente.telefone} onPress={cliente.telefone ? () => Linking.openURL(`tel:${cliente.telefone}`) : undefined} />
          <InfoRow icon="email" label="Email" value={cliente.email} />
          <InfoRow icon="badge" label="CPF/CNPJ" value={cliente.cpfCnpj} />
          <InfoRow icon="location-on" label="Endereço" value={[cliente.endereco, cliente.numero, cliente.bairro, cliente.cidade, cliente.estado].filter(Boolean).join(", ")} />
          <InfoRow icon="pin-drop" label="CEP" value={cliente.cep} />
        </View>

        {/* OS do Cliente */}
        <View className="bg-surface rounded-xl p-4 border border-border">
          <Text className="text-muted text-xs font-semibold mb-3">
            ORDENS DE SERVIÇO ({osCliente.length})
          </Text>
          {osCliente.length === 0 ? (
            <Text className="text-muted text-sm text-center py-4">Nenhuma OS para este cliente</Text>
          ) : (
            osCliente.map((os) => (
              <Pressable
                key={os.id}
                onPress={() => router.push(`/os/${os.id}` as any)}
                style={({ pressed }) => [
                  {
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <View>
                  <Text className="text-foreground text-sm font-medium">OS #{os.numero}</Text>
                  <Text className="text-muted text-xs mt-0.5">
                    {new Date(os.criadoEm).toLocaleDateString("pt-BR")}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={18} color={colors.muted} />
              </Pressable>
            ))
          )}
        </View>
        {/* Equipamentos do Cliente — com QR Code */}
        <View className="bg-surface rounded-xl p-4 border border-border" style={{ marginTop: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <Text className="text-muted text-xs font-semibold">
              📦 EQUIPAMENTOS DO CLIENTE ({equipamentos.length})
            </Text>
            <Pressable
              onPress={() => router.push("/equipamento/novo" as any)}
              hitSlop={8}
            >
              <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.primary + "15", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
                <MaterialIcons name="add" size={14} color={colors.primary} />
                <Text style={{ color: colors.primary, fontSize: 11, fontWeight: "700", marginLeft: 2 }}>Novo</Text>
              </View>
            </Pressable>
          </View>

          {equipamentos.length === 0 ? (
            <Text className="text-muted text-sm text-center py-4">
              Nenhum equipamento cadastrado para este cliente
            </Text>
          ) : (
            equipamentos.map((equip) => (
              <View
                key={equip.id}
                style={{
                  backgroundColor: colors.background,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 12,
                  marginBottom: 10,
                }}
              >
                <Pressable
                  onPress={() => router.push(`/equipamento/${equip.id}` as any)}
                  style={({ pressed }) => [{ flexDirection: "row", alignItems: "center", opacity: pressed ? 0.7 : 1, marginBottom: 10 }]}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: colors.primary + "15",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <MaterialIcons name="kitchen" size={20} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text className="text-foreground text-sm font-bold" numberOfLines={1}>
                      {equip.tipo}{equip.marca ? ` • ${equip.marca}` : ""}
                    </Text>
                    <Text className="text-muted text-xs" numberOfLines={1}>
                      {[equip.modelo, equip.serie && `S/N ${equip.serie}`].filter(Boolean).join(" • ") || "Sem detalhes"}
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={18} color={colors.muted} />
                </Pressable>

                {/* QR Code anexado direto na ficha */}
                <View style={{ alignItems: "center", paddingVertical: 8, backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderColor: colors.border }}>
                  <EquipamentoQR
                    equipamento={equip}
                    clienteNome={cliente.nome}
                    size={140}
                    showActions
                  />
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
