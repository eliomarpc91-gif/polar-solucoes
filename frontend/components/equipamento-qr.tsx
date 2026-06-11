import React, { useRef } from "react";
import { View, Text, Pressable, Alert, StyleSheet, Platform } from "react-native";
import QRCode from "react-native-qrcode-svg";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Equipamento } from "@/lib/store";

interface Props {
  equipamento: Equipamento;
  clienteNome?: string;
  size?: number;
  showActions?: boolean;
  compact?: boolean;
}

/**
 * Exibe o QR Code do equipamento + opções de compartilhar e imprimir.
 * O QR contém: polarsolucoes://equipamento/{id}
 */
export function EquipamentoQR({
  equipamento,
  clienteNome,
  size = 200,
  showActions = true,
  compact = false,
}: Props) {
  const svgRef = useRef<any>(null);
  const qrValue = equipamento.qrData || `polarsolucoes://equipamento/${equipamento.id}`;

  const buildEtiquetaHtml = (qrBase64?: string) => {
    const qrImg = qrBase64
      ? `<img src="data:image/png;base64,${qrBase64}" style="width:240px;height:240px;display:block;margin:0 auto;" />`
      : `<div style="width:240px;height:240px;border:2px dashed #ccc;display:flex;align-items:center;justify-content:center;color:#999;">QR Code</div>`;

    const linhaInfo = (label: string, valor?: string) =>
      valor ? `<tr><td style="font-weight:700;padding:4px 8px;color:#475569;">${label}</td><td style="padding:4px 8px;color:#0F172A;">${valor}</td></tr>` : "";

    return `
      <!DOCTYPE html>
      <html><head><meta charset="utf-8" />
      <style>
        body{font-family:-apple-system,Roboto,Arial,sans-serif;margin:0;padding:24px;}
        .card{border:2px solid #0D3B66;border-radius:16px;padding:24px;max-width:380px;margin:0 auto;}
        .header{text-align:center;color:#0D3B66;font-weight:800;font-size:22px;border-bottom:2px solid #0D3B66;padding-bottom:8px;margin-bottom:16px;}
        .sub{text-align:center;color:#475569;font-size:13px;margin-bottom:18px;}
        table{width:100%;border-collapse:collapse;font-size:13px;margin-top:18px;}
        .footer{text-align:center;font-size:10px;color:#94A3B8;margin-top:20px;border-top:1px dashed #CBD5E1;padding-top:10px;}
      </style></head>
      <body>
        <div class="card">
          <div class="header">POLAR SOLUÇÕES</div>
          <div class="sub">Etiqueta do Equipamento</div>
          ${qrImg}
          <table>
            ${linhaInfo("ID", equipamento.id)}
            ${linhaInfo("Tipo", equipamento.tipo)}
            ${linhaInfo("Marca", equipamento.marca)}
            ${linhaInfo("Modelo", equipamento.modelo)}
            ${linhaInfo("Nº Série", equipamento.serie)}
            ${linhaInfo("Cliente", clienteNome)}
          </table>
          <div class="footer">Aponte a câmera no app Polar Soluções para identificar este equipamento.</div>
        </div>
      </body></html>
    `;
  };

  const getQRBase64 = (): Promise<string | undefined> =>
    new Promise((resolve) => {
      try {
        if (svgRef.current?.toDataURL) {
          svgRef.current.toDataURL((data: string) => resolve(data));
        } else {
          resolve(undefined);
        }
      } catch {
        resolve(undefined);
      }
    });

  const imprimir = async () => {
    try {
      const base64 = await getQRBase64();
      await Print.printAsync({ html: buildEtiquetaHtml(base64) });
    } catch (e: any) {
      Alert.alert("Erro ao imprimir", e?.message || "Falha desconhecida");
    }
  };

  const compartilhar = async () => {
    try {
      const base64 = await getQRBase64();
      const { uri } = await Print.printToFileAsync({ html: buildEtiquetaHtml(base64) });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Etiqueta do Equipamento" });
      } else {
        Alert.alert("Compartilhamento não disponível", uri);
      }
    } catch (e: any) {
      Alert.alert("Erro ao compartilhar", e?.message || "Falha desconhecida");
    }
  };

  if (compact) {
    return (
      <View style={styles.compactWrap}>
        <QRCode
          value={qrValue}
          size={size}
          getRef={(c) => (svgRef.current = c)}
          backgroundColor="#fff"
          color="#0D3B66"
        />
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.qrFrame}>
        <QRCode
          value={qrValue}
          size={size}
          getRef={(c) => (svgRef.current = c)}
          backgroundColor="#fff"
          color="#0D3B66"
        />
      </View>
      <Text style={styles.title}>QR Code do Equipamento</Text>
      <Text style={styles.subtitle}>Cole essa etiqueta no equipamento. Use o Scanner para identificar rapidamente.</Text>

      {showActions && (
        <View style={styles.actionsRow}>
          <Pressable
            onPress={imprimir}
            style={({ pressed }) => [styles.actionBtn, { backgroundColor: "#0D3B66", opacity: pressed ? 0.85 : 1 }]}
          >
            <MaterialIcons name="print" size={18} color="#fff" />
            <Text style={styles.actionTxt}>Imprimir</Text>
          </Pressable>
          <Pressable
            onPress={compartilhar}
            style={({ pressed }) => [styles.actionBtn, { backgroundColor: "#1E88E5", opacity: pressed ? 0.85 : 1 }]}
          >
            <MaterialIcons name="share" size={18} color="#fff" />
            <Text style={styles.actionTxt}>Compartilhar PDF</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  qrFrame: {
    padding: 14,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#0D3B66",
  },
  title: { color: "#0D3B66", fontWeight: "800", fontSize: 14, marginTop: 14 },
  subtitle: { color: "#64748B", fontSize: 11, marginTop: 4, textAlign: "center", paddingHorizontal: 8 },
  actionsRow: { flexDirection: "row", gap: 10, marginTop: 16, width: "100%" },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  actionTxt: { color: "#fff", fontWeight: "700", fontSize: 12 },
  compactWrap: {
    padding: 8,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
});
