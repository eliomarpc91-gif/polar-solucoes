import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getEntradasAutomaticas, getSaidasManuais, getClientes } from "@/lib/store";
import {
  consolidarTransacoes,
  filtrarEntradas,
  filtrarSaidas,
} from "@/lib/financeiro-automatico-utils";
import {
  EntradaFinanceira,
  SaidaFinanceira,
  TransacaoConsolidada,
  FiltrosFinanceiros,
  CategoriaEntrada,
  CategoriaSaida,
  FormaPagamento,
} from "@/lib/financeiro-automatico-types";
import { Cliente } from "@/lib/store";

const CATEGORIAS_ENTRADA: CategoriaEntrada[] = [
  "servico",
  "material",
  "manutencao",
  "garantia",
  "outro",
];

const CATEGORIAS_SAIDA: CategoriaSaida[] = [
  "material",
  "pecas",
  "frete",
  "transporte",
  "alimentacao",
  "ferramentas",
  "funcionario",
  "aluguel",
  "agua",
  "luz",
  "aplicativo",
  "impostos",
  "despesas_gerais",
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

export default function TransacoesScreen() {
  const [transacoes, setTransacoes] = useState<TransacaoConsolidada[]>([]);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filtros, setFiltros] = useState<FiltrosFinanceiros>({
    periodo: "mes",
    tipo: undefined,
    busca: "",
  });

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [filtros]);

  const carregarDados = async () => {
    const entradasData = await getEntradasAutomaticas();
    const saidasData = await getSaidasManuais();
    const clientesData = await getClientes();
    setClientes(clientesData);

    const transacoesConsolidadas = consolidarTransacoes(entradasData, saidasData);
    setTransacoes(transacoesConsolidadas);
  };

  const aplicarFiltros = async () => {
    const entradasData = await getEntradasAutomaticas();
    const saidasData = await getSaidasManuais();

    let entradasFiltradas = entradasData;
    let saidasFiltradas = saidasData;

    // Filtro por período
    const hoje = new Date();
    let dataInicio = new Date();

    if (filtros.periodo === "dia") {
      dataInicio.setDate(hoje.getDate());
    } else if (filtros.periodo === "semana") {
      dataInicio.setDate(hoje.getDate() - 7);
    } else if (filtros.periodo === "mes") {
      dataInicio.setMonth(hoje.getMonth());
      dataInicio.setDate(1);
    } else if (filtros.periodo === "ano") {
      dataInicio.setFullYear(hoje.getFullYear());
      dataInicio.setMonth(0);
      dataInicio.setDate(1);
    }

    const dataInicioStr = dataInicio.toISOString().split("T")[0];
    const dataFimStr = hoje.toISOString().split("T")[0];

    const filtrosComPeriodo: FiltrosFinanceiros = {
      ...filtros,
      dataInicio: dataInicioStr,
      dataFim: dataFimStr,
    };

    if (filtros.tipo !== "saida") {
      entradasFiltradas = filtrarEntradas(entradasData, filtrosComPeriodo);
    } else {
      entradasFiltradas = [];
    }

    if (filtros.tipo !== "entrada") {
      saidasFiltradas = filtrarSaidas(saidasData, filtrosComPeriodo);
    } else {
      saidasFiltradas = [];
    }

    const transacoesConsolidadas = consolidarTransacoes(
      entradasFiltradas,
      saidasFiltradas
    );
    setTransacoes(transacoesConsolidadas);
  };

  const resetarFiltros = () => {
    setFiltros({
      periodo: "mes",
      tipo: undefined,
      busca: "",
    });
  };

  const totalEntradas = transacoes
    .filter((t) => t.tipo === "entrada")
    .reduce((sum, t) => sum + t.valor, 0);

  const totalSaidas = transacoes
    .filter((t) => t.tipo === "saida")
    .reduce((sum, t) => sum + Math.abs(t.valor), 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" }}>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: "#1B4F72", marginBottom: 12 }}>
            Transações
          </Text>

          {/* Busca */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#F3F4F6",
              borderRadius: 8,
              paddingHorizontal: 12,
              marginBottom: 12,
            }}
          >
            <Ionicons name="search" size={18} color="#6B7280" />
            <TextInput
              style={{ flex: 1, padding: 10, fontSize: 14 }}
              placeholder="Buscar por descrição..."
              value={filtros.busca}
              onChangeText={(text) => setFiltros({ ...filtros, busca: text })}
            />
          </View>

          {/* Botão de Filtros */}
          <TouchableOpacity
            onPress={() => setFiltrosAbertos(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              backgroundColor: "#1B4F72",
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 8,
            }}
          >
            <Ionicons name="funnel" size={16} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}>
              Filtros
            </Text>
          </TouchableOpacity>
        </View>

        {/* Resumo */}
        <View style={{ padding: 16, gap: 8, backgroundColor: "#F9FAFB", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <View>
              <Text style={{ fontSize: 11, color: "#6B7280", marginBottom: 2 }}>Entradas</Text>
              <Text style={{ fontSize: 16, fontWeight: "bold", color: "#16A34A" }}>
                +R$ {totalEntradas.toFixed(2)}
              </Text>
            </View>
            <View>
              <Text style={{ fontSize: 11, color: "#6B7280", marginBottom: 2 }}>Saídas</Text>
              <Text style={{ fontSize: 16, fontWeight: "bold", color: "#EF4444" }}>
                -R$ {totalSaidas.toFixed(2)}
              </Text>
            </View>
            <View>
              <Text style={{ fontSize: 11, color: "#6B7280", marginBottom: 2 }}>Saldo</Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "bold",
                  color: totalEntradas - totalSaidas >= 0 ? "#16A34A" : "#EF4444",
                }}
              >
                R$ {(totalEntradas - totalSaidas).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Lista de Transações */}
        <FlatList
          data={transacoes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          renderItem={({ item }) => (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#F9FAFB",
                borderRadius: 8,
                padding: 12,
                borderLeftWidth: 3,
                borderLeftColor: item.tipo === "entrada" ? "#16A34A" : "#EF4444",
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#111827", marginBottom: 4 }}>
                  {item.descricao}
                </Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Text style={{ fontSize: 11, color: "#6B7280" }}>
                    {new Date(item.data).toLocaleDateString("pt-BR")}
                  </Text>
                  {item.clienteNome && (
                    <Text style={{ fontSize: 11, color: "#6B7280" }}>
                      {item.clienteNome}
                    </Text>
                  )}
                </View>
              </View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "bold",
                  color: item.tipo === "entrada" ? "#16A34A" : "#EF4444",
                }}
              >
                {item.tipo === "entrada" ? "+" : "-"}R$ {Math.abs(item.valor).toFixed(2)}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 40 }}>
              <Ionicons name="swap-horizontal-outline" size={48} color="#d1d5db" />
              <Text style={{ marginTop: 12, color: "#9ca3af", fontSize: 14 }}>
                Nenhuma transação encontrada
              </Text>
            </View>
          }
        />
      </View>

      {/* Modal de Filtros */}
      <Modal visible={filtrosAbertos} animationType="slide" transparent>
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
          <ScrollView style={{ flex: 1, padding: 16 }}>
            {/* Header */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: "bold", color: "#1B4F72" }}>
                Filtros
              </Text>
              <TouchableOpacity onPress={() => setFiltrosAbertos(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            {/* Período */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#1B4F72", marginBottom: 8 }}>
                Período
              </Text>
              <View style={{ gap: 8 }}>
                {(["dia", "semana", "mes", "ano"] as const).map((periodo) => (
                  <TouchableOpacity
                    key={periodo}
                    onPress={() => setFiltros({ ...filtros, periodo })}
                    style={{
                      backgroundColor:
                        filtros.periodo === periodo ? "#1B4F72" : "#F3F4F6",
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: filtros.periodo === periodo ? "#fff" : "#1B4F72",
                        fontWeight: "600",
                        textTransform: "capitalize",
                      }}
                    >
                      {periodo === "dia"
                        ? "Hoje"
                        : periodo === "semana"
                          ? "Última Semana"
                          : periodo === "mes"
                            ? "Este Mês"
                            : "Este Ano"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Tipo */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#1B4F72", marginBottom: 8 }}>
                Tipo
              </Text>
              <View style={{ gap: 8 }}>
                <TouchableOpacity
                  onPress={() => setFiltros({ ...filtros, tipo: undefined })}
                  style={{
                    backgroundColor: filtros.tipo === undefined ? "#1B4F72" : "#F3F4F6",
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                  }}
                >
                  <Text
                    style={{
                      color: filtros.tipo === undefined ? "#fff" : "#1B4F72",
                      fontWeight: "600",
                    }}
                  >
                    Todos
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setFiltros({ ...filtros, tipo: "entrada" })}
                  style={{
                    backgroundColor:
                      filtros.tipo === "entrada" ? "#16A34A" : "#F3F4F6",
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                  }}
                >
                  <Text
                    style={{
                      color: filtros.tipo === "entrada" ? "#fff" : "#1B4F72",
                      fontWeight: "600",
                    }}
                  >
                    Entradas
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setFiltros({ ...filtros, tipo: "saida" })}
                  style={{
                    backgroundColor: filtros.tipo === "saida" ? "#EF4444" : "#F3F4F6",
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                  }}
                >
                  <Text
                    style={{
                      color: filtros.tipo === "saida" ? "#fff" : "#1B4F72",
                      fontWeight: "600",
                    }}
                  >
                    Saídas
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Botões */}
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={resetarFiltros}
                style={{
                  flex: 1,
                  backgroundColor: "#F3F4F6",
                  paddingVertical: 12,
                  borderRadius: 8,
                }}
              >
                <Text style={{ textAlign: "center", color: "#1B4F72", fontWeight: "600" }}>
                  Limpar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setFiltrosAbertos(false)}
                style={{
                  flex: 1,
                  backgroundColor: "#1B4F72",
                  paddingVertical: 12,
                  borderRadius: 8,
                }}
              >
                <Text style={{ textAlign: "center", color: "#fff", fontWeight: "600" }}>
                  Aplicar
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
