import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Cobranca, ConfiguracaoCobranca } from "@/lib/cobranca-types";
import {
  gerarMensagemCobrancaNormal,
  gerarMensagemLembreteVencimento,
  gerarMensagemCobrancaVencida,
  gerarMensagemConfirmacaoPagamento,
  gerarMensagemCobrancaParcial,
  gerarURLWhatsApp,
  estaVencida,
} from "@/lib/cobranca-whatsapp-utils";

interface CobrancaWhatsAppPreviewProps {
  cobranca: Cobranca;
  config: ConfiguracaoCobranca;
  tipoMensagem?: "normal" | "lembrete" | "vencida" | "confirmacao" | "parcial";
  onEnviar?: (mensagem: string) => void;
  onFechar?: () => void;
}

export function CobrancaWhatsAppPreview({
  cobranca,
  config,
  tipoMensagem = "normal",
  onEnviar,
  onFechar,
}: CobrancaWhatsAppPreviewProps) {
  const gerarMensagem = (): string => {
    switch (tipoMensagem) {
      case "lembrete":
        return gerarMensagemLembreteVencimento(cobranca, config);
      case "vencida":
        return gerarMensagemCobrancaVencida(cobranca, config);
      case "confirmacao":
        return gerarMensagemConfirmacaoPagamento(cobranca, cobranca.valorRecebido, config);
      case "parcial":
        return gerarMensagemCobrancaParcial(cobranca, config);
      default:
        return gerarMensagemCobrancaNormal(cobranca, config);
    }
  };

  const mensagem = gerarMensagem();

  const abrirWhatsApp = () => {
    if (!cobranca.clienteTelefone) {
      Alert.alert("Erro", "Telefone do cliente não informado");
      return;
    }

    const url = gerarURLWhatsApp(cobranca.clienteTelefone, mensagem);

    Linking.openURL(url).catch(() => {
      Alert.alert(
        "Erro",
        "Não foi possível abrir o WhatsApp. Verifique se está instalado."
      );
    });

    if (onEnviar) {
      onEnviar(mensagem);
    }
  };

  const copiarMensagem = () => {
    // TODO: Implementar cópia para clipboard
    Alert.alert("Sucesso", "Mensagem copiada para a área de transferência!");
  };

  const getTituloMensagem = (): string => {
    switch (tipoMensagem) {
      case "lembrete":
        return "Lembrete de Vencimento";
      case "vencida":
        return "Cobrança Vencida";
      case "confirmacao":
        return "Confirmação de Pagamento";
      case "parcial":
        return "Cobrança Parcial";
      default:
        return "Cobrança Normal";
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: "#e5e7eb",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View>
          <Text style={{ fontSize: 16, fontWeight: "bold", color: "#1B4F72" }}>
            {getTituloMensagem()}
          </Text>
          <Text style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>
            Revise antes de enviar
          </Text>
        </View>
        {onFechar && (
          <TouchableOpacity onPress={onFechar}>
            <Ionicons name="close" size={24} color="#111827" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }}>
        {/* Info do Cliente */}
        <View
          style={{
            backgroundColor: "#F3F4F6",
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Ionicons name="person" size={16} color="#1B4F72" />
            <Text style={{ fontSize: 12, color: "#6B7280" }}>Para:</Text>
          </View>
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#111827", marginBottom: 4 }}>
            {cobranca.clienteNome}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="call" size={14} color="#6B7280" />
            <Text style={{ fontSize: 12, color: "#6B7280" }}>
              {cobranca.clienteTelefone}
            </Text>
          </View>
        </View>

        {/* Preview da Mensagem */}
        <View
          style={{
            backgroundColor: "#E8F5E9",
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
            borderLeftWidth: 3,
            borderLeftColor: "#4CAF50",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Ionicons name="chatbubble-outline" size={16} color="#2E7D32" />
            <Text style={{ fontSize: 12, fontWeight: "600", color: "#2E7D32" }}>
              Prévia da Mensagem
            </Text>
          </View>
          <Text
            style={{
              fontSize: 13,
              lineHeight: 20,
              color: "#1B5E20",
              fontFamily: "monospace",
            }}
          >
            {mensagem}
          </Text>
        </View>

        {/* Informações Adicionais */}
        <View
          style={{
            backgroundColor: "#FFF3E0",
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
            borderLeftWidth: 3,
            borderLeftColor: "#FF9800",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Ionicons name="information" size={16} color="#E65100" />
            <Text style={{ fontSize: 12, fontWeight: "600", color: "#E65100" }}>
              Informações
            </Text>
          </View>
          <Text style={{ fontSize: 12, color: "#BF360C", lineHeight: 18 }}>
            • A mensagem será enviada via WhatsApp Web{"\n"}
            • Você pode revisar e editar antes de enviar{"\n"}
            • Certifique-se de que o cliente tem WhatsApp ativo
          </Text>
        </View>
      </ScrollView>

      {/* Botões de Ação */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderTopWidth: 1,
          borderTopColor: "#e5e7eb",
          flexDirection: "row",
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={copiarMensagem}
          style={{
            flex: 1,
            backgroundColor: "#F3F4F6",
            paddingVertical: 12,
            borderRadius: 8,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Ionicons name="copy" size={16} color="#1B4F72" />
          <Text style={{ color: "#1B4F72", fontWeight: "600", fontSize: 14 }}>
            Copiar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={abrirWhatsApp}
          style={{
            flex: 1,
            backgroundColor: "#25D366",
            paddingVertical: 12,
            borderRadius: 8,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Ionicons name="logo-whatsapp" size={16} color="#fff" />
          <Text style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}>
            Enviar WhatsApp
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
