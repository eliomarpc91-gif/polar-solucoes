import { useState, useEffect } from "react";
import { ScrollView, Text, View, Pressable, Alert, TextInput, Linking } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getOrdens, saveOrdem, deleteOrdem, getClientes, getEmpresa, OrdemServico, OSStatus, Cliente, EmpresaConfig } from "@/lib/store";
import { generateOSPDF } from "@/lib/pdf-generator";

export default function OSDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [os, setOs] = useState<OrdemServico | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [empresa, setEmpresa] = useState<EmpresaConfig | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [defeito, setDefeito] = useState("");
  const [servicoExecutado, setServicoExecutado] = useState("");
  const [materiaisUsados, setMateriaisUsados] = useState("");
  const [obsTecnica, setObsTecnica] = useState("");

  useEffect(() => {
    loadOS();
  }, [id]);

  const loadOS = async () => {
    const ordens = await getOrdens();
    const found = ordens.find((o) => o.id === id);
    if (found) {
      setOs(found);
      setDefeito(found.diagnostico || "");
      setServicoExecutado(found.observacoesInternas || "");
      setMateriaisUsados("");
      setObsTecnica(found.observacoes || "");
      const clientes = await getClientes();
      const c = clientes.find((cl) => cl.id === found.clienteId);
      setCliente(c || null);
    }
    const emp = await getEmpresa();
    setEmpresa(emp);
  };

  const updateStatus = async (newStatus: OSStatus) => {
    if (!os) return;
    const wasConcluded = os.status === "concluido";
    const willBeConcluded = newStatus === "concluido";

    const updated = {
      ...os,
      status: newStatus,
      atualizadoEm: new Date().toISOString(),
      concluidoEm: newStatus === "concluido" ? new Date().toISOString() : os.concluidoEm,
    };
    await saveOrdem(updated);
    setOs(updated);

    // ─────────────────────────────────────────────────────────────
    // Decrementa/restaura estoque ao concluir/reabrir a OS
    // ─────────────────────────────────────────────────────────────
    try {
      const materiais = (os as any).materiais || [];
      const materiaisComProduto = materiais.filter((m: any) => m.produtoId && (m.quantidade || 0) > 0);

      if (materiaisComProduto.length > 0) {
        const { darBaixaEstoque, adicionarEstoque, getProdutoById } = await import("@/lib/estoque-store");

        // Transição → CONCLUÍDO: dá baixa nos materiais
        if (!wasConcluded && willBeConcluded) {
          let baixasOk = 0;
          let baixasFalha: string[] = [];
          for (const m of materiaisComProduto) {
            const p = await getProdutoById(m.produtoId);
            if (!p) continue;
            const ok = await darBaixaEstoque(m.produtoId, m.quantidade, `OS ${os.codigo || os.numero || os.id?.slice(0, 6)}`, os.id);
            if (ok) baixasOk++;
            else baixasFalha.push(`${p.nome} (precisa ${m.quantidade}, tem ${p.quantidade})`);
          }
          if (baixasOk > 0) {
            const msg = `${baixasOk} item(s) de estoque atualizado(s) automaticamente.`;
            const aviso = baixasFalha.length ? `\n\n⚠️ Sem estoque suficiente:\n• ${baixasFalha.join("\n• ")}` : "";
            setTimeout(() => Alert.alert("Estoque atualizado 📦", msg + aviso), 600);
          } else if (baixasFalha.length) {
            setTimeout(() => Alert.alert("Estoque insuficiente ⚠️", `Os seguintes produtos não tinham estoque suficiente:\n\n• ${baixasFalha.join("\n• ")}`), 600);
          }
        }

        // Transição CONCLUÍDO → outro status: devolve ao estoque
        if (wasConcluded && !willBeConcluded) {
          for (const m of materiaisComProduto) {
            await adicionarEstoque(m.produtoId, m.quantidade, `Reversão OS ${os.codigo || os.numero || os.id?.slice(0, 6)}`, os.id);
          }
          setTimeout(() => Alert.alert("Estoque restaurado 🔄", `Os ${materiaisComProduto.length} item(s) foram devolvidos ao estoque (OS reaberta).`), 600);
        }
      }
    } catch (e) {
      console.warn("[OS] Erro ao atualizar estoque:", e);
    }

    // Quando concluída, cria automaticamente uma cobrança pendente
    if (newStatus === "concluido" && !wasConcluded && (os.valorTotal || 0) > 0) {
      try {
        const { getCobrancas, saveCobranca } = await import("@/lib/store");
        const cobrancas = await getCobrancas();
        const jaExiste = cobrancas.find((c: any) => c.osId === os.id);
        if (!jaExiste) {
          const hoje = new Date();
          const venc = new Date(hoje.getTime() + 7 * 86400000);
          await saveCobranca({
            clienteId: os.clienteId,
            clienteNome: os.clienteNome || "",
            osId: os.id,
            descricao: `Cobrança da OS ${os.codigo || os.numero || ""}`.trim(),
            valorTotal: os.valorTotal || 0,
            valorRecebido: 0,
            status: "pendente",
            dataCriacao: hoje.toISOString().split("T")[0],
            dataVencimento: venc.toISOString().split("T")[0],
            formaPagamento: "",
          });
          Alert.alert(
            "OS concluída ✅",
            `Uma cobrança de R$ ${(os.valorTotal || 0).toFixed(2)} foi criada automaticamente.`,
          );
        }
      } catch (e) {
        console.warn("[OS] Erro ao criar cobrança automática:", e);
      }
    }
  };

  const salvarRegistros = async () => {
    if (!os) return;
    const updated = {
      ...os,
      diagnostico: defeito,
      observacoesInternas: servicoExecutado,
      observacoes: obsTecnica,
      atualizadoEm: new Date().toISOString(),
    };
    await saveOrdem(updated);
    setOs(updated);
    setEditMode(false);
    Alert.alert("Salvo", "Registros atualizados com sucesso!");
  };

  const finalizarOS = () => {
    Alert.alert("Finalizar OS", "Deseja marcar esta OS como concluída?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Finalizar", onPress: () => updateStatus("concluido") },
    ]);
  };

  const handleDelete = () => {
    Alert.alert("Excluir OS", "Tem certeza que deseja excluir esta OS?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          if (os) {
            await deleteOrdem(os.id);
            router.back();
          }
        },
      },
    ]);
  };

  const ligarCliente = () => {
    if (cliente?.telefone) {
      Linking.openURL(`tel:${cliente.telefone}`);
    }
  };

  const whatsappCliente = () => {
    if (cliente?.telefone) {
      Linking.openURL(`https://wa.me/55${cliente.telefone.replace(/\D/g, "")}`);
    }
  };

  const navegarCliente = () => {
    if (cliente?.endereco) {
      const endereco = [cliente.endereco, cliente.numero, cliente.bairro, cliente.cidade, cliente.estado]
        .filter(Boolean)
        .join(", ");
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "aberto": return colors.primary;
      case "em_andamento": return colors.warning;
      case "concluido": return colors.success;
      case "pendente": return colors.error;
      default: return colors.muted;
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "aberto": return "Aberto";
      case "em_andamento": return "Em Andamento";
      case "concluido": return "Concluído";
      case "pendente": return "Pendente";
      default: return status;
    }
  };

  if (!os) {
    return (
      <ScreenContainer edges={["top", "left", "right", "bottom"]}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text className="text-muted">Carregando...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
            <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
          </Pressable>
          <Text className="text-foreground text-xl font-bold ml-4">OS #{os.numero}</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable onPress={() => setEditMode(!editMode)} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
            <MaterialIcons name={editMode ? "close" : "edit"} size={22} color={colors.primary} />
          </Pressable>
          <Pressable onPress={handleDelete} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
            <MaterialIcons name="delete" size={22} color={colors.error} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        {/* Status Rápido */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 14 }}>
          <Text className="text-muted text-xs font-semibold mb-3">STATUS</Text>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            {(["aberto", "em_andamento", "pendente", "concluido"] as OSStatus[]).map((s) => (
              <Pressable
                key={s}
                onPress={() => updateStatus(s)}
                style={({ pressed }) => [
                  {
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 10,
                    backgroundColor: os.status === s ? statusColor(s) : statusColor(s) + "15",
                    borderWidth: 1.5,
                    borderColor: os.status === s ? statusColor(s) : "transparent",
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text style={{ color: os.status === s ? "#FFF" : statusColor(s), fontSize: 12, fontWeight: "700" }}>
                  {statusLabel(s)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Cliente + Ações Rápidas */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 14 }}>
          <Text className="text-muted text-xs font-semibold mb-2">CLIENTE</Text>
          <Text className="text-foreground text-base font-bold">{os.clienteNome}</Text>
          {cliente?.endereco ? <Text className="text-muted text-xs mt-1">{cliente.endereco}</Text> : null}

          {/* Quick Actions */}
          <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
            {cliente?.telefone && (
              <>
                <Pressable
                  onPress={ligarCliente}
                  style={({ pressed }) => [
                    {
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: colors.success + "15",
                      borderRadius: 10,
                      paddingVertical: 12,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <MaterialIcons name="phone" size={18} color={colors.success} />
                  <Text style={{ color: colors.success, fontWeight: "600", fontSize: 12, marginLeft: 6 }}>Ligar</Text>
                </Pressable>
                <Pressable
                  onPress={whatsappCliente}
                  style={({ pressed }) => [
                    {
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#25D366" + "15",
                      borderRadius: 10,
                      paddingVertical: 12,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <MaterialIcons name="chat" size={18} color="#25D366" />
                  <Text style={{ color: "#25D366", fontWeight: "600", fontSize: 12, marginLeft: 6 }}>WhatsApp</Text>
                </Pressable>
              </>
            )}
            {cliente?.endereco && (
              <Pressable
                onPress={navegarCliente}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.primary + "15",
                    borderRadius: 10,
                    paddingVertical: 12,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <MaterialIcons name="navigation" size={18} color={colors.primary} />
                <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 12, marginLeft: 6 }}>Navegar</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Equipamento */}
        {os.equipamentoDesc && (
          <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 14 }}>
            <Text className="text-muted text-xs font-semibold mb-2">EQUIPAMENTO</Text>
            <Text className="text-foreground text-sm">{os.equipamentoDesc}</Text>
          </View>
        )}

        {/* Problema Relatado */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 14 }}>
          <Text className="text-muted text-xs font-semibold mb-2">PROBLEMA RELATADO</Text>
          <Text className="text-foreground text-sm">{os.problema || "Não informado"}</Text>
        </View>

        {/* Registros Técnicos (editáveis) */}
        {editMode ? (
          <>
            <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.primary + "50", marginBottom: 14 }}>
              <Text className="text-muted text-xs font-semibold mb-2">DEFEITO ENCONTRADO</Text>
              <TextInput
                value={defeito}
                onChangeText={setDefeito}
                placeholder="Descreva o defeito encontrado..."
                placeholderTextColor={colors.muted}
                multiline
                style={{ color: colors.foreground, fontSize: 14, minHeight: 60, textAlignVertical: "top" }}
              />
            </View>

            <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.primary + "50", marginBottom: 14 }}>
              <Text className="text-muted text-xs font-semibold mb-2">SERVIÇO EXECUTADO</Text>
              <TextInput
                value={servicoExecutado}
                onChangeText={setServicoExecutado}
                placeholder="Descreva o serviço realizado..."
                placeholderTextColor={colors.muted}
                multiline
                style={{ color: colors.foreground, fontSize: 14, minHeight: 60, textAlignVertical: "top" }}
              />
            </View>

            <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.primary + "50", marginBottom: 14 }}>
              <Text className="text-muted text-xs font-semibold mb-2">MATERIAIS UTILIZADOS</Text>
              <TextInput
                value={materiaisUsados}
                onChangeText={setMateriaisUsados}
                placeholder="Liste os materiais utilizados..."
                placeholderTextColor={colors.muted}
                multiline
                style={{ color: colors.foreground, fontSize: 14, minHeight: 60, textAlignVertical: "top" }}
              />
            </View>

            <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.primary + "50", marginBottom: 14 }}>
              <Text className="text-muted text-xs font-semibold mb-2">OBSERVAÇÕES TÉCNICAS</Text>
              <TextInput
                value={obsTecnica}
                onChangeText={setObsTecnica}
                placeholder="Observações adicionais..."
                placeholderTextColor={colors.muted}
                multiline
                style={{ color: colors.foreground, fontSize: 14, minHeight: 60, textAlignVertical: "top" }}
              />
            </View>

            <Pressable
              onPress={salvarRegistros}
              style={({ pressed }) => [
                {
                  backgroundColor: colors.success,
                  borderRadius: 14,
                  padding: 18,
                  alignItems: "center",
                  marginBottom: 14,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text style={{ color: "#FFF", fontSize: 16, fontWeight: "800" }}>Salvar Registros</Text>
            </Pressable>
          </>
        ) : (
          <>
            {/* Diagnóstico / Defeito */}
            {os.diagnostico && (
              <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 14 }}>
                <Text className="text-muted text-xs font-semibold mb-2">DEFEITO ENCONTRADO</Text>
                <Text className="text-foreground text-sm">{os.diagnostico}</Text>
              </View>
            )}

            {/* Serviço Executado */}
            {os.observacoesInternas && (
              <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 14 }}>
                <Text className="text-muted text-xs font-semibold mb-2">SERVIÇO EXECUTADO</Text>
                <Text className="text-foreground text-sm">{os.observacoesInternas}</Text>
              </View>
            )}

            {/* Observações */}
            {os.observacoes && (
              <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 14 }}>
                <Text className="text-muted text-xs font-semibold mb-2">OBSERVAÇÕES TÉCNICAS</Text>
                <Text className="text-foreground text-sm">{os.observacoes}</Text>
              </View>
            )}
          </>
        )}

        {/* Serviços / Valores */}
        {os.servicos.length > 0 && (
          <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 14 }}>
            <Text className="text-muted text-xs font-semibold mb-3">SERVIÇOS / PEÇAS</Text>
            {os.servicos.map((s) => (
              <View key={s.id} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Text className="text-foreground text-sm flex-1">{s.descricao}</Text>
                <Text style={{ color: colors.success, fontSize: 13, fontWeight: "600" }}>R$ {s.valor.toFixed(2)}</Text>
              </View>
            ))}
            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 12 }}>
              <Text className="text-foreground font-bold">Total</Text>
              <Text style={{ color: colors.success, fontSize: 18, fontWeight: "800" }}>R$ {os.valorTotal.toFixed(2)}</Text>
            </View>
          </View>
        )}

        {/* Fotos e Assinatura (placeholder) */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 14 }}>
          <Text className="text-muted text-xs font-semibold mb-3">FOTOS E ASSINATURA</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable
              onPress={() => Alert.alert("Fotos", "A câmera será ativada no dispositivo físico para capturar fotos antes/depois do serviço.")}
              style={({ pressed }) => [
                {
                  flex: 1,
                  backgroundColor: colors.primary + "10",
                  borderRadius: 12,
                  padding: 16,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.primary + "30",
                  borderStyle: "dashed",
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <MaterialIcons name="camera-alt" size={28} color={colors.primary} />
              <Text style={{ color: colors.primary, fontSize: 11, fontWeight: "600", marginTop: 6 }}>Fotos</Text>
            </Pressable>
            <Pressable
              onPress={() => Alert.alert("Assinatura", "A assinatura digital será capturada no dispositivo físico com toque na tela.")}
              style={({ pressed }) => [
                {
                  flex: 1,
                  backgroundColor: "#7C3AED" + "10",
                  borderRadius: 12,
                  padding: 16,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#7C3AED" + "30",
                  borderStyle: "dashed",
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <MaterialIcons name="draw" size={28} color="#7C3AED" />
              <Text style={{ color: "#7C3AED", fontSize: 11, fontWeight: "600", marginTop: 6 }}>Assinatura</Text>
            </Pressable>
          </View>
        </View>

        {/* Info */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 14 }}>
          <Text className="text-muted text-xs font-semibold mb-2">INFORMAÇÕES</Text>
          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text className="text-muted text-sm">Criado em</Text>
              <Text className="text-foreground text-sm">{new Date(os.criadoEm).toLocaleDateString("pt-BR")}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text className="text-muted text-sm">Atualizado em</Text>
              <Text className="text-foreground text-sm">{new Date(os.atualizadoEm).toLocaleDateString("pt-BR")}</Text>
            </View>
            {os.concluidoEm && (
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text className="text-muted text-sm">Concluído em</Text>
                <Text className="text-foreground text-sm">{new Date(os.concluidoEm).toLocaleDateString("pt-BR")}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Botão Gerar PDF */}
        {!editMode && (
          <Pressable
            onPress={async () => {
              try {
                await generateOSPDF({
                  os,
                  cliente,
                  empresa,
                });
              } catch (e: any) {
                Alert.alert("Erro", e.message || "N\u00e3o foi poss\u00edvel gerar o PDF");
              }
            }}
            style={({ pressed }) => [
              {
                backgroundColor: colors.primary,
                borderRadius: 14,
                padding: 18,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                marginBottom: 12,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <MaterialIcons name="picture-as-pdf" size={22} color="#FFF" />
            <Text style={{ color: "#FFF", fontSize: 16, fontWeight: "800", marginLeft: 10 }}>Gerar PDF</Text>
          </Pressable>
        )}

        {/* Botão Finalizar */}
        {os.status !== "concluido" && !editMode && (
          <Pressable
            onPress={finalizarOS}
            style={({ pressed }) => [
              {
                backgroundColor: colors.success,
                borderRadius: 14,
                padding: 18,
                alignItems: "center",
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text style={{ color: "#FFF", fontSize: 16, fontWeight: "800" }}>Finalizar OS</Text>
          </Pressable>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
