import React, { useEffect, useState } from "react";
import { ScrollView, Text, View, Pressable, TextInput, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { obterContasReceber, adicionarContaReceber, atualizarContaReceber } from "@/lib/financeiro-store";
import { ContaReceber } from "@/lib/financeiro-types";

export default function ContasReceberScreen() {
  const colors = useColors();
  const [contas, setContas] = useState<ContaReceber[]>([]);
  const [showAdicionar, setShowAdicionar] = useState(false);
  const [novaContaForm, setNovaContaForm] = useState({
    clienteNome: "",
    descricao: "",
    valorTotal: "",
    vencimento: "",
    formaPagamento: "PIX",
  });

  useEffect(() => {
    carregarContas();
  }, []);

  async function carregarContas() {
    const dados = await obterContasReceber();
    setContas(dados);
  }

  async function adicionarNovaConta() {
    if (!novaContaForm.clienteNome || !novaContaForm.valorTotal || !novaContaForm.vencimento) {
      Alert.alert("Erro", "Preencha todos os campos obrigatórios");
      return;
    }

    const valorTotal = parseFloat(novaContaForm.valorTotal);
    const entrada50 = valorTotal * 0.5;
    const saldo = valorTotal - entrada50;

    await adicionarContaReceber({
      clienteId: `cliente_${Date.now()}`,
      clienteNome: novaContaForm.clienteNome,
      descricao: novaContaForm.descricao,
      valorTotal,
      entrada50Porcento: entrada50,
      saldoRestante: saldo,
      valorRecebido: 0,
      vencimento: novaContaForm.vencimento,
      formaPagamento: novaContaForm.formaPagamento,
      status: "pendente",
    });

    setNovaContaForm({
      clienteNome: "",
      descricao: "",
      valorTotal: "",
      vencimento: "",
      formaPagamento: "PIX",
    });
    setShowAdicionar(false);
    carregarContas();
  }

  const totalReceber = contas.reduce((sum, c) => sum + c.saldoRestante, 0);
  const totalRecebido = contas.reduce((sum, c) => sum + c.valorRecebido, 0);
  const atrasadas = contas.filter((c) => c.status === "atrasado").length;

  const inputStyle = {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.foreground,
    fontSize: 14,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pago":
        return colors.success;
      case "atrasado":
        return colors.error;
      case "parcialmente_pago":
        return colors.warning;
      default:
        return colors.muted;
    }
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: "bold" }}>Contas a Receber</Text>
          <Pressable onPress={() => setShowAdicionar(!showAdicionar)}>
            <MaterialIcons name="add-circle" size={32} color={colors.primary} />
          </Pressable>
        </View>

        {/* Resumo */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
          <View style={{ flex: 1, backgroundColor: colors.primary, borderRadius: 12, padding: 12 }}>
            <Text style={{ color: "#FFFFFF", fontSize: 10, opacity: 0.8 }}>A RECEBER</Text>
            <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "bold", marginTop: 4 }}>
              R$ {totalReceber.toFixed(2)}
            </Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.success, borderRadius: 12, padding: 12 }}>
            <Text style={{ color: "#FFFFFF", fontSize: 10, opacity: 0.8 }}>RECEBIDO</Text>
            <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "bold", marginTop: 4 }}>
              R$ {totalRecebido.toFixed(2)}
            </Text>
          </View>
          {atrasadas > 0 && (
            <View style={{ flex: 1, backgroundColor: colors.error, borderRadius: 12, padding: 12 }}>
              <Text style={{ color: "#FFFFFF", fontSize: 10, opacity: 0.8 }}>ATRASADAS</Text>
              <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "bold", marginTop: 4 }}>
                {atrasadas}
              </Text>
            </View>
          )}
        </View>

        {/* Formulário de Adição */}
        {showAdicionar && (
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ color: colors.foreground, fontWeight: "bold", marginBottom: 12 }}>Nova Conta a Receber</Text>
            <TextInput
              placeholder="Nome do Cliente"
              placeholderTextColor={colors.muted}
              value={novaContaForm.clienteNome}
              onChangeText={(t) => setNovaContaForm({ ...novaContaForm, clienteNome: t })}
              style={{ ...inputStyle, marginBottom: 8 } as any}
            />
            <TextInput
              placeholder="Descrição"
              placeholderTextColor={colors.muted}
              value={novaContaForm.descricao}
              onChangeText={(t) => setNovaContaForm({ ...novaContaForm, descricao: t })}
              style={{ ...inputStyle, marginBottom: 8 } as any}
            />
            <TextInput
              placeholder="Valor Total (R$)"
              placeholderTextColor={colors.muted}
              keyboardType="decimal-pad"
              value={novaContaForm.valorTotal}
              onChangeText={(t) => setNovaContaForm({ ...novaContaForm, valorTotal: t })}
              style={{ ...inputStyle, marginBottom: 8 } as any}
            />
            <TextInput
              placeholder="Vencimento (YYYY-MM-DD)"
              placeholderTextColor={colors.muted}
              value={novaContaForm.vencimento}
              onChangeText={(t) => setNovaContaForm({ ...novaContaForm, vencimento: t })}
              style={{ ...inputStyle, marginBottom: 12 } as any}
            />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable
                onPress={() => setShowAdicionar(false)}
                style={({ pressed }) => [{
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  padding: 10,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
                  opacity: pressed ? 0.7 : 1,
                }]}
              >
                <Text style={{ color: colors.foreground, fontWeight: "600" }}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={adicionarNovaConta}
                style={({ pressed }) => [{
                  flex: 1,
                  backgroundColor: colors.primary,
                  borderRadius: 8,
                  padding: 10,
                  alignItems: "center",
                  opacity: pressed ? 0.8 : 1,
                }]}
              >
                <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>Adicionar</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Lista de Contas */}
        <Text style={{ color: colors.foreground, fontWeight: "bold", marginBottom: 12 }}>Contas Pendentes</Text>
        {contas.filter((c) => c.status !== "pago").length === 0 ? (
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, alignItems: "center" }}>
            <Text style={{ color: colors.muted }}>Nenhuma conta pendente</Text>
          </View>
        ) : (
          contas
            .filter((c) => c.status !== "pago")
            .map((conta) => (
              <View
                key={conta.id}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 8,
                  borderLeftWidth: 4,
                  borderLeftColor: getStatusColor(conta.status),
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.foreground, fontWeight: "bold" }}>{conta.clienteNome}</Text>
                    <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>{conta.descricao}</Text>
                  </View>
                  <Text style={{ color: getStatusColor(conta.status), fontSize: 10, fontWeight: "bold" }}>
                    {conta.status.toUpperCase()}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ color: colors.primary, fontWeight: "bold" }}>R$ {conta.saldoRestante.toFixed(2)}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>Vence: {conta.vencimento}</Text>
                </View>
              </View>
            ))
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
