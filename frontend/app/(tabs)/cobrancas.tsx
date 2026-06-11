import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
  ToastAndroid,
  Platform,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getCobrancas, deleteCobranca, updateCobranca, getRecibos, saveRecibo, deleteRecibo, Recibo, getEmpresa } from "@/lib/store";
import { gerarReciboPDF } from "@/lib/pdf-generator";
import { PagamentoPartialModal } from "@/components/pagamento-parcial-modal";
import { MetodoPagamentoModal } from "@/components/metodo-pagamento-modal";
import { useFocusEffect } from "expo-router";

const STATUS_CORES: Record<string, { bg: string; text: string; icon: string }> = {
  pago: { bg: "#D1FAE5", text: "#065F46", icon: "checkmark-circle" },
  parcial: { bg: "#FEF3C7", text: "#92400E", icon: "alert-circle" },
  pendente: { bg: "#DBEAFE", text: "#0C4A6E", icon: "clock" },
  vencido: { bg: "#FEE2E2", text: "#7F1D1D", icon: "close-circle" },
  cancelado: { bg: "#F3F4F6", text: "#374151", icon: "ban" },
};

export default function CobrancasScreen() {
  const router = useRouter();
  const colors = useColors();
  const [cobrancas, setCobrancas] = React.useState<any[]>([]);
  const [recibosGerados, setRecibosGerados] = React.useState<Recibo[]>([]);
  const [abaSelecionada, setAbaSelecionada] = React.useState<"cobracas" | "recibos">("cobracas");
  const [filtroStatus, setFiltroStatus] = React.useState<string>("todas");
  const [refreshing, setRefreshing] = React.useState(false);
  const [cobrancaSelecionada, setCobrancaSelecionada] = React.useState<any>(null);
  const [modalPagamentoVisivel, setModalPagamentoVisivel] = React.useState(false);
  const [modalMetodoPagamentoVisivel, setModalMetodoPagamentoVisivel] = React.useState(false);
  const [cobrancaParaEmitirRecibo, setCobrancaParaEmitirRecibo] = React.useState<any>(null);

  // Carregar cobranças
  const carregarCobrancas = async () => {
    try {
      const dados = await getCobrancas();
      setCobrancas(dados);
    } catch (error) {
      console.error("Erro ao carregar cobranças:", error);
    }
  };

  // Carregar recibos
  const carregarRecibos = async () => {
    try {
      const dados = await getRecibos();
      setRecibosGerados(dados);
    } catch (error) {
      console.error("Erro ao carregar recibos:", error);
    }
  };

  React.useEffect(() => {
    carregarCobrancas();
    carregarRecibos();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      carregarCobrancas();
      carregarRecibos();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await carregarCobrancas();
    await carregarRecibos();
    setRefreshing(false);
  };

  // Função para compartilhar recibo em texto
  const compartilharReciboTexto = async (recibo: Recibo) => {
    try {
      const dataPagamento = new Date(recibo.dataPagamento);
      const dataFormatada = dataPagamento.toLocaleDateString("pt-BR");
      const saldoRestante = recibo.valorTotal - recibo.valorRecebido;
      
      const textoRecibo = `RECIBO DE PAGAMENTO\n\nRecibo Nº: ${recibo.id}\nData: ${dataFormatada}\n\nEMPRESA\nNome: ${recibo.empresaNome}\n${recibo.empresaCNPJ ? `CNPJ: ${recibo.empresaCNPJ}\n` : ""}${recibo.empresaTelefone ? `Telefone: ${recibo.empresaTelefone}\n` : ""}\nCLIENTE\nNome: ${recibo.clienteNome}\n${recibo.clienteTelefone ? `Telefone: ${recibo.clienteTelefone}\n` : ""}\nDESCRIÇÃO\n${recibo.descricao}\n\nDETALHES DO PAGAMENTO\nValor Total: R$ ${recibo.valorTotal.toFixed(2)}\nValor Pago: R$ ${recibo.valorRecebido.toFixed(2)}\nSaldo Restante: R$ ${saldoRestante.toFixed(2)}\n\nMétodo: ${recibo.metodoPagamento}\n${recibo.observacoes ? `Observações: ${recibo.observacoes}\n` : ""}\nObrigado pelo pagamento!`;
      
      if (Platform.OS === "web") {
        Alert.alert("Recibo", textoRecibo);
      } else {
        await Share.share({
          message: textoRecibo,
          title: `Recibo - ${recibo.clienteNome}`,
        });
      }
      if (Platform.OS !== "web") {
        ToastAndroid.show("Recibo compartilhado!", ToastAndroid.SHORT);
      }
    } catch (error) {
      console.error("Erro ao compartilhar recibo:", error);
    }
  };

  const emitirReciboComMetodo = (cobranca: any) => {
    setCobrancaParaEmitirRecibo(cobranca);
    setModalMetodoPagamentoVisivel(true);
  };

  const emitirRecibo = async (cobranca: any, metodoPagamento: string) => {
    try {
      const empresa = await getEmpresa();
      
      // Criar objeto de recibo
      const novoRecibo: Recibo = {
        id: `recibo_${cobranca.id}_${Date.now()}`,
        cobrancaId: cobranca.id,
        clienteNome: cobranca.clienteNome,
        clienteTelefone: cobranca.clienteTelefone,
        descricao: cobranca.descricao,
        valorTotal: cobranca.valorTotal,
        valorRecebido: cobranca.valorRecebido || cobranca.valorTotal,
        dataPagamento: cobranca.dataPagamento || new Date().toISOString().split("T")[0],
        dataEmissao: new Date().toISOString().split("T")[0],
        metodoPagamento: metodoPagamento || "Não especificado",
        observacoes: cobranca.observacoes,
        empresaNome: empresa?.nome || "Polar Soluções",
        empresaCNPJ: empresa?.cnpj,
        empresaTelefone: empresa?.telefone,
        criadoEm: new Date().toISOString(),
      };
      
      // Salvar recibo
      await saveRecibo(novoRecibo);
      
      // Tentar gerar PDF
      try {
        await gerarReciboPDF({
          id: novoRecibo.id,
          clienteNome: novoRecibo.clienteNome,
          clienteTelefone: novoRecibo.clienteTelefone,
          descricao: novoRecibo.descricao,
          valorTotal: novoRecibo.valorTotal,
          valorPago: novoRecibo.valorRecebido,
          dataPagamento: novoRecibo.dataPagamento,
          metodoPagamento: novoRecibo.metodoPagamento,
          observacoes: novoRecibo.observacoes,
          empresaNome: novoRecibo.empresaNome,
          empresaCNPJ: novoRecibo.empresaCNPJ,
          empresaTelefone: novoRecibo.empresaTelefone,
        });
      } catch (pdfError) {
        console.warn("[Recibo PDF] Erro ao gerar PDF:", pdfError);
        Alert.alert(
          "PDF não gerado",
          "O recibo foi salvo no app, mas houve um erro ao gerar o PDF: " + (pdfError as any)?.message,
        );
      }
      
      // Recarregar recibos
      const recibos = await getRecibos();
      setRecibosGerados(recibos);
      
      // Limpar estado
      setCobrancaParaEmitirRecibo(null);
      
      Alert.alert("Sucesso", "Recibo emitido e salvo com sucesso!");
    } catch (error) {
      console.error("Erro ao emitir recibo:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      Alert.alert("Erro", `Não foi possível emitir o recibo: ${errorMsg}`);
    }
  };

  const deletarCobranca = async (id: string) => {
    Alert.alert("Confirmar", "Deseja deletar esta cobrança?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Deletar",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteCobranca(id);
            await carregarCobrancas();
          } catch (error) {
            console.error("Erro ao deletar:", error);
            Alert.alert("Erro", "Não foi possível deletar a cobrança");
          }
        },
      },
    ]);
  };

  const registrarTotalPago = async (cobranca: any) => {
    Alert.alert(
      "Confirmar",
      `Registrar pagamento total de R$ ${cobranca.valorTotal.toFixed(2)}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            try {
              await updateCobranca(cobranca.id, {
                valorRecebido: cobranca.valorTotal,
                status: "pago",
              });
              await carregarCobrancas();
              Alert.alert("Sucesso", "Pagamento total registrado!");
            } catch (error) {
              console.error("Erro ao registrar pagamento total:", error);
              Alert.alert("Erro", "Não foi possível registrar o pagamento");
            }
          },
        },
      ]
    );
  };

  const abrirModalPagamento = (cobranca: any) => {
    setCobrancaSelecionada(cobranca);
    setModalPagamentoVisivel(true);
  };

  const filtrarCobrancas = () => {
    if (filtroStatus === "todas") return cobrancas;
    return cobrancas.filter((c) => c.status === filtroStatus);
  };

  const renderCobranca = ({ item }: { item: any }) => (
    <View className="bg-surface rounded-lg p-4 mb-3 border border-border">
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text className="text-lg font-bold text-foreground">{item.clienteNome}</Text>
          <Text className="text-sm text-muted">{item.descricao}</Text>
        </View>
        <View
          className="px-3 py-1 rounded-full"
          style={{ backgroundColor: STATUS_CORES[item.status]?.bg }}
        >
          <Text style={{ color: STATUS_CORES[item.status]?.text }} className="text-xs font-semibold">
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>

      <View className="mb-4">
        <Text className="text-sm text-muted">Valor: R$ {item.valorTotal.toFixed(2)}</Text>
        {item.valorRecebido > 0 && (
          <Text className="text-sm text-success">✓ Recebido: R$ {item.valorRecebido.toFixed(2)}</Text>
        )}
        {item.valorRecebido < item.valorTotal && (
          <Text className="text-sm text-error">Pendente: R$ {(item.valorTotal - item.valorRecebido).toFixed(2)}</Text>
        )}
        <Text className="text-xs text-muted mt-1">Vencimento: {item.dataPagamento}</Text>
      </View>

      {/* Botões com design moderno */}
      <View className="gap-2 mt-2">
        {/* Primeira linha: Parcial, Total Pago, Recibo */}
        <View className="flex-row gap-2">
          {/* Botão Pagamento Parcial */}
          <TouchableOpacity
            onPress={() => {
              try {
                abrirModalPagamento(item);
              } catch (error) {
                console.error("Erro ao abrir modal:", error);
                Alert.alert("Erro", "Não foi possível abrir o modal de pagamento");
              }
            }}
            className="flex-1 bg-blue-500 rounded-xl p-3 items-center justify-center flex-row gap-2 shadow-md active:scale-95"
            style={{
              shadowColor: "#0066ff",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 5,
            }}
          >
            <Ionicons name="create-outline" size={20} color="white" />
            <Text className="text-white font-bold text-sm">Parcial</Text>
          </TouchableOpacity>

          {/* Botão Total Pago */}
          <TouchableOpacity
            onPress={() => {
              try {
                registrarTotalPago(item);
              } catch (error) {
                console.error("Erro ao registrar total pago:", error);
                Alert.alert("Erro", "Não foi possível registrar o pagamento total");
              }
            }}
            className="flex-1 bg-emerald-600 rounded-xl p-3 items-center justify-center flex-row gap-2 shadow-md active:scale-95"
            style={{
              shadowColor: "#059669",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 5,
            }}
          >
            <Ionicons name="checkmark-done-outline" size={20} color="white" />
            <Text className="text-white font-bold text-sm">Total Pago</Text>
          </TouchableOpacity>

          {/* Botão Emitir Recibo */}
          <TouchableOpacity
            onPress={() => {
              try {
                emitirReciboComMetodo(item);
              } catch (error) {
                console.error("Erro ao emitir recibo:", error);
                Alert.alert("Erro", "Não foi possível emitir o recibo");
              }
            }}
            className="flex-1 bg-green-500 rounded-xl p-3 items-center justify-center flex-row gap-2 shadow-md active:scale-95"
            style={{
              shadowColor: "#22c55e",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 5,
            }}
          >
            <Ionicons name="document-text-outline" size={20} color="white" />
            <Text className="text-white font-bold text-sm">Recibo</Text>
          </TouchableOpacity>
        </View>

        {/* Segunda linha: Deletar */}
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => {
              try {
                deletarCobranca(item.id);
              } catch (error) {
                console.error("Erro ao deletar:", error);
                Alert.alert("Erro", "Não foi possível deletar a cobrança");
              }
            }}
            className="flex-1 bg-red-500 rounded-xl p-3 items-center justify-center shadow-md active:scale-95"
            style={{
              shadowColor: "#ef4444",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 5,
            }}
          >
            <Ionicons name="trash-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderRecibo = ({ item }: { item: Recibo }) => (
    <View className="bg-surface rounded-lg p-4 mb-3 border border-border">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-lg font-bold text-foreground">{item.clienteNome}</Text>
          <Text className="text-sm text-muted">{item.descricao}</Text>
        </View>
      </View>

      <View className="mb-4">
        <Text className="text-sm text-success">✓ Valor Recebido: R$ {item.valorRecebido.toFixed(2)}</Text>
        <Text className="text-xs text-muted mt-1">Data: {item.dataEmissao}</Text>
      </View>

      <View className="flex-row gap-2">
        <TouchableOpacity
          onPress={() => {
            try {
              compartilharReciboTexto(item);
            } catch (error) {
              console.error("Erro ao compartilhar:", error);
              Alert.alert("Erro", "Não foi possível compartilhar o recibo");
            }
          }}
          className="flex-1 bg-purple-500 rounded-xl p-3 items-center justify-center flex-row gap-2 shadow-md active:scale-95"
          style={{
            shadowColor: "#a855f7",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <Ionicons name="share-social-outline" size={20} color="white" />
          <Text className="text-white font-bold">Compartilhar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              "Deletar Recibo",
              "Tem certeza que deseja deletar este recibo?",
              [
                { text: "Cancelar", onPress: () => {}, style: "cancel" },
                {
                  text: "Deletar",
                  onPress: async () => {
                    try {
                      await deleteRecibo(item.id);
                      await carregarRecibos();
                      ToastAndroid.show("Recibo deletado!", ToastAndroid.SHORT);
                    } catch (error) {
                      console.error("Erro ao deletar recibo:", error);
                      Alert.alert("Erro", "Não foi possível deletar o recibo");
                    }
                  },
                  style: "destructive",
                },
              ]
            );
          }}
          className="bg-red-500 rounded-xl p-3 items-center justify-center shadow-md active:scale-95"
          style={{
            shadowColor: "#ef4444",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 5,
            width: 50,
          }}
        >
          <Ionicons name="trash-outline" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScreenContainer>
      <SafeAreaView edges={["top"]} className="flex-1">
        <View className="px-4 py-4 border-b border-border">
          <Text className="text-3xl font-bold text-primary">Cobranças</Text>
          <Text className="text-sm text-muted">Gerencie cobranças e envie pelo WhatsApp</Text>
        </View>

        {/* Abas */}
        <View className="flex-row border-b border-border bg-background">
          <TouchableOpacity
            onPress={() => setAbaSelecionada("cobracas")}
            className={`flex-1 py-3 items-center border-b-2 ${
              abaSelecionada === "cobracas" ? "border-primary" : "border-transparent"
            }`}
          >
            <Text
              className={`font-semibold ${
                abaSelecionada === "cobracas" ? "text-primary" : "text-muted"
              }`}
            >
              Cobranças ({cobrancas.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setAbaSelecionada("recibos")}
            className={`flex-1 py-3 items-center border-b-2 ${
              abaSelecionada === "recibos" ? "border-primary" : "border-transparent"
            }`}
          >
            <Text
              className={`font-semibold ${
                abaSelecionada === "recibos" ? "text-primary" : "text-muted"
              }`}
            >
              Recibos ({recibosGerados.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Conteúdo */}
        {abaSelecionada === "cobracas" ? (
          <FlatList
            data={filtrarCobrancas()}
            renderItem={renderCobranca}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View className="items-center justify-center py-8">
                <Text className="text-muted">Nenhuma cobrança encontrada</Text>
              </View>
            }
          />
        ) : (
          <FlatList
            data={recibosGerados}
            renderItem={renderRecibo}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            ListEmptyComponent={
              <View className="items-center justify-center py-8">
                <Text className="text-muted">Nenhum recibo emitido</Text>
              </View>
            }
          />
        )}

        {/* Modal de Pagamento */}
        {cobrancaSelecionada && (
          <PagamentoPartialModal
            visible={modalPagamentoVisivel}
            cobranca={cobrancaSelecionada}
            onClose={() => {
              setModalPagamentoVisivel(false);
              carregarCobrancas();
            }}
          />
        )}

        {/* Modal de Método de Pagamento */}
        {cobrancaParaEmitirRecibo && (
          <MetodoPagamentoModal
            visible={modalMetodoPagamentoVisivel}
            onClose={() => {
              setModalMetodoPagamentoVisivel(false);
              setCobrancaParaEmitirRecibo(null);
            }}
            onSelect={(metodo) => {
              emitirRecibo(cobrancaParaEmitirRecibo, metodo);
              setModalMetodoPagamentoVisivel(false);
            }}
          />
        )}
      </SafeAreaView>
    </ScreenContainer>
  );
}
