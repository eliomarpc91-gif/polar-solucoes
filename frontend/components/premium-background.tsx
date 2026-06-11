import { View, ViewProps, Image } from "react-native";
import { useColors } from "@/hooks/use-colors";

interface PremiumBackgroundProps extends ViewProps {
  children: React.ReactNode;
  showWatermark?: boolean;
  variant?: "default" | "gradient" | "minimal";
}

/**
 * Premium Background Component
 * 
 * Adiciona:
 * - Fundo branco gelo premium
 * - Marca d'água translúcida (urso Polar)
 * - Gradiente suave opcional
 */
export function PremiumBackground({
  children,
  showWatermark = true,
  variant = "default",
  style,
  ...props
}: PremiumBackgroundProps) {
  const colors = useColors();

  const backgroundColors = {
    default: colors.background,
    gradient: colors.backgroundAlt,
    minimal: "#ffffff",
  };

  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: backgroundColors[variant],
          position: "relative",
        },
        style,
      ]}
      {...props}
    >
      {/* Watermark - Urso Polar */}
      {showWatermark && (
        <View
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 300,
            height: 300,
            marginLeft: -150,
            marginTop: -150,
            opacity: 0.05,
            zIndex: 0,
            pointerEvents: "none",
          }}
        >
          <Image
            source={require("@/assets/images/icon.png")}
            style={{
              width: "100%",
              height: "100%",
              resizeMode: "contain",
            }}
          />
        </View>
      )}

      {/* Content */}
      <View style={{ flex: 1, zIndex: 1 }}>
        {children}
      </View>
    </View>
  );
}
