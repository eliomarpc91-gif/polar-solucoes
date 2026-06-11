import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Animated,
  Dimensions,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";

const { width: SCREEN_W } = Dimensions.get("window");

export interface NotifData {
  cobrancas: number;
  orcamentos: number;
  agendamentos: number;
  osAndamento: number;
}

interface Props {
  data: NotifData;
}

interface CardConfig {
  key: keyof NotifData;
  icon: string;
  color: string;
  bg: string;
  title: string;
  message: string;
  label: string;
  action: string;
  route: string;
  critical?: boolean;
}

export function NotificacoesInteligentes({ data }: Props) {
  const router = useRouter();

  const configs: CardConfig[] = [
    {
      key: "cobrancas",
      icon: "schedule",
      color: "#EF4444",
      bg: "#FEE2E2",
      title: "Cobranças\npendentes",
      message: "Existem clientes aguardando pagamento.",
      label: "Ver cobranças",
      action: "→",
      route: "/cobrancas",
      critical: true,
    },
    {
      key: "orcamentos",
      icon: "description",
      color: "#F97316",
      bg: "#FFEDD5",
      title: "Orçamentos\nem aberto",
      message: "Aguardando aprovação dos clientes.",
      label: "Ver orçamentos",
      action: "→",
      route: "/orcamentos-lista",
    },
    {
      key: "agendamentos",
      icon: "event",
      color: "#0A6EFF",
      bg: "#DBEAFE",
      title: "Agendamentos\nhoje",
      message: "Serviços programados para execução.",
      label: "Ver agenda",
      action: "→",
      route: "/agenda",
    },
    {
      key: "osAndamento",
      icon: "build",
      color: "#10B981",
      bg: "#D1FAE5",
      title: "OS em\nandamento",
      message: "Ordens de serviço aguardando conclusão.",
      label: "Ver OS",
      action: "→",
      route: "/os",
    },
  ];

  // Filtrar apenas com quantidade > 0
  const visible = configs.filter((c) => (data[c.key] || 0) > 0);

  if (visible.length === 0) return null;

  return (
    <View style={{ marginTop: 14 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10, paddingHorizontal: 2, paddingBottom: 4 }}
      >
        {visible.map((c, idx) => (
          <NotifCard
            key={c.key}
            cfg={c}
            count={data[c.key]}
            index={idx}
            onPress={() => router.push(c.route as any)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function NotifCard({
  cfg,
  count,
  index,
  onPress,
}: {
  cfg: CardConfig;
  count: number;
  index: number;
  onPress: () => void;
}) {
  const fade = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(14)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 380,
        delay: index * 90,
        useNativeDriver: true,
      }),
      Animated.timing(translate, {
        toValue: 0,
        duration: 380,
        delay: index * 90,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse no badge crítico
    if (cfg.critical) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
        ]),
      ).start();
    }
  }, []);

  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });

  return (
    <Animated.View
      style={{
        opacity: fade,
        transform: [{ translateY: translate }],
      }}
    >
      <Pressable
        onPress={onPress}
        testID={`notif-${cfg.key}`}
        style={({ pressed }) => ({
          width: 200,
          backgroundColor: "#FFFFFF",
          borderRadius: 20,
          padding: 14,
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 4 },
          elevation: 3,
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          position: "relative",
        })}
      >
        {/* Pin vermelho com pulse */}
        <View
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: "#EF4444",
            zIndex: 2,
          }}
        />
        {cfg.critical && (
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: "#EF4444",
              opacity: pulseOpacity,
              transform: [{ scale: pulseScale }],
              zIndex: 1,
            }}
          />
        )}

        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View
            style={{
              backgroundColor: cfg.color,
              width: 46,
              height: 46,
              borderRadius: 23,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: cfg.color,
              shadowOpacity: 0.35,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 3 },
              elevation: 4,
            }}
          >
            <MaterialIcons name={cfg.icon as any} size={22} color="#FFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: "#1F2937",
                fontSize: 24,
                fontWeight: "900",
                lineHeight: 26,
              }}
            >
              {count}
            </Text>
            <Text
              style={{
                color: "#1F2937",
                fontSize: 11,
                fontWeight: "700",
                lineHeight: 13,
              }}
            >
              {cfg.title}
            </Text>
          </View>
        </View>

        <Text
          style={{
            color: "#6B7280",
            fontSize: 10,
            marginTop: 8,
            lineHeight: 13,
          }}
          numberOfLines={2}
        >
          {cfg.message}
        </Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            marginTop: 8,
          }}
        >
          <Text
            style={{
              color: cfg.color,
              fontSize: 12,
              fontWeight: "800",
              letterSpacing: 0.3,
            }}
          >
            {cfg.label}
          </Text>
          <MaterialIcons name="arrow-forward" size={14} color={cfg.color} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

// Resumo compacto (chips)
export function ResumoRapido({ data }: Props) {
  const router = useRouter();
  const items = [
    { key: "cobrancas", icon: "schedule", label: "Cobranças", color: "#EF4444", route: "/cobrancas" },
    { key: "orcamentos", icon: "description", label: "Orçamentos", color: "#F97316", route: "/orcamentos-lista" },
    { key: "agendamentos", icon: "event", label: "Agendamentos", color: "#0A6EFF", route: "/agenda" },
    { key: "osAndamento", icon: "build", label: "OS", color: "#10B981", route: "/os" },
  ] as const;

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 12,
        gap: 6,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
        marginBottom: 14,
      }}
    >
      {items.map((it) => (
        <Pressable
          key={it.key}
          onPress={() => router.push(it.route as any)}
          testID={`resumo-${it.key}`}
          style={({ pressed }) => ({
            flex: 1,
            alignItems: "center",
            paddingVertical: 6,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              backgroundColor: it.color + "20",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIcons name={it.icon as any} size={16} color={it.color} />
          </View>
          <Text style={{ color: it.color, fontSize: 16, fontWeight: "900", marginTop: 4 }}>
            {(data as any)[it.key] || 0}
          </Text>
          <Text style={{ color: "#6B7280", fontSize: 9, fontWeight: "600", marginTop: 1 }}>
            {it.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
