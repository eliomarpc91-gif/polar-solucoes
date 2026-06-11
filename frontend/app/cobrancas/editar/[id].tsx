import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { getCobrancas, updateCobranca } from "@/lib/store";

export default function EditarCobrancaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [clienteNome, setClienteNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [valorTotal, setValorTotal] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("pix");
  const [descricao, setDescricao] = useState("");
  const [juros, setJuros] = useState("0");
  const [multa, setMulta] = useState("0");
  const [desconto, setDesconto] = useState("0");
  const [status, setStatus] = useState("pendente");
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    carregarCobranca();
  }, [id]);

  const carregarCobranca = async () => {
    try {
      if (!id) return;
      const cobrancas = await getCobrancas();
      const cobranca = cobrancas.find((c) => c.id === id);

      if (cobranca) {
        setClienteNome(cobranca.clienteNome || "");
        setTelefone(cobranca.telefone || "");
        setValorTotal(cobranca.valorTotal?.toString() || "");
        setDataVencimento(cobranca.dataVencimento || "");
        setFormaPagamento(cobranca.formaPagamento || "pix");
        setDescricao(cobranca.descricao || "");
        setJuros(cobranca.juros?.toString() || "0");
        setMulta(cobranca.multa?.toString() || "0");
        setDesconto(cobranca.desconto?.toString() || "0");
        setStatus(cobranca.status || "pendente");
        setObservacoes(cobranca.observacoes || "");
      }
    } catch (error) {
      console.error("Erro ao carregar cobrança:", error);
      Alert.alert("Erro", "Não foi possível carregar a cobrança");
    } finally {
      setLoading(false);
    }
  };

  const salvarAlteracoes = async () => {
    if (!clienteNome.trim() || !valorTotal.trim() || !dataVencimento.trim()) {
      Alert.alert("Erro", "Preencha todos os campos obrigatórios");
      return;
    }

    setSaving(true);
    try {
      const cobrancaAtualizada = {
        clienteNome,
        telefone,
        valorTotal: parseFloat(valorTotal),
        dataVencimento,
        formaPagamento,
        descricao,
        juros: parseFloat(juros) || 0,
        multa: parseFloat(multa) || 0,
        desconto: parseFloat(desconto) || 0,
        status,
        observacoes,
      };

      await updateCobranca(id!, cobrancaAtualizada);
      Alert.alert("Sucesso", "Cobrança atualizada com sucesso!");
      router.back();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      Alert.alert("Erro", "Não foi possível salvar as alterações");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ScreenContainer className="flex items-center justify-center">
        <ActivityIndicator size="large" color="#0A7EA4" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}>
        <View className="px-4 py-6">
          {/* Header */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-foreground">Editar Cobrança</Text>
            <Text className="text-sm text-muted mt-1">Atualize os dados da cobrança</Text>
          </View>

          {/* Seção de Cliente */}
          <View className="bg-surface rounded-lg p-4 mb-4">
            <Text className="text-sm font-semibold text-foreground mb-3">Cliente</Text>
            <TextInput
              placeholder="Nome do cliente"
              value={clienteNome}
              onChangeText={setClienteNome}
              className="bg-background border border-border rounded-lg px-3 py-2 text-foreground mb-3"
              placeholderTextColor="#999"
            />
            <TextInput
              placeholder="Telefone/WhatsApp"
              value={telefone}
              onChangeText={setTelefone}
              className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
          </View>

          {/* Seção de Valores */}
          <View className="bg-surface rounded-lg p-4 mb-4">
            <Text className="text-sm font-semibold text-foreground mb-3">Valores</Text>
            <TextInput
              placeholder="Valor da cobrança"
              value={valorTotal}
              onChangeText={setValorTotal}
              className="bg-background border border-border rounded-lg px-3 py-2 text-foreground mb-3"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
            />
            <TextInput
              placeholder="Desconto (opcional)"
              value={desconto}
              onChangeText={setDesconto}
              className="bg-background border border-border rounded-lg px-3 py-2 text-foreground mb-3"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
            />
            <TextInput
              placeholder="Juros (%) - opcional"
              value={juros}
              onChangeText={setJuros}
              className="bg-background border border-border rounded-lg px-3 py-2 text-foreground mb-3"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
            />
            <TextInput
              placeholder="Multa - opcional"
              value={multa}
              onChangeText={setMulta}
              className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
            />
          </View>

          {/* Seção de Pagamento */}
          <View className="bg-surface rounded-lg p-4 mb-4">
            <Text className="text-sm font-semibold text-foreground mb-3">Forma de Pagamento</Text>
            <View className="flex-row flex-wrap gap-2">
              {["pix", "boleto", "cartao", "dinheiro", "transferencia"].map((forma) => (
                <TouchableOpacity
                  key={forma}
                  onPress={() => setFormaPagamento(forma)}
                  className={`px-4 py-2 rounded-lg ${
                    formaPagamento === forma
                      ? "bg-primary"
                      : "bg-background border border-border"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      formaPagamento === forma ? "text-background" : "text-foreground"
                    }`}
                  >
                    {forma.charAt(0).toUpperCase() + forma.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Seção de Datas e Status */}
          <View className="bg-surface rounded-lg p-4 mb-4">
            <Text className="text-sm font-semibold text-foreground mb-3">Data e Status</Text>
            <TextInput
              placeholder="Data de vencimento (YYYY-MM-DD)"
              value={dataVencimento}
              onChangeText={setDataVencimento}
              className="bg-background border border-border rounded-lg px-3 py-2 text-foreground mb-3"
              placeholderTextColor="#999"
            />
            <View className="flex-row gap-2">
              {["pendente", "parcial", "pago", "vencido"].map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setStatus(s)}
                  className={`flex-1 px-3 py-2 rounded-lg ${
                    status === s ? "bg-primary" : "bg-background border border-border"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold text-center ${
                      status === s ? "text-background" : "text-foreground"
                    }`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Seção de Descrição */}
          <View className="bg-surface rounded-lg p-4 mb-4">
            <Text className="text-sm font-semibold text-foreground mb-3">Descrição</Text>
            <TextInput
              placeholder="Descrição da cobrança"
              value={descricao}
              onChangeText={setDescricao}
              className="bg-background border border-border rounded-lg px-3 py-2 text-foreground mb-3"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
            <TextInput
              placeholder="Observações (opcional)"
              value={observacoes}
              onChangeText={setObservacoes}
              className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
              placeholderTextColor="#999"
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Botões de Ação */}
          <View className="flex-row gap-3 mt-6">
            <TouchableOpacity
              onPress={() => router.back()}
              className="flex-1 bg-border rounded-lg py-3"
              disabled={saving}
            >
              <Text className="text-center text-foreground font-semibold">Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={salvarAlteracoes}
              className="flex-1 bg-primary rounded-lg py-3"
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-center text-background font-semibold">Salvar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
