import { useState, useEffect } from "react";
import { ScrollView, Text, View, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform, Modal } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getClientes,
  getEmpresa,
  generateId,
  saveCobranca,
  saveOrcamento,
  getCobrancas,
  Cliente,
  ServicoItem,
  MaterialItem,
  GastosOperacionais,
  Orcamento,
  EquipamentoOS,
} from "@/lib/store";
import { getProdutos } from "@/lib/estoque-store";
import { Produto } from "@/lib/estoque-types";
import { EstoqueSelector } from "./estoque-selector";
import { HHCobrancaSelector, CobrancaConfig } from "./hh-cobranca-selector";
import { calcularHH } from "@/lib/hh-store";
import {
  calcularTotalServicos,
  calcularTotalMateriais,
  calcularTotalGastosOperacionais,
  distribuirGastosOperacionais,
  calcularValorTotalOrcamento,
  calcularValorComDesconto,
  calcularValorServico,
  calcularValorMaterial,
} from "@/lib/orcamento-utils";
import { DescontoSelector, DescontoConfig } from "./desconto-selector";

const UNIDADES = ["un", "pç", "kg", "g", "m", "cm", "m²", "m³", "L", "mL", "cx", "h"];

function UnidadeSelector({
  value,
  onChange,
  colors,
}: {
  value: string;
  onChange: (u: string) => void;
  colors: any;
}) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");

  return (
    <View>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        testID="unidade-selector-btn"
        style={({ pressed }) => ({
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 10,
          paddingHorizontal: 12,
          height: 46,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "600" }}>{value || "un"}</Text>
        <MaterialIcons name={open ? "arrow-drop-up" : "arrow-drop-down"} size={22} color={colors.muted} />
      </Pressable>
      {open && (
        <View
          style={{
            marginTop: 6,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            padding: 8,
          }}
        >
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {UNIDADES.map((u) => {
              const selected = u === value;
              return (
                <Pressable
                  key={u}
                  onPress={() => {
                    onChange(u);
                    setOpen(false);
                  }}
                  testID={`unidade-opt-${u}`}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 8,
                    backgroundColor: selected ? colors.primary : colors.background,
                    borderWidth: 1,
                    borderColor: selected ? colors.primary : colors.border,
                  }}
                >
                  <Text style={{ color: selected ? "#fff" : colors.foreground, fontSize: 12, fontWeight: "600" }}>
                    {u}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={{ flexDirection: "row", gap: 6, marginTop: 8 }}>
            <TextInput
              value={custom}
              onChangeText={setCustom}
              placeholder="Outra (ex: rolo)"
              placeholderTextColor={colors.muted}
              style={{
                flex: 1,
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 8,
                color: colors.foreground,
                fontSize: 13,
              }}
              testID="unidade-custom-input"
            />
            <Pressable
              onPress={() => {
                if (custom.trim()) {
                  onChange(custom.trim());
                  setCustom("");
                  setOpen(false);
                }
              }}
              style={({ pressed }) => ({
                backgroundColor: colors.primary,
                borderRadius: 8,
                paddingHorizontal: 12,
                justifyContent: "center",
                opacity: pressed ? 0.7 : 1,
              })}
              testID="unidade-custom-apply"
            >
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>OK</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

export interface OrcamentoFormProps {
  orcamentoInicial?: Orcamento;
  onSave: (orcamento: Orcamento) => Promise<void>;
  onCancel: () => void;
  titulo: string;
  numero?: number;
}

export function OrcamentoForm({
  orcamentoInicial,
  onSave,
  onCancel,
  titulo,
  numero,
}: OrcamentoFormProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [searchCliente, setSearchCliente] = useState("");
  const [showClienteList, setShowClienteList] = useState(false);
  const [itens, setItens] = useState<ServicoItem[]>([]);
  const [novoItem, setNovoItem] = useState({ descricao: "", detalhes: "", valor: "" });
  const [materiais, setMateriais] = useState<MaterialItem[]>([]);
  const [novoMaterial, setNovoMaterial] = useState({
    descricao: "",
    detalhes: "",
    quantidade: "1",
    unidade: "un",
    valorUnitario: "",
    lucroPercent: "",
    frete: "",
  });
  const [gastos, setGastos] = useState<GastosOperacionais>({
    transporte: 0,
    alimentacao: 0,
    hospedagem: 0,
    outros: 0,
    descricaoOutros: "",
  });
  const [observacoes, setObservacoes] = useState("");
  const [tecnicoResponsavel, setTecnicoResponsavel] = useState("");
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [showProdutosList, setShowProdutosList] = useState(false);
  const [searchProduto, setSearchProduto] = useState("");
  const [quantidadeProduto, setQuantidadeProduto] = useState("1");
  const [cobrancaConfig, setCobrancaConfig] = useState<CobrancaConfig | null>(null);
  const [modoServico, setModoServico] = useState<"hh" | "avulso">("avulso");
  const [hhIdeal, setHhIdeal] = useState(0);
  const [horasServico, setHorasServico] = useState("");
  const [valorAvulsoServico, setValorAvulsoServico] = useState("");
  const [materialEditando, setMaterialEditando] = useState<MaterialItem | null>(null);
  const [showEditarMaterial, setShowEditarMaterial] = useState(false);
  const [materialEditadoForm, setMaterialEditadoForm] = useState({
    descricao: "",
    detalhes: "",
    quantidade: "1",
    unidade: "un",
    valorUnitario: "",
    lucroPercent: "",
    frete: "",
  });
  // Edição de serviço durante o orçamento
  const [servicoEditando, setServicoEditando] = useState<ServicoItem | null>(null);
  const [showEditarServico, setShowEditarServico] = useState(false);
  const [servicoEditadoForm, setServicoEditadoForm] = useState({
    descricao: "",
    detalhes: "",
    valor: "",
    quantidade: "1",
  });
  // Equipamentos do orçamento
  const [equipamentos, setEquipamentos] = useState<EquipamentoOS[]>([]);
  const [equipamentosExpandidos, setEquipamentosExpandidos] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [desconto, setDesconto] = useState<DescontoConfig | undefined>(undefined);

  useEffect(() => {
    loadClientes();
    loadTecnico();
    loadProdutos();
    carregarHH();
    if (orcamentoInicial) {
      setItens(orcamentoInicial.itens);
      setMateriais(orcamentoInicial.materiais);
      setGastos(orcamentoInicial.gastosOperacionais);
      setObservacoes(orcamentoInicial.observacoes);
      setTecnicoResponsavel(orcamentoInicial.tecnicoResponsavel);
      setCobrancaConfig(orcamentoInicial.cobrancaMaoDeObra || null);
      setDesconto(orcamentoInicial.desconto);
      setEquipamentos((orcamentoInicial as any).equipamentos || []);
    }
  }, []);

  useEffect(() => {
    if (orcamentoInicial && clientes.length > 0) {
      const cliente = clientes.find((c) => c.id === orcamentoInicial.clienteId);
      if (cliente) {
        setClienteSelecionado(cliente);
      }
    }
  }, [clientes, orcamentoInicial]);

  const carregarHH = async () => {
    const hh = await calcularHH();
    if (hh) {
      setHhIdeal(hh.hh_ideal);
    }
  };

  const loadTecnico = async () => {
    const empresa = await getEmpresa();
    if (empresa?.tecnicoResponsavel) {
      setTecnicoResponsavel(empresa.tecnicoResponsavel);
    }
  };

  const loadClientes = async () => {
    const data = await getClientes();
    setClientes(data);
  };

  const loadProdutos = async () => {
    const data = await getProdutos();
    setProdutos(data);
  };

  const filteredClientes = clientes.filter(
    (c) =>
      searchCliente === "" ||
      c.nome.toLowerCase().includes(searchCliente.toLowerCase()) ||
      c.telefone.includes(searchCliente)
  );

  const addItem = () => {
    if (!novoItem.descricao) {
      Alert.alert("Erro", "Preencha a descrição do serviço");
      return;
    }

    let valor = 0;
    if (modoServico === "hh") {
      if (horasServico) {
        const horas = parseFloat(horasServico.replace(",", ".")) || 0;
        valor = horas * hhIdeal;
      }
    } else {
      valor = parseFloat(valorAvulsoServico.replace(",", ".")) || 0;
    }

    if (valor <= 0) {
      Alert.alert("Erro", "Valor do serviço deve ser maior que zero");
      return;
    }

    const item: ServicoItem = {
      id: generateId(),
      descricao: novoItem.descricao,
      detalhes: novoItem.detalhes?.trim() || undefined,
      valor,
      quantidade: 1,
    } as ServicoItem;
    setItens([...itens, item]);
    setNovoItem({ descricao: "", detalhes: "", valor: "" });
    setHorasServico("");
    setValorAvulsoServico("");
  };

  const removeItem = (id: string) => {
    setItens(itens.filter((i) => i.id !== id));
  };

  const addMaterial = () => {
    if (!novoMaterial.descricao || !novoMaterial.valorUnitario) {
      Alert.alert("Erro", "Preencha descrição e valor do material");
      return;
    }
    const mat: MaterialItem = {
      id: generateId(),
      descricao: novoMaterial.descricao,
      detalhes: novoMaterial.detalhes?.trim() || undefined,
      quantidade: parseFloat(novoMaterial.quantidade.replace(",", ".")) || 1,
      unidade: novoMaterial.unidade || "un",
      valorUnitario: parseFloat(novoMaterial.valorUnitario.replace(",", ".")) || 0,
      lucroPercent: novoMaterial.lucroPercent.trim()
        ? parseFloat(novoMaterial.lucroPercent.replace(",", ".")) || 0
        : 0,
      frete: novoMaterial.frete.trim()
        ? parseFloat(novoMaterial.frete.replace(",", ".")) || 0
        : 0,
    } as MaterialItem;
    setMateriais([...materiais, mat]);
    setNovoMaterial({ descricao: "", detalhes: "", quantidade: "1", unidade: "un", valorUnitario: "", lucroPercent: "", frete: "" });
  };

  const removeMaterial = (id: string) => {
    setMateriais(materiais.filter((m) => m.id !== id));
  };

  const editarMaterial = (mat: MaterialItem) => {
    setMaterialEditando(mat);
    setMaterialEditadoForm({
      descricao: mat.descricao,
      detalhes: (mat as any).detalhes || "",
      quantidade: mat.quantidade.toString(),
      unidade: mat.unidade || "un",
      valorUnitario: mat.valorUnitario.toString(),
      lucroPercent: mat.lucroPercent ? mat.lucroPercent.toString() : "",
      frete: mat.frete ? mat.frete.toString() : "",
    });
    setShowEditarMaterial(true);
  };

  const salvarMaterialEditado = () => {
    if (!materialEditando) return;
    if (!materialEditadoForm.descricao || !materialEditadoForm.valorUnitario) {
      Alert.alert("Erro", "Preencha descrição e valor do material");
      return;
    }

    const materialAtualizado: MaterialItem = {
      ...materialEditando,
      descricao: materialEditadoForm.descricao,
      detalhes: materialEditadoForm.detalhes?.trim() || undefined,
      quantidade: parseFloat(materialEditadoForm.quantidade.replace(",", ".")) || 1,
      unidade: materialEditadoForm.unidade || "un",
      valorUnitario: parseFloat(materialEditadoForm.valorUnitario.replace(",", ".")) || 0,
      lucroPercent: materialEditadoForm.lucroPercent.trim()
        ? parseFloat(materialEditadoForm.lucroPercent.replace(",", ".")) || 0
        : 0,
      frete: materialEditadoForm.frete.trim()
        ? parseFloat(materialEditadoForm.frete.replace(",", ".")) || 0
        : 0,
    } as MaterialItem;

    setMateriais(materiais.map((m) => (m.id === materialEditando.id ? materialAtualizado : m)));
    setMaterialEditando(null);
    setShowEditarMaterial(false);
  };

  // ===== Edição de serviço durante o orçamento =====
  const editarServico = (item: ServicoItem) => {
    setServicoEditando(item);
    setServicoEditadoForm({
      descricao: item.descricao,
      detalhes: (item as any).detalhes || "",
      valor: String(item.valor).replace(".", ","),
      quantidade: String(item.quantidade || 1),
    });
    setShowEditarServico(true);
  };

  const salvarServicoEditado = () => {
    if (!servicoEditando) return;
    if (!servicoEditadoForm.descricao) {
      Alert.alert("Erro", "Preencha a descrição do serviço");
      return;
    }
    const valorNum = parseFloat(servicoEditadoForm.valor.replace(",", ".")) || 0;
    if (valorNum < 0) {
      Alert.alert("Erro", "Valor inválido");
      return;
    }
    const qtdNum = parseFloat(servicoEditadoForm.quantidade.replace(",", ".")) || 1;
    const atualizado: ServicoItem = {
      ...servicoEditando,
      descricao: servicoEditadoForm.descricao,
      detalhes: servicoEditadoForm.detalhes?.trim() || undefined,
      valor: valorNum,
      quantidade: qtdNum,
    } as ServicoItem;
    setItens(itens.map((i) => (i.id === servicoEditando.id ? atualizado : i)));
    setServicoEditando(null);
    setShowEditarServico(false);
  };

  // ===== Equipamentos do orçamento =====
  const addEquipamento = () => {
    const id = generateId();
    const novo: EquipamentoOS = {
      id,
      tipo: "",
      marca: "",
      modelo: "",
      serie: "",
      patrimonio: "",
      localizacao: "",
      problema: "",
      diagnostico: "",
      status: "orcamento_enviado",
    } as EquipamentoOS;
    setEquipamentos([...equipamentos, novo]);
    setEquipamentosExpandidos({ ...equipamentosExpandidos, [id]: true });
  };

  const updateEquipamento = (id: string, patch: Partial<EquipamentoOS>) => {
    setEquipamentos(equipamentos.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const toggleExpandidoEquip = (id: string) => {
    setEquipamentosExpandidos({ ...equipamentosExpandidos, [id]: !equipamentosExpandidos[id] });
  };

  const removeEquipamento = (id: string) => {
    Alert.alert("Remover equipamento", "Deseja remover este equipamento?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: () => setEquipamentos(equipamentos.filter((e) => e.id !== id)),
      },
    ]);
  };

  // Distribuição de gastos operacionais nos serviços
  const gastosAlocados = distribuirGastosOperacionais(itens, gastos);
  
  // Valor dos serviços com gastos operacionais diluídos
  const valorServicosComGastos = itens.reduce((sum, item, index) => {
    return sum + calcularValorServico(item) + (gastosAlocados[index] || 0);
  }, 0);
  
  const valorServicos = calcularTotalServicos(itens);
  const valorMateriais = calcularTotalMateriais(materiais);
  const valorGastos = calcularTotalGastosOperacionais(gastos);
  const valorMaoDeObra = cobrancaConfig?.subtotalMaoDeObra || 0;
  
  // Subtotal = serviços (com gastos diluídos) + materiais + mão de obra
  const valorSubtotal = valorServicosComGastos + valorMateriais + valorMaoDeObra;
  
  // Cálculo com desconto
  const { valorDesconto, valorTotal } = calcularValorComDesconto(valorSubtotal, desconto);

  const salvar = async () => {
    if (!clienteSelecionado) {
      Alert.alert("Erro", "Selecione um cliente");
      return;
    }
    if (itens.length === 0 && materiais.length === 0) {
      Alert.alert("Erro", "Adicione pelo menos um serviço ou material");
      return;
    }

    setIsSaving(true);
    try {
      const orcamento: Orcamento = {
        id: orcamentoInicial?.id || generateId(),
        numero: numero || orcamentoInicial?.numero || 0,
        clienteId: clienteSelecionado.id,
        clienteNome: clienteSelecionado.nome,
        itens,
        materiais,
        equipamentos,
        gastosOperacionais: gastos,
        desconto,
        valorSubtotal,
        valorDesconto,
        valorTotal,
        status: orcamentoInicial?.status || "enviado",
        observacoes,
        tecnicoResponsavel,
        criadoEm: orcamentoInicial?.criadoEm || new Date().toISOString(),
        statusPagamento: orcamentoInicial?.statusPagamento || "pendente",
        cobrancaMaoDeObra: cobrancaConfig,
        incluirServicosNoPDF: orcamentoInicial?.incluirServicosNoPDF ?? true,
        incluirMateriaisNoPDF: orcamentoInicial?.incluirMateriaisNoPDF ?? true,
      };

      await onSave(orcamento);
    } finally {
      setIsSaving(false);
    }
  };

  const aprovarECriarCobranca = async () => {
    if (!clienteSelecionado) {
      Alert.alert("Erro", "Selecione um cliente");
      return;
    }
    if (itens.length === 0 && materiais.length === 0) {
      Alert.alert("Erro", "Adicione pelo menos um servico ou material");
      return;
    }

    Alert.alert(
      "Aprovar Orcamento",
      "Deseja aprovar este orcamento e criar uma cobranca automaticamente?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Aprovar",
          onPress: async () => {
            setIsSaving(true);
            try {
              console.log('[DEBUG] Botao Aprovar pressionado');
              const orcamento: Orcamento = {
                id: orcamentoInicial?.id || generateId(),
                numero: numero || orcamentoInicial?.numero || 0,
                clienteId: clienteSelecionado.id,
                clienteNome: clienteSelecionado.nome,
                itens,
                materiais,
                equipamentos,
                gastosOperacionais: gastos,
                desconto,
                valorSubtotal,
                valorDesconto,
                valorTotal,
                status: "aprovado",
                observacoes,
                tecnicoResponsavel,
                criadoEm: orcamentoInicial?.criadoEm || new Date().toISOString(),
                statusPagamento: orcamentoInicial?.statusPagamento || "pendente",
                cobrancaMaoDeObra: cobrancaConfig,
                incluirServicosNoPDF: orcamentoInicial?.incluirServicosNoPDF ?? true,
                incluirMateriaisNoPDF: orcamentoInicial?.incluirMateriaisNoPDF ?? true,
              };
              console.log('[DEBUG ORCAMENTO] Salvando orcamento:', orcamento.id);
              await onSave(orcamento);
              console.log('[DEBUG ORCAMENTO] Criando cobranca com valor:', valorTotal);
              const novaCobranca = {
                clienteId: clienteSelecionado.id,
                clienteNome: clienteSelecionado.nome,
                descricao: `Cobranca do Orcamento #${numero || orcamentoInicial?.numero || 0}`,
                valorTotal: valorTotal,
                valorPendente: valorTotal,
                valorRecebido: 0,
                status: "pendente",
                dataCriacao: new Date().toISOString().split("T")[0],
                dataVencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                dataPagamento: undefined,
                formaPagamento: "",
                orcamentoId: orcamento.id,
              };
              console.log('[DEBUG ORCAMENTO] Objeto cobranca:', novaCobranca);
              await saveCobranca(novaCobranca);
              console.log('[DEBUG ORCAMENTO] Cobranca salva com sucesso');
              Alert.alert("Sucesso", "Orcamento aprovado e cobranca criada!");
            } catch (error) {
              console.error('[DEBUG] Erro ao aprovar:', error);
              const msg = error instanceof Error ? error.message : String(error);
              Alert.alert("Erro", msg);
            } finally {
              setIsSaving(false);
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        keyboardShouldPersistTaps="always"
        scrollEnabled={true}
      >
        {/* Título */}
        <Text className="text-foreground text-2xl font-bold mb-6">{titulo}</Text>

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
            <Pressable
              onPress={() => {
                setClienteSelecionado(null);
                setShowClienteList(true);
              }}
            >
              <MaterialIcons name="close" size={20} color={colors.muted} />
            </Pressable>
          </View>
        ) : (
          <View style={{ marginBottom: 16 }}>
            <TextInput
              value={searchCliente}
              onChangeText={(t) => {
                setSearchCliente(t);
                setShowClienteList(true);
              }}
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
                  marginTop: 8,
                  maxHeight: 200,
                }}
              >
                <ScrollView>
                  {filteredClientes.map((c) => (
                    <Pressable
                      key={c.id}
                      onPress={() => {
                        setClienteSelecionado(c);
                        setShowClienteList(false);
                        setSearchCliente("");
                      }}
                      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                    >
                      <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                        <Text className="text-foreground font-semibold">{c.nome}</Text>
                        <Text className="text-muted text-xs">{c.telefone}</Text>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {/* Técnico Responsável */}
        <Text className="text-muted text-xs font-semibold mb-2 ml-1">TÉCNICO RESPONSÁVEL</Text>
        <TextInput
          value={tecnicoResponsavel}
          onChangeText={setTecnicoResponsavel}
          placeholder="Nome do técnico"
          placeholderTextColor={colors.muted}
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            padding: 12,
            color: colors.foreground,
            marginBottom: 16,
          }}
        />

        {/* Equipamentos */}
        <Text className="text-foreground text-lg font-bold mb-3">Equipamentos</Text>
        {equipamentos.map((eq, idx) => {
          const expanded = equipamentosExpandidos[eq.id] !== false;
          const numero = String(idx + 1).padStart(2, "0");
          return (
            <View
              key={eq.id}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 12,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ color: "#fff", fontWeight: "800", fontSize: 12 }}>{numero}</Text>
                </View>
                <Text style={{ flex: 1, fontSize: 14, fontWeight: "700", color: colors.foreground }}>
                  {eq.tipo || `Equipamento ${numero}`}
                </Text>
                <Pressable onPress={() => toggleExpandidoEquip(eq.id)} hitSlop={6} testID={`equip-toggle-${eq.id}`}>
                  <MaterialIcons name={expanded ? "expand-less" : "expand-more"} size={22} color={colors.muted} />
                </Pressable>
                <Pressable onPress={() => removeEquipamento(eq.id)} hitSlop={6} testID={`equip-remove-${eq.id}`}>
                  <MaterialIcons name="delete-outline" size={20} color={colors.error} />
                </Pressable>
              </View>

              {expanded && (
                <View style={{ marginTop: 10 }}>
                  <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "600", marginBottom: 4 }}>Equipamento (tipo)</Text>
                  <TextInput
                    value={eq.tipo || ""}
                    onChangeText={(t) => updateEquipamento(eq.id, { tipo: t } as any)}
                    placeholder="Ex: Ar Condicionado Split, Geladeira"
                    placeholderTextColor={colors.muted}
                    style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: colors.foreground, fontSize: 14, marginBottom: 8 }}
                    testID={`equip-tipo-${eq.id}`}
                  />

                  <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "600", marginBottom: 4 }}>Marca</Text>
                      <TextInput
                        value={eq.marca}
                        onChangeText={(t) => updateEquipamento(eq.id, { marca: t })}
                        placeholder="Marca"
                        placeholderTextColor={colors.muted}
                        style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: colors.foreground, fontSize: 14 }}
                        testID={`equip-marca-${eq.id}`}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "600", marginBottom: 4 }}>Modelo</Text>
                      <TextInput
                        value={eq.modelo}
                        onChangeText={(t) => updateEquipamento(eq.id, { modelo: t })}
                        placeholder="Modelo"
                        placeholderTextColor={colors.muted}
                        style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: colors.foreground, fontSize: 14 }}
                        testID={`equip-modelo-${eq.id}`}
                      />
                    </View>
                  </View>

                  <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "600", marginBottom: 4 }}>Número de Série</Text>
                  <TextInput
                    value={eq.serie || ""}
                    onChangeText={(t) => updateEquipamento(eq.id, { serie: t })}
                    placeholder="Série"
                    placeholderTextColor={colors.muted}
                    style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: colors.foreground, fontSize: 14, marginBottom: 8 }}
                    testID={`equip-serie-${eq.id}`}
                  />

                  <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "600", marginBottom: 4 }}>Patrimônio (opcional)</Text>
                      <TextInput
                        value={eq.patrimonio || ""}
                        onChangeText={(t) => updateEquipamento(eq.id, { patrimonio: t })}
                        placeholder="Ex: PAT-001"
                        placeholderTextColor={colors.muted}
                        style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: colors.foreground, fontSize: 14 }}
                        testID={`equip-patrimonio-${eq.id}`}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "600", marginBottom: 4 }}>Localização (opcional)</Text>
                      <TextInput
                        value={eq.localizacao || ""}
                        onChangeText={(t) => updateEquipamento(eq.id, { localizacao: t })}
                        placeholder="Ex: Cozinha"
                        placeholderTextColor={colors.muted}
                        style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: colors.foreground, fontSize: 14 }}
                        testID={`equip-local-${eq.id}`}
                      />
                    </View>
                  </View>

                  <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "600", marginBottom: 4 }}>Problema Relatado</Text>
                  <TextInput
                    value={eq.problema}
                    onChangeText={(t) => updateEquipamento(eq.id, { problema: t })}
                    placeholder="Descreva o problema..."
                    placeholderTextColor={colors.muted}
                    multiline
                    style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: colors.foreground, fontSize: 14, minHeight: 60, textAlignVertical: "top", marginBottom: 8 }}
                    testID={`equip-problema-${eq.id}`}
                  />

                  <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "600", marginBottom: 4 }}>Diagnóstico</Text>
                  <TextInput
                    value={eq.diagnostico}
                    onChangeText={(t) => updateEquipamento(eq.id, { diagnostico: t })}
                    placeholder="Descreva o diagnóstico técnico..."
                    placeholderTextColor={colors.muted}
                    multiline
                    style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: colors.foreground, fontSize: 14, minHeight: 60, textAlignVertical: "top" }}
                    testID={`equip-diagnostico-${eq.id}`}
                  />
                </View>
              )}
            </View>
          );
        })}

        <Pressable
          onPress={addEquipamento}
          testID="add-equipamento-btn"
          style={({ pressed }) => [{
            borderWidth: 2,
            borderColor: colors.primary,
            borderStyle: "dashed",
            borderRadius: 12,
            paddingVertical: 14,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            backgroundColor: pressed ? colors.primary + "10" : "transparent",
            marginBottom: 16,
          }]}
        >
          <MaterialIcons name="add" size={20} color={colors.primary} />
          <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 14 }}>Adicionar Equipamento</Text>
        </Pressable>

        {/* Serviços */}
        <Text className="text-foreground text-lg font-bold mb-3">Serviços</Text>
        {itens.map((item, idx) => (
          <View
            key={item.id}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 10,
              padding: 12,
              marginBottom: 8,
              borderLeftWidth: 4,
              borderLeftColor: colors.primary,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1 }}>
                <Text className="text-foreground font-semibold">{item.descricao}</Text>
                {(item as any).detalhes ? (
                  <Text className="text-muted text-xs mt-1" numberOfLines={3}>{(item as any).detalhes}</Text>
                ) : null}
                <Text className="text-muted text-sm mt-1">R$ {item.valor.toFixed(2)}</Text>
                {gastosAlocados[idx] > 0 && (
                  <Text className="text-success text-xs mt-1">
                    + R$ {gastosAlocados[idx].toFixed(2)} (gasto diluído)
                  </Text>
                )}
              </View>
              <View style={{ flexDirection: "row", gap: 6 }}>
                <Pressable
                  onPress={() => editarServico(item)}
                  hitSlop={8}
                  style={{ padding: 4 }}
                  testID={`servico-editar-${item.id}`}
                >
                  <MaterialIcons name="edit" size={18} color={colors.primary} />
                </Pressable>
                <Pressable onPress={() => removeItem(item.id)} hitSlop={8} style={{ padding: 4 }}>
                  <MaterialIcons name="delete" size={20} color={colors.error} />
                </Pressable>
              </View>
            </View>
          </View>
        ))}

        {/* Adicionar Serviço */}
        <View style={{ marginBottom: 16 }}>
          <Text className="text-muted text-xs font-semibold mb-2 ml-1">NOVO SERVIÇO</Text>
          <TextInput
            value={novoItem.descricao}
            onChangeText={(t) => setNovoItem({ ...novoItem, descricao: t })}
            placeholder="Nome do serviço"
            placeholderTextColor={colors.muted}
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 10,
              padding: 12,
              color: colors.foreground,
              marginBottom: 8,
            }}
          />
          <TextInput
            value={novoItem.detalhes}
            onChangeText={(t) => setNovoItem({ ...novoItem, detalhes: t })}
            placeholder="Descrição técnica (opcional) — etapas, procedimentos, observações..."
            placeholderTextColor={colors.muted}
            multiline
            numberOfLines={3}
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 10,
              padding: 12,
              color: colors.foreground,
              marginBottom: 8,
              minHeight: 70,
              textAlignVertical: "top",
            }}
            testID="novo-servico-detalhes"
          />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable
              onPress={() => setModoServico(modoServico === "hh" ? "avulso" : "hh")}
              style={{
                backgroundColor: modoServico === "hh" ? colors.primary : colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                padding: 10,
                flex: 1,
              }}
            >
              <Text
                style={{
                  color: modoServico === "hh" ? "white" : colors.foreground,
                  textAlign: "center",
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                {modoServico === "hh" ? "HH" : "Avulso"}
              </Text>
            </Pressable>
            <TextInput
              value={modoServico === "hh" ? horasServico : valorAvulsoServico}
              onChangeText={(t) =>
                modoServico === "hh" ? setHorasServico(t) : setValorAvulsoServico(t)
              }
              placeholder={modoServico === "hh" ? "Horas" : "Valor"}
              placeholderTextColor={colors.muted}
              keyboardType="decimal-pad"
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                padding: 12,
                color: colors.foreground,
                flex: 2,
              }}
            />
            <Pressable
              onPress={addItem}
              style={({ pressed }) => [
                {
                  backgroundColor: colors.primary,
                  borderRadius: 10,
                  padding: 12,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <MaterialIcons name="add" size={20} color="white" />
            </Pressable>
          </View>
        </View>

        {/* Materiais */}
        <Text className="text-foreground text-lg font-bold mb-3">Materiais</Text>
        {materiais.map((mat) => (
          <View
            key={mat.id}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 10,
              padding: 12,
              marginBottom: 8,
              borderLeftWidth: 4,
              borderLeftColor: colors.success,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1 }}>
                <Text className="text-foreground font-semibold">{mat.descricao}</Text>
                <Text className="text-muted text-sm mt-1">
                  {mat.quantidade} {mat.unidade || "un"} × R$ {mat.valorUnitario.toFixed(2)}
                </Text>
                <Text className="text-success text-sm mt-1">
                  Cliente: R$ {calcularValorMaterial(mat).toFixed(2)}
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Pressable onPress={() => editarMaterial(mat)}>
                  <MaterialIcons name="edit" size={20} color={colors.primary} />
                </Pressable>
                <Pressable onPress={() => removeMaterial(mat.id)}>
                  <MaterialIcons name="delete" size={20} color={colors.error} />
                </Pressable>
              </View>
            </View>
          </View>
        ))}

        {/* Adicionar Material */}
        <View style={{ marginBottom: 16 }}>
          <Text className="text-muted text-xs font-semibold mb-2 ml-1">NOVO MATERIAL</Text>

          {/* Descrição */}
          <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "600", marginBottom: 4, marginLeft: 2 }}>
            Nome do material
          </Text>
          <TextInput
            value={novoMaterial.descricao}
            onChangeText={(t) => setNovoMaterial({ ...novoMaterial, descricao: t })}
            placeholder="Ex: Cabo flexível, Parafuso, Tinta..."
            placeholderTextColor={colors.muted}
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 10,
              padding: 12,
              color: colors.foreground,
              marginBottom: 10,
            }}
            testID="novo-material-descricao"
          />

          {/* Detalhes opcional (multilinha) */}
          <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "600", marginBottom: 4, marginLeft: 2 }}>
            Descrição do material <Text style={{ color: colors.muted, fontWeight: "400" }}>(opcional)</Text>
          </Text>
          <TextInput
            value={novoMaterial.detalhes}
            onChangeText={(t) => setNovoMaterial({ ...novoMaterial, detalhes: t })}
            placeholder="Marca, especificações técnicas, observações..."
            placeholderTextColor={colors.muted}
            multiline
            numberOfLines={3}
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 10,
              padding: 12,
              color: colors.foreground,
              marginBottom: 10,
              minHeight: 70,
              textAlignVertical: "top",
            }}
            testID="novo-material-detalhes"
          />

          {/* Quantidade + Unidade */}
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "600", marginBottom: 4, marginLeft: 2 }}>
                Quantidade
              </Text>
              <TextInput
                value={novoMaterial.quantidade}
                onChangeText={(t) => setNovoMaterial({ ...novoMaterial, quantidade: t })}
                placeholder="Ex: 1, 2,5, 10"
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 10,
                  padding: 12,
                  color: colors.foreground,
                }}
                testID="novo-material-quantidade"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "600", marginBottom: 4, marginLeft: 2 }}>
                Unidade
              </Text>
              <UnidadeSelector
                value={novoMaterial.unidade}
                onChange={(u) => setNovoMaterial({ ...novoMaterial, unidade: u })}
                colors={colors}
              />
            </View>
          </View>

          {/* Valor unitário */}
          <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "600", marginBottom: 4, marginLeft: 2 }}>
            Valor unitário (R$)
          </Text>
          <TextInput
            value={novoMaterial.valorUnitario}
            onChangeText={(t) => setNovoMaterial({ ...novoMaterial, valorUnitario: t })}
            placeholder="Ex: 15,90"
            placeholderTextColor={colors.muted}
            keyboardType="decimal-pad"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 10,
              padding: 12,
              color: colors.foreground,
              marginBottom: 10,
            }}
            testID="novo-material-valor"
          />

          {/* Lucro % + Frete (opcionais) */}
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 10, alignItems: "flex-end" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "600", marginBottom: 4, marginLeft: 2 }}>
                Lucro % (opcional)
              </Text>
              <TextInput
                value={novoMaterial.lucroPercent}
                onChangeText={(t) => setNovoMaterial({ ...novoMaterial, lucroPercent: t })}
                placeholder="0"
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 10,
                  padding: 12,
                  color: colors.foreground,
                }}
                testID="novo-material-lucro"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "600", marginBottom: 4, marginLeft: 2 }}>
                Frete R$ (opcional)
              </Text>
              <TextInput
                value={novoMaterial.frete}
                onChangeText={(t) => setNovoMaterial({ ...novoMaterial, frete: t })}
                placeholder="0,00"
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 10,
                  padding: 12,
                  color: colors.foreground,
                }}
                testID="novo-material-frete"
              />
            </View>
            <Pressable
              onPress={addMaterial}
              testID="adicionar-material-btn"
              style={({ pressed }) => [
                {
                  backgroundColor: colors.primary,
                  borderRadius: 10,
                  paddingHorizontal: 14,
                  height: 46,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <MaterialIcons name="add" size={22} color="white" />
            </Pressable>
          </View>
        </View>

        {/* Gastos Operacionais */}
        <Text className="text-foreground text-lg font-bold mb-3">Gastos Operacionais</Text>
        <View style={{ marginBottom: 16 }}>
          <Text className="text-muted text-xs font-semibold mb-2 ml-1">TRANSPORTE</Text>
          <TextInput
            value={gastos.transporte.toString()}
            onChangeText={(t) => setGastos({ ...gastos, transporte: parseFloat(t) || 0 })}
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
              marginBottom: 8,
            }}
          />
          <Text className="text-muted text-xs font-semibold mb-2 ml-1">ALIMENTAÇÃO</Text>
          <TextInput
            value={gastos.alimentacao.toString()}
            onChangeText={(t) => setGastos({ ...gastos, alimentacao: parseFloat(t) || 0 })}
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
              marginBottom: 8,
            }}
          />
          <Text className="text-muted text-xs font-semibold mb-2 ml-1">HOSPEDAGEM</Text>
          <TextInput
            value={gastos.hospedagem.toString()}
            onChangeText={(t) => setGastos({ ...gastos, hospedagem: parseFloat(t) || 0 })}
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
              marginBottom: 8,
            }}
          />
          <Text className="text-muted text-xs font-semibold mb-2 ml-1">OUTROS</Text>
          <TextInput
            value={gastos.outros.toString()}
            onChangeText={(t) => setGastos({ ...gastos, outros: parseFloat(t) || 0 })}
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
              marginBottom: 8,
            }}
          />
          {gastos.descricaoOutros && (
            <>
              <Text className="text-muted text-xs font-semibold mb-2 ml-1">DESCRIÇÃO OUTROS</Text>
              <TextInput
                value={gastos.descricaoOutros}
                onChangeText={(t) => setGastos({ ...gastos, descricaoOutros: t })}
                placeholder="Descreva os outros gastos"
                placeholderTextColor={colors.muted}
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 10,
                  padding: 12,
                  color: colors.foreground,
                  marginBottom: 8,
                }}
              />
            </>
          )}
        </View>

        {/* Desconto */}
        <DescontoSelector
          desconto={desconto}
          onDescontoChange={setDesconto}
          subtotal={valorSubtotal}
        />

        {/* Observações */}
        <Text className="text-muted text-xs font-semibold mb-2 ml-1">OBSERVAÇÕES</Text>
        <TextInput
          value={observacoes}
          onChangeText={setObservacoes}
          placeholder="Observações adicionais"
          placeholderTextColor={colors.muted}
          multiline
          numberOfLines={4}
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            padding: 12,
            color: colors.foreground,
            marginBottom: 16,
            textAlignVertical: "top",
          }}
        />

        {/* Resumo */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 10,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text className="text-foreground font-bold mb-3">RESUMO</Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
            <Text className="text-muted">Serviços (com custos operacionais):</Text>
            <Text className="text-foreground font-semibold">R$ {valorServicosComGastos.toFixed(2)}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
            <Text className="text-muted">Materiais:</Text>
            <Text className="text-foreground font-semibold">R$ {valorMateriais.toFixed(2)}</Text>
          </View>
          {valorMaoDeObra > 0 && (
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
              <Text className="text-muted">Mão de Obra:</Text>
              <Text className="text-foreground font-semibold">R$ {valorMaoDeObra.toFixed(2)}</Text>
            </View>
          )}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingTop: 8,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              marginBottom: 8,
            }}
          >
            <Text className="text-foreground font-semibold">Subtotal:</Text>
            <Text className="text-foreground font-semibold">R$ {valorSubtotal.toFixed(2)}</Text>
          </View>
          {valorDesconto > 0 && (
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
              <Text className="text-success font-semibold">Desconto:</Text>
              <Text className="text-success font-semibold">- R$ {valorDesconto.toFixed(2)}</Text>
            </View>
          )}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingTop: 8,
              borderTopWidth: 2,
              borderTopColor: colors.primary,
            }}
          >
            <Text className="text-foreground font-bold">TOTAL FINAL:</Text>
            <Text className="text-primary font-bold text-lg">R$ {valorTotal.toFixed(2)}</Text>
          </View>
        </View>

        {/* Botões */}
        <View style={{ flexDirection: "column", gap: 8 }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [
                {
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 10,
                  padding: 14,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text className="text-foreground text-center font-semibold">Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={salvar}
              disabled={isSaving}
              style={({ pressed }) => [
                {
                  flex: 1,
                  backgroundColor: colors.primary,
                  borderRadius: 10,
                  padding: 14,
                  opacity: pressed || isSaving ? 0.7 : 1,
                },
              ]}
            >
              <Text className="text-white text-center font-semibold">
                {isSaving ? "Salvando..." : "Salvar"}
              </Text>
            </Pressable>
          </View>
          <Pressable
            onPress={aprovarECriarCobranca}
            disabled={isSaving}
            style={({ pressed }) => [
              {
                backgroundColor: colors.success,
                borderRadius: 10,
                padding: 14,
                opacity: pressed || isSaving ? 0.7 : 1,
              },
            ]}
          >
            <Text className="text-white text-center font-semibold">
              {isSaving ? "Processando..." : "Aprovar e Criar Cobranca"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Modal: Editar Serviço */}
      <Modal visible={showEditarServico} animationType="slide" transparent onRequestClose={() => setShowEditarServico(false)}>
        <Pressable
          onPress={() => setShowEditarServico(false)}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{ backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, paddingBottom: 18 + insets.bottom, maxHeight: "90%" }}
          >
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={{ color: colors.foreground, fontWeight: "900", fontSize: 16, marginBottom: 14 }}>Editar Serviço</Text>

              <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "700", marginBottom: 4 }}>Nome do serviço *</Text>
              <TextInput
                value={servicoEditadoForm.descricao}
                onChangeText={(t) => setServicoEditadoForm({ ...servicoEditadoForm, descricao: t })}
                placeholder="Nome do serviço"
                placeholderTextColor={colors.muted}
                style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, color: colors.foreground, marginBottom: 10 }}
                testID="edit-servico-descricao"
              />

              <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "700", marginBottom: 4 }}>Descrição (opcional)</Text>
              <TextInput
                value={servicoEditadoForm.detalhes}
                onChangeText={(t) => setServicoEditadoForm({ ...servicoEditadoForm, detalhes: t })}
                placeholder="Detalhes técnicos, etapas, procedimentos..."
                placeholderTextColor={colors.muted}
                multiline
                style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, color: colors.foreground, marginBottom: 10, minHeight: 70, textAlignVertical: "top" }}
                testID="edit-servico-detalhes"
              />

              <View style={{ flexDirection: "row", gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "700", marginBottom: 4 }}>Valor (R$) *</Text>
                  <TextInput
                    value={servicoEditadoForm.valor}
                    onChangeText={(t) => setServicoEditadoForm({ ...servicoEditadoForm, valor: t })}
                    placeholder="0,00"
                    placeholderTextColor={colors.muted}
                    keyboardType="decimal-pad"
                    style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, color: colors.foreground }}
                    testID="edit-servico-valor"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "700", marginBottom: 4 }}>Quantidade</Text>
                  <TextInput
                    value={servicoEditadoForm.quantidade}
                    onChangeText={(t) => setServicoEditadoForm({ ...servicoEditadoForm, quantidade: t })}
                    placeholder="1"
                    placeholderTextColor={colors.muted}
                    keyboardType="decimal-pad"
                    style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, color: colors.foreground }}
                    testID="edit-servico-quantidade"
                  />
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
                <Pressable
                  onPress={() => setShowEditarServico(false)}
                  style={{ flex: 1, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, alignItems: "center" }}
                >
                  <Text style={{ color: colors.foreground, fontWeight: "700" }}>Cancelar</Text>
                </Pressable>
                <Pressable
                  onPress={salvarServicoEditado}
                  testID="edit-servico-salvar"
                  style={{ flex: 1, backgroundColor: colors.primary, borderRadius: 10, padding: 12, alignItems: "center" }}
                >
                  <Text style={{ color: "#fff", fontWeight: "800" }}>Salvar</Text>
                </Pressable>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal: Editar Material */}
      <Modal visible={showEditarMaterial} animationType="slide" transparent onRequestClose={() => setShowEditarMaterial(false)}>
        <Pressable
          onPress={() => setShowEditarMaterial(false)}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{ backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, paddingBottom: 18 + insets.bottom, maxHeight: "90%" }}
          >
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={{ color: colors.foreground, fontWeight: "900", fontSize: 16, marginBottom: 14 }}>Editar Material</Text>

              <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "700", marginBottom: 4 }}>Nome do material *</Text>
              <TextInput
                value={materialEditadoForm.descricao}
                onChangeText={(t) => setMaterialEditadoForm({ ...materialEditadoForm, descricao: t })}
                placeholder="Nome do material"
                placeholderTextColor={colors.muted}
                style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, color: colors.foreground, marginBottom: 10 }}
                testID="edit-material-descricao"
              />

              <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "700", marginBottom: 4 }}>Descrição (opcional)</Text>
              <TextInput
                value={materialEditadoForm.detalhes}
                onChangeText={(t) => setMaterialEditadoForm({ ...materialEditadoForm, detalhes: t })}
                placeholder="Marca, especificações, observações..."
                placeholderTextColor={colors.muted}
                multiline
                style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, color: colors.foreground, marginBottom: 10, minHeight: 70, textAlignVertical: "top" }}
                testID="edit-material-detalhes"
              />

              <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "700", marginBottom: 4 }}>Quantidade</Text>
                  <TextInput
                    value={materialEditadoForm.quantidade}
                    onChangeText={(t) => setMaterialEditadoForm({ ...materialEditadoForm, quantidade: t })}
                    placeholder="1"
                    placeholderTextColor={colors.muted}
                    keyboardType="decimal-pad"
                    style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, color: colors.foreground }}
                    testID="edit-material-quantidade"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "700", marginBottom: 4 }}>Unidade</Text>
                  <UnidadeSelector
                    value={materialEditadoForm.unidade}
                    onChange={(u) => setMaterialEditadoForm({ ...materialEditadoForm, unidade: u })}
                    colors={colors}
                  />
                </View>
              </View>

              <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "700", marginBottom: 4 }}>Valor unitário (R$) *</Text>
              <TextInput
                value={materialEditadoForm.valorUnitario}
                onChangeText={(t) => setMaterialEditadoForm({ ...materialEditadoForm, valorUnitario: t })}
                placeholder="0,00"
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
                style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, color: colors.foreground, marginBottom: 10 }}
                testID="edit-material-valor"
              />

              <View style={{ flexDirection: "row", gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "700", marginBottom: 4 }}>Lucro % (opcional)</Text>
                  <TextInput
                    value={materialEditadoForm.lucroPercent}
                    onChangeText={(t) => setMaterialEditadoForm({ ...materialEditadoForm, lucroPercent: t })}
                    placeholder="0"
                    placeholderTextColor={colors.muted}
                    keyboardType="decimal-pad"
                    style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, color: colors.foreground }}
                    testID="edit-material-lucro"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "700", marginBottom: 4 }}>Frete R$ (opcional)</Text>
                  <TextInput
                    value={materialEditadoForm.frete}
                    onChangeText={(t) => setMaterialEditadoForm({ ...materialEditadoForm, frete: t })}
                    placeholder="0,00"
                    placeholderTextColor={colors.muted}
                    keyboardType="decimal-pad"
                    style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, color: colors.foreground }}
                    testID="edit-material-frete"
                  />
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
                <Pressable
                  onPress={() => setShowEditarMaterial(false)}
                  style={{ flex: 1, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, alignItems: "center" }}
                >
                  <Text style={{ color: colors.foreground, fontWeight: "700" }}>Cancelar</Text>
                </Pressable>
                <Pressable
                  onPress={salvarMaterialEditado}
                  testID="edit-material-salvar"
                  style={{ flex: 1, backgroundColor: colors.primary, borderRadius: 10, padding: 12, alignItems: "center" }}
                >
                  <Text style={{ color: "#fff", fontWeight: "800" }}>Salvar</Text>
                </Pressable>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}
