import { useRef, useState, useEffect, useCallback } from "react";
import { View, Text, Pressable, PanResponder, GestureResponderEvent } from "react-native";
import { useColors } from "@/hooks/use-colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Svg, { Path } from "react-native-svg";

export interface SignaturePadRef {
  clear: () => void;
  getSignature: () => Promise<string>;
}

interface SignaturePadProps {
  onSignatureChange?: (signature: string) => void;
}

interface Point {
  x: number;
  y: number;
}

export function SignaturePad({ onSignatureChange }: SignaturePadProps) {
  const colors = useColors();
  const [hasSignature, setHasSignature] = useState(false);
  const [pathData, setPathData] = useState<string>("");
  const pointsRef = useRef<Point[]>([]);
  const svgRef = useRef<any>(null);
  const viewRef = useRef<View>(null);

  // Função para converter pontos em base64
  const pointsToBase64 = useCallback((points: Point[]) => {
    if (points.length === 0) return "";
    const pointsData = JSON.stringify(points);
    return `data:application/json;base64,${btoa(pointsData)}`;
  }, []);

  // PanResponder para capturar gestos de toque
  const panResponderRef = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        const { locationX, locationY } = evt.nativeEvent;
        if (locationX !== undefined && locationY !== undefined) {
          pointsRef.current.push({ x: locationX, y: locationY });
          if (pointsRef.current.length === 1) {
            setPathData(`M ${locationX} ${locationY}`);
          } else {
            setPathData((prev) => `${prev} M ${locationX} ${locationY}`);
          }
          setHasSignature(true);
        }
      },
      onPanResponderMove: (evt: GestureResponderEvent) => {
        const { locationX, locationY } = evt.nativeEvent;
        if (locationX !== undefined && locationY !== undefined && locationX >= 0 && locationY >= 0) {
          pointsRef.current.push({ x: locationX, y: locationY });
          setPathData((prev) => `${prev} L ${locationX} ${locationY}`);
        }
      },
      onPanResponderRelease: () => {
        // Quando o usuário solta o dedo, atualizar a assinatura
        if (pointsRef.current.length > 0) {
          const signatureData = pointsToBase64(pointsRef.current);
          if (signatureData) {
            console.log("Assinatura capturada:", signatureData.substring(0, 50) + "...");
            onSignatureChange?.(signatureData);
          }
        }
      },
    })
  ).current;

  const handleClear = () => {
    console.log("Limpando assinatura");
    setHasSignature(false);
    setPathData("");
    pointsRef.current = [];
    onSignatureChange?.("");
  };

  return (
    <View>
      {/* Canvas Area with SVG */}
      <View
        ref={viewRef}
        {...panResponderRef.panHandlers}
        style={{
          backgroundColor: colors.surface,
          borderWidth: 2,
          borderColor: colors.border,
          borderRadius: 12,
          height: 200,
          marginBottom: 16,
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* SVG Canvas - sempre renderizado */}
        <Svg
          ref={svgRef}
          width="100%"
          height="100%"
          style={{ position: "absolute", top: 0, left: 0 }}
          pointerEvents="none"
        >
          {pathData && (
            <Path
              d={pathData}
              stroke={colors.primary}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          )}
        </Svg>

        {/* Placeholder Text - mostrar apenas se não houver assinatura */}
        {!hasSignature && !pathData && (
          <View style={{ alignItems: "center", zIndex: 10 }}>
            <MaterialIcons name="edit" size={48} color={colors.muted} />
            <Text style={{ color: colors.muted, marginTop: 8 }}>Toque para desenhar</Text>
          </View>
        )}
      </View>

      {/* Status Text */}
      {hasSignature && (
        <Text style={{ color: colors.success, fontWeight: "bold", marginBottom: 12, textAlign: "center" }}>
          ✓ Assinatura capturada ({pointsRef.current.length} pontos)
        </Text>
      )}

      {/* Buttons */}
      <View style={{ gap: 10 }}>
        <Pressable
          onPress={handleClear}
          style={({ pressed }) => [
            {
              backgroundColor: colors.warning,
              borderRadius: 12,
              padding: 14,
              alignItems: "center",
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Text style={{ color: "#FFF", fontWeight: "bold", fontSize: 15 }}>Limpar Assinatura</Text>
        </Pressable>
      </View>
    </View>
  );
}
