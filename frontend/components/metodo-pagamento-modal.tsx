import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface MetodoPagamentoModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (metodo: string) => void;
}

const METODOS_PAGAMENTO = [
  { id: "pix", label: "PIX", icon: "qr-code" },
  { id: "dinheiro", label: "Dinheiro", icon: "cash" },
  { id: "cartao_debito", label: "Cartão de Débito", icon: "card" },
  { id: "cartao_credito", label: "Cartão de Crédito", icon: "card" },
  { id: "transferencia", label: "Transferência Bancária", icon: "swap-horizontal" },
  { id: "boleto", label: "Boleto", icon: "document" },
  { id: "outro", label: "Outro", icon: "ellipsis-horizontal" },
];

export function MetodoPagamentoModal({
  visible,
  onClose,
  onSelect,
}: MetodoPagamentoModalProps) {
  const [metodoCustomizado, setMetodoCustomizado] = useState("");
  const [mostraCustomizado, setMostraCustomizado] = useState(false);

  const handleSelectMetodo = (metodo: string) => {
    if (metodo === "outro") {
      setMostraCustomizado(true);
    } else {
      onSelect(metodo);
      onClose();
    }
  };

  const handleConfirmarCustomizado = () => {
    if (!metodoCustomizado.trim()) {
      Alert.alert("Erro", "Por favor, digite um método de pagamento");
      return;
    }
    onSelect(metodoCustomizado.trim());
    setMetodoCustomizado("");
    setMostraCustomizado(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/50 justify-center items-center p-4">
        <View className="bg-background rounded-2xl w-full max-w-md shadow-lg">
          {!mostraCustomizado ? (
            <>
              <View className="p-6 border-b border-border">
                <Text className="text-2xl font-bold text-foreground">
                  Método de Pagamento
                </Text>
                <Text className="text-sm text-muted mt-1">
                  Selecione como o cliente pagou
                </Text>
              </View>

              <ScrollView className="max-h-96">
                {METODOS_PAGAMENTO.map((metodo) => (
                  <TouchableOpacity
                    key={metodo.id}
                    onPress={() => handleSelectMetodo(metodo.id)}
                    className="flex-row items-center p-4 border-b border-border active:bg-surface"
                  >
                    <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mr-4">
                      <Ionicons name={metodo.icon as any} size={24} color="#0a7ea4" />
                    </View>
                    <Text className="flex-1 text-lg font-semibold text-foreground">
                      {metodo.label}
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color="#687076" />
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View className="p-4 border-t border-border">
                <TouchableOpacity
                  onPress={onClose}
                  className="bg-muted/20 rounded-lg p-3 items-center"
                >
                  <Text className="text-foreground font-semibold">Cancelar</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View className="p-6 border-b border-border">
                <Text className="text-2xl font-bold text-foreground">
                  Outro Método
                </Text>
                <Text className="text-sm text-muted mt-1">
                  Digite o método de pagamento
                </Text>
              </View>

              <View className="p-6">
                <TextInput
                  placeholder="Ex: Cheque, Criptomoeda, etc"
                  placeholderTextColor="#9BA1A6"
                  value={metodoCustomizado}
                  onChangeText={setMetodoCustomizado}
                  className="border border-border rounded-lg p-3 text-foreground bg-surface mb-4"
                />

                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => {
                      setMostraCustomizado(false);
                      setMetodoCustomizado("");
                    }}
                    className="flex-1 bg-muted/20 rounded-lg p-3 items-center"
                  >
                    <Text className="text-foreground font-semibold">Voltar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleConfirmarCustomizado}
                    className="flex-1 bg-primary rounded-lg p-3 items-center"
                  >
                    <Text className="text-white font-semibold">Confirmar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
