import { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ToastAndroid,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import { gerarReciboPDF, ReciboPagamentoData } from "@/lib/pdf-generator";

export interface PagamentoPartialData {
  valor: number;
  data: string;
  metodo: string;
  observacoes: string;
}

interface PagamentoPartialModalProps {
  visible: boolean;
  onClose: () => void;
  cobranca: any;
}

export function PagamentoPartialModal({
  visible,
  onClose,
  cobranca,
}: PagamentoPartialModalProps) {
  const valorTotal = cobranca?.valorTotal || 0;
  const valorJaPago = cobranca?.valorRecebido || 0;
  const colors = useColors();
  const [valor, setValor] = useState("");
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);
  const [metodo, setMetodo] = useState("Dinheiro");
  const [observacoes, setObservacoes] = useState("");

  const valorRestante = valorTotal - valorJaPago;
  const valorAtual = valor ? parseFloat(valor.replace(",", ".")) : 0;
  const percentualPago = valorRestante > 0 ? (valorAtual / valorRestante) * 100 : 0;

  const handleConfirm = async () => {
    if (!valor || valorAtual <= 0) {
      Alert.alert("Erro", "Informe um valor válido");
      return;
    }

    if (valorAtual > valorRestante) {
      Alert.alert(
        "Erro",
        `Valor não pode ser maior que R$ ${valorRestante.toFixed(2)}`
      );
      return;
    }

    try {
      const { updateCobranca } = await import("@/lib/store");
      const novoValorRecebido = (cobranca.valorRecebido || 0) + valorAtual;
      const novoStatus = novoValorRecebido >= cobranca.valorTotal ? "pago" : "parcial";
      
      await updateCobranca(cobranca.id, {
        valorRecebido: novoValorRecebido,
        status: novoStatus,
      });
      
      Alert.alert("Sucesso", "Pagamento registrado com sucesso!");
      setValor("");
      setData(new Date().toISOString().split("T")[0]);
      setMetodo("Dinheiro");
      setObservacoes("");
      onClose();
    } catch (error) {
      Alert.alert("Erro", "Não foi possível registrar o pagamento");
      console.error(error);
    }
  };

  const handleGerarRecibo = async () => {
    if (!valor || valorAtual <= 0) {
      Alert.alert("Erro", "Informe um valor válido");
      return;
    }

    try {
      const reciboData: ReciboPagamentoData = {
        id: `REC-${Date.now()}`,
        clienteNome: "Cliente",
        descricao: "Pagamento de Cobrança",
        valorTotal: valorTotal,
        valorPago: valorAtual,
        dataPagamento: data,
        metodoPagamento: metodo,
        observacoes: observacoes,
        empresaNome: "Polar Soluções",
      };

      await gerarReciboPDF(reciboData);
      Alert.alert("Sucesso", "Recibo gerado com sucesso!");
    } catch (error) {
      Alert.alert("Erro", "Erro ao gerar recibo");
      console.error(error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              maxHeight: "90%",
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: colors.foreground,
                }}
              >
                Registrar Pagamento
              </Text>
              <Pressable 
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons
                  name="close"
                  size={24}
                  color={colors.foreground}
                />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Resumo */}
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20,
                  borderLeftWidth: 4,
                  borderLeftColor: colors.primary,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.muted,
                    marginBottom: 4,
                  }}
                >
                  Valor Total
                </Text>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: colors.foreground,
                    marginBottom: 12,
                  }}
                >
                  R$ {valorTotal.toFixed(2)}
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ fontSize: 12, color: colors.muted }}>
                    Já Pago
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: "#10B981",
                    }}
                  >
                    R$ {valorJaPago.toFixed(2)}
                  </Text>
                </View>

                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 12, color: colors.muted }}>
                    Restante
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: "#F59E0B",
                    }}
                  >
                    R$ {valorRestante.toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Valor do Pagamento */}
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: colors.foreground,
                  marginBottom: 8,
                }}
              >
                VALOR DO PAGAMENTO *
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  color: colors.foreground,
                  marginBottom: 8,
                }}
                placeholder="R$ 0,00"
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
                value={valor}
                onChangeText={setValor}
              />
              <Text
                style={{
                  fontSize: 12,
                  color: colors.primary,
                  marginBottom: 16,
                }}
              >
                {percentualPago.toFixed(1)}% do valor restante
              </Text>

              {/* Data do Pagamento */}
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: colors.foreground,
                  marginBottom: 8,
                }}
              >
                DATA DO PAGAMENTO *
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  color: colors.foreground,
                  marginBottom: 16,
                }}
                placeholder="DD/MM/YYYY"
                placeholderTextColor={colors.muted}
                value={data.split("-").reverse().join("/")}
                onChangeText={(text) => {
                  const parts = text.split("/");
                  if (parts.length === 3) {
                    const formatted = `${parts[2]}-${parts[1]}-${parts[0]}`;
                    setData(formatted);
                  }
                }}
              />

              {/* Método de Pagamento */}
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: colors.foreground,
                  marginBottom: 8,
                }}
              >
                MÉTODO DE PAGAMENTO *
              </Text>
              <View style={{ marginBottom: 16 }}>
                {["Dinheiro", "PIX", "Crédito", "Débito", "Transferência"].map(
                  (m) => (
                    <Pressable
                      key={m}
                      onPress={() => setMetodo(m)}
                      style={{
                        paddingVertical: 12,
                        paddingHorizontal: 12,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor:
                          metodo === m ? colors.primary : colors.border,
                        backgroundColor:
                          metodo === m ? colors.surface : colors.background,
                        marginBottom: 8,
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <MaterialIcons
                        name={
                          metodo === m ? "radio-button-checked" : "radio-button-unchecked"
                        }
                        size={20}
                        color={metodo === m ? colors.primary : colors.muted}
                        style={{ marginRight: 8 }}
                      />
                      <Text
                        style={{
                          fontSize: 14,
                          color:
                            metodo === m ? colors.primary : colors.foreground,
                          fontWeight: metodo === m ? "600" : "400",
                        }}
                      >
                        {m}
                      </Text>
                    </Pressable>
                  )
                )}
              </View>

              {/* Observações */}
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: colors.foreground,
                  marginBottom: 8,
                }}
              >
                OBSERVAÇÕES
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 14,
                  color: colors.foreground,
                  marginBottom: 20,
                  minHeight: 80,
                  textAlignVertical: "top",
                }}
                placeholder="Adicione observações sobre o pagamento..."
                placeholderTextColor={colors.muted}
                multiline
                value={observacoes}
                onChangeText={setObservacoes}
              />

              {/* Botões */}
              <View
                style={{
                  flexDirection: "row",
                  gap: 12,
                  marginBottom: 80,
                }}
              >
                <Pressable
                  onPress={onClose}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: colors.foreground,
                    }}
                  >
                    Cancelar
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleGerarRecibo}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: colors.primary,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <MaterialIcons name="picture-as-pdf" size={16} color={colors.primary} />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: colors.primary,
                    }}
                  >
                    Recibo
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleConfirm}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 8,
                    backgroundColor: colors.primary,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: colors.background,
                    }}
                  >
                    Confirmar
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
