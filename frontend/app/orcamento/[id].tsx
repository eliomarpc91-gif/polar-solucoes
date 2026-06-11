import { useState, useCallback } from "react";
import { ScrollView, Text, View, Pressable, Alert } from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getOrcamentos, saveOrcamento, deleteOrcamento, getClientes, getEmpresa, getCobrancas, saveCobranca, Orcamento, Cliente, EmpresaConfig } from "@/lib/store";
import { generateOrcamentoPDF } from "@/lib/pdf-generator";
import { generateWhatsAppMessage, openWhatsAppWithMessage } from "@/lib/whatsapp-message-generator";

export default function OrcamentoDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [empresa, setEmpresa] = useState<EmpresaConfig | null>(null);

  // useFocusEffect garante que os dados são recarregados ao retornar da edição
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [id]),
  );

  const loadData = async () => {
    const orcamentos = await getOrcamentos();
    const found = orcamentos.find((o) => o.id === id);
    if (found) {
      setOrcamento(found);
      const clientes = await getClientes();
      setCliente(clientes.find((c) => c.id === found.clienteId) || null);
    }
    const emp = await getEmpresa();
    setEmpresa(emp);
  };

  const updateStatus = async (newStatus: "enviado" | "aprovado" | "rejeitado") => {
    if (!orcamento) return;
    const updated = { ...orcamento, status: newStatus };
    await saveOrcamento(updated);
    setOrcamento(updated);

    // Quando aprovado, cria automaticamente uma cobrança pendente
    if (newStatus === "aprovado") {
      try {
        const cobrancas = await getCobrancas();
        const jaExiste = cobrancas.find((c: any) => c.orcamentoId === orcamento.id);
        if (jaExiste) {
          Alert.alert("Orçamento aprovado", "Já existe uma cobrança vinculada a este orçamento.");
          return;
        }

        const hoje = new Date();
        const vencimento = new Date();
        vencimento.setDate(hoje.getDate() + 7);

        const novaCobranca = {
          clienteId: orcamento.clienteId,
          clienteNome: cliente?.nome || "",
          orcamentoId: orcamento.id,
          codigoOrcamento: (orcamento as any).codigo,
          descricao: `Cobrança do orçamento ${(orcamento as any).codigo || orcamento.numero}`,
          valorTotal: orcamento.valorTotal,
          valorRecebido: 0,
          status: "pendente",
          dataCriacao: hoje.toISOString().split("T")[0],
          dataVencimento: vencimento.toISOString().split("T")[0],
          formaPagamento: "",
        };

        await saveCobranca(novaCobranca);

        Alert.alert(
          "Orçamento aprovado",
          `Uma cobrança de R$ ${orcamento.valorTotal.toFixed(2)} foi criada automaticamente em Cobranças.`,
          [
            { text: "OK", style: "default" },
            { text: "Ver cobrança", onPress: () => router.push("/(tabs)/cobrancas") },
          ],
        );
      } catch (err) {
        console.error("[Orcamento] Erro ao criar cobrança:", err);
        Alert.alert("Atenção", "Orçamento aprovado, mas não foi possível criar a cobrança automaticamente.");
      }
    }
  };

  const enviarWhatsApp = () => {
    if (!orcamento || !cliente?.telefone) {
      Alert.alert("Erro", "Cliente sem telefone cadastrado");
      return;
    }
    const msg = generateWhatsAppMessage({
      orcamento,
      cliente: { nome: cliente.nome, telefone: cliente.telefone },
      empresa,
    });
    openWhatsAppWithMessage(cliente.telefone, msg, false);
  };

  const handleDelete = () => {
    Alert.alert("Excluir Orçamento", "Tem certeza que deseja excluir este orçamento?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          if (orcamento) {
            await deleteOrcamento(orcamento.id);
            router.back();
          }
        },
      },
    ]);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "enviado": return colors.warning;
      case "aprovado": return colors.success;
      case "rejeitado": return colors.error;
      default: return colors.muted;
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "enviado": return "Enviado";
      case "aprovado": return "Aprovado";
      case "rejeitado": return "Rejeitado";
      default: return status;
    }
  };

  // Função para calcular valor do material com lucro e frete
  const calcMaterialClienteValor = (material: any) => {
    const base = material.valorUnitario * material.quantidade;
    const lucro = base * (material.lucroPercent / 100);
    return base + lucro + material.frete;
  };

  if (!orcamento) {
    return (
      <ScreenContainer edges={["top", "left", "right", "bottom"]}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text className="text-muted">Carregando...</Text>
        </View>
      </ScreenContainer>
    );
  }

  const valorSubtotal = (orcamento as any).valorSubtotal ?? orcamento.valorTotal;
  const valorDesconto = (orcamento as any).valorDesconto ?? 0;
  const desconto = (orcamento as any).desconto;
  const equipamentos = (orcamento as any).equipamentos as any[] | undefined;

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]} testID="orcamento-back-btn">
            <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
          </Pressable>
          <Text className="text-foreground text-xl font-bold ml-4">Orçamento #{orcamento.numero}</Text>
        </View>
        <Pressable onPress={handleDelete} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]} testID="orcamento-delete-btn">
          <MaterialIcons name="delete" size={22} color={colors.error} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        {/* Status */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 14 }}>
          <Text className="text-muted text-xs font-semibold mb-3">STATUS</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {(["enviado", "aprovado", "rejeitado"] as const).map((s) => (
              <Pressable
                key={s}
                onPress={() => updateStatus(s)}
                style={({ pressed }) => [{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 10,
                  backgroundColor: orcamento.status === s ? statusColor(s) : statusColor(s) + "15",
                  borderWidth: 1.5,
                  borderColor: orcamento.status === s ? statusColor(s) : "transparent",
                  alignItems: "center",
                  opacity: pressed ? 0.8 : 1,
                }]}
              >
                <Text style={{ color: orcamento.status === s ? "#FFF" : statusColor(s), fontSize: 12, fontWeight: "700" }}>
                  {statusLabel(s)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Cliente */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 14 }}>
          <Text className="text-muted text-xs font-semibold mb-2">CLIENTE</Text>
          <Text className="text-foreground text-base font-bold">{orcamento.clienteNome}</Text>
          {cliente?.telefone && <Text className="text-muted text-xs mt-1">{cliente.telefone}</Text>}
        </View>

        {/* Equipamentos */}
        {equipamentos && equipamentos.length > 0 && (
          <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 14 }}>
            <Text className="text-muted text-xs font-semibold mb-3">EQUIPAMENTOS ({equipamentos.length})</Text>
            {equipamentos.map((eq, idx) => (
              <View
                key={eq.id || idx}
                style={{
                  paddingVertical: 12,
                  borderTopWidth: idx > 0 ? 1 : 0,
                  borderTopColor: colors.border,
                }}
              >
                <Text className="text-foreground font-bold text-sm">
                  {String(idx + 1).padStart(2, "0")} — {eq.tipo || `${eq.marca || ""} ${eq.modelo || ""}`.trim() || "Equipamento"}
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 6, gap: 12 }}>
                  {eq.marca ? <Text className="text-muted text-xs">Marca: <Text className="text-foreground">{eq.marca}</Text></Text> : null}
                  {eq.modelo ? <Text className="text-muted text-xs">Modelo: <Text className="text-foreground">{eq.modelo}</Text></Text> : null}
                  {eq.serie ? <Text className="text-muted text-xs">Série: <Text className="text-foreground">{eq.serie}</Text></Text> : null}
                  {eq.patrimonio ? <Text className="text-muted text-xs">Patrimônio: <Text className="text-foreground">{eq.patrimonio}</Text></Text> : null}
                  {eq.localizacao ? <Text className="text-muted text-xs">Local: <Text className="text-foreground">{eq.localizacao}</Text></Text> : null}
                </View>
                {eq.problema ? (
                  <View style={{ marginTop: 8, backgroundColor: colors.warning + "15", borderLeftWidth: 3, borderLeftColor: colors.warning, padding: 8, borderRadius: 6 }}>
                    <Text className="text-muted text-xs font-semibold">Problema</Text>
                    <Text className="text-foreground text-xs mt-1">{eq.problema}</Text>
                  </View>
                ) : null}
                {eq.diagnostico ? (
                  <View style={{ marginTop: 6, backgroundColor: colors.success + "15", borderLeftWidth: 3, borderLeftColor: colors.success, padding: 8, borderRadius: 6 }}>
                    <Text className="text-muted text-xs font-semibold">Diagnóstico</Text>
                    <Text className="text-foreground text-xs mt-1">{eq.diagnostico}</Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        )}

        {/* Serviços */}
        {orcamento.itens.length > 0 && (
          <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 14 }}>
            <Text className="text-muted text-xs font-semibold mb-3">SERVIÇOS</Text>
            {orcamento.itens.map((item, index) => (
              <View
                key={item.id}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingVertical: 10,
                  borderBottomWidth: index < orcamento.itens.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text className="text-foreground text-sm">{item.descricao}</Text>
                  {(item as any).detalhes ? (
                    <Text className="text-muted text-xs mt-1" numberOfLines={4}>{(item as any).detalhes}</Text>
                  ) : null}
                  <Text className="text-muted text-xs mt-1">Qtd: {item.quantidade}</Text>
                </View>
                <Text style={{ color: colors.success, fontSize: 13, fontWeight: "700" }}>
                  R$ {(item.valor * item.quantidade).toFixed(2)}
                </Text>
              </View>
            ))}
            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border, marginTop: 4 }}>
              <Text className="text-foreground font-bold text-base">Subtotal Serviços</Text>
              <Text style={{ color: colors.success, fontSize: 16, fontWeight: "800" }}>
                R$ {orcamento.itens.reduce((sum, item) => sum + item.valor * item.quantidade, 0).toFixed(2)}
              </Text>
            </View>
          </View>
        )}

        {/* Materiais */}
        {orcamento.materiais.length > 0 && (
          <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 14 }}>
            <Text className="text-muted text-xs font-semibold mb-3">MATERIAIS</Text>
            {orcamento.materiais.map((material, index) => (
              <View
                key={material.id}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingVertical: 10,
                  borderBottomWidth: index < orcamento.materiais.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text className="text-foreground text-sm">{material.descricao}</Text>
                  {(material as any).detalhes ? (
                    <Text className="text-muted text-xs mt-1" numberOfLines={4}>{(material as any).detalhes}</Text>
                  ) : null}
                  <Text className="text-muted text-xs mt-1">Qtd: {material.quantidade} {material.unidade || "un"}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ color: colors.success, fontSize: 13, fontWeight: "700" }}>
                    R$ {calcMaterialClienteValor(material).toFixed(2)}
                  </Text>
                  {(material.lucroPercent > 0 || material.frete > 0) && (
                    <Text style={{ color: colors.muted, fontSize: 10, marginTop: 2 }}>
                      ({material.lucroPercent > 0 ? `+${material.lucroPercent}%` : ''} {material.frete > 0 ? `+R$${material.frete.toFixed(2)} frete` : ''})
                    </Text>
                  )}
                </View>
              </View>
            ))}
            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border, marginTop: 4 }}>
              <Text className="text-foreground font-bold text-base">Subtotal Materiais</Text>
              <Text style={{ color: colors.success, fontSize: 16, fontWeight: "800" }}>
                R$ {orcamento.materiais.reduce((sum, material) => sum + calcMaterialClienteValor(material), 0).toFixed(2)}
              </Text>
            </View>
          </View>
        )}

        {/* Gastos Operacionais */}
        {orcamento.gastosOperacionais && (orcamento.gastosOperacionais.transporte > 0 || orcamento.gastosOperacionais.alimentacao > 0 || orcamento.gastosOperacionais.hospedagem > 0 || orcamento.gastosOperacionais.outros > 0) && (
          <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 14 }}>
            <Text className="text-muted text-xs font-semibold mb-3">GASTOS OPERACIONAIS</Text>
            {orcamento.gastosOperacionais.transporte > 0 && (
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                <Text className="text-muted text-sm">Transporte</Text>
                <Text className="text-foreground text-sm">R$ {orcamento.gastosOperacionais.transporte.toFixed(2)}</Text>
              </View>
            )}
            {orcamento.gastosOperacionais.alimentacao > 0 && (
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                <Text className="text-muted text-sm">Alimentação</Text>
                <Text className="text-foreground text-sm">R$ {orcamento.gastosOperacionais.alimentacao.toFixed(2)}</Text>
              </View>
            )}
            {orcamento.gastosOperacionais.hospedagem > 0 && (
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                <Text className="text-muted text-sm">Hospedagem</Text>
                <Text className="text-foreground text-sm">R$ {orcamento.gastosOperacionais.hospedagem.toFixed(2)}</Text>
              </View>
            )}
            {orcamento.gastosOperacionais.outros > 0 && (
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text className="text-muted text-sm">{orcamento.gastosOperacionais.descricaoOutros || "Outros"}</Text>
                <Text className="text-foreground text-sm">R$ {orcamento.gastosOperacionais.outros.toFixed(2)}</Text>
              </View>
            )}
          </View>
        )}

        {/* Subtotal + Desconto + Total */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 14 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
            <Text className="text-muted text-sm">Subtotal</Text>
            <Text className="text-foreground text-sm font-semibold">R$ {valorSubtotal.toFixed(2)}</Text>
          </View>
          {valorDesconto > 0 && (
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
              <Text style={{ color: colors.error, fontSize: 13, fontWeight: "700" }}>
                Desconto{desconto?.tipo === "percentual" ? ` (${desconto.valor}%)` : ""}
              </Text>
              <Text style={{ color: colors.error, fontSize: 13, fontWeight: "700" }}>- R$ {valorDesconto.toFixed(2)}</Text>
            </View>
          )}
        </View>

        {/* Total Geral */}
        <View style={{ backgroundColor: colors.primary, borderRadius: 14, padding: 16, marginBottom: 14 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text className="text-white font-bold text-lg">TOTAL GERAL</Text>
            <Text style={{ color: "#FFF", fontSize: 24, fontWeight: "800" }}>
              R$ {orcamento.valorTotal.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Botão de Editar */}
        <Pressable
          onPress={() => router.push(`/orcamento/editar/${orcamento.id}`)}
          testID="orcamento-edit-btn"
          style={({ pressed }) => [{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.warning,
            borderRadius: 12,
            paddingVertical: 16,
            marginBottom: 14,
            opacity: pressed ? 0.85 : 1,
          }]}
        >
          <MaterialIcons name="edit" size={22} color="#FFF" />
          <Text style={{ color: "#FFF", fontSize: 15, fontWeight: "700", marginLeft: 10 }}>Editar Orçamento</Text>
        </Pressable>

        {/* Observações */}
        {orcamento.observacoes ? (
          <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 14 }}>
            <Text className="text-muted text-xs font-semibold mb-2">OBSERVAÇÕES</Text>
            <Text className="text-foreground text-sm">{orcamento.observacoes}</Text>
          </View>
        ) : null}

        {/* Ações de Envio */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 14 }}>
          <Text className="text-muted text-xs font-semibold mb-3">ENVIAR ORÇAMENTO</Text>
          <View style={{ gap: 10 }}>
            <Pressable
              onPress={enviarWhatsApp}
              testID="orcamento-whatsapp-btn"
              style={({ pressed }) => [{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#25D366",
                borderRadius: 12,
                paddingVertical: 16,
                opacity: pressed ? 0.85 : 1,
              }]}
            >
              <MaterialIcons name="chat" size={22} color="#FFF" />
              <Text style={{ color: "#FFF", fontSize: 15, fontWeight: "700", marginLeft: 10 }}>Enviar por WhatsApp</Text>
            </Pressable>

            <Pressable
              onPress={async () => {
                try {
                  await generateOrcamentoPDF({ orcamento, cliente, empresa });
                } catch (e: any) {
                  Alert.alert("Erro", e.message || "Não foi possível gerar o PDF");
                }
              }}
              testID="orcamento-pdf-btn"
              style={({ pressed }) => [{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.primary,
                borderRadius: 12,
                paddingVertical: 16,
                opacity: pressed ? 0.85 : 1,
              }]}
            >
              <MaterialIcons name="picture-as-pdf" size={22} color="#FFF" />
              <Text style={{ color: "#FFF", fontSize: 15, fontWeight: "700", marginLeft: 10 }}>Gerar PDF</Text>
            </Pressable>
          </View>
        </View>

        {/* Info */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border }}>
          <Text className="text-muted text-xs font-semibold mb-2">INFORMAÇÕES</Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 }}>
            <Text className="text-muted text-sm">Criado em</Text>
            <Text className="text-foreground text-sm">{new Date(orcamento.criadoEm).toLocaleDateString("pt-BR")}</Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
