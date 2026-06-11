import React, { useState, useEffect } from "react";
import { useFocusEffect } from "expo-router";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Cobranca, StatusCobranca } from "@/lib/cobranca-types";
import {
  calcularResumoCobrancas,
  filtrarCobrancas,
} from "@/lib/cobranca-financeiro-integration";
import { updateCobranca, getCobrancas, saveEntradaAutomatica, generateId } from "@/lib/store";

const STATUS_CORES: Record<StatusCobranca, { bg: string; text: string; icon: string }> = {
  pago: { bg: "#D1FAE5", text: "#065F46", icon: "checkmark-circle" },
  parcial: { bg: "#FEF3C7", text: "#92400E", icon: "alert-circle" },
  pendente: { bg: "#DBEAFE", text: "#0C4A6E", icon: "clock" },
  vencido: { bg: "#FEE2E2", text: "#7F1D1D", icon: "close-circle" },
  cancelado: { bg: "#F3F4F6", text: "#374151", icon: "ban" },
};

export default function CobrancasScreen() {
  const router = useRouter();
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<StatusCobranca | "todas">("todas");
  const [refreshing, setRefreshing] = useState(false);
  const [resumo, setResumo] = useState({
    totalCobrancas: 0,
    totalPendente: 0,
    totalVencido: 0,
    totalRecebido: 0,
    percentualRecebimento: 0,
    cobrancasVencidas: 0,
    cobrancasProximas: 0,
  });

  useEffect(() => {
    carregarCobrancas();
  }, []);

  // Recarregar sempre que voltar pra tela
  useFocusEffect(
    React.useCallback(() => {
      carregarCobrancas();
    }, []),
  );

  const carregarCobrancas = async () => {
    try {
      const cobrancasCarregadas = await getCobrancas();
      setCobrancas(cobrancasCarregadas as Cobranca[]);
      atualizarResumo(cobrancasCarregadas as Cobranca[]);
    } catch (e) {
      console.error("[Cobrancas] Erro ao carregar:", e);
      setCobrancas([]);
      atualizarResumo([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await carregarCobrancas();
    setRefreshing(false);
  };

  const atualizarResumo = (cobrancas: Cobranca[]) => {
    const novoResumo = calcularResumoCobrancas(cobrancas);
    setResumo(novoResumo);
  };

  const cobrancasFiltradas =
    filtroStatus === "todas"
      ? cobrancas
      : cobrancas.filter((c) => c.status === filtroStatus);

  const formatarMoeda = (valor: number) => {
    const n = Number(valor);
    const v = Number.isFinite(n) ? n : 0;
    return `R$ ${v.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
  };

  const formatarData = (data?: string | null) => {
    if (!data || typeof data !== "string") return "—";
    const partes = data.split("T")[0].split("-");
    if (partes.length !== 3) return data;
    const [ano, mes, dia] = partes;
    return `${dia}/${mes}/${ano}`;
  };

  const abrirCobranca = (cobranca: Cobranca) => {
    // TODO: Implementar tela de detalhe da cobrança
    Alert.alert("Detalhe", `Cobrança de ${cobranca.clienteNome}`);
  };

  const marcarComoPago = async (cobranca: Cobranca) => {
    Alert.alert(
      "Marcar como Pago",
      "Deseja marcar esta cobrança como paga?",
      [
        { text: "Cancelar", onPress: () => {}, style: "cancel" },
        {
          text: "Marcar como Pago",
          onPress: async () => {
            try {
              const cobrancaAtualizada = {
                ...cobranca,
                valorRecebido: cobranca.valorTotal,
                valorPendente: 0,
                status: "pago" as const,
                dataPagamento: new Date().toISOString().split("T")[0],
              };
              await updateCobranca(cobranca.id, cobrancaAtualizada);

              // Distribui automaticamente entre carteiras (se houver carteiras ativas)
              try {
                const { distribuirEntrada } = await import("@/lib/store");
                const restante = cobranca.valorTotal - (cobranca.valorRecebido || 0);
                if (restante > 0) {
                  await distribuirEntrada(
                    restante,
                    `Pgto integral - ${cobranca.descricao || cobranca.clienteNome}`,
                    `cob_${cobranca.id}_full`,
                  );
                }
              } catch (e) {
                console.warn("[Carteiras] falha distribuição:", e);
              }

              await carregarCobrancas();
              Alert.alert("Sucesso", "Cobrança marcada como paga!");
            } catch (error) {
              Alert.alert("Erro", "Não foi possível atualizar a cobrança");
            }
          },
          style: "default",
        },
      ]
    );
  };

  const [parcialModal, setParcialModal] = useState<{ cobranca: Cobranca; valor: string } | null>(null);

  const pagamentoParcial = (cobranca: Cobranca) => {
    setParcialModal({ cobranca, valor: "" });
  };

  const confirmarParcial = async () => {
    if (!parcialModal) return;
    const { cobranca, valor } = parcialModal;
    const v = parseFloat(valor.replace(",", ".")) || 0;
    if (v <= 0) return Alert.alert("Erro", "Valor inválido");
    setParcialModal(null);
    if (v >= cobranca.valorTotal) return marcarComoPago(cobranca);

    const recebidoAcumulado = (cobranca.valorRecebido || 0) + v;
    const pendente = Math.max(cobranca.valorTotal - recebidoAcumulado, 0);

    // Histórico de pagamentos parciais (cada parcial com id, para permitir edição/exclusão)
    const parciais = ((cobranca as any).pagamentosParciais || []) as any[];
    const novoParcial = {
      id: generateId(),
      valor: v,
      data: new Date().toISOString().split("T")[0],
      criadoEm: new Date().toISOString(),
      metodo: cobranca.formaPagamento || "Dinheiro",
    };
    parciais.push(novoParcial);

    await updateCobranca(cobranca.id, {
      ...cobranca,
      valorRecebido: recebidoAcumulado,
      valorPendente: pendente,
      status: pendente === 0 ? "pago" : "parcial",
      dataPagamento: pendente === 0 ? new Date().toISOString().split("T")[0] : cobranca.dataPagamento,
      pagamentosParciais: parciais,
    } as any);

    // Registra também como entrada financeira (fluxo de caixa)
    try {
      await saveEntradaAutomatica({
        id: `entrada_parcial_${novoParcial.id}`,
        data: novoParcial.data,
        clienteId: cobranca.clienteId,
        clienteNome: cobranca.clienteNome,
        orcamentoId: (cobranca as any).orcamentoId,
        osId: (cobranca as any).osId,
        descricao: `Pagamento parcial - ${cobranca.descricao || cobranca.clienteNome}`,
        categoria: "servico",
        valorTotal: v,
        valorRecebido: v,
        valorPendente: 0,
        formaPagamento: novoParcial.metodo as any,
        status: "pago",
        criado_em: novoParcial.criadoEm,
        atualizado_em: novoParcial.criadoEm,
        origem: "manual",
      } as any);
    } catch (e) {
      console.warn("[Entrada Parcial] Falha ao salvar:", e);
    }

    // Distribui automaticamente entre carteiras
    try {
      const { distribuirEntrada } = await import("@/lib/store");
      await distribuirEntrada(
        v,
        `Pgto parcial - ${cobranca.descricao || cobranca.clienteNome}`,
        `parcial_${novoParcial.id}`,
      );
    } catch (e) {
      console.warn("[Carteiras] falha distribuição parcial:", e);
    }

    await carregarCobrancas();
    Alert.alert("Pagamento registrado ✅", `Entrada de ${formatarMoeda(v)} registrada no fluxo de caixa.\nSaldo pendente: ${formatarMoeda(pendente)}`);
  };

  // ─── Histórico de Pagamentos Parciais (editar/excluir) ───────
  const [historicoModal, setHistoricoModal] = useState<{ cobranca: Cobranca } | null>(null);
  const [editParcial, setEditParcial] = useState<{ cobrancaId: string; parcialId: string; valor: string } | null>(null);

  const abrirHistorico = (cobranca: Cobranca) => {
    setHistoricoModal({ cobranca });
  };

  const editarParcial = async () => {
    if (!editParcial) return;
    const v = parseFloat(editParcial.valor.replace(",", ".")) || 0;
    if (v <= 0) return Alert.alert("Erro", "Valor inválido");
    const cobranca = cobrancas.find((c) => c.id === editParcial.cobrancaId);
    if (!cobranca) return;
    const parciais = (((cobranca as any).pagamentosParciais || []) as any[]).map((p) =>
      p.id === editParcial.parcialId ? { ...p, valor: v, atualizadoEm: new Date().toISOString() } : p,
    );
    const novoRecebido = parciais.reduce((s, p) => s + (p.valor || 0), 0);
    const novoPendente = Math.max(cobranca.valorTotal - novoRecebido, 0);
    await updateCobranca(cobranca.id, {
      ...cobranca,
      valorRecebido: novoRecebido,
      valorPendente: novoPendente,
      status: novoPendente === 0 ? "pago" : novoRecebido > 0 ? "parcial" : "pendente",
      pagamentosParciais: parciais,
    } as any);
    // Atualiza entrada financeira correspondente
    try {
      await saveEntradaAutomatica({
        id: `entrada_parcial_${editParcial.parcialId}`,
        data: parciais.find((p) => p.id === editParcial.parcialId)?.data || new Date().toISOString().split("T")[0],
        clienteId: cobranca.clienteId,
        clienteNome: cobranca.clienteNome,
        descricao: `Pagamento parcial (editado) - ${cobranca.descricao || cobranca.clienteNome}`,
        categoria: "servico",
        valorTotal: v,
        valorRecebido: v,
        valorPendente: 0,
        status: "pago",
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
        origem: "manual",
      } as any);
    } catch (e) {
      console.warn(e);
    }
    setEditParcial(null);
    setHistoricoModal(null);
    await carregarCobrancas();
    Alert.alert("Atualizado ✅", "Pagamento parcial editado e entrada financeira ajustada.");
  };

  const excluirParcial = async (cobrancaId: string, parcialId: string) => {
    Alert.alert("Excluir pagamento parcial?", "Esta ação removerá também a entrada financeira correspondente.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          const cobranca = cobrancas.find((c) => c.id === cobrancaId);
          if (!cobranca) return;
          const parciais = (((cobranca as any).pagamentosParciais || []) as any[]).filter((p) => p.id !== parcialId);
          const novoRecebido = parciais.reduce((s, p) => s + (p.valor || 0), 0);
          const novoPendente = Math.max(cobranca.valorTotal - novoRecebido, 0);
          await updateCobranca(cobranca.id, {
            ...cobranca,
            valorRecebido: novoRecebido,
            valorPendente: novoPendente,
            status: novoPendente === 0 && novoRecebido > 0 ? "pago" : novoRecebido > 0 ? "parcial" : "pendente",
            pagamentosParciais: parciais,
          } as any);
          // Remove entrada financeira correspondente
          try {
            const { deleteEntradaAutomatica } = await import("@/lib/store");
            if (deleteEntradaAutomatica) await deleteEntradaAutomatica(`entrada_parcial_${parcialId}`);
          } catch (e) {
            console.warn(e);
          }
          setHistoricoModal(cobranca ? { cobranca: { ...cobranca, pagamentosParciais: parciais } as any } : null);
          await carregarCobrancas();
        },
      },
    ]);
  };

  const gerarRecibo = async (cobranca: Cobranca) => {
    try {
      const { saveRecibo, generateId, getEmpresa, getClienteById } = await import("@/lib/store");
      const { gerarReciboPDF } = await import("@/lib/pdf-generator");
      const empresa = await getEmpresa();
      const cliente = await getClienteById(cobranca.clienteId);
      const valorPago = cobranca.valorRecebido || cobranca.valorTotal;
      const recibo = {
        id: generateId(),
        cobrancaId: cobranca.id,
        clienteId: cobranca.clienteId,
        clienteNome: cobranca.clienteNome || "",
        valor: valorPago,
        descricao: cobranca.descricao || "",
        metodoPagamento: cobranca.formaPagamento || "Dinheiro",
        dataPagamento: cobranca.dataPagamento || new Date().toISOString().split("T")[0],
        criadoEm: new Date().toISOString(),
      };
      await saveRecibo(recibo as any);
      // Gera o PDF do recibo usando o formato esperado pela função
      await gerarReciboPDF({
        id: recibo.id,
        clienteNome: recibo.clienteNome,
        clienteEmail: cliente?.email,
        clienteTelefone: cliente?.telefone,
        descricao: recibo.descricao || `Pagamento referente à cobrança ${cobranca.codigoOrcamento || cobranca.id.slice(0, 8)}`,
        valorTotal: cobranca.valorTotal,
        valorPago: valorPago,
        dataPagamento: recibo.dataPagamento,
        metodoPagamento: recibo.metodoPagamento,
        observacoes: (cobranca as any).observacoes || "",
        empresaNome: empresa?.nome || "Polar Soluções",
        empresaCNPJ: empresa?.cnpj,
        empresaTelefone: empresa?.telefone,
      });
      Alert.alert("Recibo gerado ✅", "O recibo foi salvo e o PDF foi compartilhado.");
    } catch (e: any) {
      console.error("[Recibo] Erro:", e);
      Alert.alert("Erro", e?.message || "Não foi possível gerar o recibo");
    }
  };

  const excluirCobranca = (cobranca: Cobranca) => {
    Alert.alert("Excluir cobrança", `Excluir cobrança de ${cobranca.clienteNome}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          const { deleteCobranca } = await import("@/lib/store");
          await deleteCobranca(cobranca.id);
          await carregarCobrancas();
        },
      },
    ]);
  };

  const renderCobranca = ({ item }: { item: Cobranca }) => {
    const statusInfo = STATUS_CORES[item.status];
    const diasRestantes = Math.floor(
      (new Date(item.dataVencimento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    return (
      <TouchableOpacity
        onPress={() => abrirCobranca(item)}
        style={{
          backgroundColor: "#F9FAFB",
          borderRadius: 8,
          padding: 12,
          marginBottom: 8,
          borderLeftWidth: 3,
          borderLeftColor: "#1B4F72",
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#111827", marginBottom: 2 }}>
              {item.clienteNome}
            </Text>
            <Text style={{ fontSize: 11, color: "#6B7280" }}>
              {item.descricao}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: statusInfo.bg,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 6,
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Ionicons name={statusInfo.icon as any} size={12} color={statusInfo.text} />
            <Text style={{ fontSize: 10, fontWeight: "600", color: statusInfo.text }}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <View>
            <Text style={{ fontSize: 12, color: "#6B7280", marginBottom: 2 }}>
              💰 {formatarMoeda(item.valorTotal)}
            </Text>
            <Text style={{ fontSize: 11, color: "#9CA3AF" }}>
              📅 Vencimento: {formatarData(item.dataVencimento)}
            </Text>
          </View>
          {diasRestantes < 0 && (
            <View style={{ backgroundColor: "#FEE2E2", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
              <Text style={{ fontSize: 10, color: "#DC2626", fontWeight: "600" }}>
                {Math.abs(diasRestantes)} dias vencido
              </Text>
            </View>
          )}
        </View>

        {item.valorRecebido > 0 && (
          <View style={{ backgroundColor: "#E8F5E9", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
            <Text style={{ fontSize: 10, color: "#2E7D32" }}>
              ✓ Recebido: {formatarMoeda(item.valorRecebido)} | Pendente: {formatarMoeda(item.valorPendente)}
            </Text>
          </View>
        )}

        {/* Lista INLINE dos pagamentos parciais (com edição e exclusão direta) */}
        {(((item as any).pagamentosParciais || []) as any[]).length > 0 && (
          <View style={{ marginTop: 8, backgroundColor: "#F8FAFC", borderRadius: 8, borderWidth: 1, borderColor: "#E2E8F0", padding: 8 }}>
            <Text style={{ fontSize: 10, fontWeight: "800", color: "#0D3B66", marginBottom: 6 }}>
              📜 PAGAMENTOS PARCIAIS REGISTRADOS
            </Text>
            {(((item as any).pagamentosParciais || []) as any[]).map((p: any, idx: number) => (
              <View
                key={p.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 6,
                  borderTopWidth: idx === 0 ? 0 : 1,
                  borderTopColor: "#E2E8F0",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#0D3B66" }}>
                    #{idx + 1} {formatarMoeda(p.valor)}
                  </Text>
                  <Text style={{ fontSize: 9, color: "#64748B" }}>
                    {formatarData(p.data)} • {p.metodo || "—"}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", gap: 4 }}>
                  <TouchableOpacity
                    onPress={(e: any) => {
                      e?.stopPropagation?.();
                      setEditParcial({
                        cobrancaId: item.id,
                        parcialId: p.id,
                        valor: String(p.valor).replace(".", ","),
                      });
                    }}
                    testID={`parcial-edit-${p.id}`}
                    style={{ backgroundColor: "#1E88E5", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, flexDirection: "row", alignItems: "center", gap: 4 }}
                  >
                    <Ionicons name="pencil" size={12} color="#fff" />
                    <Text style={{ fontSize: 10, fontWeight: "700", color: "#fff" }}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={(e: any) => {
                      e?.stopPropagation?.();
                      excluirParcial(item.id, p.id);
                    }}
                    testID={`parcial-del-${p.id}`}
                    style={{ backgroundColor: "#EF4444", paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6 }}
                  >
                    <Ionicons name="trash" size={12} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Barra de ações */}
        <View style={{ flexDirection: "row", gap: 6, marginTop: 8 }}>
          {item.status !== "pago" && (
            <>
              <TouchableOpacity
                onPress={() => marcarComoPago(item)}
                testID={`cob-total-${item.id}`}
                style={{
                  flex: 1,
                  backgroundColor: "#10B981",
                  paddingVertical: 8,
                  borderRadius: 6,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                }}
              >
                <Ionicons name="checkmark-circle" size={13} color="#fff" />
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#fff" }}>Total</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => pagamentoParcial(item)}
                testID={`cob-parcial-${item.id}`}
                style={{
                  flex: 1,
                  backgroundColor: "#3B82F6",
                  paddingVertical: 8,
                  borderRadius: 6,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                }}
              >
                <Ionicons name="cash" size={13} color="#fff" />
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#fff" }}>Parcial</Text>
              </TouchableOpacity>
            </>
          )}
          {(((item as any).pagamentosParciais || []) as any[]).length > 0 && (
            <TouchableOpacity
              onPress={() => abrirHistorico(item)}
              testID={`cob-historico-${item.id}`}
              style={{
                backgroundColor: "#0D3B66",
                paddingVertical: 8,
                paddingHorizontal: 10,
                borderRadius: 6,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
              }}
            >
              <Ionicons name="time" size={13} color="#fff" />
              <Text style={{ fontSize: 10, fontWeight: "700", color: "#fff" }}>
                {((item as any).pagamentosParciais || []).length}x
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => gerarRecibo(item)}
            testID={`cob-recibo-${item.id}`}
            style={{
              flex: 1,
              backgroundColor: "#8B5CF6",
              paddingVertical: 8,
              borderRadius: 6,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
          >
            <Ionicons name="document-text" size={13} color="#fff" />
            <Text style={{ fontSize: 11, fontWeight: "700", color: "#fff" }}>Recibo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => excluirCobranca(item)}
            testID={`cob-excluir-${item.id}`}
            style={{
              backgroundColor: "#EF4444",
              paddingVertical: 8,
              paddingHorizontal: 10,
              borderRadius: 6,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="trash" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <View>
              <Text style={{ fontSize: 24, fontWeight: "bold", color: "#1B4F72", marginBottom: 4 }}>
                Cobranças
              </Text>
              <Text style={{ fontSize: 12, color: "#6B7280" }}>
                Gerencie cobranças e envie pelo WhatsApp
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/cobrancas/nova")}
              style={{
                backgroundColor: "#1B4F72",
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 6,
              }}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Resumo */}
        <View style={{ padding: 16, gap: 12 }}>
          {/* Cards de Resumo */}
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1, backgroundColor: "#F0F9FF", borderRadius: 8, padding: 12, borderLeftWidth: 3, borderLeftColor: "#1B4F72" }}>
              <Text style={{ fontSize: 11, color: "#0C4A6E", fontWeight: "600", marginBottom: 4 }}>
                Total Pendente
              </Text>
              <Text style={{ fontSize: 16, fontWeight: "bold", color: "#1B4F72" }}>
                {formatarMoeda(resumo.totalPendente)}
              </Text>
            </View>

            <View style={{ flex: 1, backgroundColor: "#FEF2F2", borderRadius: 8, padding: 12, borderLeftWidth: 3, borderLeftColor: "#DC2626" }}>
              <Text style={{ fontSize: 11, color: "#7F1D1D", fontWeight: "600", marginBottom: 4 }}>
                Vencidas
              </Text>
              <Text style={{ fontSize: 16, fontWeight: "bold", color: "#DC2626" }}>
                {resumo.cobrancasVencidas}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1, backgroundColor: "#D1FAE5", borderRadius: 8, padding: 12, borderLeftWidth: 3, borderLeftColor: "#16A34A" }}>
              <Text style={{ fontSize: 11, color: "#065F46", fontWeight: "600", marginBottom: 4 }}>
                Recebido
              </Text>
              <Text style={{ fontSize: 16, fontWeight: "bold", color: "#16A34A" }}>
                {formatarMoeda(resumo.totalRecebido)}
              </Text>
            </View>

            <View style={{ flex: 1, backgroundColor: "#FEF3C7", borderRadius: 8, padding: 12, borderLeftWidth: 3, borderLeftColor: "#CA8A04" }}>
              <Text style={{ fontSize: 11, color: "#92400E", fontWeight: "600", marginBottom: 4 }}>
                Próximas a Vencer
              </Text>
              <Text style={{ fontSize: 16, fontWeight: "bold", color: "#CA8A04" }}>
                {resumo.cobrancasProximas}
              </Text>
            </View>
          </View>

          {/* Filtros */}
          <View style={{ marginTop: 8 }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: "#1B4F72", marginBottom: 8 }}>
              Filtrar por Status
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ gap: 8 }}>
              {(["todas", "pendente", "parcial", "pago", "vencido"] as const).map((status) => (
                <TouchableOpacity
                  key={status}
                  onPress={() => setFiltroStatus(status)}
                  style={{
                    backgroundColor: filtroStatus === status ? "#1B4F72" : "#F3F4F6",
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 6,
                    marginRight: 8,
                  }}
                >
                  <Text
                    style={{
                      color: filtroStatus === status ? "#fff" : "#1B4F72",
                      fontSize: 12,
                      fontWeight: "600",
                    }}
                  >
                    {status === "todas" ? "Todas" : status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Lista de Cobranças */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
          {cobrancasFiltradas.length > 0 ? (
            <FlatList
              data={cobrancasFiltradas}
              keyExtractor={(item) => item.id}
              renderItem={renderCobranca}
              scrollEnabled={false}
            />
          ) : (
            <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 40 }}>
              <Ionicons name="document-outline" size={48} color="#d1d5db" />
              <Text style={{ marginTop: 12, color: "#9ca3af", fontSize: 14 }}>
                Nenhuma cobrança encontrada
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/cobrancas/nova" as any)}
                style={{ marginTop: 16 }}
              >
                <Text style={{ color: "#1B4F72", fontWeight: "600" }}>
                  Criar primeira cobrança
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal de Pagamento Parcial (compatível Android/iOS) */}
      <Modal
        visible={parcialModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setParcialModal(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, width: "100%", maxWidth: 400 }}>
            <Text style={{ fontSize: 16, fontWeight: "800", color: "#111827", marginBottom: 6 }}>
              Pagamento parcial
            </Text>
            {parcialModal && (
              <Text style={{ fontSize: 12, color: "#6B7280", marginBottom: 14 }}>
                Total da cobrança: R$ {parcialModal.cobranca.valorTotal.toFixed(2)}
                {parcialModal.cobranca.valorRecebido
                  ? ` • Já recebido: R$ ${parcialModal.cobranca.valorRecebido.toFixed(2)}`
                  : ""}
              </Text>
            )}
            <Text style={{ fontSize: 11, fontWeight: "600", color: "#6B7280", marginBottom: 6 }}>
              VALOR RECEBIDO (R$)
            </Text>
            <TextInput
              autoFocus
              value={parcialModal?.valor || ""}
              onChangeText={(t) => parcialModal && setParcialModal({ ...parcialModal, valor: t })}
              placeholder="Ex: 250,00"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
              style={{
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 10,
                padding: 12,
                fontSize: 14,
                color: "#111827",
                marginBottom: 16,
              }}
              testID="modal-parcial-input"
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                onPress={() => setParcialModal(null)}
                style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: "#F3F4F6", alignItems: "center" }}
              >
                <Text style={{ fontWeight: "700", color: "#374151" }}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={confirmarParcial}
                style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: "#3B82F6", alignItems: "center" }}
                testID="modal-parcial-confirmar"
              >
                <Text style={{ fontWeight: "700", color: "#fff" }}>Confirmar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Histórico de Pagamentos Parciais (com edição/exclusão) */}
      <Modal
        visible={!!historicoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setHistoricoModal(null)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 }}>
          <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, maxHeight: "85%" }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
              <Ionicons name="time" size={22} color="#0D3B66" />
              <Text style={{ fontSize: 18, fontWeight: "800", color: "#0D3B66", marginLeft: 8, flex: 1 }}>
                Pagamentos Parciais
              </Text>
              <Pressable onPress={() => setHistoricoModal(null)} hitSlop={6}>
                <Ionicons name="close" size={24} color="#64748B" />
              </Pressable>
            </View>
            {historicoModal && (
              <>
                <Text style={{ fontSize: 12, color: "#64748B", marginBottom: 12 }}>
                  {historicoModal.cobranca.clienteNome} • Total: {formatarMoeda(historicoModal.cobranca.valorTotal)}
                </Text>
                <ScrollView style={{ maxHeight: 380 }}>
                  {(((historicoModal.cobranca as any).pagamentosParciais || []) as any[]).map((p, idx) => (
                    <View
                      key={p.id}
                      style={{
                        backgroundColor: "#F8FAFC",
                        borderRadius: 10,
                        padding: 12,
                        marginBottom: 8,
                        borderWidth: 1,
                        borderColor: "#E2E8F0",
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 11, color: "#64748B", fontWeight: "600" }}>
                            Parcial #{idx + 1} • {formatarData(p.data)}
                          </Text>
                          <Text style={{ fontSize: 18, fontWeight: "800", color: "#0D3B66", marginTop: 2 }}>
                            {formatarMoeda(p.valor)}
                          </Text>
                          <Text style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                            via {p.metodo || "—"}
                          </Text>
                        </View>
                        <View style={{ flexDirection: "row", gap: 6 }}>
                          <Pressable
                            onPress={() =>
                              setEditParcial({
                                cobrancaId: historicoModal.cobranca.id,
                                parcialId: p.id,
                                valor: String(p.valor).replace(".", ","),
                              })
                            }
                            style={{ backgroundColor: "#1E88E5", padding: 8, borderRadius: 6 }}
                          >
                            <Ionicons name="pencil" size={14} color="#fff" />
                          </Pressable>
                          <Pressable
                            onPress={() => excluirParcial(historicoModal.cobranca.id, p.id)}
                            style={{ backgroundColor: "#EF4444", padding: 8, borderRadius: 6 }}
                          >
                            <Ionicons name="trash" size={14} color="#fff" />
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  ))}
                </ScrollView>
                <View style={{ marginTop: 14, padding: 12, backgroundColor: "#EFF6FF", borderRadius: 10 }}>
                  <Text style={{ fontSize: 11, color: "#0D3B66", fontWeight: "700" }}>Total recebido</Text>
                  <Text style={{ fontSize: 22, fontWeight: "800", color: "#0D3B66" }}>
                    {formatarMoeda(historicoModal.cobranca.valorRecebido || 0)}
                  </Text>
                  <Text style={{ fontSize: 10, color: "#64748B", marginTop: 2 }}>
                    Saldo pendente: {formatarMoeda((historicoModal.cobranca.valorTotal || 0) - (historicoModal.cobranca.valorRecebido || 0))}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal de Edição de Parcial */}
      <Modal
        visible={!!editParcial}
        transparent
        animationType="fade"
        onRequestClose={() => setEditParcial(null)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 }}>
          <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#0D3B66", marginBottom: 14 }}>
              Editar Pagamento Parcial
            </Text>
            <Text style={{ fontSize: 11, color: "#64748B", fontWeight: "600", marginBottom: 6 }}>NOVO VALOR</Text>
            <TextInput
              value={editParcial?.valor || ""}
              onChangeText={(v) => editParcial && setEditParcial({ ...editParcial, valor: v })}
              placeholder="0,00"
              placeholderTextColor="#94A3B8"
              keyboardType="decimal-pad"
              style={{
                backgroundColor: "#F8FAFC",
                borderWidth: 1,
                borderColor: "#E2E8F0",
                borderRadius: 10,
                padding: 12,
                fontSize: 18,
                fontWeight: "700",
                color: "#0D3B66",
                marginBottom: 18,
              }}
            />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable
                onPress={() => setEditParcial(null)}
                style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: "#F1F5F9", alignItems: "center" }}
              >
                <Text style={{ fontWeight: "700", color: "#64748B" }}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={editarParcial}
                style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: "#1E88E5", alignItems: "center" }}
              >
                <Text style={{ fontWeight: "700", color: "#fff" }}>Salvar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
