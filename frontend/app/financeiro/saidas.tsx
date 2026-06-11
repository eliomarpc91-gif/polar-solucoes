import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getSaidasManuais, saveSaidaManual, deleteSaidaManual } from "@/lib/store";
import { SaidaFinanceira, CategoriaSaida, FormaPagamento } from "@/lib/financeiro-automatico-types";
import { validarSaida } from "@/lib/financeiro-automatico-utils";

const CATEGORIAS: { label: string; value: CategoriaSaida; icon: string }[] = [
  { label: "Material", value: "material", icon: "cube" },
  { label: "Peças", value: "pecas", icon: "cog" },
  { label: "Frete", value: "frete", icon: "car" },
  { label: "Transporte", value: "transporte", icon: "bus" },
  { label: "Alimentação", value: "alimentacao", icon: "restaurant" },
  { label: "Ferramentas", value: "ferramentas", icon: "hammer" },
  { label: "Funcionário", value: "funcionario", icon: "person" },
  { label: "Aluguel", value: "aluguel", icon: "home" },
  { label: "Água", value: "agua", icon: "water" },
  { label: "Luz", value: "luz", icon: "bulb" },
  { label: "Aplicativo", value: "aplicativo", icon: "phone-portrait" },
  { label: "Impostos", value: "impostos", icon: "document" },
  { label: "Despesas Gerais", value: "despesas_gerais", icon: "ellipsis-horizontal" },
];

const FORMAS_PAGAMENTO: FormaPagamento[] = [
  "dinheiro",
  "pix",
  "transferencia",
  "cheque",
  "cartao_credito",
  "cartao_debito",
  "boleto",
  "outro",
];

