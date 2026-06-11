import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  StyleSheet,
  Platform,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

interface JuremaHologramProps {
  onPress?: () => void;
  suggestion?: string;
  compact?: boolean;
}

/**
 * Jurema IA Hologram - Centro Visual do App
 * 
 * Características:
 * - Esfera holográfica com glow azul premium
 * - Animação pulsante em múltiplas camadas
 * - Partículas orbitando (simuladas com Views)
 * - Sugestão da IA exibida dinamicamente
 * - Visual futurista e tecnológico
 */
export function JuremaHologram({ onPress, suggestion, compact = false }: JuremaHologramProps) {
  const colors = useColors();

  // Animações
  const pulse1 = useRef(new Animated.Value(1)).current;
  const pulse2 = useRef(new Animated.Value(1)).current;
  const pulse3 = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.5)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const particle1 = useRef(new Animated.Value(0)).current;
  const particle2 = useRef(new Animated.Value(0)).current;
  const particle3 = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse rings
    const pulsing = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse1, { toValue: 1.3, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulse1, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    );

    const pulsing2 = Animated.loop(
      Animated.sequence([
        Animated.delay(600),
        Animated.timing(pulse2, { toValue: 1.5, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulse2, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    );

    const pulsing3 = Animated.loop(
      Animated.sequence([
        Animated.delay(1200),
        Animated.timing(pulse3, { toValue: 1.7, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulse3, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    );

    // Glow breathing
    const glowing = Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, { toValue: 0.9, duration: 1500, useNativeDriver: false }),
        Animated.timing(glowOpacity, { toValue: 0.4, duration: 1500, useNativeDriver: false }),
      ])
    );

    // Particle orbits (vertical oscillation to simulate orbit)
    const p1 = Animated.loop(
      Animated.sequence([
        Animated.timing(particle1, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(particle1, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    );
    const p2 = Animated.loop(
      Animated.sequence([
        Animated.delay(1000),
        Animated.timing(particle2, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(particle2, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    );
    const p3 = Animated.loop(
      Animated.sequence([
        Animated.delay(2000),
        Animated.timing(particle3, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(particle3, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    );

    // Text fade in
    Animated.timing(textOpacity, { toValue: 1, duration: 800, useNativeDriver: true }).start();

    pulsing.start();
    pulsing2.start();
    pulsing3.start();
    glowing.start();
    p1.start();
    p2.start();
    p3.start();

    return () => {
      pulsing.stop();
      pulsing2.stop();
      pulsing3.stop();
      glowing.stop();
      p1.stop();
      p2.stop();
      p3.stop();
    };
  }, []);

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress?.();
  };

  const sphereSize = compact ? 64 : 88;
  const containerSize = compact ? 120 : 160;

  const p1Y = particle1.interpolate({ inputRange: [0, 1], outputRange: [-20, 20] });
  const p2Y = particle2.interpolate({ inputRange: [0, 1], outputRange: [20, -20] });
  const p3Y = particle3.interpolate({ inputRange: [0, 1], outputRange: [-10, 10] });

  return (
    <Pressable onPress={handlePress}>
      <View style={[styles.wrapper, compact && styles.wrapperCompact]}>
        {/* Outer glow rings */}
        <Animated.View
          style={[
            styles.pulseRing,
            {
              width: containerSize,
              height: containerSize,
              borderRadius: containerSize / 2,
              borderColor: colors.primary + "20",
              transform: [{ scale: pulse3 }],
              opacity: 0.3,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.pulseRing,
            {
              width: containerSize * 0.8,
              height: containerSize * 0.8,
              borderRadius: (containerSize * 0.8) / 2,
              borderColor: colors.primary + "35",
              transform: [{ scale: pulse2 }],
              opacity: 0.5,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.pulseRing,
            {
              width: containerSize * 0.65,
              height: containerSize * 0.65,
              borderRadius: (containerSize * 0.65) / 2,
              borderColor: colors.primary + "50",
              transform: [{ scale: pulse1 }],
              opacity: 0.7,
            },
          ]}
        />

        {/* Particles */}
        <Animated.View
          style={[
            styles.particle,
            {
              backgroundColor: colors.cyan,
              top: containerSize * 0.15,
              right: containerSize * 0.1,
              transform: [{ translateY: p1Y }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.particle,
            {
              backgroundColor: colors.primary,
              bottom: containerSize * 0.2,
              left: containerSize * 0.1,
              width: 5,
              height: 5,
              borderRadius: 2.5,
              transform: [{ translateY: p2Y }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.particle,
            {
              backgroundColor: colors.accent,
              top: containerSize * 0.35,
              left: containerSize * 0.05,
              width: 4,
              height: 4,
              borderRadius: 2,
              transform: [{ translateY: p3Y }],
            },
          ]}
        />

        {/* Sphere */}
        <Animated.View
          style={[
            styles.glowShadow,
            {
              width: sphereSize + 20,
              height: sphereSize + 20,
              borderRadius: (sphereSize + 20) / 2,
              backgroundColor: colors.primary,
              opacity: glowOpacity,
              shadowColor: colors.primary,
            },
          ]}
        />
        <View
          style={[
            styles.sphere,
            {
              width: sphereSize,
              height: sphereSize,
              borderRadius: sphereSize / 2,
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
            },
          ]}
        >
          {/* Inner highlight */}
          <View style={styles.sphereHighlight} />
          {/* Icon */}
          <MaterialIcons name="auto-awesome" size={compact ? 28 : 36} color="#fff" />
        </View>

        {/* Text below */}
        {!compact && (
          <Animated.View style={[styles.textContainer, { opacity: textOpacity }]}>
            <Text style={[styles.iaTitle, { color: colors.primary }]}>Jurema IA</Text>
            {suggestion ? (
              <Text style={[styles.iaSuggestion, { color: colors.muted }]} numberOfLines={2}>
                {suggestion}
              </Text>
            ) : (
              <View style={[styles.statusBadge, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
                <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.statusText, { color: colors.primary }]}>IA Ativa</Text>
              </View>
            )}
          </Animated.View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 200,
    height: 200,
  },
  wrapperCompact: {
    width: 120,
    height: 120,
  },
  pulseRing: {
    position: "absolute",
    borderWidth: 1.5,
  },
  particle: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  glowShadow: {
    position: "absolute",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 0,
  },
  sphere: {
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 16,
    overflow: "hidden",
  },
  sphereHighlight: {
    position: "absolute",
    top: 6,
    left: 10,
    width: "40%",
    height: "30%",
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 20,
    transform: [{ rotate: "-20deg" }],
  },
  textContainer: {
    marginTop: 12,
    alignItems: "center",
    gap: 6,
  },
  iaTitle: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  iaSuggestion: {
    fontSize: 12,
    textAlign: "center",
    maxWidth: 180,
    lineHeight: 16,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
