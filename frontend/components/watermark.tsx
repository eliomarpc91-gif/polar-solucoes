import React from "react";
import { View, Image } from "react-native";
import { useColors } from "@/hooks/use-colors";

interface WatermarkProps {
  opacity?: number;
  size?: "small" | "medium" | "large";
}

export function Watermark({ opacity = 0.08, size = "large" }: WatermarkProps) {
  const colors = useColors();

  const sizeMap = {
    small: 120,
    medium: 180,
    large: 240,
  };

  const watermarkSize = sizeMap[size];

  return (
    <View
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        marginTop: -watermarkSize / 2,
        marginLeft: -watermarkSize / 2,
        opacity: opacity,
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <Image
        source={require("@/assets/images/icon.png")}
        style={{
          width: watermarkSize,
          height: watermarkSize,
          resizeMode: "contain",
          tintColor: colors.primary,
        }}
      />
    </View>
  );
}
