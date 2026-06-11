import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";

export interface PagamentoRecord {
  id: string;
  valor: number;
  data: string;
  metodo: string;
  observacoes?: string;
  comprovante?: string;
}

interface HistoricoPagamentosProps {
  pagamentos: PagamentoRecord[];
  onRemover?: (id: string) => void;
}

export function HistoricoPagamentos({
  pagamentos,
  onRemover,
}: HistoricoPagamentosProps) {
  const colors = useColors();

  if (!pagamentos || pagamentos.length === 0) {
    return (
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 16,
          alignItems: "center",
          justifyContent: "center",
          minHeight: 100,
        }}
      >
        <MaterialIcons
          name="history"
          size={32}
          color={colors.muted}
          style={{ marginBottom: 8 }}
        />
        <Text
          style={{
            color: colors.muted,
            fontSize: 14,
            fontWeight: "500",
          }}
        >
          Nenhum pagamento registrado
        </Text>
      </View>
    );
  }

  const getMetodoIcon = (metodo: string) => {
    switch (metodo) {
      case "Dinheiro":
        return "attach-money";
      case "PIX":
        return "qr-code-2";
      case "Crédito":
        return "credit-card";
      case "Débito":
        return "payment";
      case "Transferência":
        return "compare-arrows";
      default:
        return "account-balance-wallet";
    }
  };

  const formatarData = (dataStr: string) => {
    const [ano, mes, dia] = dataStr.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={{ gap: 12 }}>
        {pagamentos.map((pagamento, index) => (
          <View
            key={pagamento.id || index}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 14,
              borderLeftWidth: 4,
              borderLeftColor: colors.success,
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 10,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: colors.foreground,
                    marginBottom: 4,
                  }}
                >
                  R$ {pagamento.valor.toFixed(2)}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.muted,
                  }}
                >
                  {formatarData(pagamento.data)}
                </Text>
              </View>
              {onRemover && (
                <Pressable
                  onPress={() => onRemover(pagamento.id)}
                  style={{
                    padding: 8,
                    marginRight: -8,
                  }}
                >
                  <MaterialIcons
                    name="close"
                    size={18}
                    color={colors.muted}
                  />
                </Pressable>
              )}
            </View>

            {/* Método */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
              }}
            >
              <View
                style={{
                  backgroundColor: colors.background,
                  borderRadius: 8,
                  padding: 6,
                }}
              >
                <MaterialIcons
                  name={getMetodoIcon(pagamento.metodo)}
                  size={16}
                  color={colors.primary}
                />
              </View>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.foreground,
                  fontWeight: "500",
                }}
              >
                {pagamento.metodo}
              </Text>
            </View>

            {/* Observações */}
            {pagamento.observacoes && (
              <View
                style={{
                  backgroundColor: colors.background,
                  borderRadius: 8,
                  padding: 10,
                  marginBottom: 10,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.muted,
                    fontStyle: "italic",
                  }}
                >
                  {pagamento.observacoes}
                </Text>
              </View>
            )}

            {/* Comprovante */}
            {pagamento.comprovante && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  paddingTop: 10,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                }}
              >
                <MaterialIcons
                  name="check-circle"
                  size={16}
                  color={colors.success}
                />
                <Text
                  style={{
                    fontSize: 11,
                    color: colors.success,
                    fontWeight: "500",
                  }}
                >
                  Comprovante anexado
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
