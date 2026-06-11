import { useState, useCallback } from "react";
import { ScrollView, Text, View, Pressable, Linking, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getClientes, getOrdens, Cliente, OrdemServico } from "@/lib/store";

export default function MapaScreen() {
  const colors = useColors();
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [osAbertas, setOsAbertas] = useState<OrdemServico[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const c = await getClientes();
    const o = await getOrdens();
    setClientes(c.filter((cl) => cl.endereco));
    setOsAbertas(o.filter((os) => os.status !== "concluido"));
  };

  const navegarAteCliente = (cliente: Cliente) => {
    if (!cliente.endereco) {
      Alert.alert("Erro", "Cliente sem endereço cadastrado");
      return;
    }
    const endereco = [cliente.endereco, cliente.numero, cliente.bairro, cliente.cidade, cliente.estado]
      .filter(Boolean)
      .join(", ");
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;
    Linking.openURL(url);
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text className="text-foreground text-xl font-bold ml-4">Mapa</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {/* Serviços pendentes com endereço */}
        <Text className="text-foreground text-base font-semibold mb-3">Serviços com Endereço</Text>

        {osAbertas.length === 0 && clientes.length === 0 ? (
          <View style={{ alignItems: "center", paddingTop: 40 }}>
            <MaterialIcons name="map" size={48} color={colors.muted} />
            <Text className="text-muted text-sm mt-3 text-center">
              Nenhum serviço com endereço cadastrado.{"\n"}Cadastre endereços nos clientes para usar o mapa.
            </Text>
          </View>
        ) : (
          <>
            {osAbertas.map((os) => {
              const cliente = clientes.find((c) => c.id === os.clienteId);
              if (!cliente?.endereco) return null;
              return (
                <Pressable
                  key={os.id}
                  onPress={() => navegarAteCliente(cliente)}
                  style={({ pressed }) => [
                    {
                      backgroundColor: pressed ? colors.border : colors.surface,
                      borderRadius: 14,
                      padding: 16,
                      marginBottom: 10,
                      borderWidth: 1,
                      borderColor: colors.border,
                      flexDirection: "row",
                      alignItems: "center",
                    },
                  ]}
                >
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.primary + "15", alignItems: "center", justifyContent: "center" }}>
                    <MaterialIcons name="navigation" size={22} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text className="text-foreground font-bold text-sm">OS #{os.numero} - {cliente.nome}</Text>
                    <Text className="text-muted text-xs mt-1" numberOfLines={1}>{[cliente.endereco, cliente.numero, cliente.bairro, cliente.cidade].filter(Boolean).join(", ")}</Text>
                  </View>
                  <MaterialIcons name="directions" size={24} color={colors.primary} />
                </Pressable>
              );
            })}

            <Text className="text-foreground text-base font-semibold mb-3 mt-6">Todos os Clientes</Text>
            {clientes.map((cliente) => (
              <Pressable
                key={cliente.id}
                onPress={() => navegarAteCliente(cliente)}
                style={({ pressed }) => [
                  {
                    backgroundColor: pressed ? colors.border : colors.surface,
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                    flexDirection: "row",
                    alignItems: "center",
                  },
                ]}
              >
                <MaterialIcons name="location-on" size={20} color={colors.primary} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text className="text-foreground text-sm font-medium">{cliente.nome}</Text>
                  <Text className="text-muted text-xs mt-1" numberOfLines={1}>{[cliente.endereco, cliente.numero, cliente.bairro, cliente.cidade].filter(Boolean).join(", ")}</Text>
                </View>
                <MaterialIcons name="directions" size={20} color={colors.muted} />
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