export default function SaidasScreen() {
  const [saidas, setSaidas] = useState<SaidaFinanceira[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState<SaidaFinanceira | null>(null);
  const [formData, setFormData] = useState<Partial<SaidaFinanceira>>({
    data: new Date().toISOString().split("T")[0],
    descricao: "",
    categoria: "material",
    valor: 0,
    formaPagamento: "pix",
    fornecedor: "",
    observacoes: "",
  });
  const [erros, setErros] = useState<string[]>([]);

  useEffect(() => {
    carregarSaidas();
  }, []);

  const carregarSaidas = async () => {
    const dados = await getSaidasManuais();
    setSaidas(dados.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()));
  };

  const abrirModal = (saida?: SaidaFinanceira) => {
    if (saida) {
      setEditando(saida);
      setFormData(saida);
    } else {
      setEditando(null);
      setFormData({
        data: new Date().toISOString().split("T")[0],
        descricao: "",
        categoria: "material",
        valor: 0,
        formaPagamento: "pix",
        fornecedor: "",
        observacoes: "",
      });
    }
    setErros([]);
    setModalVisible(true);
  };

  const salvarSaida = async () => {
    const errosValidacao = validarSaida(formData);
    if (errosValidacao.length > 0) {
      setErros(errosValidacao);
      return;
    }

    const novaSaida: SaidaFinanceira = {
      id: editando?.id || `saida_${Date.now()}`,
      data: formData.data || new Date().toISOString().split("T")[0],
      descricao: formData.descricao || "",
      categoria: formData.categoria as CategoriaSaida,
      valor: formData.valor || 0,
      formaPagamento: formData.formaPagamento as FormaPagamento,
      fornecedor: formData.fornecedor,
      observacoes: formData.observacoes,
      comprovante: formData.comprovante,
      criado_em: editando?.criado_em || new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    };

    await saveSaidaManual(novaSaida);
    await carregarSaidas();
    setModalVisible(false);
    Alert.alert("Sucesso", editando ? "Saída atualizada!" : "Saída registrada!");
  };

  const deletarSaida = (id: string) => {
    Alert.alert("Confirmar", "Deseja deletar esta saída?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Deletar",
        style: "destructive",
        onPress: async () => {
          await deleteSaidaManual(id);
          await carregarSaidas();
        },
      },
    ]);
  };

  const totalSaidas = saidas.reduce((sum, s) => sum + s.valor, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" }}>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: "#1B4F72", marginBottom: 8 }}>
            Saídas Manuais
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View>
              <Text style={{ fontSize: 12, color: "#6B7280", marginBottom: 4 }}>Total de Saídas</Text>
              <Text style={{ fontSize: 20, fontWeight: "bold", color: "#EF4444" }}>
                R$ {totalSaidas.toFixed(2)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => abrirModal()}
              style={{
                backgroundColor: "#1B4F72",
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 8,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "600" }}>Nova Saída</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Lista de Saídas */}
        <FlatList
          data={saidas}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => {
            const categoria = CATEGORIAS.find((c) => c.value === item.categoria);
            return (
              <TouchableOpacity
                onPress={() => abrirModal(item)}
                style={{
                  backgroundColor: "#F9FAFB",
                  borderRadius: 12,
                  padding: 12,
                  borderLeftWidth: 4,
                  borderLeftColor: "#1B4F72",
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <Ionicons name={categoria?.icon as any} size={16} color="#1B4F72" />
                      <Text style={{ fontSize: 12, color: "#6B7280", fontWeight: "600" }}>
                        {categoria?.label}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: "#111827", marginBottom: 4 }}>
                      {item.descricao}
                    </Text>
                    <View style={{ flexDirection: "row", gap: 12 }}>
                      <Text style={{ fontSize: 11, color: "#6B7280" }}>
                        {new Date(item.data).toLocaleDateString("pt-BR")}
                      </Text>
                      <Text style={{ fontSize: 11, color: "#6B7280" }}>{item.formaPagamento}</Text>
                      {item.fornecedor && (
                        <Text style={{ fontSize: 11, color: "#6B7280" }}>Fornecedor: {item.fornecedor}</Text>
                      )}
                    </View>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 8 }}>
                    <Text style={{ fontSize: 16, fontWeight: "bold", color: "#EF4444" }}>
                      R$ {item.valor.toFixed(2)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => deletarSaida(item.id)}
                      style={{ padding: 4 }}
                    >
                      <Ionicons name="trash" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 40 }}>
              <Ionicons name="wallet-outline" size={48} color="#d1d5db" />
              <Text style={{ marginTop: 12, color: "#9ca3af", fontSize: 14 }}>
                Nenhuma saída registrada
              </Text>
            </View>
          }
        />
      </View>

      {/* Modal de Nova/Editar Saída */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
          <ScrollView style={{ flex: 1, padding: 16 }}>
            {/* Header do Modal */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: "bold", color: "#1B4F72" }}>
                {editando ? "Editar Saída" : "Nova Saída"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            {/* Erros */}
            {erros.length > 0 && (
              <View style={{ backgroundColor: "#FEE2E2", borderRadius: 8, padding: 12, marginBottom: 16 }}>
                {erros.map((erro, idx) => (
                  <Text key={idx} style={{ color: "#DC2626", fontSize: 12, marginBottom: 4 }}>
                    • {erro}
                  </Text>
                ))}
              </View>
            )}

            {/* Data */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#1B4F72", marginBottom: 6 }}>Data</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 14,
                }}
                placeholder="YYYY-MM-DD"
                value={formData.data}
                onChangeText={(text) => setFormData({ ...formData, data: text })}
              />
            </View>

            {/* Descrição */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#1B4F72", marginBottom: 6 }}>
                Descrição *
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 14,
                }}
                placeholder="Ex: Compra de peças"
                value={formData.descricao}
                onChangeText={(text) => setFormData({ ...formData, descricao: text })}
              />
            </View>

            {/* Categoria */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#1B4F72", marginBottom: 8 }}>
                Categoria *
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {CATEGORIAS.map((cat) => (
                  <TouchableOpacity
                    key={cat.value}
                    onPress={() => setFormData({ ...formData, categoria: cat.value })}
                    style={{
                      backgroundColor:
                        formData.categoria === cat.value ? "#1B4F72" : "#F3F4F6",
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 8,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Ionicons
                      name={cat.icon as any}
                      size={14}
                      color={formData.categoria === cat.value ? "#fff" : "#1B4F72"}
                    />
                    <Text
                      style={{
                        color: formData.categoria === cat.value ? "#fff" : "#1B4F72",
                        fontSize: 11,
                        fontWeight: "600",
                      }}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Valor */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#1B4F72", marginBottom: 6 }}>
                Valor (R$) *
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 14,
                }}
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={formData.valor?.toString()}
                onChangeText={(text) =>
                  setFormData({ ...formData, valor: parseFloat(text) || 0 })
                }
              />
            </View>

            {/* Forma de Pagamento */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#1B4F72", marginBottom: 8 }}>
                Forma de Pagamento *
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {FORMAS_PAGAMENTO.map((forma) => (
                  <TouchableOpacity
                    key={forma}
                    onPress={() => setFormData({ ...formData, formaPagamento: forma })}
                    style={{
                      backgroundColor:
                        formData.formaPagamento === forma ? "#1B4F72" : "#F3F4F6",
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: formData.formaPagamento === forma ? "#fff" : "#1B4F72",
                        fontSize: 11,
                        fontWeight: "600",
                        textTransform: "capitalize",
                      }}
                    >
                      {forma.replace("_", " ")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Fornecedor */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#1B4F72", marginBottom: 6 }}>
                Fornecedor
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 14,
                }}
                placeholder="Ex: Distribuidora XYZ"
                value={formData.fornecedor}
                onChangeText={(text) => setFormData({ ...formData, fornecedor: text })}
              />
            </View>

            {/* Observações */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#1B4F72", marginBottom: 6 }}>
                Observações
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 14,
                  minHeight: 80,
                  textAlignVertical: "top",
                }}
                placeholder="Notas adicionais..."
                multiline
                value={formData.observacoes}
                onChangeText={(text) => setFormData({ ...formData, observacoes: text })}
              />
            </View>

            {/* Botões */}
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={{
                  flex: 1,
                  backgroundColor: "#F3F4F6",
                  paddingVertical: 12,
                  borderRadius: 8,
                }}
              >
                <Text style={{ textAlign: "center", color: "#1B4F72", fontWeight: "600" }}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={salvarSaida}
                style={{
                  flex: 1,
                  backgroundColor: "#1B4F72",
                  paddingVertical: 12,
                  borderRadius: 8,
                }}
              >
                <Text style={{ textAlign: "center", color: "#fff", fontWeight: "600" }}>
                  {editando ? "Atualizar" : "Registrar"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
