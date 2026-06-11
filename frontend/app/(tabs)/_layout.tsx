import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTab } from "@/components/haptic-tab";
import { Platform, View, Animated } from "react-native";
import { useColors } from "@/hooks/use-colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRef, useEffect } from "react";

function TabIcon({
  name,
  color,
  focused,
  size = 24,
}: {
  name: any;
  color: string;
  focused: boolean;
  size?: number;
}) {
  const colors = useColors();
  const scaleAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(scaleAnim, {
      toValue: focused ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [focused]);

  return (
    <View style={{ alignItems: "center", justifyContent: "center", width: 40, height: 32 }}>
      <Animated.View
        style={{
          position: "absolute",
          width: 40,
          height: 28,
          borderRadius: 10,
          backgroundColor: colors.primary + "15",
          opacity: scaleAnim,
          transform: [{ scaleX: scaleAnim }, { scaleY: scaleAnim }],
        }}
      />
      <MaterialIcons name={name} size={size} color={color} />
    </View>
  );
}

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 14 : Math.max(insets.bottom, 10);
  const tabBarHeight = 62 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.surfaceGlassStrong,
          borderTopColor: colors.borderLight,
          borderTopWidth: 1,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 20,
          elevation: 16,
          position: "absolute" as any,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
          marginTop: 1,
          letterSpacing: 0.2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="os"
        options={{
          title: "OS",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="build" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="orcamentos"
        options={{
          title: "Orçamentos",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="description" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="clientes"
        options={{
          title: "Clientes",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="people" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="financeiro"
        options={{
          title: "Financeiro",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="attach-money" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="mais"
        options={{
          title: "Mais",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="more-horiz" color={color} focused={focused} />
          ),
        }}
      />

      {/* Telas mantidas mas escondidas do tab bar */}
      <Tabs.Screen name="agenda" options={{ href: null }} />
      <Tabs.Screen name="cobrancas" options={{ href: null }} />
      <Tabs.Screen name="fluxo-caixa" options={{ href: null }} />
    </Tabs>
  );
}
