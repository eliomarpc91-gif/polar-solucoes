import { View, Text, Dimensions } from "react-native";
import Svg, { Polyline, Polygon, Defs, LinearGradient, Stop, Circle, Line } from "react-native-svg";
import { useColors } from "@/hooks/use-colors";

interface SimpleLineChartProps {
  data: number[];
  labels?: string[];
  color: string;
  height?: number;
  width?: number;
}

export function SimpleLineChart({
  data,
  labels,
  color,
  height = 40,
  width,
}: SimpleLineChartProps) {
  const colors = useColors();
  const screenW = Dimensions.get("window").width;
  const w = width ?? screenW - 64;

  if (!data || data.length < 2) {
    return (
      <View style={{ height, width: w, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: colors.muted, fontSize: 11 }}>
          Sem dados suficientes
        </Text>
      </View>
    );
  }

  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue || 1;

  const chartH = labels ? height - 22 : height;

  const xy = data.map((value, index) => {
    const x = (index / (data.length - 1)) * w;
    const y = chartH - ((value - minValue) / range) * (chartH - 4) - 2;
    return { x, y };
  });

  const points = xy.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPoints = [
    ...xy.map((p) => `${p.x},${p.y}`),
    `${w},${chartH}`,
    `0,${chartH}`,
  ].join(" ");

  return (
    <View style={{ width: w }}>
      <Svg height={chartH} width={w}>
        <Defs>
          <LinearGradient id={`grad-${color.replace("#", "")}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <Stop offset="100%" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Polygon
          points={areaPoints}
          fill={`url(#grad-${color.replace("#", "")})`}
          stroke="none"
        />
        <Polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {xy.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={3} fill={color} />
        ))}
      </Svg>
      {labels && labels.length === data.length && (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 6,
            width: w,
          }}
        >
          {labels.map((l, i) => (
            <Text
              key={i}
              style={{ fontSize: 9, color: colors.muted }}
              numberOfLines={1}
            >
              {l}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}
