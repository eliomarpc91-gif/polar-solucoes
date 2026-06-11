import React, { useState, useCallback, useRef } from "react";
import { FlatList, Text, View, Pressable, TextInput, Animated, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getOrdens, OrdemServico, OSStatus } from "@/lib/store";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const STATUS_FILTERS: { label: string; value: OSStatus | "todos" }[] = [
  { label: "Todos", value: "todos" },
  { label: "Aberto", value: "aberto" },
  { label: "Andamento", value: "em_andamento" },
  { label: "Pendente", value: "pendente" },
  { label: "Concluído", value: "concluido" },
];

function OSCard({ item, onPress }: { item: OrdemServico; onPress: () => void }) {
  const colors = useColors();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const statusColor = (status: string) => {
    switch (status) {
      case "aberto": return colors.primary;
      case "em_andamento": return colors.warning;
      case "concluido": return colors.success;
      case "pendente": return colors.error;
      default: return colors.muted;
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "aberto": return "Aberto";
      case "em_andamento": return "Em andamento";
      case "concluido": return "Concluído";
      case "pendente": return "Pendente";
      default: return status;
    }
  };

  const color = statusColor(item.status);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => Animated.timing(scaleAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }).start()}
      onPressOut={() => Animated.timing(scaleAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start()}
    >
      <Animated.View
        style={[
          styles.osCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderLight,
            borderLeftColor: color,
            shadowColor: "#000",
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.osCardHeader}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={[styles.osNumberBadge, { backgroundColor: color + "15" }]}>
                <Text style={[styles.osNumber, { color }]}>#{item.numero}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: color + "15", borderColor: color + "30" }]}>
                <View style={[styles.statusDot, { backgroundColor: color }]} />
                <Text style={[styles.statusText, { color }]}>{statusLabel(item.status)}</Text>
              </View>
            </View>
            <Text style={[styles.clienteName, { color: colors.foreground }]}>{item.clienteNome}</Text>
            {item.problema ? (
              <Text style={[styles.problemaText, { color: colors.muted }]} numberOfLines={1}>
                {item.problema}
              </Text>
            ) : null}
          </View>
          <View style={{ alignItems: "flex-end", gap: 6 }}>
            {item.valorTotal > 0 && (
              <Text style={[styles.valorText, { color: colors.success }]}>
                R$ {item.valorTotal.toFixed(2)}
              </Text>
            )}
            <Text style={[styles.dateText, { color: colors.muted }]}>
              {new Date(item.criadoEm).toLocaleDateString("pt-BR")}
            </Text>
            <MaterialIcons name="chevron-right" size={18} color={colors.muted} />
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export default function OSScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = 62 + Math.max(insets.bottom, 10) + 24;
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OSStatus | "todos">("todos");
  const headerAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      loadData();
      Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, [])
  );

  const loadData = async () => {
    const data = await getOrdens();
    setOrdens(data.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)));
  };

  const filtered = ordens.filter((os) => {
    const matchSearch =
      search === "" ||
      os.clienteNome.toLowerCase().includes(search.toLowerCase()) ||
      os.numero.toString().includes(search);
    const matchStatus = statusFilter === "todos" || os.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const slideUp = {
    opacity: headerAnim,
    transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
  };

  return (
    <ScreenContainer className="p-0">
      {/* Header Premium */}
      <Animated.View style={[styles.header, { borderBottomColor: colors.borderLight }, slideUp]}>
        <View>
          <Text style={[styles.headerSubtitle, { color: colors.muted }]}>Gerenciamento</Text>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Ordens de Serviço</Text>
        </View>
        <Pressable
          onPress={() => router.push("/os/nova" as any)}
          style={[styles.addButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
        >
          <MaterialIcons name="add" size={22} color="#fff" />
        </Pressable>
      </Animated.View>

      {/* Stats Row */}
      <Animated.View style={[styles.statsRow, slideUp]}>
        {[
          { label: "Total", value: ordens.length, color: colors.primary },
          { label: "Abertos", value: ordens.filter(o => o.status === "aberto").length, color: colors.primary },
          { label: "Andamento", value: ordens.filter(o => o.status === "em_andamento").length, color: colors.warning },
          { label: "Concluídos", value: ordens.filter(o => o.status === "concluido").length, color: colors.success },
        ].map((stat) => (
          <View
            key={stat.label}
            style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
          >
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>{stat.label}</Text>
          </View>
        ))}
      </Animated.View>

      {/* Search */}
      <Animated.View style={[styles.searchContainer, slideUp]}>
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <MaterialIcons name="search" size={20} color={colors.muted} />
          <TextInput
            placeholder="Buscar por cliente ou número..."
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

      {/* Status Filters */}
      <Animated.View style={[slideUp]}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_FILTERS}
          keyExtractor={(item) => item.value}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, gap: 8 }}
          renderItem={({ item }) => {
            const isActive = statusFilter === item.value;
            return (
              <Pressable onPress={() => setStatusFilter(item.value)}>
                <View
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isActive ? colors.primary : colors.surface,
                      borderColor: isActive ? colors.primary : colors.borderLight,
                      shadowColor: isActive ? colors.primary : "transparent",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: isActive ? "#fff" : colors.muted },
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />
      </Animated.View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <OSCard item={item} onPress={() => router.push(`/os/${item.id}` as any)} />
        )}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: tabBarHeight, gap: 10 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconWrap, { backgroundColor: colors.primary + "10" }]}>
              <MaterialIcons name="build" size={36} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Nenhuma OS encontrada</Text>
            <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
              Crie sua primeira ordem de serviço
            </Text>
            <Pressable
              onPress={() => router.push("/os/nova" as any)}
              style={[styles.emptyButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
            >
              <MaterialIcons name="add" size={16} color="#fff" />
              <Text style={styles.emptyButtonText}>Criar Nova OS</Text>
            </Pressable>
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
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    gap: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 0.2,
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
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  osCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderLeftWidth: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  osCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  osNumberBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  osNumber: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },
  clienteName: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 6,
  },
  problemaText: {
    fontSize: 12,
    marginTop: 3,
  },
  valorText: {
    fontSize: 14,
    fontWeight: "800",
  },
  dateText: {
    fontSize: 10,
    fontWeight: "500",
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
