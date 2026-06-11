import React, { useState, useCallback, useRef } from "react";
import { FlatList, Text, View, Pressable, TextInput, Linking, Animated, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getClientes, Cliente } from "@/lib/store";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Avatar with initials and gradient background
function ClienteAvatar({ nome, color }: { nome: string; color: string }) {
  const initials = nome
    .split(" ")
    .slice(0, 2)
    .map((n) => n.charAt(0).toUpperCase())
    .join("");

  return (
    <View style={[styles.avatar, { backgroundColor: color + "15", borderColor: color + "30" }]}>
      <Text style={[styles.avatarText, { color }]}>{initials}</Text>
    </View>
  );
}

function ClienteCard({ item, onPress }: { item: Cliente; onPress: () => void }) {
  const colors = useColors();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Generate a consistent color based on name
  const colorOptions = [colors.primary, colors.accent, colors.cyan, colors.success, colors.warning];
  const colorIndex = item.nome.charCodeAt(0) % colorOptions.length;
  const avatarColor = colorOptions[colorIndex];

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => Animated.timing(scaleAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }).start()}
      onPressOut={() => Animated.timing(scaleAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start()}
    >
      <Animated.View
        style={[
          styles.clienteCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderLight,
            shadowColor: "#000",
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <ClienteAvatar nome={item.nome} color={avatarColor} />

        <View style={styles.clienteInfo}>
          <Text style={[styles.clienteName, { color: colors.foreground }]}>{item.nome}</Text>
          {item.telefone ? (
            <Text style={[styles.clientePhone, { color: colors.muted }]}>{item.telefone}</Text>
          ) : null}
          {item.cidade ? (
            <View style={styles.clienteLocation}>
              <MaterialIcons name="location-on" size={11} color={colors.muted} />
              <Text style={[styles.clienteCity, { color: colors.muted }]}>{item.cidade}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.clienteActions}>
          {item.telefone ? (
            <Pressable
              onPress={() => Linking.openURL(`tel:${item.telefone}`)}
              style={[styles.actionBtn, { backgroundColor: colors.success + "15", borderColor: colors.success + "25" }]}
            >
              <MaterialIcons name="phone" size={16} color={colors.success} />
            </Pressable>
          ) : null}
          {item.telefone ? (
            <Pressable
              onPress={() => Linking.openURL(`https://wa.me/55${item.telefone.replace(/\D/g, "")}`)}
              style={[styles.actionBtn, { backgroundColor: "#25D36615", borderColor: "#25D36625" }]}
            >
              <MaterialIcons name="chat" size={16} color="#25D366" />
            </Pressable>
          ) : null}
          <MaterialIcons name="chevron-right" size={18} color={colors.muted} />
        </View>
      </Animated.View>
    </Pressable>
  );
}

export default function ClientesScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = 62 + Math.max(insets.bottom, 10) + 24;
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [search, setSearch] = useState("");
  const headerAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      loadData();
      Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, [])
  );

  const loadData = async () => {
    const data = await getClientes();
    setClientes(data.sort((a, b) => a.nome.localeCompare(b.nome)));
  };

  const filtered = clientes.filter(
    (c) =>
      search === "" ||
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.telefone.includes(search)
  );

  const slideUp = {
    opacity: headerAnim,
    transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
  };

  return (
    <ScreenContainer className="p-0">
      {/* Header Premium */}
      <Animated.View style={[styles.header, { borderBottomColor: colors.borderLight }, slideUp]}>
        <View>
          <Text style={[styles.headerSubtitle, { color: colors.muted }]}>Base de dados</Text>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Clientes</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => router.push("/cliente/importar" as any)}
            style={[styles.headerBtn, { backgroundColor: colors.success + "15", borderColor: colors.success + "25" }]}
          >
            <MaterialIcons name="contacts" size={20} color={colors.success} />
          </Pressable>
          <Pressable
            onPress={() => router.push("/cliente/novo" as any)}
            style={[styles.addButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
          >
            <MaterialIcons name="add" size={22} color="#fff" />
          </Pressable>
        </View>
      </Animated.View>

      {/* Stats */}
      <Animated.View style={[styles.statsRow, slideUp]}>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <MaterialIcons name="people" size={18} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.primary }]}>{clientes.length}</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Total</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <MaterialIcons name="phone" size={18} color={colors.success} />
          <Text style={[styles.statValue, { color: colors.success }]}>
            {clientes.filter(c => c.telefone).length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Com telefone</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <MaterialIcons name="location-on" size={18} color={colors.accent} />
          <Text style={[styles.statValue, { color: colors.accent }]}>
            {clientes.filter(c => c.cidade).length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Com cidade</Text>
        </View>
      </Animated.View>

      {/* Search */}
      <Animated.View style={[styles.searchContainer, slideUp]}>
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <MaterialIcons name="search" size={20} color={colors.muted} />
          <TextInput
            placeholder="Buscar cliente ou telefone..."
            placeholderTextColor={colors.muted}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: colors.foreground }]}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <MaterialIcons name="close" size={18} color={colors.muted} />
            </Pressable>
          )}
        </View>
      </Animated.View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ClienteCard item={item} onPress={() => router.push(`/cliente/${item.id}` as any)} />
        )}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: tabBarHeight, gap: 10 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconWrap, { backgroundColor: colors.primary + "10" }]}>
              <MaterialIcons name="people" size={36} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {search ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
              {search ? "Tente outra busca" : "Adicione seu primeiro cliente"}
            </Text>
            {!search && (
              <Pressable
                onPress={() => router.push("/cliente/novo" as any)}
                style={[styles.emptyButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
              >
                <MaterialIcons name="add" size={16} color="#fff" />
                <Text style={styles.emptyButtonText}>Novo Cliente</Text>
              </Pressable>
            )}
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: "600",
    textAlign: "center",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
  },
  clienteCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  clienteInfo: {
    flex: 1,
    gap: 3,
  },
  clienteName: {
    fontSize: 15,
    fontWeight: "700",
  },
  clientePhone: {
    fontSize: 12,
    fontWeight: "500",
  },
  clienteLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  clienteCity: {
    fontSize: 11,
  },
  clienteActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 60,
    gap: 10,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: "center",
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});
