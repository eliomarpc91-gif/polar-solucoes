import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  Platform,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

interface NavItem {
  name: string;
  icon: string;
  label: string;
  route: string;
}

interface FloatingNavbarProps {
  activeRoute: string;
  onNavigate: (route: string) => void;
  onIAPress: () => void;
}

const NAV_ITEMS: NavItem[] = [
  { name: "home", icon: "home", label: "Home", route: "/(tabs)/index" },
  { name: "os", icon: "build", label: "OS", route: "/(tabs)/os" },
  // IA button is in the center (special)
  { name: "agenda", icon: "calendar-today", label: "Agenda", route: "/(tabs)/agenda" },
  { name: "clientes", icon: "people", label: "Clientes", route: "/(tabs)/clientes" },
];

export function FloatingNavbar({ activeRoute, onNavigate, onIAPress }: FloatingNavbarProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const iaGlowAnim = useRef(new Animated.Value(0)).current;
  const iaScaleAnim = useRef(new Animated.Value(1)).current;

  // Pulsing glow animation for IA button
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(iaGlowAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: false,
        }),
        Animated.timing(iaGlowAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: false,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const iaGlowOpacity = iaGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.9],
  });

  const iaGlowRadius = iaGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 20],
  });

  const handlePress = (route: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onNavigate(route);
  };

  const handleIAPress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    // Scale animation on press
    Animated.sequence([
      Animated.timing(iaScaleAnim, {
        toValue: 0.92,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(iaScaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    onIAPress();
  };

  const bottomPadding = Platform.OS === "web" ? 16 : Math.max(insets.bottom, 12);
  const navHeight = 64 + bottomPadding;

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: bottomPadding,
          height: navHeight,
          backgroundColor: colors.surfaceGlassStrong,
          borderTopColor: colors.borderLight,
          shadowColor: colors.primary,
        },
      ]}
    >
      {/* Left items: Home, OS */}
      <View style={styles.leftSection}>
        {NAV_ITEMS.slice(0, 2).map((item) => {
          const isActive = activeRoute.includes(item.name);
          return (
            <Pressable
              key={item.name}
              onPress={() => handlePress(item.route)}
              style={styles.navItem}
            >
              <View
                style={[
                  styles.iconContainer,
                  isActive && {
                    backgroundColor: colors.primary + "15",
                    borderRadius: 10,
                  },
                ]}
              >
                <MaterialIcons
                  name={item.icon as any}
                  size={24}
                  color={isActive ? colors.primary : colors.muted}
                />
              </View>
              <Text
                style={[
                  styles.navLabel,
                  {
                    color: isActive ? colors.primary : colors.muted,
                    fontWeight: isActive ? "700" : "500",
                  },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Center: IA Button (elevated) */}
      <View style={styles.centerSection}>
        <Animated.View
          style={[
            styles.iaGlowRing,
            {
              opacity: iaGlowOpacity,
              shadowRadius: iaGlowRadius,
              shadowColor: colors.primary,
              borderColor: colors.primary + "40",
            },
          ]}
        />
        <Animated.View style={{ transform: [{ scale: iaScaleAnim }] }}>
          <Pressable onPress={handleIAPress} style={styles.iaPressable}>
            <View
              style={[
                styles.iaButton,
                {
                  backgroundColor: colors.primary,
                  shadowColor: colors.primary,
                },
              ]}
            >
              {/* Inner glow effect */}
              <View
                style={[
                  styles.iaInnerGlow,
                  { backgroundColor: "rgba(255,255,255,0.2)" },
                ]}
              />
              <MaterialIcons name="auto-awesome" size={26} color="#fff" />
            </View>
          </Pressable>
        </Animated.View>
        <Text style={[styles.iaLabel, { color: colors.primary }]}>Jurema IA</Text>
      </View>

      {/* Right items: Agenda, Clientes */}
      <View style={styles.rightSection}>
        {NAV_ITEMS.slice(2).map((item) => {
          const isActive = activeRoute.includes(item.name);
          return (
            <Pressable
              key={item.name}
              onPress={() => handlePress(item.route)}
              style={styles.navItem}
            >
              <View
                style={[
                  styles.iconContainer,
                  isActive && {
                    backgroundColor: colors.primary + "15",
                    borderRadius: 10,
                  },
                ]}
              >
                <MaterialIcons
                  name={item.icon as any}
                  size={24}
                  color={isActive ? colors.primary : colors.muted}
                />
              </View>
              <Text
                style={[
                  styles.navLabel,
                  {
                    color: isActive ? colors.primary : colors.muted,
                    fontWeight: isActive ? "700" : "500",
                  },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "flex-start",
    paddingTop: 8,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 16,
  },
  leftSection: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  rightSection: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  centerSection: {
    width: 80,
    alignItems: "center",
    marginTop: -20,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
    gap: 2,
  },
  iconContainer: {
    width: 40,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  navLabel: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
  iaPressable: {
    alignItems: "center",
  },
  iaButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
    overflow: "hidden",
  },
  iaInnerGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    borderTopLeftRadius: 29,
    borderTopRightRadius: 29,
  },
  iaGlowRing: {
    position: "absolute",
    top: -28,
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  iaLabel: {
    fontSize: 10,
    fontWeight: "700",
    marginTop: 4,
    letterSpacing: 0.3,
  },
});
