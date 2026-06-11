import "@/global.css";
import "@/lib/_core/nativewind-pressable";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ThemeProvider } from "@/lib/theme-provider";
import { CobrancaContext } from "@/lib/cobranca-context";
import { requestNotificationPermissions, setupNotificationListeners } from "@/lib/notifications";
import { checkAndScheduleSmartNotifications } from "@/lib/notificacoes-inteligentes";
import { fullSync } from "@/lib/sync";
import { useIconFonts } from "@/src/hooks/use-icon-fonts";

// Keep the native splash visible from cold start until icon fonts register.
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const [loaded, error] = useIconFonts();
  const [cobrancaCriada, setCobrancaCriada] = useState<any>(null);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  useEffect(() => {
    const unsubscribe = setupNotificationListeners();
    return () => unsubscribe();
  }, []);

  // Sincronização inicial com o backend (offline-first)
  useEffect(() => {
    fullSync().catch((e) => console.warn("[sync] inicial falhou:", e?.message));
    // Sync periódico a cada 60s
    const interval = setInterval(() => {
      fullSync().catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Notificações inteligentes (cobranças, orçamentos, agendamentos)
  useEffect(() => {
    // Disparar após 5s pra dar tempo dos dados sincronizarem
    const t = setTimeout(() => {
      checkAndScheduleSmartNotifications().catch(() => {});
    }, 5000);
    // Repetir a cada 30 min
    const interval = setInterval(() => {
      checkAndScheduleSmartNotifications().catch(() => {});
    }, 30 * 60 * 1000);
    return () => {
      clearTimeout(t);
      clearInterval(interval);
    };
  }, []);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  if (!loaded && !error) return null;

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <CobrancaContext.Provider value={{ cobrancaCriada, setCobrancaCriada }}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <QueryClientProvider client={queryClient}>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="notificacoes-lista" />
              </Stack>
              <StatusBar style="auto" />
            </QueryClientProvider>
          </GestureHandlerRootView>
        </CobrancaContext.Provider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
