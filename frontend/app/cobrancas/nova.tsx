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
import { useRouter } from "expo-router";
import { getClientes, saveCobranca } from "@/lib/store";
import { Cliente } from "@/lib/store";
import { Cobranca, FormaPagamentoCobranca, StatusCobranca } from "@/lib/cobranca-types";
import { useCobrancaContext } from "@/lib/cobranca-context";
import { useColors } from "@/hooks/use-colors";
import { ScreenContainer } from "@/components/screen-container";

const FORMAS_PAGAMENTO: { label: string; value: FormaPagamentoCobranca; icon: string }[] = [
  { label: "PIX", value: "pix", icon: "qr-code" },
  { label: "Boleto", value: "boleto", icon: "document-text" },
  { label: "Cartão de Crédito", value: "cartao_credito", icon: "card" },
  { label: "Dinheiro", value: "dinheiro", icon: "cash" },
  { label: "Transferência", value: "transferencia", icon: "swap-horizontal" },
];

export default function NovaCobrancaScreen() {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [modalClientesAberta, setModalClientesAberta] = useState(false);
  const [busca, setBusca] = useState("");

  const [formData, setFormData] = useState({
    clienteId: "",
    clienteNome: "",
    clienteTelefone: "",
    valorTotal: "0",
    dataVencimento: new Date().toISOString().split("T")[0],
    formaPagamento: "pix" as FormaPagamentoCobranca,
    descricao: "",
    juros: "0",
    multa: "0",
    desconto: "0",
    orcamentoNumero: "",
    osNumero: "",
    observacoes: "",
  });

  const [erros, setErros] = useState<string[]>([]);
  const { setCobrancaCriada } = useCobrancaContext();
  const colors = useColors();

  useEffect(() => {
    carregarClientes();
  }, []);

  const carregarClientes = async () => {
    const dados = await getClientes();
    setClientes(dados);
  };

  const selecionarCliente = (cliente: Cliente) => {
    setClienteSelecionado(cliente);
    setFormData({
      ...formData,
      clienteId: cliente.id,
      clienteNome: cliente.nome,
      clienteTelefone: cliente.telefone,
    });
    setModalClientesAberta(false);
    setBusca("");
  };

  const clientesFiltrados = clientes.filter(
    (c) =>
      c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      c.telefone.includes(busca)
  );

  const validarFormulario = (): boolean => {
    const novosErros: string[] = [];

    if (!formData.clienteId) novosErros.push("Cliente é obrigatório");
    if (!formData.valorTotal || parseFloat(formData.valorTotal) <= 0)
      novosErros.push("Valor deve ser maior que zero");
    if (!formData.dataVencimento) novosErros.push("Data de vencimento é obrigatória");
    if (!formData.descricao.trim()) novosErros.push("Descrição é obrigatória");
    if (!formData.clienteTelefone) novosErros.push("Telefone é obrigatório");

    setErros(novosErros);
    return novosErros.length === 0;
  };

  const salvarCobranca = async () => {
    if (!validarFormulario()) return;

    const novaCobranca: Cobranca = {
      id: `cobranca_${Date.now()}`,
      clienteId: formData.clienteId,
      clienteNome: formData.clienteNome,
      clienteTelefone: formData.clienteTelefone,
      valorTotal: parseFloat(formData.valorTotal),
      valorRecebido: 0,
      valorPendente: parseFloat(formData.valorTotal),
      juros: parseFloat(formData.juros) || 0,
      multa: parseFloat(formData.multa) || 0,
      desconto: parseFloat(formData.desconto) || 0,
      dataCriacao: new Date().toISOString().split("T")[0],
      dataVencimento: formData.dataVencimento,
      descricao: formData.descricao,
      formaPagamento: formData.formaPagamento,
      status: "pendente" as StatusCobranca,
      orcamentoNumero: formData.orcamentoNumero ? parseInt(formData.orcamentoNumero) : undefined,
      osNumero: formData.osNumero ? parseInt(formData.osNumero) : undefined,
      mensagensEnviadas: 0,
      observacoes: formData.observacoes,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    };

    // Salvar cobrança no contexto global e no store
    await saveCobranca(novaCobranca);
    setCobrancaCriada(novaCobranca);
    Alert.alert("Sucesso", "Cobrança criada! Próximo passo: enviar pelo WhatsApp", [
      {
        text: "OK",
        onPress: () => {
          // Navegar para tela de preview de mensagem WhatsApp
          setTimeout(() => {
            router.push("/cobrancas/enviar" as any);
          }, 100);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" }}>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: "#1B4F72", marginBottom: 4 }}>
            Nova Cobrança
          </Text>
          <Text style={{ fontSize: 12, color: "#6B7280" }}>
            Crie uma cobrança e envie pelo WhatsApp
          </Text>
        </View>

        <View style={{ padding: 16, gap: 16 }}>
          {/* Erros */}
          {erros.length > 0 && (
            <View style={{ backgroundColor: "#FEE2E2", borderRadius: 8, padding: 12 }}>
              {erros.map((erro, idx) => (
                <Text key={idx} style={{ color: "#DC2626", fontSize: 12, marginBottom: 4 }}>
                  • {erro}
                </Text>
              ))}
            </View>
          )}

          {/* Seleção de Cliente */}
          <View>
            <Text style={{ fontSize: 12, fontWeight: "600", color: "#1B4F72", marginBottom: 8 }}>
              Cliente *
            </Text>
            <TouchableOpacity
              onPress={() => setModalClientesAberta(true)}
              style={{
                borderWidth: 1,
                borderColor: "#e5e7eb",
                borderRadius: 8,
                padding: 12,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View>
                <Text style={{ fontSize: 14, color: clienteSelecionado ? "#111827" : "#9ca3af" }}>
                  {clienteSelecionado ? clienteSelecionado.nome : "Selecione um cliente"}
                </Text>
                {clienteSelecionado && (
                  <Text style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>
                    {clienteSelecionado.telefone}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Valor */}
          <View>
            <Text style={{ fontSize: 12, fontWeight: "600", color: "#1B4F72", marginBottom: 8 }}>
              Valor da Cobrança (R$) *
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
              value={formData.valorTotal}
              onChangeText={(text) => setFormData({ ...formData, valorTotal: text })}
            />
          </View>

          {/* Data de Vencimento */}
          <View>
            <Text style={{ fontSize: 12, fontWeight: "600", color: "#1B4F72", marginBottom: 8 }}>
              Data de Vencimento *
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: "#e5e7eb",
                borderRadius: 8,
                padding: 12,
                fontSize: 14,
              }}
              placeholder="YYYY-MM-DD"
              value={formData.dataVencimento}
              onChangeText={(text) => setFormData({ ...formData, dataVencimento: text })}
            />
          </View>

          {/* Forma de Pagamento */}
          <View>
            <Text style={{ fontSize: 12, fontWeight: "600", color: "#1B4F72", marginBottom: 8 }}>
              Forma de Pagamento *
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {FORMAS_PAGAMENTO.map((forma) => (
                <TouchableOpacity
                  key={forma.value}
                  onPress={() => setFormData({ ...formData, formaPagamento: forma.value })}
                  style={{
                    backgroundColor:
                      formData.formaPagamento === forma.value ? "#1B4F72" : "#F3F4F6",
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Ionicons
                    name={forma.icon as any}
                    size={14}
                    color={formData.formaPagamento === forma.value ? "#fff" : "#1B4F72"}
                  />
                  <Text
                    style={{
                      color: formData.formaPagamento === forma.value ? "#fff" : "#1B4F72",
                      fontSize: 11,
                      fontWeight: "600",
                    }}
                  >
                    {forma.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Descrição */}
          <View>
            <Text style={{ fontSize: 12, fontWeight: "600", color: "#1B4F72", marginBottom: 8 }}>
              Descrição *
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
              placeholder="Ex: Serviço de manutenção"
              multiline
              value={formData.descricao}
              onChangeText={(text) => setFormData({ ...formData, descricao: text })}
            />
          </View>

          {/* Juros, Multa, Desconto */}
          <View style={{ gap: 12 }}>
            <View>
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#1B4F72", marginBottom: 8 }}>
                Juros (%) - Opcional
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
                value={formData.juros}
                onChangeText={(text) => setFormData({ ...formData, juros: text })}
              />
            </View>

            <View>
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#1B4F72", marginBottom: 8 }}>
                Multa (R$) - Opcional
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
                value={formData.multa}
                onChangeText={(text) => setFormData({ ...formData, multa: text })}
              />
            </View>

            <View>
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#1B4F72", marginBottom: 8 }}>
                Desconto (R$) - Opcional
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
                value={formData.desconto}
                onChangeText={(text) => setFormData({ ...formData, desconto: text })}
              />
            </View>
          </View>

          {/* Referências */}
          <View style={{ gap: 12 }}>
            <View>
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#1B4F72", marginBottom: 8 }}>
                Número do Orçamento - Opcional
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 14,
                }}
                placeholder="Ex: 001"
                keyboardType="number-pad"
                value={formData.orcamentoNumero}
                onChangeText={(text) => setFormData({ ...formData, orcamentoNumero: text })}
              />
            </View>

            <View>
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#1B4F72", marginBottom: 8 }}>
                Número da OS - Opcional
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 14,
                }}
                placeholder="Ex: 001"
                keyboardType="number-pad"
                value={formData.osNumero}
                onChangeText={(text) => setFormData({ ...formData, osNumero: text })}
              />
            </View>
          </View>

          {/* Observações */}
          <View>
            <Text style={{ fontSize: 12, fontWeight: "600", color: "#1B4F72", marginBottom: 8 }}>
              Observações - Opcional
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: "#e5e7eb",
                borderRadius: 8,
                padding: 12,
                fontSize: 14,
                minHeight: 60,
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
              onPress={salvarCobranca}
              style={{
                flex: 1,
                backgroundColor: "#1B4F72",
                paddingVertical: 12,
                borderRadius: 8,
              }}
            >
              <Text style={{ textAlign: "center", color: "#fff", fontWeight: "600" }}>
                Criar Cobrança
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Modal de Seleção de Cliente */}
      <Modal visible={modalClientesAberta} animationType="slide" transparent>
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: "bold", color: "#1B4F72" }}>
                Selecionar Cliente
              </Text>
              <TouchableOpacity onPress={() => setModalClientesAberta(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#F3F4F6",
                borderRadius: 8,
                paddingHorizontal: 12,
              }}
            >
              <Ionicons name="search" size={18} color="#6B7280" />
              <TextInput
                style={{ flex: 1, padding: 10, fontSize: 14 }}
                placeholder="Buscar cliente..."
                value={busca}
                onChangeText={setBusca}
              />
            </View>
          </View>

          <FlatList
            data={clientesFiltrados}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, gap: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => selecionarCliente(item)}
                style={{
                  backgroundColor: "#F9FAFB",
                  borderRadius: 8,
                  padding: 12,
                  borderLeftWidth: 3,
                  borderLeftColor: "#1B4F72",
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#111827", marginBottom: 4 }}>
                  {item.nome}
                </Text>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <Text style={{ fontSize: 11, color: "#6B7280" }}>📞 {item.telefone}</Text>
                  {item.email && (
                    <Text style={{ fontSize: 11, color: "#6B7280" }}>📧 {item.email}</Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 40 }}>
                <Ionicons name="person-outline" size={48} color="#d1d5db" />
                <Text style={{ marginTop: 12, color: "#9ca3af", fontSize: 14 }}>
                  Nenhum cliente encontrado
                </Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
