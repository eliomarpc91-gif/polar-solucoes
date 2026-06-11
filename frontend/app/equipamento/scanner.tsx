import { useState, useEffect, useRef } from "react";
import { Text, View, Pressable, Linking, StyleSheet, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { CameraView, useCameraPermissions } from "expo-camera";
import { getEquipamentos } from "@/lib/store";

/**
 * Scanner real de QR Code usando expo-camera.
 * Espera receber uma URL no formato polarsolucoes://equipamento/{id}
 * ou um JSON com { id: "..." }. Se for um link http(s) também abre o navegador.
 */
export default function ScannerScreen() {
  const colors = useColors();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const lastScanRef = useRef<string>("");

  useEffect(() => {
    // Solicita permissão automaticamente ao abrir a tela
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  const handleScanned = async ({ data }: { data: string }) => {
    if (scanned || !data || data === lastScanRef.current) return;
    lastScanRef.current = data;
    setScanned(true);

    try {
      let equipamentoId: string | null = null;

      // Formato 1: polarsolucoes://equipamento/{id}
      const deepMatch = data.match(/polarsolucoes:\/\/equipamento\/([\w-]+)/);
      if (deepMatch) equipamentoId = deepMatch[1];

      // Formato 2: JSON {"id":"..."} ou {"equipamentoId":"..."}
      if (!equipamentoId) {
        try {
          const obj = JSON.parse(data);
          equipamentoId = obj.equipamentoId || obj.id || null;
        } catch {}
      }

      // Formato 3: o próprio data É o ID
      if (!equipamentoId && /^[\w-]+$/.test(data)) {
        equipamentoId = data;
      }

      if (equipamentoId) {
        const equipamentos = await getEquipamentos();
        const found = equipamentos.find((e) => e.id === equipamentoId);
        if (found) {
          router.replace(`/equipamento/${equipamentoId}` as any);
          return;
        }
        Alert.alert(
          "Equipamento não encontrado",
          `Nenhum equipamento com o ID '${equipamentoId}' está cadastrado neste aparelho.`,
          [
            { text: "Cancelar", onPress: () => setScanned(false), style: "cancel" },
            { text: "Cadastrar Manualmente", onPress: () => router.replace("/equipamento/novo" as any) },
          ],
        );
        return;
      }

      // Se é URL HTTP, abre no navegador
      if (data.startsWith("http://") || data.startsWith("https://")) {
        Alert.alert("Link detectado", data, [
          { text: "Cancelar", onPress: () => setScanned(false), style: "cancel" },
          { text: "Abrir", onPress: () => Linking.openURL(data).catch(() => {}) },
        ]);
        return;
      }

      // Caso genérico
      Alert.alert("QR Code lido", data, [
        { text: "Escanear de novo", onPress: () => setScanned(false) },
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Erro", e?.message || "Não foi possível processar o QR Code");
      setScanned(false);
    }
  };

  // ─── PERMISSÃO ─────────────────────────────────────────────────────
  if (!permission) {
    return (
      <ScreenContainer edges={["top", "left", "right", "bottom"]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Scanner</Text>
        </View>
        <View style={styles.centerWrap}>
          <Text style={{ color: colors.muted }}>Carregando câmera...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!permission.granted) {
    const openSettings = () => Linking.openSettings().catch(() => {});
    return (
      <ScreenContainer edges={["top", "left", "right", "bottom"]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Scanner</Text>
        </View>
        <View style={styles.centerWrap}>
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: colors.primary + "15",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 18,
            }}
          >
            <MaterialIcons name="no-photography" size={56} color={colors.primary} />
          </View>
          <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "700", textAlign: "center", marginBottom: 6 }}>
            Permissão de câmera necessária
          </Text>
          <Text style={{ color: colors.muted, fontSize: 13, textAlign: "center", marginBottom: 24, paddingHorizontal: 20 }}>
            Para escanear o QR Code dos equipamentos, precisamos acessar a câmera do seu dispositivo.
          </Text>
          <View style={{ width: "100%", paddingHorizontal: 30, gap: 10 }}>
            {permission.canAskAgain ? (
              <Pressable
                onPress={requestPermission}
                style={({ pressed }) => [
                  { backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: "center", opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Text style={{ color: "#fff", fontWeight: "800", fontSize: 15 }}>Conceder Permissão</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={openSettings}
                style={({ pressed }) => [
                  { backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: "center", opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Text style={{ color: "#fff", fontWeight: "800", fontSize: 15 }}>Abrir Configurações</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => router.push("/equipamento/novo" as any)}
              style={({ pressed }) => [
                { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 16, borderRadius: 12, alignItems: "center", opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 14 }}>Cadastrar Manualmente</Text>
            </Pressable>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  // ─── CÂMERA ATIVA ──────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={torchOn}
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "code128", "code39", "code93", "codabar", "ean13", "ean8", "upc_a", "upc_e", "pdf417"],
        }}
        onBarcodeScanned={scanned ? undefined : handleScanned}
      />

      {/* Overlay - moldura central */}
      <View style={styles.overlayContainer} pointerEvents="box-none">
        <View style={styles.overlayDark} />
        <View style={styles.overlayMiddle}>
          <View style={styles.overlayDark} />
          <View style={styles.scanFrame}>
            {/* Cantos */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <View style={styles.overlayDark} />
        </View>
        <View style={[styles.overlayDark, { paddingHorizontal: 30 }]}>
          <Text style={styles.helperText}>
            {scanned ? "Processando..." : "Aponte a câmera para o QR Code do equipamento"}
          </Text>
        </View>
      </View>

      {/* Header */}
      <View style={[styles.topBar, { paddingTop: Platform.OS === "ios" ? 50 : 30 }]} pointerEvents="box-none">
        <Pressable
          onPress={() => router.back()}
          style={styles.iconBtn}
          hitSlop={10}
        >
          <MaterialIcons name="arrow-back" size={26} color="#fff" />
        </Pressable>
        <Text style={styles.topTitle}>Escanear QR Code</Text>
        <Pressable
          onPress={() => setTorchOn((t) => !t)}
          style={[styles.iconBtn, torchOn && { backgroundColor: "#FBBF24" }]}
          hitSlop={10}
        >
          <MaterialIcons name={torchOn ? "flash-on" : "flash-off"} size={24} color="#fff" />
        </Pressable>
      </View>

      {/* Botões inferiores */}
      <View style={styles.bottomBar} pointerEvents="box-none">
        <Pressable
          onPress={() => router.push("/equipamento/novo" as any)}
          style={({ pressed }) => [
            styles.bottomBtn,
            { backgroundColor: "rgba(255,255,255,0.95)", opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <MaterialIcons name="add" size={20} color="#0D3B66" />
          <Text style={{ color: "#0D3B66", fontWeight: "800", marginLeft: 6 }}>Cadastrar Manual</Text>
        </Pressable>
        {scanned && (
          <Pressable
            onPress={() => {
              setScanned(false);
              lastScanRef.current = "";
            }}
            style={({ pressed }) => [
              styles.bottomBtn,
              { backgroundColor: "#1E88E5", opacity: pressed ? 0.85 : 1, marginTop: 10 },
            ]}
          >
            <MaterialIcons name="refresh" size={20} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "800", marginLeft: 6 }}>Escanear de novo</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const SCAN_SIZE = 260;
const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, gap: 14 },
  headerTitle: { fontSize: 20, fontWeight: "800" },
  centerWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  overlayContainer: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "stretch" },
  overlayDark: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center" },
  overlayMiddle: { flexDirection: "row", height: SCAN_SIZE },
  scanFrame: {
    width: SCAN_SIZE,
    height: SCAN_SIZE,
    borderRadius: 18,
    overflow: "hidden",
  },
  corner: { position: "absolute", width: 28, height: 28, borderColor: "#1E88E5", borderWidth: 4 },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 14 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 14 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 14 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 14 },
  helperText: { color: "#fff", fontSize: 13, textAlign: "center", fontWeight: "600", paddingHorizontal: 20 },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: { color: "#fff", fontSize: 16, fontWeight: "800" },
  bottomBar: {
    position: "absolute",
    bottom: 36,
    left: 20,
    right: 20,
    alignItems: "center",
  },
  bottomBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: "100%",
  },
});
