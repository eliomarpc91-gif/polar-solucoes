import React, { useEffect, useState } from "react";
import { ScrollView, Text, View, Pressable, TextInput, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { obterContasPagar, adicionarContaPagar, removerContaPagar, atualizarContaPagar } from "@/lib/financeiro-store";
import { ContaPagar, CategoriaContaPagar } from "@/lib/financeiro-types";

const CATEGORIAS: CategoriaContaPagar[] = [
  "aluguel", "energia", "agua", "internet", "fornecedor", "emprestimo",
  "parcela", "ferramenta", "contador", "aplicativo", "salario", "imposto", "outro"
];

const CORES_CATEGORIA: Record<CategoriaContaPagar, string> = {
  aluguel: "#DC2626",
  energia: "#F59E0B",
  agua: "#0891B2",
  internet: "#7C3AED",
  fornecedor: "#16A34A",
  emprestimo: "#EF4444",
  parcela: "#D97706",
  ferramenta: "#0891B2",
  contador: "#7C3AED",
  aplicativo: "#8B5CF6",
  salario: "#16A34A",
  imposto: "#DC2626",
  outro: "#6B7685",
};

export default function ContasPagarScreen() {
  const colors = useColors();
  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [showAdicionar, setShowAdicionar] = useState(false);
  const [novaContaForm, setNovaContaForm] = useState({
    descricao: "",
    categoria: "fornecedor" as CategoriaContaPagar,
    valor: "",
    vencimento: "",
    recorrencia: "unica" as const,
  });

  useEffect(() => {
    carregarContas();
  }, []);

  async function carregarContas() {
    const dados = await obterContasPagar();
    setContas(dados);
  }

  async function adicionarNovaConta() {
    if (!novaContaForm.descricao || !novaContaForm.valor || !novaContaForm.vencimento) {
      Alert.alert("Erro", "Preencha todos os campos obrigatórios");
      return;
    }

    await adicionarContaPagar({
      descricao: novaContaForm.descricao,
      categoria: novaContaForm.categoria,
      valor: parseFloat(novaContaForm.valor),
      vencimento: novaContaForm.vencimento,
      recorrencia: novaContaForm.recorrencia,
      status: "pendente",
    });

    setNovaContaForm({
      descricao: "",
      categoria: "fornecedor",
      valor: "",
      vencimento: "",
      recorrencia: "unica",
    });
    setShowAdicionar(false);
    carregarContas();
  }

  async function removerConta(id: string) {
    Alert.alert("Remover", "Tem certeza que deseja remover esta conta?", [
      { text: "Cancelar" },
      {
        text: "Remover",
        onPress: async () => {
          await removerContaPagar(id);
          carregarContas();
        },
      },
    ]);
  }

  const totalPendente = contas
    .filter((c) => c.status !== "pago")
    .reduce((sum, c) => sum + c.valor, 0);

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

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: "bold" }}>Contas a Pagar</Text>
          <Pressable onPress={() => setShowAdicionar(!showAdicionar)}>
            <MaterialIcons name="add-circle" size={32} color={colors.primary} />
          </Pressable>
        </View>

        {/* Total Pendente */}
        <View
          style={{
            backgroundColor: colors.error,
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 12, opacity: 0.8 }}>TOTAL A PAGAR</Text>
          <Text style={{ color: "#FFFFFF", fontSize: 32, fontWeight: "bold", marginTop: 4 }}>
            R$ {totalPendente.toFixed(2)}
          </Text>
        </View>

        {/* Formulário de Adição */}
        {showAdicionar && (
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ color: colors.foreground, fontWeight: "bold", marginBottom: 12 }}>Nova Conta</Text>
            <TextInput
              placeholder="Descrição"
              placeholderTextColor={colors.muted}
              value={novaContaForm.descricao}
              onChangeText={(t) => setNovaContaForm({ ...novaContaForm, descricao: t })}
              style={{ ...inputStyle, marginBottom: 8 } as any}
            />
            <TextInput
              placeholder="Valor (R$)"
              placeholderTextColor={colors.muted}
              keyboardType="decimal-pad"
              value={novaContaForm.valor}
              onChangeText={(t) => setNovaContaForm({ ...novaContaForm, valor: t })}
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
                  borderLeftColor: CORES_CATEGORIA[conta.categoria],
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.foreground, fontWeight: "bold" }}>{conta.descricao}</Text>
                    <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>{conta.categoria}</Text>
                  </View>
                  <Pressable onPress={() => removerConta(conta.id)}>
                    <MaterialIcons name="delete" size={20} color={colors.error} />
                  </Pressable>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ color: colors.error, fontWeight: "bold" }}>R$ {conta.valor.toFixed(2)}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>Vence: {conta.vencimento}</Text>
                </View>
              </View>
            ))
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
