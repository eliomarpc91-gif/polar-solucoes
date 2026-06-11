import React from "react";
import { View, ViewProps } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { cn } from "@/lib/utils";

interface PremiumCardProps extends ViewProps {
  variant?: "default" | "glass" | "elevated" | "minimal" | "accent";
  glow?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Premium Card Component - SaaS Style (Stripe, Linear, Notion inspired)
 * 
 * Variants:
 * - default: Glassmorphism com blur suave
 * - glass: Transparência máxima com glow
 * - elevated: Sombra profunda com elevação
 * - minimal: Borda sutil, sem sombra
 * - accent: Com borda colorida à esquerda (para alertas)
 */
export function PremiumCard({
  variant = "default",
  glow = false,
  children,
  style,
  className,
  ...props
}: PremiumCardProps) {
  const colors = useColors();

  const baseStyle = {
    borderRadius: 16,
    overflow: "hidden" as const,
  };

  const variantStyles = {
    default: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderLight,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
    glass: {
      backgroundColor: colors.surfaceGlass,
      borderWidth: 1,
      borderColor: colors.borderLight + "40",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 4,
    },
    elevated: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderLight,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 8,
    },
    minimal: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderLight,
      shadowOpacity: 0,
      elevation: 0,
    },
    accent: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
  };

  const glowStyle = glow
    ? {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 6,
      }
    : {};

  return (
    <View
      style={[
        baseStyle,
        variantStyles[variant],
        glow && glowStyle,
        style,
      ]}
      {...props}
    >
      <View className={cn("p-4", className)}>
        {children}
      </View>
    </View>
  );
}
