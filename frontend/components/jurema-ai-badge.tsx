import { View, Text, Pressable, Animated } from "react-native";
import { useEffect, useRef } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";

interface JuremaAIBadgeProps {
  onPress?: () => void;
  animated?: boolean;
}

/**
 * Jurema IA Premium Badge
 * 
 * Características:
 * - Glow azul suave
 * - Animação pulsante
 * - Efeito holográfico leve
 * - Estilo premium SaaS
 */
export function JuremaAIBadge({ onPress, animated = true }: JuremaAIBadgeProps) {
  const colors = useColors();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!animated) return;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [animated, pulseAnim]);

  const scale = pulseAnim.interpolate({
    inputRange: [1, 1.05],
    outputRange: [1, 1.02],
  });

  return (
    <Pressable onPress={onPress}>
      <Animated.View
        style={{
          transform: [{ scale }],
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: colors.primary + "12",
            borderWidth: 1.5,
            borderColor: colors.primary + "40",
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 4,
          }}
        >
          {/* AI Icon with Glow */}
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: colors.primary + "20",
              justifyContent: "center",
              alignItems: "center",
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <MaterialIcons name="auto-awesome" size={12} color={colors.primary} />
          </View>

          {/* Text */}
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: colors.primary,
              letterSpacing: 0.5,
            }}
          >
            Jurema IA
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}
