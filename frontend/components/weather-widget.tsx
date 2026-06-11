import { useEffect, useState } from "react";
import { View, Text, Pressable, ActivityIndicator, Linking, Platform } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Location from "expo-location";
import { storage } from "@/src/utils/storage";

// Open-Meteo (gratuita, sem chave): https://open-meteo.com/

interface WeatherData {
  temp: number;
  feels_like: number;
  weather_code: number;
  humidity: number;
  wind: number;
  city: string;
  is_day: number;
  updated_at: number;
}

const CACHE_KEY = "@polar/weather_cache_v1";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 min

function weatherInfo(code: number, isDay: number): { icon: string; label: string; bg: string } {
  // Códigos WMO: https://open-meteo.com/en/docs
  const day = isDay === 1;
  if (code === 0) return { icon: day ? "wb-sunny" : "nightlight-round", label: day ? "Ensolarado" : "Limpo", bg: day ? "#F59E0B" : "#1F2937" };
  if ([1, 2].includes(code)) return { icon: day ? "wb-sunny" : "nights-stay", label: "Parcialmente nublado", bg: "#60A5FA" };
  if (code === 3) return { icon: "cloud", label: "Nublado", bg: "#6B7280" };
  if ([45, 48].includes(code)) return { icon: "blur-on", label: "Neblina", bg: "#9CA3AF" };
  if ([51, 53, 55, 56, 57].includes(code)) return { icon: "grain", label: "Garoa", bg: "#3B82F6" };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { icon: "umbrella", label: "Chuva", bg: "#2563EB" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { icon: "ac-unit", label: "Neve", bg: "#93C5FD" };
  if ([95, 96, 99].includes(code)) return { icon: "thunderstorm", label: "Tempestade", bg: "#7C3AED" };
  return { icon: "cloud-queue", label: "Clima", bg: "#60A5FA" };
}

interface Props {
  variant?: "header" | "card";
}

export function WeatherWidget({ variant = "header" }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permError, setPermError] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const fromCache = async (): Promise<WeatherData | null> => {
    try {
      const raw = await storage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as WeatherData;
      if (Date.now() - parsed.updated_at < CACHE_TTL_MS) return parsed;
      return null;
    } catch {
      return null;
    }
  };

  const saveCache = async (d: WeatherData) => {
    try {
      await storage.setItem(CACHE_KEY, JSON.stringify(d));
    } catch {}
  };

  const fetchWeather = async (lat: number, lon: number) => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,is_day,weather_code,relative_humidity_2m,wind_speed_10m&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Erro ao buscar clima");
    const j = await res.json();
    return {
      temp: j.current.temperature_2m,
      feels_like: j.current.apparent_temperature,
      weather_code: j.current.weather_code,
      humidity: j.current.relative_humidity_2m,
      wind: j.current.wind_speed_10m,
      is_day: j.current.is_day,
    };
  };

  const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
    try {
      if (Platform.OS !== "web") {
        const list = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
        if (list && list[0]) {
          const c = list[0];
          return c.city || c.subregion || c.region || "Sua região";
        }
      }
      // Fallback via API web
      const r = await fetch(
        `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&language=pt&format=json`,
      );
      const j = await r.json();
      if (j.results && j.results[0]) {
        return j.results[0].name || j.results[0].admin1 || "Sua região";
      }
    } catch {}
    return "Sua região";
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    setPermError(false);

    const cached = await fromCache();
    if (cached) {
      setData(cached);
      setLoading(false);
    }

    try {
      // Tentar pegar localização
      let lat = -23.55; // São Paulo fallback
      let lon = -46.63;

      if (Platform.OS !== "web") {
        const { status } = await Location.getForegroundPermissionsAsync();
        let granted = status === "granted";
        if (!granted) {
          const req = await Location.requestForegroundPermissionsAsync();
          granted = req.status === "granted";
          if (!granted) {
            setPermError(true);
          }
        }
        if (granted) {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          lat = loc.coords.latitude;
          lon = loc.coords.longitude;
        }
      } else {
        // Web: tentar geolocation API
        await new Promise<void>((resolve) => {
          if (typeof navigator !== "undefined" && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                lat = pos.coords.latitude;
                lon = pos.coords.longitude;
                resolve();
              },
              () => resolve(),
              { timeout: 5000 },
            );
          } else {
            resolve();
          }
        });
      }

      const [w, city] = await Promise.all([fetchWeather(lat, lon), reverseGeocode(lat, lon)]);
      const fresh: WeatherData = { ...w, city, updated_at: Date.now() };
      setData(fresh);
      saveCache(fresh);
    } catch (e: any) {
      if (!cached) setError(e?.message || "Erro ao carregar clima");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <View
        style={{
          backgroundColor: "rgba(255,255,255,0.15)",
          borderRadius: 14,
          padding: 10,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        }}
      >
        <ActivityIndicator size="small" color="#FFF" />
        <Text style={{ color: "#FFF", fontSize: 11 }}>Carregando clima...</Text>
      </View>
    );
  }

  if (error && !data) {
    return (
      <Pressable
        onPress={load}
        style={{
          backgroundColor: "rgba(255,255,255,0.15)",
          borderRadius: 14,
          padding: 10,
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
        }}
      >
        <MaterialIcons name="refresh" size={14} color="#FFF" />
        <Text style={{ color: "#FFF", fontSize: 11 }}>Toque para tentar de novo</Text>
      </Pressable>
    );
  }

  if (!data) return null;

  const info = weatherInfo(data.weather_code, data.is_day);

  return (
    <Pressable
      onPress={load}
      testID="weather-widget"
      style={{
        backgroundColor: "rgba(255,255,255,0.18)",
        borderRadius: 14,
        paddingVertical: 10,
        paddingHorizontal: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
      }}
    >
      <View
        style={{
          backgroundColor: "rgba(255,255,255,0.25)",
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MaterialIcons name={info.icon as any} size={20} color="#FFF" />
      </View>
      <View>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
          <Text style={{ color: "#FFF", fontSize: 18, fontWeight: "800" }}>
            {Math.round(data.temp)}°
          </Text>
          <Text style={{ color: "#FFF", fontSize: 10, fontWeight: "600" }}>
            {info.label}
          </Text>
        </View>
        <Text style={{ color: "#C7DAFF", fontSize: 9, marginTop: 1 }}>
          {data.city} • Sensação {Math.round(data.feels_like)}° • 💧 {data.humidity}%
        </Text>
        {permError && (
          <Pressable onPress={() => Linking.openSettings()}>
            <Text style={{ color: "#FBBF24", fontSize: 9, marginTop: 2 }}>
              Ativar localização para clima preciso
            </Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}
