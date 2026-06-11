import { View, Text, TextInput, Pressable } from "react-native";
import { useState, useEffect } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";

export interface DescontoConfig {
  tipo: "percentual" | "fixo";
  valor: number;
}

export interface DescontoSelectorProps {
  desconto: DescontoConfig | undefined;
  onDescontoChange: (desconto: DescontoConfig | undefined) => void;
  subtotal: number;
}

export function DescontoSelector({
  desconto,
  onDescontoChange,
  subtotal,
}: DescontoSelectorProps) {
  const colors = useColors();
  const [inputValue, setInputValue] = useState(desconto && desconto.valor > 0 ? desconto.valor.toString().replace('.', ',') : '');

  useEffect(() => {
    if (desconto && desconto.valor > 0) {
      setInputValue(desconto.valor.toString().replace('.', ','));
    } else {
      setInputValue('');
    }
  }, [desconto?.tipo, desconto?.valor]);

  const handleTipoChange = (tipo: "percentual" | "fixo") => {
    if (desconto?.tipo === tipo) {
      onDescontoChange(undefined);
    } else {
      onDescontoChange({
        tipo,
        valor: desconto?.valor || 0,
      });
    }
  };

  const handleValorChange = (text: string) => {
    // Apenas atualiza o estado local SEM validação
    setInputValue(text);
  };

  const handleValorBlur = () => {
    if (!desconto) return;

    // Processa o valor quando o campo perde foco
    let textoLimpo = '';
    for (let i = 0; i < inputValue.length; i++) {
      const char = inputValue[i];
      if ((char >= '0' && char <= '9') || char === ',' || char === '.') {
        textoLimpo += char;
      }
    }
    
    if (!textoLimpo) {
      onDescontoChange({ ...desconto, valor: 0 });
      setInputValue('');
      return;
    }
    
    const valor = parseFloat(textoLimpo.replace(',', '.')) || 0;
    onDescontoChange({ ...desconto, valor });
    setInputValue(valor > 0 ? valor.toString().replace('.', ',') : '');
  };

  // Calcula o valor do desconto em reais
  const calcularValorDescontoEmReais = (): number => {
    if (!desconto || desconto.valor <= 0) return 0;

    if (desconto.tipo === "percentual") {
      return (subtotal * desconto.valor) / 100;
    } else {
      return Math.min(desconto.valor, subtotal);
    }
  };

  const valorDescontoEmReais = calcularValorDescontoEmReais();

  return (
    <View style={{ marginBottom: 16 }}>
      <Text className="text-foreground text-lg font-bold mb-3">Desconto</Text>

      {/* Seleção de tipo de desconto */}
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
        <Pressable
          onPress={() => handleTipoChange("percentual")}
          style={({ pressed }) => [
            {
              flex: 1,
              backgroundColor:
                desconto?.tipo === "percentual" ? colors.primary : colors.surface,
              borderWidth: 1,
              borderColor:
                desconto?.tipo === "percentual" ? colors.primary : colors.border,
              borderRadius: 10,
              padding: 12,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <MaterialIcons
              name={desconto?.tipo === "percentual" ? "check-circle" : "radio-button-unchecked"}
              size={20}
              color={desconto?.tipo === "percentual" ? "white" : colors.muted}
            />
            <Text
              style={{
                color: desconto?.tipo === "percentual" ? "white" : colors.foreground,
                fontWeight: "600",
                fontSize: 14,
              }}
            >
              Percentual (%)
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => handleTipoChange("fixo")}
          style={({ pressed }) => [
            {
              flex: 1,
              backgroundColor:
                desconto?.tipo === "fixo" ? colors.primary : colors.surface,
              borderWidth: 1,
              borderColor:
                desconto?.tipo === "fixo" ? colors.primary : colors.border,
              borderRadius: 10,
              padding: 12,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <MaterialIcons
              name={desconto?.tipo === "fixo" ? "check-circle" : "radio-button-unchecked"}
              size={20}
              color={desconto?.tipo === "fixo" ? "white" : colors.muted}
            />
            <Text
              style={{
                color: desconto?.tipo === "fixo" ? "white" : colors.foreground,
                fontWeight: "600",
                fontSize: 14,
              }}
            >
              Valor Fixo (R$)
            </Text>
          </View>
        </Pressable>
      </View>

      {/* Campo de entrada de valor */}
      {desconto && (
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 10,
            padding: 12,
            borderWidth: 1,
            borderColor: colors.primary,
          }}
        >
          <Text className="text-muted text-xs font-semibold mb-2 ml-1">
            {desconto.tipo === "percentual" ? "PERCENTUAL (%)" : "VALOR (R$)"}
          </Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
            <TextInput
              value={inputValue}
              onChangeText={handleValorChange}
              placeholder={desconto.tipo === "percentual" ? "0" : "0,00"}
              placeholderTextColor={colors.muted}
              maxLength={desconto.tipo === "percentual" ? 5 : 10}
              autoCapitalize="none"
              autoCorrect={false}
              editable={true}
              selectTextOnFocus={true}
              style={{
                flex: 1,
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                padding: 10,
                color: colors.foreground,
                fontSize: 14,
              }}
            />
            <Pressable
              onPress={handleValorBlur}
              style={({ pressed }) => [{
                backgroundColor: colors.primary,
                borderRadius: 8,
                padding: 10,
                justifyContent: "center",
                alignItems: "center",
                minWidth: 50,
                opacity: pressed ? 0.7 : 1,
              }]}
            >
              <MaterialIcons name="check" size={20} color="white" />
            </Pressable>
          </View>

          {/* Resumo do desconto */}
          <View
            style={{
              backgroundColor: colors.background,
              borderRadius: 8,
              padding: 10,
              borderLeftWidth: 3,
              borderLeftColor: colors.success,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
              <Text className="text-muted text-xs">Subtotal:</Text>
              <Text className="text-foreground font-semibold text-xs">
                R$ {subtotal.toFixed(2)}
              </Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
              <Text className="text-muted text-xs">
                {desconto.tipo === "percentual" ? "Desconto:" : "Desconto:"}
              </Text>
              <Text className="text-success font-semibold text-xs">
                {desconto.tipo === "percentual" ? `${desconto.valor.toFixed(2)}%` : `R$ ${desconto.valor.toFixed(2)}`}
              </Text>
            </View>
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: colors.border,
                paddingTop: 6,
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Text className="text-foreground font-bold text-xs">Valor a descontar:</Text>
              <Text className="text-success font-bold text-xs">
                - R$ {valorDescontoEmReais.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Aviso se desconto fixo for maior que subtotal */}
          {desconto.tipo === "fixo" && desconto.valor > subtotal && (
            <View
              style={{
                backgroundColor: colors.warning,
                borderRadius: 8,
                padding: 8,
                marginTop: 8,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <MaterialIcons name="warning" size={16} color="white" />
              <Text style={{ color: "white", fontSize: 12, flex: 1 }}>
                Desconto limitado ao subtotal: R$ {subtotal.toFixed(2)}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Mensagem quando nenhum desconto está selecionado */}
      {!desconto && (
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 10,
            padding: 12,
            borderWidth: 1,
            borderColor: colors.border,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <MaterialIcons name="info" size={18} color={colors.muted} />
          <Text className="text-muted text-sm flex-1">
            Selecione um tipo de desconto para aplicar
          </Text>
        </View>
      )}
    </View>
  );
}
