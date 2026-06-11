import React from "react";
import { View, ViewProps } from "react-native";
import { cn } from "@/lib/utils";
import { useColors } from "@/hooks/use-colors";

interface PremiumCardProps extends ViewProps {
  className?: string;
  variant?: "default" | "elevated" | "outlined" | "success" | "warning" | "error";
  children: React.ReactNode;
}

export function PremiumCard({
  className,
  variant = "default",
  children,
  style,
  ...props
}: PremiumCardProps) {
  const colors = useColors();

  const getVariantStyle = () => {
    switch (variant) {
      case "elevated":
        return {
          backgroundColor: colors.surface,
          shadowColor: colors.foreground,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 8,
        };
      case "outlined":
        return {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case "success":
        return {
          backgroundColor: colors.success + "08",
          borderLeftWidth: 4,
          borderLeftColor: colors.success,
        };
      case "warning":
        return {
          backgroundColor: colors.warning + "08",
          borderLeftWidth: 4,
          borderLeftColor: colors.warning,
        };
      case "error":
        return {
          backgroundColor: colors.error + "08",
          borderLeftWidth: 4,
          borderLeftColor: colors.error,
        };
      default:
        return {
          backgroundColor: colors.surface,
          shadowColor: colors.foreground,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        };
    }
  };

  return (
    <View
      style={[
        {
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
        },
        getVariantStyle(),
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
