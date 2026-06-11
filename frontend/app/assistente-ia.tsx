import React, { useState, useEffect, useRef } from "react";
import { ScrollView, Text, View, Pressable, TextInput, ActivityIndicator, KeyboardAvoidingView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

interface Mensagem {
  id: string;
  texto: string;
  usuario: boolean;
  timestamp: string;
}

export default function AssistenteIAScreen() {
  const colors = useColors();
  const [mensagens, setMensagens] = useState<Mensagem[]>([
    {
      id: "1",
      texto: "Olá! Eu sou Jurema, sua assistente IA empresarial. Como posso ajudá-lo hoje?",
      usuario: false,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [enviando, setEnviando] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [mensagens]);

  const respostasIA = {
    "como aumentar lucro": "Para aumentar o lucro, você pode: 1) Aumentar os preços dos serviços em 10-15%, 2) Reduzir custos operacionais, 3) Focar em serviços com maior margem, 4) Aumentar a frequência de clientes recorrentes.",
    "qual é meu faturamento": "Seu faturamento total é de R$ 15.500,00 este mês. Você realizou 12 serviços com margem média de 32%.",
    "tenho risco": "Sua empresa está com risco moderado. Recomendo: aumentar o saldo em caixa, reduzir inadimplência e revisar custos de garantia.",
    "como melhorar margem": "Para melhorar a margem: 1) Aumentar preços, 2) Reduzir despesas, 3) Focar em clientes com maior lucratividade, 4) Otimizar tempo de deslocamento.",
    "próximos passos": "Recomendo: 1) Revisar preços de serviços, 2) Analisar clientes com maior inadimplência, 3) Implementar contratos mensais, 4) Acompanhar rentabilidade por cidade.",
    "default": "Entendi sua pergunta. Posso ajudá-lo com: análise financeira, sugestões de preço, detecção de riscos, planejamento de expansão, ou estratégias de crescimento.",
  };

  const obterResposta = (pergunta: string): string => {
    const perguntaLower = pergunta.toLowerCase();
    for (const [chave, resposta] of Object.entries(respostasIA)) {
      if (chave !== "default" && perguntaLower.includes(chave)) {
        return resposta;
      }
    }
    return respostasIA.default;
  };

  const handleEnviar = async () => {
    if (!input.trim()) return;

    // Adicionar mensagem do usuário
    const novaMensagem: Mensagem = {
      id: Date.now().toString(),
      texto: input,
      usuario: true,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };

    setMensagens((prev) => [...prev, novaMensagem]);
    setInput("");
    setEnviando(true);

    // Simular resposta da IA
    setTimeout(() => {
      const respostaIA: Mensagem = {
        id: (Date.now() + 1).toString(),
        texto: obterResposta(input),
        usuario: false,
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      };
      setMensagens((prev) => [...prev, respostaIA]);
      setEnviando(false);
    }, 800);
  };

  const BolhaMensagem = ({ mensagem }: { mensagem: Mensagem }) => (
    <View
      style={{
        flexDirection: "row",
        justifyContent: mensagem.usuario ? "flex-end" : "flex-start",
        marginBottom: 12,
        paddingHorizontal: 16,
      }}
    >
      {!mensagem.usuario && (
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: colors.primary,
            justifyContent: "center",
            alignItems: "center",
            marginRight: 8,
          }}
        >
          <MaterialIcons name="smart-toy" size={18} color="white" />
        </View>
      )}
      <View
        style={{
          maxWidth: "80%",
          backgroundColor: mensagem.usuario ? colors.primary : colors.surface,
          borderRadius: 16,
          paddingHorizontal: 14,
          paddingVertical: 10,
        }}
      >
        <Text
          style={{
            color: mensagem.usuario ? "white" : colors.foreground,
            fontSize: 14,
            lineHeight: 18,
          }}
        >
          {mensagem.texto}
        </Text>
        <Text
          style={{
            color: mensagem.usuario ? "rgba(255,255,255,0.7)" : colors.muted,
            fontSize: 11,
            marginTop: 4,
          }}
        >
          {mensagem.timestamp}
        </Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <ScreenContainer className="p-0">
        {/* Header */}
        <View
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: 16,
            paddingVertical: 16,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.2)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <MaterialIcons name="smart-toy" size={24} color="white" />
          </View>
          <View>
            <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
              Jurema IA
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>
              Assistente Empresarial
            </Text>
          </View>
        </View>

        {/* Mensagens */}
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ paddingVertical: 16, flexGrow: 1 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {mensagens.map((msg) => (
            <BolhaMensagem key={msg.id} mensagem={msg} />
          ))}
          {enviando && (
            <View style={{ paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.primary,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <MaterialIcons name="smart-toy" size={18} color="white" />
              </View>
              <View style={{ backgroundColor: colors.surface, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 }}>
                <ActivityIndicator color={colors.primary} size="small" />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingHorizontal: 16,
            paddingVertical: 12,
            paddingBottom: 80,
            backgroundColor: colors.surface,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              gap: 8,
            }}
          >
            <TextInput
              style={{
                flex: 1,
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 20,
                paddingHorizontal: 14,
                paddingVertical: 10,
                color: colors.foreground,
                maxHeight: 100,
              }}
              placeholder="Pergunte algo..."
              placeholderTextColor={colors.muted}
              value={input}
              onChangeText={setInput}
              multiline
              editable={!enviando}
            />
            <Pressable
              onPress={handleEnviar}
              disabled={enviando || !input.trim()}
              style={({ pressed }) => [{
                backgroundColor: colors.primary,
                borderRadius: 20,
                width: 40,
                height: 40,
                justifyContent: "center",
                alignItems: "center",
                opacity: pressed || enviando ? 0.7 : 1,
              }]}
            >
              <MaterialIcons name="send" size={20} color="white" />
            </Pressable>
          </View>
        </View>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}
