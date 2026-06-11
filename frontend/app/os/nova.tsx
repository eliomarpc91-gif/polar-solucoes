import { useState, useEffect } from "react";
import { ScrollView, Text, View, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import { InputField } from "@/components/input-field";
import {
  getClientes,
  saveOrdem,
  getNextOSNumber,
  generateId,
  getEmpresa,
  getEquipamentos,
  Cliente,
  ServicoItem,
  MaterialItem,
  OrdemServico,
} from "@/lib/store";

interface EquipamentoOSItem {
  id: string;
  equipamentoCadastradoId?: string;
  marca: string;
  modelo: string;
  serie: string;
  patrimonio?: string;
  localizacao?: string;
  problema: string;
  diagnostico: string;
  status: "aguardando_diagnostico" | "orcamento_enviado" | "aprovado" | "em_execucao" | "concluido" | "sem_reparo";
}

const STATUS_EQUIP_LIST = [
  { value: "aguardando_diagnostico", label: "Aguardando diagnóstico", color: "#10B981", bg: "#ECFDF5" },
  { value: "orcamento_enviado", label: "Orçamento enviado", color: "#1E88E5", bg: "#EFF6FF" },
  { value: "aprovado", label: "Aprovado", color: "#0D3B66", bg: "#DBEAFE" },
  { value: "em_execucao", label: "Em execução", color: "#F59E0B", bg: "#FEF3C7" },
  { value: "concluido", label: "Concluído", color: "#10B981", bg: "#D1FAE5" },
  { value: "sem_reparo", label: "Sem reparo", color: "#EF4444", bg: "#FEE2E2" },
] as const;

export default function NovaOSScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ clienteId?: string; equipamentoId?: string }>();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [searchCliente, setSearchCliente] = useState("");
  const [showClienteList, setShowClienteList] = useState(false);
  const [equipamentos, setEquipamentos] = useState<EquipamentoOSItem[]>([]);
  const [equipamentosExpandidos, setEquipamentosExpandidos] = useState<Record<string, boolean>>({});
  const [observacoes, setObservacoes] = useState("");
  const [custoDeslocamento, setCustoDeslocamento] = useState("");
  const [horasTrabalhadas, setHorasTrabalhadas] = useState("");
  const [custoMaoDeObra, setCustoMaoDeObra] = useState("");
  const [servicos, setServicos] = useState<ServicoItem[]>([]);
  const [novoServico, setNovoServico] = useState({ descricao: "", valor: "" });
  const [materiais, setMateriais] = useState<MaterialItem[]>([]);
  const [novoMaterial, setNovoMaterial] = useState({ descricao: "", quantidade: "1", valorUnitario: "" });
  const [tecnicoResponsavel, setTecnicoResponsavel] = useState("");

  useEffect(() => {
    loadClientes();
    loadTecnico();
  }, []);

  // Pré-preenche cliente e cria equipamento automaticamente quando vem do scanner/QR
  useEffect(() => {
    const autoFill = async () => {
      if (params.clienteId && clientes.length > 0 && !clienteSelecionado) {
        const c = clientes.find((cl) => cl.id === params.clienteId);
        if (c) {
          setClienteSelecionado(c);
          setSearchCliente(c.nome);
        }
      }
      if (params.equipamentoId && equipamentos.length === 0) {
        try {
          const equips = await getEquipamentos();
          const e = equips.find((eq) => eq.id === params.equipamentoId);
          if (e) {
            const novoId = generateId();
            setEquipamentos([
              {
                id: novoId,
                equipamentoCadastradoId: e.id, // vínculo permanente p/ histórico
                marca: e.marca || "",
                modelo: e.modelo || "",
                serie: e.serie || "",
                problema: "",
                diagnostico: "",
                status: "aguardando_diagnostico",
              },
            ]);
            setEquipamentosExpandidos({ [novoId]: true });
          }
        } catch {}
      }
    };
    autoFill();
  }, [clientes, params.clienteId, params.equipamentoId]);

  const loadClientes = async () => {
    const data = await getClientes();
    setClientes(data);
  };

  const loadTecnico = async () => {
    const empresa = await getEmpresa();
    if (empresa?.tecnicoResponsavel) {
      setTecnicoResponsavel(empresa.tecnicoResponsavel);
    }
  };

  const filteredClientes = clientes.filter(
    (c) =>
      searchCliente === "" ||
      c.nome.toLowerCase().includes(searchCliente.toLowerCase()) ||
      c.telefone.includes(searchCliente)
  );

  const addEquipamento = () => {
    const id = generateId();
    const novo: EquipamentoOSItem = {
      id,
      marca: "",
      modelo: "",
      serie: "",
      problema: "",
      diagnostico: "",
      status: "aguardando_diagnostico",
    };
    setEquipamentos([...equipamentos, novo]);
    setEquipamentosExpandidos({ ...equipamentosExpandidos, [id]: true });
  };

  const updateEquipamento = (id: string, patch: Partial<EquipamentoOSItem>) => {
    setEquipamentos(equipamentos.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const toggleExpandido = (id: string) => {
    setEquipamentosExpandidos({ ...equipamentosExpandidos, [id]: !equipamentosExpandidos[id] });
  };

  const removeEquipamento = (id: string) => {
    Alert.alert("Remover equipamento", "Tem certeza que deseja remover este equipamento?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: () => setEquipamentos(equipamentos.filter((e) => e.id !== id)),
      },
    ]);
  };

  const addServico = () => {
    if (!novoServico.descricao) {
      Alert.alert("Erro", "Preencha a descrição do serviço");
      return;
    }
    const item: ServicoItem = {
      id: generateId(),
      descricao: novoServico.descricao,
      valor: novoServico.valor ? parseFloat(novoServico.valor.replace(",", ".")) || 0 : 0,
      quantidade: 1,
    };
    setServicos([...servicos, item]);
    setNovoServico({ descricao: "", valor: "" });
  };

  const removeServico = (id: string) => {
    setServicos(servicos.filter((s) => s.id !== id));
  };

  const addMaterial = () => {
    if (!novoMaterial.descricao) {
      Alert.alert("Erro", "Preencha a descrição do material");
      return;
    }
    const mat: MaterialItem = {
      id: generateId(),
      descricao: novoMaterial.descricao,
      quantidade: parseInt(novoMaterial.quantidade) || 1,
      valorUnitario: novoMaterial.valorUnitario ? parseFloat(novoMaterial.valorUnitario.replace(",", ".")) || 0 : 0,
      lucroPercent: 0,
      frete: 0,
    };
    setMateriais([...materiais, mat]);
    setNovoMaterial({ descricao: "", quantidade: "1", valorUnitario: "" });
  };

  const removeMaterial = (id: string) => {
    setMateriais(materiais.filter((m) => m.id !== id));
  };

  const valorServicos = servicos.reduce((sum, s) => sum + s.valor * s.quantidade, 0);
  const valorMateriais = materiais.reduce((sum, m) => sum + m.valorUnitario * m.quantidade, 0);
  const valorTotal = valorServicos + valorMateriais;

  const salvar = async () => {
    if (!clienteSelecionado) {
      Alert.alert("Erro", "Selecione um cliente");
      return;
    }
    if (equipamentos.length === 0) {
      Alert.alert("Erro", "Adicione ao menos 1 equipamento");
      return;
    }
    const equipInvalido = equipamentos.find((e) => !e.marca || !e.modelo || !e.problema);
    if (equipInvalido) {
      const idx = equipamentos.indexOf(equipInvalido) + 1;
      Alert.alert("Erro", `Preencha Marca, Modelo e Problema do Equipamento ${String(idx).padStart(2, "0")}`);
      return;
    }

    const numero = await getNextOSNumber();
    // Concatena problemas/diagnósticos de todos equipamentos para compatibilidade com PDFs antigos
    const problemaConcatenado = equipamentos
      .map((e, i) => `[Equipamento ${String(i + 1).padStart(2, "0")} - ${e.marca} ${e.modelo}]\n${e.problema}`)
      .join("\n\n");
    const diagnosticoConcatenado = equipamentos
      .filter((e) => e.diagnostico)
      .map((e, i) => `[Equipamento ${String(i + 1).padStart(2, "0")} - ${e.marca} ${e.modelo}]\n${e.diagnostico}`)
      .join("\n\n");

    // Se houver UM equipamento vinculado a um Equipamento global, define equipamentoId no nível superior também
    const primeiroVinculado = equipamentos.find((e) => (e as any).equipamentoCadastradoId);
    const equipamentoIdTopo = primeiroVinculado ? (primeiroVinculado as any).equipamentoCadastradoId : undefined;

    const os: OrdemServico = {
      id: generateId(),
      numero,
      clienteId: clienteSelecionado.id,
      clienteNome: clienteSelecionado.nome,
      equipamentoId: equipamentoIdTopo,
      equipamentos,
      problema: problemaConcatenado,
      diagnostico: diagnosticoConcatenado,
      servicos,
      materiais,
      observacoes,
      observacoesInternas: "",
      status: "aberto",
      valorTotal,
      valorDesconto: 0,
      formaPagamento: "",
      tecnicoResponsavel,
      custoDeslocamento: parseFloat(custoDeslocamento.replace(",", ".")) || 0,
      horasTrabalhadas: parseFloat(horasTrabalhadas.replace(",", ".")) || 0,
      custoMaoDeObra: parseFloat(custoMaoDeObra.replace(",", ".")) || 0,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
      statusPagamento: "pendente",
    };

    await saveOrdem(os);
    Alert.alert("Sucesso", `OS #${numero} criada com sucesso!`, [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top", "left", "right"]}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text className="text-foreground text-xl font-bold ml-4">Nova Ordem de Serviço</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} keyboardShouldPersistTaps="always" scrollEnabled={true}>
        {/* Cliente Selection */}
        <Text className="text-muted text-xs font-semibold mb-2 ml-1">CLIENTE *</Text>
        {clienteSelecionado ? (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 10,
              padding: 14,
              borderWidth: 1,
              borderColor: colors.primary,
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text className="text-foreground font-semibold">{clienteSelecionado.nome}</Text>
              <Text className="text-muted text-xs mt-1">{clienteSelecionado.telefone}</Text>
            </View>
            <Pressable onPress={() => { setClienteSelecionado(null); setShowClienteList(true); }}>
              <MaterialIcons name="close" size={20} color={colors.muted} />
            </Pressable>
          </View>
        ) : (
          <View style={{ marginBottom: 16 }}>
            <TextInput
              value={searchCliente}
              onChangeText={(t) => { setSearchCliente(t); setShowClienteList(true); }}
              placeholder="Buscar cliente ou telefone..."
              placeholderTextColor={colors.muted}
              onFocus={() => setShowClienteList(true)}
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                padding: 14,
                color: colors.foreground,
                fontSize: 14,
              }}
            />
            {showClienteList && (
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 10,
                  marginTop: 4,
                  maxHeight: 200,
                }}
              >
                {filteredClientes.length === 0 ? (
                  <View style={{ padding: 16, alignItems: "center" }}>
                    <Text className="text-muted text-sm">Nenhum cliente encontrado</Text>
                    <Pressable
                      onPress={() => router.push("/cliente/novo" as any)}
                      style={{ marginTop: 8 }}
                    >
                      <Text style={{ color: colors.primary, fontWeight: "600" }}>+ Novo Cliente</Text>
                    </Pressable>
                  </View>
                ) : (
                  filteredClientes.slice(0, 5).map((c) => (
                    <Pressable
                      key={c.id}
                      onPress={() => {
                        setClienteSelecionado(c);
                        setShowClienteList(false);
                        setSearchCliente("");
                      }}
                      style={({ pressed }) => [
                        {
                          padding: 12,
                          borderBottomWidth: 1,
                          borderBottomColor: colors.border,
                          backgroundColor: pressed ? colors.border : "transparent",
                        },
                      ]}
                    >
                      <Text className="text-foreground text-sm font-medium">{c.nome}</Text>
                      <Text className="text-muted text-xs">{c.telefone}</Text>
                    </Pressable>
                  ))
                )}
              </View>
            )}
          </View>
        )}

        {/* EQUIPAMENTOS — cada card com problema + diagnóstico + status */}
        <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 10, marginLeft: 4, marginTop: 6 }}>
          EQUIPAMENTOS
        </Text>

        {equipamentos.map((eq, idx) => {
          const expanded = equipamentosExpandidos[eq.id] !== false;
          const numero = String(idx + 1).padStart(2, "0");
          const statusDef = STATUS_EQUIP_LIST.find((s) => s.value === eq.status) || STATUS_EQUIP_LIST[0];
          return (
            <View
              key={eq.id}
              style={{
                backgroundColor: "#fff",
                borderRadius: 14,
                padding: 14,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                shadowColor: "#0D3B66",
                shadowOpacity: 0.04,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
                elevation: 1,
              }}
            >
              {/* Header do card */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "#1E88E5", alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ color: "#fff", fontWeight: "800", fontSize: 12 }}>{numero}</Text>
                </View>
                <Text style={{ flex: 1, fontSize: 15, fontWeight: "800", color: "#0D3B66" }}>
                  Equipamento {numero}
                </Text>
                {/* Status badge - clicável para abrir picker */}
                <Pressable
                  onPress={() => {
                    Alert.alert("Status do equipamento", "", STATUS_EQUIP_LIST.map((s) => ({
                      text: s.label,
                      onPress: () => updateEquipamento(eq.id, { status: s.value as any }),
                    })).concat([{ text: "Cancelar", onPress: () => {} } as any]));
                  }}
                  style={{ backgroundColor: statusDef.bg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, flexDirection: "row", alignItems: "center", gap: 4 }}
                >
                  <Text style={{ color: statusDef.color, fontWeight: "700", fontSize: 11 }}>{statusDef.label}</Text>
                  <MaterialIcons name="arrow-drop-down" size={16} color={statusDef.color} />
                </Pressable>
                <Pressable onPress={() => toggleExpandido(eq.id)} hitSlop={6}>
                  <MaterialIcons name={expanded ? "expand-less" : "expand-more"} size={22} color="#64748B" />
                </Pressable>
                <Pressable onPress={() => removeEquipamento(eq.id)} hitSlop={6}>
                  <MaterialIcons name="delete-outline" size={20} color="#EF4444" />
                </Pressable>
              </View>

              {expanded && (
                <View style={{ marginTop: 14 }}>
                  {/* Marca / Modelo / Série */}
                  <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "#475569", fontSize: 11, fontWeight: "600", marginBottom: 5 }}>Marca *</Text>
                      <TextInput
                        value={eq.marca}
                        onChangeText={(t) => updateEquipamento(eq.id, { marca: t })}
                        placeholder="Marca"
                        placeholderTextColor="#94A3B8"
                        style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: colors.foreground, fontSize: 14 }}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "#475569", fontSize: 11, fontWeight: "600", marginBottom: 5 }}>Modelo *</Text>
                      <TextInput
                        value={eq.modelo}
                        onChangeText={(t) => updateEquipamento(eq.id, { modelo: t })}
                        placeholder="Modelo"
                        placeholderTextColor="#94A3B8"
                        style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: colors.foreground, fontSize: 14 }}
                      />
                    </View>
                  </View>
                  <Text style={{ color: "#475569", fontSize: 11, fontWeight: "600", marginBottom: 5 }}>
                    Número de Série <Text style={{ color: "#94A3B8", fontWeight: "400" }}>(opcional)</Text>
                  </Text>
                  <TextInput
                    value={eq.serie}
                    onChangeText={(t) => updateEquipamento(eq.id, { serie: t })}
                    placeholder="Série"
                    placeholderTextColor="#94A3B8"
                    style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: colors.foreground, fontSize: 14, marginBottom: 12 }}
                  />

                  <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "#475569", fontSize: 11, fontWeight: "600", marginBottom: 5 }}>
                        Patrimônio <Text style={{ color: "#94A3B8", fontWeight: "400" }}>(opcional)</Text>
                      </Text>
                      <TextInput
                        value={(eq as any).patrimonio || ""}
                        onChangeText={(t) => updateEquipamento(eq.id, { patrimonio: t } as any)}
                        placeholder="Ex: PAT-001"
                        placeholderTextColor="#94A3B8"
                        style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: colors.foreground, fontSize: 14 }}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "#475569", fontSize: 11, fontWeight: "600", marginBottom: 5 }}>
                        Localização <Text style={{ color: "#94A3B8", fontWeight: "400" }}>(opcional)</Text>
                      </Text>
                      <TextInput
                        value={(eq as any).localizacao || ""}
                        onChangeText={(t) => updateEquipamento(eq.id, { localizacao: t } as any)}
                        placeholder="Ex: Cozinha"
                        placeholderTextColor="#94A3B8"
                        style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: colors.foreground, fontSize: 14 }}
                      />
                    </View>
                  </View>

                  <Text style={{ color: "#475569", fontSize: 11, fontWeight: "600", marginBottom: 5 }}>Problema Relatado *</Text>
                  <TextInput
                    value={eq.problema}
                    onChangeText={(t) => updateEquipamento(eq.id, { problema: t })}
                    placeholder="Descreva o problema relatado neste equipamento..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: colors.foreground, fontSize: 14, minHeight: 70, textAlignVertical: "top", marginBottom: 12 }}
                  />

                  <Text style={{ color: "#475569", fontSize: 11, fontWeight: "600", marginBottom: 5 }}>Diagnóstico Técnico</Text>
                  <TextInput
                    value={eq.diagnostico}
                    onChangeText={(t) => updateEquipamento(eq.id, { diagnostico: t })}
                    placeholder="Descreva o diagnóstico técnico deste equipamento..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: colors.foreground, fontSize: 14, minHeight: 70, textAlignVertical: "top" }}
                  />
                </View>
              )}
            </View>
          );
        })}

        {/* Botão Adicionar Equipamento */}
        <Pressable
          onPress={addEquipamento}
          style={({ pressed }) => [{
            borderWidth: 2,
            borderColor: "#1E88E5",
            borderStyle: "dashed",
            borderRadius: 14,
            paddingVertical: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            backgroundColor: pressed ? "#EFF6FF" : "transparent",
            marginBottom: 18,
          }]}
        >
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "#1E88E5", alignItems: "center", justifyContent: "center" }}>
            <MaterialIcons name="add" size={20} color="#fff" />
          </View>
          <Text style={{ color: "#1E88E5", fontWeight: "800", fontSize: 14 }}>Adicionar Equipamento</Text>
        </Pressable>


        {/* Serviços */}
        <Text className="text-muted text-xs font-semibold mb-2 ml-1">SERVIÇOS</Text>
        {servicos.map((s) => (
          <View
            key={s.id}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 10,
              padding: 12,
              marginBottom: 8,
              borderWidth: 1,
              borderColor: colors.border,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <View style={{ flex: 1 }}>
              <Text className="text-foreground text-sm">{s.descricao}</Text>
              <Text style={{ color: colors.success, fontSize: 12, marginTop: 2 }}>
                R$ {s.valor.toFixed(2)}
              </Text>
            </View>
            <Pressable onPress={() => removeServico(s.id)}>
              <MaterialIcons name="delete" size={20} color={colors.error} />
            </Pressable>
          </View>
        ))}

        <View style={{ flexDirection: "row", gap: 10, marginBottom: 8 }}>
          <TextInput
            value={novoServico.descricao}
            onChangeText={(t) => setNovoServico({ ...novoServico, descricao: t })}
            placeholder="Descrição do serviço"
            placeholderTextColor={colors.muted}
            style={{
              flex: 2,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 10,
              padding: 12,
              color: colors.foreground,
              fontSize: 14,
            }}
          />
          <TextInput
            value={novoServico.valor}
            onChangeText={(t) => setNovoServico({ ...novoServico, valor: t })}
            placeholder="Valor"
            placeholderTextColor={colors.muted}
            keyboardType="decimal-pad"
            style={{
              flex: 1,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 10,
              padding: 12,
              color: colors.foreground,
              fontSize: 14,
            }}
          />
          <Pressable
            onPress={addServico}
            style={({ pressed }) => [
              {
                backgroundColor: colors.primary,
                borderRadius: 10,
                paddingHorizontal: 12,
                justifyContent: "center",
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <MaterialIcons name="add" size={20} color="white" />
          </Pressable>
        </View>

        {/* Materiais */}
        <Text className="text-muted text-xs font-semibold mb-2 ml-1 mt-2">MATERIAIS</Text>
        {materiais.map((m) => (
          <View
            key={m.id}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 10,
              padding: 12,
              marginBottom: 8,
              borderWidth: 1,
              borderColor: colors.border,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <View style={{ flex: 1 }}>
              <Text className="text-foreground text-sm">{m.descricao}</Text>
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
                {m.quantidade}x R$ {m.valorUnitario.toFixed(2)} = R$ {(m.quantidade * m.valorUnitario).toFixed(2)}
              </Text>
            </View>
            <Pressable onPress={() => removeMaterial(m.id)}>
              <MaterialIcons name="delete" size={20} color={colors.error} />
            </Pressable>
          </View>
        ))}

        <View style={{ gap: 10, marginBottom: 8 }}>
          <TextInput
            value={novoMaterial.descricao}
            onChangeText={(t) => setNovoMaterial({ ...novoMaterial, descricao: t })}
            placeholder="Descrição do material"
            placeholderTextColor={colors.muted}
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 10,
              padding: 12,
              color: colors.foreground,
              fontSize: 14,
            }}
          />
          <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '600', marginLeft: 4 }}>Quantidade de itens</Text>
          <TextInput
            value={novoMaterial.quantidade}
            onChangeText={(t) => setNovoMaterial({ ...novoMaterial, quantidade: t })}
            placeholder="1"
            placeholderTextColor={colors.muted}
            keyboardType="number-pad"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 10,
              padding: 12,
              color: colors.foreground,
              fontSize: 14,
            }}
          />
          <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '600', marginLeft: 4 }}>Valor Unitário</Text>
          <TextInput
            value={novoMaterial.valorUnitario}
            onChangeText={(t) => setNovoMaterial({ ...novoMaterial, valorUnitario: t })}
            placeholder="0.00"
            placeholderTextColor={colors.muted}
            keyboardType="decimal-pad"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 10,
              padding: 12,
              color: colors.foreground,
              fontSize: 14,
            }}
          />
          <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '600', marginLeft: 4 }}>Margem de lucro %</Text>
          <TextInput
            value={novoMaterial.margemLucro || ''}
            onChangeText={(t) => setNovoMaterial({ ...novoMaterial, margemLucro: t })}
            placeholder="30"
            placeholderTextColor={colors.muted}
            keyboardType="number-pad"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 10,
              padding: 12,
              color: colors.foreground,
              fontSize: 14,
            }}
          />
          <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '600', marginLeft: 4 }}>Valor do frete</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TextInput
              value={novoMaterial.frete || ''}
              onChangeText={(t) => setNovoMaterial({ ...novoMaterial, frete: t })}
              placeholder="0.00"
              placeholderTextColor={colors.muted}
              keyboardType="decimal-pad"
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                padding: 12,
                color: colors.foreground,
                fontSize: 14,
              }}
            />
            <Pressable
              onPress={addMaterial}
              style={({ pressed }) => [
                {
                  backgroundColor: colors.primary,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  justifyContent: "center",
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <MaterialIcons name="add" size={20} color="white" />
            </Pressable>
          </View>
        </View>

        {/* Observações */}
        <InputField
          label="OBSERVAÇÕES"
          value={observacoes}
          onChangeText={setObservacoes}
          placeholder="Observações gerais..."
          multiline
        />

        {/* CUSTOS PARA RENTABILIDADE */}
        <View style={{ backgroundColor: "#F8FAFC", borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: "#E2E8F0" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <MaterialIcons name="trending-up" size={18} color="#0D3B66" />
            <Text style={{ color: "#0D3B66", fontWeight: "800", fontSize: 13, letterSpacing: 0.5 }}>
              CUSTOS PARA RENTABILIDADE
            </Text>
          </View>
          <Text style={{ color: "#64748B", fontSize: 11, marginBottom: 12 }}>
            Informe os custos para análise de lucratividade. Deixe em branco para usar valores padrão.
          </Text>

          <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#475569", fontSize: 11, fontWeight: "600", marginBottom: 5 }}>Horas Trabalhadas</Text>
              <TextInput
                value={horasTrabalhadas}
                onChangeText={setHorasTrabalhadas}
                placeholder="0"
                placeholderTextColor="#94A3B8"
                keyboardType="decimal-pad"
                style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: colors.foreground, fontSize: 14 }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#475569", fontSize: 11, fontWeight: "600", marginBottom: 5 }}>Custo Deslocamento (R$)</Text>
              <TextInput
                value={custoDeslocamento}
                onChangeText={setCustoDeslocamento}
                placeholder="0,00"
                placeholderTextColor="#94A3B8"
                keyboardType="decimal-pad"
                style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: colors.foreground, fontSize: 14 }}
              />
            </View>
          </View>

          <Text style={{ color: "#475569", fontSize: 11, fontWeight: "600", marginBottom: 5 }}>
            Custo Mão de Obra (R$) <Text style={{ color: "#94A3B8", fontWeight: "400" }}>(opcional — auto se horas × R$ 50/h)</Text>
          </Text>
          <TextInput
            value={custoMaoDeObra}
            onChangeText={setCustoMaoDeObra}
            placeholder="0,00"
            placeholderTextColor="#94A3B8"
            keyboardType="decimal-pad"
            style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: colors.foreground, fontSize: 14 }}
          />
        </View>

        {/* Resumo */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 10,
            padding: 16,
            marginTop: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
            <Text className="text-muted text-sm">Serviços:</Text>
            <Text className="text-foreground text-sm font-semibold">R$ {valorServicos.toFixed(2)}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
            <Text className="text-muted text-sm">Materiais:</Text>
            <Text className="text-foreground text-sm font-semibold">R$ {valorMateriais.toFixed(2)}</Text>
          </View>
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: colors.border,
              paddingTop: 8,
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <Text className="text-foreground font-bold">TOTAL:</Text>
            <Text style={{ color: colors.success, fontSize: 16, fontWeight: "bold" }}>
              R$ {valorTotal.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Botão Salvar */}
        <Pressable
          onPress={salvar}
          style={({ pressed }) => [
            {
              backgroundColor: colors.primary,
              borderRadius: 10,
              padding: 16,
              alignItems: "center",
              marginTop: 20,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Text className="text-white font-bold text-base">Salvar Ordem de Serviço</Text>
        </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
