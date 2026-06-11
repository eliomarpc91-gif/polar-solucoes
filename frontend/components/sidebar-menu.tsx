import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Animated,
  StyleSheet,
  Image,
  Dimensions,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { getEmpresa, EmpresaConfig } from "@/lib/store";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SIDEBAR_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 340);

interface SidebarMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

// Quick action shortcut card
function QuickCard({
  icon,
  label,
  color,
  onPress,
  delay,
  slideAnim,
}: {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
  delay: number;
  slideAnim: Animated.Value;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const itemAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(itemAnim, {
      toValue: 1,
      duration: 280,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: itemAnim,
        transform: [
          {
            translateY: itemAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [12, 0],
            }),
          },
        ],
        flex: 1,
      }}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() =>
          Animated.timing(scaleAnim, { toValue: 0.93, duration: 80, useNativeDriver: true }).start()
        }
        onPressOut={() =>
          Animated.timing(scaleAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start()
        }
      >
        <Animated.View
          style={[
            styles.quickCard,
            {
              backgroundColor: color + "12",
              borderColor: color + "25",
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={[styles.quickCardIcon, { backgroundColor: color + "20" }]}>
            <MaterialIcons name={icon as any} size={18} color={color} />
          </View>
          <Text style={[styles.quickCardLabel, { color: "#1a2332" }]}>{label}</Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// Menu item
function MenuItem({
  icon,
  label,
  iconColor,
  onPress,
  delay,
  badge,
}: {
  icon: string;
  label: string;
  iconColor: string;
  onPress: () => void;
  delay: number;
  badge?: number;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const itemAnim = useRef(new Animated.Value(0)).current;
  const colors = useColors();

  useEffect(() => {
    Animated.timing(itemAnim, {
      toValue: 1,
      duration: 260,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: itemAnim,
        transform: [
          {
            translateX: itemAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [-16, 0],
            }),
          },
        ],
      }}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() =>
          Animated.timing(scaleAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }).start()
        }
        onPressOut={() =>
          Animated.timing(scaleAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start()
        }
      >
        <Animated.View
          style={[
            styles.menuItem,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <View style={[styles.menuItemIcon, { backgroundColor: iconColor + "15" }]}>
            <MaterialIcons name={icon as any} size={17} color={iconColor} />
          </View>
          <Text style={[styles.menuItemLabel, { color: colors.foreground }]}>{label}</Text>
          {badge !== undefined && badge > 0 ? (
            <View style={[styles.badge, { backgroundColor: colors.error }]}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : (
            <MaterialIcons name="chevron-right" size={16} color={colors.muted + "60"} />
          )}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// Section header
function SectionHeader({ title, icon, color }: { title: string; icon: string; color: string }) {
  const colors = useColors();
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionHeaderDot, { backgroundColor: color }]} />
      <Text style={[styles.sectionHeaderText, { color: colors.muted }]}>{title}</Text>
    </View>
  );
}

export function SidebarMenu({ isOpen, onClose }: SidebarMenuProps) {
  const colors = useColors();
  const router = useRouter();
  const [empresa, setEmpresa] = useState<EmpresaConfig | null>(null);

  // Animations
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      // Load empresa data
      getEmpresa().then(setEmpresa).catch(() => {});
      // Animate in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 22,
          stiffness: 200,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -SIDEBAR_WIDTH,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen]);

  const navigate = (route: string) => {
    router.push(route as any);
    onClose();
  };

  const nomeEmpresa = empresa?.nome || "Polar Soluções";
  const nomeTecnico = empresa?.tecnicoResponsavel || empresa?.nome || "Usuário";
  const inicialAvatar = nomeTecnico.charAt(0).toUpperCase();

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay with blur effect */}
      <Animated.View
        style={[
          styles.overlay,
          { opacity: overlayAnim },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
      </Animated.View>

      {/* Sidebar Panel */}
      <Animated.View
        style={[
          styles.sidebar,
          {
            width: SIDEBAR_WIDTH,
            backgroundColor: "#f8faff",
            shadowColor: "#1a2332",
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
        >
          {/* ===== HEADER ===== */}
          <View style={[styles.header, { borderBottomColor: "#e2e8f0" }]}>
            {/* Logo + Close */}
            <View style={styles.headerTop}>
              <View style={styles.logoRow}>
                <View style={[styles.logoWrap, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "25" }]}>
                  <Image
                    source={require("@/assets/images/icon.png")}
                    style={styles.logoImg}
                    resizeMode="contain"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.companyName, { color: "#1a2332" }]}>{nomeEmpresa}</Text>
                  <Text style={[styles.companySubtitle, { color: "#64748b" }]}>
                    Sistema empresarial inteligente
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={onClose}
                style={[styles.closeBtn, { backgroundColor: "#f1f5f9", borderColor: "#e2e8f0" }]}
              >
                <MaterialIcons name="close" size={18} color="#64748b" />
              </Pressable>
            </View>

            {/* Jurema IA Status */}
            <View style={[styles.iaStatusBadge, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "20" }]}>
              <View style={[styles.iaDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.iaStatusText, { color: colors.primary }]}>Jurema IA Online</Text>
              <View style={{ flex: 1 }} />
              <Text style={[styles.iaStatusSub, { color: colors.primary + "80" }]}>Ativa</Text>
            </View>
          </View>

          {/* ===== QUICK SHORTCUTS ===== */}
          <View style={styles.section}>
            <SectionHeader title="Atalhos Rápidos" icon="flash-on" color={colors.warning} />
            <View style={styles.quickGrid}>
              <QuickCard
                icon="build"
                label="Nova OS"
                color={colors.primary}
                onPress={() => navigate("/(tabs)/os")}
                delay={80}
                slideAnim={slideAnim}
              />
              <QuickCard
                icon="description"
                label="Orçamento"
                color={colors.accent || "#7c3aed"}
                onPress={() => navigate("/orcamento/novo")}
                delay={120}
                slideAnim={slideAnim}
              />
              <QuickCard
                icon="payment"
                label="PIX"
                color={colors.success}
                onPress={() => navigate("/pix-pagamentos")}
                delay={160}
                slideAnim={slideAnim}
              />
              <QuickCard
                icon="smart-toy"
                label="Análise IA"
                color={colors.cyan || "#0891b2"}
                onPress={() => navigate("/analise-ia")}
                delay={200}
                slideAnim={slideAnim}
              />
            </View>
          </View>

          {/* ===== JUREMA IA CARD ===== */}
          <View style={[styles.section]}>
            <Pressable onPress={() => navigate("/assistente-ia")}>
              <View
                style={[
                  styles.juremaCard,
                  {
                    backgroundColor: colors.primary + "08",
                    borderColor: colors.primary + "20",
                  },
                ]}
              >
                <View style={styles.juremaCardLeft}>
                  <View style={[styles.juremasphere, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
                    <MaterialIcons name="auto-awesome" size={22} color={colors.primary} />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.juremaCardTitle, { color: "#1a2332" }]}>Jurema IA</Text>
                  <Text style={[styles.juremaCardSub, { color: "#64748b" }]}>
                    Análise inteligente do negócio
                  </Text>
                  <View style={[styles.juremaOnlineBadge, { backgroundColor: colors.success + "15" }]}>
                    <View style={[styles.juremaOnlineDot, { backgroundColor: colors.success }]} />
                    <Text style={[styles.juremaOnlineText, { color: colors.success }]}>Online agora</Text>
                  </View>
                </View>
                <View style={[styles.juremaArrow, { backgroundColor: colors.primary + "15" }]}>
                  <MaterialIcons name="arrow-forward" size={16} color={colors.primary} />
                </View>
              </View>
            </Pressable>
          </View>

          {/* ===== FINANCEIRO ===== */}
          <View style={styles.section}>
            <SectionHeader title="Financeiro" icon="trending-up" color={colors.success} />
            {[
              { icon: "trending-up", label: "Fluxo de Caixa", route: "/fluxo-caixa", color: colors.success },
              { icon: "receipt", label: "Contas a Pagar", route: "/contas-pagar", color: colors.error },
              { icon: "account-balance-wallet", label: "Contas a Receber", route: "/contas-receber", color: colors.success },
              { icon: "dashboard", label: "Dashboard Financeiro", route: "/dashboard-financeiro", color: colors.primary },
              { icon: "warning", label: "Alertas Financeiros", route: "/alertas-financeiros", color: colors.warning },
              { icon: "savings", label: "Reserva Automática", route: "/reserva-automatica", color: colors.cyan || "#0891b2" },
              { icon: "bar-chart", label: "Lucratividade", route: "/lucratividade-servicos", color: colors.primary },
            ].map((item, i) => (
              <MenuItem
                key={item.label}
                icon={item.icon}
                label={item.label}
                iconColor={item.color}
                onPress={() => navigate(item.route)}
                delay={80 + i * 30}
              />
            ))}
          </View>

          {/* ===== INTELIGÊNCIA IA ===== */}
          <View style={styles.section}>
            <SectionHeader title="Inteligência IA" icon="psychology" color={colors.primary} />
            {[
              { icon: "smart-toy", label: "Análise IA", route: "/analise-ia", color: colors.primary },
              { icon: "trending-down", label: "Prejuízo Oculto", route: "/prejuizo-oculto", color: colors.error },
              { icon: "person-check", label: "Score de Cliente", route: "/score-cliente", color: colors.accent || "#7c3aed" },
              { icon: "trending-up", label: "Simulador de Expansão", route: "/simulador-expansao-novo", color: colors.success },
              { icon: "shopping-cart", label: "IA de Compras", route: "/ia-compras-estoque", color: colors.cyan || "#0891b2" },
              { icon: "warning-amber", label: "Empresa em Risco", route: "/empresa-risco", color: colors.warning },
            ].map((item, i) => (
              <MenuItem
                key={item.label}
                icon={item.icon}
                label={item.label}
                iconColor={item.color}
                onPress={() => navigate(item.route)}
                delay={80 + i * 30}
              />
            ))}
          </View>

          {/* ===== OPERACIONAL ===== */}
          <View style={styles.section}>
            <SectionHeader title="Operacional" icon="build" color={colors.warning} />
            {[
              { icon: "build", label: "Ordens de Serviço", route: "/(tabs)/os", color: colors.warning },
              { icon: "request-quote", label: "Orçamentos", route: "/orcamentos-lista", color: colors.primary },
              { icon: "calendar-today", label: "Agenda", route: "/(tabs)/agenda", color: colors.success },
              { icon: "people", label: "Clientes", route: "/(tabs)/clientes", color: colors.cyan || "#0891b2" },
              { icon: "devices", label: "Equipamentos", route: "/equipamento/novo", color: colors.muted },
              { icon: "description", label: "Contratos Mensais", route: "/contratos-mensais", color: colors.accent || "#7c3aed" },
              { icon: "schedule", label: "Plantão 24H", route: "/plantao-24h", color: colors.error },
            ].map((item, i) => (
              <MenuItem
                key={item.label}
                icon={item.icon}
                label={item.label}
                iconColor={item.color}
                onPress={() => navigate(item.route)}
                delay={80 + i * 30}
              />
            ))}
          </View>

          {/* ===== ADMINISTRATIVO ===== */}
          <View style={styles.section}>
            <SectionHeader title="Administrativo" icon="admin-panel-settings" color={colors.accent || "#7c3aed"} />
            {[
              { icon: "inventory-2", label: "Estoque", route: "/estoque", color: colors.warning },
              { icon: "verified", label: "Garantias", route: "/garantias", color: colors.success },
              { icon: "receipt", label: "Impostos", route: "/impostos", color: colors.error },
              { icon: "leaderboard", label: "Relatórios", route: "/relatorios-financeiros", color: colors.primary },
              { icon: "warning", label: "Inadimplência", route: "/inadimplencia-lista", color: colors.error },
              { icon: "attach-money", label: "Centro de Custos", route: "/centro-custos", color: colors.success },
            ].map((item, i) => (
              <MenuItem
                key={item.label}
                icon={item.icon}
                label={item.label}
                iconColor={item.color}
                onPress={() => navigate(item.route)}
                delay={80 + i * 30}
              />
            ))}
          </View>

          {/* ===== FOOTER ===== */}
          <View style={[styles.footer, { borderTopColor: "#e2e8f0" }]}>
            {/* User info - clicável para configurações */}
            <Pressable
              onPress={() => navigate("/configuracoes")}
              style={({ pressed }) => ([
                styles.footerUser,
                {
                  backgroundColor: pressed ? "#e8f0fe" : "#f1f5f9",
                  borderRadius: 14,
                  padding: 10,
                  borderWidth: 1,
                  borderColor: "#e2e8f0",
                },
              ])}
            >
              <View style={[styles.footerAvatar, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "25" }]}>
                <Text style={[styles.footerAvatarText, { color: colors.primary }]}>
                  {inicialAvatar}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.footerName, { color: "#1a2332" }]}>{nomeTecnico}</Text>
                <Text style={[styles.footerPlan, { color: "#64748b" }]}>{nomeEmpresa}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={16} color="#94a3b8" />
            </Pressable>

            {/* Footer actions */}
            <View style={styles.footerActions}>
              <Pressable
                onPress={() => navigate("/configuracoes")}
                style={[styles.footerBtn, { backgroundColor: "#f1f5f9", borderColor: "#e2e8f0" }]}
              >
                <MaterialIcons name="settings" size={18} color="#64748b" />
                <Text style={[styles.footerBtnText, { color: "#64748b" }]}>Configurações</Text>
              </Pressable>
              <Pressable
                onPress={() => navigate("/backup")}
                style={[styles.footerBtnSmall, { backgroundColor: "#f1f5f9", borderColor: "#e2e8f0" }]}
              >
                <MaterialIcons name="cloud-upload" size={18} color="#64748b" />
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    zIndex: 99,
  },
  sidebar: {
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
    zIndex: 100,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    shadowOffset: { width: 8, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 20,
    overflow: "hidden",
    borderRightWidth: 1,
    borderRightColor: "rgba(226, 232, 240, 0.8)",
  },
  // Header
  header: {
    paddingHorizontal: 18,
    paddingTop: 52,
    paddingBottom: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  logoWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
  },
  logoImg: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  companyName: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  companySubtitle: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  iaStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  iaDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  iaStatusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  iaStatusSub: {
    fontSize: 11,
    fontWeight: "600",
  },
  // Sections
  section: {
    paddingHorizontal: 14,
    paddingTop: 16,
    gap: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 4,
    paddingBottom: 6,
    paddingTop: 2,
  },
  sectionHeaderDot: {
    width: 4,
    height: 14,
    borderRadius: 2,
  },
  sectionHeaderText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  // Quick shortcuts
  quickGrid: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  quickCard: {
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    minWidth: 70,
  },
  quickCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  quickCardLabel: {
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  // Jurema IA card
  juremaCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
  },
  juremaCardLeft: {
    alignItems: "center",
    justifyContent: "center",
  },
  juremasphere: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
  },
  juremaCardTitle: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  juremaCardSub: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
    marginBottom: 6,
  },
  juremaOnlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  juremaOnlineDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  juremaOnlineText: {
    fontSize: 10,
    fontWeight: "700",
  },
  juremaArrow: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  // Menu items
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 8,
    paddingVertical: 9,
    borderRadius: 12,
  },
  menuItemIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  menuItemLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },
  // Footer
  footer: {
    marginTop: 16,
    marginHorizontal: 14,
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  footerUser: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  footerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
  },
  footerAvatarText: {
    fontSize: 16,
    fontWeight: "800",
  },
  footerName: {
    fontSize: 13,
    fontWeight: "700",
  },
  footerPlan: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 1,
  },
  footerActions: {
    flexDirection: "row",
    gap: 8,
  },
  footerBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  footerBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
  footerBtnSmall: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
});
