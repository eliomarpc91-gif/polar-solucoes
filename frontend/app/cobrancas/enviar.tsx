import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Clipboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { ScreenContainer } from "@/components/screen-container";
import { useCobrancaContext } from "@/lib/cobranca-context";

export default function EnviarCobrancaScreen() {
  const router = useRouter();
  const colors = useColors();
  const { cobrancaCriada } = useCobrancaContext();

  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    if (!cobrancaCriada) {
      Alert.alert("Erro", "Nenhuma cobrança foi criada");
      router.back();
      return;
    }

    // Gerar mensagem de cobrança
    const formaPagamentoLabel: Record<string, string> = {
      pix: "PIX",
      boleto: "Boleto",
      cartao_credito: "Cartão de Crédito",
      dinheiro: "Dinheiro",
      transferencia: "Transferência Bancária",
    };

    const forma = formaPagamentoLabel[cobrancaCriada.formaPagamento] || "";
    const valor = cobrancaCriada.valorTotal.toFixed(2);

    let msg = `Olá, ${cobrancaCriada.clienteNome}! 👋\n\n`;
    msg += `Segue sua cobrança:\n\n`;
    msg += `💰 Valor: R$ ${valor}\n`;
    msg += `📅 Vencimento: ${cobrancaCriada.dataVencimento}\n`;
    msg += `💳 Forma de pagamento: ${forma}\n\n`;
    msg += `📝 Descrição:\n${cobrancaCriada.descricao}\n\n`;
    msg += `Qualquer dúvida, estou à disposição! 😊`;

    setMensagem(msg);
  }, [cobrancaCriada, router]);

  const enviarWhatsApp = () => {
    if (!cobrancaCriada) return;

    const telefone = cobrancaCriada.clienteTelefone;
    const telefoneLimpo = telefone.replace(/\D/g, "");
    const url = `https://wa.me/55${telefoneLimpo}?text=${encodeURIComponent(mensagem)}`;

    Linking.openURL(url).catch(() => {
      Alert.alert("Erro", "Não foi possível abrir o WhatsApp");
    });
  };

  const copiarMensagem = () => {
    Clipboard.setString(mensagem);
    Alert.alert("Sucesso", "Mensagem copiada para a área de transferência!");
  };

  if (!cobrancaCriada) {
    return (
      <ScreenContainer className="bg-background">
        <View className="flex-1 items-center justify-center">
          <Text className="text-foreground">Carregando...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="px-4 py-4 border-b border-border">
          <TouchableOpacity onPress={() => router.back()} className="mb-2">
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-foreground">Enviar Cobrança</Text>
          <Text className="text-sm text-muted mt-1">
            Revise a mensagem antes de enviar
          </Text>
        </View>

        {/* Conteúdo */}
        <View className="flex-1 p-4 gap-4">
          {/* Preview da Mensagem */}
          <View className="bg-surface rounded-lg p-4 border border-border">
            <Text className="text-sm font-semibold text-muted mb-2">PREVIEW DA MENSAGEM:</Text>
            <View className="bg-background p-3 rounded-lg border border-border">
              <Text className="text-sm text-foreground leading-relaxed">
                {mensagem}
              </Text>
            </View>
          </View>

          {/* Informações do Cliente */}
          <View className="bg-surface rounded-lg p-4 border border-border gap-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-sm text-muted">Cliente:</Text>
              <Text className="text-sm font-semibold text-foreground">
                {cobrancaCriada.clienteNome}
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-sm text-muted">Telefone:</Text>
              <Text className="text-sm font-semibold text-foreground">
                {cobrancaCriada.clienteTelefone}
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-sm text-muted">Valor:</Text>
              <Text className="text-sm font-semibold text-primary">
                R$ {cobrancaCriada.valorTotal.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Botões */}
          <View className="gap-3 mt-4">
            <TouchableOpacity
              onPress={enviarWhatsApp}
              className="bg-primary rounded-lg p-4 flex-row items-center justify-center gap-2"
            >
              <Ionicons name="logo-whatsapp" size={20} color="#fff" />
              <Text className="text-white font-semibold">Enviar pelo WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={copiarMensagem}
              className="bg-surface border border-primary rounded-lg p-4 flex-row items-center justify-center gap-2"
            >
              <Ionicons name="copy" size={20} color={colors.primary} />
              <Text className="text-primary font-semibold">Copiar Mensagem</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.back()}
              className="bg-surface border border-border rounded-lg p-4 flex-row items-center justify-center gap-2"
            >
              <Ionicons name="close" size={20} color={colors.muted} />
              <Text className="text-muted font-semibold">Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
