import { useState, useEffect } from "react";
import { ScrollView, Text, View, Pressable, Alert, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getOrcamentos, getOrdens, updateOrcamento, updateOrdem } from "@/lib/store";

interface ItemInadimplente {
  id: string;
  tipo: "orcamento" | "os";
  numero: number;
  clienteNome: string;
  valor: number;
  statusPagamento: "pendente" | "pago" | "parcial";
  dataCriacao: string;
  diasAtraso: number;
}

export default function InadimplenciaListaScreen() {
  const colors = useColors();
  const router = useRouter();
  const [itens, setItens] = useState<ItemInadimplente[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtro, setFiltro] = useState<"todos" | "pendente" | "parcial">("todos");

  useEffect(() => {
    loadInadimplentes();
  }, []);

  const loadInadimplentes = async () => {
    setLoading(true);
    try {
      const orcamentos = await getOrcamentos();
      const ordens = await getOrdens();

      const hoje = new Date();
      const itemsInadimplentes: ItemInadimplente[] = [];

      // Adicionar orçamentos inadimplentes
      orcamentos.forEach((orc) => {
        if (orc.statusPagamento !== "pago") {
          const diasAtraso = Math.floor(
            (hoje.getTime() - new Date(orc.criadoEm).getTime()) / (1000 * 60 * 60 * 24)
          );
          itemsInadimplentes.push({
            id: orc.id,
            tipo: "orcamento",
            numero: orc.numero,
            clienteNome: orc.clienteNome,
            valor: orc.valorTotal,
            statusPagamento: orc.statusPagamento,
            dataCriacao: orc.criadoEm,
            diasAtraso,
          });
        }
      });

      // Adicionar ordens inadimplentes
      ordens.forEach((os) => {
        if (os.statusPagamento !== "pago") {
          const diasAtraso = Math.floor(
            (hoje.getTime() - new Date(os.criadoEm).getTime()) / (1000 * 60 * 60 * 24)
          );
          itemsInadimplentes.push({
            id: os.id,
            tipo: "os",
            numero: os.numero,
            clienteNome: os.clienteNome,
            valor: os.valorTotal,
            statusPagamento: os.statusPagamento,
            dataCriacao: os.criadoEm,
            diasAtraso,
          });
        }
      });

      // Ordenar por dias de atraso (maior primeiro)
      itemsInadimplentes.sort((a, b) => b.diasAtraso - a.diasAtraso);
      setItens(itemsInadimplentes);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível carregar os dados de inadimplência");
    } finally {
      setLoading(false);
    }
  };

  const filteredItens = itens.filter((item) => {
    if (filtro === "todos") return true;
    return item.statusPagamento === filtro;
  });

  const marcarComoPago = async (item: ItemInadimplente) => {
    try {
      if (item.tipo === "orcamento") {
        const orcamentos = await getOrcamentos();
        const orc = orcamentos.find((o) => o.id === item.id);
        if (orc) {
          await updateOrcamento({
            ...orc,
            statusPagamento: "pago",
            dataPagamento: new Date().toISOString(),
            valorPago: orc.valorTotal,
          });
        }
      } else {
        const ordens = await getOrdens();
        const os = ordens.find((o) => o.id === item.id);
        if (os) {
          await updateOrdem({
            ...os,
            statusPagamento: "pago",
            dataPagamento: new Date().toISOString(),
            valorPago: os.valorTotal,
          });
        }
      }
      loadInadimplentes();
      Alert.alert("Sucesso", "Marcado como pago!");
    } catch (error) {
      Alert.alert("Erro", "Não foi possível atualizar o status");
    }
  };

  const marcarComoParcial = async (item: ItemInadimplente) => {
    try {
      if (item.tipo === "orcamento") {
        const orcamentos = await getOrcamentos();
        const orc = orcamentos.find((o) => o.id === item.id);
        if (orc) {
          await updateOrcamento({
            ...orc,
            statusPagamento: "parcial",
            dataPagamento: new Date().toISOString(),
            valorPago: orc.valorTotal / 2,
          });
        }
      } else {
        const ordens = await getOrdens();
        const os = ordens.find((o) => o.id === item.id);
        if (os) {
          await updateOrdem({
            ...os,
            statusPagamento: "parcial",
            dataPagamento: new Date().toISOString(),
            valorPago: os.valorTotal / 2,
          });
        }
      }
      loadInadimplentes();
      Alert.alert("Sucesso", "Marcado como pagamento parcial!");
    } catch (error) {
      Alert.alert("Erro", "Não foi possível atualizar o status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pago":
        return colors.success;
      case "parcial":
        return colors.warning;
      default:
        return colors.error;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pago":
        return "Pago";
      case "parcial":
        return "Parcial";
      default:
        return "Pendente";
    }
  };

  const totalInadimplente = filteredItens.reduce((sum, item) => sum + item.valor, 0);
  const totalPendente = filteredItens.filter((i) => i.statusPagamento === "pendente").reduce((sum, i) => sum + i.valor, 0);

  return (
    <ScreenContainer className="px-5 pt-4">
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
        <Pressable onPress={() => router.back()} style={{ marginRight: 12 }}>
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text className="text-foreground text-2xl font-bold">Inadimplência</Text>
      </View>

      {/* Resumo */}
      <View style={{ marginBottom: 16 }}>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 10,
            padding: 14,
            borderLeftWidth: 4,
            borderLeftColor: colors.error,
          }}
        >
          <Text className="text-muted text-xs font-semibold mb-2">TOTAL PENDENTE</Text>
          <Text className="text-foreground text-2xl font-bold">R$ {totalPendente.toFixed(2).replace(".", ",")}</Text>
          <Text className="text-muted text-xs mt-2">{filteredItens.filter((i) => i.statusPagamento === "pendente").length} itens</Text>
        </View>

        {/* Filtros */}
        <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
          {(["todos", "pendente", "parcial"] as const).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFiltro(f)}
              style={({ pressed }) => [
                {
                  flex: 1,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  backgroundColor: filtro === f ? colors.primary : colors.surface,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text
                className={`text-center text-sm font-semibold ${filtro === f ? "text-background" : "text-foreground"}`}
              >
                {f === "todos" ? "Todos" : f === "pendente" ? "Pendente" : "Parcial"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Lista */}
      <ScrollView
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadInadimplentes} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {filteredItens.length === 0 ? (
          <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 40 }}>
            <MaterialIcons name="check-circle" size={48} color={colors.success} />
            <Text className="text-foreground text-lg font-semibold mt-4">Nenhum item pendente</Text>
            <Text className="text-muted text-sm mt-2">Todos os pagamentos estão em dia!</Text>
          </View>
        ) : (
          filteredItens.map((item) => (
            <View
              key={item.id}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 10,
                padding: 14,
                marginBottom: 12,
                borderLeftWidth: 4,
                borderLeftColor: getStatusColor(item.statusPagamento),
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text className="text-foreground font-semibold">
                    {item.tipo === "orcamento" ? "Orçamento" : "OS"} #{item.numero}
                  </Text>
                  <Text className="text-muted text-sm mt-1">{item.clienteNome}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text className="text-foreground font-bold">R$ {item.valor.toFixed(2).replace(".", ",")}</Text>
                  <View
                    style={{
                      backgroundColor: getStatusColor(item.statusPagamento),
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 4,
                      marginTop: 4,
                    }}
                  >
                    <Text className="text-background text-xs font-semibold">{getStatusLabel(item.statusPagamento)}</Text>
                  </View>
                </View>
              </View>

              {/* Informações de atraso */}
              <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text className="text-muted text-xs">Dias de atraso</Text>
                  <Text className="text-foreground font-semibold">{item.diasAtraso} dias</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text className="text-muted text-xs">Criado em</Text>
                  <Text className="text-foreground font-semibold text-sm">
                    {new Date(item.dataCriacao).toLocaleDateString("pt-BR")}
                  </Text>
                </View>
              </View>

              {/* Botões de ação */}
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Pressable
                  onPress={() => marcarComoParcial(item)}
                  style={({ pressed }) => [
                    {
                      flex: 1,
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                      backgroundColor: colors.warning,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text className="text-background text-center font-semibold text-sm">Parcial</Text>
                </Pressable>
                <Pressable
                  onPress={() => marcarComoPago(item)}
                  style={({ pressed }) => [
                    {
                      flex: 1,
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                      backgroundColor: colors.success,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text className="text-background text-center font-semibold text-sm">Pago</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
