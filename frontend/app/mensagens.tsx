import { View, Text, ScrollView, Pressable, FlatList } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";

interface Mensagem {
  id: string;
  cliente: string;
  mensagem: string;
  hora: string;
  naoLida: boolean;
  avatar: any;
}

export default function MensagensScreen() {
  const colors = useColors();
  const router = useRouter();

  const MENSAGENS: Mensagem[] = [];
  const naoLidas = MENSAGENS.filter((m) => m.naoLida).length;

  return (
    <ScreenContainer className="p-0">
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Pressable onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.foreground }}>
            Mensagens
          </Text>
          {naoLidas > 0 && (
            <View
              style={{
                backgroundColor: colors.primary,
                borderRadius: 10,
                paddingHorizontal: 8,
                paddingVertical: 2,
                marginLeft: 8,
              }}
            >
              <Text style={{ color: "white", fontSize: 10, fontWeight: "bold" }}>
                {naoLidas}
              </Text>
            </View>
          )}
        </View>
        <Pressable>
          <MaterialIcons name="search" size={24} color={colors.primary} />
        </Pressable>
      </View>

      {/* Lista de Mensagens */}
      <FlatList
        data={MENSAGENS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => ({
              backgroundColor: item.naoLida
                ? colors.surface
                : pressed
                  ? colors.surface
                  : colors.background,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            })}
          >
            {/* Avatar */}
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: colors.primary,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <MaterialIcons name={item.avatar} size={24} color="white" />
            </View>

            {/* Conteúdo */}
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: item.naoLida ? "bold" : "600",
                    color: colors.foreground,
                  }}
                >
                  {item.cliente}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.muted,
                  }}
                >
                  {item.hora}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 13,
                  color: colors.muted,
                  marginTop: 4,
                  fontWeight: item.naoLida ? "500" : "400",
                }}
                numberOfLines={1}
              >
                {item.mensagem}
              </Text>
            </View>

            {/* Indicador não lido */}
            {item.naoLida && (
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: colors.primary,
                }}
              />
            )}
          </Pressable>
        )}
        ListEmptyComponent={
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingVertical: 60,
            }}
          >
            <MaterialIcons name="mail-outline" size={48} color={colors.muted} style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 4 }}>
              Nenhuma mensagem
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted, textAlign: "center", paddingHorizontal: 24 }}>
              Suas mensagens com clientes aparecerão aqui
            </Text>
          </View>
        }
        scrollEnabled={true}
        contentContainerStyle={{ flexGrow: 1 }}
      />
    </ScreenContainer>
  );
}
